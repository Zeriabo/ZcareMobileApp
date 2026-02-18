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
import { Button } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { create_paymentIntent } from '../redux/actions/BuyActions';
import { resolveMediaUrl } from '../utils/media';

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

  useEffect(() => {
    setProgram({ ...selectedProgram });
  }, [selectedProgram]);

  const handlePaymentMethodSelection = async (method: 'card' | 'apple_pay' | 'google_pay') => {
    setInitializingCheckout(true);
    try {
      await dispatch(create_paymentIntent(selectedProgram, method));
      navigation.navigate('CheckoutForm', { program: selectedProgram });
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
<TouchableOpacity
  style={styles.backButton}
  onPress={() => navigation.goBack()}
  activeOpacity={0.6}
  accessibilityLabel="Go back"
>
  <Ionicons name="chevron-back" size={26} color="#007AFF" />
</TouchableOpacity>


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

<Text style={styles.price}>
  €{Number(program.price || 0).toFixed(2)}
</Text>


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
 backButton: {
  marginRight: 12,
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: 'center',
  justifyContent: 'center',
},



  mediaImage: { width: '100%', height: '100%', borderRadius: 12 },

  programType: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  description: { fontSize: 16, color: '#666', marginBottom: 15, textAlign: 'center' },
 price: {
  fontSize: 22,
  fontWeight: '700',
  color: '#4F46E5',
  marginBottom: 20,
},
  paymentButton: { width: '100%', paddingVertical: 10, borderRadius: 8 },
  loginPrompt: { color: '#999', fontSize: 14, textAlign: 'center' },

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
