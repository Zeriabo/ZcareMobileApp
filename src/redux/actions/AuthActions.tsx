import axios from 'axios';
import { Dispatch } from 'redux';

import { displayLocalNotification } from '../../utils/notifications';
import { removeSession, saveSession } from "../../utils/storage";
import { getUserCars } from './carActions';
import { addMessage, clearMessages } from './messageActions';

export const signIn = (userData: any) => {
  return async (dispatch: Dispatch<any>) => {
  console.log(process.env.EXPO_PUBLIC_SERVER_URL+ '/users/signin');

 try {
  const response = await axios.post(
    process.env.EXPO_PUBLIC_SERVER_URL + '/users/signin',
    userData
  );
console.log(response.data.firstName)
  console.log('Sign in response:', response.data);
await displayLocalNotification(
          'Sign In Successful', 
          `Welcome, ${response.data.firstName || 'User'}!`
        );

await saveSession(response.data); 


  dispatch({ type: 'SIGN_IN_SUCCESS', payload: response.data });
  dispatch(getUserCars(response.data.token));
} catch (error: any) {
  console.log('Sign in error:', error);
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
