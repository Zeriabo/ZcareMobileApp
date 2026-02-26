import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { Button, Snackbar, Text, TextInput } from 'react-native-paper';
import { useDispatch } from 'react-redux';
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
  const dispatch = useDispatch<any>();

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
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Last Name"
          value={lastName}
          onChangeText={setLastName}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Secret Question"
          value={secretQuestion}
          onChangeText={setSecretQuestion}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Secret Answer"
          value={secretAnswer}
          onChangeText={setSecretAnswer}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Username"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
        <TextInput
          mode="outlined"
          label="Date of Birth"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
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
