const { Shopify } = require('@shopify/shopify-api');
const Shop = require('../models/shop');

// Initialize Shopify API client
Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: [
    'read_products',
    'write_products',
    'read_themes',
    'write_themes',
    'read_script_tags',
    'write_script_tags',
    'read_locales',
    'read_translations',
    'write_translations',
    'read_content',
    'read_inventory',
  ],
  HOST_NAME: process.env.HOST.replace(/https:\/\//, ''),
  API_VERSION: '2023-07',
  IS_EMBEDDED_APP: true,
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});

/**
 * Generate an OAuth authorization URL for a shop
 * @param {string} shop - The Shopify shop domain
 * @returns {string} - The authorization URL
 */
async function generateAuthUrl(shop) {
  const authRoute = await Shopify.Auth.beginAuth(
    req,
    res,
    shop,
    '/auth/callback',
    false,
  );
  return authRoute;
}

/**
 * Handle the OAuth callback and store the shop's access token
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {object} - The shop data
 */
async function handleAuthCallback(req, res) {
  try {
    const session = await Shopify.Auth.validateAuthCallback(
      req,
      res,
      req.query,
    );

    // Store the shop data in the database
    const shopData = {
      shopDomain: session.shop,
      accessToken: session.accessToken,
      scope: session.scope,
    };

    // Update the shop if it exists, otherwise create a new one
    const shop = await Shop.findOneAndUpdate(
      { shopDomain: session.shop },
      shopData,
      { upsert: true, new: true }
    );

    return shop;
  } catch (error) {
    console.error('Auth callback error:', error);
    throw error;
  }
}

/**
 * Verify a shop's JWT token for API requests
 * @param {string} token - The JWT token
 * @returns {object} - The shop data if valid
 */
async function verifyShopToken(token) {
  try {
    const session = await Shopify.Utils.decodeSessionToken(token);
    const shop = await Shop.findOne({ shopDomain: session.shop });
    
    if (!shop || !shop.isActive) {
      throw new Error('Shop not found or inactive');
    }
    
    return shop;
  } catch (error) {
    console.error('Token verification error:', error);
    throw error;
  }
}

/**
 * Create a new Shopify API client for a shop
 * @param {string} shop - The shop domain
 * @param {string} accessToken - The shop's access token
 * @returns {object} - The Shopify API client
 */
function createShopifyClient(shop, accessToken) {
  return new Shopify.Clients.Rest(shop, accessToken);
}

module.exports = {
  generateAuthUrl,
  handleAuthCallback,
  verifyShopToken,
  createShopifyClient,
};
