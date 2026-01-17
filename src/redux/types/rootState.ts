// rootState.ts

import { AuthState } from '../reducers/authReducer';
import { BookingState } from '../reducers/bookingReducer';
import { CarState } from '../reducers/carReducer';
import { ProgramsState } from '../reducers/programsReducer';
import { StationState } from '../reducers/stationReducer';
import { StationsState } from '../reducers/stationsReducer';
import { WashesState } from '../reducers/washesReducer';
import { Message } from '../types/messageActionTypes';

export interface BuyState {
  washes: any[];
  pi: any;
}


export interface RootState {
  user: AuthState;                 
  booking: BookingState;           
  programsState: ProgramsState;    
  station: StationState;           
  stations: StationsState;        
  washes: WashesState;             
  cars: CarState;                  
  messages: Message[];             
  cart: BuyState;                  
}
