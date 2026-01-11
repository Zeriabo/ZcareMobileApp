import axios from 'axios';
import { Dispatch } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { RootState } from '../store';
import {
  FETCH_STATIONS_FAILURE,
  FETCH_STATIONS_REQUEST,
  FETCH_STATIONS_SUCCESS,
  StationsAction,
} from '../types/stationsActionTypes';


// Fetch stations action using REST API
export const fetchStations = (): ThunkAction<
  Promise<void>,
  RootState,
  undefined,
  StationsAction
> => {
  return async (dispatch: Dispatch<StationsAction>) => {
    dispatch({ type: FETCH_STATIONS_REQUEST });

    try {
      console.log("SERVER URL:", process.env.EXPO_PUBLIC_SERVER_URL);

      const response = await axios.get(
        process.env.EXPO_PUBLIC_SERVER_URL + '/stations/'
      );
console.log(response)
      const stations = response.data;

      dispatch({
        type: FETCH_STATIONS_SUCCESS,
        payload: stations,
      });
    } catch (error: any) {
      console.log(error)
      dispatch({
        type: FETCH_STATIONS_FAILURE,
        error:
          error.response?.data?.message ||
          error.message ||
          'Failed to fetch stations',
      });
    }
  };
};
