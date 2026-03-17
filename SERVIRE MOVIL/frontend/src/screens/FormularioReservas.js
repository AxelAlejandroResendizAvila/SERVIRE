import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Card from '../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { createReservation } from '../services/api';

export default function FormularioReservas({ navigation, route }) {
    const space = route?.params?.space || null;
    const [reason, setReason] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [loading, setLoading] = useState(false);

    const calculateDuration = () => {
        if (!startTime || !endTime) return 0;
        const [startHour] = startTime.split(':').map(Number);
        const [endHour] = endTime.split(':').map(Number);
        return Math.abs(endHour - startHour) || 0;
    };

    const handleConfirm = async () => {
        if (!date || !startTime || !endTime) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        if (!space?.id) {
            Alert.alert('Error', 'Espacio no encontrado');
            return;
        }

        setLoading(true);

        try {
            const [startHour, startMin] = startTime.split(':');
            const [endHour, endMin] = endTime.split(':');

            const fechaInicio = new Date(`${date}T${startHour}:${startMin}:00`).toISOString();
            const fechaFin = new Date(`${date}T${endHour}:${endMin}:00`).toISOString();

            const response = await createReservation({
                id_espacio: space.id,
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                precio_total: 0, // Puedes calcular esto según tu lógica
            });

            if (response.reserva || response.success) {
                Alert.alert(
                    'Éxito',
                    response.message || 'Reserva creada correctamente',
                    [{ text: 'OK', onPress: () => {
                        navigation.navigate('MisReservas');
                    }}]
                );
            } else {
                Alert.alert('Error', 'No se pudo crear la reserva');
            }
        } catch (error) {
            console.error('Error creando reserva:', error);
            Alert.alert('Error', error.message || 'Error al crear la reserva');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Header title="Nueva reserva" showBack />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <Card style={styles.spaceInfoCard}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="business" size={24} color={theme.colors.primary} />
                    </View>
                    <View style={styles.spaceDetails}>
                        <Text style={styles.spaceName}>{space?.name || 'Espacio'}</Text>
                        <Text style={styles.spaceType}>{space?.type || 'General'}</Text>
                        <Text style={styles.spaceCapacity}>
                            Capacidad: {space?.capacity || '?'} personas
                        </Text>
                    </View>
                </Card>

                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Fecha y Hora</Text>

                    <InputField
                        label="Fecha (YYYY-MM-DD)"
                        placeholder="2025-02-15"
                        value={date}
                        onChangeText={setDate}
                        icon={<Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />}
                        editable={!loading}
                    />

                    <View style={styles.timeRow}>
                        <View style={styles.timeInput}>
                            <InputField
                                label="Inicio (HH:MM)"
                                placeholder="10:00"
                                value={startTime}
                                onChangeText={setStartTime}
                                icon={<Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />}
                                editable={!loading}
                            />
                        </View>
                        <View style={styles.timeSpacer} />
                        <View style={styles.timeInput}>
                            <InputField
                                label="Fin (HH:MM)"
                                placeholder="12:00"
                                value={endTime}
                                onChangeText={setEndTime}
                                icon={<Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />}
                                editable={!loading}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Detalles</Text>
                    <InputField
                        label="Motivo de la reserva (opcional)"
                        placeholder="¿Para qué necesitas el espacio?"
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        numberOfLines={4}
                        editable={!loading}
                    />
                </View>

                <Card style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Resumen</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Duración total:</Text>
                        <Text style={styles.summaryValue}>{calculateDuration()} horas</Text>
                    </View>
                </Card>

                <Button
                    title={loading ? "Procesando..." : "Confirmar Reserva"}
                    onPress={handleConfirm}
                    style={styles.confirmButton}
                    disabled={loading}
                />

                {loading && <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />}

            </ScrollView>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        padding: theme.spacing.lg,
    },
    spaceInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        backgroundColor: theme.colors.surface,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    spaceDetails: {
        flex: 1,
    },
    spaceName: {
        ...theme.typography.subheader,
        fontSize: 16,
    },
    spaceType: {
        ...theme.typography.caption,
        marginTop: 2,
        color: theme.colors.text.secondary,
    },
    spaceCapacity: {
        ...theme.typography.caption,
        marginTop: 2,
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    formSection: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        ...theme.typography.subheader,
        marginBottom: theme.spacing.md,
        color: theme.colors.secondary,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    timeInput: {
        flex: 1,
    },
    timeSpacer: {
        width: theme.spacing.md,
    },
    summaryCard: {
        backgroundColor: theme.colors.primary + '10',
        borderColor: theme.colors.primary + '30',
        borderWidth: 1,
        marginBottom: theme.spacing.xl,
    },
    summaryTitle: {
        ...theme.typography.subheader,
        fontSize: 16,
        color: theme.colors.primary,
        marginBottom: theme.spacing.sm,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryLabel: {
        ...theme.typography.body,
    },
    summaryValue: {
        ...theme.typography.body,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    confirmButton: {
        marginBottom: theme.spacing.xl,
    },
    loader: {
        marginTop: theme.spacing.md,
    }
});
