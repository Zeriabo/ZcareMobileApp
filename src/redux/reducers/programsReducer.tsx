import {
  CarWashingProgram,
  FETCH_PROGRAMS_FAILURE,
  FETCH_PROGRAMS_REQUEST,
  FETCH_PROGRAMS_SUCCESS,
} from '../types/stationsActionTypes';

export interface ProgramsState {
  programs: CarWashingProgram[];
  loading: boolean;
  error: string | null;
}

const initialState: ProgramsState = {
  programs: [],
  loading: false,
  error: null,
};

type ProgramsAction =
  | { type: typeof FETCH_PROGRAMS_REQUEST }
  | { type: typeof FETCH_PROGRAMS_SUCCESS; payload: CarWashingProgram[] }
  | { type: typeof FETCH_PROGRAMS_FAILURE; error: string };

export const programsReducer = (
  state = initialState,
  action: ProgramsAction,
): ProgramsState => {
  switch (action.type) {
    case FETCH_PROGRAMS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_PROGRAMS_SUCCESS:
      return { ...state, loading: false, programs: action.payload };
    case FETCH_PROGRAMS_FAILURE:
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
};
