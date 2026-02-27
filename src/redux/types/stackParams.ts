import { RepairShop } from '../../types/repair';
import { CarWashingProgram, Station } from './stationsActionTypes';

export type RootStackParamList = {
  MainTabs: undefined;
  StationPage: { station: Station };
  Buywash: { selectedProgram: CarWashingProgram };
  RegisterCar: undefined;
  CheckoutScreen: undefined;
  PaymentScreen: undefined;
  PaymentConfirmation: undefined;
  CheckoutForm:
    | {
        program?: any;
        mode?: 'wash' | 'repair';
        repairBooking?: any;
      }
    | undefined;
  QrScreen: { qrCode?: string; executed?: boolean } | undefined;
  SignIn: undefined;
  SignUp:undefined;
  AddCar:undefined;
  RepairShop: { shop: RepairShop };
  AIAssistant: undefined;
  ActiveWash: { bookingId: number };
  MapPicker: {
    onLocationSelected: (latitude: number, longitude: number, address: string) => void;
    initialLatitude?: number | null;
    initialLongitude?: number | null;
  };
  DeliveryTracking: {
    bookingId: number;
    deliveryLatitude: number;
    deliveryLongitude: number;
  };
};
