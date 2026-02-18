import { CarWashingProgram, Station } from './stationsActionTypes';

export type RootStackParamList = {
  MainTabs: undefined;
  StationPage: { station: Station };
  Buywash: { selectedProgram: CarWashingProgram };
  RegisterCar: undefined;
  CheckoutScreen: undefined;
  PaymentScreen: undefined;
  PaymentConfirmation: undefined;
  CheckoutForm: { program?: CarWashingProgram } | undefined;
  QrScreen: { qrCode?: string; executed?: boolean } | undefined;
  SignIn: undefined;
  SignUp:undefined;
  AddCar:undefined;
};
