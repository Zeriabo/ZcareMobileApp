import axios from 'axios';
import { Dispatch } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { enrichStationsWithDemoImages } from '../../data/sampleStationsData';
import { RootState } from '../store';
import {
  FETCH_STATIONS_FAILURE,
  FETCH_STATIONS_REQUEST,
  FETCH_STATIONS_SUCCESS,
  StationsAction
} from '../types/stationsActionTypes';

const getStationEndpoints = (baseUrlRaw: string): string[] => {
  const baseUrl = (baseUrlRaw || '').trim().replace(/\/+$/, '');
  if (!baseUrl) return [];

  const endpoints = [`${baseUrl}/stations/`];

  // Gateway on :8080 can be down while station service on :8090 is healthy.
  if (baseUrl.includes(':8080')) {
    endpoints.push(`${baseUrl.replace(':8080', ':8090')}/v1/stations/`);
  }

  if (!baseUrl.includes(':8090')) {
    endpoints.push(`${baseUrl}/v1/stations/`);
  }

  return Array.from(new Set(endpoints));
};


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
      const serverBase = process.env.EXPO_PUBLIC_SERVER_URL || '';
      const stationEndpoints = getStationEndpoints(serverBase);
      let lastError: any = null;

      for (const endpoint of stationEndpoints) {
        try {
          const response = await axios.get(endpoint, { timeout: 10000 });
          const stations = response.data || [];
          // Enrich with demo images if backend data is missing pictures
          const enrichedStations = enrichStationsWithDemoImages(stations);
          dispatch({
            type: FETCH_STATIONS_SUCCESS,
            payload: enrichedStations,
          });
          return;
        } catch (error: any) {
          lastError = error;
          console.log('Station endpoint failed:', endpoint, error?.message);
        }
      }

      throw lastError || new Error('Failed to fetch stations');
    } catch (error: any) {
      console.log('Failed to fetch stations:', error?.message);
      dispatch({
        type: FETCH_STATIONS_FAILURE,
        error: error?.message || 'Failed to fetch stations',
      });
    }
  };
};
