import { CarWashingProgram, Station } from './stationsActionTypes';

export type RootStackParamList = {
  MainTabs: undefined;
  StationPage: { station: Station };
  Buywash: { selectedProgram: CarWashingProgram };
  RegisterCar: undefined;
  CheckoutScreen: undefined;
  PaymentScreen: undefined;
  PaymentConfirmation: undefined;
  CheckoutForm: undefined;
  QrScreen: undefined;
  SignIn: undefined;
  SignUp:undefined;
  AddCar:undefined;
};
