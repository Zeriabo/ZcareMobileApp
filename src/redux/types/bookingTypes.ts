// Booking.ts

import Car from './CarType';
import { CarWashingProgram } from './CarWashingProgram'; // Import the appropriate CarWashingProgram type
import { Station } from './stationsActionTypes';

export interface Booking {
  id: number;
  car: Car;
  washingProgram: CarWashingProgram;
  user: User;
  scheduledTime: string; // You might need to adjust the type based on your Date/Time handling library
  station: Station;
  wash: Wash;
  token: string;
  qr_code:string;
  executed: boolean;
  createdAt: string; // You might need to adjust the type based on your Date/Time handling library
  updatedAt: string; // You might need to adjust the type based on your Date/Time handling library
}

// Note: You need to create or import the appropriate types for CarWashingProgram, Car, User, Station, and Wash.
