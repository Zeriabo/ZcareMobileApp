import {AnyAction} from 'redux';
import {
  Message,
  MessageAction,
  ADD_MESSAGE,
  CLEAR_MESSAGES,
} from '../types/messageActionTypes';

const initialState: Message[] = [];

const messageReducer = (
  state = initialState,
  action: MessageAction,
): Message[] => {
  switch (action.type) {
    case ADD_MESSAGE:
      return [...state, action.payload];
    case CLEAR_MESSAGES:
      return [];
    default:
      return state;
  }
};

export default messageReducer;
