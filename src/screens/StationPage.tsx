import Icon from '@react-native-vector-icons/ionicons';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import BackButton from '../components/ui/BackButton';
import { fetchPrograms } from '../redux/actions/programsActions';
import { selectStation } from '../redux/actions/stationActions';
import { RootStackParamList } from '../redux/types/stackParams';
import { CarWashingProgram, RootState, Station } from '../redux/types/stationsActionTypes';
import { resolveMediaUrl } from '../utils/media';
import { goBackOrHome } from '../utils/navigation';

type StationPageRouteProp = RouteProp<RootStackParamList, 'StationPage'>;
type StationPageNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StationPage'>;

interface Props {
  route: StationPageRouteProp;
  navigation: StationPageNavigationProp;
}

const openNavigation = (lat: number, lng: number) => {
  const url = Platform.select({
    ios: `maps://?q=${lat},${lng}`,
    android: `google.navigation:q=${lat},${lng}`,
  });
  if (url) Linking.openURL(url);
};

const StationPage: React.FC<Props> = ({ route, navigation }) => {
  const { station } = route.params as { station: Station };
  const dispatch = useDispatch<any>();

  useEffect(() => {
    dispatch(selectStation(station.id));
    dispatch(fetchPrograms(station.id));
  }, [dispatch, station.id]);

  const programs: CarWashingProgram[] = useSelector(
    (state: RootState) => state.programsState.programs
  );
  const programsLoading = useSelector(
    (state: RootState) => state.programsState.loading
  );
  const programsError = useSelector(
    (state: RootState) => state.programsState.error
  );

  const stationLatitude = Number(station.latitude ?? station.lat);
  const stationLongitude = Number(station.longitude ?? station.lng);
  const hasStationCoordinates =
    Number.isFinite(stationLatitude) && Number.isFinite(stationLongitude);

  const getProgramPrice = (program: CarWashingProgram) => {
    const rawPrice = Number(program.price);
    return Number.isFinite(rawPrice) ? `EUR ${rawPrice.toFixed(2)}` : 'Price at station';
  };

  const handleProgramSelection = (selectedProgram: CarWashingProgram) => {
    navigation.navigate('Buywash', { selectedProgram });
  };

  const stationHero = station.media?.picture ? resolveMediaUrl(station.media.picture) : null;
  const stationLogo = station.media?.logo ? resolveMediaUrl(station.media.logo) : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroWrap}>
          {stationHero ? (
            <Image source={{ uri: stationHero }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroFallback}>
              <Icon name="water-outline" size={28} color="#9CA3AF" />
              <Text style={styles.heroFallbackText}>No station image available</Text>
            </View>
          )}

          <View style={styles.heroOverlay} />
          <View style={styles.heroTopRow}>
            <BackButton onPress={() => goBackOrHome(navigation)} backgroundColor="#ffffffee" />
            <Pressable
              onPress={() => {
                if (hasStationCoordinates) {
                  openNavigation(stationLatitude, stationLongitude);
                }
              }}
              style={[styles.iconButton, !hasStationCoordinates && styles.disabled]}
              disabled={!hasStationCoordinates}
            >
              <Icon name="navigate-outline" size={20} color="#111827" />
            </Pressable>
          </View>
        </View>

        <View style={styles.mainCard}>
          <View style={styles.titleRow}>
            {stationLogo ? (
              <Image source={{ uri: stationLogo }} style={styles.logo} />
            ) : (
              <View style={styles.logoFallback}>
                <Icon name="business-outline" size={18} color="#6B7280" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.stationName}>{station.name}</Text>
              <View style={styles.locationChip}>
                <Icon name="location-outline" size={14} color="#4F46E5" />
                <Text style={styles.locationText} numberOfLines={1}>{station.address}</Text>
              </View>
            </View>
          </View>

          <Pressable
            style={[styles.directionCard, !hasStationCoordinates && styles.disabled]}
            onPress={() => {
              if (hasStationCoordinates) {
                openNavigation(stationLatitude, stationLongitude);
              }
            }}
            disabled={!hasStationCoordinates}
          >
            <View>
              <Text style={styles.directionTitle}>Get Directions</Text>
              <Text style={styles.directionSubtitle}>
                {hasStationCoordinates ? 'Open turn-by-turn navigation' : 'Location coordinates unavailable'}
              </Text>
            </View>
            <Icon name="arrow-forward" size={18} color="#4F46E5" />
          </Pressable>

          {/* Waterless Mobile Wash CTA */}
          <Pressable
            style={styles.waterlessCard}
            onPress={() => {
              const waterlessProgram = programs.find(
                (p) =>
                  Number.isFinite(Number(p?.id)) &&
                  Number(p.id) > 0 &&
                  String(p?.programType || '').trim().toLowerCase() === 'waterless'
              );
              const fallbackWaterlessProgram = {
                id: null,
                name: 'Waterless Mobile Wash',
                price: 25,
                programType: 'waterless',
                description: 'Eco-friendly wash delivered to your location',
              };
              navigation.navigate('Buywash', { selectedProgram: waterlessProgram || fallbackWaterlessProgram });
            }}
          >
            <View style={styles.waterlessIconBadge}>
              <Icon name="water-outline" size={24} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.waterlessTitle}>🚗 Order Waterless Mobile Wash</Text>
              <Text style={styles.waterlessSubtitle}>Eco-friendly wash delivered to your location</Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#10B981" />
          </Pressable>

          <Text style={styles.sectionTitle}>Available Programs</Text>

          {programsLoading && (
            <View style={styles.loadingPrograms}>
              <ActivityIndicator size="small" color="#4F46E5" />
              <Text style={styles.helperText}>Loading programs...</Text>
            </View>
          )}

          {!programsLoading && programsError && (
            <Text style={styles.helperText}>Could not load programs right now.</Text>
          )}

          {!programsLoading && !programsError && programs.length === 0 && (
            <Text style={styles.helperText}>No wash programs are available at this station.</Text>
          )}

          {!programsLoading &&
            !programsError &&
            programs.map((program) => (
              <Pressable
                key={program.id}
                style={styles.programCard}
                onPress={() => handleProgramSelection(program)}
              >
                <View style={styles.programMain}>
                  <Text style={styles.programName}>{program.name}</Text>
                  <Text style={styles.programPrice}>{getProgramPrice(program)}</Text>
                </View>

                {program.media?.picture ? (
                  <Image
                    source={{ uri: resolveMediaUrl(program.media.picture) }}
                    style={styles.programMedia}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.programMediaFallback}>
                    <Icon name="image-outline" size={16} color="#6B7280" />
                    <Text style={styles.programMediaFallbackText}>No media</Text>
                  </View>
                )}
              </Pressable>
            ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF2FF' },
  scrollContent: { paddingBottom: 30 },
  heroWrap: {
    height: 230,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroFallbackText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,24,39,0.22)',
  },
  heroTopRow: {
    position: 'absolute',
    top: 52,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffffee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCard: {
    marginTop: -26,
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#111827',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F3F4F6',
  },
  logoFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationName: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
  },
  locationChip: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2FF',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  locationText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: '92%',
  },
  directionCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  directionTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 15,
  },
  directionSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  disabled: {
    opacity: 0.45,
  },
  waterlessCard: {
    marginTop: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waterlessIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterlessTitle: {
    color: '#065F46',
    fontWeight: '800',
    fontSize: 15,
  },
  waterlessSubtitle: {
    color: '#059669',
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
  },
  loadingPrograms: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  helperText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 10,
  },
  programCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  programMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programName: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  programPrice: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '800',
  },
  programMedia: {
    width: '100%',
    height: 96,
    borderRadius: 10,
    marginTop: 10,
  },
  programMediaFallback: {
    height: 72,
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  programMediaFallbackText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default StationPage;
