import { Picker } from '@react-native-picker/picker';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AppCard from '../components/ui/AppCard';
import AppHeader from '../components/ui/AppHeader';
import PrimaryButton from '../components/ui/PrimaryButton';
import { createRepairBooking, fetchInspectionStatus } from '../redux/actions/repairActions';
import { RootState } from '../redux/store';
import { RootStackParamList } from '../redux/types/stackParams';
import { Colors, Radius, Spacing } from '../theme/design';
import apiClient from '../utils/apiClient';
import { goBackOrHome } from '../utils/navigation';

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
  const dispatch = useDispatch<any>();
  const { shop } = route.params;
  const user = useSelector((state: RootState) => state.user.user as any);
  const cars = useSelector((state: RootState) => state.cars.cars as any[]);
  const selectedStationId = useSelector((state: RootState) => (state as any).station?.selectedStation?.id ?? null);
  const washPrograms = useSelector((state: RootState) => (state as any).programsState?.programs || []);
  const repairLoading = useSelector((state: RootState) => (state as any).repair?.loading ?? false);
  const inspectionData = useSelector((state: RootState) => (state as any).repair?.inspectionData ?? new Map());

  const [selectedCarId, setSelectedCarId] = useState<number | null>(cars[0]?.carId ?? null);
  const [selectedCarPlate, setSelectedCarPlate] = useState<string | null>(cars[0]?.registerationPlate || cars[0]?.registrationPlate || null);
  const [scheduleAt, setScheduleAt] = useState<string>(new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16));
  const [loading, setLoading] = useState(false);
  const [skuLoading, setSkuLoading] = useState(false);
  const [skuError, setSkuError] = useState<string | null>(null);
  const [repairOptions, setRepairOptions] = useState<CatalogSku[]>([]);
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);
  const [inspectionWarning, setInspectionWarning] = useState<string | null>(null);
  const [lastInspectionDate, setLastInspectionDate] = useState<string | null>(null);
  const [nextInspectionDate, setNextInspectionDate] = useState<string | null>(null);
  const [checkingInspection, setCheckingInspection] = useState(false);
  const [checkedPlates, setCheckedPlates] = useState<Set<string>>(new Set());

  const services = useMemo(() => (shop.servicesOffered || []).map(s => s.replaceAll('_', ' ')), [shop.servicesOffered]);
  const selectedRepair = useMemo(
    () => repairOptions.find(option => option.id === selectedRepairId) ?? null,
    [repairOptions, selectedRepairId]
  );

  // Check vehicle inspection status when car selection changes (only once per plate)
  useEffect(() => {
    if (selectedCarPlate && !checkedPlates.has(selectedCarPlate)) {
      setCheckingInspection(true);
      setCheckedPlates(prev => new Set(prev).add(selectedCarPlate));
      dispatch(fetchInspectionStatus(selectedCarPlate) as any)
        .finally(() => setCheckingInspection(false));
    }
  }, [selectedCarPlate, dispatch]);

  // Load inspection data from Redux
  useEffect(() => {
    if (selectedCarPlate && inspectionData.has(selectedCarPlate)) {
      const inspection = inspectionData.get(selectedCarPlate);
      if (inspection === null) {
        // No inspection data available for this vehicle
        setInspectionWarning(null);
        setLastInspectionDate(null);
        setNextInspectionDate(null);
      } else if (inspection?.dueWithinThreshold) {
        setInspectionWarning(`⚠️ Vehicle inspection is ${inspection.message}`);
        setLastInspectionDate(inspection?.lastInspectionDate || null);
        setNextInspectionDate(inspection?.nextInspectionDate || null);
      } else {
        setInspectionWarning(null);
        setLastInspectionDate(inspection?.lastInspectionDate || null);
        setNextInspectionDate(inspection?.nextInspectionDate || null);
      }
    }
  }, [inspectionData, selectedCarPlate]);

  React.useEffect(() => {
    const fetchRepairOptions = async () => {
      setSkuLoading(true);
      setSkuError(null);
      try {
        const response = await apiClient.get<any[]>('/api/catalog/skus');
        const raw = Array.isArray(response) ? response : [];
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
        setSkuError(error?.details?.message || error?.message || 'Could not load repair services and prices');
      } finally {
        setSkuLoading(false);
      }
    };

    fetchRepairOptions();
  }, [shop.servicesOffered]);

  const goBackSafe = () => {
    goBackOrHome(navigation);
  };

  const handleBookRepair = async () => {
    if (!user?.token) {
      Alert.alert('Sign in required', 'Please sign in before booking a repair.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => navigation.navigate('SignIn') },
      ]);
      return;
    }

    if (!selectedCarId || !selectedCarPlate) {
      Alert.alert('Select a car', 'Please select a car for the repair booking.');
      return;
    }

    if (!selectedRepairId) {
      Alert.alert('Select repair', 'Please select what to repair.');
      return;
    }

    setLoading(true);
    try {
      // Create repair booking via z-repair service
      const bookingData = {
        vehicleRegistrationNumber: selectedCarPlate,
        repairShopId: shop.id,
        scheduledDate: scheduleAt,
        description: `${selectedRepair?.name || 'Repair'} - ${selectedRepair?.description || 'Service'}`,
      };

      await dispatch(createRepairBooking(bookingData) as any);
      
      Alert.alert('Success', 'Repair booking created successfully!', [
        {
          text: 'View Bookings',
          onPress: () => navigation.navigate('RepairBookings' as any),
        },
        {
          text: 'OK',
          onPress: () => goBackSafe(),
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Booking Failed',
        error?.message || 'Failed to create repair booking. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppHeader title={shop.name} subtitle={shop.location} onBack={goBackSafe} />

      <AppCard>
        <Text style={styles.label}>Services</Text>
        {services.length ? (
          services.map((service) => (
            <Text key={service} style={styles.serviceItem}>• {service}</Text>
          ))
        ) : (
          <Text style={styles.help}>No listed services from backend</Text>
        )}
      </AppCard>

      <AppCard>
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
          <>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={selectedCarId}
                onValueChange={(value) => {
                  setSelectedCarId(Number(value));
                  const car = cars.find(c => c.carId === Number(value));
                  const plate = car?.registerationPlate || car?.registrationPlate || null;
                  setSelectedCarPlate(plate);
                }}
              >
                {cars.map((car) => (
                  <Picker.Item
                    key={car.carId}
                    label={`${car.manufacture} (${car.registerationPlate || car.registrationPlate || '-'})`}
                    value={car.carId}
                  />
                ))}
              </Picker>
            </View>
            {checkingInspection && (
              <Text style={{ marginTop: 8, color: '#3B82F6', fontSize: 13 }}>
                Checking inspection status...
              </Text>
            )}
            {inspectionWarning && (
              <Text style={{ marginTop: 8, color: '#DC2626', fontSize: 13, fontWeight: '600' }}>
                {inspectionWarning}
              </Text>
            )}
            {lastInspectionDate && (
              <Text style={{ marginTop: 8, color: '#374151', fontSize: 13 }}>
                Last inspection date: {lastInspectionDate}
              </Text>
            )}
            {nextInspectionDate && (
              <Text style={{ marginTop: 4, color: '#374151', fontSize: 13 }}>
                Next inspection due: {nextInspectionDate}
              </Text>
            )}
          </>
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

        <PrimaryButton 
          onPress={handleBookRepair} 
          label={loading || repairLoading ? 'Booking...' : 'Book Repair'} 
          loading={loading || repairLoading} 
        />
      </AppCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.md, gap: Spacing.md },
  label: { fontSize: 14, fontWeight: '700', color: Colors.text },
  serviceItem: { marginTop: 6, color: '#374151', fontSize: 13 },
  help: { marginTop: 8, color: '#6B7280' },
  priceTag: { marginTop: 8, color: Colors.text, fontWeight: '700' },
  pickerWrap: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: Radius.sm, marginTop: 8 },
  input: { marginTop: 8, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: Radius.sm, paddingHorizontal: 12, paddingVertical: 10, color: Colors.text },
});

export default RepairShopScreen;
