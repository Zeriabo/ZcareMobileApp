import { configureStore } from '@reduxjs/toolkit';

import stationsReducer from './reducers/stationsReducer';
import authReducer from './reducers/authReducer';
import messageReducer from './reducers/messagereducer';
import buyReducer from './reducers/buyReducer';
import bookingReducer from './reducers/bookingReducer';
import carReducer from './reducers/carReducer';
import stationReducer from './reducers/stationReducer';
import washesReducer from './reducers/washesReducer';
import { programsReducer } from './reducers/programsReducer';

// Combine reducers
const rootReducer = {
  user: authReducer,
  stations: stationsReducer,
  messages: messageReducer,
  cart: buyReducer,
  booking: bookingReducer,
  cars: carReducer,
  station: stationReducer,
  washes: washesReducer,
  programsState: programsReducer,
};

// Create store with Redux Toolkit
export const store = configureStore({
  reducer: rootReducer,
  // Middleware default includes thunk, so no need to add it manually
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
  devTools: true,
});

// TypeScript typings
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
