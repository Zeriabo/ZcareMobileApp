import {
  REGISTER_CAR_SUCCESS,
  GET_CAR_SUCCESS,
  GET_USER_CARS_SUCCESS,
  SET_CAR_OWNER_SUCCESS,
  DELETE_CAR_SUCCESS,
} from '../actions/carActions';
import Car from '../types/CarType';

interface CarState {
  cars: Car[];
}

const initialState: CarState = {
  cars: [],
};

const carReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case REGISTER_CAR_SUCCESS:
      // Return updated state after registering a car
      return state;

    case GET_CAR_SUCCESS:
      // Return updated state after getting car details by registration plate
      return {
        ...state,
        cars: [...state.cars, action.payload],
      };

    case GET_USER_CARS_SUCCESS:
      // Return updated state after getting cars owned by a user
      return {
        ...state,
        cars: action.payload,
      };

    case SET_CAR_OWNER_SUCCESS:
      // Return updated state after setting the owner of a car
      return state;
    case DELETE_CAR_SUCCESS:
      const updatedCars = state.cars.filter(
        car => car.carId !== action.payload,
      );
      return {...state, cars: updatedCars};

    default:
      return state;
  }
};
export default carReducer;
