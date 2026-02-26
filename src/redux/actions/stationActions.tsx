import { Dispatch } from "react";
import { apiClient } from "../../utils/apiClient";
import { logger } from "../../utils/logger";

export const SELECT_STATION = 'SELECT_STATION';

interface SelectStationAction {
  type: typeof SELECT_STATION;
  payload: string;
}

export const selectStation = (stationId: string) => async (dispatch: Dispatch<any>) => {
  try {
    logger.debug('Selecting station', { stationId });
    const response = await apiClient.get<any>(`${process.env.EXPO_PUBLIC_SERVER_URL}/stations/${stationId}`);
    logger.info('Station selected successfully', { stationId });
    dispatch({
      type: 'SELECT_STATION',
      payload: response.data, 
    });
  } catch (error: any) {
    logger.error('Failed to select station', { stationId, error: error.message });
  }
};
