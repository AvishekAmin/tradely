import { getPortfolioAnalytics } from "../services/portfolioAnalyticsService.js";

/**
 * GET /portfolio/analytics - Retrieve authenticated user's portfolio analytics
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await getPortfolioAnalytics(req.user._id);
    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (err) {
    next(err);
  }
};
