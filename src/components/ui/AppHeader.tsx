import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BackButton from './BackButton';
import { Colors, Radius, Spacing } from '../../theme/design';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

const AppHeader: React.FC<Props> = ({ title, subtitle, onBack, right }) => {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        {onBack ? (
          <BackButton onPress={onBack} color={Colors.text} />
        ) : (
          <View style={styles.iconButtonPlaceholder} />
        )}
        {right || <View style={styles.iconButtonPlaceholder} />}
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  iconButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    marginTop: 4,
    color: Colors.textMuted,
    fontSize: 14,
  },
});

export default AppHeader;
