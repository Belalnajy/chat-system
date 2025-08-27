import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { searchUsers, updateProfile, getUserById } from '../controllers/usersController';
import { validate, userSchemas } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();

// Rate limiting for user endpoints
const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Search rate limiting (more reasonable)
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // limit each IP to 50 search requests per minute
  message: {
    success: false,
    message: 'Too many search requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// All routes require authentication
router.use(authenticate);

// User routes
router.get('/search', searchLimiter, searchUsers);
router.patch('/me', userLimiter, validate(userSchemas.updateProfile), updateProfile);
router.get('/:userId', userLimiter, getUserById);

export default router;
