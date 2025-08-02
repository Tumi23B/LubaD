import React, { useEffect, useState, useContext } from 'react'; 
import { 
View, 
Text, 
ScrollView, 
StyleSheet, 
TouchableOpacity, 
TextInput, 
Platform, 
Alert, 
ActivityIndicator, 
KeyboardAvoidingView, 
FlatList, 
Image, 
Linking, 
LogBox 
} from 'react-native'; 
import { auth, database } from '../firebase'; 
import { ref, get, onValue, push, set } from 'firebase/database'; 
import DateTimePickerModal from 'react-native-modal-datetime-picker'; 
import MapView, { Marker, Polyline } from 'react-native-maps'; 
import * as Location from 'expo-location'; 
import axios from 'axios'; 
import { Ionicons } from '@expo/vector-icons'; 
import { ThemeContext } from '../ThemeContext'; 
 
// Ignore specific warning messages 
LogBox.ignoreLogs([ 
'Text strings must be rendered within a <Text> component', 
'VirtualizedLists should never be nested', 
'Checkout Error', 
'Geocoding Error' 
]); 
 
export default function Dashboard({ navigation }) { 

  // Theme context for dark/light
const { isDarkMode, colors } = useContext(ThemeContext); 
 
//state management for all component data
const [username, setUsername] = useState(''); 
const [pickup, setPickup] = useState(''); 
const [dropoff, setDropoff] = useState(''); 
const [location, setLocation] = useState(null); 
const [date, setDate] = useState(new Date()); 
const [isDatePickerVisible, setDatePickerVisibility] = useState(false); 
const [timeNow, setTimeNow] = useState(true); 
const [pickupSuggestions, setPickupSuggestions] = useState([]); 
const [dropoffSuggestions, setDropoffSuggestions] = useState([]); 
const [showPickupSuggestions, setShowPickupSuggestions] = useState(false); 
const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false); 
const [loading, setLoading] = useState(false); 
const [pickupCoords, setPickupCoords] = useState(null); 
const [dropoffCoords, setDropoffCoords] = useState(null); 
const [routeCoordinates, setRouteCoordinates] = useState([]); 
const [distance, setDistance] = useState(null); 
const [duration, setDuration] = useState(null); 
 
