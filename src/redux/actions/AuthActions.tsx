import axios from 'axios';
import { Dispatch } from 'redux';

import { displayLocalNotification } from '../../utils/notifications';
import { removeSession, saveSession } from "../../utils/storage";
import { getUserCars } from './carActions';
import { addMessage, clearMessages } from './messageActions';

const maskAuthPayload = (payload: any) => ({
  ...payload,
  password: payload?.password ? '***' : payload?.password,
});

const maskConfigData = (data: any) => {
  if (!data) return data;
  if (typeof data === 'string') {
    try {
      return maskAuthPayload(JSON.parse(data));
    } catch {
      return data;
    }
  }
  return maskAuthPayload(data);
};

export const signIn = (userData: any) => {
  return async (dispatch: Dispatch<any>) => {
  const signInUrl = `${process.env.EXPO_PUBLIC_SERVER_URL}/users/signin`;
  console.log('[signIn] URL:', signInUrl);
  console.log('[signIn] Request body (safe):', maskAuthPayload(userData));

 try {
  const response = await axios.post(
    signInUrl,
    userData,
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 15000,
    },
  );
  console.log('[signIn] Response status:', response.status);
  console.log('[signIn] Response data:', response.data);
await displayLocalNotification(
          'Sign In Successful', 
          `Welcome, ${response.data.firstName || 'User'}!`
        );

await saveSession(response.data); 


  dispatch({ type: 'SIGN_IN_SUCCESS', payload: response.data });
  dispatch(getUserCars(response.data.token));
} catch (error: any) {
  console.log('Sign in error:', {
    message: error?.message,
    code: error?.code,
    status: error?.response?.status,
    data: error?.response?.data,
    config: {
      url: error?.config?.url,
      method: error?.config?.method,
      timeout: error?.config?.timeout,
      headers: error?.config?.headers,
      data: maskConfigData(error?.config?.data),
    },
  });

  if (axios.isAxiosError(error) && !error.response) {
    try {
      const fallbackResponse = await fetch(signInUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(userData),
      });
      console.log('[signIn][fetch] Request body (safe):', maskAuthPayload(userData));
      console.log('[signIn][fetch] Status:', fallbackResponse.status);

      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        console.log('[signIn][fetch] Succeeded with data:', data);
        await displayLocalNotification(
          'Sign In Successful',
          `Welcome, ${data.firstName || 'User'}!`,
        );
        await saveSession(data);
        dispatch({ type: 'SIGN_IN_SUCCESS', payload: data });
        dispatch(getUserCars(data.token));
        return;
      }

      const fallbackText = await fallbackResponse.text();
      dispatch(
        addMessage({
          id: 1,
          text: `Sign in failed (${fallbackResponse.status}): ${fallbackText}`,
          status: fallbackResponse.status,
        }),
      );
    } catch (fallbackError: any) {
      console.log('Fetch fallback failed:', fallbackError?.message || fallbackError);
      dispatch(
        addMessage({
          id: 1,
          text: fallbackError?.message || 'Network Error',
          status: 500,
        }),
      );
    }
    setTimeout(() => {
      dispatch(clearMessages());
    }, 2000);
    return;
  }

  dispatch(
    addMessage({
      id: 1,
      text:
        error.response?.data?.message ||
        JSON.stringify(error.response?.data) ||
        error.message,
      status: 500,
    })
  );

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
