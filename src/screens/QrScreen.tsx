import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f3f3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: '600',
  },
  backBtn: {
    marginTop: 30,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6a0dad',
    borderRadius: 8,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

type Props = NativeStackScreenProps<any, 'QrScreen'>;

const QrScreen: React.FC<Props> = ({ route, navigation }) => {
  const { qrCode, executed } = route.params;

  if (!qrCode || executed) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No valid QR code</Text>

        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Your QR Code</Text>

      <QRCode value={qrCode} size={250} />

    <Pressable
  onPress={() =>
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    })
  }
  style={styles.backBtn}
>
  <Text style={styles.backText}>Go to Home</Text>
</Pressable>

    </View>
  );
};

export default QrScreen;