//duration formatting 
const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hr`;
    } else {
      return `${hours} hr ${remainingMinutes} min`;
    }
  }
};
 
// fetch user data and location on component mount 

useEffect(() => { 
const fetchUserData = async () => { 
const user = auth.currentUser; 
if (user) { 
const snapshot = await get(ref(database, 'users/' + user.uid)); 
if (snapshot.exists()) { 
setUsername(snapshot.val().username); 
} 
} 
 
//request location permissions and get current position
let { status } = await Location.requestForegroundPermissionsAsync(); 
if (status !== 'granted') { 
Alert.alert('Permission Denied', 'Location permission is required for this app to work properly'); 
return; 
} 
 
let currentLocation = await Location.getCurrentPositionAsync({}); 
setLocation({ 
latitude: currentLocation.coords.latitude, 
longitude: currentLocation.coords.longitude, 
}); 
}; 
 
fetchUserData(); 
}, []); 
 
//calculate the distance and the estimated time between the two coordinates using the HAVERSINE FORMULA
const calculateDistanceAndDuration = (start, end) => {
  // Calculate precise straight-line distance (Haversine formula)
  const R = 6371; // Earth radius in km
  const dLat = (end.latitude - start.latitude) * Math.PI / 180;
  const dLon = (end.longitude - start.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(start.latitude * Math.PI / 180) * 
    Math.cos(end.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const straightLineDistance = R * c;

  // Dynamic distance multiplier based on SA road network data
  const getRoadDistanceMultiplier = (distance) => {
    // Urban centers (JHB, CPT) - very circuitous
    if (distance < 2) return 1.8;   
    // Suburban areas
    if (distance < 5) return 1.65;  
    // Regional routes
    if (distance < 20) return 1.5; 
    // National roads 
    if (distance < 100) return 1.35; 
    // Long-distance highways
    return 1.2;                     
  };

  const roadDistance = straightLineDistance * getRoadDistanceMultiplier(straightLineDistance);

  // Precise speed estimation for different route types SA ROADS ONLY!
  const getAverageSpeed = (distance) => {
    // Based on SA traffic flow studies
    // Dense urban traffic
    if (distance < 2) return 25; 
    // Urban/suburban  
    if (distance < 5) return 35;  
    // Regional roads 
    if (distance < 20) return 60;  
    // National routes
    if (distance < 100) return 80; 
    // Free-flow highways
    return 95;                     
  };

  const avgSpeed = getAverageSpeed(roadDistance);

  //Calculate duration with traffic factors
  let durationMinutes = Math.round((roadDistance / avgSpeed) * 60);
  
  //Apply SA-specific minimum times based on road conditions
  const getMinimumMinutes = (distance) => {
    // Very short urban trips
    if (distance < 1) return 7; 
    // Short urban   
    if (distance < 3) return 12;   
    // Suburban
    if (distance < 10) return 20;  
    // Regional
    if (distance < 30) return 35;  
    // Long distance
    return Math.max(45, Math.round(distance * 0.7)); 
  };

  durationMinutes = Math.max(getMinimumMinutes(roadDistance), durationMinutes);

  // Update state with calculated values
  setDistance(roadDistance.toFixed(1));
  setDuration(durationMinutes);

  console.log(`Calculated: ${straightLineDistance.toFixed(1)}km straight → ${roadDistance.toFixed(1)}km road | Speed: ${avgSpeed}km/h | Time: ${formatDuration(durationMinutes)}`);
};
 

// Date picker handlers

const showDatePicker = () => setDatePickerVisibility(true); 
const hideDatePicker = () => setDatePickerVisibility(false); 
const handleConfirm = (selectedDate) => { 
setDate(selectedDate); 
hideDatePicker(); 
}; 
 

//Fetching location suggestions from OpenStreenMap Nominatim API

const fetchLocationSuggestions = async (query) => { 
if (query.length < 3) return []; 
try { 
const response = await axios.get( 
`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`, 
{ 
headers: { 
'User-Agent': 'YourAppName/1.0 (lubadapp@gmail.com)', 
'Accept': 'application/json' 
} 
} 
); 
if (response.data && Array.isArray(response.data)) { 
return response.data.map(item => ({ 
id: item.place_id, 
displayName: item.display_name, 
coords: { 
latitude: parseFloat(item.lat), 
longitude: parseFloat(item.lon), 
} 
})); 
} 
return []; 
} catch (error) { 
console.error('Nominatim API Error:', error); 
return []; 
} 
}; 


 // Handlers for pickup/dropoff location changes 

const handlePickupChange = async (text) => { 
setPickup(text); 
if (text.length > 2) { 
try { 
const suggestions = await fetchLocationSuggestions(text); 
setPickupSuggestions(suggestions); 
setShowPickupSuggestions(true); 
} catch (error) { 
console.error('Error in pickup suggestions:', error); 
} 
} else { 
setShowPickupSuggestions(false); 
} 
}; 
 
const handleDropoffChange = async (text) => { 
setDropoff(text); 
if (text.length > 2) { 
try { 
const suggestions = await fetchLocationSuggestions(text); 
setDropoffSuggestions(suggestions); 
setShowDropoffSuggestions(true); 
} catch (error) { 
console.error('Error in dropoff suggestions:', error); 
} 
} else { 
setShowDropoffSuggestions(false); 
} 
}; 
 
// Handlers for selecting suggestions

const selectPickupSuggestion = (suggestion) => { 
setPickup(suggestion.displayName); 
setPickupCoords(suggestion.coords); 
setShowPickupSuggestions(false); 
if (dropoffCoords) { 
calculateDistanceAndDuration(suggestion.coords, dropoffCoords); 
setRouteCoordinates([suggestion.coords, dropoffCoords]); 
} 
}; 
 
const selectDropoffSuggestion = (suggestion) => { 
setDropoff(suggestion.displayName); 
setDropoffCoords(suggestion.coords); 
setShowDropoffSuggestions(false); 
if (pickupCoords) { 
calculateDistanceAndDuration(pickupCoords, suggestion.coords); 
setRouteCoordinates([pickupCoords, suggestion.coords]); 
} 
}; 
 
//send ride requests to firebase

const sendRideRequest = async (pickup, dropoff, pickupCoords, dropoffCoords, customerId) => { 
const rideRef = push(ref(database, 'rides')); 
await set(rideRef, { 
customerId, 
driverId: null, 
pickup, 
dropoff, 
pickupCoords, 
dropoffCoords, 
status: 'requested', 
timestamp: Date.now(), 
driverLocation: null, 
}); 
return rideRef.key; 
}; 
 
// Geocodes an address to coordinates using Nominatim

const getCoordsFromAddress = async (address) => { 
try { 
const response = await axios.get( 
`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`, 
{ 
headers: { 
'User-Agent': 'YourAppName/1.0 (lubadapp@gmail.com', 
'Accept': 'application/json' 
} 
} 
); 
 
if (!response.data || response.data.length === 0) { 
throw new Error('Address not found'); 
} 
 
return { 
latitude: parseFloat(response.data[0].lat), 
longitude: parseFloat(response.data[0].lon), 
}; 
} catch (error) { 
console.error('Geocoding Error:', { 
address, 
message: error.message, 
response: error.response?.data 
}); 
throw new Error('Failed to get coordinates for address, try a different address.'); 
} 
}; 
 
// Handle checkout process

const handleCheckout = async () => { 
if (!pickup || !dropoff) { 
Alert.alert('Missing Information', 'Please enter both pickup and dropoff locations'); 
return; 
} 
 
const customerId = auth.currentUser?.uid; 
if (!customerId) { 
Alert.alert('Error', 'User not logged in'); 
return; 
} 
 
try { 
setLoading(true); 
const pickupCoords = await getCoordsFromAddress(pickup); 
const dropoffCoords = await getCoordsFromAddress(dropoff); 
 
const rideId = await sendRideRequest(pickup, dropoff, pickupCoords, dropoffCoords, customerId); 
 
navigation.navigate('Checkout', { 
username: username, 
pickup, 
dropoff, 
date: date.toISOString(), 
rideId, 
pickupCoords, 
dropoffCoords, 
distance: parseFloat(distance), 
duration: duration 
}); 
} catch (error) { 
console.error('Checkout Error:', error); 
Alert.alert('Error', error.message || 'Failed to send ride request'); 
} finally { 
setLoading(false); 
} 
}; 
 
// Open maps app with route

const openMapsNavigation = () => { 
if (!pickup || !dropoff) { 
Alert.alert('Missing Information', 'Please enter both pickup and dropoff locations.'); 
return; 
} 
 
const origin = encodeURIComponent(pickup); 
const destination = encodeURIComponent(dropoff); 
const url = Platform.OS === 'ios'  
? `http://maps.apple.com/?daddr=${destination}&saddr=${origin}&dirflg=d` 
: `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`; 
 
