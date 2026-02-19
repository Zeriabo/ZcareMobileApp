import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { useSelector } from 'react-redux';

import HomeScreen from '../screens/HomeScreen';
import BookingsScreen from '../screens/MyBookingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { RootState } from '../redux/store';

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  const navigation = useNavigation<any>();
  const user = useSelector((state: RootState) => state.user.user);
  const isAuthenticated = Boolean(user?.token);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'home-outline';

          if (route.name === 'Dashboard') iconName = focused ? 'map' : 'map-outline';
          if (route.name === 'Bookings') iconName = focused ? 'qr-code' : 'qr-code-outline';
          if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          paddingBottom: 4,
        },
        tabBarStyle: {
          height: 74,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: '#FFFFFFF2',
          borderTopWidth: 0,
          shadowColor: '#0F172A',
          shadowOpacity: 0.12,
          shadowOffset: { width: 0, height: -3 },
          shadowRadius: 10,
          elevation: 10,
        },
        tabBarItemStyle: {
          borderRadius: 14,
          marginHorizontal: 6,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={HomeScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        listeners={{
          tabPress: e => {
            if (!isAuthenticated) {
              e.preventDefault();
              navigation.navigate('SignIn');
            }
          },
        }}
      />
    </Tab.Navigator>
  );
}
