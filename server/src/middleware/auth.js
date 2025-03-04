const { Shopify } = require('@shopify/shopify-api');
const Shop = require('../models/shop');

/**
 * Authentication middleware for API routes
 */
module.exports = async (req, res, next) => {
  try {
    // Get the shop from the query or header
    const shopDomain = req.query.shop || req.header('X-Shopify-Shop-Domain');
    
    if (!shopDomain) {
      return res.status(401).json({ error: 'Shop domain is required' });
    }
    
    // Validate the shop domain
    if (!Shopify.Utils.isValidShopDomain(shopDomain)) {
      return res.status(400).json({ error: 'Invalid shop domain' });
    }
    
    // Get the authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token is required' });
    }
    
    // Extract the token
    const token = authHeader.substring(7);
    
    // Verify the JWT token
    const payload = await Shopify.Utils.decodeSessionToken(token);
    
    if (payload.shop !== shopDomain) {
      return res.status(401).json({ error: 'Invalid token for this shop' });
    }
    
    // Get the shop from the database
    const shop = await Shop.findOne({ shopDomain });
    
    if (!shop || !shop.isActive) {
      return res.status(401).json({ error: 'Shop not found or inactive' });
    }
    
    // Attach the shop to the request
    req.shop = shop;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};
