import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../utils/jwt';
import { User, IUser } from '../models/User';
import { logger } from '../index';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = JWTService.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
      return;
    }

    // Verify token
    const payload = JWTService.verifyAccessToken(token);
    
    // Find user
    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Attach user to request with string _id
    req.user = {
      ...user.toObject(),
      _id: user._id.toString()
    } as any;
    req.userId = user._id.toString();
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Authentication failed'
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if no token
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = JWTService.extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const payload = JWTService.verifyAccessToken(token);
      const user = await User.findById(payload.userId);
      
      if (user) {
        req.user = {
          ...user.toObject(),
          _id: user._id.toString()
        } as any;
        req.userId = user._id.toString();
      }
    }
    
    next();
  } catch (error) {
    // Log error but don't fail the request
    logger.warn('Optional auth failed:', error);
    next();
  }
};
