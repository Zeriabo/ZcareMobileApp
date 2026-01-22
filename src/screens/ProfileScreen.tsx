import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar, IconButton } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { signOut } from '../redux/actions/AuthActions';
import { RootState } from '../redux/store';
import MyCars from './MyCars';

export default function ProfileScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);

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
             dispatch(signOut());
            navigation.reset({
              index: 0,
              routes: [{ name: 'SignIn' }],
            });
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {/* Profile Header */}
     <View style={styles.profileHeader}>
  <Avatar.Text
    size={64}
    label={user?.firstName?.[0]?.toUpperCase() || '?'}
  />

  <View style={styles.profileInfo}>
    <View style={styles.nameRow}>
      <Text style={styles.name}>
        {user?.firstName} {user?.lastName}
      </Text>


      <IconButton
        icon="logout"
        size={22}
        onPress={handleSignOut}
        iconColor="#EF4444"
      />
    </View>

    <Text style={styles.username}>@{user?.username}</Text>
    <Text style={styles.email}>{user?.email}</Text>
  </View>
</View>


      <MyCars />

     
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
  profileInfo: {
  marginLeft: 20,
  flex: 1,
},

nameRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},



});
