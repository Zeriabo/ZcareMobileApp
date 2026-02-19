import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

type Props = {
  onPress: () => void;
  color?: string;
  backgroundColor?: string;
};

const BackButton: React.FC<Props> = ({
  onPress,
  color = '#111827',
  backgroundColor = '#F9FAFB',
}) => {
  return (
    <Pressable onPress={onPress} hitSlop={12} style={[styles.button, { backgroundColor }]}>
      <Icon name="chevron-back" size={22} color={color} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BackButton;
