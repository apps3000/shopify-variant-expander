# Shopify Variant Expander - Developer Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Backend Components](#backend-components)
4. [Frontend Components](#frontend-components)
5. [Shopify Integration](#shopify-integration)
6. [Configuration System](#configuration-system)
7. [Translation & Localization](#translation--localization)
8. [Authentication Flow](#authentication-flow)
9. [Data Model](#data-model)
10. [Performance Considerations](#performance-considerations)
11. [Extension Points](#extension-points)
12. [Debugging](#debugging)
13. [Testing](#testing)
14. [Deployment](#deployment)

## Architecture Overview

The Shopify Variant Expander app follows a modular architecture with clear separation of concerns:

```
┌─────────────────┐    ┌───────────────┐    ┌─────────────────┐
│ Shopify Store   │<-->│ App Backend   │<-->│ Admin Dashboard │
└─────────────────┘    └───────────────┘    └─────────────────┘
        △                      △
        │                      │
        ▼                      ▼
┌─────────────────┐    ┌───────────────┐    
│ Theme Extension │    │ MongoDB       │    
└─────────────────┘    └───────────────┘    
```

The key components are:
- **Backend Server**: Node.js with Express, handles API requests, authentication, and data processing
- **Admin Dashboard**: React application for store configuration
- **Theme Integration**: JavaScript that runs on the Shopify store frontend
- **Database**: MongoDB for persistent storage of app settings and shop data

## Project Structure

```
shopify-variant-expander/
├── server/                  # Backend Node.js application
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helper functions
│   │   └── index.js         # Server entry point
│   ├── .env.example         # Environment variables template
│   ├── package.json         # Backend dependencies
│   └── Dockerfile           # Backend Docker configuration
├── web/                     # Frontend React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # App pages
│   │   ├── services/        # API clients
│   │   ├── utils/           # Helper functions
│   │   ├── App.jsx          # Main React component
│   │   └── index.jsx        # Frontend entry point
│   ├── package.json         # Frontend dependencies
│   └── Dockerfile           # Frontend Docker configuration
├── theme-app-extension/     # Shopify Theme App Extension
│   ├── assets/              # JavaScript and CSS files
│   ├── blocks/              # Block definitions
│   └── extension.json       # Extension configuration
├── docker-compose.yml       # Docker services orchestration
└── README.md                # Project documentation
```

## Backend Components

### Models

The data layer is built on MongoDB with the following primary models:

- **Shop**: Stores Shopify shop information and application settings
- **Localization**: Manages translations and supported languages
- **Log**: Application logs and error tracking (optional)

### Services

Business logic is encapsulated in service modules:

- **AuthService**: Handles Shopify OAuth authentication
- **ShopService**: Manages shop data and settings
- **TranslationService**: Localization and translation management
- **AdminService**: Admin-only operations

### Routes

API endpoints are organized by resource:

- **/auth**: Authentication endpoints
- **/api/shop**: Shop-specific settings
- **/api/admin**: Admin management
- **/api/localization**: Translation management
- **/api/public**: Public endpoints for the store frontend

### Middleware

- **Auth**: Shopify JWT verification
- **AdminAuth**: Admin dashboard authentication
- **ErrorHandler**: Centralized error processing
- **Logging**: Request/response logging

## Frontend Components

### Admin Dashboard

The dashboard is built with React and Shopify Polaris, providing the following features:

- **Dashboard**: Overview of app status and usage statistics
- **Collections/Products**: Selection of items for variant expansion
- **Variant Options**: Configuration of which variant options to display
- **Appearance**: Customization of design elements
- **Viewport Settings**: Device-specific display options
- **Localization**: Translation management
- **Settings**: General app settings
- **Installation**: Installation and setup guidance

### Client-Side Script

The variant expander JavaScript that runs on collection pages:

- **VariantExpander**: Main class for managing variant display
- **Event Handlers**: User interaction processing
- **DOM Manipulation**: Dynamic content generation
- **API Integration**: Communication with Shopify APIs

## Shopify Integration

### Authentication Flow

The app uses Shopify OAuth for authentication:

1. Merchant clicks install button
2. Redirect to Shopify auth page
3. Shopify redirects back with authorization code
4. App exchanges code for permanent access token
5. Token stored in database for future API calls

### App Embedding

The app integrates with Shopify in two ways:

1. **Admin Dashboard**: Embedded admin page within Shopify admin
2. **Theme App Extension**: JavaScript injected into collection pages

### API Usage

The app interacts with several Shopify APIs:

- **REST Admin API**: Access shop data, products, collections
- **StorefrontAPI**: Public access to product data
- **Ajax API**: Client-side product and cart manipulation

## Configuration System

The app uses a hierarchical configuration system:

1. **Default Configuration**: Hardcoded defaults
2. **Global Settings**: Applies to all products
3. **Collection-Specific**: Overrides for specific collections
4. **Product-Specific**: Highest priority, per-product settings

Configuration is stored in the Shop model and passed to the frontend script.

## Translation & Localization

The app supports full internationalization:

- **Backend**: Translation strings stored in MongoDB
- **Admin UI**: Interface for managing translations
- **Frontend**: Dynamic language detection and text substitution
- **Default Languages**: English, French, German, Spanish

## Authentication Flow

### Shopify OAuth

```
┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐
│ Merchant│     │ App    │     │ Shopify│     │ App    │     │ App DB │
└────┬───┘     └────┬───┘     └────┬───┘     └────┬───┘     └────┬───┘
     │              │              │              │              │
     │ Install App  │              │              │              │
     │─────────────>│              │              │              │
     │              │ Redirect to  │              │              │
     │              │ Auth         │              │              │
     │              │─────────────>│              │              │
     │              │              │ Auth Screen  │              │
     │              │              │<─────────────│              │
     │              │              │              │              │
     │              │              │ Auth Grant   │              │
     │              │              │─────────────>│              │
     │              │              │              │ Exchange for │
     │              │              │              │ Access Token │
     │              │              │              │─────────────>│
     │              │              │              │              │
     │              │              │              │ Store Token  │
     │              │              │              │<─────────────│
     │              │              │              │              │
```

### Admin Authentication

The app uses JWT-based authentication for admin access:

1. Admin logs in with credentials
2. Server validates credentials and issues JWT
3. JWT includes admin privileges
4. Token used for subsequent admin API requests

## Data Model

### Shop Schema

```javascript
{
  shopDomain: String,            // Primary identifier
  accessToken: String,           // Shopify access token
  scope: String,                 // Granted permissions
  isActive: Boolean,             // Installation status
  settings: {
    // Various settings like display options,
    // collection/product selections, etc.
  },
  installedAt: Date,
  updatedAt: Date
}
```

### Localization Schema

```javascript
{
  shopId: ObjectId,              // Reference to Shop
  shopDomain: String,
  defaultLocale: String,         // e.g., 'en'
  supportedLocales: [String],    // e.g., ['en', 'fr', 'de']
  translations: Map<String, Map<String, String>>,
  createdAt: Date,
  updatedAt: Date
}
```

## Performance Considerations

### Backend Optimizations

- **Caching**: API responses cached where appropriate
- **Database Indexing**: Proper indexes on frequently queried fields
- **Request Batching**: Grouped requests for related resources
- **Connection Pooling**: MongoDB connection optimization
- **Rate Limiting**: Prevent overuse of API resources

### Frontend Optimizations

- **Lazy Loading**: Images load only when visible
- **DOM Batching**: Group DOM operations for better performance
- **Debouncing**: Limit frequency of event-driven operations
- **Asynchronous Loading**: Non-blocking script loading
- **Minimal Reflows**: Carefully structured DOM modifications
- **Memory Management**: Clean up event listeners and observers

## Extension Points

The app is designed for extensibility in several areas:

1. **New Display Modes**: Add alternative ways to display variants
2. **Additional Customization Options**: Extend the settings model
3. **Analytics Integration**: Hook into user interactions
4. **Theme-Specific Optimizations**: Detect and adapt to specific themes
5. **Enhanced Filtering**: More sophisticated variant filtering logic

## Debugging

### Backend Debugging

- **Logging Levels**: Configure detail level in `.env`
- **Request Tracing**: Unique IDs for following request flows
- **Error Telemetry**: Error reporting to monitoring service
- **Environment Variables**: `DEBUG=variant-expander:*` for detailed logs

### Frontend Debugging

- **Developer Mode**: Set `window.variantExpanderDebug = true` in console
- **Verbose Logging**: Check browser console for detailed flow
- **Element Inspection**: Components have descriptive class names
- **Event Monitoring**: All user interactions are logged in debug mode

## Testing

### Unit Tests

- **Backend**: Jest for service and utility testing
- **Frontend**: React Testing Library for component tests

### Integration Tests

- **API Tests**: Supertest for endpoint validation
- **OAuth Flow**: Simulated authentication process

### E2E Tests

- **Cypress**: Full end-to-end testing of shop integration
- **Visual Testing**: Visual regression for UI components

## Deployment

### Docker-based Deployment

The main deployment approach is Docker-based:

1. Build Docker images for server and web
2. Push to registry (e.g., Docker Hub)
3. Deploy with docker-compose or Kubernetes

### Manual Deployment

For environments without Docker:

1. Install Node.js and MongoDB
2. Clone repository
3. Run `npm install` in server and web directories
4. Configure environment variables
5. Run `npm run build` for production build
6. Start with process manager (e.g., PM2)

See the [DigitalOcean Setup Guide](./DIGITALOCEAN_SETUP.md) for detailed deployment instructions.
