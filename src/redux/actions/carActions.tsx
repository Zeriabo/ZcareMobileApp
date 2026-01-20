import axios from 'axios';
import { Dispatch } from 'redux';
import Car from '../types/CarType';
import { addMessage, clearMessages } from './messageActions';

// Action types
export const REGISTER_CAR_SUCCESS = 'REGISTER_CAR_SUCCESS';
export const GET_CAR_SUCCESS = 'GET_CAR_SUCCESS';
export const GET_USER_CARS_SUCCESS = 'GET_USER_CARS_SUCCESS';
export const SET_CAR_OWNER_SUCCESS = 'SET_CAR_OWNER_SUCCESS';
export const DELETE_CAR_SUCCESS = 'DELETE_CAR_SUCCESS';

// Action creators
export const registerCarSuccess = (car: Car) => ({
  type: REGISTER_CAR_SUCCESS,
  payload: car,
});

export const getCarSuccess = (car: Car) => ({
  type: GET_CAR_SUCCESS,
  payload: car,
});

export const getUserCarsSuccess = (cars: Car[]) => ({
  type: GET_USER_CARS_SUCCESS,
  payload: cars,
});

export const setCarOwnerSuccess = () => ({
  type: SET_CAR_OWNER_SUCCESS,
});
export const deleteCarSuccess = (carId: Number) => ({
  type: DELETE_CAR_SUCCESS,
  payload: carId,
});
export const registerCar: any = (userCar: any) => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const response = await axios.post(
        process.env.EXPO_PUBLIC_SERVER_URL + '/cars/register',
        userCar,
      );

      if (response.status === 201) {
        // Car registered successfully
        dispatch(
          addMessage({
            id: 1,
            text: 'Car registered successfully',
            status: 200,
          }),
        );
        dispatch(registerCarSuccess(userCar));
        setTimeout(() => {
          dispatch(clearMessages());
        }, 2000);
      } else {
        dispatch(
          addMessage({
            id: 1,
            text: 'Car registration failed',
            status: 500,
          }),
        );
        setTimeout(() => {
          dispatch(clearMessages());
        }, 2000);
      }
    } catch (error) {
      dispatch(
        addMessage({
          id: 1,
          text: 'An error occurred',
          status: 0,
        }),
      );
      setTimeout(() => {
        dispatch(clearMessages());
      }, 2000);
    }
  };
};

export const getCar = (registrationPlate: string) => {
  return async (dispatch: Dispatch) => {
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_SERVER_URL+ `/cars/${registrationPlate}`,
      );
      dispatch(getCarSuccess(response.data));
    } catch (error: any) {
      dispatch(
        addMessage({
          id: 1,
          text: error,
          status: 0,
        }),
      );
    }
  };
};

export const getUserCars = (token: string) => {
  return async (dispatch: Dispatch) => {
    try {
    const response = await axios.get(`${process.env.EXPO_PUBLIC_SERVER_URL}/cars/user`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
      dispatch(getUserCarsSuccess(response.data));
    } catch (err: any) {
      console.log("getUserCars error:", err);

      const message =
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        err.message;

      dispatch(
        addMessage({
          id: Date.now(),
          text: message,
          status: err.response?.status || 500,
        }),
      );
    }
  };
};



export const setCarOwner = (userCar: any) => {
  return async (dispatch: Dispatch) => {
    try {
      await axios.post(process.env.EXPO_PUBLIC_SERVER_URL + '/cars/set', userCar);
      dispatch(setCarOwnerSuccess());
    } catch (error) {
      // Handle error
    }
  };
};
export const deleteCar = (payload: { carId: number; token: string }) => {
  console.log("Deleting car:", payload);

  return async (dispatch: any) => {
    try {
      const response = await axios.delete(
        `${process.env.EXPO_PUBLIC_SERVER_URL}/cars/`,
        {
          headers: { 'Content-Type': 'application/json' },
          data: {
            carId: payload.carId,
            token: payload.token,
          },
        }
      );

      if (response.status === 202) {
        dispatch(deleteCarSuccess(payload.carId));

        // ✅ Dispatch proper message object
        dispatch(
          addMessage({
            id: Date.now(),
            text: 'Car deleted successfully',
            status: 200,
          })
        );

        // Refresh user cars
        dispatch(getUserCars(payload.token));
      } else {
        dispatch(
          addMessage({
            id: Date.now(),
            text: 'Car deletion failed',
            status: 500,
          })
        );
      }

      setTimeout(() => dispatch(clearMessages()), 2000);
    } catch (error: any) {
      console.error('Delete Car Error:', error.toJSON?.() || error);
      dispatch(
        addMessage({
          id: Date.now(),
          text: 'An error occurred while deleting the car',
          status: 0,
        })
      );
      setTimeout(() => dispatch(clearMessages()), 2000);
    }
  };
};
