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

const normalizeToken = (token?: string) => (token || '').trim().replace(/^Bearer\s+/i, '');
const toIsoDate = (value?: string | Date) => {
  if (!value) return undefined;
  const parsed = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
};

export const registerCar: any = (userCar: any) => {
  return async (dispatch: Dispatch<any>) => {
    try {
      const rawToken = normalizeToken(userCar?.token);
      const payload = {
        ...userCar,
        token: rawToken,
        lastInspectionDate: toIsoDate(userCar?.lastInspectionDate),
      };

      const response = await apiClient.post<any>(
        process.env.EXPO_PUBLIC_SERVER_URL + '/cars/register',
        payload,
        {
          headers: rawToken
            ? {
                Authorization: `Bearer ${rawToken}`,
              }
            : undefined,
        }
      );

      // apiClient returns data directly, check if response exists (success)
      if (response) {
        const plate = response?.registerationPlate || response?.registrationPlate || payload.registrationPlate;
        const inspectionDate = payload.lastInspectionDate;

        if (plate && inspectionDate && rawToken) {
          try {
            await apiClient.put(
              `${process.env.EXPO_PUBLIC_SERVER_URL}/cars/${encodeURIComponent(plate)}/last-inspection`,
              { lastInspectionDate: inspectionDate },
              {
                headers: {
                  Authorization: `Bearer ${rawToken}`,
                  'Content-Type': 'application/json',
                },
              }
            );
          } catch (e) {
            logger.warn('Car registered but failed to sync lastInspectionDate endpoint', { plate, e });
          }
        }

        // Car registered successfully
        logger.info('Car registered successfully', { car: payload });
        dispatch(
          addMessage({
            id: 1,
            text: 'Car registered successfully',
            status: 200,
          }),
        );
        dispatch(registerCarSuccess(payload));
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
      const rawToken = normalizeToken(token);

      // Validate token exists
      if (!rawToken) {
        logger.error('No token provided for getUserCars');
        dispatch(
          addMessage({
            id: Date.now(),
            text: 'Authentication token missing. Please log in again.',
            status: 401,
          })
        );
        return;
      }

      logger.debug('Fetching user cars with token', { tokenLength: rawToken.length });

      const response = await apiClient.get<any>(`${process.env.EXPO_PUBLIC_SERVER_URL}/cars/user`, {
        headers: {
          'Authorization': `Bearer ${rawToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      // apiClient returns data directly
      const carsData = Array.isArray(response) 
        ? response 
        : (Array.isArray(response?.data) ? response.data : Object.values(response || {}));
      
      logger.info('User cars fetched successfully', { count: carsData.length });
      dispatch(getUserCarsSuccess(carsData));
    } catch (err: any) {
      const errorStatus = err?.status || err?.response?.status || 0;
      const errorMessage = err?.message || err?.details?.error || 'Failed to fetch cars';

      logger.error('Failed to get user cars', { 
        status: errorStatus,
        error: errorMessage,
        details: err?.details 
      });

      // Check if it's an authorization error
      if (errorStatus === 401 || errorMessage.includes('Unauthorized')) {
        dispatch(
          addMessage({
            id: Date.now(),
            text: 'Authentication failed. Please log in again.',
            status: 401,
          })
        );
      } else {
        dispatch(
          addMessage({
            id: Date.now(),
            text: errorMessage,
            status: errorStatus,
          })
        );
      }
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

  return async (dispatch: any, getState: any) => {
    try {
      const rawToken = normalizeToken(payload.token);
      const response = await apiClient.delete<any>(
        `${process.env.EXPO_PUBLIC_SERVER_URL}/cars/`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(rawToken ? { Authorization: `Bearer ${rawToken}` } : {}),
          },
          data: {
            carId: payload.carId,
            token: rawToken,
          },
        }
      );

      // Backend returns response with registration plate on success
      if (response) {
        const registrationPlate = response?.registrationPlate || response?.message || 'Car';
        logger.info('Car deleted successfully', { carId: payload.carId, plate: registrationPlate });
        dispatch(deleteCarSuccess(payload.carId));

        dispatch(
          addMessage({
            id: Date.now(),
            text: `${registrationPlate} is deleted`,
            status: 200,
          })
        );

        // Refresh user cars
        dispatch(getUserCars(rawToken));
      } else {
        logger.warn('Car deletion failed');
        dispatch(
          addMessage({
            id: Date.now(),
            text: 'Car deletion failed. Please try again.',
            status: 500,
          })
        );
      }

      setTimeout(() => dispatch(clearMessages()), 3000);
    } catch (error: any) {
      // Get the car's registration plate from state for error message too
      const state = getState();
      const car = state.car?.cars?.find((c: any) => c.carId === payload.carId);
      const registrationPlate = car?.registrationPlate || car?.registerationPlate || 'Car';

      const errorData = error?.response?.data || {};
      const errorMessage = errorData?.error || errorData?.message || error?.message || 'An error occurred while deleting the car';
      const errorStatus = error?.response?.status;

      logger.error('Failed to delete car', { 
        carId: payload.carId, 
        plate: registrationPlate, 
        status: errorStatus,
        error 
      });
      
      dispatch(
        addMessage({
          id: Date.now(),
          text: `${registrationPlate}: ${errorMessage}`,
          status: errorStatus || 0,
        })
      );
      
      setTimeout(() => dispatch(clearMessages()), 3000);
    }
  };
};
