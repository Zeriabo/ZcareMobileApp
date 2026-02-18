import axios from 'axios';
import { Dispatch } from 'redux';

import { displayLocalNotification } from '../../utils/notifications';
import { updateBookingSuccess } from './BookingActions';
import { addMessage, clearMessages } from './messageActions';
export const buyWash = (program: any) => {
  return {
    type: 'BUY_WASH',
    program: program,
  };
};

export const checkout = (program: any) => {
  return async (dispatch: Dispatch<any>) => {
    await axios
      .post(
        process.env.EXPO_PUBLIC_SERVER_URL+ '/payment/create-payment-intent',
        program
      )
      .then(response => {
        dispatch({type: 'CHECKOUT_SUCCESS', payload: response.data});
      })
      .catch(error => {
        dispatch(
          addMessage({
            id: 1,
            text: error.response?.data || 'Payment failed',
            status: 0,
          }),
        );
        setTimeout(() => {
          dispatch(clearMessages());
        }, 2000);
      });
  };
};

export const create_paymentIntent = (program: any, method: 'card' | 'apple_pay' | 'google_pay') => {
  return async (dispatch: Dispatch<any>) => {

    const paymentRequest = {
      program: {
        id: program.id,
        name: program.name,
        price: program.price, 
        programType: program.programType,
      },
      paymentMethod: {
        paymentMethodType: method, 
      },
    };

    console.log('Payment Request:', paymentRequest);

    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_SERVER_URL}/payment/create-payment-intent`,
        paymentRequest
      );

      dispatch({ type: 'PAYMENT_INTENT_SUCCESS', payload: response.data });
      return response.data;
    } catch (error: any) {
      dispatch(
        addMessage({
          id: 1,
          text: error.response?.data || 'Payment failed',
          status: 500,
        })
      );
      setTimeout(() => dispatch(clearMessages()), 2000);
      throw error;
    }
  };
};


export const confirm_payment: any = (payment: any) => {
  return async (dispatch: Dispatch<any>) => {
    await axios
      .post(
        process.env.EXPO_PUBLIC_SERVER_URL + '/payment/confirm-payment',
        payment,
      )
      .then(async response => {
        //this will return the status of the payment
        console.log('confirm payment');
        console.log(response);
         dispatch(updateBookingSuccess(response.data));
                    await displayLocalNotification(
                        'Booking Successfully paid!', 
                        `${response.data}!`
                      );
        dispatch({type: 'PAYMENT_INTENT_SUCCESS', payload: response.data});
      })
      .catch(error => {
        dispatch(
          addMessage({
            id: 1,
            text: error.response.data,
            status: 500,
          }),
        );
        setTimeout(() => {
          dispatch(clearMessages());
        }, 2000);
      });
  };
};
