import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Switch,
} from 'react-native';
import { ThemeContext } from '../ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function Payment({ route, navigation }) {
  const { isDarkMode, colors } = useContext(ThemeContext);
  const { vehicle, pickup, dropoff, date, price } = route.params;

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const [showHelpers, setShowHelpers] = useState(false);
  const [helpersCount, setHelpersCount] = useState(0);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');

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

  const toggleHelperCount = (increment = true) => {
    if (increment && helpersCount < 3) setHelpersCount(helpersCount + 1);
    if (!increment && helpersCount > 0) setHelpersCount(helpersCount - 1);
  };

  const validateCard = () => {
    if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
      Alert.alert('Invalid Card', 'Please enter a valid 16-digit card number');
      return false;
    }

    if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(cardExpiry)) {
      Alert.alert('Invalid Expiry', 'Please enter expiry date in MM/YY format');
      return false;
    }

    if (!/^\d{3,4}$/.test(cardCVC)) {
      Alert.alert('Invalid CVV', 'Please enter a valid 3 or 4-digit CVV');
      return false;
    }

    return true;
  };

  const handlePayPress = () => {
    if (!selectedMethod) {
      Alert.alert('Select Payment Method', 'Please choose how you want to pay.');
      return;
    }

    if (selectedMethod === 'Card' && !validateCard()) {
      return;
    }

    setPaymentDone(true);
  };
//disabled the chat screen navigation from this screen
//const handleChatPress = () => {
    //navigation.navigate('ChatScreen', {
     // bookingId: 'ABC123',
     // driverName: 'John Doe',
     // driverPhone: '+1234567890',
   // });
 // };

  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})/);
    return match ? match.slice(1).filter(Boolean).join(' ') : '';
  };

  return (
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
          {/* Helpers Section - Improved Toggle Layout */}
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

          {/* Card Payment Form */}
          {selectedMethod === 'Card' && (
            <View style={[
              styles.cardForm, 
              { 
                backgroundColor: colors.cardBackground,
                borderColor: colors.borderColor 
              }
            ]}>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    borderColor: colors.borderColor, 
                    color: colors.text,
                    backgroundColor: colors.inputBackground
                  }
                ]}
                placeholder="Card Number (e.g., 1234 5678 9012 3456)"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={formatCardNumber(cardNumber)}
                onChangeText={(text) => setCardNumber(text.replace(/\s/g, ''))}
                maxLength={19}
              />
              
              <View style={styles.cardDetailsRow}>
                <TextInput
                  style={[
                    styles.inputSmall, 
                    { 
                      borderColor: colors.borderColor, 
                      color: colors.text,
                      backgroundColor: colors.inputBackground
                    }
                  ]}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={cardExpiry}
                  onChangeText={setCardExpiry}
                  maxLength={5}
                />
                
                <TextInput
                  style={[
                    styles.inputSmall, 
                    { 
                      borderColor: colors.borderColor, 
                      color: colors.text,
                      backgroundColor: colors.inputBackground
                    }
                  ]}
                  placeholder="CVV"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  secureTextEntry
                  value={cardCVC}
                  onChangeText={setCardCVC}
                  maxLength={4}
                />
              </View>
            </View>
          )}

          {/* Total Amount */}
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

          {/* Pay Button */}
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
            disabled={!selectedMethod}
          >
            <Text style={[
              styles.payButtonText, 
              { color: colors.buttonText }
            ]}>
              {selectedMethod === 'Cash' ? 'Confirm Booking' : 'Pay Now'}
            </Text>
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
  cardForm: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 15,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputSmall: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
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
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center',
  },
  chatIcon: {
    marginRight: 10,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});