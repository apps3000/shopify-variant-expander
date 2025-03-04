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
} from '@shopify/polaris';
import { useAppBridge } from '@shopify/app-bridge-react';
import { authenticatedFetch } from '@shopify/app-bridge-utils';

const Collections = ({ setIsDirty }) => {
  const app = useAppBridge();
  const fetch = authenticatedFetch(app);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [collections, setCollections] = useState([]);
  const [enabledCollections, setEnabledCollections] = useState([]);
  const [originalEnabledCollections, setOriginalEnabledCollections] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Fetch collections on mount
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setIsLoading(true);
        
        // Fetch collections from Shopify
        const collectionsResponse = await fetch('/api/shop/collections');
        const collectionsData = await collectionsResponse.json();
        
        // Fetch enabled collections from settings
        const settingsResponse = await fetch('/api/shop/settings');
        const settingsData = await settingsResponse.json();
        
        const enabled = settingsData.settings.enabledCollections || [];
        
        setCollections(collectionsData.collections || []);
        setEnabledCollections(enabled);
        setOriginalEnabledCollections(enabled);
        setError(null);
      } catch (error) {
        console.error('Error fetching collections:', error);
        setError('Failed to load collections. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCollections();
  }, [fetch]);
  
  // Update isDirty state when enabledCollections change
  useEffect(() => {
    if (originalEnabledCollections) {
      const isDirty = JSON.stringify(enabledCollections) !== JSON.stringify(originalEnabledCollections);
      setIsDirty(isDirty);
    }
  }, [enabledCollections, originalEnabledCollections, setIsDirty]);
  
  const handleToggleCollection = useCallback((id) => {
    setEnabledCollections(prev => {
      if (prev.includes(id)) {
        return prev.filter(collectionId => collectionId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);
  
  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/shop/collections/enabled', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabledCollections }),
      });
      
      const data = await response.json();
      
      if (data.enabledCollections) {
        setOriginalEnabledCollections(data.enabledCollections);
        setEnabledCollections(data.enabledCollections);
        setShowToast(true);
        setError(null);
      } else {
        setError('Failed to save enabled collections. Please try again.');
      }
    } catch (error) {
      console.error('Error saving enabled collections:', error);
      setError('Failed to save enabled collections. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [fetch, enabledCollections]);
  
  const handleReset = useCallback(() => {
    if (originalEnabledCollections) {
      setEnabledCollections(originalEnabledCollections);
    }
  }, [originalEnabledCollections]);
  
  const handleSearchChange = useCallback((value) => {
    setSearchValue(value);
    setCurrentPage(1);
  }, []);
  
  const handleClearSearch = useCallback(() => {
    setSearchValue('');
    setCurrentPage(1);
  }, []);
  
  // Filter collections based on search value
  const filteredCollections = collections.filter(collection => 
    collection.title.toLowerCase().includes(searchValue.toLowerCase())
  );
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredCollections.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCollections = filteredCollections.slice(startIndex, startIndex + itemsPerPage);
  
  // Show loading state
  if (isLoading && collections.length === 0) {
    return (
      <Page title="Collections">
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Spinner size="large" color="teal" />
                <div style={{ marginTop: '1rem' }}>
                  <TextStyle variation="subdued">Loading collections...</TextStyle>
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }
  
  // Empty state when no collections
  if (!isLoading && collections.length === 0) {
    return (
      <Page title="Collections">
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <EmptyState
                heading="No collections found"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>You don't have any collections in your store yet.</p>
              </EmptyState>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }
  
  return (
    <Page
      title="Collections"
      primaryAction={{
        content: 'Save',
        onAction: handleSave,
        loading: isSaving,
        disabled: isLoading || JSON.stringify(enabledCollections) === JSON.stringify(originalEnabledCollections),
      }}
    >
      {error && (
        <Banner status="critical" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      )}
      
      {showToast && (
        <Toast content="Collections settings saved successfully" onDismiss={() => setShowToast(false)} />
      )}
      
      <Layout>
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
              resourceName={{ singular: 'collection', plural: 'collections' }}
              items={paginatedCollections}
              renderItem={(collection) => {
                const { id, title, handle } = collection;
                const isEnabled = enabledCollections.includes(id);
                
                return (
                  <ResourceList.Item id={id}>
                    <Stack alignment="center">
                      <Stack.Item fill>
                        <h3>
                          <TextStyle variation="strong">{title}</TextStyle>
                        </h3>
                        <div>
                          <TextStyle variation="subdued">/{handle}</TextStyle>
                        </div>
                      </Stack.Item>
                      <Stack.Item>
                        <Checkbox
                          label="Enable variant expander"
                          labelHidden
                          checked={isEnabled}
                          onChange={() => handleToggleCollection(id)}
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
            <Button onClick={handleReset} disabled={isLoading || isSaving}>
              Reset
            </Button>
            <Button primary onClick={handleSave} loading={isSaving} disabled={isLoading || JSON.stringify(enabledCollections) === JSON.stringify(originalEnabledCollections)}>
              Save
            </Button>
          </Stack>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default Collections;
