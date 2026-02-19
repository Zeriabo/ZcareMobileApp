import { CarWashingProgram, Station } from './stationsActionTypes';
import { RepairShop } from '../../types/repair';

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
};
