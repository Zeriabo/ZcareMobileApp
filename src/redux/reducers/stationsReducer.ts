import {
  FETCH_STATIONS_FAILURE,
  FETCH_STATIONS_REQUEST,
  FETCH_STATIONS_SUCCESS,
  Station
} from '../types/stationsActionTypes';

export interface StationsState {
  stations: Station[];
  selectedStation?: Station; 
  error: string | null;
  loading: boolean;
}


const initialState: StationsState = {
  stations: [],
  error: null,
  loading: false,
};

const stationsReducer = (state = initialState, action: any): StationsState => {
  switch (action.type) {
    case FETCH_STATIONS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_STATIONS_SUCCESS:
      return {
        ...state,
        loading: false,
        stations: action.payload,
        error: null,
      };
    case FETCH_STATIONS_FAILURE:
      return {
        ...state,
        loading: false,
        stations: [],
        error: action.error || 'Failed to fetch stations',
      };
    default:
      return state;
  }
};

export default stationsReducer;
