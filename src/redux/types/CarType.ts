interface Car {
  carId: Number;
  registrationPlate: string;
  manufacture: string;
  dateOfManufacture: Date;
  lastInspectionDate?: Date | string;
  token: string;
  deviceRegistrationToken: string;
}

export default Car;
