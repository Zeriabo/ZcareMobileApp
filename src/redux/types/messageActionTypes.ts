export const ADD_MESSAGE = 'ADD_MESSAGE';
export const CLEAR_MESSAGES = 'CLEAR_MESSAGES';

export type Message = {
  id: number;
  text: string;
  status: number; // New property for status
};

export interface AddMessageAction {
  type: typeof ADD_MESSAGE;
  payload: Message;
}

export interface ClearMessagesAction {
  type: typeof CLEAR_MESSAGES;
}

export type MessageAction = AddMessageAction | ClearMessagesAction;

export const addMessage = (message: Message): AddMessageAction => ({
  type: ADD_MESSAGE,
  payload: message,
});

export const clearMessages = (): ClearMessagesAction => ({
  type: CLEAR_MESSAGES,
});
