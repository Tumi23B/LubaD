import axios from 'axios';
import debounce from 'lodash.debounce';
import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from 'react-native';

// LocationIQ API key (Note: In production, store this securely, e.g., in environment variables)
const LOCATIONIQ_API_KEY = 'pk.9873089e1cfed2ac5407d6fd4766f0b4';

//addressAutocomplete Component
const AddressAutocomplete = ({ onLocationSelected, placeholder = "Enter address" }) => {
    // State for search query and results

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  // Ref for Axios cancel token (to abort pending requests)
  const cancelTokenRef = useRef(null);
  // Detect system color scheme (dark/light mode)
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';


  //Fetches place suggestions from LocationIQ API
  const fetchPlaces = async (text) => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel();
    }

    // Create a new cancel token for this request
    cancelTokenRef.current = axios.CancelToken.source();

    try {
      const response = await axios.get('https://api.locationiq.com/v1/autocomplete.php', {
        params: {
          key: LOCATIONIQ_API_KEY,
          // search query
          q: text.trim(),
          //restrict to SA
          countrycodes: 'za',
          // MAX RESULTS
          limit: 5,
          format: 'json',
        },
        // Attach cancel token
        cancelToken: cancelTokenRef.current.token,
      });

// Update results
      setResults(response.data);
    } catch (error) {
      // Ignore cancellation errors
      if (!axios.isCancel(error)) {
        console.error('LocationIQ error:', error.response?.status || error.message);
      }
    }
  };

  //debounce API calls to avoid spamming while typing
  const debouncedFetch = debounce((text) => {
    if (text.length >= 3) {
      fetchPlaces(text);
    } else {
      setResults([]);
    }
  }, 500);

  // Handles location selection
  const handleSelect = (item) => {
    setQuery(item.display_name);
    setResults([]);

     // Pass selected location to parent component
    if (onLocationSelected) {
      onLocationSelected({
        label: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <TextInput
        placeholder={placeholder}
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          debouncedFetch(text);
        }}
        style={[
          styles.input,
          {
            backgroundColor: isDark ? '#1e1e1e' : '#fff',
            color: isDark ? '#fff' : '#000',
            borderColor: isDark ? '#c5a34f' : '#ccc',
          },
        ]}
        placeholderTextColor={isDark ? '#888' : '#999'}
      />

      {results.length > 0 && (
        <ScrollView
          style={[
            styles.resultsContainer,
            {
              backgroundColor: isDark ? '#121212' : '#fff',
              borderColor: isDark ? '#c5a34f' : '#ccc',
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {results.map((item, index) => (
            <TouchableOpacity
              key={`${item.place_id}_${index}`}
              style={styles.resultItem}
              onPress={() => handleSelect(item)}
            >
              <Text style={{ color: isDark ? '#c5a34f' : '#000' }}>
                {item.display_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default AddressAutocomplete;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 999,
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  resultsContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
  },
  resultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
