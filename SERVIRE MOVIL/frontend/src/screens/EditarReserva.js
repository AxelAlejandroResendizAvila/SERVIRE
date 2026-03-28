import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Card from '../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { updateReservation, getReservationById } from '../services/api';

export default function EditarReserva({ navigation, route }) {
    const reservationId = route?.params?.id;
    const [reservation, setReservation] = useState(null);
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchReservationDetails();
    }, []);

    const fetchReservationDetails = async () => {
        try {
            setLoading(true);
            const data = await getReservationById(reservationId);
            setReservation(data);

            // Parse date and time
            const startDate = new Date(data.fecha_inicio);
            const endDate = new Date(data.fecha_fin);

            const dateStr = startDate.toISOString().split('T')[0];
            const startTimeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
            const endTimeStr = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

            setDate(dateStr);
            setStartTime(startTimeStr);
            setEndTime(endTimeStr);
        } catch (error) {
            console.error('Error fetching reservation:', error);
            Alert.alert('Error', 'No se pudo cargar la reserva');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const calculateDuration = () => {
        if (!startTime || !endTime) return 0;
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        if (isNaN(startHour) || isNaN(endHour)) return 0;
        
        const startTotal = startHour + ((startMin || 0) / 60);
        const endTotal = endHour + ((endMin || 0) / 60);
        const diffHrs = endTotal - startTotal;
        return diffHrs > 0 ? diffHrs.toFixed(1) : 0;
    };

    const handleSave = async () => {
        if (!date || !startTime || !endTime) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        // Validate times
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        if (isNaN(startHour) || isNaN(endHour)) {
            Alert.alert('Error', 'Formato de hora incorrecto');
            return;
        }

        const startTotalMin = startHour * 60 + (startMin || 0);
        const endTotalMin = endHour * 60 + (endMin || 0);

        if (endTotalMin <= startTotalMin) {
            Alert.alert('Error', 'La hora de fin debe ser posterior a la de inicio');
            return;
        }

        setUpdating(true);

        try {
            const fechaInicio = new Date(`${date}T${startTime}:00`).toISOString();
            const fechaFin = new Date(`${date}T${endTime}:00`).toISOString();

            await updateReservation(reservationId, {
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                precio_total: reservation.precio_total || 0,
            });

            Alert.alert(
                'Éxito',
                'Reserva actualizada correctamente',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    }
                ]
            );
        } catch (error) {
            console.error('Error updating reservation:', error);
            Alert.alert('Error', error.message || 'Error al actualizar la reserva');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Header title="Editar reserva" showBack />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </View>
        );
    }

    if (!reservation) {
        return (
            <View style={styles.container}>
                <Header title="Editar reserva" showBack />
                <Text style={styles.errorText}>Reserva no encontrada</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header title="Editar reserva" showBack />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <Card style={styles.infoCard}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="business" size={24} color={theme.colors.primary} />
                    </View>
                    <View style={styles.infoDetails}>
                        <Text style={styles.infoName}>{reservation.espacio_nombre}</Text>
                        <Text style={styles.infoType}>
                            Capacidad: {reservation.capacidad} personas
                        </Text>
                        <View style={[styles.statusPill, { backgroundColor: theme.colors.status.warning + '20' }]}>
                            <Text style={[styles.statusText, { color: theme.colors.status.warning }]}>
                                Pendiente
                            </Text>
                        </View>
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
                        editable={!updating}
                    />

                    <View style={styles.timeRow}>
                        <View style={styles.timeInput}>
                            <InputField
                                label="Inicio (HH:MM)"
                                placeholder="10:00"
                                value={startTime}
                                onChangeText={setStartTime}
                                icon={<Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />}
                                editable={!updating}
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
                                editable={!updating}
                            />
                        </View>
                    </View>
                </View>

                <Card style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Resumen</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Duración total:</Text>
                        <Text style={styles.summaryValue}>{calculateDuration()} horas</Text>
                    </View>
                </Card>

                <View style={styles.buttonContainer}>
                    <Button
                        title={updating ? "Guardando..." : "Guardar cambios"}
                        onPress={handleSave}
                        disabled={updating}
                        style={styles.saveButton}
                    />
                    <Button
                        title="Cancelar"
                        variant="outline"
                        onPress={() => navigation.goBack()}
                        disabled={updating}
                    />
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        padding: theme.spacing.lg,
    },
    errorText: {
        ...theme.typography.body,
        color: theme.colors.error,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: theme.colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    infoDetails: {
        flex: 1,
    },
    infoName: {
        ...theme.typography.subheader,
        marginBottom: theme.spacing.xs,
    },
    infoType: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    statusPill: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    formSection: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        ...theme.typography.subheader,
        marginBottom: theme.spacing.md,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    timeInput: {
        flex: 1,
    },
    timeSpacer: {
        width: theme.spacing.md,
    },
    summaryCard: {
        marginBottom: theme.spacing.lg,
    },
    summaryTitle: {
        ...theme.typography.subheader,
        marginBottom: theme.spacing.md,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        ...theme.typography.body,
        color: theme.colors.text.secondary,
    },
    summaryValue: {
        ...theme.typography.subheader,
        color: theme.colors.primary,
    },
    buttonContainer: {
        gap: theme.spacing.md,
    },
    saveButton: {
        marginBottom: theme.spacing.sm,
    },
});
