import axios from "axios";
import { Dispatch } from "react";

export const SELECT_STATION = 'SELECT_STATION';

interface SelectStationAction {
  type: typeof SELECT_STATION;
  payload: string;
}

export const selectStation = (stationId: string) => async (dispatch: Dispatch<any>) => {
  try {
    const response = await axios.get(`${process.env.EXPO_PUBLIC_SERVER_URL}/stations/${stationId}`);
    dispatch({
      type: 'SELECT_STATION',
      payload: response.data, 
    });
  } catch (error: any) {
    console.log("Error fetching station:", error);
  }
};
