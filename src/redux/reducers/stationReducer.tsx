import {Action} from 'redux';
import {SELECT_STATION} from '../actions/stationActions';

interface StationState {
  selectedStationId: string | null;
}
const initialState: StationState = {
  selectedStationId: null,
};

const stationReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case SELECT_STATION:
      return {
        ...state,
        selectedStation: action.payload,
      };
    default:
      return state;
  }
};

export default stationReducer;
