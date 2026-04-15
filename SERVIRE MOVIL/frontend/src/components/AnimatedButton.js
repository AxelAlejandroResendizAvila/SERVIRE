import React, { useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet } from 'react-native';

const AnimatedButton = ({ onPress, children, style }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          {
            transform: [{ scale: scaleAnim }]
          },
          style
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default AnimatedButton;
