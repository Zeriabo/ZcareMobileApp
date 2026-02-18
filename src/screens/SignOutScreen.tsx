import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { signOut } from '../redux/actions/AuthActions';

const SignOutScreen: React.FC<any> = ({ navigation }) => {
  const dispatch = useDispatch<any>();
  const user = useSelector((state: any) => state.user.user);

  useEffect(() => {
    const handleSignOut = async () => {
      await dispatch(signOut());
      navigation.reset({
        index: 0,
        routes: [{ name: 'Signin' }], // redirect to Signin after signout
      });
      
    };

    handleSignOut();
  }, [dispatch, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Signing out...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
});

export default SignOutScreen;
