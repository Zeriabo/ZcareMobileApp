import { Dispatch } from 'redux';
import { apiClient } from '../../utils/apiClient';
import { logger } from '../../utils/logger';
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
      const response = await apiClient.post<any>(
        process.env.EXPO_PUBLIC_SERVER_URL + '/cars/register',
        userCar,
      );

      // apiClient returns data directly, check if response exists (success)
      if (response) {
        // Car registered successfully
        logger.info('Car registered successfully', { car: userCar });
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
        logger.warn('Car registration failed');
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
      logger.error('Failed to register car', { error });
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
      const response = await apiClient.get<any>(
        process.env.EXPO_PUBLIC_SERVER_URL+ `/cars/${registrationPlate}`,
      );
      dispatch(getCarSuccess(response));
    } catch (error: any) {
      logger.error('Failed to get car', { registrationPlate, error });
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
    const response = await apiClient.get<any>(`${process.env.EXPO_PUBLIC_SERVER_URL}/cars/user`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
      
      // apiClient returns data directly
      const carsData = Array.isArray(response) 
        ? response 
        : (Array.isArray(response?.data) ? response.data : Object.values(response || {}));
      
      logger.info('User cars fetched successfully', { count: carsData.length });
      dispatch(getUserCarsSuccess(carsData));
    } catch (err: any) {
      logger.error('Failed to get user cars', { error: err.message });

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
      await apiClient.post(process.env.EXPO_PUBLIC_SERVER_URL + '/cars/set', userCar);
      logger.info('Car owner set successfully');
      dispatch(setCarOwnerSuccess());
    } catch (error) {
      logger.error('Failed to set car owner', { error });
    }
  };
};
export const deleteCar = (payload: { carId: number; token: string }) => {
  logger.debug('Deleting car', { carId: payload.carId });

  return async (dispatch: any) => {
    try {
      const response = await apiClient.delete<any>(
        `${process.env.EXPO_PUBLIC_SERVER_URL}/cars/`,
        {
          headers: { 'Content-Type': 'application/json' },
          data: {
            carId: payload.carId,
            token: payload.token,
          },
        }
      );

      // apiClient returns data directly, check if response exists (success)
      if (response) {
        logger.info('Car deleted successfully', { carId: payload.carId });
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
        logger.warn('Car deletion failed');
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
      logger.error('Failed to delete car', { carId: payload.carId, error });
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
