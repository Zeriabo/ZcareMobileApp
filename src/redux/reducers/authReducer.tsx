import {useDispatch} from 'react-redux';
import Car from '../types/CarType';
import {getUserCars} from '../actions/carActions';

interface AuthState {
  user: User | null;
  error: any;
  registrationSuccess: boolean;
  registrationFailed: boolean;
  authenticationSuccess: boolean;
  authenticationFailed: boolean;
}
interface User {
  active: boolean;
  createDateTime: string | null;
  dateOfBirth: string;
  deviceRegistrationToken: string | null;
  firstName: string;
  id: number;
  lastName: string;
  token: string;
  updateDateTime: string | null;
  username: string;
}
interface Action {
  type: string;
  payload: any | User;
}

const initialState: AuthState = {
  user: null,
  error: null,
  registrationSuccess: false,
  registrationFailed: false,
  authenticationSuccess: false,
  authenticationFailed: false,
};

const authReducer = (state = initialState, action: Action): AuthState => {
  switch (action.type) {
    case 'SIGN_IN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        error: null,
        authenticationSuccess: true,
        authenticationFailed: false,
      };
    case 'SIGN_IN_ERROR':
      return {
        ...state,
        user: null,
        error: action.payload,
        authenticationSuccess: false,
        authenticationFailed: true,
      };
     case 'SIGN_OUT':
      return {
        ...initialState, 
      };
    case 'SIGN_UP_SUCCESS':
      return {
        ...state,
        user: action.payload,
        error: null,
        registrationSuccess: true,
        registrationFailed: false,
      };
    case 'SIGN_UP_FAILED':
      return {
        ...state,
        user: null,
        error: action.payload,
        registrationSuccess: false,
        registrationFailed: true,
      };
    default:
      return state;
  }
};

export default authReducer;
