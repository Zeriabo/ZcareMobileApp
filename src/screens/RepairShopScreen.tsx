import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSelector } from 'react-redux';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../redux/types/stackParams';
import { RootState } from '../redux/store';

type RepairRoute = RouteProp<RootStackParamList, 'RepairShop'>;
type RepairNavigation = NativeStackNavigationProp<RootStackParamList, 'RepairShop'>;

type Props = {
  route: RepairRoute;
  navigation: RepairNavigation;
};

type CatalogSku = {
  id: string;
  name: string;
  description?: string;
  durationMinutes?: number;
  priceAmount?: number;
  priceCurrency?: string;
  active?: boolean;
};

const RepairShopScreen: React.FC<Props> = ({ route, navigation }) => {
  const { shop } = route.params;
  const user = useSelector((state: RootState) => state.user.user as any);
  const cars = useSelector((state: RootState) => state.cars.cars as any[]);
  const selectedStationId = useSelector((state: RootState) => (state as any).station?.selectedStation?.id ?? null);

  const [selectedCarId, setSelectedCarId] = useState<number | null>(cars[0]?.carId ?? null);
  const [scheduleAt, setScheduleAt] = useState<string>(new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16));
  const [loading, setLoading] = useState(false);
  const [skuLoading, setSkuLoading] = useState(false);
  const [skuError, setSkuError] = useState<string | null>(null);
  const [repairOptions, setRepairOptions] = useState<CatalogSku[]>([]);
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);

  const services = useMemo(() => (shop.servicesOffered || []).map(s => s.replaceAll('_', ' ')), [shop.servicesOffered]);
  const selectedRepair = useMemo(
    () => repairOptions.find(option => option.id === selectedRepairId) ?? null,
    [repairOptions, selectedRepairId]
  );

  React.useEffect(() => {
    const fetchRepairOptions = async () => {
      const baseUrl = process.env.EXPO_PUBLIC_SERVER_URL || '';
      setSkuLoading(true);
      setSkuError(null);
      try {
        const response = await axios.get(`${baseUrl}/api/catalog/skus`);
        const raw = Array.isArray(response.data) ? response.data : [];
        const options: CatalogSku[] = raw
          .filter((item: any) => item && item.id)
          .map((item: any) => ({
            id: String(item.id),
            name: String(item.name ?? 'Repair service'),
            description: item.description ? String(item.description) : undefined,
            durationMinutes: Number.isFinite(Number(item.durationMinutes)) ? Number(item.durationMinutes) : undefined,
            priceAmount: Number.isFinite(Number(item.priceAmount))
              ? Number(item.priceAmount)
              : Number.isFinite(Number(item.price?.amount))
                ? Number(item.price.amount)
                : undefined,
            priceCurrency: item.priceCurrency
              ? String(item.priceCurrency)
              : item.price?.currency
                ? String(item.price.currency)
                : 'EUR',
            active: item.active !== false,
          }))
          .filter(item => item.active !== false);

        const shopHints = (shop.servicesOffered || []).map((value: string) => value.replaceAll('_', ' ').toLowerCase());
        const matched = options.filter(option =>
          shopHints.some(hint => option.name.toLowerCase().includes(hint) || (option.description || '').toLowerCase().includes(hint))
        );

        const finalOptions = matched.length > 0 ? matched : options;
        setRepairOptions(finalOptions);
        setSelectedRepairId(finalOptions[0]?.id ?? null);
      } catch (error: any) {
        setRepairOptions([]);
        setSkuError(error?.response?.data?.message || 'Could not load repair services and prices');
      } finally {
        setSkuLoading(false);
      }
    };

    fetchRepairOptions();
  }, [shop.servicesOffered]);

  const goBackSafe = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

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
    if (!selectedRepairId) {
      Alert.alert('Select repair', 'Please select what to repair.');
      return;
    }

    setLoading(true);
    try {
      const localDateTime = (() => {
        const dt = new Date(scheduleAt);
        const pad = (n: number) => String(n).padStart(2, '0');
        const ms = String(dt.getMilliseconds()).padStart(3, '0');
        return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}.${ms}`;
      })();

      const payload = {
        carId: selectedCarId,
        userId: user.id,
        stationId: selectedStationId,
        repairShopId: shop.id,
        repairSkuId: selectedRepairId,
        repairItemName: selectedRepair?.name,
        repairPriceAmount: selectedRepair?.priceAmount ?? 0,
        repairPriceCurrency: selectedRepair?.priceCurrency || 'EUR',
        scheduledTime: localDateTime,
        token: user.token,
      };

      const baseUrl = process.env.EXPO_PUBLIC_SERVER_URL || '';
      let response;
      try {
        response = await axios.post(`${baseUrl}/booking/repair`, payload);
      } catch (error: any) {
        if (error?.response?.status === 404) {
          response = await axios.post(`${baseUrl}/v1/bookings/repair`, payload);
        } else {
          throw error;
        }
      }
      const data = response.data || {};

      Alert.alert(
        'Repair booked',
        `Your repair booking has been created successfully for ${selectedRepair?.name || 'selected service'}.`
      );

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
        <View style={styles.headerTopRow}>
          <Pressable onPress={goBackSafe} hitSlop={12} style={styles.iconButton}>
            <Icon name="chevron-back" size={22} color="#111827" />
          </Pressable>
        </View>
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
        <Text style={styles.label}>What To Repair</Text>
        {skuLoading ? (
          <Text style={styles.help}>Loading repair services...</Text>
        ) : repairOptions.length > 0 ? (
          <>
            <View style={styles.pickerWrap}>
              <Picker selectedValue={selectedRepairId} onValueChange={(value) => setSelectedRepairId(String(value))}>
                {repairOptions.map((option) => (
                  <Picker.Item
                    key={option.id}
                    label={`${option.name} - ${option.priceAmount?.toFixed(2) ?? '0.00'} ${option.priceCurrency || 'EUR'}`}
                    value={option.id}
                  />
                ))}
              </Picker>
            </View>
            <Text style={styles.priceTag}>
              Price: {selectedRepair?.priceAmount?.toFixed(2) ?? '0.00'} {selectedRepair?.priceCurrency || 'EUR'}
            </Text>
          </>
        ) : (
          <Text style={styles.help}>{skuError || 'No repair services with prices found.'}</Text>
        )}

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
  headerTopRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffffee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 8 },
  location: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  label: { fontSize: 14, fontWeight: '700', color: '#111827' },
  serviceItem: { marginTop: 6, color: '#374151', fontSize: 13 },
  help: { marginTop: 8, color: '#6B7280' },
  priceTag: { marginTop: 8, color: '#111827', fontWeight: '700' },
  pickerWrap: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, marginTop: 8 },
  input: { marginTop: 8, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#111827' },
  bookBtn: { marginTop: 14, backgroundColor: '#4F46E5', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontWeight: '800' },
  disabled: { opacity: 0.6 },
});

export default RepairShopScreen;
