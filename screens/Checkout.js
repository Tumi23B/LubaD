import React, { useState, useContext, useEffect } from 'react'; 
import { 
View, 
Text, 
StyleSheet, 
TouchableOpacity, 
ScrollView, 
ActivityIndicator, 
Modal, 
} from 'react-native'; 
import { ThemeContext } from '../ThemeContext'; 
import { auth, database } from '../firebase'; 
import { ref, push, set, update } from 'firebase/database'; 
import { 
onAuthStateChanged, 
signInAnonymously, 
signInWithCustomToken, 
} from 'firebase/auth'; 
import { LogBox } from 'react-native'; 
 

// Ignore specific warning messages about text rendering
LogBox.ignoreLogs([ 
'Text strings must be rendered within a <Text> component', 
]); 
 
export default function Checkout({ route, navigation }) { 
const { isDarkMode, colors } = useContext(ThemeContext); 
const THEME_BUTTON_COLOR = isDarkMode ? '#FFD700' : '#333333'; 
 
 
 //extract parameters from navigation route
const { pickup, dropoff, date, distance } = route.params; 
 
const userIdFromParams = route.params?.userId ?? null; 
const username = route.params?.username ?? 'Unknown' 
//component state
const [selectedVehicle, setSelectedVehicle] = useState(null); 
const [isSaving, setIsSaving] = useState(false); 
const [showModal, setShowModal] = useState(false); 
const [modalMessage, setModalMessage] = useState(''); 
const [modalType, setModalType] = useState('success'); 
const [userId, setUserId] = useState(null); 
const [isAuthReady, setIsAuthReady] = useState(false); 

 /**
   * Vehicle options with pricing and descriptions
   * Each vehicle has:
   * - type: The name of the vehicle
   * - price: Base price for the vehicle
   * - description: What the vehicle is suitable for
   */

const vehicleOptions = [ 
{ type: 'Van', price: 100, description: 'Refridgerators,Freezers,Boxes and small Appliances.' }, 
{ type: 'Bakkie', price: 250, description: 'Furniture,Appliances,Boxes,tools and Car detailing supplies.' }, 
{ type: 'Mini Truck', price: 300, description: 'Gardening supplies,bicycles,hunting gear ,Furniture.' }, 
{ type: 'Full Truck', price: 450, description: 'Furniture, Bulk Goods,Industrial Equipment,Palletized Freight.' }, 
{ type: 'Passanger Van', price: 350, description: 'Family,Friends with luggage and groceries.' }, 
]; 
 
// Improved distance price calculation with higher rates 
const calculateDistancePrice = () => { 
const pricePerKm = 25; // R25 per km 
return distance ? Math.round(distance * pricePerKm) : 0; 
}; 
 
 // Authentication state observer
useEffect(() => { 
const unsubscribe = onAuthStateChanged(auth, async (user) => { 
if (user) { 
  // User is signed in
setUserId(user.uid); 
setIsAuthReady(true); 
} else { 
  // No user, try to sign in
try { 
if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { 
await signInWithCustomToken(auth, __initial_auth_token); 
} else { 
await signInAnonymously(auth); 
} 
} catch (error) { 
console.error('Firebase authentication error:', error); 
setModalMessage(`Authentication failed: ${error.message}`); 
setModalType('error'); 
setShowModal(true); 
setIsAuthReady(true); 
} 
} 
}); 
 // Cleanup function
return () => unsubscribe(); 
}, []); 
 

 /**
   * Calculates the final price including vehicle base price and distance
   * returns The total price
   */
const getFinalPrice = () => { 
const vehicle = vehicleOptions.find((v) => v.type === selectedVehicle); 
if (!vehicle) return 0; 
const distance = calculateDistancePrice(pickup, dropoff); 
return vehicle.price + distance; 
}; 
 
/**
   * Handles the booking confirmation process
   * - Validates inputs
   * - Saves booking to user's history
   * - Creates a ride request
   * - Navigates to payment screen
   */

const handleConfirmBooking = async () => { 
  // Validation
if (!selectedVehicle) { 
setModalMessage('Please select a vehicle type to continue.'); 
setModalType('error'); 
setShowModal(true); 
return; 
} 
 
if (!database || !userId) { 
setModalMessage('System not ready. Please try again.'); 
setModalType('error'); 
setShowModal(true); 
return; 
} 
 
setIsSaving(true); 
try { 
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; 
// Save to user's ride history
const userRidesRef = ref(database, `artifacts/${appId}/users/${userId}/rides`); 
const newCustomerBookingRef = push(userRidesRef); 
const customerBookingId = newCustomerBookingRef.key; 
  // Calculate prices
const vehicle = vehicleOptions.find(v => v.type === selectedVehicle); 
const vehiclePrice = vehicle ? vehicle.price : 0; 
const distancePrice = calculateDistancePrice(pickup, dropoff); 
const totalPrice = vehiclePrice + distancePrice; 
 
//booking data structure
const bookingData = { 
pickup, 
dropoff, 
date: new Date(date).toISOString(), 
vehicle: selectedVehicle, 
bookingTime: new Date().toISOString(), 
status: 'pending', 
customerId: userId, 
customerName: username, 
customerBookingId, 
price: totalPrice, 
}; 
 
// Save to user's history
      await set(newCustomerBookingRef, bookingData);

      // Create ride request for drivers
 
const rideRequestsRef = ref(database, `artifacts/${appId}/ride_requests`); 
const newRideRequestRef = push(rideRequestsRef); 
const requestId = newRideRequestRef.key; 
 // Save ride request and update user's booking with requestId
await set(newRideRequestRef, { ...bookingData, requestId }); 
await update(newCustomerBookingRef, { requestId }); 
 
// Show success and navigate to payment
setModalMessage('Booking confirmed successfully!'); 
setModalType('success'); 
setShowModal(true); 
 
setTimeout(() => { 
setShowModal(false); 
navigation.navigate('Payment', { 
vehicle: selectedVehicle, 
price: totalPrice, 
pickup, 
dropoff, 
date, 
}); 
}, 1500); 
} catch (error) { 
console.error('Booking error:', error); 
setModalMessage(`Failed to confirm booking: ${error.message}`); 
setModalType('error'); 
setShowModal(true); 
} finally { 
setIsSaving(false); 
} 
}; 
 
return ( 
<ScrollView  
style={[styles.container, { backgroundColor: colors.background }]} 
contentContainerStyle={styles.scrollContainer} 
> 
 {/* Page title */}
<Text style={[styles.title, { color: colors.iconRed }]}>Confirm Your Trip</Text> 
 {/* Trip summary box */}
<View style={[styles.summaryBox, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }]}> 
<Text style={[styles.label, { color: colors.text }]}>Pickup:</Text> 
<Text style={[styles.value, { color: colors.textSecondary }]}>{pickup}</Text> 
 
<Text style={[styles.label, { color: colors.text }]}>Dropoff:</Text> 
<Text style={[styles.value, { color: colors.textSecondary }]}>{dropoff}</Text> 
 
<Text style={[styles.label, { color: colors.text }]}>Scheduled Time:</Text> 
<Text style={[styles.value, { color: colors.textSecondary }]}>{new Date(date).toLocaleString()}</Text> 
 
<Text style={[styles.label, { color: colors.text }]}>Distance Fee Estimate:</Text> 
<Text style={[styles.value, { color: colors.textSecondary }]}>R{calculateDistancePrice(pickup, dropoff)}</Text> 
</View> 
 
 {/* Vehicle selection section */}
<Text style={[styles.heading, { color: colors.iconRed }]}>Choose a Vehicle *</Text> 
<View style={styles.vehicleContainer}> 
{vehicleOptions.map((v, index) => ( 
<TouchableOpacity 
key={index} 
style={[ 
styles.vehicleCard, 
{ 
backgroundColor: colors.cardBackground, 
borderColor: colors.borderColor, 
}, 
selectedVehicle === v.type && { 
borderColor: colors.iconRed, 
backgroundColor: isDarkMode ? colors.darkHighlight : colors.lightHighlight, 
}, 
]} 
onPress={() => setSelectedVehicle(v.type)} 
> 
<View style={styles.vehicleInfo}> 
<Text style={[styles.vehicleText, { color: colors.text }]}>{v.type}</Text> 
<Text style={[styles.vehicleDescription, { color: colors.textSecondary }]}>{v.description}</Text> 
</View> 
<Text style={[styles.price, { color: colors.iconRed }]}>R{v.price}</Text> 
</TouchableOpacity> 
))} 
</View> 
 
 {/* Total price display (shown when vehicle is selected) */}
{selectedVehicle && ( 
<View style={styles.totalContainer}> 
<Text style={[styles.totalLabel, { color: colors.text }]}>Total Estimated Cost:</Text> 
<Text style={[styles.totalPrice, { color: colors.iconRed }]}>R{getFinalPrice()}</Text> 
</View> 
)} 
 {/* Error message when no vehicle is selected */}
{!selectedVehicle && ( 
<Text style={[styles.errorText, { color: THEME_BUTTON_COLOR }]}> 
Please select a vehicle to continue 
</Text> 
)} 
 {/* Confirm booking button */}
<TouchableOpacity 
style={[ 
styles.confirmButton, 
{ 
backgroundColor: selectedVehicle ? colors.iconRed : THEME_BUTTON_COLOR, 
opacity: selectedVehicle ? 1 : 0.85, 
}, 
]} 
onPress={handleConfirmBooking} 
disabled={isSaving || !isAuthReady || !selectedVehicle} 
> 
{isSaving ? ( 
<ActivityIndicator color={colors.buttonText} /> 
) : ( 
<Text style={[styles.confirmButtonText, { color: colors.buttonText }]}> 
Confirm Booking 
</Text> 
)} 
</TouchableOpacity> 
 {/* Modal for showing messages/alerts */}

<Modal transparent animationType="fade" visible={showModal} onRequestClose={() => setShowModal(false)}> 
<View style={styles.modalOverlay}> 
<View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}> 
<Text 
style={[ 
styles.modalMessage, 
{ color: modalType === 'success' ? colors.successText : colors.errorText }, 
]} 
> 
{modalMessage} 
</Text> 
<TouchableOpacity 
style={[styles.modalButton, { backgroundColor: colors.iconRed }]} 
onPress={() => setShowModal(false)} 
> 
<Text style={[styles.modalButtonText, { color: colors.buttonText }]}>OK</Text> 
</TouchableOpacity> 
</View> 
</View> 
</Modal> 
</ScrollView> 
); 
} 
 
