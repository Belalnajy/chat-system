import { Request, Response } from 'express';
import { Message } from '../models/Message';
import { Conversation } from '../models/Conversation';
import { AuthRequest } from '../types';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('يُسمح فقط بملفات الصور'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Send a new message
export const sendMessage = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;
    const { conversationId, text } = req.body;
    const imageFile = req.file;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'معرف المحادثة مطلوب'
      });
    }

    // Check if user is participant in the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'المحادثة غير موجودة أو غير مصرح لك بالوصول إليها'
      });
    }

    // Validate message content
    if (!text && !imageFile) {
      return res.status(400).json({
        success: false,
        message: 'يجب أن تحتوي الرسالة على نص أو صورة'
      });
    }

    // Create message object
    const messageData: any = {
      conversationId,
      senderId: userId,
      type: imageFile ? 'image' : 'text',
      status: 'sent'
    };

    if (text) {
      messageData.text = text.trim();
    }

    if (imageFile) {
      messageData.image = {
        url: `/uploads/images/${imageFile.filename}`,
        filename: imageFile.originalname,
        size: imageFile.size
      };
    }

    // Create and save message
    const message = new Message(messageData);
    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    
    // Increment unread count for other participants
    conversation.participants.forEach((participantId: any) => {
      if (participantId.toString() !== userId) {
        const currentCount = conversation.unreadCount.get(participantId.toString()) || 0;
        conversation.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });

    await conversation.save();

    // Populate sender info before sending response
    await message.populate('senderId', 'name avatarUrl');

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في إرسال الرسالة'
    });
  }
};

// Get message by ID
export const getMessage = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId)
      .populate('senderId', 'name avatarUrl')
      .populate('conversationId');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'الرسالة غير موجودة'
      });
    }

    // Check if user is participant in the conversation
    const conversation = await Conversation.findOne({
      _id: message.conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بالوصول لهذه الرسالة'
      });
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب الرسالة'
    });
  }
};

// Update message status (delivered/read)
export const updateMessageStatus = async (req: any, res: Response) => {
  try {
    const userId = req.user?._id;
    const { messageId } = req.params;
    const { status } = req.body;

    if (!['delivered', 'read'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة الرسالة غير صحيحة'
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'الرسالة غير موجودة'
      });
    }

    // Check if user is participant in the conversation
    const conversation = await Conversation.findOne({
      _id: message.conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بتحديث هذه الرسالة'
      });
    }

    // Only allow updating status if user is not the sender
    if (message.senderId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تحديث حالة رسالتك الخاصة'
      });
    }

    // Update message status
    message.status = status;
    if (status === 'delivered') {
      message.deliveredAt = new Date();
    } else if (status === 'read') {
      message.readAt = new Date();
      if (!message.deliveredAt) {
        message.deliveredAt = new Date();
      }
    }

    await message.save();

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Update message status error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في تحديث حالة الرسالة'
    });
  }
};
