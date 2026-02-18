import { SELECT_WASHES } from '../actions/WashesActions';
import {
  FETCH_WASHES_FAILURE,
  FETCH_WASHES_SUCCESS,
  Wash,
} from '../types/washesActionTypes';


export interface WashesState {  
  washes: Wash[];
  loading: boolean;
  error: string | null;
}
const initialState: WashesState = {
  washes: [],
  loading: false,
  error: null,
};

const washesReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case 'FETCH_WASHES_REQUEST':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case SELECT_WASHES:
      return {
        ...state,
        washes: action.payload,
      };

    case FETCH_WASHES_SUCCESS:
      return {
        ...state,
        loading: false,
        washes: action.payload,
        error: null,
      };
    case FETCH_WASHES_FAILURE:
      return {
        ...state,
        loading: false,
        washes: [],
        error: action.error || 'Failed to fetch washes',
      };
    case 'SIGN_OUT':
      return {
        ...state,
        washes: [],
      };
    default:
      return state;
  }
};

export default washesReducer;
