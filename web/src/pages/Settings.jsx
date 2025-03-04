import React, { useEffect, useState, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  FormLayout,
  TextField,
  Select,
  Button,
  Stack,
  Checkbox,
  Banner,
  SkeletonBodyText,
  Toast,
} from '@shopify/polaris';
import { useAppBridge } from '@shopify/app-bridge-react';
import { authenticatedFetch } from '@shopify/app-bridge-utils';

const Settings = ({ setIsDirty }) => {
  const app = useAppBridge();
  const fetch = authenticatedFetch(app);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    buttonText: 'Show all variants',
    collapseButtonText: 'Hide variants',
    displayImages: true,
    showPrice: true,
    showInventory: false,
    cardStyle: 'standard',
  });
  const [originalSettings, setOriginalSettings] = useState(null);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  
  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch('/api/shop/settings');
        const data = await response.json();
        
        if (data.settings) {
          setSettings(data.settings);
          setOriginalSettings(data.settings);
        }
        
        setError(null);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setError('Failed to load settings. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [fetch]);
  
  // Update isDirty state when settings change
  useEffect(() => {
    if (originalSettings) {
      const isDirty = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      setIsDirty(isDirty);
    }
  }, [settings, originalSettings, setIsDirty]);
  
  const handleChange = useCallback((value, name) => {
    setSettings(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/shop/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });
      
      const data = await response.json();
      
      if (data.settings) {
        setOriginalSettings(data.settings);
        setSettings(data.settings);
        setShowToast(true);
        setError(null);
      } else {
        setError('Failed to save settings. Please try again.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [fetch, settings]);
  
  const handleReset = useCallback(() => {
    if (originalSettings) {
      setSettings(originalSettings);
    }
  }, [originalSettings]);
  
  const cardStyleOptions = [
    { label: 'Compact', value: 'compact' },
    { label: 'Standard', value: 'standard' },
    { label: 'Detailed', value: 'detailed' },
  ];
  
  // Show loading state
  if (isLoading && !settings) {
    return (
      <Page title="Settings">
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <SkeletonBodyText lines={6} />
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }
  
  return (
    <Page
      title="Settings"
      primaryAction={{
        content: 'Save',
        onAction: handleSave,
        loading: isSaving,
        disabled: isLoading || JSON.stringify(settings) === JSON.stringify(originalSettings),
      }}
    >
      {error && (
        <Banner status="critical" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      )}
      
      {showToast && (
        <Toast content="Settings saved successfully" onDismiss={() => setShowToast(false)} />
      )}
      
      <Layout>
        <Layout.Section>
          <Card sectioned title="Display Settings">
            <FormLayout>
              <TextField
                label="Show Variants Button Text"
                value={settings.buttonText}
                onChange={value => handleChange(value, 'buttonText')}
                disabled={isLoading}
              />
              
              <TextField
                label="Hide Variants Button Text"
                value={settings.collapseButtonText}
                onChange={value => handleChange(value, 'collapseButtonText')}
                disabled={isLoading}
              />
              
              <Select
                label="Card Style"
                options={cardStyleOptions}
                value={settings.cardStyle}
                onChange={value => handleChange(value, 'cardStyle')}
                disabled={isLoading}
              />
              
              <Checkbox
                label="Display variant images"
                checked={settings.displayImages}
                onChange={value => handleChange(value, 'displayImages')}
                disabled={isLoading}
              />
              
              <Checkbox
                label="Show price on variant cards"
                checked={settings.showPrice}
                onChange={value => handleChange(value, 'showPrice')}
                disabled={isLoading}
              />
              
              <Checkbox
                label="Show inventory status"
                checked={settings.showInventory}
                onChange={value => handleChange(value, 'showInventory')}
                disabled={isLoading}
                helpText="Displays available/sold out status on variant cards"
              />
            </FormLayout>
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          <Stack distribution="trailing">
            <Button onClick={handleReset} disabled={isLoading || isSaving}>
              Reset
            </Button>
            <Button primary onClick={handleSave} loading={isSaving} disabled={isLoading || JSON.stringify(settings) === JSON.stringify(originalSettings)}>
              Save
            </Button>
          </Stack>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default Settings;
