import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BuywashScreen from '../screens/BuywashScreen';
import HomeScreen from '../screens/HomeScreen';
import StationPage from '../screens/StationPage';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="StationPage" component={StationPage} />
      <Stack.Screen name="Buywash" component={BuywashScreen} />
    </Stack.Navigator>
  );
}
