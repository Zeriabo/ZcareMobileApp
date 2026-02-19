/**
 * Main App.tsx
 */
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StripeProvider } from '@stripe/stripe-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch } from 'react-redux';
import CheckoutForm from './src/components/CheckoutForm';
import MessageDisplay from './src/components/MessageDisplay';
import './src/config/firebase';
import store from './src/redux/store';
import BuywashScreen from './src/screens/BuywashScreen';
import RegisterCarScreen from './src/screens/RegisterCarScreen';
import AIAssistantScreen from './src/screens/AIAssistantScreen';
import RepairShopScreen from './src/screens/RepairShopScreen';
import StationPage from './src/screens/StationPage';
import ActiveWashScreen from './src/screens/ActiveWashScreen';
// Redux actions and helpers
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import { TamaguiProvider, Theme } from 'tamagui';
import AddCar from './src/components/AddCar';
import BottomTabs from './src/components/BottomTabs';
import { SocketProvider } from './src/config/SocketProvider';
import { getUserCars } from './src/redux/actions/carActions';
import { RootStackParamList } from './src/redux/types/stackParams';
import QrScreen from './src/screens/QrScreen';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import { getSession } from './src/utils/storage';
import { tamaguiConfig } from './tamagui.config';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const STRIPE_PUBLISHABLE_KEY =
  'pk_test_51NInIUC7hkCZnQICpeKcU6piJANDfXyV3wcXXFPP39hu4KlZRMj4AvuHPiSv5Kv30KGK79zFRMRfGR2rtw0XQJEV00IYaSztHB';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
       <TamaguiProvider config={tamaguiConfig}>
        <Theme name="light">

    <SafeAreaProvider>
      <Provider store={store}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppContent />
      </Provider>
    </SafeAreaProvider>
        </Theme>
       </TamaguiProvider>
  );
}

function AppContent() {
  const dispatch = useDispatch<any>();
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const messagingInstance = getMessaging();
    const unsubscribe = onMessage(messagingInstance, async remoteMessage => {
      Alert.alert(
        remoteMessage.notification?.title || "Notification",
        remoteMessage.notification?.body || ""
      );
    });

    return unsubscribe;
  }, []);

  // ✅ 2. Restore saved session on app start
  useEffect(() => {
    async function restoreSession() {
      const session = await getSession();
      if (session?.token) {
        console.log('✅ Restored session:', session.token);
        dispatch({ type: 'SIGN_IN_SUCCESS', payload: session });
        dispatch(getUserCars(session.token));
      }
      setIsRestoring(false);
    }
    restoreSession();
  }, [dispatch]);

  if (isRestoring) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier="zeriab.com.zcare">
             <SocketProvider>
        <MessageDisplay />
        <NavigationContainer>
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            <RootStack.Screen name="MainTabs" component={BottomTabs} />
            <RootStack.Screen name="SignIn" component={SignInScreen} />
            <RootStack.Screen name="SignUp" component={SignUpScreen} />
            <RootStack.Screen name="StationPage" component={StationPage} />
            <RootStack.Screen name="Buywash" component={BuywashScreen} />
            <RootStack.Screen name="RegisterCar" component={RegisterCarScreen} />
            <RootStack.Screen name="CheckoutForm" component={CheckoutForm} />
            <RootStack.Screen name="QrScreen" component={QrScreen} />
            <RootStack.Screen name="AddCar" component={AddCar} />
            <RootStack.Screen name="RepairShop" component={RepairShopScreen} />
            <RootStack.Screen name="AIAssistant" component={AIAssistantScreen} />
            <RootStack.Screen name="ActiveWash" component={ActiveWashScreen} />
      
          </RootStack.Navigator>
        </NavigationContainer>
        </SocketProvider>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
