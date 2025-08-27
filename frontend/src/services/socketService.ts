import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";

interface MessageData {
  conversationId: string;
  content: string;
  type: "text" | "image";
  imageUrl?: string;
}

interface TypingData {
  conversationId: string;
  userId: string;
  userName: string;
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private serverPath =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  connect() {
    // Don't create new connection if already connected
    if (this.socket && this.socket.connected) {
      console.log("Socket already connected, skipping...");
      return;
    }

    const token = this.getToken();
    if (!token) {
      console.warn("No auth token available for socket connection");
      return;
    }

    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    console.log("Attempting to connect to:", this.serverPath);
    console.log("Token length:", token.length);
    console.log("Token starts with:", token.substring(0, 20) + "...");

    this.socket = io(this.serverPath, {
      auth: {
        token
      },
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: false, // Disable auto-reconnection to prevent loops
      forceNew: true
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Connected to server");
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected from server:", reason);

      // Don't auto-reconnect for client disconnects or transport close
      if (reason === "io server disconnect" || reason === "ping timeout") {
        this.handleReconnect();
      }
      // For other reasons like "io client disconnect" or "transport close", don't reconnect
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      this.handleReconnect();
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && !this.socket?.connected) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      console.log(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

      setTimeout(() => {
        const token = this.getToken();
        if (token && !this.socket?.connected) {
          // Disconnect existing socket first to prevent multiple connections
          if (this.socket) {
            this.socket.disconnect();
          }
          this.connect();
        }
      }, delay);
    }
  }

  // Message events
  sendMessage(data: MessageData) {
    console.log('Sending message via socket:', data);
    if (!this.socket) {
      console.error('No socket connection available for sending message');
      return;
    }
    if (!this.socket.connected) {
      console.error('Socket not connected, cannot send message');
      return;
    }
    this.socket.emit("send_message", data);
  }

  onMessageReceived(callback: (data: any) => void) {
    this.socket?.on("message_received", callback);
  }

  offMessageReceived(callback: (data: any) => void) {
    this.socket?.off("message_received", callback);
  }

  // Typing events
  startTyping(data: TypingData) {
    this.socket?.emit("typing_start", data);
  }

  stopTyping(data: TypingData) {
    this.socket?.emit("typing_stop", data);
  }

  onUserTyping(callback: (data: any) => void) {
    this.socket?.on("user_typing", callback);
  }

  offUserTyping(callback: (data: any) => void) {
    this.socket?.off("user_typing", callback);
  }

  // Online status events
  onUserStatus(callback: (data: { userId: string; status: 'online' | 'offline'; timestamp: Date }) => void) {
    this.socket?.on("user_status", callback);
  }

  offUserStatus(callback: (data: any) => void) {
    this.socket?.off("user_status", callback);
  }

  // Conversation events
  joinConversation(conversationId: string) {
    this.socket?.emit("join_conversation", conversationId);
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit("leave_conversation", conversationId);
  }

  // Message status events
  markAsRead(conversationId: string, messageId: string) {
    this.socket?.emit("mark_as_read", { conversationId, messageId });
  }

  onMessageRead(callback: (data: any) => void) {
    this.socket?.on("message_read", callback);
  }

  offMessageRead(callback: (data: any) => void) {
    this.socket?.off("message_read", callback);
  }

  onMessageStatusUpdated(callback: (data: any) => void) {
    this.socket?.on("message_status_updated", callback);
  }

  offMessageStatusUpdated(callback: (data: any) => void) {
    this.socket?.off("message_status_updated", callback);
  }



  // Notification events
  onNotification(callback: (data: any) => void) {
    this.socket?.on("notification", callback);
  }

  offNotification(callback: (data: any) => void) {
    this.socket?.off("notification", callback);
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // Clean up all listeners
  removeAllListeners() {
    this.socket?.removeAllListeners();
  }

  private getToken(): string | null {
    // Try to get token from auth store
    if (typeof window !== "undefined") {
      const authData = localStorage.getItem("auth-storage");
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          return parsed.state?.token || null;
        } catch (error) {
          console.error("Error parsing auth data:", error);
        }
      }
    }
    return null;
  }
}

// Create singleton instance
export const socketService = new SocketService();

// Hook for React components
export const useSocket = () => {
  try {
    const { token, user } = useAuthStore();

    const connect = () => {
      if (token && user && token.trim() !== "") {
        // Only connect if not already connected
        if (!socketService.isConnected()) {
          console.log(
            "Connecting socket with token:",
            token.substring(0, 10) + "..."
          );
          socketService.connect();
        } else {
          console.log("Socket already connected, skipping connection");
        }
      } else {
        console.log("No valid token for socket connection");
      }
    };

    const disconnect = () => {
      socketService.disconnect();
    };

    return {
      connect,
      disconnect,
      socket: socketService,
      isConnected: socketService.isConnected()
    };
  } catch (error) {
    console.error("Error in useSocket hook:", error);
    return {
      connect: () => {},
      disconnect: () => {},
      socket: socketService,
      isConnected: false
    };
  }
};

export default socketService;
