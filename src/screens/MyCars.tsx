import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Card, Circle, Text, XStack, YStack } from 'tamagui';
import { useLanguage } from '../contexts/LanguageContext';
import { deleteCar, getUserCars } from '../redux/actions/carActions';
import { fetchInspectionStatusWithFallback } from '../redux/actions/repairActions';
import { setLastInspectionDate } from '../utils/repairService';

function MyCars() {
  const { t } = useLanguage();
  const user = useSelector((state: any) => state.user.user);
  const cars = useSelector((state: any) => state.cars.cars);
  const inspectionData = useSelector((state: any) => state.repair?.inspectionData ?? new Map());
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const getInspectionBadge = (result?: string) => {
    const normalized = String(result || '').toLowerCase();
    if (normalized.includes('fail') || normalized.includes('reject')) return { label: t('cars.inspectionLabels.attentionNeeded'), color: '$red10' };
    if (normalized.includes('pending')) return { label: t('cars.inspectionLabels.pending'), color: '$yellow10' };
    if (!normalized) return { label: t('cars.inspectionLabels.unknown'), color: '$gray10' };
    return { label: t('cars.inspectionLabels.healthy'), color: '$green10' };
  };

  const getNextInspectionDate = (lastInspectionDate?: string) => {
    if (!lastInspectionDate) return null;
    const parsed = new Date(lastInspectionDate);
    if (!Number.isFinite(parsed.getTime())) return null;
    parsed.setFullYear(parsed.getFullYear() + 1);
    return parsed.toDateString();
  };

  const getInspectionReminder = (inspection?: any) => {
    if (!inspection) return null;
    const daysUntilDue = typeof inspection.daysUntilDue === 'number' ? inspection.daysUntilDue : null;
    if (daysUntilDue !== null && daysUntilDue < 0) {
      return { text: t('cars.inspectionReminderOverdue', { days: Math.abs(daysUntilDue) }), color: '$red10' };
    }
    if (inspection.dueWithinThreshold) {
      return { text: t('cars.inspectionReminderDueSoon', { days: daysUntilDue ?? 0 }), color: '$yellow10' };
    }
    if (inspection.lastInspectionDate) {
      return { text: t('cars.inspectionReminderLast', { date: inspection.lastInspectionDate }), color: '$green10' };
    }
    return null;
  };

  useEffect(() => {
    if (user?.token && isFocused) {
      dispatch(getUserCars(user.token));
    }
  }, [dispatch, user, isFocused]);

  useEffect(() => {
    if (!isFocused || !Array.isArray(cars) || cars.length === 0) return;

    cars.forEach((car: any) => {
      const plate = car.registerationPlate || car.registrationPlate;
      if (plate && !inspectionData.has(plate)) {
        dispatch(fetchInspectionStatusWithFallback(plate, car, 30, user?.token));
      }
    });
  }, [cars, dispatch, inspectionData, isFocused, user?.token]);

  const handleRemoveCar = (car: any) => {
    Alert.alert(
      t('cars.confirmDeletion'),
      t('cars.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () =>
            dispatch(deleteCar({ carId: car.carId, token: user.token })),
        },
      ],
    );
  };

  const handleEditInspectionDate = (car: any) => {
    const plate = car.registerationPlate || car.registrationPlate;
    if (!plate) return;

    const currentValue =
      inspectionData.get(plate)?.lastInspectionDate ||
      (car?.lastInspectionDate ? String(car.lastInspectionDate).slice(0, 10) : new Date().toISOString().slice(0, 10));

    const promptFn = (Alert as any).prompt;
    if (typeof promptFn !== 'function') {
      Alert.alert(t('cars.updateInspectionDate'), t('cars.promptInspectionDate', { currentValue }));
      return;
    }

    promptFn(
      t('cars.lastInspectionDatePrompt'),
      t('cars.enterDateFormat'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.save'),
          onPress: async (input?: string) => {
            const value = (input || '').trim();
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
              Alert.alert(t('cars.invalidDate'), t('cars.useDateFormat'));
              return;
            }

            try {
              await setLastInspectionDate(plate, value, user?.token);
              dispatch(fetchInspectionStatusWithFallback(plate, { ...car, lastInspectionDate: value }, 30, user?.token));
              if (user?.token) {
                dispatch(getUserCars(user.token));
              }
            } catch (e: any) {
              Alert.alert(t('cars.updateFailed'), e?.message || t('cars.updateFailedMessage'));
            }
          },
        },
      ],
      'plain-text',
      currentValue,
    );
  };

  return (
    <YStack padding="$4" space="$4">
      <Text fontSize={22} fontWeight="700">
        {t('cars.title')}
      </Text>

      {cars.length === 0 && (
        <Text color="$gray10">{t('cars.noCars')}</Text>
      )}

      {cars.map((car: any) => {
        const plate = car.registerationPlate || car.registrationPlate;
        const inspection = inspectionData.get(plate);
        const badge = getInspectionBadge(inspection?.dueWithinThreshold ? 'WARNING' : 'PASSED');
        const nextInspection = inspection?.nextInspectionDate || getNextInspectionDate(inspection?.lastInspectionDate);
        const reminder = getInspectionReminder(inspection);
        return (
          <Card
            key={car.carId}
            padding="$3"
            borderRadius="$4"
            backgroundColor="$background"
            elevation={3}
          >
            <YStack space="$2">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize={18} fontWeight="700">
                  {car.manufacture} {car.registerationPlate}
                </Text>
                <Text
                  fontSize={11}
                  fontWeight="700"
                  backgroundColor={badge.color}
                  color="white"
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$3"
                >
                  {badge.label}
                </Text>
              </XStack>
              <Text fontSize={14} color="$gray10">
                {t('cars.manufactureYear')}: {new Date(car.dateOfManufacture).getFullYear()}
              </Text>
              <Text fontSize={14} color="$gray10">
                {t('cars.lastInspection')}: {inspection?.lastInspectionDate || t('cars.notAvailable')}
              </Text>
              <Text fontSize={14} color="$gray10">
                {t('cars.nextInspectionDue')}: {nextInspection || t('cars.notAvailable')}
              </Text>
              {reminder ? (
                <Text fontSize={13} color={reminder.color}>
                  {reminder.text}
                </Text>
              ) : null}
              <Text fontSize={13} color="$gray9">
                {t('cars.inspectionStatus')}: {inspection?.message || t('cars.notAvailable')}
              </Text>

              <Button
                size="$4"
                backgroundColor="$blue10"
                color="white"
                borderRadius="$3"
                paddingHorizontal="$4"
                pressStyle={{ scale: 0.95, backgroundColor: '$blue9' }}
                onPress={() => handleEditInspectionDate(car)}
              >
                {t('cars.editInspectionDate')}
              </Button>

              <Button
                size="$4"
                backgroundColor="$red10"
                color="white"
                borderRadius="$3"
                paddingHorizontal="$4"
                pressStyle={{ scale: 0.95, backgroundColor: '$red9' }}
                onPress={() => handleRemoveCar(car)}
              >
                {t('cars.removeCar')}
              </Button>
            </YStack>
          </Card>
        );
      })}

      <Circle
        position="absolute"
        right="$4"

        size={56}
        backgroundColor="$green10"
        alignItems="center"
        justifyContent="center"
        elevation={6}
        onPress={() => navigation.navigate('AddCar')}
      >
        <Text fontSize={32} color="white">
          +
        </Text>
      </Circle>
    </YStack>
  );
}

export default MyCars;
