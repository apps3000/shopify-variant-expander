import React, { useEffect, useState, useCallback } from 'react';
import {
  Page,
  Layout,
  Card,
  Tabs,
  Select,
  Button,
  Stack,
  Banner,
  Toast,
  ResourceList,
  TextStyle,
  TextField,
  EmptyState,
  Modal,
  List,
} from '@shopify/polaris';
import { useAppBridge } from '@shopify/app-bridge-react';
import { authenticatedFetch } from '@shopify/app-bridge-utils';

const Localization = ({ setIsDirty }) => {
  const app = useAppBridge();
  const fetch = authenticatedFetch(app);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Localization settings
  const [localizationSettings, setLocalizationSettings] = useState({
    defaultLocale: 'en',
    supportedLocales: ['en'],
  });
  const [originalSettings, setOriginalSettings] = useState(null);
  
  // Translation data
  const [availableLocales, setAvailableLocales] = useState([]);
  const [translations, setTranslations] = useState({});
  const [defaultTranslations, setDefaultTranslations] = useState({});
  const [originalTranslations, setOriginalTranslations] = useState({});
  const [currentLocale, setCurrentLocale] = useState('en');
  
  // Modal for adding a locale
  const [addLocaleModalOpen, setAddLocaleModalOpen] = useState(false);
  const [localeToAdd, setLocaleToAdd] = useState('');
  
  // Fetch settings and available locales on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch shop's localization settings
        const settingsResponse = await fetch('/api/localization/shop/settings');
        const settingsData = await settingsResponse.json();
        
        // Fetch available locales
        const localesResponse = await fetch('/api/localization/supported-locales');
        const localesData = await localesResponse.json();
        
        setLocalizationSettings(settingsData);
        setOriginalSettings(JSON.parse(JSON.stringify(settingsData)));
        setAvailableLocales(localesData.locales);
        
        // Set current locale to the default
        const defaultLocale = settingsData.defaultLocale || 'en';
        setCurrentLocale(defaultLocale);
        
        // Fetch translations for the default locale
        await fetchTranslations(defaultLocale);
        
        setError(null);
      } catch (error) {
        console.error('Error fetching localization data:', error);
        setError('Failed to load localization settings. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [fetch]);
  
  // Fetch translations for a locale
  const fetchTranslations = useCallback(async (locale) => {
    try {
      // Fetch shop's translations for this locale
      const translationsResponse = await fetch(`/api/localization/shop/translations/${locale}`);
      const translationsData = await translationsResponse.json();
      
      // Fetch default translations for this locale
      const defaultTranslationsResponse = await fetch(`/api/localization/default-translations/${locale}`);
      const defaultTranslationsData = await defaultTranslationsResponse.json();
      
      setTranslations(translationsData.translations);
      setOriginalTranslations(JSON.parse(JSON.stringify(translationsData.translations)));
      setDefaultTranslations(defaultTranslationsData.translations);
      
      return translationsData.translations;
    } catch (error) {
      console.error('Error fetching translations:', error);
      setError('Failed to load translations. Please try refreshing the page.');
      return {};
    }
  }, [fetch]);
  
  // Update isDirty state when settings or translations change
  useEffect(() => {
    const isSettingsDirty = JSON.stringify(localizationSettings) !== JSON.stringify(originalSettings);
    const isTranslationsDirty = JSON.stringify(translations) !== JSON.stringify(originalTranslations);
    
    setIsDirty(isSettingsDirty || isTranslationsDirty);
  }, [localizationSettings, originalSettings, translations, originalTranslations, setIsDirty]);
  
  const handleTabChange = useCallback((selectedTabIndex) => {
    setSelected(selectedTabIndex);
  }, []);
  
  const handleLocaleChange = useCallback(async (locale) => {
    setCurrentLocale(locale);
    await fetchTranslations(locale);
  }, [fetchTranslations]);
  
  const handleTranslationChange = useCallback((key, value) => {
    setTranslations(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);
  
  const handleSaveTranslations = useCallback(async () => {
    try {
      setIsSaving(true);
      
      // Save translations
      const response = await fetch(`/api/localization/shop/translations/${currentLocale}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ translations }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOriginalTranslations(JSON.parse(JSON.stringify(translations)));
        setToastMessage('Translations saved successfully');
        setShowToast(true);
        setError(null);
      } else {
        setError('Failed to save translations. Please try again.');
      }
    } catch (error) {
      console.error('Error saving translations:', error);
      setError('Failed to save translations. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [fetch, currentLocale, translations]);
  
  const handleSaveDefaultLocale = useCallback(async () => {
    try {
      setIsSaving(true);
      
      // Save default locale
      const response = await fetch('/api/localization/shop/default-locale', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale: localizationSettings.defaultLocale }),
      });
      
      const data = await response.json();
      
      setLocalizationSettings(prev => ({
        ...prev,
        defaultLocale: data.defaultLocale,
        supportedLocales: data.supportedLocales,
      }));
      
      setOriginalSettings(prev => ({
        ...prev,
        defaultLocale: data.defaultLocale,
      }));
      
      setToastMessage('Default locale saved successfully');
      setShowToast(true);
      setError(null);
    } catch (error) {
      console.error('Error saving default locale:', error);
      setError('Failed to save default locale. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [fetch, localizationSettings.defaultLocale]);
  
  const handleAddLocale = useCallback(async () => {
    if (!localeToAdd) return;
    
    try {
      setIsSaving(true);
      
      // Add supported locale
      const response = await fetch('/api/localization/shop/supported-locales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale: localeToAdd }),
      });
      
      const data = await response.json();
      
      setLocalizationSettings(prev => ({
        ...prev,
        supportedLocales: data.supportedLocales,
      }));
      
      setOriginalSettings(prev => ({
        ...prev,
        supportedLocales: data.supportedLocales,
      }));
      
      setAddLocaleModalOpen(false);
      setLocaleToAdd('');
      setToastMessage('Locale added successfully');
      setShowToast(true);
      setError(null);
    } catch (error) {
      console.error('Error adding locale:', error);
      setError('Failed to add locale. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [fetch, localeToAdd]);
  
  const handleRemoveLocale = useCallback(async (locale) => {
    if (locale === localizationSettings.defaultLocale) {
      setError('Cannot remove default locale. Set a different default locale first.');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Remove supported locale
      const response = await fetch(`/api/localization/shop/supported-locales/${locale}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      setLocalizationSettings(prev => ({
        ...prev,
        supportedLocales: data.supportedLocales,
      }));
      
      setOriginalSettings(prev => ({
        ...prev,
        supportedLocales: data.supportedLocales,
      }));
      
      // If we removed the current locale, switch to default
      if (currentLocale === locale) {
        setCurrentLocale(localizationSettings.defaultLocale);
        await fetchTranslations(localizationSettings.defaultLocale);
      }
      
      setToastMessage('Locale removed successfully');
      setShowToast(true);
      setError(null);
    } catch (error) {
      console.error('Error removing locale:', error);
      setError('Failed to remove locale. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [fetch, currentLocale, localizationSettings.defaultLocale, fetchTranslations]);
  
  const handleResetToDefault = useCallback(() => {
    setTranslations(JSON.parse(JSON.stringify(defaultTranslations)));
  }, [defaultTranslations]);
  
  const tabs = [
    {
      id: 'locales',
      content: 'Locales',
      accessibilityLabel: 'Locale settings',
      panelID: 'locales-panel',
    },
    {
      id: 'translations',
      content: 'Translations',
      accessibilityLabel: 'Translations editor',
      panelID: 'translations-panel',
    },
  ];
  
  // Get supported locale options for select
  const getSupportedLocaleOptions = () => {
    return availableLocales
      .filter(locale => localizationSettings.supportedLocales.includes(locale.code))
      .map(locale => ({
        label: `${locale.name} (${locale.code})`,
        value: locale.code,
      }));
  };
  
  // Get available locale options for adding
  const getAvailableLocaleOptions = () => {
    return availableLocales
      .filter(locale => !localizationSettings.supportedLocales.includes(locale.code))
      .map(locale => ({
        label: `${locale.name} (${locale.code})`,
        value: locale.code,
      }));
  };
  
  return (
    <Page
      title="Localization"
      primaryAction={{
        content: 'Save',
        onAction: selected === 0 ? handleSaveDefaultLocale : handleSaveTranslations,
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
        <Toast content={toastMessage} onDismiss={() => setShowToast(false)} />
      )}
      
      <Layout>
        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange} />
            
            {selected === 0 && (
              <Card.Section>
                <Stack vertical spacing="loose">
                  <Select
                    label="Default Language"
                    options={getSupportedLocaleOptions()}
                    value={localizationSettings.defaultLocale}
                    onChange={value => setLocalizationSettings(prev => ({ ...prev, defaultLocale: value }))}
                    helpText="The default language used when a customer's preferred language is not available"
                  />
                  
                  <div>
                    <Stack distribution="spaceBetween">
                      <TextStyle variation="strong">Supported Languages</TextStyle>
                      <Button size="slim" onClick={() => setAddLocaleModalOpen(true)}>
                        Add language
                      </Button>
                    </Stack>
                    
                    {localizationSettings.supportedLocales.length > 0 ? (
                      <ResourceList
                        resourceName={{ singular: 'locale', plural: 'locales' }}
                        items={localizationSettings.supportedLocales.map(code => {
                          const locale = availableLocales.find(l => l.code === code);
                          return {
                            id: code,
                            name: locale ? locale.name : code,
                            code,
                          };
                        })}
                        renderItem={(item) => {
                          const { id, name, code } = item;
                          const isDefault = code === localizationSettings.defaultLocale;
                          
                          return (
                            <ResourceList.Item
                              id={id}
                              accessibilityLabel={`${name} language`}
                            >
                              <Stack alignment="center">
                                <Stack.Item fill>
                                  <TextStyle variation="strong">{name}</TextStyle>
                                  <div>
                                    <TextStyle variation="subdued">{code}</TextStyle>
                                    {isDefault && (
                                      <span style={{ marginLeft: '8px' }}>
                                        <TextStyle variation="positive">(Default)</TextStyle>
                                      </span>
                                    )}
                                  </div>
                                </Stack.Item>
                                {!isDefault && (
                                  <Stack.Item>
                                    <Button
                                      outline
                                      size="slim"
                                      destructive
                                      onClick={() => handleRemoveLocale(code)}
                                    >
                                      Remove
                                    </Button>
                                  </Stack.Item>
                                )}
                              </Stack>
                            </ResourceList.Item>
                          );
                        }}
                      />
                    ) : (
                      <EmptyState
                        heading="No languages configured"
                        action={{ content: 'Add language', onAction: () => setAddLocaleModalOpen(true) }}
                      >
                        <p>Add languages to support multiple regions for your customers.</p>
                      </EmptyState>
                    )}
                  </div>
                </Stack>
              </Card.Section>
            )}
            
            {selected === 1 && (
              <Card.Section>
                <Stack vertical spacing="loose">
                  <Select
                    label="Select Language to Edit"
                    options={getSupportedLocaleOptions()}
                    value={currentLocale}
                    onChange={handleLocaleChange}
                    helpText="Edit translations for a specific language"
                  />
                  
                  <div style={{ marginTop: '16px' }}>
                    <Stack distribution="spaceBetween">
                      <TextStyle variation="strong">Translation Keys</TextStyle>
                      <Button
                        size="slim"
                        onClick={handleResetToDefault}
                        disabled={isLoading || isSaving}
                      >
                        Reset to defaults
                      </Button>
                    </Stack>
                    
                    <div style={{ marginTop: '16px' }}>
                      {Object.keys(defaultTranslations).length > 0 ? (
                        Object.keys(defaultTranslations).map(key => (
                          <div key={key} style={{ marginBottom: '16px' }}>
                            <TextField
                              label={key}
                              value={translations[key] || ''}
                              onChange={value => handleTranslationChange(key, value)}
                              helpText={`Default: "${defaultTranslations[key]}"`}
                            />
                          </div>
                        ))
                      ) : (
                        <EmptyState heading="No translation keys available">
                          <p>There are no translation keys defined for this language.</p>
                        </EmptyState>
                      )}
                    </div>
                  </div>
                </Stack>
              </Card.Section>
            )}
          </Card>
        </Layout.Section>
        
        <Layout.Section>
          <Card sectioned title="How Localization Works">
            <List>
              <List.Item>
                Configure which languages your variant expander should support
              </List.Item>
              <List.Item>
                Set a default language that will be used when a customer's preferred language is not available
              </List.Item>
              <List.Item>
                Customize translations for each supported language
              </List.Item>
              <List.Item>
                The app will automatically detect the customer's language preference from their browser
              </List.Item>
            </List>
          </Card>
        </Layout.Section>
      </Layout>
      
      {/* Modal for adding a locale */}
      <Modal
        open={addLocaleModalOpen}
        onClose={() => setAddLocaleModalOpen(false)}
        title="Add Language"
        primaryAction={{
          content: 'Add',
          onAction: handleAddLocale,
          loading: isSaving,
          disabled: !localeToAdd,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setAddLocaleModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <Select
            label="Select a language to add"
            options={getAvailableLocaleOptions()}
            value={localeToAdd}
            onChange={setLocaleToAdd}
            helpText="Choose a language to add to your supported languages"
          />
        </Modal.Section>
      </Modal>
    </Page>
  );
};

export default Localization;
