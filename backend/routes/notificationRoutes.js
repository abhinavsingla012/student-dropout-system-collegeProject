import express from 'express';
import { Notification } from '../models/Notification.js';
import { protect } from '../middleware/authMiddleware.js';
import { AppError } from '../middleware/errorMiddleware.js';

const router = express.Router();

router.use(protect);

// GET /api/notifications - Get current user's notifications
router.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      status: 'success',
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read - Mark as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
