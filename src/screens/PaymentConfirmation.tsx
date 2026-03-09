import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useLanguage } from '../contexts/LanguageContext';
import { confirm_payment } from '../redux/actions/BuyActions';

const PaymentConfirmation = () => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const dispatch = useDispatch<any>();
  const pi = useSelector((state: any) => state.cart.pi);
  // const handlePaymentConfirmationResult = (isSuccess, errorMessage) => {
  //   if (isSuccess) {
  //     // Payment confirmation succeeded, navigate to home
  //     // navigation.navigate('Home');
  //   } else {
  //     // Payment confirmation failed, display error message
  //     dispatch(addMessage({id: 1, text: errorMessage}));
  //   }
  // };
  async function confirmPayment() {
    const payment = {
      paymentIntentId: pi.paymentIntentId,
      paymentMethodId: 1,
    };
    dispatch(confirm_payment(payment));
  }

  // handlePaymentConfirmationResult(true, '');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('paymentConfirmation.title')}</Text>
      <Text>{t('paymentConfirmation.successMessage')}</Text>
      <Button
        title={t('common.confirm')}
        onPress={() => {
          confirmPayment();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default PaymentConfirmation;
