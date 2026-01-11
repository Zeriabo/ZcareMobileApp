import React, { useState } from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { TextInput, Button, Text, Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { addMessage, clearMessages } from '../redux/types/messageActionTypes';
import { signUp } from '../redux/actions/AuthActions';

const SignUpScreen: React.FC = () => {
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [secretAnswer, setSecretAnswer] = useState<string>('');
  const [secretQuestion, setSecretQuestion] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);

  const navigation = useNavigation();
  const dispatch = useDispatch();

  const handleSignUp = () => {
    const user = {
      firstName,
      lastName,
      password,
      secretAnswer,
      secretQuestion,
      username,
      dateOfBirth,
    };

    dispatch(signUp(user));

    // Example error handling (uncomment when API integrated)
    /*
    axios.post(Config.REACT_APP_SERVER_URL + '/users/register', user)
      .then((response) => {
        navigation.navigate('Home');
      })
      .catch((error) => {
        dispatch(addMessage({ id: 1, text: error.response.data }));
        setSnackbarVisible(true);
        setTimeout(() => {
          dispatch(clearMessages());
          setSnackbarVisible(false);
        }, 2000);
      });
    */
  };

  return (
    <ImageBackground
      source={{ uri: 'https://example.com/your-background-image.jpg' }} // 🔹 Replace with your background
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.title}>Sign Up</Text>

        <TextInput
          mode="outlined"
          label="First Name"
          value={firstName}
          onChangeText={setFirstName}
          left={<TextInput.Icon name="account" />}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Last Name"
          value={lastName}
          onChangeText={setLastName}
          left={<TextInput.Icon name="account" />}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Secret Question"
          value={secretQuestion}
          onChangeText={setSecretQuestion}
          left={<TextInput.Icon name="help-circle" />}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Secret Answer"
          value={secretAnswer}
          onChangeText={setSecretAnswer}
          left={<TextInput.Icon name="check" />}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Username"
          value={username}
          onChangeText={setUsername}
          left={<TextInput.Icon name="account-circle" />}
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
        <TextInput
          mode="outlined"
          label="Date of Birth"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          left={<TextInput.Icon name="calendar" />}
          style={styles.input}
        />

        <Button mode="contained" onPress={handleSignUp} style={styles.button}>
          Sign Up
        </Button>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'Close',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          There was an error signing up. Please try again.
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // 🔹 semi-transparent white
    borderRadius: 12,
    padding: 20,
    width: '85%',
    elevation: 5, // shadow for Android
    shadowColor: '#000', // shadow for iOS
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
    marginBottom: 12,
  },
  button: {
    marginTop: 12,
    paddingVertical: 6,
  },
});

export default SignUpScreen;
