import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import { validate, userSchemas } from '../middleware/validation';
import {
  getConversations,
  createConversation,
  getConversationById,
  getConversationMessages,
  markMessagesAsRead
} from '../controllers/conversationsController';
import { AuthRequest } from '../types';

const router = express.Router();

// Rate limiting
const conversationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح من الطلبات، حاول مرة أخرى لاحقاً'
  }
});

const createConversationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 conversation creations per windowMs
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح من إنشاء المحادثات، حاول مرة أخرى لاحقاً'
  }
});

// Apply authentication to all routes
router.use(authenticate);

// GET /api/conversations - Get all conversations for current user
router.get('/', conversationLimiter, getConversations as any);

// POST /api/conversations - Create a new conversation
router.post('/', 
  createConversationLimiter,
  validate(userSchemas.createConversation),
  createConversation as any
);

// GET /api/conversations/:conversationId - Get a specific conversation
router.get('/:conversationId', 
  conversationLimiter,
  getConversationById as any
);

// GET /api/conversations/:conversationId/messages - Get messages for a conversation
router.get('/:conversationId/messages', 
  conversationLimiter,
  getConversationMessages as any
);

// PUT /api/conversations/:conversationId/read - Mark messages as read
router.put('/:conversationId/read', 
  conversationLimiter,
  markMessagesAsRead as any
);

export default router;
