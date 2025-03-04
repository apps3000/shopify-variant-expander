/**
 * API routes for localization management
 */
const express = require('express');
const authMiddleware = require('../middleware/auth');
const translationService = require('../services/translation');
const Localization = require('../models/localization');

const router = express.Router();

// Apply authentication middleware to shop-specific routes
router.use('/shop', authMiddleware);

/**
 * Get supported locales
 */
router.get('/supported-locales', async (req, res) => {
  try {
    const locales = translationService.getSupportedLocales();
    res.json({ locales });
  } catch (error) {
    console.error('Error fetching supported locales:', error);
    res.status(500).json({ error: 'Failed to fetch supported locales' });
  }
});

/**
 * Get default translations for a locale
 */
router.get('/default-translations/:locale?', async (req, res) => {
  try {
    const { locale = 'en' } = req.params;
    const translations = translationService.getDefaultTranslations(locale);
    res.json({ translations });
  } catch (error) {
    console.error('Error fetching default translations:', error);
    res.status(500).json({ error: 'Failed to fetch default translations' });
  }
});

/**
 * Get shop's localization settings
 */
router.get('/shop/settings', async (req, res) => {
  try {
    const { shop } = req;
    
    // Get shop's localization document
    const localization = await Localization.findOne({ shopId: shop._id });
    
    if (!localization) {
      // Initialize localization if it doesn't exist
      const newLocalization = await translationService.initializeShopLocalization(
        shop._id, 
        shop.shopDomain
      );
      
      return res.json({
        defaultLocale: newLocalization.defaultLocale,
        supportedLocales: newLocalization.supportedLocales,
      });
    }
    
    res.json({
      defaultLocale: localization.defaultLocale,
      supportedLocales: localization.supportedLocales,
    });
  } catch (error) {
    console.error('Error fetching shop localization settings:', error);
    res.status(500).json({ error: 'Failed to fetch localization settings' });
  }
});

/**
 * Update shop's default locale
 */
router.put('/shop/default-locale', async (req, res) => {
  try {
    const { shop } = req;
    const { locale } = req.body;
    
    if (!locale) {
      return res.status(400).json({ error: 'Locale is required' });
    }
    
    // Get shop's localization document
    let localization = await Localization.findOne({ shopId: shop._id });
    
    if (!localization) {
      // Initialize localization if it doesn't exist
      localization = await translationService.initializeShopLocalization(
        shop._id, 
        shop.shopDomain
      );
    }
    
    // Update default locale
    localization.defaultLocale = locale;
    
    // Ensure the locale is in supported locales
    if (!localization.supportedLocales.includes(locale)) {
      localization.supportedLocales.push(locale);
    }
    
    await localization.save();
    
    res.json({
      defaultLocale: localization.defaultLocale,
      supportedLocales: localization.supportedLocales,
    });
  } catch (error) {
    console.error('Error updating default locale:', error);
    res.status(500).json({ error: 'Failed to update default locale' });
  }
});

/**
 * Get translations for a specific locale
 */
router.get('/shop/translations/:locale?', async (req, res) => {
  try {
    const { shop } = req;
    const { locale = 'en' } = req.params;
    
    // Get translations for the requested locale
    const translations = await translationService.getShopTranslations(
      shop.shopDomain, 
      locale
    );
    
    res.json({ translations });
  } catch (error) {
    console.error('Error fetching translations:', error);
    res.status(500).json({ error: 'Failed to fetch translations' });
  }
});

/**
 * Update translations for a specific locale
 */
router.put('/shop/translations/:locale', async (req, res) => {
  try {
    const { shop } = req;
    const { locale } = req.params;
    const { translations } = req.body;
    
    if (!locale) {
      return res.status(400).json({ error: 'Locale is required' });
    }
    
    if (!translations || typeof translations !== 'object') {
      return res.status(400).json({ error: 'Valid translations object is required' });
    }
    
    // Update translations
    await translationService.updateShopTranslations(
      shop._id, 
      locale, 
      translations
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating translations:', error);
    res.status(500).json({ error: 'Failed to update translations' });
  }
});

/**
 * Add a supported locale
 */
router.post('/shop/supported-locales', async (req, res) => {
  try {
    const { shop } = req;
    const { locale } = req.body;
    
    if (!locale) {
      return res.status(400).json({ error: 'Locale is required' });
    }
    
    // Get shop's localization document
    let localization = await Localization.findOne({ shopId: shop._id });
    
    if (!localization) {
      // Initialize localization if it doesn't exist
      localization = await translationService.initializeShopLocalization(
        shop._id, 
        shop.shopDomain
      );
    }
    
    // Check if locale is already supported
    if (localization.supportedLocales.includes(locale)) {
      return res.json({
        supportedLocales: localization.supportedLocales,
      });
    }
    
    // Add locale to supported locales
    localization.supportedLocales.push(locale);
    await localization.save();
    
    // Initialize translations for the new locale
    const defaultTranslations = translationService.getDefaultTranslations(locale);
    await translationService.updateShopTranslations(
      shop._id, 
      locale, 
      defaultTranslations
    );
    
    res.json({
      supportedLocales: localization.supportedLocales,
    });
  } catch (error) {
    console.error('Error adding supported locale:', error);
    res.status(500).json({ error: 'Failed to add supported locale' });
  }
});

/**
 * Remove a supported locale
 */
router.delete('/shop/supported-locales/:locale', async (req, res) => {
  try {
    const { shop } = req;
    const { locale } = req.params;
    
    if (!locale) {
      return res.status(400).json({ error: 'Locale is required' });
    }
    
    // Get shop's localization document
    let localization = await Localization.findOne({ shopId: shop._id });
    
    if (!localization) {
      return res.status(404).json({ error: 'Localization settings not found' });
    }
    
    // Check if locale is the default locale
    if (localization.defaultLocale === locale) {
      return res.status(400).json({ 
        error: 'Cannot remove default locale. Set a different default locale first.' 
      });
    }
    
    // Remove locale from supported locales
    localization.supportedLocales = localization.supportedLocales.filter(l => l !== locale);
    
    // Remove translations for the locale
    if (localization.translations.has(locale)) {
      localization.translations.delete(locale);
    }
    
    await localization.save();
    
    res.json({
      supportedLocales: localization.supportedLocales,
    });
  } catch (error) {
    console.error('Error removing supported locale:', error);
    res.status(500).json({ error: 'Failed to remove supported locale' });
  }
});

module.exports = router;
