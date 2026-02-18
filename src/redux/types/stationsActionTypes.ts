// stationsActionTypes.ts
export const FETCH_STATIONS_REQUEST = 'FETCH_STATIONS_REQUEST';
export const FETCH_STATIONS_SUCCESS = 'FETCH_STATIONS_SUCCESS';
export const FETCH_STATIONS_FAILURE = 'FETCH_STATIONS_FAILURE';
export const FETCH_PROGRAMS_REQUEST = 'FETCH_PROGRAMS_REQUEST';
export const FETCH_PROGRAMS_SUCCESS = 'FETCH_PROGRAMS_SUCCESS';
export const FETCH_PROGRAMS_FAILURE = 'FETCH_PROGRAMS_FAILURE';
export const SELECT_STATION = 'SELECT_STATION';

interface FetchStationsRequestAction {
  type: typeof FETCH_STATIONS_REQUEST;
}

interface FetchStationsSuccessAction {
  type: typeof FETCH_STATIONS_SUCCESS;
  payload: Station[];
}

interface FetchStationsFailureAction {
  type: typeof FETCH_STATIONS_FAILURE;
  error: string;
}
interface Media {
  logo?: string;    
  picture?: string; 
}

export type ProgramsAction =
  | FetchProgramsRequestAction
  | FetchProgramsSuccessAction
  | FetchProgramsFailureAction;
export type StationsAction =
  | FetchStationsRequestAction
  | FetchStationsSuccessAction
  | FetchStationsFailureAction;

export interface Station {
  programs: CarWashingProgram[];
  id: string;
  name: string;
  address: string;
  latitude?: number | string;
  longitude?: number | string;
  lat?: number | string;
  lng?: number | string;
  media?: Media;
}

interface StationsState {
  stations: Station[];
  error: string | null;
  loading: boolean;
}

export interface RootState {
  stations: StationsState;
  programsState: {
    programs: CarWashingProgram[];
    loading: boolean;
    error: string | null;
  };
}


export interface CarWashingProgram {
  programType: string;
  id: number;
  name: string;
  price?: number | string;
  media?: {
    picture?: string;
  };
}
export interface FetchProgramsRequestAction {
  type: typeof FETCH_PROGRAMS_REQUEST;
}

export interface FetchProgramsSuccessAction {
  type: typeof FETCH_PROGRAMS_SUCCESS;
  payload: CarWashingProgram[];
}

export interface FetchProgramsFailureAction {
  type: typeof FETCH_PROGRAMS_FAILURE;
  error: string;
}
export type FetchStationsAction =
  | FetchStationsRequestAction
  | FetchStationsSuccessAction
  | FetchStationsFailureAction;
