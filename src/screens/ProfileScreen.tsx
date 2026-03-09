import { LogOut } from '@tamagui/lucide-icons';
import { MotiView } from 'moti';
import React, { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, Button, Text, XStack, YStack } from 'tamagui';
import { getLanguageName, useLanguage } from '../contexts/LanguageContext';
import { signOut } from '../redux/actions/AuthActions';
import { RootState } from '../redux/store';
import MyCars from './MyCars';

export default function ProfileScreen({ navigation }: any) {
  const { t, language, setLanguage } = useLanguage();
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
      t('auth.signOut'),
      t('auth.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.signOut'),
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

  const handleLanguageChange = () => {
    Alert.alert(
      t('profile.language'),
      t('profile.language'),
      [
        {
          text: 'English',
          onPress: () => setLanguage('en'),
        },
        {
          text: 'Suomi',
          onPress: () => setLanguage('fi'),
        },
        {
          text: 'العربية',
          onPress: () => setLanguage('ar'),
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.profileCard}>
        <XStack alignItems="center" gap="$4">
          <MotiView
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 14, stiffness: 120 }}
          >
            <Avatar
              circular
              size={68}
              shadowColor="$shadowColor"
              shadowOpacity={0.22}
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
            <Text style={styles.name} numberOfLines={1}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.username} numberOfLines={1}>@{user?.username}</Text>
          </View>
        </XStack>

        <View style={styles.actionsWrap}>
          <View style={styles.languageRow}>
            <Text style={styles.languageLabel}>{t('profile.language')}</Text>
            <Button
              size="$3"
              backgroundColor="$blue10"
              color="white"
              borderRadius={14}
              paddingHorizontal={14}
              height={38}
              pressStyle={{ scale: 0.96, backgroundColor: '$blue9' }}
              onPress={handleLanguageChange}
            >
              {getLanguageName(language)}
            </Button>
          </View>

          <Button
            size="$3"
            icon={LogOut}
            backgroundColor="$red10"
            color="white"
            borderRadius={14}
            height={40}
            pressStyle={{ scale: 0.96, backgroundColor: '$red9' }}
            onPress={handleSignOut}
          >
            {t('auth.signOut')}
          </Button>
        </View>
      </View>

      <MyCars />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  contentContainer: {
    padding: 20,
    paddingBottom: 28,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginTop: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 4,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  username: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 3,
  },
  actionsWrap: {
    marginTop: 14,
    gap: 10,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  languageLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
});
