import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { User } from "../models/User";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { logger } from "../utils/logger";
import { JWTService } from "../utils/jwt";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

interface TypingData {
  conversationId: string;
  userId: string;
  userName: string;
}

interface MessageData {
  conversationId: string;
  content: string;
  type: "text" | "image";
  imageUrl?: string;
}

export class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private typingUsers: Map<string, Set<string>> = new Map(); // conversationId -> Set of userIds

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        logger.info(`Socket connection attempt from ${socket.id}`);
        logger.info(`Token received: ${token ? 'YES' : 'NO'}`);
        
        if (!token) {
          logger.warn("Socket connection attempt without token");
          return next(new Error("Authentication token required"));
        }

        logger.info(`Token length: ${token.length}`);
        logger.info(`Token starts with: ${token.substring(0, 20)}...`);

        const decoded = JWTService.verifyAccessToken(token);
        logger.info(`Token decoded successfully:`, { userId: decoded?.userId });
        
        if (!decoded || !decoded.userId) {
          logger.warn("Invalid token in socket connection - no userId in decoded token");
          return next(new Error("Invalid authentication token"));
        }

        // Find user
        const user = await User.findById(decoded.userId);
        if (!user) {
          logger.warn(
            `User not found for socket connection: ${decoded.userId}`
          );
          return next(new Error("User not found"));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        logger.info(`Socket authenticated successfully for user: ${user.email}`);
        next();
      } catch (error) {
        logger.error("Socket authentication error:", error);
        logger.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        next(new Error("Authentication failed"));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      logger.info(`User connected: ${socket.user?.email} (${socket.id})`);

      // Store user connection
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);
        this.broadcastUserStatus(socket.userId, "online");
      }

      // Join user to their conversations
      this.joinUserConversations(socket);

      // Event handlers
      socket.on("join_conversation", (conversationId: string) => {
        this.handleJoinConversation(socket, conversationId);
      });

      socket.on("send_message", (data: MessageData) => {
        this.handleSendMessage(socket, data);
      });

      socket.on("typing_start", (data: TypingData) => {
        this.handleTypingStart(socket, data);
      });

      socket.on("typing_stop", (data: TypingData) => {
        this.handleTypingStop(socket, data);
      });

      socket.on(
        "mark_as_read",
        (data: { conversationId: string; messageId: string }) => {
          this.handleMarkAsRead(socket, data);
        }
      );

      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async joinUserConversations(socket: AuthenticatedSocket) {
    try {
      if (!socket.userId) return;

      const conversations = await Conversation.find({
        participants: socket.userId
      });

      conversations.forEach((conversation) => {
        socket.join(conversation._id.toString());
      });

      logger.info(
        `User ${socket.user?.email} joined ${conversations.length} conversations`
      );
    } catch (error) {
      logger.error("Error joining user conversations:", error);
    }
  }

  private handleJoinConversation(
    socket: AuthenticatedSocket,
    conversationId: string
  ) {
    socket.join(conversationId);
    logger.info(
      `User ${socket.user?.email} joined conversation: ${conversationId}`
    );
  }

  private async handleSendMessage(
    socket: AuthenticatedSocket,
    data: MessageData
  ) {
    try {
      logger.info("Received send_message event:", {
        userId: socket.userId,
        userEmail: socket.user?.email,
        messageData: data
      });
      
      if (!socket.userId) {
        logger.error("No userId in socket for send_message");
        return;
      }

      // Verify user is part of the conversation
      const conversation = await Conversation.findOne({
        _id: data.conversationId,
        participants: socket.userId
      });

      if (!conversation) {
        socket.emit("error", {
          message: "Conversation not found or access denied"
        });
        return;
      }

      // Create new message
      const messageData: any = {
        conversationId: data.conversationId,
        senderId: socket.userId,
        type: data.type,
        status: "sent"
      };
      
      // Add text or image based on type
      if (data.type === 'text' && data.content) {
        messageData.text = data.content;
      } else if (data.type === 'image' && data.imageUrl) {
        messageData.image = { url: data.imageUrl };
      } else {
        socket.emit("error", {
          message: "Invalid message data",
          details: "Message must have content for text or imageUrl for image"
        });
        return;
      }
      
      const message = new Message(messageData);

      await message.save();

      // Update conversation's last message
      conversation.lastMessage = message._id;
      conversation.lastMessageAt = new Date();
      await conversation.save();

      // Populate sender info
      await message.populate("senderId", "name email avatarUrl");

      // Emit to all participants in the conversation
      this.io.to(data.conversationId).emit("message_received", {
        message: message.toJSON(),
        conversationId: data.conversationId
      });

      // Update message status to delivered for online users
      this.updateMessageStatus(
        message._id.toString(),
        "delivered",
        data.conversationId
      );

      logger.info(
        `Message sent in conversation ${data.conversationId} by ${socket.user?.email}`
      );
    } catch (error) {
      logger.error("Error sending message:", {
        error: error.message,
        stack: error.stack,
        conversationId: data.conversationId,
        userId: socket.userId,
        messageData: data
      });
      socket.emit("error", { 
        message: "Failed to send message",
        details: error.message 
      });
    }
  }

  private handleTypingStart(socket: AuthenticatedSocket, data: TypingData) {
    if (!socket.userId) return;

    if (!this.typingUsers.has(data.conversationId)) {
      this.typingUsers.set(data.conversationId, new Set());
    }

    this.typingUsers.get(data.conversationId)!.add(socket.userId);

    // Broadcast to other users in the conversation
    socket.to(data.conversationId).emit("user_typing", {
      userId: socket.userId,
      userName: data.userName,
      conversationId: data.conversationId,
      isTyping: true
    });
  }

  private handleTypingStop(socket: AuthenticatedSocket, data: TypingData) {
    if (!socket.userId) return;

    const typingSet = this.typingUsers.get(data.conversationId);
    if (typingSet) {
      typingSet.delete(socket.userId);
      if (typingSet.size === 0) {
        this.typingUsers.delete(data.conversationId);
      }
    }

    // Broadcast to other users in the conversation
    socket.to(data.conversationId).emit("user_typing", {
      userId: socket.userId,
      userName: data.userName,
      conversationId: data.conversationId,
      isTyping: false
    });
  }

  private async handleMarkAsRead(
    socket: AuthenticatedSocket,
    data: { conversationId: string; messageId: string }
  ) {
    try {
      if (!socket.userId) return;

      await Message.findByIdAndUpdate(data.messageId, {
        status: "read",
        readAt: new Date()
      });

      // Broadcast read status to sender
      socket.to(data.conversationId).emit("message_read", {
        messageId: data.messageId,
        readBy: socket.userId,
        conversationId: data.conversationId
      });

      logger.info(
        `Message ${data.messageId} marked as read by ${socket.user?.email}`
      );
    } catch (error) {
      logger.error("Error marking message as read:", error);
    }
  }

  private handleDisconnect(socket: AuthenticatedSocket) {
    logger.info(`User disconnected: ${socket.user?.email} (${socket.id})`);

    if (socket.userId) {
      this.connectedUsers.delete(socket.userId);
      this.broadcastUserStatus(socket.userId, "offline");

      // Clean up typing status
      this.typingUsers.forEach((typingSet, conversationId) => {
        if (typingSet.has(socket.userId!)) {
          typingSet.delete(socket.userId!);
          socket.to(conversationId).emit("user_typing", {
            userId: socket.userId,
            userName: socket.user?.name,
            conversationId,
            isTyping: false
          });
        }
      });
    }
  }

  private broadcastUserStatus(userId: string, status: "online" | "offline") {
    this.io.emit("user_status", {
      userId,
      status,
      timestamp: new Date()
    });
  }

  private async updateMessageStatus(
    messageId: string,
    status: "delivered" | "read",
    conversationId: string
  ) {
    try {
      await Message.findByIdAndUpdate(messageId, { status });

      this.io.to(conversationId).emit("message_status_updated", {
        messageId,
        status,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error("Error updating message status:", error);
    }
  }

  // Public methods for external use
  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public sendNotificationToUser(userId: string, notification: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit("notification", notification);
    }
  }
}

export default SocketService;
