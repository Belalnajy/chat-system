import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import { validate, userSchemas } from '../middleware/validation';
import {
  sendMessage,
  getMessage,
  updateMessageStatus,
  upload
} from '../controllers/messagesController';

const router = express.Router();

// Rate limiting
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 messages per minute
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح من الرسائل، حاول مرة أخرى لاحقاً'
  }
});

const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 image uploads per 5 minutes
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح من رفع الصور، حاول مرة أخرى لاحقاً'
  }
});

// Apply authentication to all routes
router.use(authenticate);

// POST /api/messages - Send a new message (text or image)
router.post('/', 
  messageLimiter,
  upload.single('image'), // Handle image upload
  validate(userSchemas.sendMessage),
  sendMessage
);

// GET /api/messages/:messageId - Get a specific message
router.get('/:messageId', getMessage);

// PUT /api/messages/:messageId/status - Update message status (delivered/read)
router.put('/:messageId/status', 
  validate(userSchemas.updateMessageStatus),
  updateMessageStatus
);

export default router;
