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
import { useDispatch, useSelector } from 'react-redux';
import { fetchPrograms } from '../redux/actions/programsActions';
import { selectStation } from '../redux/actions/stationActions';
import { RootStackParamList } from '../redux/types/stackParams';
import { CarWashingProgram, RootState } from '../redux/types/stationsActionTypes';

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
      source={{ uri: station.media.picture }}
      style={styles.picture}
      resizeMode="cover"
    />
  )}

  <Text style={styles.stationAddress}>{station.address}</Text>

        {/* Custom Header */}
        <View style={styles.header}>
          
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{station.name}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Station Info */}
        <View style={styles.stationCard}>
    <Text style={styles.stationAddress}>{station.address}</Text>

    {/* Navigate Button */}
    <TouchableOpacity
      style={styles.navigateButton}
      onPress={() => openNavigation(station.latitude, station.longitude)}
    >
      <Text style={styles.navigateText}>Navigate</Text>
    </TouchableOpacity>
  </View>

          {/* Programs List */}
          <Text style={styles.sectionTitle}>Available Programs</Text>
          {programs.length > 0 ? (
            programs.map((program) => (
              <TouchableOpacity
                key={program.id}
                style={styles.programCard}
                onPress={() => handleProgramSelection(program)}
              >
                <Text style={styles.programText}>{program.name}</Text>
                <Text style={styles.programPrice}>€{program.price}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noProgramsText}>No programs available</Text>
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
      paddingTop: 50, // Push down below the status bar
      paddingBottom: 15,
      paddingHorizontal: 20,
      backgroundColor: '#fff',
      elevation: 4,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      zIndex: 10,
    },
    backButton: {
      marginRight: 20,
    },
    backButtonText: {
      fontSize: 18,
      color: '#007AFF',
      fontWeight: '600',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
      flexShrink: 1,
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
    stationAddress: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
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
      color: '#333',
      fontWeight: '600',
    },
    programPrice: {
      fontSize: 16,
      color: '#007AFF',
      fontWeight: '700',
    },
    noProgramsText: {
      fontSize: 16,
      color: '#999',
      marginTop: 10,
      textAlign: 'center',
    },
    navigateButton: {
    marginTop: 12,
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  navigateText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
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

  });

  export default StationPage;
