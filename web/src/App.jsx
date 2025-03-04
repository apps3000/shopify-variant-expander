import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  AppProvider,
  Page,
  Frame,
  TopBar,
  Navigation,
  ContextualSaveBar,
  Loading,
} from '@shopify/polaris';
import {
  HomeMinor,
  SettingsMinor,
  CollectionsMajor,
  CodeMajor,
  ProductsMajor,
  ColorsMajor,
  MobileMajor,
  VariantMajor,
  TranslationMajor,
} from '@shopify/polaris-icons';
import { Provider as AppBridgeProvider, useAppBridge } from '@shopify/app-bridge-react';
import { authenticatedFetch } from '@shopify/app-bridge-utils';
import { QueryClient, QueryClientProvider } from 'react-query';

// Import pages
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Collections from './pages/Collections';
import Products from './pages/Products';
import Appearance from './pages/Appearance';
import ViewportSettings from './pages/ViewportSettings';
import VariantOptions from './pages/VariantOptions';
import Localization from './pages/Localization';
import Installation from './pages/Installation';

// Create a react-query client
const queryClient = new QueryClient();

// Create an axios client with authentication
const authenticatedAxios = axios => {
  const app = useAppBridge();
  
  return async (url, options = {}) => {
    const response = await authenticatedFetch(app)(url, options);
    
    if (response.headers.get('X-Shopify-API-Request-Failure-Reauthorize') === '1') {
      // Redirect to auth
      const authUrl = `/auth?shop=${app.hostOrigin.split('//')[1]}`;
      window.location.assign(authUrl);
      return null;
    }
    
    return {
      ...response,
      json: async () => response.json(),
    };
  };
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [shopData, setShopData] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState('home');
  const [isDirty, setIsDirty] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  // Get shop data on mount
  useEffect(() => {
    const getShopData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const shop = urlParams.get('shop');
        
        if (!shop) {
          console.error('No shop provided');
          return;
        }
        
        // TODO: Fetch shop data from API
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching shop data:', error);
        setIsLoading(false);
      }
    };
    
    getShopData();
  }, []);
  
  const handleSearchChange = useCallback(value => {
    setSearchValue(value);
  }, []);
  
  const handleSearchCancel = useCallback(() => {
    setSearchValue('');
  }, []);
  
  const handleNavigationSelect = useCallback(selectedItem => {
    setSelectedMenu(selectedItem);
    
    if (isDirty) {
      // Handle unsaved changes
      // TODO: Show a confirmation dialog
    }
  }, [isDirty]);
  
  const handleSave = useCallback(() => {
    // TODO: Save changes
    setIsDirty(false);
  }, []);
  
  const handleDiscard = useCallback(() => {
    // TODO: Discard changes
    setIsDirty(false);
  }, []);
  
  // Set up the navigation items
  const navigationItems = [
    {
      label: 'Home',
      icon: HomeMinor,
      url: '/',
      selected: selectedMenu === 'home',
      onAction: () => handleNavigationSelect('home'),
    },
    {
      label: 'Collections',
      icon: CollectionsMajor,
      url: '/collections',
      selected: selectedMenu === 'collections',
      onAction: () => handleNavigationSelect('collections'),
    },
    {
      label: 'Products',
      icon: ProductsMajor,
      url: '/products',
      selected: selectedMenu === 'products',
      onAction: () => handleNavigationSelect('products'),
    },
    {
      label: 'Variant Options',
      icon: VariantMajor,
      url: '/variant-options',
      selected: selectedMenu === 'variant-options',
      onAction: () => handleNavigationSelect('variant-options'),
    },
    {
      label: 'Appearance',
      icon: ColorsMajor,
      url: '/appearance',
      selected: selectedMenu === 'appearance',
      onAction: () => handleNavigationSelect('appearance'),
    },
    {
      label: 'Viewport Settings',
      icon: MobileMajor,
      url: '/viewport-settings',
      selected: selectedMenu === 'viewport-settings',
      onAction: () => handleNavigationSelect('viewport-settings'),
    },
    {
      label: 'Localization',
      icon: TranslationMajor,
      url: '/localization',
      selected: selectedMenu === 'localization',
      onAction: () => handleNavigationSelect('localization'),
    },
    {
      label: 'Settings',
      icon: SettingsMinor,
      url: '/settings',
      selected: selectedMenu === 'settings',
      onAction: () => handleNavigationSelect('settings'),
    },
    {
      label: 'Installation',
      icon: CodeMajor,
      url: '/installation',
      selected: selectedMenu === 'installation',
      onAction: () => handleNavigationSelect('installation'),
    },
  ];
  
  // Set up the top bar
  const topBarMarkup = (
    <TopBar
      searchField={
        <TopBar.SearchField
          placeholder="Search"
          value={searchValue}
          onChange={handleSearchChange}
          onCancel={handleSearchCancel}
        />
      }
    />
  );
  
  // Set up the contextual save bar
  const contextualSaveBarMarkup = isDirty ? (
    <ContextualSaveBar
      message="Unsaved changes"
      saveAction={{
        onAction: handleSave,
        loading: false,
        disabled: false,
      }}
      discardAction={{
        onAction: handleDiscard,
        loading: false,
        disabled: false,
      }}
    />
  ) : null;
  
  // Show loading state
  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loading />
      </div>
    );
  }
  
  return (
    <Frame
      topBar={topBarMarkup}
      navigation={<Navigation items={navigationItems} />}
      showMobileNavigation={false}
      contextualSaveBar={contextualSaveBarMarkup}
    >
      <Routes>
        <Route path="/" element={<Dashboard setIsDirty={setIsDirty} />} />
        <Route path="/settings" element={<Settings setIsDirty={setIsDirty} />} />
        <Route path="/collections" element={<Collections setIsDirty={setIsDirty} />} />
        <Route path="/products" element={<Products setIsDirty={setIsDirty} />} />
        <Route path="/variant-options" element={<VariantOptions setIsDirty={setIsDirty} />} />
        <Route path="/appearance" element={<Appearance setIsDirty={setIsDirty} />} />
        <Route path="/viewport-settings" element={<ViewportSettings setIsDirty={setIsDirty} />} />
        <Route path="/localization" element={<Localization setIsDirty={setIsDirty} />} />
        <Route path="/installation" element={<Installation />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Frame>
  );
}

// Wrap the app with providers
export default function AppWrapper() {
  const urlParams = new URLSearchParams(window.location.search);
  const shop = urlParams.get('shop');
  
  if (!shop) {
    return <div>Shop parameter is required</div>;
  }
  
  const config = {
    apiKey: process.env.SHOPIFY_API_KEY,
    host: shop,
    forceRedirect: true,
  };
  
  return (
    <BrowserRouter>
      <AppBridgeProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <AppProvider i18n={{}}>
            <App />
          </AppProvider>
        </QueryClientProvider>
      </AppBridgeProvider>
    </BrowserRouter>
  );
}
