const express = require('express');
const { Shopify } = require('@shopify/shopify-api');
const Shop = require('../models/shop');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * Get shop information
 */
router.get('/shop', async (req, res) => {
  try {
    const { shop } = req;
    
    // Create a Shopify client for the shop
    const client = new Shopify.Clients.Rest(
      shop.shopDomain,
      shop.accessToken
    );
    
    // Fetch shop information from Shopify
    const response = await client.get({
      path: 'shop',
    });
    
    const shopInfo = {
      id: response.body.shop.id,
      name: response.body.shop.name,
      email: response.body.shop.email,
      domain: response.body.shop.domain,
      myshopifyDomain: response.body.shop.myshopify_domain,
      plan: response.body.shop.plan_name,
    };
    
    res.json({ shop: shopInfo });
  } catch (error) {
    console.error('Error fetching shop information:', error);
    res.status(500).json({ error: 'Failed to fetch shop information' });
  }
});

/**
 * Get app status
 */
router.get('/status', async (req, res) => {
  try {
    const { shop } = req;
    
    // Create a Shopify client for the shop
    const client = new Shopify.Clients.Rest(
      shop.shopDomain,
      shop.accessToken
    );
    
    // Check if the app script tag is installed
    const scriptTagResponse = await client.get({
      path: 'script_tags',
    });
    
    const appScriptTag = scriptTagResponse.body.script_tags.find(
      tag => tag.src.includes('variant-expander')
    );
    
    const status = {
      isActive: shop.isActive,
      scriptTagInstalled: !!appScriptTag,
      scriptTagId: appScriptTag ? appScriptTag.id : null,
      lastUpdated: shop.updatedAt,
    };
    
    res.json({ status });
  } catch (error) {
    console.error('Error fetching app status:', error);
    res.status(500).json({ error: 'Failed to fetch app status' });
  }
});

/**
 * Install script tag
 */
router.post('/install-script', async (req, res) => {
  try {
    const { shop } = req;
    
    // Create a Shopify client for the shop
    const client = new Shopify.Clients.Rest(
      shop.shopDomain,
      shop.accessToken
    );
    
    // Check if the script tag already exists
    const scriptTagResponse = await client.get({
      path: 'script_tags',
    });
    
    const appScriptTag = scriptTagResponse.body.script_tags.find(
      tag => tag.src.includes('variant-expander')
    );
    
    if (appScriptTag) {
      // Update the existing script tag
      await client.put({
        path: `script_tags/${appScriptTag.id}`,
        data: {
          script_tag: {
            id: appScriptTag.id,
            src: `${process.env.HOST}/assets/variant-expander.js`,
            event: 'onload',
            display_scope: 'online_store',
          },
        },
      });
      
      res.json({ success: true, scriptTagId: appScriptTag.id, updated: true });
    } else {
      // Create a new script tag
      const response = await client.post({
        path: 'script_tags',
        data: {
          script_tag: {
            event: 'onload',
            src: `${process.env.HOST}/assets/variant-expander.js`,
            display_scope: 'online_store',
          },
        },
      });
      
      res.json({ success: true, scriptTagId: response.body.script_tag.id, created: true });
    }
  } catch (error) {
    console.error('Error installing script tag:', error);
    res.status(500).json({ error: 'Failed to install script tag' });
  }
});

/**
 * Uninstall script tag
 */
router.delete('/uninstall-script', async (req, res) => {
  try {
    const { shop } = req;
    
    // Create a Shopify client for the shop
    const client = new Shopify.Clients.Rest(
      shop.shopDomain,
      shop.accessToken
    );
    
    // Check if the script tag exists
    const scriptTagResponse = await client.get({
      path: 'script_tags',
    });
    
    const appScriptTag = scriptTagResponse.body.script_tags.find(
      tag => tag.src.includes('variant-expander')
    );
    
    if (appScriptTag) {
      // Delete the script tag
      await client.delete({
        path: `script_tags/${appScriptTag.id}`,
      });
      
      res.json({ success: true, removed: true });
    } else {
      res.json({ success: true, removed: false });
    }
  } catch (error) {
    console.error('Error uninstalling script tag:', error);
    res.status(500).json({ error: 'Failed to uninstall script tag' });
  }
});

module.exports = router;
