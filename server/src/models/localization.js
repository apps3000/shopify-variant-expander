/**
 * Localization schema for translation settings
 */
const mongoose = require('mongoose');

/**
 * Schema for shop-specific translations
 */
const localizationSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  shopDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  defaultLocale: {
    type: String,
    default: 'en',
  },
  supportedLocales: [{
    type: String,
    trim: true,
  }],
  translations: {
    type: Map,
    of: {
      type: Map,
      of: String,
    },
    default: new Map(),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to update the updatedAt field
localizationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * Get translations for a specific locale
 * @param {string} locale - The locale code (e.g., 'en', 'fr', 'de')
 * @returns {Object} - Translations for the specified locale
 */
localizationSchema.methods.getTranslations = function(locale) {
  if (!this.translations.has(locale)) {
    // Return default locale if requested locale not available
    return this.translations.get(this.defaultLocale) || {};
  }
  return this.translations.get(locale);
};

/**
 * Add or update translations for a specific locale
 * @param {string} locale - The locale code (e.g., 'en', 'fr', 'de')
 * @param {Object} translations - Key-value pairs of translations
 */
localizationSchema.methods.setTranslations = function(locale, translations) {
  if (!this.translations.has(locale)) {
    this.translations.set(locale, new Map());
  }
  
  const localeTranslations = this.translations.get(locale);
  
  // Update translations
  Object.entries(translations).forEach(([key, value]) => {
    localeTranslations.set(key, value);
  });
  
  // Add locale to supported locales if not already present
  if (!this.supportedLocales.includes(locale)) {
    this.supportedLocales.push(locale);
  }
};

module.exports = mongoose.model('Localization', localizationSchema);
