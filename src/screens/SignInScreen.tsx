import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { TextInput, Button, Text, Snackbar } from 'react-native-paper';
import { NavigationScreenProp, NavigationRoute } from 'react-navigation';
import { useSelector, useDispatch } from 'react-redux';
import { signIn } from '../redux/actions/AuthActions';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Importing vector icons

interface Props {
  navigation: NavigationScreenProp<NavigationRoute>;
}

const SignInScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user);
  const error = useSelector((state: any) => state.user.error);

  useEffect(() => {
    if (user.user && user.user.id !== undefined) {
      navigation.navigate('Home');
    }
  }, [user, navigation]);

  const handleSignIn = () => {
    const user = {
      username: username,
      password: password,
    };
    dispatch(signIn(user));
    if (error) {
      setSnackbarVisible(true);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://example.com/your-background-image.jpg' }} // Replace with your desired image URL
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
          left={<TextInput.Icon name="account" />}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          left={<TextInput.Icon name="lock" />}
          style={styles.input}
        />
        <Button mode="contained" onPress={handleSignIn} style={styles.button}>
          Sign In
        </Button>
        {user.user && <Text style={styles.message}>Signed in successfully!</Text>}
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'Close',
            onPress: () => {
              setSnackbarVisible(false);
            },
          }}>
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white background
    borderRadius: 10,
    padding: 20,
    width: '80%',
    elevation: 5, // Adds a shadow effect on Android
    shadowColor: '#000', // Shadow effect on iOS
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
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  message: {
    color: 'green',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default SignInScreen;