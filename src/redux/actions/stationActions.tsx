export const SELECT_STATION = 'SELECT_STATION';

interface SelectStationAction {
  type: typeof SELECT_STATION;
  payload: string;
}

export const selectStation = (stationId: string): SelectStationAction => {
  return {
    type: SELECT_STATION,
    payload: stationId,
  };
};
