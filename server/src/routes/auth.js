const express = require('express');
const { Shopify } = require('@shopify/shopify-api');
const authService = require('../services/auth');

const router = express.Router();

/**
 * Start the OAuth flow for a shop
 */
router.get('/', async (req, res) => {
  try {
    // Get the shop domain from the query params
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Shop parameter is required' });
    }
    
    // Validate the shop domain
    if (!Shopify.Utils.isValidShopDomain(shop)) {
      return res.status(400).json({ error: 'Invalid shop domain' });
    }
    
    // Generate the authorization URL and redirect the user
    const authUrl = await Shopify.Auth.beginAuth(
      req,
      res,
      shop,
      '/auth/callback',
      false, // online access mode
    );
    
    res.redirect(authUrl);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * Handle the OAuth callback
 */
router.get('/callback', async (req, res) => {
  try {
    // Complete the OAuth flow
    const session = await Shopify.Auth.validateAuthCallback(
      req,
      res,
      req.query,
    );
    
    // Store the shop data in the database
    await authService.handleAuthCallback(req, res);
    
    // Redirect to the app's admin dashboard
    res.redirect(`/admin?shop=${session.shop}`);
  } catch (error) {
    console.error('Auth callback error:', error);
    res.status(500).json({ error: 'Authentication callback failed' });
  }
});

/**
 * Log out a shop and revoke access
 */
router.get('/logout', async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Shop parameter is required' });
    }
    
    // Update the shop's active status in the database
    const shopModel = require('../models/shop');
    await shopModel.findOneAndUpdate(
      { shopDomain: shop },
      { isActive: false }
    );
    
    res.redirect('/');
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;
