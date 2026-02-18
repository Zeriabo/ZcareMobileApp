import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
const carWashAnimation = require('../assets/animations/car_wash.json');
const ActiveWashScreen = () => {
  const navigation = useNavigation<any>();
  const progress = useRef(new Animated.Value(0)).current;
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    // Animate progress from 0 → 1 in 10 seconds
    Animated.timing(progress, {
      toValue: 1,
      duration: 10000,
      useNativeDriver: false,
    }).start(() => {
      setCompleted(true);
      setTimeout(() => {
        navigation.goBack(); // go back after showing "completed"
      }, 2000);
    });
  }, []);

  return (
    <View style={styles.container}>
      {!completed ? (
        <>
          <Text style={styles.title}>🚗 Your Car is Being Washed...</Text>
          <LottieView
             source={carWashAnimation}
            autoPlay
            loop
            style={{width: 300, height: 300}}
          />

          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </>
      ) : (
        <View style={styles.doneContainer}>
          <Text style={styles.doneText}>✅ Wash Completed!</Text>
        </View>
      )}
    </View>
  );
};

export default ActiveWashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dff9fb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#00a8ff',
    borderRadius: 10,
    marginTop: 20,
  },
  doneContainer: {
    alignItems: 'center',
  },
  doneText: {
    fontSize: 26,
    color: '#27ae60',
    fontWeight: 'bold',
  },
});