const styles = StyleSheet.create({ 
container: { 
flex: 1, 
}, 
scrollContainer: { 
padding: 20, 
paddingBottom: 40, 
}, 
title: { 
fontSize: 22, 
fontWeight: 'bold', 
marginBottom: 20, 
marginTop: 10, 
textAlign: 'center', 
}, 
summaryBox: { 
padding: 15, 
borderRadius: 10, 
marginBottom: 20, 
borderWidth: 1, 
}, 
label: { 
fontWeight: '600', 
fontSize: 16, 
}, 
value: { 
marginBottom: 10, 
fontSize: 14, 
}, 
heading: { 
fontSize: 18, 
fontWeight: 'bold', 
marginBottom: 12, 
}, 
vehicleContainer: { 
marginBottom: 15, 
}, 
vehicleCard: { 
padding: 15, 
borderRadius: 10, 
borderWidth: 1, 
marginBottom: 12, 
flexDirection: 'row', 
justifyContent: 'space-between', 
alignItems: 'center', 
}, 
vehicleInfo: { 
flex: 1, 
}, 
vehicleText: { 
fontSize: 16, 
fontWeight: '600', 
}, 
vehicleDescription: { 
fontSize: 12, 
marginTop: 4, 
}, 
price: { 
fontSize: 18, 
fontWeight: 'bold', 
marginLeft: 10, 
}, 
confirmButton: { 
paddingVertical: 15, 
borderRadius: 8, 
alignItems: 'center', 
marginTop: 20, 
}, 
confirmButtonText: { 
fontSize: 16, 
fontWeight: 'bold', 
}, 
modalOverlay: { 
flex: 1, 
justifyContent: 'center', 
alignItems: 'center', 
backgroundColor: 'rgba(0, 0, 0, 0.5)', 
}, 
modalContainer: { 
padding: 20, 
borderRadius: 10, 
alignItems: 'center', 
minWidth: 250, 
}, 
modalMessage: { 
fontSize: 16, 
marginBottom: 20, 
textAlign: 'center', 
fontWeight: 'bold', 
}, 
modalButton: { 
paddingVertical: 10, 
paddingHorizontal: 20, 
borderRadius: 8, 
}, 
modalButtonText: { 
fontSize: 16, 
fontWeight: 'bold', 
}, 
errorText: { 
fontSize: 14, 
marginTop: 5, 
textAlign: 'center', 
marginBottom: 10, 
}, 
totalContainer: { 
flexDirection: 'row', 
justifyContent: 'space-between', 
alignItems: 'center', 
marginTop: 15, 
paddingHorizontal: 10, 
}, 
totalLabel: { 
fontSize: 16, 
fontWeight: '600', 
}, 
totalPrice: { 
fontSize: 20, 
fontWeight: 'bold', 
}, 
}); 
 