Linking.openURL(url).catch((error) => { 
console.error('Failed to open maps:', error); 
Alert.alert('Error', `Could not open ${Platform.OS === 'ios' ? 'Apple Maps' : 'Google Maps'}.`); 
}); 
}; 
 

//Renders a suggestion item in the location suggestions list


const renderSuggestionItem = ({ item, isPickup }) => (
  <TouchableOpacity  
    style={[styles.suggestionItem, { backgroundColor: colors.cardBackground }]}
    onPress={() => isPickup ? selectPickupSuggestion(item) : selectDropoffSuggestion(item)}
  >
    <Text style={{ color: colors.text }} numberOfLines={1}>
      {item.displayName}
    </Text>
  </TouchableOpacity>
);

 //SuggestionsList component to avoid the VirtualizedLists warning. 
const SuggestionsList = React.memo(({ data, renderItem, keyExtractor }) => {
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      keyboardShouldPersistTaps="always"
      style={{ maxHeight: 150 }}
      initialNumToRender={5}
      maxToRenderPerBatch={5}
      windowSize={5}
      // This is key to fixing the warning
      nestedScrollEnabled={true} 
      // Disables internal scrolling
      scrollEnabled={false}
    />
  );
});



//Renders a location input field with suggestions dropdown

  const renderLocationInput = (isPickup) => {
  const suggestions = isPickup ? pickupSuggestions : dropoffSuggestions;
  const showSuggestions = isPickup ? showPickupSuggestions : showDropoffSuggestions;
  const value = isPickup ? pickup : dropoff;
  const onChangeText = isPickup ? handlePickupChange : handleDropoffChange;
  const placeholder = isPickup ? '📍 Pickup Location' : '📦 Dropoff Location';
  
  return (
    <View style={styles.locationInputContainer}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => (isPickup ? setShowPickupSuggestions(true) : setShowDropoffSuggestions(true))}
        onBlur={() => setTimeout(() => isPickup ? setShowPickupSuggestions(false) : setShowDropoffSuggestions(false), 200)}
        style={[
          styles.input,
          {
            backgroundColor: colors.cardBackground,
            color: colors.text,
            borderColor: colors.borderColor,
          },
        ]}
      />
      {showSuggestions && (
        <View style={[styles.suggestionsWrapper, { borderColor: colors.borderColor }]}>
          <SuggestionsList
            data={suggestions}
            renderItem={({ item }) => renderSuggestionItem({ item, isPickup })}
            keyExtractor={(item) => item.id}
          />
        </View>
      )}
    </View>
  );
};

