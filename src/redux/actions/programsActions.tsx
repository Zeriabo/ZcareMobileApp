import axios from 'axios';
import { Dispatch } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { RootState } from '../store';
import {
  FETCH_PROGRAMS_FAILURE,
  FETCH_PROGRAMS_REQUEST,
  FETCH_PROGRAMS_SUCCESS,
  ProgramsAction,
} from '../types/stationsActionTypes';

const getProgramEndpoints = (baseUrlRaw: string, stationId: string): string[] => {
  const baseUrl = (baseUrlRaw || '').trim().replace(/\/+$/, '');
  if (!baseUrl) return [];

  const endpoints = [`${baseUrl}/programs/station/${stationId}`];

  if (baseUrl.includes(':8080')) {
    endpoints.push(`${baseUrl.replace(':8080', ':8090')}/v1/programs/station/${stationId}`);
  }

  if (!baseUrl.includes(':8090')) {
    endpoints.push(`${baseUrl}/v1/programs/station/${stationId}`);
  }

  return Array.from(new Set(endpoints));
};


// Fetch stations action using REST API
export const fetchPrograms = (stationId: string): ThunkAction<
  Promise<void>,
  RootState,
  undefined,
  ProgramsAction
> => {
  return async (dispatch: Dispatch<ProgramsAction>) => {
    dispatch({ type:  FETCH_PROGRAMS_REQUEST });
    console.log('fetching programs');
    try {
      const serverBase = process.env.EXPO_PUBLIC_SERVER_URL || '';
      const programEndpoints = getProgramEndpoints(serverBase, stationId);
      let lastError: any = null;

      for (const endpoint of programEndpoints) {
        try {
          const response = await axios.get(endpoint, { timeout: 10000 });
          const programs = response.data;
          console.log(programs);
          dispatch({
            type: FETCH_PROGRAMS_SUCCESS,
            payload: programs,
          });
          return;
        } catch (error: any) {
          lastError = error;
          console.log('Program endpoint failed:', endpoint, error?.message || error);
        }
      }

      throw lastError || new Error('Failed to fetch programs');
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
