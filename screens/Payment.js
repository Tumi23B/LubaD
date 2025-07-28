import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  Modal,
  ActivityIndicator,
  Linking
} from 'react-native';
import { ThemeContext } from '../ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

export default function Payment({ route }) {
  const { isDarkMode, colors } = useContext(ThemeContext);
  const { vehicle, pickup, dropoff, date, price } = route.params;

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const [showHelpers, setShowHelpers] = useState(false);
  const [helpersCount, setHelpersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [snapscanUrl, setSnapscanUrl] = useState('');
  const [showSnapscan, setShowSnapscan] = useState(false);




  const methods = [
    { 
      name: 'Cash', 
      icon: () => <Ionicons 
        name="cash" 
        size={24} 
        color={isDarkMode ? '#4CAF50' : '#2E7D32'} 
      /> 
    },
    { 
      name: 'Card', 
      icon: () => <MaterialIcons 
        name="credit-card" 
        size={24} 
        color={isDarkMode ? '#90A4AE' : '#37474F'} 
      /> 
    },
  ];

  const helpersCost = helpersCount * 150;
  const totalCost = price + helpersCost;

  // Set up deep linking listener
  useEffect(() => {
    const handleDeepLink = (event) => {
      if (!event.url) return;
      
      console.log('Deep link received:', event.url);
      
      if (event.url.includes('paymentcallback/success')) {
        setPaymentDone(true);
        setShowOzow(false);
        Alert.alert('Payment Successful', 'Your payment was processed successfully');
      } else if (event.url.includes('paymentcallback/cancel')) {
        setShowOzow(false);
        Alert.alert('Payment Cancelled', 'Your payment was cancelled');
      } else if (event.url.includes('paymentcallback/error')) {
        setShowOzow(false);
        Alert.alert('Payment Error', 'There was an error processing your payment');
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const toggleHelperCount = (increment = true) => {
    if (increment && helpersCount < 3) setHelpersCount(helpersCount + 1);
    if (!increment && helpersCount > 0) setHelpersCount(helpersCount - 1);
  };

  // Snapscan link generation logic
  const generateSnapscanLink = async () => {
  try {
    const amountCents = Math.round(totalCost * 100); // SnapScan uses cents
    const simulatedLink = `https://pos.snapscan.io/qr/SNAPCODE123?amount=${amountCents}&id=LUGGAGE123&strict=true`;
    setSnapscanUrl(simulatedLink);
    setShowSnapscan(true);
  } catch (error) {
    console.error('SnapScan link generation failed:', error);
    Alert.alert('Error', 'Unable to initiate SnapScan payment.');
  }
};

  const handlePayPress = async () => {
    if (!selectedMethod) {
      Alert.alert('Select Payment Method', 'Please choose how you want to pay.');
      return;
    }

    if (selectedMethod === 'Card') {
  setIsLoading(true);

  try {
    // Use SnapScan flow instead of Ozow
    await generateSnapscanLink();
  } catch (error) {
    Alert.alert('Error', 'Could not initiate SnapScan payment.');
  } finally {
    setIsLoading(false);
  }

  return;
}

    // For cash payments
    setPaymentDone(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        contentContainerStyle={[
          styles.container, 
          { backgroundColor: colors.background }
        ]}
      >
        {/* Booking Summary Section */}
        <View style={[
          styles.summaryCard, 
          { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.borderColor
          }
        ]}>
          <Text style={[
            styles.sectionTitle, 
            { color: colors.iconRed }
          ]}>
            Your Booking Details
          </Text>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Vehicle:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{vehicle}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Pickup:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{pickup}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Dropoff:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{dropoff}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {new Date(date).toLocaleString('en-ZA', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Base Price:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>R{price}</Text>
          </View>
        </View>

        {!paymentDone ? (
          <>
            {/* Helpers Section */}
            <View style={[
              styles.helpersSection,
              { 
                backgroundColor: colors.cardBackground,
                borderColor: colors.borderColor,
                borderWidth: 1,
                borderRadius: 12
              }
            ]}>
              <View style={[styles.toggleRow, { marginBottom: showHelpers ? 15 : 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: colors.text }]}>
                    Need help with loading/unloading?
                  </Text>
                  <Text style={[styles.helperInfo, { color: colors.textSecondary }]}>
                    Each helper costs R150 (max 3)
                  </Text>
                </View>
                <Switch
                  value={showHelpers}
                  onValueChange={() => {
                    setShowHelpers(!showHelpers);
                    if (!showHelpers) setHelpersCount(1);
                    else setHelpersCount(0);
                  }}
                  thumbColor={isDarkMode ? '#f4f3f4' : '#f4f3f4'}
                  trackColor={{ false: '#767577', true: colors.iconRed }}
                  style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                />
              </View>

              {showHelpers && (
                <View style={{ alignItems: 'center' }}>
                  <View style={styles.helpersControls}>
                    <TouchableOpacity
                      style={[
                        styles.helperButton, 
                        { 
                          backgroundColor: helpersCount > 0 ? 
                            colors.iconRed : 
                            colors.disabledButton 
                        }
                      ]}
                      onPress={() => toggleHelperCount(false)}
                      disabled={helpersCount <= 0}
                    >
                      <Text style={styles.helperBtnText}>-</Text>
                    </TouchableOpacity>

                    <Text style={[
                      styles.helpersCount, 
                      { 
                        color: colors.text,
                        marginHorizontal: 20
                      }
                    ]}>
                      {helpersCount}
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.helperButton, 
                        { 
                          backgroundColor: helpersCount < 3 ? 
                            colors.iconRed : 
                            colors.disabledButton 
                        }
                      ]}
                      onPress={() => toggleHelperCount(true)}
                      disabled={helpersCount >= 3}
                    >
                      <Text style={styles.helperBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[
                    styles.helperCostText,
                    { color: colors.text }
                  ]}>
                    Helpers cost: R{helpersCost}
                  </Text>
                </View>
              )}
            </View>

            {/* Payment Method Selection */}
            <Text style={[
              styles.sectionTitle, 
              { 
                color: colors.iconRed, 
                marginTop: 20,
                marginBottom: 10
              }
            ]}>
              Select Payment Method
            </Text>
            
            <View style={styles.methodsContainer}>
              {methods.map(({ name, icon: Icon }) => (
                <TouchableOpacity
                  key={name}
                  style={[
                    styles.methodButton,
                    {
                      backgroundColor: selectedMethod === name ? 
                        colors.selectedMethodBackground : 
                        colors.cardBackground,
                      borderColor: selectedMethod === name ? 
                        colors.iconRed : 
                        colors.borderColor,
                    },
                  ]}
                  onPress={() => setSelectedMethod(name)}
                >
                  <Icon />
                  <Text
                    style={[
                      styles.methodText,
                      { 
                        color: selectedMethod === name ? 
                          colors.iconRed : 
                          colors.text 
                      },
                    ]}
                  >
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Total Amount and Pay Button */}
            <View style={[
              styles.totalContainer,
              { 
                backgroundColor: colors.cardBackground,
                borderColor: colors.borderColor,
                borderWidth: 1
              }
            ]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount:</Text>
              <Text style={[styles.totalAmount, { color: colors.iconRed }]}>R{totalCost}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.payButton, 
                { 
                  backgroundColor: colors.iconRed,
                  opacity: selectedMethod ? 1 : 0.6,
                  marginTop: 10
                }
              ]}
              onPress={handlePayPress}
              disabled={!selectedMethod || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={[
                  styles.payButtonText, 
                  { color: colors.buttonText }
                ]}>
                  {selectedMethod === 'Cash' ? 'Confirm Booking' : 'Pay Now'}
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          /* Payment Confirmation Screen */
          <View style={styles.confirmationContainer}>
            <View style={[
              styles.successCard,
              { 
                backgroundColor: colors.cardBackground,
                borderColor: colors.borderColor,
                borderWidth: 1
              }
            ]}>
              <Ionicons 
                name="checkmark-circle" 
                size={60} 
                color="#4CAF50" 
                style={styles.successIcon}
              />
              
              <Text style={[
                styles.successTitle,
                { color: colors.text }
              ]}>
                Booking Confirmed!
              </Text>
              
              <Text style={[
                styles.successText,
                { color: colors.textSecondary }
              ]}>
                {selectedMethod === 'Cash' 
                  ? `Please pay R${totalCost} to the driver at drop-off location` 
                  : `Payment of R${totalCost} processed successfully`}
              </Text>

              <View style={[
                styles.bookingSummary,
                { 
                  backgroundColor: colors.slightlyDifferentCard,
                  padding: 15,
                  borderRadius: 8,
                  marginTop: 20,
                  borderWidth: 0
                }
              ]}>
                <Text style={[
                  styles.summaryText, 
                  { 
                    color: colors.text, 
                    fontWeight: '600',
                    fontSize: 16,
                    marginBottom: 12 
                  }
                ]}>
                  Trip Details
                </Text>
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Vehicle:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{vehicle}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>From:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{pickup}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>To:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{dropoff}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>When:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {new Date(date).toLocaleString('en-ZA', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                
                {helpersCount > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Helpers:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {helpersCount} (R{helpersCost})
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* SnapScan Modal */}
      <Modal
        visible={showSnapscan}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowSnapscan(false)}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowSnapscan(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>SnapScan Payment</Text>
          </View>

          <WebView
            source={{ uri: snapscanUrl }}
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            onNavigationStateChange={(navState) => {
              console.log('SnapScan nav change:', navState.url);
              if (navState.url.includes('success')) {
                setPaymentDone(true);
                setShowSnapscan(false);
                Alert.alert('Payment Successful', 'SnapScan payment completed');
              }
            }}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.iconRed} />
                <Text style={{ marginTop: 10 }}>Loading SnapScan...</Text>
              </View>
            )}
          />
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 35,
    flexGrow: 1,
  },
  summaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.8,
    width:80,
    flexShrink:0,
  },
  detailValue: {
    flexGrow:1,
    flexShrink:1,
    flexWrap: 'wrap',
    fontSize: 14,
    fontWeight: '500',
  },
  helpersSection: {
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  helperInfo: {
    fontSize: 13,
    opacity: 0.8,
    marginTop: 3,
  },
  helpersControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  helperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  helperCostText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 5,
  },
  helpersCount: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  methodsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  methodButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  methodText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  totalContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  payButton: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  confirmationContainer: {
    alignItems: 'center',
    marginTop: 10,
    paddingBottom: 20,
  },
  successCard: {
    width: '100%',
    borderRadius: 12,
    padding: 22,
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    marginBottom: 15,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 5,
  },
  successText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22,
    opacity: 0.9,
  },
  bookingSummary: {
    width: '100%',
    marginTop: 15,
    paddingTop: 5,
  },
  summaryText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  closeButton: {
    marginRight: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
