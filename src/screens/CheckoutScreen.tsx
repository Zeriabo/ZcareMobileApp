import { HeaderBackButton } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { confirm_payment } from '../redux/actions/BuyActions';
import { RootStackParamList } from '../redux/types/stackParams';
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1, // Use flex to center content vertically
    backgroundColor: 'gray',
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
  },
  boxedContainer: {
    width: '80%', // Adjust the width as needed
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 5,
    backgroundColor: 'gray',
  },
  checkoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 5,
    backgroundColor: 'purple',
    marginTop: 16,
  },
  checkoutText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  backButton: {
    marginRight: 300,
  },
  backButtonText: {
    fontSize: 16,
    color: 'blue',
  },
});
type CheckoutScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CheckoutScreen'
>;
const CheckoutScreen =  ({ route }: { route: any; navigation: CheckoutScreenNavigationProp }) => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const pi = useSelector((state: any) => state.cart.pi);
const navigation = useNavigation<CheckoutScreenNavigationProp>();

  const item = route.params;
  useEffect(() => {
    setLoading(false);
  }, []);
  
const confirmPayment = async () => {
  const payment = {
    paymentIntentId: pi.paymentIntentId,
    paymentMethodId: pi.paymentMethodId,
  };

  try {
    const response = await dispatch(confirm_payment(payment));

    // Navigate to QR screen instead of alert
    navigation.navigate('QrScreen', { qrCode: response.payload.qrCode });
  } catch (error: any) {
    console.error('Payment error:', error);
  }
};




  return (
    <View style={styles.mainContainer}>
      <HeaderBackButton
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      />
      <View style={styles.boxedContainer}>
        {/* Display your checkout details here */}
        <TouchableOpacity
          onPress={confirmPayment}
          style={styles.checkoutButton}>
          <Text style={styles.checkoutText}>Confirm Payment</Text>
        </TouchableOpacity>
      </View>
      
    </View>
  );
};

export default CheckoutScreen;
