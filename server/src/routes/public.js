const express = require('express');
const Shop = require('../models/shop');

const router = express.Router();

/**
 * Get public configuration for a shop
 */
router.get('/config', async (req, res) => {
  try {
    const { shop, locale } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Shop parameter is required' });
    }
    
    // Find the shop in the database
    const shopData = await Shop.findOne({ shopDomain: shop });
    
    if (!shopData || !shopData.isActive) {
      return res.status(404).json({ error: 'Shop not found or inactive' });
    }
    
    // Get translations for the requested locale (or default)
    const translations = await require('../services/translation').getShopTranslations(
      shop,
      locale || shopData.settings.optionSettings?.defaultLocale || 'en'
    );
    
    // Send the configuration
    res.json({
      config: {
        buttonText: shopData.settings.buttonText,
        collapseButtonText: shopData.settings.collapseButtonText,
        displayImages: shopData.settings.displayImages,
        showPrice: shopData.settings.showPrice,
        showInventory: shopData.settings.showInventory,
        cardStyle: shopData.settings.cardStyle,
        selectionMode: shopData.settings.selectionMode || 'all',
        enabledCollections: shopData.settings.enabledCollections || [],
        enabledProducts: shopData.settings.enabledProducts || [],
        enabledTags: shopData.settings.enabledTags || [],
        optionSettings: shopData.settings.optionSettings || {
          defaultDisplayMode: 'all-variants',
          defaultPrimaryOption: 'Color',
          productSpecificOptions: {},
          collectionSpecificOptions: {}
        },
        viewportSettings: shopData.settings.viewportSettings || {
          enableOnMobile: true,
          enableOnTablet: true,
          enableOnDesktop: true,
          mobileDisplayMode: 'horizontal-scroll',
          tabletDisplayMode: 'grid',
          mobileColumnsCount: 1,
          tabletColumnsCount: 2,
          desktopColumnsCount: 3,
        },
        styles: shopData.settings.styles || {
          addToCartButtonColor: '#2c6ecb',
          addToCartButtonTextColor: '#ffffff',
          cardWidth: '200px',
          cardPadding: '10px',
          borderColor: '#eeeeee',
          borderRadius: '4px',
        },
        translations: translations,
        localization: {
          defaultLocale: shopData.settings.localization?.defaultLocale || 'en',
          supportedLocales: shopData.settings.localization?.supportedLocales || ['en'],
        }
      },
    });
  } catch (error) {
    console.error('Error fetching shop configuration:', error);
    res.status(500).json({ error: 'Failed to fetch shop configuration' });
  }
});

module.exports = router;
