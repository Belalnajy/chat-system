import { Request, Response } from 'express';
import { User } from '../models/User';
import { logger } from '../index';

/**
 * Search users by name or email
 */
export const searchUsers = async (req: any, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    const currentUserId = req.userId;
    
    console.log('Search request received:', {
      query: q,
      userId: currentUserId,
      headers: req.headers.authorization ? 'Token present' : 'No token'
    });

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
      return;
    }

    const searchQuery = q.trim();
    if (searchQuery.length < 2) {
      res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
      return;
    }

    // Search by name (text search) or email (regex)
    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, // Exclude current user
        {
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      ]
    })
    .select('_id name email avatarUrl')
    .limit(20)
    .sort({ name: 1 });

    res.json({
      success: true,
      data: users // Return users directly for frontend compatibility
    });
  } catch (error) {
    logger.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during user search'
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { name, avatarUrl } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Build update object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    logger.info(`User profile updated: ${user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during profile update'
    });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: any, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('_id name email avatarUrl createdAt');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
