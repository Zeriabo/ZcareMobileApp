import axios from 'axios';
import { Dispatch } from 'redux';

import { displayLocalNotification } from '../../utils/notifications';
import { removeSession, saveSession } from "../../utils/storage";
import { getUserCars } from './carActions';
import { addMessage, clearMessages } from './messageActions';

let signInInFlight = false;

const maskAuthPayload = (payload: any) => ({
  ...payload,
  password: payload?.password ? '***' : payload?.password,
});

const getAuthEndpoint = (baseUrlRaw: string): string | null => {
  const baseUrl = (baseUrlRaw || '').trim().replace(/\/+$/, '');
  if (!baseUrl) return null;
  return `${baseUrl}/users/signin`;
};

export const signIn = (userData: any) => {
  return async (dispatch: Dispatch<any>) => {
    if (signInInFlight) return;
    signInInFlight = true;

    const sanitizedUserData = {
      ...userData,
      username: typeof userData?.username === 'string' ? userData.username.trim() : userData?.username,
      email: typeof userData?.email === 'string' ? userData.email.trim() : userData?.email,
    };
    const authEndpoint = getAuthEndpoint(process.env.EXPO_PUBLIC_SERVER_URL || '');
    console.log('[signIn] endpoint:', authEndpoint);
    console.log('[signIn] Request body (safe):', maskAuthPayload(sanitizedUserData));

    let lastError: any = null;
    const requestTimeout = 6000;

    try {
      if (!authEndpoint) {
        dispatch(
          addMessage({
            id: 1,
            text: 'Missing EXPO_PUBLIC_SERVER_URL',
            status: 500,
          }),
        );
        return;
      }

      try {
        const response = await axios.post(
          authEndpoint,
          sanitizedUserData,
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            timeout: requestTimeout,
          },
        );
        await displayLocalNotification(
          'Sign In Successful',
          `Welcome, ${response.data.firstName || 'User'}!`
        );
        await saveSession(response.data);
        dispatch({ type: 'SIGN_IN_SUCCESS', payload: response.data });
        dispatch(getUserCars(response.data.token));
        return;
      } catch (error: any) {
        lastError = error;
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          dispatch(
            addMessage({
              id: 1,
              text:
                error?.response?.data?.message ||
                JSON.stringify(error?.response?.data) ||
                'Invalid credentials',
              status,
            }),
          );
          return;
        }
      }

      const finalStatus = lastError?.response?.status || 500;
      const finalMessage =
        lastError?.response?.data?.message ||
        (typeof lastError?.response?.data === 'string' ? lastError?.response?.data : '') ||
        lastError?.message ||
        'Network Error';

      dispatch(
        addMessage({
          id: 1,
          text: finalMessage,
          status: finalStatus,
        }),
      );
      console.log('[signIn] final error:', {
        message: finalMessage,
        status: finalStatus,
        lastUrl: lastError?.config?.url,
      });
    } finally {
      signInInFlight = false;
      setTimeout(() => {
        dispatch(clearMessages());
      }, 2000);
    }
  };
};
export const signUp = (userData: any) => {
  return async (dispatch: Dispatch<any>) => {
    await axios
      .post(process.env.EXPO_PUBLIC_SERVER_URL + '/users/register', userData)
      .then((response: any) => {
        dispatch(
          addMessage({
            id: 1,
            text: 'Registeration successful',
            status: 200,
          }),
        );
        dispatch({type: 'SIGN_UP_SUCCESS', payload: response.data});
      })
      .catch((error: any) => {
        if (error.response.status == 500) {
          dispatch(
            addMessage({
              id: 1,
              text: error.response.data,
              status: 500,
            }),
          );
          dispatch({type: 'SIGN_UP_FAILED', payload: error.response.data});
        } else {
          dispatch(
            addMessage({
              id: error.response.status,
              text: error.response.data,
              status: 500,
            }),
          );
          dispatch({type: 'SIGN_UP_FAILED', payload: error.response.data});
        }

        setTimeout(() => {
          dispatch(clearMessages());
        }, 2000);
      });
  };
};
export const signOut = () => {
  return async (dispatch: Dispatch<any>) => {
    await removeSession(); // clear stored token
    dispatch({ type: 'SIGN_OUT' });
  };
};
