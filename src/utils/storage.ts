import * as SecureStore from 'expo-secure-store';

export async function saveSession(token: string) {
  try {
    // expo-secure-store uses setItemAsync
    await SecureStore.setItemAsync(
      'user_session',
      JSON.stringify({ token })
    );
  } catch (error) {
    console.log('Failed to save session', error);
  }
}

export async function getSession() {
  try {
    // expo-secure-store uses getItemAsync
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
  } catch (error) {
    console.log('Failed to remove session', error);
  }
}