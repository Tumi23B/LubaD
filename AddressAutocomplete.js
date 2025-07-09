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

const LOCATIONIQ_API_KEY = 'pk.9873089e1cfed2ac5407d6fd4766f0b4';

const AddressAutocomplete = ({ onLocationSelected, placeholder = "Enter address" }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const cancelTokenRef = useRef(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const fetchPlaces = async (text) => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel();
    }

    cancelTokenRef.current = axios.CancelToken.source();

    try {
      const response = await axios.get('https://api.locationiq.com/v1/autocomplete.php', {
        params: {
          key: LOCATIONIQ_API_KEY,
          q: text.trim(),
          countrycodes: 'za',
          limit: 5,
          format: 'json',
        },
        cancelToken: cancelTokenRef.current.token,
      });

      setResults(response.data);
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('LocationIQ error:', error.response?.status || error.message);
      }
    }
  };

  const debouncedFetch = debounce((text) => {
    if (text.length >= 3) {
      fetchPlaces(text);
    } else {
      setResults([]);
    }
  }, 500);

  const handleSelect = (item) => {
    setQuery(item.display_name);
    setResults([]);
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
