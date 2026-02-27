import { Dispatch } from 'redux';
import { apiClient } from '../../utils/apiClient';
import { logger } from '../../utils/logger';
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
    logger.debug('Sign in attempt', { endpoint: authEndpoint, username: sanitizedUserData.username });

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
        const response = await apiClient.post<any>(
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
        
        // apiClient returns data directly
        let userData = response;
        
        // Handle response wrapped in numeric keys (like other endpoints)
        if (userData && typeof userData === 'object' && !userData.token && Object.keys(userData).some(k => !isNaN(Number(k)))) {
          const values = Object.values(userData);
          if (values.length > 0 && typeof values[0] === 'object' && (values[0] as any)?.token) {
            userData = values[0];
          }
        }
        
        logger.info('Sign in successful', { 
          username: sanitizedUserData.username, 
          hasToken: !!userData?.token,
          hasFirstName: !!userData?.firstName 
        });
        
        try {
          await displayLocalNotification(
            'Sign In Successful',
            `Welcome, ${userData?.firstName || userData?.username || 'User'}!`
          );
        } catch (notifError) {
          logger.warn('Notification failed but continuing', { error: notifError });
        }
        
        try {
          await saveSession(userData);
        } catch (sessionError) {
          logger.warn('Save session failed but continuing', { error: sessionError });
        }
        
        dispatch({ type: 'SIGN_IN_SUCCESS', payload: userData });
        
        if (userData?.token) {
          dispatch(getUserCars(userData.token));
        }
        return;
      } catch (error: any) {
        lastError = error;
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          logger.warn('Sign in failed - invalid credentials', { status });
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
      logger.error('Sign in failed', { message: finalMessage, status: finalStatus });
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
    try {
      logger.debug('Sign up attempt', { username: userData.username });
      const response = await apiClient.post<any>(
        process.env.EXPO_PUBLIC_SERVER_URL + '/users/register',
        userData
      );
      logger.info('Sign up successful', { username: userData.username });
      dispatch(
        addMessage({
          id: 1,
          text: 'Registeration successful',
          status: 200,
        }),
      );
      dispatch({type: 'SIGN_UP_SUCCESS', payload: response});
    } catch (error: any) {
      logger.error('Sign up failed', { error: error.message });
      if (error.response?.status == 500) {
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
            id: error.response?.status || 500,
            text: error.response.data,
            status: 500,
          }),
        );
        dispatch({type: 'SIGN_UP_FAILED', payload: error.response.data});
      }

      setTimeout(() => {
        dispatch(clearMessages());
      }, 2000);
    }
  };
};
export const signOut = () => {
  return async (dispatch: Dispatch<any>) => {
    await removeSession(); // clear stored token
    dispatch({ type: 'SIGN_OUT' });
  };
};
