import React, { useEffect } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

export const Toast = ({ message, type = 'error', duration = 4000, onDismiss }) => {
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de entrada (fade in)
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss
    const timer = setTimeout(() => {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onDismiss && onDismiss();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const getColorByType = () => {
    switch (type) {
      case 'success':
        return theme.colors.status.success;
      case 'warning':
        return theme.colors.status.warning;
      case 'info':
        return theme.colors.primary;
      case 'error':
      default:
        return theme.colors.error;
    }
  };

  const getIconByType = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'warning':
        return 'alert-circle';
      case 'info':
        return 'information-circle';
      case 'error':
      default:
        return 'close-circle';
    }
  };

  const color = getColorByType();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          backgroundColor: '#FFFFFF',
          borderLeftColor: color,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={getIconByType()} size={20} color={color} />
        <Text style={[styles.message, { color: '#000000' }]} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.md,
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
});
