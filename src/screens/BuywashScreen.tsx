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
    dispatch(create_paymentIntent(selectedProgram, method));
    navigation.navigate('CheckoutForm', { program: selectedProgram });
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{program.name}</Text>
        </View>

        {/* Program Details Card */}
        <View style={styles.card}>
          <Text style={styles.programType}>{program.programType}</Text>
          <Text style={styles.description}>{program.name}</Text>
          <Text style={styles.price}>${program.price}</Text>

          {user ? (
            <Button
              mode="contained"
              style={styles.paymentButton}
              disabled={paymentMethod === 'credit_card'}
              onPress={() => handlePaymentMethodSelection('credit_card')}
              buttonColor="#007AFF"
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
    backgroundColor: '#f8f8f8',
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 30,
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
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flexShrink: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    alignItems: 'center',
  },
  programType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF3B30',
    marginBottom: 20,
  },
  paymentButton: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 8,
  },
  loginPrompt: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default BuywashScreen;
