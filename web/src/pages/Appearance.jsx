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
  Banner,
  Toast,
  RangeSlider,
  ColorPicker,
  hsbToRgb,
  rgbToHsb,
  rgbToHex,
  hexToRgb,
} from '@shopify/polaris';
import { useAppBridge } from '@shopify/app-bridge-react';
import { authenticatedFetch } from '@shopify/app-bridge-utils';

const Appearance = ({ setIsDirty }) => {
  const app = useAppBridge();
  const fetch = authenticatedFetch(app);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [styles, setStyles] = useState({
    addToCartButtonColor: '#2c6ecb',
    addToCartButtonTextColor: '#ffffff',
    cardWidth: '200px',
    cardPadding: '10px',
    borderColor: '#eeeeee',
    borderRadius: '4px',
  });
  const [originalStyles, setOriginalStyles] = useState(null);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  
  // Color state objects for color pickers
  const [buttonColor, setButtonColor] = useState({
    hue: 0,
    brightness: 0,
    saturation: 0,
  });
  
  const [buttonTextColor, setButtonTextColor] = useState({
    hue: 0,
    brightness: 1,
    saturation: 0,
  });
  
  const [borderColorHsb, setBorderColorHsb] = useState({
    hue: 0,
    brightness: 0.93,
    saturation: 0,
  });
  
  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch('/api/shop/settings');
        const data = await response.json();
        
        if (data.settings && data.settings.styles) {
          setStyles(data.settings.styles);
          setOriginalStyles(data.settings.styles);
          
          // Initialize color pickers
          if (data.settings.styles.addToCartButtonColor) {
            const rgb = hexToRgb(data.settings.styles.addToCartButtonColor);
            if (rgb) {
              setButtonColor(rgbToHsb(rgb));
            }
          }
          
          if (data.settings.styles.addToCartButtonTextColor) {
            const rgb = hexToRgb(data.settings.styles.addToCartButtonTextColor);
            if (rgb) {
              setButtonTextColor(rgbToHsb(rgb));
            }
          }
          
          if (data.settings.styles.borderColor) {
            const rgb = hexToRgb(data.settings.styles.borderColor);
            if (rgb) {
              setBorderColorHsb(rgbToHsb(rgb));
            }
          }
        }
        
        setError(null);
      } catch (error) {
        console.error('Error fetching appearance settings:', error);
        setError('Failed to load appearance settings. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [fetch]);
  
  // Update isDirty state when settings change
  useEffect(() => {
    if (originalStyles) {
      const isDirty = JSON.stringify(styles) !== JSON.stringify(originalStyles);
      setIsDirty(isDirty);
    }
  }, [styles, originalStyles, setIsDirty]);
  
  const handleChange = useCallback((value, name) => {
    setStyles(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleButtonColorChange = useCallback((hsb) => {
    setButtonColor(hsb);
    const rgb = hsbToRgb(hsb);
    const hex = rgbToHex(rgb);
    handleChange(hex, 'addToCartButtonColor');
  }, [handleChange]);
  
  const handleButtonTextColorChange = useCallback((hsb) => {
    setButtonTextColor(hsb);
    const rgb = hsbToRgb(hsb);
    const hex = rgbToHex(rgb);
    handleChange(hex, 'addToCartButtonTextColor');
  }, [handleChange]);
  
  const handleBorderColorChange = useCallback((hsb) => {
    setBorderColorHsb(hsb);
    const rgb = hsbToRgb(hsb);
    const hex = rgbToHex(rgb);
    handleChange(hex, 'borderColor');
  }, [handleChange]);
  
  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/shop/appearance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ styles }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOriginalStyles(styles);
        setShowToast(true);
        setError(null);
      } else {
        setError('Failed to save appearance settings. Please try again.');
      }
    } catch (error) {
      console.error('Error saving appearance settings:', error);
      setError('Failed to save appearance settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [fetch, styles]);
  
  const handleReset = useCallback(() => {
    if (originalStyles) {
      setStyles(originalStyles);
      
      // Reset color pickers
      if (originalStyles.addToCartButtonColor) {
        const rgb = hexToRgb(originalStyles.addToCartButtonColor);
        if (rgb) {
          setButtonColor(rgbToHsb(rgb));
        }
      }
      
      if (originalStyles.addToCartButtonTextColor) {
        const rgb = hexToRgb(originalStyles.addToCartButtonTextColor);
        if (rgb) {
          setButtonTextColor(rgbToHsb(rgb));
        }
      }
      
      if (originalStyles.borderColor) {
        const rgb = hexToRgb(originalStyles.borderColor);
        if (rgb) {
          setBorderColorHsb(rgbToHsb(rgb));
        }
      }
    }
  }, [originalStyles]);
  
  // Preview component
  const renderPreview = () => {
    const previewStyle = {
      container: {
        padding: '20px',
        backgroundColor: '#f6f6f6',
        borderRadius: '4px',
      },
      variantCard: {
        width: styles.cardWidth,
        padding: styles.cardPadding,
        border: `1px solid ${styles.borderColor}`,
        borderRadius: styles.borderRadius,
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
      title: {
        fontSize: '14px',
        fontWeight: '500',
        margin: '0 0 10px 0',
      },
      price: {
        fontSize: '14px',
        color: '#555',
        margin: '0 0 10px 0',
      },
      image: {
        width: '100%',
        height: '120px',
        backgroundColor: '#f0f0f0',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        borderRadius: '2px',
      },
      button: {
        backgroundColor: styles.addToCartButtonColor,
        color: styles.addToCartButtonTextColor,
        border: 'none',
        borderRadius: '4px',
        padding: '6px 12px',
        fontSize: '13px',
        cursor: 'pointer',
        width: '100%',
        marginTop: 'auto',
      },
    };
    
    return (
      <div style={previewStyle.container}>
        <div style={previewStyle.variantCard}>
          <div style={previewStyle.image}>Product Image</div>
          <h3 style={previewStyle.title}>Variant Title</h3>
          <p style={previewStyle.price}>$19.99</p>
          <button style={previewStyle.button}>Add to Cart</button>
        </div>
      </div>
    );
  };
  
  return (
    <Page
      title="Appearance Settings"
      primaryAction={{
        content: 'Save',
        onAction: handleSave,
        loading: isSaving,
        disabled: isLoading || JSON.stringify(styles) === JSON.stringify(originalStyles),
      }}
    >
      {error && (
        <Banner status="critical" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      )}
      
      {showToast && (
        <Toast content="Appearance settings saved successfully" onDismiss={() => setShowToast(false)} />
      )}
      
      <Layout>
        <Layout.Section oneHalf>
          <Card sectioned title="Card Settings">
            <FormLayout>
              <Select
                label="Card Size"
                options={[
                  { label: 'Match Original Product Cards', value: 'match-original' },
                  { label: 'Compact', value: '150px' },
                  { label: 'Standard', value: '200px' },
                  { label: 'Large', value: '250px' },
                  { label: 'Custom', value: 'custom' },
                ]}
                value={
                  styles.cardWidth === 'match-original' ? 'match-original' :
                  styles.cardWidth === '150px' ? '150px' :
                  styles.cardWidth === '200px' ? '200px' :
                  styles.cardWidth === '250px' ? '250px' :
                  'custom'
                }
                onChange={(value) => handleChange(value, 'cardWidth')}
                disabled={isLoading}
              />
              
              {styles.cardWidth !== 'match-original' && styles.cardWidth !== '150px' && 
               styles.cardWidth !== '200px' && styles.cardWidth !== '250px' && (
                <TextField
                  label="Custom Card Width"
                  value={styles.cardWidth}
                  onChange={(value) => handleChange(value, 'cardWidth')}
                  disabled={isLoading}
                  helpText="Enter a valid CSS width value (e.g., 180px, 40%, etc.)"
                />
              )}
              
              <RangeSlider
                label="Card Padding"
                min={0}
                max={30}
                value={parseInt(styles.cardPadding) || 10}
                onChange={(value) => handleChange(`${value}px`, 'cardPadding')}
                output
                disabled={isLoading}
              />
              
              <RangeSlider
                label="Border Radius"
                min={0}
                max={20}
                value={parseInt(styles.borderRadius) || 4}
                onChange={(value) => handleChange(`${value}px`, 'borderRadius')}
                output
                disabled={isLoading}
              />
            </FormLayout>
          </Card>
          
          <Card sectioned title="Color Settings">
            <FormLayout>
              <div>
                <p>Add to Cart Button Color</p>
                <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                  <ColorPicker
                    onChange={handleButtonColorChange}
                    color={buttonColor}
                  />
                </div>
                <TextField
                  value={styles.addToCartButtonColor}
                  onChange={(value) => handleChange(value, 'addToCartButtonColor')}
                  label="Button Color Hex"
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <p>Button Text Color</p>
                <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                  <ColorPicker
                    onChange={handleButtonTextColorChange}
                    color={buttonTextColor}
                  />
                </div>
                <TextField
                  value={styles.addToCartButtonTextColor}
                  onChange={(value) => handleChange(value, 'addToCartButtonTextColor')}
                  label="Button Text Color Hex"
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <p>Border Color</p>
                <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                  <ColorPicker
                    onChange={handleBorderColorChange}
                    color={borderColorHsb}
                  />
                </div>
                <TextField
                  value={styles.borderColor}
                  onChange={(value) => handleChange(value, 'borderColor')}
                  label="Border Color Hex"
                  disabled={isLoading}
                />
              </div>
            </FormLayout>
          </Card>
        </Layout.Section>
        
        <Layout.Section oneHalf>
          <Card sectioned title="Preview">
            {renderPreview()}
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <p>This is a preview of how your variant cards will appear</p>
            </div>
          </Card>
          
          <Card sectioned>
            <Stack distribution="trailing">
              <Button onClick={handleReset} disabled={isLoading || isSaving}>
                Reset
              </Button>
              <Button 
                primary 
                onClick={handleSave} 
                loading={isSaving} 
                disabled={isLoading || JSON.stringify(styles) === JSON.stringify(originalStyles)}
              >
                Save
              </Button>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default Appearance;