// Vehicle Options Display
 
const vehicleOptions = [ 
{ type: 'Vans', icon: require('../assets/minivan.png')}, 
{ type: 'Bakkies', icon: require('../assets/van.png') }, 
{ type: 'Passanger Vans', icon: require('../assets/van.png') }, 
{ type: 'Full & Mini Trucks', icon: require('../assets/fulltruck.png') }, 
]; 
 
// Main component render

return (
  <KeyboardAvoidingView 
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
    style={{ flex: 1 }}
  >
    {/* Main scrollable content area */}
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
      
    >
      {/* Header section with welcome message and settings */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.iconRed }]}>Welcome, {username}!</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.settingsIcon}
        >
          <Ionicons name="settings-outline" size={26} color={colors.iconRed} />
        </TouchableOpacity>
      </View>
 

  {/* Map section with route visualization */}
<View style={styles.section}> 
<View 
style={{ 
borderWidth: 1, 
borderColor: colors.borderColor, 
borderRadius: 12, 
overflow: 'hidden', 
marginBottom: 20, 
backgroundColor: colors.cardBackground, 
elevation: Platform.OS === 'android' ? 3 : 0, 
shadowColor: '#000', 
shadowOffset: { width: 0, height: 2 }, 
shadowOpacity: 0.15, 
shadowRadius: 4, 
}} 
> 
<MapView 
style={styles.map} 
region={ 
location 
? { 
latitude: location.latitude, 
longitude: location.longitude, 
latitudeDelta: 0.01, 
longitudeDelta: 0.01, 
} 
: { 
latitude: -26.2041, 
longitude: 28.0473, 
latitudeDelta: 0.1, 
longitudeDelta: 0.1, 
} 
} 
customMapStyle={isDarkMode ? mapStyleDark : mapStyleLight} 
> 
{/* Map markers and route visualization */}
{location && ( 
<Marker coordinate={location} pinColor={colors.iconRed} title="You are here" /> 
)} 
{pickupCoords && ( 
<Marker 
coordinate={pickupCoords} 
pinColor="#4285F4" 
title="Pickup Location" 
/> 
)} 
{dropoffCoords && ( 
<Marker 
coordinate={dropoffCoords} 
pinColor={colors.iconRed} 
title="Dropoff Location" 
/> 
)} 
{routeCoordinates.length > 1 && ( 
<Polyline 
coordinates={routeCoordinates} 
strokeColor={colors.iconRed} 
strokeWidth={3} 
/> 
)} 
</MapView> 


 {/* Route distance and duration info */}
          {(distance && duration) && (
            <View style={styles.routeInfoContainer}>
              <Text style={[styles.routeInfoText, { color: colors.text }]}>
                Distance: {distance} km
              </Text>
              <View style={{ width: 10 }} />
              <Text style={[styles.routeInfoText, { color: colors.text }]}>
                Est. time: {formatDuration(duration)}
              </Text>
            </View>
          )}
        </View>
 
 {/* Location inputs */}
{renderLocationInput(true)} 
{renderLocationInput(false)} 
 
 {/* Time scheduling controls */}

