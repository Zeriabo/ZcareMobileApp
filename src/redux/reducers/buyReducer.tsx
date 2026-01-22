import { BuyState } from "../types/RootState";



const initialState: BuyState = {
  washes: [],
  pi: null,
};

const buyReducer = (state: BuyState = initialState, action: any): BuyState => {
  switch (action.type) {
    case 'BUY_WASH':
      return {
        ...state,
        washes: [...state.washes, action.program],
      };
    case 'PAYMENT_INTENT_SUCCESS':
      return {
        ...state,
        pi: action.payload,
      };
    case 'CHECKOUT_SUCCESS':
    case 'CHECKOUT_FAILED':
    default:
      return state;
  }
};

export default buyReducer;
