import React, { useEffect, useState, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  Select,
  Button,
  Stack,
  Banner,
  Toast,
  Tabs,
  ResourceList,
  TextStyle,
  ResourceItem,
  Filters,
  TextField,
  EmptyState,
  Spinner,
  Pagination,
  SkeletonBodyText,
  Badge,
  Collapsible,
  TextContainer,
  Heading,
} from '@shopify/polaris';
import { ChevronDownMinor, ChevronUpMinor } from '@shopify/polaris-icons';
import { useAppBridge } from '@shopify/app-bridge-react';
import { authenticatedFetch } from '@shopify/app-bridge-utils';

const VariantOptions = ({ setIsDirty }) => {
  const app = useAppBridge();
  const fetch = authenticatedFetch(app);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  
  // Options data
  const [globalSettings, setGlobalSettings] = useState({
    defaultDisplayMode: 'all-variants',
    defaultPrimaryOption: 'Color',
  });
  const [originalGlobalSettings, setOriginalGlobalSettings] = useState(null);
  
  // Collections and products data
  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);
  const [productOptions, setProductOptions] = useState({});
  const [productOptionTypes, setProductOptionTypes] = useState({});
  const [collectionOptions, setCollectionOptions] = useState({});
  const [originalProductOptions, setOriginalProductOptions] = useState({});
  const [originalCollectionOptions, setOriginalCollectionOptions] = useState({});
  
  // Expanded items tracking
  const [expandedProducts, setExpandedProducts] = useState([]);
  const [expandedCollections, setExpandedCollections] = useState([]);
  
  // Fetch settings and data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch variant option settings from server
        const settingsResponse = await fetch('/api/shop/variant-options');
        const settingsData = await settingsResponse.json();
        
        if (settingsData.success) {
          // Set global settings
          setGlobalSettings({
            defaultDisplayMode: settingsData.optionSettings.defaultDisplayMode || 'all-variants',
            defaultPrimaryOption: settingsData.optionSettings.defaultPrimaryOption || 'Color',
          });
          setOriginalGlobalSettings({
            defaultDisplayMode: settingsData.optionSettings.defaultDisplayMode || 'all-variants',
            defaultPrimaryOption: settingsData.optionSettings.defaultPrimaryOption || 'Color',
          });
          
          // Set product-specific options
          const productOpts = {};
          if (settingsData.optionSettings.productSpecificOptions) {
            Object.entries(settingsData.optionSettings.productSpecificOptions).forEach(([id, options]) => {
              productOpts[id] = options;
            });
          }
          setProductOptions(productOpts);
          setOriginalProductOptions(JSON.parse(JSON.stringify(productOpts)));
          
          // Set collection-specific options
          const collectionOpts = {};
          if (settingsData.optionSettings.collectionSpecificOptions) {
            Object.entries(settingsData.optionSettings.collectionSpecificOptions).forEach(([id, options]) => {
              collectionOpts[id] = options;
            });
          }
          setCollectionOptions(collectionOpts);
          setOriginalCollectionOptions(JSON.parse(JSON.stringify(collectionOpts)));
        }
        
        // Fetch collections
        const collectionsResponse = await fetch('/api/shop/collections');
        const collectionsData = await collectionsResponse.json();
        setCollections(collectionsData.collections || []);
        
        // Fetch products with their option types
        const productsResponse = await fetch('/api/admin/products-with-options');
        const productsData = await productsResponse.json();
        setProducts(productsData.products || []);
        
        // Organize product option types
        const optionTypes = {};
        productsData.products.forEach(product => {
          if (product.options && product.options.length > 0) {
            optionTypes[product.id] = product.options;
          }
        });
        setProductOptionTypes(optionTypes);
        
        setError(null);
      } catch (error) {
        console.error('Error fetching variant option settings:', error);
        setError('Failed to load variant option settings. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [fetch]);
  
  // Update isDirty state when settings change
  useEffect(() => {
    if (originalGlobalSettings) {
      const isGlobalDirty = JSON.stringify(globalSettings) !== JSON.stringify(originalGlobalSettings);
      const isProductDirty = JSON.stringify(productOptions) !== JSON.stringify(originalProductOptions);
      const isCollectionDirty = JSON.stringify(collectionOptions) !== JSON.stringify(originalCollectionOptions);
      
      setIsDirty(isGlobalDirty || isProductDirty || isCollectionDirty);
    }
  }, [globalSettings, originalGlobalSettings, productOptions, originalProductOptions, collectionOptions, originalCollectionOptions, setIsDirty]);
  
  const handleTabChange = useCallback((selectedTabIndex) => {
    setSelected(selectedTabIndex);
    setCurrentPage(1);
  }, []);
  
  const handleSearchChange = useCallback((value) => {
    setSearchValue(value);
    setCurrentPage(1);
  }, []);
  
  const handleClearSearch = useCallback(() => {
    setSearchValue('');
    setCurrentPage(1);
  }, []);
  
  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      
      // Prepare data for API
      const optionSettings = {
        defaultDisplayMode: globalSettings.defaultDisplayMode,
        defaultPrimaryOption: globalSettings.defaultPrimaryOption,
        productSpecificOptions: productOptions,
        collectionSpecificOptions: collectionOptions,
      };
      
      // Save settings to server
      const response = await fetch('/api/shop/variant-options', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ optionSettings }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update original settings to match current settings
        setOriginalGlobalSettings(JSON.parse(JSON.stringify(globalSettings)));
        setOriginalProductOptions(JSON.parse(JSON.stringify(productOptions)));
        setOriginalCollectionOptions(JSON.parse(JSON.stringify(collectionOptions)));
        setShowToast(true);
        setError(null);
      } else {
        setError('Failed to save variant option settings. Please try again.');
      }
    } catch (error) {
      console.error('Error saving variant option settings:', error);
      setError('Failed to save variant option settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [fetch, globalSettings, productOptions, collectionOptions]);
  
  const handleReset = useCallback(() => {
    // Reset all settings to original values
    if (originalGlobalSettings) {
      setGlobalSettings(JSON.parse(JSON.stringify(originalGlobalSettings)));
    }
    
    if (originalProductOptions) {
      setProductOptions(JSON.parse(JSON.stringify(originalProductOptions)));
    }
    
    if (originalCollectionOptions) {
      setCollectionOptions(JSON.parse(JSON.stringify(originalCollectionOptions)));
    }
  }, [originalGlobalSettings, originalProductOptions, originalCollectionOptions]);
  
  const handleGlobalSettingChange = useCallback((value, field) => {
    setGlobalSettings(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const handleProductOptionChange = useCallback((productId, field, value) => {
    setProductOptions(prev => {
      const updatedOptions = { ...prev };
      
      if (!updatedOptions[productId]) {
        updatedOptions[productId] = {
          displayMode: field === 'displayMode' ? value : 'primary-option',
          primaryOption: field === 'primaryOption' ? value : 'Color',
        };
      } else {
        updatedOptions[productId] = {
          ...updatedOptions[productId],
          [field]: value,
        };
      }
      
      return updatedOptions;
    });
  }, []);
  
  const handleCollectionOptionChange = useCallback((collectionId, field, value) => {
    setCollectionOptions(prev => {
      const updatedOptions = { ...prev };
      
      if (!updatedOptions[collectionId]) {
        updatedOptions[collectionId] = {
          displayMode: field === 'displayMode' ? value : 'primary-option',
          primaryOption: field === 'primaryOption' ? value : 'Color',
        };
      } else {
        updatedOptions[collectionId] = {
          ...updatedOptions[collectionId],
          [field]: value,
        };
      }
      
      return updatedOptions;
    });
  }, []);
  
  const toggleProductExpand = useCallback((productId) => {
    setExpandedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  }, []);
  
  const toggleCollectionExpand = useCallback((collectionId) => {
    setExpandedCollections(prev => {
      if (prev.includes(collectionId)) {
        return prev.filter(id => id !== collectionId);
      } else {
        return [...prev, collectionId];
      }
    });
  }, []);
  
  // Filter products or collections based on search
  const getFilteredItems = useCallback(() => {
    if (selected === 0) { // Products tab
      return products.filter(product => 
        product.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        (product.tags && product.tags.toLowerCase().includes(searchValue.toLowerCase()))
      );
    } else { // Collections tab
      return collections.filter(collection => 
        collection.title.toLowerCase().includes(searchValue.toLowerCase())
      );
    }
  }, [selected, products, collections, searchValue]);
  
  const filteredItems = getFilteredItems();
  
  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);
  
  // Display mode options
  const displayModeOptions = [
    { label: 'All Variants (Show everything)', value: 'all-variants' },
    { label: 'Primary Option Only (e.g., just Colors)', value: 'primary-option' },
    { label: 'Grouped Options (Two-step selection)', value: 'grouped-options' },
  ];
  
  // Common option types for Shopify
  const commonOptionTypes = ['Color', 'Size', 'Material', 'Style', 'Title'];
  
  // Determine if we have valid option types to display
  const hasValidOptions = Object.values(productOptionTypes).some(options => options && options.length > 0);
  
  // Tabs for products vs collections
  const tabs = [
    {
      id: 'products',
      content: 'Products',
      accessibilityLabel: 'Product-specific variant options',
      panelID: 'products-panel',
    },
    {
      id: 'collections',
      content: 'Collections',
      accessibilityLabel: 'Collection-specific variant options',
      panelID: 'collections-panel',
    },
  ];
  
  // Helper to render option badges
  const renderOptionBadges = (options) => {
    if (!options || !Array.isArray(options)) return null;
    
    return (
      <Stack spacing="tight">
        {options.map((option, index) => (
          <Badge key={index} status={index === 0 ? 'success' : 'default'}>
            {option.name}
          </Badge>
        ))}
      </Stack>
    );
  };
  
  // Get primary option select options for a product
  const getPrimaryOptionChoices = (productId) => {
    const options = productOptionTypes[productId];
    
    if (!options || !Array.isArray(options) || options.length === 0) {
      return commonOptionTypes.map(type => ({ label: type, value: type }));
    }
    
    return options.map(option => ({
      label: option.name,
      value: option.name,
    }));
  };
  
  // Render loading state
  if (isLoading && !hasValidOptions) {
    return (
      <Page title="Variant Options Settings">
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Spinner size="large" color="teal" />
                <div style={{ marginTop: '1rem' }}>
                  <TextStyle variation="subdued">Loading variant options...</TextStyle>
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }
  
  return (
    <Page
      title="Variant Options Settings"
      primaryAction={{
        content: 'Save',
        onAction: handleSave,
        loading: isSaving,
        disabled: isLoading,
      }}
    >
      {error && (
        <Banner status="critical" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      )}
      
      {showToast && (
        <Toast content="Variant option settings saved successfully" onDismiss={() => setShowToast(false)} />
      )}
      
      <Layout>
        {/* Explanation card */}
        <Layout.Section>
          <Card sectioned>
            <TextContainer>
              <Heading>Optimize Variant Display</Heading>
              <p>
                For products with multiple option types (like color AND size), you can choose which options to display 
                in the variant expander. This is especially useful for products with many variants.
              </p>
              <p>
                <strong>Example:</strong> For a t-shirt with colors and sizes, you can choose to only show the different colors 
                on the collection page, and let customers select the size after clicking on a color variant.
              </p>
            </TextContainer>
          </Card>
        </Layout.Section>
        
        {/* Global settings */}
        <Layout.Section>
          <Card sectioned title="Default Settings">
            <Stack vertical spacing="loose">
              <Select
                label="Default Display Mode"
                options={displayModeOptions}
                value={globalSettings.defaultDisplayMode}
                onChange={(value) => handleGlobalSettingChange(value, 'defaultDisplayMode')}
                helpText="This setting applies to all products unless overridden"
              />
              
              {(globalSettings.defaultDisplayMode === 'primary-option' || 
                globalSettings.defaultDisplayMode === 'grouped-options') && (
                <Select
                  label="Default Primary Option"
                  options={commonOptionTypes.map(type => ({ label: type, value: type }))}
                  value={globalSettings.defaultPrimaryOption}
                  onChange={(value) => handleGlobalSettingChange(value, 'defaultPrimaryOption')}
                  helpText="The option type to display first (typically Color)"
                />
              )}
            </Stack>
          </Card>
        </Layout.Section>
        
        {/* Product/Collection specific settings */}
        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange} />
            <Card.Section>
              <Filters
                queryValue={searchValue}
                filters={[]}
                onQueryChange={handleSearchChange}
                onQueryClear={handleClearSearch}
                onClearAll={handleClearSearch}
              />
            </Card.Section>
            
            <div style={{ padding: '16px' }}>
              {selected === 0 && ( // Products tab
                <>
                  {paginatedItems.length === 0 ? (
                    <EmptyState
                      heading="No products found"
                      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                    >
                      <p>Try changing your search terms</p>
                    </EmptyState>
                  ) : (
                    <ResourceList
                      resourceName={{ singular: 'product', plural: 'products' }}
                      items={paginatedItems}
                      renderItem={(product) => {
                        const { id, title, handle, options } = product;
                        const isExpanded = expandedProducts.includes(id);
                        const hasOptions = productOptionTypes[id] && productOptionTypes[id].length > 1;
                        const productSetting = productOptions[id] || {};
                        
                        return (
                          <ResourceItem
                            id={id}
                            accessibilityLabel={`View details for ${title}`}
                            onClick={() => toggleProductExpand(id)}
                          >
                            <Stack alignment="center">
                              <Stack.Item fill>
                                <h3>
                                  <TextStyle variation="strong">{title}</TextStyle>
                                </h3>
                                <div style={{ marginTop: '4px' }}>
                                  {hasOptions ? (
                                    renderOptionBadges(productOptionTypes[id])
                                  ) : (
                                    <TextStyle variation="subdued">
                                      No multiple options detected
                                    </TextStyle>
                                  )}
                                </div>
                              </Stack.Item>
                              {hasOptions && (
                                <Stack.Item>
                                  {isExpanded ? (
                                    <Button icon={ChevronUpMinor} plain />
                                  ) : (
                                    <Button icon={ChevronDownMinor} plain />
                                  )}
                                </Stack.Item>
                              )}
                            </Stack>
                            
                            <Collapsible open={isExpanded && hasOptions}>
                              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                                <Stack vertical spacing="tight">
                                  <Select
                                    label="Display Mode"
                                    options={displayModeOptions}
                                    value={productSetting.displayMode || globalSettings.defaultDisplayMode}
                                    onChange={(value) => handleProductOptionChange(id, 'displayMode', value)}
                                  />
                                  
                                  {(productSetting.displayMode === 'primary-option' || 
                                    (productSetting.displayMode === undefined && globalSettings.defaultDisplayMode === 'primary-option') || 
                                    productSetting.displayMode === 'grouped-options' || 
                                    (productSetting.displayMode === undefined && globalSettings.defaultDisplayMode === 'grouped-options')) && (
                                    <Select
                                      label="Primary Option"
                                      options={getPrimaryOptionChoices(id)}
                                      value={productSetting.primaryOption || globalSettings.defaultPrimaryOption}
                                      onChange={(value) => handleProductOptionChange(id, 'primaryOption', value)}
                                      helpText="The option type to display first (typically Color)"
                                    />
                                  )}
                                </Stack>
                              </div>
                            </Collapsible>
                          </ResourceItem>
                        );
                      }}
                    />
                  )}
                </>
              )}
              
              {selected === 1 && ( // Collections tab
                <>
                  {paginatedItems.length === 0 ? (
                    <EmptyState
                      heading="No collections found"
                      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                    >
                      <p>Try changing your search terms</p>
                    </EmptyState>
                  ) : (
                    <ResourceList
                      resourceName={{ singular: 'collection', plural: 'collections' }}
                      items={paginatedItems}
                      renderItem={(collection) => {
                        const { id, title, handle } = collection;
                        const isExpanded = expandedCollections.includes(id);
                        const collectionSetting = collectionOptions[id] || {};
                        
                        return (
                          <ResourceItem
                            id={id}
                            accessibilityLabel={`View details for ${title}`}
                            onClick={() => toggleCollectionExpand(id)}
                          >
                            <Stack alignment="center">
                              <Stack.Item fill>
                                <h3>
                                  <TextStyle variation="strong">{title}</TextStyle>
                                </h3>
                                <div style={{ marginTop: '4px' }}>
                                  <TextStyle variation="subdued">/{handle}</TextStyle>
                                </div>
                              </Stack.Item>
                              <Stack.Item>
                                {isExpanded ? (
                                  <Button icon={ChevronUpMinor} plain />
                                ) : (
                                  <Button icon={ChevronDownMinor} plain />
                                )}
                              </Stack.Item>
                            </Stack>
                            
                            <Collapsible open={isExpanded}>
                              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                                <Stack vertical spacing="tight">
                                  <Select
                                    label="Display Mode"
                                    options={displayModeOptions}
                                    value={collectionSetting.displayMode || globalSettings.defaultDisplayMode}
                                    onChange={(value) => handleCollectionOptionChange(id, 'displayMode', value)}
                                  />
                                  
                                  {(collectionSetting.displayMode === 'primary-option' || 
                                    (collectionSetting.displayMode === undefined && globalSettings.defaultDisplayMode === 'primary-option') || 
                                    collectionSetting.displayMode === 'grouped-options' || 
                                    (collectionSetting.displayMode === undefined && globalSettings.defaultDisplayMode === 'grouped-options')) && (
                                    <Select
                                      label="Primary Option"
                                      options={commonOptionTypes.map(type => ({ label: type, value: type }))}
                                      value={collectionSetting.primaryOption || globalSettings.defaultPrimaryOption}
                                      onChange={(value) => handleCollectionOptionChange(id, 'primaryOption', value)}
                                      helpText="The option type to display by default for this collection"
                                    />
                                  )}
                                </Stack>
                              </div>
                            </Collapsible>
                          </ResourceItem>
                        );
                      }}
                    />
                  )}
                </>
              )}
            </div>
            
            {totalPages > 1 && (
              <Card.Section>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Pagination
                    hasPrevious={currentPage > 1}
                    onPrevious={() => setCurrentPage(prev => prev - 1)}
                    hasNext={currentPage < totalPages}
                    onNext={() => setCurrentPage(prev => prev + 1)}
                  />
                </div>
              </Card.Section>
            )}
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          <Stack distribution="trailing">
            <Button onClick={handleReset} disabled={isLoading || isSaving}>
              Reset
            </Button>
            <Button 
              primary 
              onClick={handleSave} 
              loading={isSaving} 
              disabled={isLoading}
            >
              Save
            </Button>
          </Stack>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default VariantOptions;
