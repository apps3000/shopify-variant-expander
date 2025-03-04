import React, { useEffect, useState, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  FormLayout,
  Select,
  Button,
  Stack,
  Banner,
  Toast,
  Checkbox,
  TextContainer,
  Heading,
  Icon,
  TextStyle,
  RangeSlider,
} from '@shopify/polaris';
import {
  MobileAcceptMajor,
  MobilePlusMajor,
  DesktopMajor,
} from '@shopify/polaris-icons';
import { useAppBridge } from '@shopify/app-bridge-react';
import { authenticatedFetch } from '@shopify/app-bridge-utils';

const ViewportSettings = ({ setIsDirty }) => {
  const app = useAppBridge();
  const fetch = authenticatedFetch(app);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewportSettings, setViewportSettings] = useState({
    enableOnMobile: true,
    enableOnTablet: true,
    enableOnDesktop: true,
    mobileDisplayMode: 'horizontal-scroll',
    tabletDisplayMode: 'grid',
    mobileColumnsCount: 1,
    tabletColumnsCount: 2,
    desktopColumnsCount: 3,
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
        
        if (data.settings && data.settings.viewportSettings) {
          setViewportSettings(data.settings.viewportSettings);
          setOriginalSettings(data.settings.viewportSettings);
        }
        
        setError(null);
      } catch (error) {
        console.error('Error fetching viewport settings:', error);
        setError('Failed to load viewport settings. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [fetch]);
  
  // Update isDirty state when settings change
  useEffect(() => {
    if (originalSettings) {
      const isDirty = JSON.stringify(viewportSettings) !== JSON.stringify(originalSettings);
      setIsDirty(isDirty);
    }
  }, [viewportSettings, originalSettings, setIsDirty]);
  
  const handleChange = useCallback((value, name) => {
    setViewportSettings(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/shop/viewport-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ viewportSettings }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOriginalSettings(viewportSettings);
        setShowToast(true);
        setError(null);
      } else {
        setError('Failed to save viewport settings. Please try again.');
      }
    } catch (error) {
      console.error('Error saving viewport settings:', error);
      setError('Failed to save viewport settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [fetch, viewportSettings]);
  
  const handleReset = useCallback(() => {
    if (originalSettings) {
      setViewportSettings(originalSettings);
    }
  }, [originalSettings]);
  
  const mobileDisplayOptions = [
    { label: 'Horizontal Scrolling', value: 'horizontal-scroll' },
    { label: 'Dropdown Menu', value: 'dropdown' },
    { label: 'Modal Window', value: 'modal' },
    { label: 'Grid (Not Recommended)', value: 'grid' },
  ];
  
  const tabletDisplayOptions = [
    { label: 'Grid', value: 'grid' },
    { label: 'Horizontal Scrolling', value: 'horizontal-scroll' },
  ];
  
  return (
    <Page
      title="Viewport Settings"
      primaryAction={{
        content: 'Save',
        onAction: handleSave,
        loading: isSaving,
        disabled: isLoading || JSON.stringify(viewportSettings) === JSON.stringify(originalSettings),
      }}
    >
      {error && (
        <Banner status="critical" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      )}
      
      {showToast && (
        <Toast content="Viewport settings saved successfully" onDismiss={() => setShowToast(false)} />
      )}
      
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <TextContainer>
              <Heading>Device-Specific Settings</Heading>
              <p>Control how the variant expander behaves on different devices. You can enable or disable the feature for specific viewport sizes and customize the display mode for each.</p>
            </TextContainer>
          </Card>
        </Layout.Section>
        
        <Layout.Section oneThird>
          <Card
            sectioned
            title={
              <Stack alignment="center" spacing="tight">
                <Icon source={MobileAcceptMajor} color="base" />
                <TextStyle variation="strong">Mobile Devices</TextStyle>
              </Stack>
            }
          >
            <FormLayout>
              <Checkbox
                label="Enable on mobile devices"
                checked={viewportSettings.enableOnMobile}
                onChange={(value) => handleChange(value, 'enableOnMobile')}
                helpText="Screen width below 768px"
              />
              
              {viewportSettings.enableOnMobile && (
                <>
                  <Select
                    label="Display Mode"
                    options={mobileDisplayOptions}
                    value={viewportSettings.mobileDisplayMode}
                    onChange={(value) => handleChange(value, 'mobileDisplayMode')}
                    helpText="Choose how variants are displayed on mobile"
                  />
                  
                  {viewportSettings.mobileDisplayMode === 'grid' && (
                    <RangeSlider
                      label="Grid Columns"
                      min={1}
                      max={2}
                      value={viewportSettings.mobileColumnsCount}
                      onChange={(value) => handleChange(value, 'mobileColumnsCount')}
                      output
                    />
                  )}
                </>
              )}
            </FormLayout>
          </Card>
        </Layout.Section>
        
        <Layout.Section oneThird>
          <Card
            sectioned
            title={
              <Stack alignment="center" spacing="tight">
                <Icon source={MobilePlusMajor} color="base" />
                <TextStyle variation="strong">Tablet Devices</TextStyle>
              </Stack>
            }
          >
            <FormLayout>
              <Checkbox
                label="Enable on tablet devices"
                checked={viewportSettings.enableOnTablet}
                onChange={(value) => handleChange(value, 'enableOnTablet')}
                helpText="Screen width between 768px and 1024px"
              />
              
              {viewportSettings.enableOnTablet && (
                <>
                  <Select
                    label="Display Mode"
                    options={tabletDisplayOptions}
                    value={viewportSettings.tabletDisplayMode}
                    onChange={(value) => handleChange(value, 'tabletDisplayMode')}
                    helpText="Choose how variants are displayed on tablets"
                  />
                  
                  {viewportSettings.tabletDisplayMode === 'grid' && (
                    <RangeSlider
                      label="Grid Columns"
                      min={1}
                      max={3}
                      value={viewportSettings.tabletColumnsCount}
                      onChange={(value) => handleChange(value, 'tabletColumnsCount')}
                      output
                    />
                  )}
                </>
              )}
            </FormLayout>
          </Card>
        </Layout.Section>
        
        <Layout.Section oneThird>
          <Card
            sectioned
            title={
              <Stack alignment="center" spacing="tight">
                <Icon source={DesktopMajor} color="base" />
                <TextStyle variation="strong">Desktop Devices</TextStyle>
              </Stack>
            }
          >
            <FormLayout>
              <Checkbox
                label="Enable on desktop devices"
                checked={viewportSettings.enableOnDesktop}
                onChange={(value) => handleChange(value, 'enableOnDesktop')}
                helpText="Screen width above 1024px"
              />
              
              {viewportSettings.enableOnDesktop && (
                <RangeSlider
                  label="Grid Columns"
                  min={2}
                  max={6}
                  value={viewportSettings.desktopColumnsCount}
                  onChange={(value) => handleChange(value, 'desktopColumnsCount')}
                  output
                  helpText="Number of variants per row on desktop"
                />
              )}
            </FormLayout>
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          <Card sectioned title="Responsive Behavior">
            <TextContainer>
              <p>
                <TextStyle variation="strong">Recommended Settings:</TextStyle>
              </p>
              <ul>
                <li>
                  <TextStyle variation="strong">Mobile:</TextStyle> Use horizontal scrolling or dropdown for the best user experience.
                </li>
                <li>
                  <TextStyle variation="strong">Tablet:</TextStyle> Use grid layout with 2-3 columns or horizontal scrolling.
                </li>
                <li>
                  <TextStyle variation="strong">Desktop:</TextStyle> Grid layout with 3-4 columns works best for most stores.
                </li>
              </ul>
              <p>
                If your products have many variants or complex options, consider disabling the variant expander on mobile devices 
                and directing customers to the product page for a better selection experience.
              </p>
            </TextContainer>
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
              disabled={isLoading || JSON.stringify(viewportSettings) === JSON.stringify(originalSettings)}
            >
              Save
            </Button>
          </Stack>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default ViewportSettings;