<TouchableOpacity style={styles.timeToggle} onPress={() => setTimeNow(!timeNow)}> 
<Text style={[styles.linkText, { color: colors.iconRed }]}> 
{timeNow ? 'Schedule for Later' : 'Use Current Time'} 
</Text> 
</TouchableOpacity> 
 
 {/* Date picker for scheduled rides */}

{!timeNow && ( 
<TouchableOpacity 
onPress={showDatePicker} 
style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.borderColor }]} 
> 
<Text style={{ color: colors.text }}>{date.toLocaleString()}</Text> 
</TouchableOpacity> 
)} 
 
<DateTimePickerModal 
isVisible={isDatePickerVisible} 
mode="datetime" 
onConfirm={handleConfirm} 
onCancel={hideDatePicker} 
/> 

 {/* Action buttons */}

<TouchableOpacity 
style={[styles.checkoutButton, { backgroundColor: '#4285F4' }]} 
onPress={openMapsNavigation} 
disabled={!pickup || !dropoff} 
> 
<Text style={[styles.checkoutButtonText, { color: 'white' }]}> 
Open Route in {Platform.OS === 'ios' ? 'Apple Maps' : 'Google Maps'} 
</Text> 
</TouchableOpacity> 
 
<TouchableOpacity 
style={[styles.checkoutButton, { backgroundColor: colors.iconRed }]} 
onPress={handleCheckout} 
disabled={loading || !pickup || !dropoff} 
> 
{loading ? ( 
<ActivityIndicator color={colors.buttonText} /> 
) : ( 
<Text style={[styles.checkoutButtonText, { color: colors.buttonText }]}>Checkout</Text> 
)} 
</TouchableOpacity> 
</View> 
 
 {/* Vehicle types section */}

<View style={styles.section}> 
<Text style={[styles.heading, { color: colors.iconRed }]}>Available Vehicle Types</Text> 
<View style={styles.vehicleGrid}> 
{vehicleOptions.map((v, i) => ( 
<View 
key={i} 
style={[ 
styles.vehicleBox, 
{ 
backgroundColor: colors.cardBackground, 
borderColor: colors.borderColor, 
}, 
]} 
> 
<Image source={v.icon} style={{ width: 30, height: 30 }} /> 
<Text style={[styles.vehicleLabel, { color: colors.text }]}>{v.type}</Text> 
</View> 
))} 
</View> 
</View> 
 
{/* Booking history section */}


<View style={styles.section}> 
<Text style={[styles.heading, { color: colors.iconRed }]}>View Requests</Text> 
<TouchableOpacity 
style={[styles.checkoutButton, { backgroundColor: colors.iconRed }]} 
onPress={() => navigation.navigate('BookingHistory')} 
> 
<Text style={[styles.checkoutButtonText, { color: colors.buttonText }]}>Booking History</Text> 
</TouchableOpacity> 
</View> 
</ScrollView> 
</KeyboardAvoidingView> 
); 
} 
 
//Map styling configurations
const mapStyleLight = [ 
{ 
"featureType": "poi", 
"stylers": [ 
{ 
"visibility": "off" 
} 
] 
}, 
{ 
"featureType": "transit", 
"stylers": [ 
{ 
"visibility": "off" 
} 
] 
} 
]; 
 
