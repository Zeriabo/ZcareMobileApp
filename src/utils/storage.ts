import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function saveSession(user: any) {
  try {
    if (!user) {
      console.log('User is empty, skipping session save');
      return;
    }
    
    // Ensure user is an object, not already a string
    const userToSave = typeof user === 'string' ? JSON.parse(user) : user;
    const sessionString = JSON.stringify(userToSave);
    await SecureStore.setItemAsync('user_session', sessionString);
  } catch (error) {
    console.log('Failed to save session', error);
  }
}
export async function getSession() {
  try {
    const session = await SecureStore.getItemAsync('user_session');
    return session ? JSON.parse(session) : null;
  } catch (error) {
    console.log('Failed to get session', error);
    return null;
  }
}

export async function removeSession() {
  try {
    // expo-secure-store uses deleteItemAsync
    await SecureStore.deleteItemAsync('user_session');
    await SecureStore.deleteItemAsync('stripe_customer_id');
    await AsyncStorage.removeItem(SAVED_CARDS_KEY);
  } catch (error) {
    console.log('Failed to remove session', error);
  }
}

export async function saveStripeCustomerId(customerId: string) {
  try {
    await SecureStore.setItemAsync('stripe_customer_id', customerId);
  } catch (error) {
    console.log('Failed to save stripe customer id', error);
  }
}

export async function getStripeCustomerId() {
  try {
    return await SecureStore.getItemAsync('stripe_customer_id');
  } catch (error) {
    console.log('Failed to get stripe customer id', error);
    return null;
  }
}

const SAVED_CARDS_KEY = 'saved_cards_cache';

export async function saveSavedCards(cards: any[]) {
  try {
    await AsyncStorage.setItem(SAVED_CARDS_KEY, JSON.stringify(Array.isArray(cards) ? cards : []));
  } catch (error) {
    console.log('Failed to save cached cards', error);
  }
}

export async function getSavedCards() {
  try {
    const raw = await AsyncStorage.getItem(SAVED_CARDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.log('Failed to read cached cards', error);
    return [];
  }
}

export async function clearSavedCards() {
  try {
    await AsyncStorage.removeItem(SAVED_CARDS_KEY);
  } catch (error) {
    console.log('Failed to clear cached cards', error);
  }
}
