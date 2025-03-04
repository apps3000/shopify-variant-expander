import React, { useEffect, useState, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  ResourceList,
  Filters,
  TextStyle,
  Checkbox,
  Button,
  Stack,
  Banner,
  Spinner,
  EmptyState,
  Toast,
  Pagination,
  TextField,
  Select,
  Tag,
  ButtonGroup,
} from '@shopify/polaris';
import { useAppBridge } from '@shopify/app-bridge-react';
import { authenticatedFetch } from '@shopify/app-bridge-utils';

const Products = ({ setIsDirty }) => {
  const app = useAppBridge();
  const fetch = authenticatedFetch(app);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [enabledProducts, setEnabledProducts] = useState([]);
  const [originalEnabledProducts, setOriginalEnabledProducts] = useState([]);
  const [enabledTags, setEnabledTags] = useState([]);
  const [originalEnabledTags, setOriginalEnabledTags] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectionMode, setSelectionMode] = useState('specific-products');
  const [originalSelectionMode, setOriginalSelectionMode] = useState('specific-products');
  const [tagInput, setTagInput] = useState('');
  const [allTags, setAllTags] = useState([]);
  
  // Fetch products and settings on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch products from Shopify
        const productsResponse = await fetch('/api/admin/products');
        const productsData = await productsResponse.json();
        
        // Fetch settings
        const settingsResponse = await fetch('/api/shop/settings');
        const settingsData = await settingsResponse.json();
        
        const enabled = settingsData.settings.enabledProducts || [];
        const tagList = settingsData.settings.enabledTags || [];
        const mode = settingsData.settings.selectionMode || 'specific-products';
        
        // Extract all unique tags from products
        const tags = new Set();
        productsData.products.forEach(product => {
          if (product.tags) {
            product.tags.split(',').forEach(tag => {
              const trimmedTag = tag.trim();
              if (trimmedTag) tags.add(trimmedTag);
            });
          }
        });
        
        setProducts(productsData.products || []);
        setAllTags(Array.from(tags).sort());
        setEnabledProducts(enabled);
        setOriginalEnabledProducts(enabled);
        setEnabledTags(tagList);
        setOriginalEnabledTags(tagList);
        setSelectionMode(mode);
        setOriginalSelectionMode(mode);
        setError(null);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [fetch]);
  
  // Update isDirty state when selections change
  useEffect(() => {
    const isDirty = JSON.stringify(enabledProducts) !== JSON.stringify(originalEnabledProducts) ||
                   JSON.stringify(enabledTags) !== JSON.stringify(originalEnabledTags) ||
                   selectionMode !== originalSelectionMode;
    setIsDirty(isDirty);
  }, [enabledProducts, originalEnabledProducts, enabledTags, originalEnabledTags, selectionMode, originalSelectionMode, setIsDirty]);
  
  const handleToggleProduct = useCallback((id) => {
    setEnabledProducts(prev => {
      if (prev.includes(id)) {
        return prev.filter(productId => productId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);
  
  const handleAddTag = useCallback(() => {
    if (tagInput && !enabledTags.includes(tagInput)) {
      setEnabledTags(prev => [...prev, tagInput]);
      setTagInput('');
    }
  }, [tagInput, enabledTags]);
  
  const handleRemoveTag = useCallback((tag) => {
    setEnabledTags(prev => prev.filter(t => t !== tag));
  }, []);
  
  const handleSuggestedTagClick = useCallback((tag) => {
    if (!enabledTags.includes(tag)) {
      setEnabledTags(prev => [...prev, tag]);
    }
  }, [enabledTags]);
  
  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/shop/selection', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectionMode,
          enabledProducts,
          enabledTags,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOriginalSelectionMode(selectionMode);
        setOriginalEnabledProducts(enabledProducts);
        setOriginalEnabledTags(enabledTags);
        setShowToast(true);
        setError(null);
      } else {
        setError('Failed to save selection settings. Please try again.');
      }
    } catch (error) {
      console.error('Error saving product selection:', error);
      setError('Failed to save selection settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [fetch, selectionMode, enabledProducts, enabledTags]);
  
  const handleReset = useCallback(() => {
    setSelectionMode(originalSelectionMode);
    setEnabledProducts(originalEnabledProducts);
    setEnabledTags(originalEnabledTags);
  }, [originalSelectionMode, originalEnabledProducts, originalEnabledTags]);
  
  const handleSearchChange = useCallback((value) => {
    setSearchValue(value);
    setCurrentPage(1);
  }, []);
  
  const handleClearSearch = useCallback(() => {
    setSearchValue('');
    setCurrentPage(1);
  }, []);
  
  const handleSelectionModeChange = useCallback((value) => {
    setSelectionMode(value);
  }, []);
  
  // Filter products based on search value
  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(searchValue.toLowerCase()) ||
    (product.tags && product.tags.toLowerCase().includes(searchValue.toLowerCase()))
  );
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  
  // Available sugested tags (limited to 10)
  const suggestedTags = allTags
    .filter(tag => !enabledTags.includes(tag))
    .filter(tag => tag.toLowerCase().includes(tagInput.toLowerCase()))
    .slice(0, 10);
  
  const selectionModeOptions = [
    { label: 'All Products', value: 'all' },
    { label: 'Specific Collections', value: 'specific-collections' },
    { label: 'Specific Products', value: 'specific-products' },
    { label: 'By Tags', value: 'tags' },
  ];
  
  // Show loading state
  if (isLoading && products.length === 0) {
    return (
      <Page title="Product Selection">
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Spinner size="large" color="teal" />
                <div style={{ marginTop: '1rem' }}>
                  <TextStyle variation="subdued">Loading products...</TextStyle>
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }
  
  // Empty state when no products
  if (!isLoading && products.length === 0) {
    return (
      <Page title="Product Selection">
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <EmptyState
                heading="No products found"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>You don't have any products in your store yet.</p>
              </EmptyState>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }
  
  return (
    <Page
      title="Product Selection"
      primaryAction={{
        content: 'Save',
        onAction: handleSave,
        loading: isSaving,
        disabled: isLoading || (
          JSON.stringify(enabledProducts) === JSON.stringify(originalEnabledProducts) &&
          JSON.stringify(enabledTags) === JSON.stringify(originalEnabledTags) &&
          selectionMode === originalSelectionMode
        ),
      }}
    >
      {error && (
        <Banner status="critical" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      )}
      
      {showToast && (
        <Toast content="Product selection saved successfully" onDismiss={() => setShowToast(false)} />
      )}
      
      <Layout>
        <Layout.Section>
          <Card sectioned title="Selection Mode">
            <Select
              label="Choose how to enable the variant expander"
              options={selectionModeOptions}
              value={selectionMode}
              onChange={handleSelectionModeChange}
              helpText="Select which products should have the variant expander enabled"
            />
          </Card>
        </Layout.Section>
        
        {selectionMode === 'tags' && (
          <Layout.Section>
            <Card sectioned title="Tag Selection">
              <Stack vertical>
                <TextField
                  label="Add tags"
                  value={tagInput}
                  onChange={setTagInput}
                  helpText="Products with these tags will have the variant expander enabled"
                  connectedRight={
                    <Button onClick={handleAddTag} disabled={!tagInput}>Add</Button>
                  }
                />
                
                {enabledTags.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <TextStyle variation="strong">Enabled Tags:</TextStyle>
                    <div style={{ marginTop: '0.5rem' }}>
                      <Stack>
                        {enabledTags.map(tag => (
                          <Tag key={tag} onRemove={() => handleRemoveTag(tag)}>{tag}</Tag>
                        ))}
                      </Stack>
                    </div>
                  </div>
                )}
                
                {suggestedTags.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <TextStyle variation="strong">Suggested Tags:</TextStyle>
                    <div style={{ marginTop: '0.5rem' }}>
                      <Stack>
                        {suggestedTags.map(tag => (
                          <Button key={tag} plain onClick={() => handleSuggestedTagClick(tag)}>
                            {tag}
                          </Button>
                        ))}
                      </Stack>
                    </div>
                  </div>
                )}
              </Stack>
            </Card>
          </Layout.Section>
        )}
        
        {selectionMode === 'specific-products' && (
          <>
            <Layout.Section>
              <Card>
                <Card.Section>
                  <Filters
                    queryValue={searchValue}
                    filters={[]}
                    onQueryChange={handleSearchChange}
                    onQueryClear={handleClearSearch}
                    onClearAll={handleClearSearch}
                  />
                </Card.Section>
                
                <ResourceList
                  resourceName={{ singular: 'product', plural: 'products' }}
                  items={paginatedProducts}
                  renderItem={(product) => {
                    const { id, title, handle, tags } = product;
                    const isEnabled = enabledProducts.includes(id);
                    
                    return (
                      <ResourceList.Item id={id}>
                        <Stack alignment="center">
                          <Stack.Item fill>
                            <h3>
                              <TextStyle variation="strong">{title}</TextStyle>
                            </h3>
                            <div>
                              <TextStyle variation="subdued">/{handle}</TextStyle>
                              {tags && (
                                <div style={{ marginTop: '0.25rem' }}>
                                  <TextStyle variation="subdued">Tags: {tags}</TextStyle>
                                </div>
                              )}
                            </div>
                          </Stack.Item>
                          <Stack.Item>
                            <Checkbox
                              label="Enable variant expander"
                              labelHidden
                              checked={isEnabled}
                              onChange={() => handleToggleProduct(id)}
                            />
                          </Stack.Item>
                        </Stack>
                      </ResourceList.Item>
                    );
                  }}
                />
                
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
                <ButtonGroup>
                  <Button onClick={handleReset} disabled={isLoading || isSaving}>
                    Reset
                  </Button>
                  <Button 
                    primary 
                    onClick={handleSave} 
                    loading={isSaving} 
                    disabled={isLoading || (
                      JSON.stringify(enabledProducts) === JSON.stringify(originalEnabledProducts) &&
                      JSON.stringify(enabledTags) === JSON.stringify(originalEnabledTags) &&
                      selectionMode === originalSelectionMode
                    )}
                  >
                    Save
                  </Button>
                </ButtonGroup>
              </Stack>
            </Layout.Section>
          </>
        )}
        
        {selectionMode !== 'specific-products' && selectionMode !== 'tags' && (
          <Layout.Section>
            <Card sectioned>
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                {selectionMode === 'all' ? (
                  <p>The variant expander will be enabled for all products in your store.</p>
                ) : (
                  <p>Please go to the Collections page to select specific collections.</p>
                )}
              </div>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
};

export default Products;
