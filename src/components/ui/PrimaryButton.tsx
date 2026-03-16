import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { Colors, Radius, Spacing } from '../../theme/design';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
};

const PrimaryButton: React.FC<Props> = ({ label, onPress, loading, disabled, style, textStyle }) => {
  const isDisabled = Boolean(disabled || loading);
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.button, style, isDisabled && styles.disabled]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.text, textStyle]}>{label}</Text>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  disabled: {
    opacity: 0.65,
  },
  text: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});

export default PrimaryButton;
