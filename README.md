# Shopify Variant Expander

A comprehensive Shopify app that allows customers to view and add all product variants directly from collection pages, with advanced filtering, customization, and multi-device support.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.2.0-green.svg)

## Features

✨ **Enhanced Variant Display**
- Show variants directly on collection pages without redirecting
- Add to cart directly from the collection page
- Toggle between expanded and standard views

🎨 **Advanced Customization**
- Configure which collections and products have the variant expander
- Customize colors, sizes, and styling to match your theme
- Set different display modes for different device sizes

🔍 **Intelligent Option Filtering**
- Display only the primary option (e.g., just colors) on collection pages
- Two-step selection process (choose color, then size)
- Consistent experience across different product types

📱 **Device-Optimized Experience**
- Responsive layouts for desktop, tablet, and mobile
- Different display modes optimized for each device type
- Optional deactivation on specific viewport sizes

🌐 **Multi-Language Support**
- Fully localized interface in multiple languages
- Admin interface available in multiple languages
- Custom translation management

## How It Works

The app adds a "Show all variants" button to products on collection pages. When clicked, it displays all available variants (or a filtered selection based on your settings) without leaving the collection page.

![Flow Diagram](https://variant-expander.apps3000.ch/assets/flow-diagram.png)

## Screenshots

| Collection Page | Expanded Variants | Mobile View |
| --------------- | ----------------- | ----------- |
| ![Collection](https://variant-expander.apps3000.ch/assets/screenshot-collection.png) | ![Expanded](https://variant-expander.apps3000.ch/assets/screenshot-expanded.png) | ![Mobile](https://variant-expander.apps3000.ch/assets/screenshot-mobile.png) |

## Installation

### From the Shopify App Store

1. Visit the [Variant Expander page](https://apps.shopify.com/variant-expander) on the Shopify App Store
2. Click "Add app" and follow the installation process
3. Once installed, you'll be redirected to the app's admin dashboard

### Manual Installation

If you're developing or hosting the app yourself:

1. Clone this repository:
   ```bash
   git clone https://github.com/apps3000/shopify-variant-expander.git
   cd shopify-variant-expander
   ```

2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../web
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp server/.env.example server/.env
   ```
   Edit the `.env` file with your Shopify API credentials and other configuration.

4. Run the development servers:
   ```bash
   # In the server directory
   npm run dev

   # In the web directory (in a separate terminal)
   npm start
   ```

5. Create a Shopify Partner account and register a test app
6. Configure the app URLs to point to your development servers
7. Install the test app on a development store

## Configuration

After installation, you can configure the app through the admin dashboard:

### Basic Configuration

1. **Collection Selection**: Choose which collections should have the variant expander
2. **Product Selection**: Choose specific products or use tag-based selection
3. **Appearance**: Customize colors, sizes, and styling
4. **Variant Options**: Set which variant options to display (e.g., colors only)

### Advanced Configuration

1. **Device Settings**: Configure display mode for each device type
2. **Localization**: Set up translations and language preferences
3. **Performance Options**: Configure caching and loading behavior

## Developer Documentation

Comprehensive documentation is available for developers:

- [**Developer Guide**](docs/DEVELOPER.md): Architecture and code organization
- [**API Documentation**](docs/API.md): Backend API endpoints
- [**Theme Integration**](docs/THEME.md): Custom theme integration
- [**Performance Optimization**](docs/PERFORMANCE.md): Performance considerations
- [**Maintenance Guide**](docs/MAINTENANCE.md): Code maintenance guidelines
- [**DigitalOcean Deployment**](docs/DIGITALOCEAN_SETUP.md): Deployment instructions

## Technology Stack

- **Backend**: Node.js, Express, MongoDB
- **Frontend Admin**: React, Shopify Polaris
- **Store Frontend**: Vanilla JavaScript, CSS
- **Deployment**: Docker, Nginx
- **Shopify Integration**: OAuth, App Bridge, Theme App Extensions

## Frequently Asked Questions

**Q: Will this work with my theme?**  
A: Yes, the app is designed to work with all standard Shopify themes and most custom themes.

**Q: How does this affect page load speed?**  
A: The app is optimized for performance with lazy loading, efficient DOM manipulation, and minimal asset size. The script is loaded asynchronously and doesn't block rendering.

**Q: Can I customize the appearance?**  
A: Yes, you can customize colors, sizes, borders, and more through the admin dashboard.

**Q: Does this work on mobile?**  
A: Yes, the app has specific optimizations for mobile devices, including horizontal scrolling, dropdowns, or modal windows.

**Q: Will customers be able to see all variant options?**  
A: You can configure whether to show all variants or just specific options (like colors) on the collection page.

## Support

For questions, issues, or feature requests:

- **Email**: help@apps3000.ch
- **Support Portal**: https://variant-expander.apps3000.ch/support
- **Documentation**: https://variant-expander.apps3000.ch/docs

## Contributing

Contributions are welcome! Please check out our [contributing guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Shopify](https://shopify.dev/) - For their excellent developer platform
- [React](https://reactjs.org/) - For the frontend framework
- [Polaris](https://polaris.shopify.com/) - For the admin UI components
- [Express](https://expressjs.com/) - For the backend framework
- [MongoDB](https://www.mongodb.com/) - For the database
