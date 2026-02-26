import { Dispatch } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { enrichProgramsWithDemoImages } from '../../data/sampleStationsData';
import { apiClient } from '../../utils/apiClient';
import { logger } from '../../utils/logger';
import { RootState } from '../store';
import {
  FETCH_PROGRAMS_FAILURE,
  FETCH_PROGRAMS_REQUEST,
  FETCH_PROGRAMS_SUCCESS,
  ProgramsAction
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


// Fetch programs action using REST API
export const fetchPrograms = (stationId: string): ThunkAction<
  Promise<void>,
  RootState,
  undefined,
  ProgramsAction
> => {
  return async (dispatch: Dispatch<ProgramsAction>) => {
    dispatch({ type: FETCH_PROGRAMS_REQUEST });
    
    try {
      const serverBase = process.env.EXPO_PUBLIC_SERVER_URL || '';
      const programEndpoints = getProgramEndpoints(serverBase, stationId);
      let lastError: any = null;

      for (const endpoint of programEndpoints) {
        try {
          logger.debug('Fetching programs', { endpoint, stationId });
          const response = await apiClient.get<any>(endpoint, { timeout: 10000 });
          const programs = response.data || [];
          // Enrich with demo images if backend data is missing pictures
          const enrichedPrograms = enrichProgramsWithDemoImages(programs);
          dispatch({
            type: FETCH_PROGRAMS_SUCCESS,
            payload: enrichedPrograms,
          });
          logger.info('Programs fetched successfully', { count: enrichedPrograms.length, stationId });
          return;
        } catch (error: any) {
          lastError = error;
          logger.warn('Program endpoint failed', { endpoint, error: error.message });
        }
      }

      throw lastError || new Error('Failed to fetch programs');
    } catch (error: any) {
      logger.error('Failed to fetch programs', { error: error.message, stationId });
      dispatch({
        type: FETCH_PROGRAMS_FAILURE,
        error: error?.message || 'Failed to fetch programs',
      });
    }
  };
};
