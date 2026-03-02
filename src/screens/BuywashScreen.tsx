import Icon from '@react-native-vector-icons/ionicons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button, HelperText, RadioButton, TextInput } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import BackButton from '../components/ui/BackButton';
import { create_paymentIntent } from '../redux/actions/BuyActions';
import { resolveMediaUrl } from '../utils/media';
import { goBackOrHome } from '../utils/navigation';
import { Validators } from '../utils/validators';

type WashType = 'regular' | 'waterless';

type Props = {
  route: any;
  navigation: any;
};

const BuywashScreen: React.FC<Props> = ({ route, navigation }) => {
  const dispatch = useDispatch<any>();
  const { user } = useSelector((state: any) => state.user);
  const selectedProgram = route.params.selectedProgram;

  const [program, setProgram] = useState<any>({});
  const [loadingMedia, setLoadingMedia] = useState<boolean>(true);
  const [initializingCheckout, setInitializingCheckout] = useState(false);
  
  // New state for wash type and delivery
  const [washType, setWashType] = useState<WashType>(
    String(route?.params?.selectedProgram?.programType || '').toLowerCase() === 'waterless'
      ? 'waterless'
      : 'regular'
  );
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(null);
  const [addressError, setAddressError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    setProgram({ ...selectedProgram });
    if (String(selectedProgram?.programType || '').toLowerCase() === 'waterless') {
      setWashType('waterless');
    }
  }, [selectedProgram]);

  const validateDeliveryFields = (): boolean => {
    if (washType === 'regular') return true;
    
    let isValid = true;
    
    if (!Validators.required(deliveryAddress)) {
      setAddressError('Delivery address is required');
      isValid = false;
    } else if (!Validators.minLength(deliveryAddress, 10)) {
      setAddressError('Please provide a complete address');
      isValid = false;
    } else {
      setAddressError('');
    }
    
    if (!Validators.required(deliveryPhone)) {
      setPhoneError('Phone number is required');
      isValid = false;
    } else if (!Validators.phone(deliveryPhone)) {
      setPhoneError('Please provide a valid phone number');
      isValid = false;
    } else {
      setPhoneError('');
    }
    
    if (!deliveryLatitude || !deliveryLongitude) {
      setLocationError('Please select delivery location on map');
      isValid = false;
    } else {
      setLocationError('');
    }

    return isValid;
  };

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to auto-fill your current location');
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setDeliveryLatitude(location.coords.latitude);
      setDeliveryLongitude(location.coords.longitude);
      setLocationError('');
      
      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (addresses[0]) {
        const addr = addresses[0];
        const formattedAddress = [
          addr.street,
          addr.city,
          addr.postalCode,
          addr.country
        ].filter(Boolean).join(', ');
        setDeliveryAddress(formattedAddress);
        setAddressError('');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get your current location');
    } finally {
      setLoadingLocation(false);
    }
  };

  const openMapPicker = () => {
    navigation.navigate('MapPicker', {
      onLocationSelected: (latitude: number, longitude: number, address: string) => {
        setDeliveryLatitude(latitude);
        setDeliveryLongitude(longitude);
        if (address) {
          setDeliveryAddress(address);
          setAddressError('');
        }
        setLocationError('');
      },
      initialLatitude: deliveryLatitude,
      initialLongitude: deliveryLongitude,
    });
  };

  const getWashTypePrice = (): number => {
    const basePrice = Number(program.price || 0);
    if (washType === 'waterless') {
      return basePrice * 1.20; // 20% premium for mobile waterless service
    }
    return basePrice;
  };

  const handlePaymentMethodSelection = async (method: 'card' | 'apple_pay' | 'google_pay') => {
        setCheckoutError(null);
        if (!validateDeliveryFields()) {
          setCheckoutError('Please fill in all required delivery information.');
          return;
        }
    const isDeliveryType = washType !== 'regular';
    const selectedProgramId = Number(selectedProgram?.id);
    if (!isDeliveryType && (!Number.isFinite(selectedProgramId) || selectedProgramId <= 0)) {
      setCheckoutError('Invalid wash program selected. Please re-open the station and choose a valid program.');
      return;
    }

    setInitializingCheckout(true);
    try {
      const checkoutProgram = {
        ...selectedProgram,
        price: getWashTypePrice(),
        programType: isDeliveryType ? 'waterless' : selectedProgram?.programType,
        paymentProgramId: Number.isFinite(selectedProgramId) && selectedProgramId > 0 ? selectedProgramId : undefined,
        paymentProgramType: isDeliveryType ? 'waterless' : selectedProgram?.programType,
      };

      await dispatch(create_paymentIntent(checkoutProgram, method));
      navigation.navigate('CheckoutForm', { 
        program: checkoutProgram,
        washType,
        deliveryAddress: isDeliveryType ? deliveryAddress : undefined,
        deliveryPhone: isDeliveryType ? deliveryPhone : undefined,
        deliveryNotes: isDeliveryType ? deliveryNotes : undefined,
        deliveryLatitude: isDeliveryType ? Number(deliveryLatitude) : undefined,
        deliveryLongitude: isDeliveryType ? Number(deliveryLongitude) : undefined,
      });
    } catch (error: any) {
      const backendMessage =
        typeof error?.details === 'string'
          ? error.details
          : typeof error?.response?.data === 'string'
            ? error.response.data
            : error?.details?.message || error?.response?.data?.message || error?.message;
      setCheckoutError(backendMessage || 'We could not initialize payment. Please try again.');
    } finally {
      setInitializingCheckout(false);
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={() => goBackOrHome(navigation)} color="#007AFF" backgroundColor="#EFF6FF" />


          <Text style={styles.headerTitle}>{program.name}</Text>
        </View>
<View style={styles.card}>
  {checkoutError ? (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>{checkoutError}</Text>
    </View>
  ) : null}
  {(program.media?.picture || program.media?.video) && (
    <View style={styles.mediaContainer}>
      {/* Loading Spinner */}
      {loadingMedia && (
        <ActivityIndicator
          size="large"
          color="#007AFF"
          style={styles.loadingIndicator}
        />
      )}

      {/* Main GIF/Video */}
      {program.media?.video && (
        <Image
          source={{ uri: resolveMediaUrl(program.media.video) }}
          style={styles.mainMedia}
          resizeMode="cover"
         onLoadEnd={() => {
  if (loadingMedia) setLoadingMedia(false);
}}

        />
      )}

      {/* Smaller picture overlay */}
      {program.media?.picture && (
        <Image
          source={{ uri: resolveMediaUrl(program.media.picture) }}
          style={styles.smallPicture}
          resizeMode="cover"
        />
      )}
    </View>
  )}
    <Text style={styles.programType}>
  {program.programType?.replace('_', ' ').toUpperCase()}
</Text>

<Text style={styles.description}>
  {program.description}
</Text>

        {/* Wash Type Selection */}
        <View style={styles.washTypeSection}>
          <Text style={styles.sectionTitle}>Select Wash Type</Text>
          
          <TouchableOpacity 
            style={[styles.washTypeOption, washType === 'regular' && styles.washTypeSelected]}
            onPress={() => setWashType('regular')}
          >
            <RadioButton
              value="regular"
              status={washType === 'regular' ? 'checked' : 'unchecked'}
              onPress={() => setWashType('regular')}
            />
            <View style={styles.washTypeInfo}>
              <Text style={styles.washTypeName}>Regular Wash</Text>
              <Text style={styles.washTypeDesc}>At station location</Text>
            </View>
            <Text style={styles.washTypePrice}>€{Number(program.price || 0).toFixed(2)}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.washTypeOption, washType === 'waterless' && styles.washTypeSelected]}
            onPress={() => setWashType('waterless')}
          >
            <RadioButton
              value="waterless"
              status={washType === 'waterless' ? 'checked' : 'unchecked'}
              onPress={() => setWashType('waterless')}
            />
            <View style={styles.washTypeInfo}>
              <Text style={styles.washTypeName}>Waterless Mobile Wash 🚗</Text>
              <Text style={styles.washTypeDesc}>Eco-friendly • We come to your location</Text>
            </View>
            <Text style={styles.washTypePrice}>€{getWashTypePrice().toFixed(2)}</Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Information (shown for waterless/delivery wash) */}
        {washType !== 'regular' && (
          <View style={styles.deliverySection}>
            <Text style={styles.sectionTitle}>Delivery Information</Text>
            
            <TextInput
              mode="outlined"
              label="Delivery Address *"
              value={deliveryAddress}
              onChangeText={(text) => {
                setDeliveryAddress(text);
                if (text && Validators.minLength(text, 10)) {
                  setAddressError('');
                }
              }}
              error={!!addressError}
              placeholder="Street, City, Postal Code"
              style={styles.input}
              multiline
              numberOfLines={2}
            />
            <HelperText type="error" visible={!!addressError}>
              {addressError}
            </HelperText>

            {/* Location Selection */}
            <View style={styles.locationSection}>
              <Text style={styles.locationLabel}>Delivery Location *</Text>
              
              {deliveryLatitude && deliveryLongitude ? (
                <View style={styles.selectedLocationCard}>
                  <Icon name="location" size={20} color="#10B981" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedLocationText}>Location Selected</Text>
                    <Text style={styles.selectedLocationCoords}>
                      {deliveryLatitude.toFixed(4)}, {deliveryLongitude.toFixed(4)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={openMapPicker} style={styles.changeLocationBtn}>
                    <Text style={styles.changeLocationText}>Change</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.locationButtonsRow}>
                  <TouchableOpacity 
                    onPress={getCurrentLocation} 
                    style={[styles.locationButton, styles.currentLocationBtn]}
                    disabled={loadingLocation}
                  >
                    {loadingLocation ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Icon name="navigate" size={18} color="#fff" />
                        <Text style={styles.locationButtonText}>Use Current</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={openMapPicker} style={[styles.locationButton, styles.mapPickerBtn]}>
                    <Icon name="map" size={18} color="#fff" />
                    <Text style={styles.locationButtonText}>Pick on Map</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <HelperText type="error" visible={!!locationError}>
                {locationError}
              </HelperText>
            </View>

            <TextInput
              mode="outlined"
              label="Contact Phone *"
              value={deliveryPhone}
              onChangeText={(text) => {
                setDeliveryPhone(text);
                if (text && Validators.phone(text)) {
                  setPhoneError('');
                }
              }}
              error={!!phoneError}
              placeholder="+1234567890"
              keyboardType="phone-pad"
              style={styles.input}
            />
            <HelperText type="error" visible={!!phoneError}>
              {phoneError}
            </HelperText>

            <TextInput
              mode="outlined"
              label="Special Instructions (Optional)"
              value={deliveryNotes}
              onChangeText={setDeliveryNotes}
              placeholder="Parking instructions, gate code, etc."
              style={styles.input}
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        {/* Total Price Display */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total Price:</Text>
          <Text style={styles.price}>€{getWashTypePrice().toFixed(2)}</Text>
        </View>

          {user ? (
         <Button
  mode="contained"
  style={styles.paymentButton}
  onPress={() => handlePaymentMethodSelection('card')}
  disabled={initializingCheckout}
  buttonColor="#007AFF"
>
  {initializingCheckout ? 'Preparing checkout...' : 'Proceed to Payment'}
</Button>

          ) : (
           <Text style={styles.loginPrompt}>
  Sign in to continue with payment
</Text>

          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flex: 1, backgroundColor: '#f8f8f8' },
  container: { paddingHorizontal: 20, paddingBottom: 30 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    marginBottom: 10,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 15,
  },
  mediaImage: { width: '100%', height: '100%', borderRadius: 12 },

  programType: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  description: { fontSize: 16, color: '#666', marginBottom: 15, textAlign: 'center' },
  paymentButton: { width: '100%', paddingVertical: 10, borderRadius: 8 },
  loginPrompt: { color: '#999', fontSize: 14, textAlign: 'center' },
  errorBanner: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
  },
  
  // Wash type selection styles
  washTypeSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  washTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  washTypeSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  washTypeInfo: {
    flex: 1,
    marginLeft: 8,
  },
  washTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  washTypeDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  washTypePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  
  // Delivery section styles
  deliverySection: {
    marginTop: 10,
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  input: {
    marginBottom: 4,
    backgroundColor: '#fff',
  },
  
  // Location selection styles
  locationSection: {
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  locationButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  currentLocationBtn: {
    backgroundColor: '#10B981',
  },
  mapPickerBtn: {
    backgroundColor: '#007AFF',
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
    gap: 10,
  },
  selectedLocationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#065F46',
  },
  selectedLocationCoords: {
    fontSize: 12,
    color: '#059669',
    marginTop: 2,
  },
  changeLocationBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  changeLocationText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
  
  // Price container styles
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },

mediaContainer: {
  width: '100%',
  height: 200,
  marginBottom: 15,
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative', // needed for overlay
},
mainMedia: {
  width: '100%',
  height: '100%',
  borderRadius: 12,
},
smallPicture: {
  width: 80,
  height: 80,
  borderRadius: 12,
  position: 'absolute', // overlay
  top: 10,
  right: 10,
  borderWidth: 2,
  borderColor: '#fff',
  backgroundColor: '#fff',
  zIndex: 10,
},
loadingIndicator: {
  position: 'absolute',
  top: '50%',
  left: '50%',
  marginLeft: -15,
  marginTop: -15,
  zIndex: 20,
},
headerTitle: {
  fontSize: 18,
  fontWeight: '600',
  color: '#111827',
  flexShrink: 1,
},

});

export default BuywashScreen;
