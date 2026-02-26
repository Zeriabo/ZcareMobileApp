import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { Button, Snackbar, Text, TextInput } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { signUp } from '../redux/actions/AuthActions';
import { Validators } from '../utils/validators';

const SignUpScreen: React.FC = () => {
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [secretAnswer, setSecretAnswer] = useState<string>('');
  const [secretQuestion, setSecretQuestion] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);

  // Validation errors
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    username?: string;
    password?: string;
    secretQuestion?: string;
    secretAnswer?: string;
    dateOfBirth?: string;
  }>({});

  const navigation = useNavigation();
  const dispatch = useDispatch<any>();

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'firstName':
        if (!Validators.required(value)) {
          newErrors.firstName = 'First name is required';
        } else if (!Validators.minLength(value, 2)) {
          newErrors.firstName = 'First name must be at least 2 characters';
        } else {
          delete newErrors.firstName;
        }
        break;
      case 'lastName':
        if (!Validators.required(value)) {
          newErrors.lastName = 'Last name is required';
        } else if (!Validators.minLength(value, 2)) {
          newErrors.lastName = 'Last name must be at least 2 characters';
        } else {
          delete newErrors.lastName;
        }
        break;
      case 'username':
        if (!Validators.required(value)) {
          newErrors.username = 'Username is required';
        } else if (!Validators.minLength(value, 3)) {
          newErrors.username = 'Username must be at least 3 characters';
        } else {
          delete newErrors.username;
        }
        break;
      case 'password':
        if (!Validators.required(value)) {
          newErrors.password = 'Password is required';
        } else if (!Validators.strongPassword(value)) {
          newErrors.password = 'Password must be 8+ characters with uppercase, lowercase, and numbers';
        } else {
          delete newErrors.password;
        }
        break;
      case 'secretQuestion':
        if (!Validators.required(value)) {
          newErrors.secretQuestion = 'Security question is required';
        } else if (!Validators.minLength(value, 5)) {
          newErrors.secretQuestion = 'Security question must be at least 5 characters';
        } else {
          delete newErrors.secretQuestion;
        }
        break;
      case 'secretAnswer':
        if (!Validators.required(value)) {
          newErrors.secretAnswer = 'Security answer is required';
        } else if (!Validators.minLength(value, 2)) {
          newErrors.secretAnswer = 'Security answer must be at least 2 characters';
        } else {
          delete newErrors.secretAnswer;
        }
        break;
      case 'dateOfBirth':
        if (!Validators.required(value)) {
          newErrors.dateOfBirth = 'Date of birth is required';
        } else if (!Validators.date(value)) {
          newErrors.dateOfBirth = 'Invalid date format (use YYYY-MM-DD)';
        } else {
          delete newErrors.dateOfBirth;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const isFormValid = () => {
    return (
      firstName && lastName && username && password &&
      secretQuestion && secretAnswer && dateOfBirth &&
      Object.keys(errors).length === 0
    );
  };

  const handleSignUp = () => {
    // Validate all fields before submission
    validateField('firstName', firstName);
    validateField('lastName', lastName);
    validateField('username', username);
    validateField('password', password);
    validateField('secretQuestion', secretQuestion);
    validateField('secretAnswer', secretAnswer);
    validateField('dateOfBirth', dateOfBirth);

    if (!isFormValid()) {
      setSnackbarVisible(true);
      return;
    }

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
          onChangeText={(text) => {
            setFirstName(text);
            validateField('firstName', text);
          }}
          error={!!errors.firstName}
          style={styles.input}
        />
        <HelperText type="error" visible={!!errors.firstName}>
          {errors.firstName}
        </HelperText>

        <TextInput
          mode="outlined"
          label="Last Name"
          value={lastName}
          onChangeText={(text) => {
            setLastName(text);
            validateField('lastName', text);
          }}
          error={!!errors.lastName}
          style={styles.input}
        />
        <HelperText type="error" visible={!!errors.lastName}>
          {errors.lastName}
        </HelperText>

        <TextInput
          mode="outlined"
          label="Secret Question"
          value={secretQuestion}
          onChangeText={(text) => {
            setSecretQuestion(text);
            validateField('secretQuestion', text);
          }}
          error={!!errors.secretQuestion}
          style={styles.input}
        />
        <HelperText type="error" visible={!!errors.secretQuestion}>
          {errors.secretQuestion}
        </HelperText>

        <TextInput
          mode="outlined"
          label="Secret Answer"
          value={secretAnswer}
          onChangeText={(text) => {
            setSecretAnswer(text);
            validateField('secretAnswer', text);
          }}
          error={!!errors.secretAnswer}
          style={styles.input}
        />
        <HelperText type="error" visible={!!errors.secretAnswer}>
          {errors.secretAnswer}
        </HelperText>

        <TextInput
          mode="outlined"
          label="Username"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            validateField('username', text);
          }}
          error={!!errors.username}
          style={styles.input}
        />
        <HelperText type="error" visible={!!errors.username}>
          {errors.username}
        </HelperText>

        <TextInput
          mode="outlined"
          label="Password"
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            validateField('password', text);
          }}
          error={!!errors.password}
          style={styles.input}
        />
        <HelperText type="error" visible={!!errors.password}>
          {errors.password}
        </HelperText>

        <TextInput
          mode="outlined"
          label="Date of Birth (YYYY-MM-DD)"
          value={dateOfBirth}
          onChangeText={(text) => {
            setDateOfBirth(text);
            validateField('dateOfBirth', text);
          }}
          error={!!errors.dateOfBirth}
          placeholder="1990-01-31"
          style={styles.input}
        />
        <HelperText type="error" visible={!!errors.dateOfBirth}>
          {errors.dateOfBirth}
        </HelperText>

        <Button 
          mode="contained" 
          onPress={handleSignUp} 
          style={styles.button}
          disabled={!isFormValid()}
        >
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
          Please fix all validation errors before submitting.
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
