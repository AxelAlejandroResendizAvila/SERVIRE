import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

const AnimatedCard = ({ 
  children, 
  style, 
  animation = 'fadeUp',
  delay = 0,
  duration = 600
}) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Resetear valores iniciales
    fadeAnim.setValue(0);
    translateY.setValue(20);
    scaleAnim.setValue(0.9);
    slideX.setValue(animation === 'slideLeft' ? -50 : 0);

    let animateTo;

    switch (animation) {
      case 'fadeUp':
        animateTo = Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            delay,
            useNativeDriver: true
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration,
            delay,
            useNativeDriver: true
          })
        ]);
        break;

      case 'fadeIn':
        animateTo = Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true
        });
        break;

      case 'slideLeft':
        animateTo = Animated.parallel([
          Animated.timing(slideX, {
            toValue: 0,
            duration,
            delay,
            useNativeDriver: true
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            delay,
            useNativeDriver: true
          })
        ]);
        break;

      case 'bounce':
        animateTo = Animated.sequence([
          Animated.timing(translateY, {
            toValue: -10,
            duration: duration * 0.4,
            delay,
            useNativeDriver: true
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: duration * 0.6,
            useNativeDriver: true
          })
        ]);
        break;

      case 'scale':
        animateTo = Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration,
            delay,
            useNativeDriver: true
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            delay,
            useNativeDriver: true
          })
        ]);
        break;

      default:
        animateTo = Animated.timing(fadeAnim, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true
        });
    }

    animateTo.start();
  }, [animation, delay, duration, fadeAnim, translateY, scaleAnim, slideX]);

  const defaultStyle = {
    width: '100%'
  };

  return (
    <Animated.View
      style={[
        defaultStyle,
        {
          opacity: fadeAnim,
          transform: [
            { translateY },
            { translateX: slideX },
            { scale: scaleAnim }
          ]
        },
        style
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default AnimatedCard;
