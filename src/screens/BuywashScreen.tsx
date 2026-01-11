import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { create_paymentIntent } from '../redux/actions/BuyActions';

type Props = {
  route: any;
  navigation: any;
};

const BuywashScreen: React.FC<Props> = ({ route, navigation }) => {
  const dispatch = useDispatch<any>();
const { pi } = useSelector((state: any) => state.cart);
const { user } = useSelector((state: any) => state.user);
  const selectedProgram = route.params.selectedProgram;
  const [program, setProgram] = useState<any>({});
  const [paymentMethod, setPaymentMethod] = useState<string>('');

  useEffect(() => {
    setProgram({ ...selectedProgram });
  }, [selectedProgram]);

 useEffect(() => {
  if (pi && pi.paymentIntentId) {
    setPaymentMethod(pi.paymentMethod);
  } else {
    setPaymentMethod('');
  }
}, [pi]);

const handlePaymentMethodSelection = (method: string) => {
  setPaymentMethod(method);
  console.log('Selected Program:', selectedProgram);
  dispatch(create_paymentIntent(selectedProgram, method));


  navigation.navigate('CheckoutForm', { program: selectedProgram });
};

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false, 
    });
  }, [navigation]);

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Program Details Card */}
        <View style={styles.card}>
          <Text style={styles.title}>{program.programType}</Text>
          <Text style={styles.description}>{program.name}</Text>
          <Text style={styles.price}>Price: ${program.price}</Text>

          {user ? (
            <Button
              mode="contained"
              style={styles.paymentButton}
              disabled={paymentMethod === 'credit_card'}
              onPress={() => handlePaymentMethodSelection('credit_card')}
            >
              Pay with Credit Card
            </Button>
          ) : (
            <Text style={styles.loginPrompt}>
              Please log in to proceed with payment
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    padding: 20,
    alignItems: 'center',
   paddingTop: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  price: {
    fontSize: 18,
    color: '#FF3B30',
    fontWeight: '600',
    marginBottom: 20,
  },
  paymentButton: {
    width: '100%',
    paddingVertical: 8,
    borderRadius: 8,
  },
  loginPrompt: {
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default BuywashScreen;
