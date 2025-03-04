const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  shopDomain: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  scope: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  settings: {
    buttonText: {
      type: String,
      default: 'Show all variants',
    },
    collapseButtonText: {
      type: String,
      default: 'Hide variants',
    },
    displayImages: {
      type: Boolean,
      default: true,
    },
    showPrice: {
      type: Boolean,
      default: true,
    },
    showInventory: {
      type: Boolean,
      default: false,
    },
    cardStyle: {
      type: String,
      enum: ['compact', 'standard', 'detailed', 'match-original'],
      default: 'standard',
    },
    selectionMode: {
      type: String,
      enum: ['all', 'specific-collections', 'specific-products', 'tags'],
      default: 'all',
    },
    enabledCollections: [{
      type: String,
      trim: true,
    }],
    enabledProducts: [{
      type: String,
      trim: true,
    }],
    enabledTags: [{
      type: String,
      trim: true,
    }],
    optionSettings: {
      defaultDisplayMode: {
        type: String,
        enum: ['all-variants', 'primary-option', 'grouped-options'],
        default: 'all-variants'
      },
      defaultPrimaryOption: {
        type: String,
        default: 'Color'
      },
      productSpecificOptions: {
        type: Map,
        of: {
          displayMode: {
            type: String,
            enum: ['all-variants', 'primary-option', 'grouped-options'],
            default: 'primary-option'
          },
          primaryOption: {
            type: String,
            default: 'Color'
          }
        }
      },
      collectionSpecificOptions: {
        type: Map,
        of: {
          displayMode: {
            type: String,
            enum: ['all-variants', 'primary-option', 'grouped-options'],
            default: 'primary-option'
          },
          primaryOption: {
            type: String,
            default: 'Color'
          }
        }
      }
    },
    viewportSettings: {
      enableOnMobile: {
        type: Boolean,
        default: true,
      },
      enableOnTablet: {
        type: Boolean,
        default: true,
      },
      enableOnDesktop: {
        type: Boolean,
        default: true,
      },
      mobileDisplayMode: {
        type: String,
        enum: ['horizontal-scroll', 'dropdown', 'modal', 'grid'],
        default: 'horizontal-scroll',
      },
      tabletDisplayMode: {
        type: String,
        enum: ['grid', 'horizontal-scroll'],
        default: 'grid',
      },
      mobileColumnsCount: {
        type: Number,
        default: 1,
      },
      tabletColumnsCount: {
        type: Number,
        default: 2,
      },
      desktopColumnsCount: {
        type: Number,
        default: 3,
      },
    },
    styles: {
      addToCartButtonColor: {
        type: String,
        default: '#2c6ecb',
      },
      addToCartButtonTextColor: {
        type: String,
        default: '#ffffff',
      },
      cardWidth: {
        type: String,
        default: '200px',
      },
      cardPadding: {
        type: String,
        default: '10px',
      },
      borderColor: {
        type: String,
        default: '#eeeeee',
      },
      borderRadius: {
        type: String,
        default: '4px',
      },
    },
  },
  installedAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

shopSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Shop', shopSchema);
