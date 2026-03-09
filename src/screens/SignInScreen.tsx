import React, { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { Button, HelperText, Snackbar, Text, TextInput } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useLanguage } from '../contexts/LanguageContext';
import { signIn } from '../redux/actions/AuthActions';
import { Validators } from '../utils/validators';

const NOTIFICATION_CHANNEL_ID = 'zcare_updates';

const SignInScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const dispatch = useDispatch<any>();
  const user = useSelector((state: any) => state.user.user);
  const error = useSelector((state: any) => state.user.error);

useEffect(() => {
  if (user?.id) {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  }
}, [user, navigation]);

  useEffect(() => {
    if (error) setSnackbarVisible(true);  
  }, [error]);

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'username':
        if (!Validators.required(value)) {
          newErrors.username = t('auth.errors.usernameRequired');
        } else if (!Validators.minLength(value, 3)) {
          newErrors.username = t('auth.errors.usernameMinLength');
        } else {
          delete newErrors.username;
        }
        break;
      case 'password':
        if (!Validators.required(value)) {
          newErrors.password = t('auth.errors.passwordRequired');
        } else {
          delete newErrors.password;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const isFormValid = () => {
    return username && password && Object.keys(errors).length === 0;
  };

  const handleSignIn = () => {
    // Validate before submission
    validateField('username', username);
    validateField('password', password);

    if (!isFormValid()) {
      setSnackbarVisible(true);
      return;
    }

    dispatch(signIn({ username, password }));
  };

  return (
    <ImageBackground
      source={{ uri: 'https://example.com/your-background-image.jpg' }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.title}>{t('auth.signIn')}</Text>

        <TextInput
          mode="outlined"
          label={t('auth.username')}
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            validateField('username', text);
          }}
          error={!!errors.username}
          outlineColor="#4F46E5"
          activeOutlineColor="#4F46E5"
          left={<TextInput.Icon icon="account" />}
          style={styles.input}
        />
        <HelperText type="error" visible={!!errors.username}>
          {errors.username}
        </HelperText>

        <TextInput
          mode="outlined"
          label={t('auth.password')}
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            validateField('password', text);
          }}
          error={!!errors.password}
          outlineColor="#4F46E5"
          activeOutlineColor="#4F46E5"
          left={<TextInput.Icon icon="lock" />}
          style={styles.input}
        />
        <HelperText type="error" visible={!!errors.password}>
          {errors.password}
        </HelperText>

        <Button
          mode="contained"
          onPress={handleSignIn}
          style={styles.button}
          buttonColor="#4F46E5"
          disabled={!isFormValid()}
        >
          {t('auth.signIn')}
        </Button>

        {user && <Text style={styles.message}>{t('auth.signInSuccess')}</Text>}

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{ label: t('common.close'), onPress: () => setSnackbarVisible(false) }}
        >
          {error || t('errors.unknownError')}
        </Snackbar>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#333', textAlign: 'center' },
  input: { marginBottom: 15 },
  button: { marginTop: 10, paddingVertical: 5 },
  message: { color: 'green', marginTop: 10, textAlign: 'center' },
});

export default SignInScreen;