const mapStyleDark = [ 
{ 
"elementType": "geometry", 
"stylers": [ 
{ 
"color": "#242f3e" 
} 
] 
}, 
{ 
"elementType": "labels.text.fill", 
"stylers": [ 
{ 
"color": "#746855" 
} 
] 
}, 
{ 
"elementType": "labels.text.stroke", 
"stylers": [ 
{ 
"color": "#242f3e" 
} 
] 
}, 
{ 
"featureType": "administrative.locality", 
"elementType": "labels.text.fill", 
"stylers": [ 
{ 
"color": "#d59563" 
} 
] 
}, 
{ 
"featureType": "poi", 
"stylers": [ 
{ 
"visibility": "off" 
} 
] 
}, 
{ 
"featureType": "road", 
"elementType": "geometry", 
"stylers": [ 
{ 
"color": "#38414e" 
} 
] 
}, 
{ 
"featureType": "road", 
"elementType": "geometry.stroke", 
"stylers": [ 
{ 
"color": "#212a37" 
} 
] 
}, 
{ 
"featureType": "road", 
"elementType": "labels.text.fill", 
"stylers": [ 
{ 
"color": "#9ca5b3" 
} 
] 
}, 
{ 
"featureType": "road.highway", 
"elementType": "geometry", 
"stylers": [ 
{ 
"color": "#746855" 
} 
] 
}, 
{ 
"featureType": "road.highway", 
"elementType": "geometry.stroke", 
"stylers": [ 
{ 
"color": "#1f2835" 
} 
] 
}, 
{ 
"featureType": "road.highway", 
"elementType": "labels.text.fill", 
"stylers": [ 
{ 
"color": "#f3d19c" 
} 
] 
}, 
{ 
"featureType": "transit", 
"stylers": [ 
{ 
"visibility": "off" 
} 
] 
}, 
{ 
"featureType": "water", 
"elementType": "geometry", 
"stylers": [ 
{ 
"color": "#17263c" 
} 
] 
}, 
{ 
"featureType": "water", 
"elementType": "labels.text.fill", 
"stylers": [ 
{ 
"color": "#515c6d" 
} 
] 
}, 
{ 
"featureType": "water", 
"elementType": "labels.text.stroke", 
"stylers": [ 
{ 
"color": "#17263c" 
} 
] 
} 
]; 
 
const styles = StyleSheet.create({ 
container: { 
padding: 20, 
flex: 1, 
}, 
section: { 
marginBottom: 25, 
}, 
title: { 
fontSize: 24, 
fontWeight: 'bold', 
marginTop: 10, 
}, 
heading: { 
fontSize: 18, 
fontWeight: '600', 
marginBottom: 12, 
}, 
input: { 
borderWidth: 1, 
borderRadius: 8, 
padding: 10, 
marginBottom: 12, 
}, 
timeToggle: { 
alignSelf: 'flex-end', 
marginBottom: 10, 
}, 
linkText: { 
textDecorationLine: 'underline', 
fontWeight: '500', 
}, 
checkoutButton: { 
padding: 12, 
borderRadius: 8, 
marginTop: 6, 
}, 
checkoutButtonText: { 
fontWeight: 'bold', 
textAlign: 'center', 
fontSize: 16, 
}, 
map: { 
height: 200, 
borderRadius: 10, 
marginBottom: 15, 
}, 
vehicleGrid: { 
flexDirection: 'row', 
flexWrap: 'wrap', 
justifyContent: 'space-between', 
}, 
vehicleBox: { 
width: '48%', 
padding: 12, 
borderRadius: 10, 
alignItems: 'center', 
marginBottom: 2, 
borderWidth: 1, 
}, 
vehicleLabel: { 
fontWeight: 'bold', 
marginTop: 8, 
}, 
suggestionsContainer: { 
maxHeight: 150, 
borderWidth: 1, 
borderColor: '#ccc', 
borderRadius: 8, 
}, 
suggestionItem: { 
padding: 10, 
}, 
headerRow: { 
flexDirection: 'row', 
alignItems: 'center', 
justifyContent: 'space-between', 
marginTop: 10, 
marginBottom: 20, 
}, 
settingsIcon: { 
padding: 6, 
marginTop: 14, 
}, 
routeInfoContainer: { 
position: 'absolute', 
bottom: 10, 
left: 10, 
backgroundColor: 'rgba(255, 255, 255, 0.8)', 
padding: 8, 
borderRadius: 8, 
flexDirection: 'row', 
justifyContent: 'space-between', 
width: '60%', 
}, 
routeInfoText: { 
fontSize: 14, 
fontWeight: 'bold', 
}, 
}); 
 