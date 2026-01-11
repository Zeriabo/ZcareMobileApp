import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import {
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

type StationPageRouteProp = RouteProp<
  RootStackParamList,
  'StationPage'
>;

type StationPageNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'StationPage'
>;

interface Props {
  route: StationPageRouteProp;
  navigation: StationPageNavigationProp;
}
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
      headerShown: false, // We'll use custom back button
    });
  }, [navigation]);

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Custom Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Station Info Card */}
        <View style={styles.stationCard}>
          <Text style={styles.stationName}>{station.name}</Text>
          <Text style={styles.stationAddress}>{station.address}</Text>
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
              <Text style={styles.programPrice}>${program.price}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noProgramsText}>No programs available</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    padding: 20,
    alignItems: 'center',
      paddingTop: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  stationCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    marginBottom: 20,
    alignItems: 'center',
  },
  stationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stationAddress: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  programCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  programText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  programPrice: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  noProgramsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
});

export default StationPage;
