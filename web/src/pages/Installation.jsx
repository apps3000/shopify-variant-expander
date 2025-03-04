import React, { useEffect, useState, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  TextContainer,
  Heading,
  TextStyle,
  Banner,
  Button,
  Stack,
  Spinner,
} from '@shopify/polaris';
import { useAppBridge } from '@shopify/app-bridge-react';
import { authenticatedFetch } from '@shopify/app-bridge-utils';

const Installation = () => {
  const app = useAppBridge();
  const fetch = authenticatedFetch(app);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [appStatus, setAppStatus] = useState(null);
  const [error, setError] = useState(null);
  
  // Fetch app status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch('/api/admin/status');
        const data = await response.json();
        
        setAppStatus(data.status);
        setError(null);
      } catch (error) {
        console.error('Error fetching app status:', error);
        setError('Failed to load app status. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStatus();
  }, [fetch]);
  
  const handleInstallScript = useCallback(async () => {
    try {
      setIsInstalling(true);
      
      const response = await fetch('/api/admin/install-script', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refetch app status
        const statusResponse = await fetch('/api/admin/status');
        const statusData = await statusResponse.json();
        
        setAppStatus(statusData.status);
        setError(null);
      } else {
        setError('Failed to install script tag. Please try again.');
      }
    } catch (error) {
      console.error('Error installing script:', error);
      setError('Failed to install script tag. Please try again.');
    } finally {
      setIsInstalling(false);
    }
  }, [fetch]);
  
  const handleUninstallScript = useCallback(async () => {
    try {
      setIsUninstalling(true);
      
      const response = await fetch('/api/admin/uninstall-script', {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refetch app status
        const statusResponse = await fetch('/api/admin/status');
        const statusData = await statusResponse.json();
        
        setAppStatus(statusData.status);
        setError(null);
      } else {
        setError('Failed to uninstall script tag. Please try again.');
      }
    } catch (error) {
      console.error('Error uninstalling script:', error);
      setError('Failed to uninstall script tag. Please try again.');
    } finally {
      setIsUninstalling(false);
    }
  }, [fetch]);
  
  // Show loading state
  if (isLoading && !appStatus) {
    return (
      <Page title="Installation">
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Spinner size="large" color="teal" />
                <div style={{ marginTop: '1rem' }}>
                  <TextStyle variation="subdued">Loading installation status...</TextStyle>
                </div>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }
  
  return (
    <Page title="Installation">
      {error && (
        <Banner status="critical" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      )}
      
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <TextContainer>
              <Heading>App Installation</Heading>
              <p>
                The Variant Expander app requires a script to be installed on your Shopify store.
                This script enables the variant expansion functionality on your collection pages.
              </p>
              <p>
                Current Status: <TextStyle variation="strong">
                  {appStatus?.scriptTagInstalled ? 'Installed' : 'Not Installed'}
                </TextStyle>
              </p>
            </TextContainer>
            
            <div style={{ marginTop: '1rem' }}>
              {appStatus?.scriptTagInstalled ? (
                <Button
                  onClick={handleUninstallScript}
                  loading={isUninstalling}
                  destructive
                >
                  Uninstall Script
                </Button>
              ) : (
                <Button
                  onClick={handleInstallScript}
                  loading={isInstalling}
                  primary
                >
                  Install Script
                </Button>
              )}
            </div>
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          <Card sectioned title="Installation Instructions">
            <TextContainer>
              <p>
                Follow these steps to complete the installation:
              </p>
              <ol>
                <li>
                  <TextStyle variation="strong">Install the app script</TextStyle> using the button above
                </li>
                <li>
                  <TextStyle variation="strong">Configure settings</TextStyle> for the variant expander in the Settings page
                </li>
                <li>
                  <TextStyle variation="strong">Enable collections</TextStyle> where you want the variant expander to appear
                </li>
                <li>
                  <TextStyle variation="strong">Test the functionality</TextStyle> on your store's collection pages
                </li>
              </ol>
              <p>
                Note: The script will be automatically loaded on your store's collection pages.
                No theme modifications are required.
              </p>
            </TextContainer>
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          <Card sectioned title="Troubleshooting">
            <TextContainer>
              <p>
                If the variant expander is not working as expected, try these steps:
              </p>
              <ul>
                <li>Ensure the script is installed (check status above)</li>
                <li>Verify you've enabled the collections where you want to use the expander</li>
                <li>Clear your browser cache and reload the page</li>
                <li>Check if your theme has any custom collection page templates that might interfere</li>
              </ul>
              <p>
                If you're still experiencing issues, please contact support.
              </p>
            </TextContainer>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default Installation;
