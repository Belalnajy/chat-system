import { Request, Response } from "express";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { User } from "../models/User";
import { AuthRequest } from "../types";

// Get all conversations for the current user
export const getConversations = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;

    const conversations = await Conversation.find({
      participants: userId
    })
      .populate("participants", "name email avatarUrl")
      .populate("lastMessage", "text type sentAt senderId")
      .sort({ lastMessageAt: -1 });

    // Get unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conversation._id,
          senderId: { $ne: userId },
          status: { $in: ['sent', 'delivered'] } // Not read
        });

        return {
          ...conversation.toJSON(),
          unreadCount
        };
      })
    );

    res.json({
      success: true,
      data: conversationsWithUnread
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      success: false,
      message: "فشل في جلب المحادثات"
    });
  }
};

// Get a specific conversation by ID
export const getConversationById = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    }).populate("participants", "name email avatarUrl");

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "المحادثة غير موجودة أو غير مصرح لك بالوصول إليها"
      });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error("Get conversation by ID error:", error);
    res.status(500).json({
      success: false,
      message: "فشل في جلب المحادثة"
    });
  }
};

// Create a new conversation
export const createConversation = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: "معرف المشارك مطلوب"
      });
    }

    if (participantId === userId) {
      return res.status(400).json({
        success: false,
        message: "لا يمكن إنشاء محادثة مع نفسك"
      });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "المستخدم غير موجود"
      });
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      participants: { $all: [userId, participantId] }
    }).populate("participants", "name email avatarUrl");

    if (existingConversation) {
      return res.json({
        success: true,
        data: existingConversation,
        message: "المحادثة موجودة بالفعل"
      });
    }

    // Create new conversation
    const conversation = new Conversation({
      participants: [userId, participantId]
    });

    await conversation.save();

    // Populate participants before sending response
    await conversation.populate("participants", "name email avatarUrl");

    res.status(201).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error("Create conversation error:", error);
    res.status(500).json({
      success: false,
      message: "فشل في إنشاء المحادثة"
    });
  }
};

// Get messages for a specific conversation
export const getConversationMessages = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if user is participant in the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "المحادثة غير موجودة أو غير مصرح لك بالوصول إليها"
      });
    }

    const messages = await Message.find({ conversationId })
      .populate("senderId", "name avatarUrl")
      .sort({ createdAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    // Reverse to show oldest first
    messages.reverse();

    res.json({
      success: true,
      data: {
        messages,
        conversation
      }
    });
  } catch (error) {
    console.error(
      "Get conversation messages error:",
      error instanceof Error ? error.message : error
    );
    res.status(500).json({
      success: false,
      message: "فشل في جلب الرسائل"
    });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;
    const { conversationId } = req.params;

    // Check if user is participant in the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "المحادثة غير موجودة"
      });
    }

    // Mark all unread messages as read
    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        status: { $in: ["sent", "delivered"] }
      },
      {
        status: "read",
        readAt: new Date()
      }
    );

    // Reset unread count for this user
    conversation.unreadCount.set(userId!, 0);
    await conversation.save();

    res.json({
      success: true,
      message: "تم تحديد الرسائل كمقروءة"
    });
  } catch (error) {
    console.error("Mark messages as read error:", error);
    res.status(500).json({
      success: false,
      message: "فشل في تحديد الرسائل كمقروءة"
    });
  }
};
