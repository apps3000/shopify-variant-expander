/**
 * Translation service for handling localization across the app
 */
const Localization = require('../models/localization');
const Shop = require('../models/shop');

// Default translations map with all supported languages
const defaultTranslations = {
  // English (default)
  en: {
    'button.show_variants': 'Show all variants',
    'button.hide_variants': 'Hide variants',
    'button.add_to_cart': 'Add to Cart',
    'button.sold_out': 'Sold Out',
    'button.adding': 'Adding...',
    'button.added': 'Added!',
    'button.select_options': 'Select Options',
    'button.select': 'Select',
    'status.available': 'Available',
    'status.unavailable': 'Sold out',
    'dropdown.select_variant': 'Select a variant',
    'modal.select_options': 'Select Options',
    'modal.close': 'Close',
  },
  // French
  fr: {
    'button.show_variants': 'Afficher toutes les variantes',
    'button.hide_variants': 'Masquer les variantes',
    'button.add_to_cart': 'Ajouter au panier',
    'button.sold_out': 'Épuisé',
    'button.adding': 'Ajout en cours...',
    'button.added': 'Ajouté !',
    'button.select_options': 'Choisir les options',
    'button.select': 'Sélectionner',
    'status.available': 'Disponible',
    'status.unavailable': 'Épuisé',
    'dropdown.select_variant': 'Sélectionner une variante',
    'modal.select_options': 'Choisir les options',
    'modal.close': 'Fermer',
  },
  // German
  de: {
    'button.show_variants': 'Alle Varianten anzeigen',
    'button.hide_variants': 'Varianten ausblenden',
    'button.add_to_cart': 'In den Warenkorb',
    'button.sold_out': 'Ausverkauft',
    'button.adding': 'Wird hinzugefügt...',
    'button.added': 'Hinzugefügt!',
    'button.select_options': 'Optionen wählen',
    'button.select': 'Auswählen',
    'status.available': 'Verfügbar',
    'status.unavailable': 'Ausverkauft',
    'dropdown.select_variant': 'Variante auswählen',
    'modal.select_options': 'Optionen wählen',
    'modal.close': 'Schließen',
  },
  // Spanish
  es: {
    'button.show_variants': 'Mostrar todas las variantes',
    'button.hide_variants': 'Ocultar variantes',
    'button.add_to_cart': 'Añadir al carrito',
    'button.sold_out': 'Agotado',
    'button.adding': 'Añadiendo...',
    'button.added': '¡Añadido!',
    'button.select_options': 'Seleccionar opciones',
    'button.select': 'Seleccionar',
    'status.available': 'Disponible',
    'status.unavailable': 'Agotado',
    'dropdown.select_variant': 'Seleccionar una variante',
    'modal.select_options': 'Seleccionar opciones',
    'modal.close': 'Cerrar',
  },
};

/**
 * Initialize localization settings for a shop
 * @param {string} shopId - The shop's MongoDB ID
 * @param {string} shopDomain - The shop's domain
 * @returns {Promise<Object>} - The shop's localization document
 */
async function initializeShopLocalization(shopId, shopDomain) {
  try {
    // Check if shop localization already exists
    let localization = await Localization.findOne({ shopId });
    
    if (!localization) {
      // Create new localization document with default translations
      localization = new Localization({
        shopId,
        shopDomain,
        defaultLocale: 'en',
        supportedLocales: ['en'],
      });
      
      // Initialize with default English translations
      const translationsMap = new Map();
      translationsMap.set('en', new Map(Object.entries(defaultTranslations.en)));
      localization.translations = translationsMap;
      
      await localization.save();
    }
    
    return localization;
  } catch (error) {
    console.error('Error initializing shop localization:', error);
    throw error;
  }
}

/**
 * Get translations for a shop in a specific locale
 * @param {string} shopDomain - The shop's domain
 * @param {string} locale - The locale code (e.g., 'en', 'fr')
 * @returns {Promise<Object>} - Translations for the specified locale
 */
async function getShopTranslations(shopDomain, locale = 'en') {
  try {
    // Find the shop
    const shop = await Shop.findOne({ shopDomain });
    
    if (!shop) {
      throw new Error(`Shop not found: ${shopDomain}`);
    }
    
    // Get the shop's localization
    const localization = await Localization.findOne({ shopId: shop._id });
    
    if (!localization) {
      // Return default translations if no localization exists
      return defaultTranslations[locale] || defaultTranslations.en;
    }
    
    // Get translations for the requested locale
    const translations = localization.getTranslations(locale);
    
    // Convert Map to plain object
    const translationsObj = {};
    translations.forEach((value, key) => {
      translationsObj[key] = value;
    });
    
    return translationsObj;
  } catch (error) {
    console.error('Error getting shop translations:', error);
    // Fall back to default translations
    return defaultTranslations[locale] || defaultTranslations.en;
  }
}

/**
 * Update translations for a shop
 * @param {string} shopId - The shop's MongoDB ID
 * @param {string} locale - The locale code to update
 * @param {Object} translations - The translations to set
 * @returns {Promise<Object>} - The updated localization document
 */
async function updateShopTranslations(shopId, locale, translations) {
  try {
    // Get the shop's localization
    let localization = await Localization.findOne({ shopId });
    
    if (!localization) {
      // Find the shop to get the domain
      const shop = await Shop.findById(shopId);
      
      if (!shop) {
        throw new Error(`Shop not found with ID: ${shopId}`);
      }
      
      // Initialize localization
      localization = await initializeShopLocalization(shopId, shop.shopDomain);
    }
    
    // Update translations
    localization.setTranslations(locale, translations);
    await localization.save();
    
    return localization;
  } catch (error) {
    console.error('Error updating shop translations:', error);
    throw error;
  }
}

/**
 * Get all supported locales with their native names
 * @returns {Array<Object>} - Array of locale objects with code and name
 */
function getSupportedLocales() {
  return [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'es', name: 'Español' },
    // Add more supported locales here
  ];
}

/**
 * Get default translations for a locale
 * @param {string} locale - The locale code
 * @returns {Object} - Default translations for the locale
 */
function getDefaultTranslations(locale = 'en') {
  return defaultTranslations[locale] || defaultTranslations.en;
}

module.exports = {
  initializeShopLocalization,
  getShopTranslations,
  updateShopTranslations,
  getSupportedLocales,
  getDefaultTranslations,
  defaultTranslations,
};
