import messaging from '@react-native-firebase/messaging'; // Import Firebase Messaging
import React, { useEffect, useState } from 'react';
import { Alert, ImageBackground, StyleSheet, View } from 'react-native';
import { Button, Snackbar, Text, TextInput } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { signIn } from '../redux/actions/AuthActions';

const SignInScreen = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user.user);
  const error = useSelector((state: any) => state.user.error);

  // 1. ✅ Request Notification Permissions & Handle Foreground Messages
  useEffect(() => {
    const setupNotifications = async () => {
      // Request permission (Required for iOS and Android 13+)
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
      }
    };

    setupNotifications();

    // Listen for messages while the app is in the FOREGROUND
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert(
        remoteMessage.notification?.title || 'Notification',
        remoteMessage.notification?.body || 'You have a new update.'
      );
    });

    return unsubscribe;
  }, []);

  // 2. ✅ Navigate to MainTabs after successful login
  useEffect(() => {
    if (user && user.id !== undefined) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  }, [user, navigation]);

  // 3. ✅ Show snackbar if there is a login error
  useEffect(() => {
    if (error) {
      setSnackbarVisible(true);
    }
  }, [error]);

  const handleSignIn = () => {
    dispatch(signIn({ username, password }));
  };

  return (
    <ImageBackground
      source={{ uri: 'https://example.com/your-background-image.jpg' }} 
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.title}>Sign In</Text>

        <TextInput
          mode="outlined"
          label="Username"
          value={username}
          onChangeText={setUsername}
          outlineColor="#4F46E5"
          activeOutlineColor="#4F46E5"
          left={<TextInput.Icon icon="account" />}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          outlineColor="#4F46E5"
          activeOutlineColor="#4F46E5"
          left={<TextInput.Icon icon="lock" />}
          style={styles.input}
        />

        <Button 
          mode="contained" 
          onPress={handleSignIn} 
          style={styles.button}
          buttonColor="#4F46E5"
        >
          Sign In
        </Button>

        {user && <Text style={styles.message}>Signed in successfully!</Text>}

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'Close',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {error || 'An error occurred. Please try again.'}
        </Snackbar>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 20,
    width: '85%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  input: { marginBottom: 15 },
  button: { marginTop: 10, paddingVertical: 5 },
  message: { color: 'green', marginTop: 10, textAlign: 'center' },
});

export default SignInScreen;