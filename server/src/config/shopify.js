/**
 * Shopify API configuration
 * This file manages the Shopify API connection settings
 */

// Import Shopify API library
const { Shopify } = require('@shopify/shopify-api');

// Load environment variables
require('dotenv').config();

// Check for required environment variables
const requiredEnvVars = [
  'SHOPIFY_API_KEY',
  'SHOPIFY_API_SECRET',
  'SCOPES',
  'HOST',
  'API_VERSION'
];

// Validate environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Parse scopes from environment variable
const SCOPES = process.env.SCOPES.split(',').map(scope => scope.trim());

// Initialize Shopify API client
Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: SCOPES,
  HOST_NAME: process.env.HOST.replace(/https?:\/\//, ''),
  API_VERSION: process.env.API_VERSION || '2023-10',
  IS_EMBEDDED_APP: true,
  // Use a custom session storage or leave empty for the default
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage()
});

// Configure API rate limits
Shopify.Context.RETRY_AFTER_LIMITS = {
  read: 2,   // seconds to wait after a rate limit on GET requests
  write: 2,  // seconds to wait after a rate limit on POST/PUT/DELETE requests
  storefront: 2,   // seconds to wait after a rate limit on storefront API requests
};

/**
 * Create a new Shopify REST client for a specific shop
 * @param {string} shop - Shop domain
 * @param {string} accessToken - Shop's access token
 * @returns {Object} Shopify REST client
 */
function createShopifyRestClient(shop, accessToken) {
  return new Shopify.Clients.Rest(shop, accessToken);
}

/**
 * Create a new Shopify GraphQL client for a specific shop
 * @param {string} shop - Shop domain
 * @param {string} accessToken - Shop's access token
 * @returns {Object} Shopify GraphQL client
 */
function createShopifyGraphQLClient(shop, accessToken) {
  return new Shopify.Clients.Graphql(shop, accessToken);
}

/**
 * Get the shop's storefront access token for public API calls
 * Helper to retrieve or create a storefront token
 * @param {string} shop - Shop domain
 * @param {string} accessToken - Shop's admin access token
 * @returns {Promise<string>} Storefront access token
 */
async function getStorefrontAccessToken(shop, accessToken) {
  try {
    // Create GraphQL client
    const client = createShopifyGraphQLClient(shop, accessToken);
    
    // Query for existing storefront access tokens
    const response = await client.query({
      data: `{
        storefrontAccessTokens(first: 1) {
          edges {
            node {
              accessToken
            }
          }
        }
      }`
    });
    
    // If a token already exists, return it
    const tokens = response.body.data.storefrontAccessTokens.edges;
    if (tokens.length > 0) {
      return tokens[0].node.accessToken;
    }
    
    // Otherwise, create a new storefront access token
    const createResponse = await client.query({
      data: `mutation {
        storefrontAccessTokenCreate(
          input: {
            title: "Variant Expander App"
          }
        ) {
          storefrontAccessToken {
            accessToken
          }
          userErrors {
            field
            message
          }
        }
      }`
    });
    
    // Check for errors
    const userErrors = createResponse.body.data.storefrontAccessTokenCreate.userErrors;
    if (userErrors.length > 0) {
      throw new Error(`Failed to create storefront access token: ${userErrors[0].message}`);
    }
    
    // Return the new token
    return createResponse.body.data.storefrontAccessTokenCreate.storefrontAccessToken.accessToken;
  } catch (error) {
    console.error('Error getting storefront access token:', error);
    throw error;
  }
}

module.exports = {
  Shopify,
  SCOPES,
  createShopifyRestClient,
  createShopifyGraphQLClient,
  getStorefrontAccessToken
};
