import {Dispatch} from 'redux';
import {
  FETCH_WASHES_REQUEST,
  FETCH_WASHES_SUCCESS,
  FETCH_WASHES_FAILURE,
  FetchStationsAction,
  WashesAction,
} from '../types/washesActionTypes';
import {RootState} from '../store';

import {ThunkAction} from 'redux-thunk';
import {ApolloClient, InMemoryCache, gql} from '@apollo/client';
//import {client} from '../../../App';
import {Alert} from 'react-native';

export const SELECT_WASHES = 'SELECT_WASHES';

export const fetchWashesBooked = (
  carId: Number,
): ThunkAction<Promise<void>, RootState, undefined, WashesAction> => {
  return async (dispatch: Dispatch<WashesAction>) => {
    dispatch({type: FETCH_WASHES_REQUEST});
    try {
      const GET_WASHES = gql`
        query getCarBookings($carId: ID!) {
          getCarBookings(carId: $carId) {
            id
            car {
              registerationPlate
              manufacture
              dateOfManufacture
            }
            washingProgram {
              programType
              description
              price
            }
            station {
              id
              name
              address
              latitude
              longitude
            }
          }
        }
      `;
  /*  client
        .query({
          query: GET_WASHES,
          variables: {carId},
        })
        .then((graphQlQuery: any) => {
          dispatch({
            type: FETCH_WASHES_SUCCESS,
            payload: graphQlQuery.data.getCarBookings,
          });
        })
        .catch(err =>
          dispatch({type: FETCH_WASHES_FAILURE, error: err.message as string}),
        );**/
    } catch (error: any) {
      console.log(error);
      dispatch({type: FETCH_WASHES_FAILURE, error: error.message as string});
    }
  };
};
