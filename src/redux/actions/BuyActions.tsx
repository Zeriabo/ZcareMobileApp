import { Dispatch } from 'redux';
import { apiClient } from '../../utils/apiClient';
import { logger } from '../../utils/logger';
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
    try {
      logger.debug('Processing checkout', { program });
      const response = await apiClient.post<any>(
        process.env.EXPO_PUBLIC_SERVER_URL+ '/payment/create-payment-intent',
        program
      );
      logger.info('Checkout successful');
      dispatch({type: 'CHECKOUT_SUCCESS', payload: response});
    } catch (error: any) {
      logger.error('Checkout failed', { error: error.message });
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
    }
  };
};

export const create_paymentIntent = (program: any, method: 'card' | 'apple_pay' | 'google_pay') => {
  return async (dispatch: Dispatch<any>) => {
    const paymentMethodType = method === 'card' ? 'credit_card' : method;
    const allowedProgramTypes = new Set(['foam', 'high_pressure', 'touchless', 'touch_less']);
    const requestedProgramType = String(program?.paymentProgramType || program?.programType || '');
    const safeProgramType = allowedProgramTypes.has(requestedProgramType)
      ? requestedProgramType
      : 'foam';
    const safeProgramId = Number(program?.paymentProgramId ?? program?.id);
    const safePrice = Number(program?.price);

    const paymentRequest = {
      program: {
        id: Number.isFinite(safeProgramId) && safeProgramId > 0 ? safeProgramId : 1,
        name: String(program?.name || 'Service'),
        price: Number.isFinite(safePrice) ? safePrice : 0,
        programType: safeProgramType,
      },
      paymentMethod: {
        paymentMethodType, 
      },
    };

    logger.debug('Creating payment intent', { paymentRequest });

    try {
      const response = await apiClient.post<any>(
        `${process.env.EXPO_PUBLIC_SERVER_URL}/payment/create-payment-intent`,
        paymentRequest
      );

      logger.info('Payment intent created successfully');
      dispatch({ type: 'PAYMENT_INTENT_SUCCESS', payload: response });
      return response;
    } catch (error: any) {
      logger.error('Failed to create payment intent', { error: error.message });
      const backendMessage =
        typeof error?.response?.data === 'string'
          ? error.response.data
          : error?.response?.data?.message || JSON.stringify(error?.response?.data);
      dispatch(
        addMessage({
          id: 1,
          text: backendMessage || 'Payment failed',
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
    try {
      logger.debug('Confirming payment');
      const response = await apiClient.post<any>(
        process.env.EXPO_PUBLIC_SERVER_URL + '/payment/confirm-payment',
        payment,
      );
      logger.info('Payment confirmed successfully');
      dispatch(updateBookingSuccess(response));
      await displayLocalNotification(
        'Booking Successfully paid!', 
        `${response}!`
      );
      dispatch({type: 'PAYMENT_INTENT_SUCCESS', payload: response});
    } catch (error: any) {
      logger.error('Failed to confirm payment', { error: error.message });
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
    }
  };
};
