import React, { useEffect, useState } from 'react';
import {
  Page,
  Layout,
  Card,
  TextContainer,
  Heading,
  TextStyle,
  Button,
  Stack,
  Banner,
  SkeletonBodyText,
  SkeletonDisplayText,
} from '@shopify/polaris';
import { useAppBridge } from '@shopify/app-bridge-react';
import { authenticatedFetch } from '@shopify/app-bridge-utils';

const Dashboard = ({ setIsDirty }) => {
  const app = useAppBridge();
  const fetch = authenticatedFetch(app);
  
  const [isLoading, setIsLoading] = useState(true);
  const [shopInfo, setShopInfo] = useState(null);
  const [appStatus, setAppStatus] = useState(null);
  const [installError, setInstallError] = useState(null);
  
  // Fetch shop and app status on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch shop info
        const shopResponse = await fetch('/api/admin/shop');
        const shopData = await shopResponse.json();
        
        // Fetch app status
        const statusResponse = await fetch('/api/admin/status');
        const statusData = await statusResponse.json();
        
        setShopInfo(shopData.shop);
        setAppStatus(statusData.status);
        setInstallError(null);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setInstallError('Failed to load app data. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [fetch]);
  
  const handleInstallScript = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/install-script', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refetch app status
        const statusResponse = await fetch('/api/admin/status');
        const statusData = await statusResponse.json();
        
        setAppStatus(statusData.status);
        setInstallError(null);
      } else {
        setInstallError('Failed to install script tag. Please try again.');
      }
    } catch (error) {
      console.error('Error installing script:', error);
      setInstallError('Failed to install script tag. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUninstallScript = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/admin/uninstall-script', {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refetch app status
        const statusResponse = await fetch('/api/admin/status');
        const statusData = await statusResponse.json();
        
        setAppStatus(statusData.status);
        setInstallError(null);
      } else {
        setInstallError('Failed to uninstall script tag. Please try again.');
      }
    } catch (error) {
      console.error('Error uninstalling script:', error);
      setInstallError('Failed to uninstall script tag. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Show loading state
  if (isLoading && !shopInfo && !appStatus) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <SkeletonDisplayText size="small" />
              <SkeletonBodyText lines={4} />
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card sectioned>
              <SkeletonDisplayText size="small" />
              <SkeletonBodyText lines={2} />
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }
  
  return (
    <Page title="Dashboard">
      {installError && (
        <Banner status="critical" onDismiss={() => setInstallError(null)}>
          {installError}
        </Banner>
      )}
      
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <TextContainer>
              <Heading>Welcome to Variant Expander</Heading>
              <p>
                This app allows your customers to view all product variants directly on collection pages.
                Follow these steps to get started:
              </p>
              <ol>
                <li>Install the app script (if not already installed)</li>
                <li>Configure which collections should show variant expanders</li>
                <li>Customize the appearance and behavior in the Settings</li>
              </ol>
            </TextContainer>
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          <Card sectioned title="Store Information">
            {shopInfo && (
              <TextContainer>
                <p>
                  <TextStyle variation="strong">Store Name:</TextStyle> {shopInfo.name}
                </p>
                <p>
                  <TextStyle variation="strong">Domain:</TextStyle> {shopInfo.domain}
                </p>
                <p>
                  <TextStyle variation="strong">Plan:</TextStyle> {shopInfo.plan}
                </p>
              </TextContainer>
            )}
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          <Card sectioned title="App Status">
            {appStatus && (
              <>
                <TextContainer>
                  <p>
                    <TextStyle variation="strong">Status:</TextStyle>{' '}
                    {appStatus.isActive ? 'Active' : 'Inactive'}
                  </p>
                  <p>
                    <TextStyle variation="strong">Script Tag:</TextStyle>{' '}
                    {appStatus.scriptTagInstalled ? 'Installed' : 'Not installed'}
                  </p>
                  <p>
                    <TextStyle variation="strong">Last Updated:</TextStyle>{' '}
                    {new Date(appStatus.lastUpdated).toLocaleString()}
                  </p>
                </TextContainer>
                
                <div style={{ marginTop: '1rem' }}>
                  <Stack distribution="trailing">
                    {appStatus.scriptTagInstalled ? (
                      <Button onClick={handleUninstallScript} loading={isLoading} destructive>
                        Uninstall Script
                      </Button>
                    ) : (
                      <Button onClick={handleInstallScript} loading={isLoading} primary>
                        Install Script
                      </Button>
                    )}
                  </Stack>
                </div>
              </>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default Dashboard;
