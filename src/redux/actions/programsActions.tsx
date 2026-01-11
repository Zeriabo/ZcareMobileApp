import axios from 'axios';
import { Dispatch } from 'redux';
import {
  FETCH_STATIONS_SUCCESS,
  FETCH_STATIONS_FAILURE,
  ProgramsAction,
  FETCH_PROGRAMS_REQUEST,
  FETCH_PROGRAMS_SUCCESS,
  FETCH_PROGRAMS_FAILURE,
} from '../types/stationsActionTypes';
import { RootState } from '../store';
import { ThunkAction } from 'redux-thunk';


// Fetch stations action using REST API
export const fetchPrograms = (stationId: string): ThunkAction<
  Promise<void>,
  RootState,
  undefined,
  ProgramsAction
> => {
  return async (dispatch: Dispatch<ProgramsAction>) => {
    dispatch({ type:  FETCH_PROGRAMS_REQUEST });
console.log("fetching programs");
    try {
      const response = await axios.get(
       process.env.EXPO_PUBLIC_SERVER_URL+ '/programs/station/' + stationId,
      );

      const programs = response.data;
console.log(programs)
      dispatch({
        type: FETCH_PROGRAMS_SUCCESS,
        payload: programs,
      });
    } catch (error: any) {
      dispatch({
        type: FETCH_PROGRAMS_FAILURE,
        error:
          error.response?.data?.message ||
          error.message ||
          'Failed to fetch stations',
      });
    }
  };
};
