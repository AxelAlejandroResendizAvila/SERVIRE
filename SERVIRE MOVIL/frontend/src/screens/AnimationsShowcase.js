import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';
import Button from '../components/Button';

const AnimationsShowcase = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeExample, setActiveExample] = useState(null);

  const examples = [
    {
      id: 'fadeUp',
      name: 'Desvanecimiento + Elevación',
      animationType: 'fadeUp'
    },
    {
      id: 'fadeIn',
      name: 'Desvanecimiento Simple',
      animationType: 'fadeIn'
    },
    {
      id: 'slideLeft',
      name: 'Deslizar desde Izquierda',
      animationType: 'slideLeft'
    },
    {
      id: 'bounce',
      name: 'Rebote',
      animationType: 'bounce'
    },
    {
      id: 'scale',
      name: 'Escala + Desvanecimiento',
      animationType: 'scale'
    }
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Animaciones Disponibles</Text>
        <Text style={styles.subtitle}>Tap en cada tarjeta para ver la animación</Text>
      </View>

      <View style={styles.grid}>
        {examples.map((example, index) => (
          <AnimatedCard
            key={example.id}
            animation="fadeUp"
            delay={index * 100}
            duration={600}
            style={{ marginBottom: 12 }}
          >
            <AnimatedButton
              onPress={() => setActiveExample(example.id)}
              style={[
                styles.card,
                activeExample === example.id && styles.cardActive
              ]}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{example.name}</Text>
                <Text style={styles.cardDescription}>Tap para activar</Text>
              </View>
            </AnimatedButton>
          </AnimatedCard>
        ))}
      </View>

      {activeExample && (
        <View style={styles.preview}>
          <AnimatedCard
            animation={examples.find(e => e.id === activeExample).animationType}
            duration={1000}
          >
            <View style={styles.previewBox}>
              <Text style={styles.previewText}>✨ Animación en acción</Text>
            </View>
          </AnimatedCard>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  header: {
    marginBottom: 24,
    marginTop: 16
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: '#718096'
  },
  grid: {
    marginBottom: 24
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5'
  },
  cardActive: {
    backgroundColor: '#4F46E5',
    borderLeftColor: '#6366F1'
  },
  cardContent: {
    gap: 4
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c'
  },
  cardActive: {
    backgroundColor: '#4F46E5'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  cardDescription: {
    fontSize: 12,
    color: '#718096'
  },
  preview: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16
  },
  previewBox: {
    width: 150,
    height: 150,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  previewText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center'
  }
});

export default AnimationsShowcase;
