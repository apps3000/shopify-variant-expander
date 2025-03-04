/**
 * Admin dashboard routes for app owner
 * These routes are protected by special authentication 
 * and only available to the app owner
 */
const express = require('express');
const Shop = require('../models/shop');
const adminAuthMiddleware = require('../middleware/admin-auth');

const router = express.Router();

// Apply admin authentication middleware to all routes
router.use(adminAuthMiddleware);

/**
 * Dashboard overview page with stats
 */
router.get('/overview', async (req, res) => {
  try {
    // Get aggregate statistics
    const totalShops = await Shop.countDocuments();
    const activeShops = await Shop.countDocuments({ isActive: true });
    
    // Get shops by signup date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newShops = await Shop.countDocuments({ 
      installedAt: { $gte: thirtyDaysAgo } 
    });
    
    // Get installation statistics by month
    const installationsByMonth = await Shop.aggregate([
      {
        $group: {
          _id: { 
            year: { $year: "$installedAt" }, 
            month: { $month: "$installedAt" } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    // Calculate configuration statistics
    const displayModeStats = await Shop.aggregate([
      {
        $group: {
          _id: "$settings.optionSettings.defaultDisplayMode",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const deviceUsageStats = await Shop.aggregate([
      {
        $match: { 
          "settings.viewportSettings.enableOnMobile": true 
        }
      },
      { $count: "mobileEnabled" }
    ]);
    
    const mobileEnabled = deviceUsageStats.length > 0 ? deviceUsageStats[0].mobileEnabled : 0;
    
    // Return statistics
    res.json({
      totalShops,
      activeShops,
      newShops,
      installationsByMonth,
      displayModeStats,
      deviceUsage: {
        mobileEnabled,
        tabletEnabled: await Shop.countDocuments({ "settings.viewportSettings.enableOnTablet": true }),
        desktopEnabled: await Shop.countDocuments({ "settings.viewportSettings.enableOnDesktop": true }),
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard overview:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});

/**
 * Get all shops with pagination and filtering
 */
router.get('/shops', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'installedAt', 
      sortDir = 'desc',
      filter,
      isActive
    } = req.query;
    
    // Build query
    const query = {};
    
    // Apply filters
    if (filter) {
      query.shopDomain = { $regex: filter, $options: 'i' };
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Count total matching shops
    const totalShops = await Shop.countDocuments(query);
    
    // Get paginated shops
    const shops = await Shop.find(query)
      .select({
        shopDomain: 1,
        isActive: 1,
        installedAt: 1,
        updatedAt: 1,
        'settings.optionSettings.defaultDisplayMode': 1,
        'settings.viewportSettings': 1
      })
      .sort({ [sortBy]: sortDir === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.json({
      shops,
      pagination: {
        total: totalShops,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalShops / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching shops for admin dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});

/**
 * Get detailed shop configuration
 */
router.get('/shops/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    
    const shop = await Shop.findById(shopId);
    
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    res.json({ shop });
  } catch (error) {
    console.error('Error fetching shop details for admin dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch shop details' });
  }
});

/**
 * Get configuration problems report
 */
router.get('/configuration-issues', async (req, res) => {
  try {
    // Find shops with potential issues
    
    // 1. Shops with no primary option set but using primary option mode
    const missingPrimaryOption = await Shop.find({
      $or: [
        { 'settings.optionSettings.defaultDisplayMode': 'primary-option', 'settings.optionSettings.defaultPrimaryOption': { $exists: false } },
        { 'settings.optionSettings.defaultDisplayMode': 'grouped-options', 'settings.optionSettings.defaultPrimaryOption': { $exists: false } }
      ]
    }).select('shopDomain settings.optionSettings');
    
    // 2. Shops with mobile display enabled but no configuration
    const mobileDisplayIssues = await Shop.find({
      'settings.viewportSettings.enableOnMobile': true,
      'settings.viewportSettings.mobileDisplayMode': { $exists: false }
    }).select('shopDomain settings.viewportSettings');
    
    // 3. Shops with empty but enabled collections
    const emptyCollectionIssues = await Shop.find({
      'settings.selectionMode': 'specific-collections',
      $or: [
        { 'settings.enabledCollections': { $size: 0 } },
        { 'settings.enabledCollections': { $exists: false } }
      ]
    }).select('shopDomain settings.selectionMode settings.enabledCollections');
    
    res.json({
      missingPrimaryOption,
      mobileDisplayIssues,
      emptyCollectionIssues,
      total: missingPrimaryOption.length + mobileDisplayIssues.length + emptyCollectionIssues.length
    });
  } catch (error) {
    console.error('Error fetching configuration issues report:', error);
    res.status(500).json({ error: 'Failed to generate configuration issues report' });
  }
});

module.exports = router;
