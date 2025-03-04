const express = require('express');
const { Shopify } = require('@shopify/shopify-api');
const Shop = require('../models/shop');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * Get shop settings
 */
router.get('/settings', async (req, res) => {
  try {
    const { shop } = req;
    res.json({ settings: shop.settings });
  } catch (error) {
    console.error('Error fetching shop settings:', error);
    res.status(500).json({ error: 'Failed to fetch shop settings' });
  }
});

/**
 * Update shop settings
 */
router.put('/settings', async (req, res) => {
  try {
    const { shop } = req;
    const { settings } = req.body;
    
    // Update the shop settings
    shop.settings = {
      ...shop.settings,
      ...settings,
    };
    
    await shop.save();
    
    res.json({ settings: shop.settings });
  } catch (error) {
    console.error('Error updating shop settings:', error);
    res.status(500).json({ error: 'Failed to update shop settings' });
  }
});

/**
 * Get collections for the shop
 */
router.get('/collections', async (req, res) => {
  try {
    const { shop } = req;
    
    // Create a Shopify client for the shop
    const client = new Shopify.Clients.Rest(
      shop.shopDomain,
      shop.accessToken
    );
    
    // Fetch collections from Shopify
    const response = await client.get({
      path: 'custom_collections',
    });
    
    const collections = response.body.custom_collections.map(collection => ({
      id: collection.id,
      title: collection.title,
      handle: collection.handle,
    }));
    
    res.json({ collections });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

/**
 * Update enabled collections
 */
router.put('/collections/enabled', async (req, res) => {
  try {
    const { shop } = req;
    const { enabledCollections } = req.body;
    
    // Update the enabled collections
    shop.settings.enabledCollections = enabledCollections;
    await shop.save();
    
    res.json({ enabledCollections: shop.settings.enabledCollections });
  } catch (error) {
    console.error('Error updating enabled collections:', error);
    res.status(500).json({ error: 'Failed to update enabled collections' });
  }
});

module.exports = router;
