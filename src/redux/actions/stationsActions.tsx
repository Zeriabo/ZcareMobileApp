import { Dispatch } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { enrichStationsWithDemoImages } from '../../data/sampleStationsData';
import { apiClient } from '../../utils/apiClient';
import { logger } from '../../utils/logger';
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
          logger.debug('Fetching stations', { endpoint });
          const response = await apiClient.get<any>(endpoint, { timeout: 10000 });
          const stations = response.data || [];
          // Enrich with demo images if backend data is missing pictures
          const enrichedStations = enrichStationsWithDemoImages(stations);
          dispatch({
            type: FETCH_STATIONS_SUCCESS,
            payload: enrichedStations,
          });
          logger.info('Stations fetched successfully', { count: enrichedStations.length });
          return;
        } catch (error: any) {
          lastError = error;
          logger.warn('Failed to fetch from endpoint', { endpoint, error: error.message });
        }
      }

      throw lastError || new Error('Failed to fetch stations');
    } catch (error: any) {
      logger.error('Failed to fetch stations', { error: error.message });
      dispatch({
        type: FETCH_STATIONS_FAILURE,
        error: error?.message || 'Failed to fetch stations',
      });
    }
  };
};
