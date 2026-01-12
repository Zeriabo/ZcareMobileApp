import React, { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, Button, Card } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { signOut } from '../redux/actions/AuthActions';
import { deleteCar, getUserCars } from '../redux/actions/carActions';
import { RootState } from '../redux/store';

export default function ProfileScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);
  const cars = useSelector((state: RootState) => state.cars.cars);

  useEffect(() => {
    if (user?.token) {
      dispatch(getUserCars(user.token));
    }
  }, [dispatch, user]);

  const handleRemoveCar = (car: any) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${car.manufacture} ${car.registrationPlate}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteCar({ carId: car.carId, token: user.token }));
            dispatch(getUserCars(user.token)); // refresh after delete
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await dispatch(signOut());
            navigation.reset({
              index: 0,
              routes: [{ name: 'SignIn' }], // redirect to SignIn
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {/* User Info */}
   <View style={styles.profileHeader}>
  <Avatar.Text
    size={64}
    label={user?.firstName?.[0]?.toUpperCase() || '?'}
  />
  <View style={{ marginLeft: 20 }}>
    <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
    <Text style={styles.username}>@{user?.username}</Text>
    <Text style={styles.email}>{user?.email || 'No email provided'}</Text>
  </View>
</View>


      <Text style={styles.sectionTitle}>My Cars</Text>

      {cars.length === 0 ? (
        <Text style={styles.noCarsText}>You haven't registered any cars yet.</Text>
      ) : (
        cars.map((car: any) => (
          <Card key={car.carId} style={styles.card}>
            <Card.Content>
              <Text style={styles.carTitle}>
                {car.manufacture} - {car.registrationPlate}
              </Text>
              <Text style={styles.carInfo}>Manufactured: {car.dateOfManufacture}</Text>
            </Card.Content>
            <Card.Actions>
              <Button
                mode="outlined"
                onPress={() => handleRemoveCar(car)}
                textColor="#EF4444"
              >
                Remove
              </Button>
            </Card.Actions>
          </Card>
        ))
      )}

      <Button
        mode="contained"
        style={{ marginTop: 20 }}
        onPress={handleSignOut}
        buttonColor="#EF4444"
      >
        Sign Out
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  profileHeader: { flexDirection: 'row', alignItems: 'center',   marginTop: 40,   marginBottom: 30 },
  name: { fontSize: 24, fontWeight: 'bold' },
  username: { fontSize: 16, color: 'gray' },
  email: { fontSize: 14, color: 'gray' },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  noCarsText: { fontSize: 16, color: 'gray', marginVertical: 10 },
  card: { marginBottom: 16, borderRadius: 8, elevation: 2, backgroundColor: '#fff' },
  carTitle: { fontSize: 18, fontWeight: 'bold' },
  carInfo: { fontSize: 14, color: 'gray', marginTop: 4 },
});
