(function() {
  // Configuration object that will be populated from the server
  let config = {
    buttonText: 'Show all variants',
    collapseButtonText: 'Hide variants',
    displayImages: true,
    showPrice: true,
    showInventory: false,
    cardStyle: 'standard',
    enabledCollections: [],
  };
  
  // Shopify shop domain
  const shopDomain = Shopify.shop;
  
  // App server URL (will be replaced during script injection)
  const appServerUrl = '{{APP_SERVER_URL}}';
  
  // Keep track of expanded products
  const expandedProducts = new Set();
  
  /**
   * Initialize the variant expander
   */
  async function init() {
    try {
      // Check if we're on a collection page
      if (!isCollectionPage()) {
        return;
      }
      
      // Fetch configuration from the server
      await fetchConfig();
      
      // Check if the current collection is enabled
      if (!isCollectionEnabled()) {
        return;
      }
      
      // Add CSS styles
      addStyles();
      
      // Add expander buttons to products
      addExpanderButtons();
      
      // Initialize event listeners
      initEventListeners();
      
      console.log('Variant Expander initialized');
    } catch (error) {
      console.error('Error initializing Variant Expander:', error);
    }
  }
  
  /**
   * Check if the current page is a collection page
   * @returns {boolean}
   */
  function isCollectionPage() {
    const pathname = window.location.pathname;
    return pathname.includes('/collections/') && !pathname.includes('/products/');
  }
  
  /**
   * Fetch configuration from the server
   */
  async function fetchConfig() {
    try {
      const response = await fetch(`${appServerUrl}/api/public/config?shop=${shopDomain}`);
      const data = await response.json();
      
      if (data.config) {
        config = { ...config, ...data.config };
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
    }
  }
  
  /**
   * Check if the current collection is enabled
   * @returns {boolean}
   */
  function isCollectionEnabled() {
    const pathname = window.location.pathname;
    const collectionHandle = pathname.split('/collections/')[1]?.split('/')[0];
    
    // If no specific collections are enabled, enable for all
    if (!config.enabledCollections || config.enabledCollections.length === 0) {
      return true;
    }
    
    return config.enabledCollections.includes(collectionHandle);
  }
  
  /**
   * Add CSS styles to the page
   */
  function addStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .variant-expander-button {
        margin-top: 10px;
        margin-bottom: 15px;
        padding: 8px 16px;
        background-color: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        text-align: center;
        width: 100%;
        transition: background-color 0.2s;
      }
      
      .variant-expander-button:hover {
        background-color: #f0f0f0;
      }
      
      .variant-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 15px;
        margin-top: 15px;
        margin-bottom: 15px;
      }
      
      .variant-card {
        border: 1px solid #eee;
        border-radius: 4px;
        padding: 10px;
        transition: box-shadow 0.2s;
      }
      
      .variant-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      .variant-card.compact {
        padding: 5px;
      }
      
      .variant-card.detailed {
        padding: 15px;
      }
      
      .variant-image {
        width: 100%;
        height: auto;
        margin-bottom: 10px;
        border-radius: 2px;
      }
      
      .variant-title {
        font-size: 14px;
        margin-bottom: 5px;
        font-weight: 500;
      }
      
      .variant-compact .variant-title {
        font-size: 12px;
      }
      
      .variant-detailed .variant-title {
        font-size: 16px;
      }
      
      .variant-price {
        font-size: 14px;
        margin-bottom: 10px;
        color: #555;
      }
      
      .variant-inventory {
        font-size: 12px;
        margin-bottom: 10px;
      }
      
      .variant-inventory.available {
        color: #2c883a;
      }
      
      .variant-inventory.unavailable {
        color: #cc0000;
      }
      
      .variant-add-button {
        padding: 6px 12px;
        background-color: #2c6ecb;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
        font-size: 13px;
        transition: background-color 0.2s;
      }
      
      .variant-add-button:hover {
        background-color: #235cad;
      }
      
      .variant-add-button:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
      }
    `;
    
    document.head.appendChild(styleElement);
  }
  
  /**
   * Add expander buttons to products
   */
  function addExpanderButtons() {
    const productCards = document.querySelectorAll('.product-card, .grid__item');
    
    productCards.forEach(card => {
      // Check if the card is a product card
      const productLink = card.querySelector('a[href*="/products/"]');
      if (!productLink) return;
      
      // Get product handle from the URL
      const productHref = productLink.getAttribute('href');
      const productHandle = productHref.split('/products/')[1]?.split('?')[0];
      if (!productHandle) return;
      
      // Check if button already exists
      if (card.querySelector('.variant-expander-button')) return;
      
      // Create button
      const button = document.createElement('button');
      button.className = 'variant-expander-button';
      button.dataset.productHandle = productHandle;
      button.textContent = config.buttonText;
      
      // Add button to card
      card.appendChild(button);
    });
  }
  
  /**
   * Initialize event listeners
   */
  function initEventListeners() {
    document.addEventListener('click', async (event) => {
      if (event.target.matches('.variant-expander-button')) {
        const button = event.target;
        const productHandle = button.dataset.productHandle;
        
        if (expandedProducts.has(productHandle)) {
          // Collapse variants
          collapseVariants(button, productHandle);
        } else {
          // Expand variants
          await expandVariants(button, productHandle);
        }
      } else if (event.target.matches('.variant-add-button')) {
        const button = event.target;
        const variantId = button.dataset.variantId;
        
        if (variantId) {
          addToCart(variantId, button);
        }
      }
    });
  }
  
  /**
   * Expand variants for a product
   * @param {HTMLElement} button - The expander button
   * @param {string} productHandle - The product handle
   */
  async function expandVariants(button, productHandle) {
    try {
      // Change button text
      button.textContent = 'Loading...';
      button.disabled = true;
      
      // Fetch product data from Shopify AJAX API
      const response = await fetch(`/products/${productHandle}.js`);
      const product = await response.json();
      
      // Create variant container
      const variantContainer = document.createElement('div');
      variantContainer.className = 'variant-container';
      variantContainer.dataset.productHandle = productHandle;
      
      // Add variant cards
      product.variants.forEach(variant => {
        const variantCard = createVariantCard(product, variant);
        variantContainer.appendChild(variantCard);
      });
      
      // Insert container after button
      button.parentNode.insertBefore(variantContainer, button.nextSibling);
      
      // Update button text
      button.textContent = config.collapseButtonText;
      button.disabled = false;
      
      // Mark product as expanded
      expandedProducts.add(productHandle);
    } catch (error) {
      console.error('Error expanding variants:', error);
      button.textContent = config.buttonText;
      button.disabled = false;
    }
  }
  
  /**
   * Collapse variants for a product
   * @param {HTMLElement} button - The expander button
   * @param {string} productHandle - The product handle
   */
  function collapseVariants(button, productHandle) {
    // Find variant container
    const variantContainer = button.parentNode.querySelector(`.variant-container[data-product-handle="${productHandle}"]`);
    
    if (variantContainer) {
      // Remove variant container
      variantContainer.remove();
      
      // Update button text
      button.textContent = config.buttonText;
      
      // Mark product as collapsed
      expandedProducts.delete(productHandle);
    }
  }
  
  /**
   * Create a variant card
   * @param {object} product - The product data
   * @param {object} variant - The variant data
   * @returns {HTMLElement} - The variant card element
   */
  function createVariantCard(product, variant) {
    const card = document.createElement('div');
    card.className = `variant-card variant-${config.cardStyle}`;
    
    // Add variant image if enabled
    if (config.displayImages) {
      const variantImage = getVariantImage(product, variant);
      if (variantImage) {
        const img = document.createElement('img');
        img.className = 'variant-image';
        img.src = variantImage.replace(/(\\.jpg|\\.jpeg|\\.gif|\\.png)/g, '_200x$1');
        img.alt = variant.title;
        card.appendChild(img);
      }
    }
    
    // Add variant title
    const title = document.createElement('div');
    title.className = 'variant-title';
    title.textContent = variant.title;
    card.appendChild(title);
    
    // Add variant price if enabled
    if (config.showPrice) {
      const price = document.createElement('div');
      price.className = 'variant-price';
      price.textContent = formatMoney(variant.price);
      card.appendChild(price);
    }
    
    // Add inventory status if enabled
    if (config.showInventory) {
      const inventory = document.createElement('div');
      inventory.className = variant.available ? 'variant-inventory available' : 'variant-inventory unavailable';
      inventory.textContent = variant.available ? 'Available' : 'Sold out';
      card.appendChild(inventory);
    }
    
    // Add "Add to Cart" button
    const button = document.createElement('button');
    button.className = 'variant-add-button';
    button.dataset.variantId = variant.id;
    button.textContent = variant.available ? 'Add to Cart' : 'Sold Out';
    button.disabled = !variant.available;
    card.appendChild(button);
    
    return card;
  }
  
  /**
   * Get the image URL for a variant
   * @param {object} product - The product data
   * @param {object} variant - The variant data
   * @returns {string|null} - The image URL or null if not found
   */
  function getVariantImage(product, variant) {
    // Check if variant has an image ID
    if (variant.featured_image) {
      return variant.featured_image.src;
    }
    
    // Find image by variant ID
    const variantImage = product.images.find(image => {
      return image.variant_ids && image.variant_ids.includes(variant.id);
    });
    
    if (variantImage) {
      return variantImage.src;
    }
    
    // Fallback to product image
    return product.images[0]?.src || null;
  }
  
  /**
   * Format a price in cents to a money string
   * @param {number} cents - The price in cents
   * @returns {string} - The formatted price
   */
  function formatMoney(cents) {
    const amount = (cents / 100).toFixed(2);
    return `$${amount}`;
  }
  
  /**
   * Add a variant to the cart
   * @param {string} variantId - The variant ID
   * @param {HTMLElement} button - The add to cart button
   */
  async function addToCart(variantId, button) {
    try {
      // Update button state
      const originalText = button.textContent;
      button.textContent = 'Adding...';
      button.disabled = true;
      
      // Add to cart via AJAX API
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: variantId,
          quantity: 1,
        }),
      });
      
      const data = await response.json();
      
      if (data.id) {
        // Success
        button.textContent = 'Added!';
        
        // Update cart count in the header
        updateCartCount();
        
        // Reset button after a delay
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
        }, 2000);
      } else {
        // Error
        button.textContent = 'Error';
        
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
        }, 2000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      button.textContent = 'Error';
      
      setTimeout(() => {
        button.textContent = 'Add to Cart';
        button.disabled = false;
      }, 2000);
    }
  }
  
  /**
   * Update the cart count in the header
   */
  async function updateCartCount() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      
      const cartCountElements = document.querySelectorAll('.cart-count, .cart-count-bubble');
      
      cartCountElements.forEach(element => {
        if (element.tagName === 'SPAN') {
          element.textContent = cart.item_count;
        } else {
          const countSpan = element.querySelector('span');
          if (countSpan) {
            countSpan.textContent = cart.item_count;
          }
        }
      });
    } catch (error) {
      console.error('Error updating cart count:', error);
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
