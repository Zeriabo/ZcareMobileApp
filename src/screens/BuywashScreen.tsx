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

type WashType = 'regular' | 'waterless' | 'delivery';

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
  const [washType, setWashType] = useState<WashType>('regular');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryLatitude, setDeliveryLatitude] = useState('');
  const [deliveryLongitude, setDeliveryLongitude] = useState('');
  const [addressError, setAddressError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [latitudeError, setLatitudeError] = useState('');
  const [longitudeError, setLongitudeError] = useState('');

  useEffect(() => {
    setProgram({ ...selectedProgram });
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
    
    if (!Validators.required(deliveryLatitude)) {
      setLatitudeError('Latitude is required');
      isValid = false;
    } else if (!Validators.number(deliveryLatitude)) {
      setLatitudeError('Latitude must be a valid number');
      isValid = false;
    } else {
      setLatitudeError('');
    }

    if (!Validators.required(deliveryLongitude)) {
      setLongitudeError('Longitude is required');
      isValid = false;
    } else if (!Validators.number(deliveryLongitude)) {
      setLongitudeError('Longitude must be a valid number');
      isValid = false;
    } else {
      setLongitudeError('');
    }

    return isValid;
  };

  const getWashTypePrice = (): number => {
    const basePrice = Number(program.price || 0);
    if (washType === 'waterless') {
      return basePrice * 1.15; // 15% premium for waterless
    } else if (washType === 'delivery') {
      return basePrice + 10; // €10 delivery fee
    }
    return basePrice;
  };

  const handlePaymentMethodSelection = async (method: 'card' | 'apple_pay' | 'google_pay') => {
        if (!validateDeliveryFields()) {
          Alert.alert('Missing Information', 'Please fill in all required delivery information.');
          return;
        }

    setInitializingCheckout(true);
    try {
      await dispatch(create_paymentIntent(selectedProgram, method));
      const isDeliveryType = washType !== 'regular';
      navigation.navigate('CheckoutForm', { 
        program: selectedProgram,
        washType,
        deliveryAddress: isDeliveryType ? deliveryAddress : undefined,
        deliveryPhone: isDeliveryType ? deliveryPhone : undefined,
        deliveryNotes: isDeliveryType ? deliveryNotes : undefined,
        deliveryLatitude: isDeliveryType ? Number(deliveryLatitude) : undefined,
        deliveryLongitude: isDeliveryType ? Number(deliveryLongitude) : undefined,
      });
    } catch (error: any) {
      Alert.alert(
        'Checkout unavailable',
        error?.response?.data?.message || 'We could not initialize payment. Please try again.'
      );
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
              <Text style={styles.washTypeName}>Waterless Wash</Text>
              <Text style={styles.washTypeDesc}>Eco-friendly mobile service</Text>
            </View>
            <Text style={styles.washTypePrice}>€{getWashTypePrice().toFixed(2)}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.washTypeOption, washType === 'delivery' && styles.washTypeSelected]}
            onPress={() => setWashType('delivery')}
          >
            <RadioButton
              value="delivery"
              status={washType === 'delivery' ? 'checked' : 'unchecked'}
              onPress={() => setWashType('delivery')}
            />
            <View style={styles.washTypeInfo}>
              <Text style={styles.washTypeName}>Delivery Wash</Text>
              <Text style={styles.washTypeDesc}>We come to you</Text>
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

            <TextInput
              mode="outlined"
              label="Latitude *"
              value={deliveryLatitude}
              onChangeText={(text) => {
                setDeliveryLatitude(text);
                if (text && Validators.number(text)) {
                  setLatitudeError('');
                }
              }}
              error={!!latitudeError}
              placeholder="51.5237"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <HelperText type="error" visible={!!latitudeError}>
              {latitudeError}
            </HelperText>

            <TextInput
              mode="outlined"
              label="Longitude *"
              value={deliveryLongitude}
              onChangeText={(text) => {
                setDeliveryLongitude(text);
                if (text && Validators.number(text)) {
                  setLongitudeError('');
                }
              }}
              error={!!longitudeError}
              placeholder="-0.1585"
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <HelperText type="error" visible={!!longitudeError}>
              {longitudeError}
            </HelperText>

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
