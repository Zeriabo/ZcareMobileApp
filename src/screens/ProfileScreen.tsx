import { LogOut } from '@tamagui/lucide-icons';
import { MotiView } from 'moti';
import React, { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, Button, Text, XStack, YStack } from 'tamagui';
import { signOut } from '../redux/actions/AuthActions';
import { RootState } from '../redux/store';
import MyCars from './MyCars';

export default function ProfileScreen({ navigation }: any) {
  const dispatch = useDispatch<any>();
  const user: any = useSelector((state: RootState) => state.user.user);
  const isAuthenticated = Boolean(user?.token);

  useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate('SignIn');
    }
  }, [isAuthenticated, navigation]);

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
    <XStack alignItems="center" marginTop="$8" marginBottom="$7">

<MotiView
  from={{ scale: 0.85, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{
    type: 'spring',
    damping: 14,
    stiffness: 120,
  }}
>
  <Avatar
    circular
    size={64}          // fixed size for clarity
    shadowColor="$shadowColor"
    shadowOpacity={0.25}
    shadowRadius={10}
    elevation={6}
  >
    <Avatar.Fallback backgroundColor="$purple10">
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Text color="white" fontSize={28} fontWeight="700">
          {user?.firstName?.[0]?.toUpperCase() || '?'}
        </Text>
      </YStack>
    </Avatar.Fallback>
  </Avatar>
</MotiView>


  <View style={styles.profileInfo}>
    <View style={styles.nameRow}>
   

<XStack alignItems="center" gap="$3">
  <Text style={styles.name}>
    {user?.firstName} {user?.lastName}
  </Text>

  <MotiView
    from={{ scale: 1 }}
    animate={{ scale: 1 }}
    transition={{ type: 'spring' }}
  >
    <Button
      size="$3"
      icon={LogOut}
      backgroundColor="$red10"
      color="white"
      borderRadius={12}
      paddingHorizontal={14}
      height={36}
      pressStyle={{ scale: 0.95, backgroundColor: '$red9' }}
      onPress={handleSignOut}
    />
  </MotiView>
</XStack>

    </View>
    <MotiView
  from={{ scale: 1 }}
  animate={{ scale: 1 }}
  transition={{ type: 'spring' }}>
</MotiView>
    <Text style={styles.username}>@{user?.username}</Text>
    <Text style={styles.email}>{user?.username}</Text>
  </View>
</XStack>
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
