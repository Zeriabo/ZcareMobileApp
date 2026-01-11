import Car from './CarType';
import WashingProgram from './WashingProgramType';
import {Station} from './stationsActionTypes';

export const FETCH_WASHES_REQUEST = 'FETCH_WASHES_REQUEST';
export const FETCH_WASHES_SUCCESS = 'FETCH_WASHES_SUCCESS';
export const FETCH_WASHES_FAILURE = 'FETCH_WASHES_FAILURE';
export const SELECT_WASHES = 'SELECT_WASH';

interface FetchWashesRequestAction {
  type: typeof FETCH_WASHES_REQUEST;
}

interface FetchWashesSuccessAction {
  type: typeof FETCH_WASHES_SUCCESS;
  payload: Wash[];
}

interface FetchWashesFailureAction {
  type: typeof FETCH_WASHES_FAILURE;
  error: string;
}

export type WashesAction =
  | FetchWashesRequestAction
  | FetchWashesSuccessAction
  | FetchWashesFailureAction
  | FetchWashesSuccessAction
  | FetchWashesFailureAction;

export interface Wash {
  id: number;
  executed: boolean;
  car: Car;
  station: Station;
  washingProgram: WashingProgram;
  createdAt: Date;
}

interface WashesState {
  washes: Wash[];
  error: string | null;
  loading: boolean;
}

export interface RootState {
  washes: WashesState;
}

export type FetchStationsAction =
  | FetchWashesRequestAction
  | FetchWashesSuccessAction
  | FetchWashesFailureAction;
