// EJEMPLO DE INTEGRACIÓN EN COMPONENTES EXISTENTES
// =================================================

// En ExplorarEspacios.js (o cualquier pantalla con listas):

import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';

// Reemplaza el renderizado de tarjetas con:

{espacios.map((espacio, index) => (
  <AnimatedCard
    key={espacio.id_espacio}
    animation="fadeUp"
    delay={index * 80} // Efecto cascada
    duration={500}
    style={{ marginBottom: 16 }}
  >
    <AnimatedButton
      onPress={() => navigation.navigate('DetallesReserva', { espacioId: espacio.id_espacio })}
      style={styles.spaceCard}
    >
      <Image 
        source={{ uri: espacio.imagen_url }} 
        style={styles.spaceImage} 
      />
      <View style={styles.spaceInfo}>
        <Text style={styles.spaceName}>{espacio.nombre}</Text>
        <Text style={styles.spaceCategory}>{espacio.categoria}</Text>
      </View>
    </AnimatedButton>
  </AnimatedCard>
))}

// En MisReservas.js (o cualquier pantalla con listas):

{reservas.map((reserva, index) => (
  <AnimatedCard
    key={reserva.id}
    animation="slideLeft"
    delay={index * 100}
    duration={600}
    style={{ marginBottom: 12 }}
  >
    {/* Tu contenido actual */}
    <View style={styles.reservationCard}>
      {/* ... */}
    </View>
  </AnimatedCard>
))}

// Para botones de acción (aprobar, rechazar, etc):

<AnimatedButton
  onPress={() => handleApprove(reserva.id)}
  style={styles.button}
>
  <Text style={styles.buttonText}>Aprobar</Text>
</AnimatedButton>

// ================================================
// ANIMACIONES DISPONIBLES:
// ================================================
// * 'fadeUp' - Aparece desvaneciéndose y subiendo (¡MÁS ESPECTACULAR!)
// * 'fadeIn' - Solo desvanecimiento
// * 'slideLeft' - Desliza desde la izquierda
// * 'bounce' - Efecto rebote
// * 'scale' - Crece desde el centro

// PARÁMETROS:
// - animation: tipo de animación (string)
// - delay: retraso en ms (para efecto cascada)
// - duration: duración de la animación en ms
// - style: estilos adicionales

// ================================================
// EJEMPLO COMPLETO - PANTALLA CON ANIMACIONES
// ================================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';

const MisReservasConAnimaciones = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar reservas
    fetchReservas().then(setReservas).finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator />;

  return (
    <ScrollView style={styles.container}>
      {reservas.map((reserva, index) => (
        <AnimatedCard
          key={reserva.id}
          animation="fadeUp"
          delay={index * 100}
          duration={500}
          style={{ marginBottom: 16 }}
        >
          <View style={styles.card}>
            <Text style={styles.title}>{reserva.espacio}</Text>
            <Text style={styles.date}>{reserva.fecha}</Text>
            
            <View style={styles.actions}>
              <AnimatedButton
                onPress={() => handleView(reserva.id)}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Ver</Text>
              </AnimatedButton>
            </View>
          </View>
        </AnimatedCard>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f7fa'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8
  },
  date: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 12
  },
  actions: {
    flexDirection: 'row',
    gap: 8
  },
  button: {
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontWeight: '600'
  }
});

export default MisReservasConAnimaciones;
