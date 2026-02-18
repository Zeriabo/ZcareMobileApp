import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { PersistConfig, persistReducer, persistStore } from 'redux-persist';

import authReducer from './reducers/authReducer';
import bookingReducer from './reducers/bookingReducer';
import buyReducer from './reducers/buyReducer';
import carReducer from './reducers/carReducer';
import messageReducer from './reducers/messagereducer';
import { programsReducer } from './reducers/programsReducer';
import stationReducer from './reducers/stationReducer';
import stationsReducer from './reducers/stationsReducer';
import washesReducer from './reducers/washesReducer';
import { RootState as RootStateShape } from './types/rootState';

const persistConfig: PersistConfig<RootStateShape> = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['user'], 
};

const rootReducer:any = combineReducers({
  user: authReducer,
  stations: stationsReducer,
  messages: messageReducer,
  cart: buyReducer,
  booking: bookingReducer,
  cars: carReducer,
  station: stationReducer,
  washes: washesReducer,
  programsState: programsReducer,
});

const persistedReducer = persistReducer<RootStateShape>(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: true,
});

export const persistor = persistStore(store);
export type AppDispatch = typeof store.dispatch;
export type RootState = RootStateShape;
export type RootStateType = RootStateShape;

export default store;
