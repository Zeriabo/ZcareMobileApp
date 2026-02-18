import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSelector } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import { RootStackParamList } from '../redux/types/stackParams';
import { RootState } from '../redux/store';

type RepairRoute = RouteProp<RootStackParamList, 'RepairShop'>;
type RepairNavigation = NativeStackNavigationProp<RootStackParamList, 'RepairShop'>;

type Props = {
  route: RepairRoute;
  navigation: RepairNavigation;
};

const RepairShopScreen: React.FC<Props> = ({ route, navigation }) => {
  const { shop } = route.params;
  const user = useSelector((state: RootState) => state.user.user as any);
  const cars = useSelector((state: RootState) => state.cars.cars as any[]);

  const [selectedCarId, setSelectedCarId] = useState<number | null>(cars[0]?.carId ?? null);
  const [scheduleAt, setScheduleAt] = useState<string>(new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16));
  const [loading, setLoading] = useState(false);

  const services = useMemo(() => (shop.servicesOffered || []).map(s => s.replaceAll('_', ' ')), [shop.servicesOffered]);

  const handleBookRepair = async () => {
    if (!user?.token) {
      Alert.alert('Sign in required', 'Please sign in before booking a repair.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => navigation.navigate('SignIn') },
      ]);
      return;
    }

    if (!selectedCarId) {
      Alert.alert('Select a car', 'Please select a car for the repair booking.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        carId: selectedCarId,
        userId: user.id,
        repairShopId: shop.id,
        scheduledTime: new Date(scheduleAt).toISOString(),
        token: user.token,
      };

      const response = await axios.post(`${process.env.EXPO_PUBLIC_SERVER_URL}/bookings/repair`, payload);
      const data = response.data || {};

      Alert.alert('Repair booked', 'Your repair booking has been created successfully.');

      if (data.qrCode) {
        navigation.navigate('QrScreen', { qrCode: data.qrCode, executed: false });
      } else {
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Booking failed', error?.response?.data?.message || error?.message || 'Failed to create repair booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
        <Text style={styles.title}>{shop.name}</Text>
        <Text style={styles.location}>{shop.location}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Services</Text>
        {services.length ? (
          services.map((service) => (
            <Text key={service} style={styles.serviceItem}>• {service}</Text>
          ))
        ) : (
          <Text style={styles.help}>No listed services from backend</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Choose Car</Text>
        {cars.length > 0 ? (
          <View style={styles.pickerWrap}>
            <Picker selectedValue={selectedCarId} onValueChange={(value) => setSelectedCarId(Number(value))}>
              {cars.map((car) => (
                <Picker.Item
                  key={car.carId}
                  label={`${car.manufacture} (${car.registerationPlate || car.registrationPlate || '-'})`}
                  value={car.carId}
                />
              ))}
            </Picker>
          </View>
        ) : (
          <Text style={styles.help}>No cars found. Add a car first.</Text>
        )}

        <Text style={[styles.label, { marginTop: 14 }]}>Schedule</Text>
        <TextInput
          value={scheduleAt}
          onChangeText={setScheduleAt}
          placeholder="YYYY-MM-DDTHH:mm"
          autoCapitalize="none"
          style={styles.input}
        />

        <Pressable onPress={handleBookRepair} style={[styles.bookBtn, loading && styles.disabled]} disabled={loading}>
          <Text style={styles.bookBtnText}>{loading ? 'Booking...' : 'Book Repair'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, gap: 14 },
  header: { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  backBtn: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#EEF2FF' },
  backBtnText: { color: '#4F46E5', fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 8 },
  location: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  label: { fontSize: 14, fontWeight: '700', color: '#111827' },
  serviceItem: { marginTop: 6, color: '#374151', fontSize: 13 },
  help: { marginTop: 8, color: '#6B7280' },
  pickerWrap: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, marginTop: 8 },
  input: { marginTop: 8, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#111827' },
  bookBtn: { marginTop: 14, backgroundColor: '#4F46E5', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontWeight: '800' },
  disabled: { opacity: 0.6 },
});

export default RepairShopScreen;
