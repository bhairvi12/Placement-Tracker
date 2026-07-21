import ActivityFeed from '../models/ActivityFeed.model.js';

/**
 * Get Activity Logs for the authenticated user.
 * Supports query parameter ?limit=X (default 10, max 50).
 */
export const getActivityLogs = async (req, res, next) => {
  try {
    let limit = parseInt(req.query.limit, 10);

    if (isNaN(limit) || limit <= 0) {
      limit = 10;
    }
    if (limit > 50) {
      limit = 50;
    }

    const logs = await ActivityFeed.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Activity feed logs retrieved successfully',
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};
