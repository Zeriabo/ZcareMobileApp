import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import BackButton from '../components/ui/BackButton';
import { useLanguage } from '../contexts/LanguageContext';
import { confirm_payment } from '../redux/actions/BuyActions';
import { RootStackParamList } from '../redux/types/stackParams';
import { goBackOrHome } from '../utils/navigation';

type CheckoutScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CheckoutScreen'
>;

const CheckoutScreen = () => {
  const { t } = useLanguage();
  const dispatch = useDispatch<any>();
  const pi = useSelector((state: any) => state.cart.pi);
  const navigation = useNavigation<CheckoutScreenNavigationProp>();
  const [loading, setLoading] = useState(false);

  const confirmPayment = async () => {
    if (!pi) return;
    setLoading(true);

    const payment = {
      paymentIntentId: pi.paymentIntentId,
      paymentMethodId: pi.paymentMethodId,
    };

    try {
      const response = await dispatch(confirm_payment(payment));
      navigation.navigate('QrScreen', { qrCode: response.payload.qrCode });
    } catch (error: any) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={{ flexGrow: 1 }}>
      {/* Back Button */}
      <View style={styles.backWrap}>
        <BackButton onPress={() => goBackOrHome(navigation)} />
      </View>

      {/* Checkout Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('checkout.confirmYourPayment')}</Text>
        <Text style={styles.cardText}>
          {t('checkout.paymentAmount')} <Text style={styles.amount}>€{pi?.amount || '0.00'}</Text>
        </Text>

        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={confirmPayment}
          disabled={loading}
        >
          <Text style={styles.checkoutText}>
            {loading ? t('checkout.processing') : t('checkout.confirmPayment')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  backWrap: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 25,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 15,
    color: '#333',
  },
  cardText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
  },
  amount: {
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  checkoutButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CheckoutScreen;
