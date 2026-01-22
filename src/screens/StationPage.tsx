  import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPrograms } from '../redux/actions/programsActions';
import { selectStation } from '../redux/actions/stationActions';
import { RootStackParamList } from '../redux/types/stackParams';
import { CarWashingProgram, RootState } from '../redux/types/stationsActionTypes';
import { resolveMediaUrl } from '../utils/media';

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

    if (url) {
      Linking.openURL(url);
    }
  };
  const StationPage: React.FC<Props> = ({ route, navigation }) => {
    const { station } = route.params;
    const dispatch = useDispatch();

    useEffect(() => {
      dispatch(selectStation(station.id));
      dispatch(fetchPrograms(station.id));
    }, [dispatch, station.id]);

    const programs: CarWashingProgram[] = useSelector(
      (state: RootState) => state.programsState.programs
    );

    const handleProgramSelection = (selectedProgram: CarWashingProgram) => {
      navigation.navigate('Buywash', { selectedProgram });
    };

    React.useLayoutEffect(() => {
      navigation.setOptions({
        headerShown: false, // We handle custom header
      });
    }, [navigation]);

    return (
      <View style={styles.container}>
          {station.media?.logo && (
    <Image
      source={{ uri: station.media.logo }}
      style={styles.logo}
      resizeMode="contain"
    />
  )}

  {station.media?.picture && (
    <Image
      source={{ uri: resolveMediaUrl(station.media.picture) }}
      style={styles.picture}
      resizeMode="cover"
    />
  )}

  <Text style={styles.stationAddressLabel}>Location</Text>
<Text style={styles.stationAddress}>{station.address}</Text>

<View style={styles.header}>
<TouchableOpacity
  style={styles.backButton}
  onPress={() => navigation.goBack()}
  activeOpacity={0.6}
  accessibilityLabel="Go back"
>
  <Icon name="chevron-back" size={28} color="#007AFF" />
</TouchableOpacity>


  <View style={styles.headerCenter}>
    {station.media?.logo && (
      <Image
        source={{ uri: resolveMediaUrl(station.media.logo) }}
        style={styles.headerLogo}
      />
    )}
    <Text style={styles.headerTitle} numberOfLines={1}>
      {station.name}
    </Text>
  </View>

  {/* spacer to balance center alignment */}
  <View style={{ width: 40 }} />
</View>


        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Station Info */}
        <View style={styles.stationCard}>
  
<TouchableOpacity
  style={styles.mapPreview}
  onPress={() => openNavigation(station.latitude, station.longitude)}
>
  <Icon name="navigate-outline" size={18} color="#4F46E5" />
  <Text style={styles.mapPreviewText}>Get Directions</Text>
</TouchableOpacity>


  </View>

          {/* Programs List */}
         <Text style={styles.sectionTitle}>Car Wash Programs</Text>
          {programs.length > 0 ? (
            programs.map((program:any) => (
               <TouchableOpacity
    key={program.id}
    style={styles.programCard}
    onPress={() => handleProgramSelection(program)}
  >
    <Text style={styles.programText}>{program.name}</Text>
  <Text style={styles.programPrice}>€{program.price.toFixed(2)}</Text>


    {/* Show GIF or Image */}
    {program.media?.picture && (
      <Image
        source={{ uri: resolveMediaUrl(program.media.picture) }}
        style={styles.programMedia}
        resizeMode="cover"
      />
    )}

   
  </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noProgramsText}>
  No wash programs are available at this station.
</Text>

          )}
        </ScrollView>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingTop: 50,
  paddingBottom: 14,
  paddingHorizontal: 16,
  backgroundColor: '#fff',
  elevation: 4,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 4,
},
  
  backButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: 'center',
  justifyContent: 'center',
},
mapPreview: {
  marginTop: 16,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 12,
  paddingVertical: 14,
  alignItems: 'center',
  flexDirection: 'row',
  justifyContent: 'center',
  gap: 6,
},

mapPreviewText: {
  fontWeight: '600',
  color: '#4F46E5',
},

  
    scrollContainer: {
      paddingHorizontal: 20,
      paddingBottom: 30,
    },
    stationCard: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 20,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      marginBottom: 20,
    },
 
    sectionTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 15,
    },
    programCard: {
      width: '100%',
      backgroundColor: '#fff',
      paddingVertical: 18,
      paddingHorizontal: 20,
      borderRadius: 12,
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      elevation: 1,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 4,
    },
  programText: {
  fontSize: 16,
  color: '#111827',
  fontWeight: '600',
},

programPrice: {
  fontSize: 15,
  color: '#4F46E5',
  fontWeight: '700',
},

    noProgramsText: {
      fontSize: 16,
      color: '#999',
      marginTop: 10,
      textAlign: 'center',
    },
navigatePill: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#4F46E5',
  paddingVertical: 12,
  paddingHorizontal: 18,
  borderRadius: 30,
  marginTop: 14,
  gap: 8,
  elevation: 4,
  shadowColor: '#000',
  shadowOpacity: 0.15,
  shadowOffset: { width: 0, height: 3 },
  shadowRadius: 6,
},

navigatePillText: {
  color: '#fff',
  fontWeight: '700',
  fontSize: 16,
},


logo: {
  width: 80,
  height: 80,
  marginBottom: 10,
  borderRadius: 40, // circle
  alignSelf: 'center',
},
picture: {
  width: '100%',
  height: 200,
  marginBottom: 15,
  borderRadius: 12,
},

programMedia: {
  width: '50%',
  height: 80,
  borderRadius: 8,
  marginTop: 10,
},



headerCenter: {
  flexDirection: 'row',
  alignItems: 'center',
  alignSelf: 'center',
},

headerLogo: {
  width: 36,
  height: 36,
  borderRadius: 18,
  marginRight: 8,
},

headerTitle: {
  fontSize: 18,
  fontWeight: '600', 
  color: '#111827',
  maxWidth: 220,
},
stationAddressLabel: {
  fontSize: 13,
  fontWeight: '600',
  color: '#9CA3AF',
  textAlign: 'center',
  marginBottom: 4,
},

stationAddress: {
  fontSize: 15,
  color: '#4B5563',
  textAlign: 'center',
  lineHeight: 22,
},

  });

  export default StationPage;
