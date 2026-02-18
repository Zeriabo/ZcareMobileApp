// Booking.ts

import Car from './CarType';
import { CarWashingProgram, Station } from './stationsActionTypes';

export interface User {
  id: string | number;
}

export interface Wash {
  id: string | number;
}

export interface Booking {
  id: number;
  car: Car;
  washingProgram: CarWashingProgram;
  user: User;
  scheduledTime: string;
  station: Station;
  wash: Wash;
  token: string;
  qr_code:string;
  executed: boolean;
  createdAt: string;
  updatedAt: string;
}
