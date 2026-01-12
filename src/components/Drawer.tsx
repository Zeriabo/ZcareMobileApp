import { createDrawerNavigator } from '@react-navigation/drawer';
import { useSelector } from 'react-redux';
import { useNotifications } from '../hooks/useNotifications';
import { RootState } from '../redux/store';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import MyCars from '../screens/MyCars';
import RegisterCarScreen from '../screens/RegisterCarScreen';
import SignInScreen from '../screens/SignInScreen';
import SignOutScreen from '../screens/SignOutScreen';
import SignUpScreen from '../screens/SignUpScreen';
import BottomTabs from './BottomTabs';
const Drawer = createDrawerNavigator();

export function MyDrawer() {
  const user = useSelector((state: RootState) => state.user.user);
  const cars = useSelector((state: RootState) => state.cars.cars);
  const bookings = useSelector((state: RootState) => state.booking.bookings);
  useNotifications();
  const activeBookings = bookings.filter((b) => !b.executed);

  if (!user) {
    // User not logged in
    return (
      <Drawer.Navigator>
        <Drawer.Screen name="Home" component={SignInScreen} />
        <Drawer.Screen name="SignUp" component={SignUpScreen} />
      </Drawer.Navigator>
    );
  }

  // User logged in
  return (
    <Drawer.Navigator>
      {/* BottomTabs replaces HomeScreen */}
      <Drawer.Screen name="Mainv" component={BottomTabs} />
      <Drawer.Screen name="SignOut" component={SignOutScreen} />

      {/* Cars logic */}
      {cars.length === 0 ? (
        <Drawer.Screen name="RegisterCar" component={RegisterCarScreen} />
      ) : (
        <Drawer.Screen name="MyCars" component={MyCars} initialParams={{ cars }} />
      )}

      {/* Active bookings */}
      {activeBookings.length > 0 && (
        <Drawer.Screen
          name="MyBookings"
          component={MyBookingsScreen}
          initialParams={{ bookings: activeBookings }}
        />
      )}
    </Drawer.Navigator>
  );
}
