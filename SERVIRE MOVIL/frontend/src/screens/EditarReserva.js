import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Card from '../components/Card';
import AnimatedCard from '../components/AnimatedCard';
import { Ionicons } from '@expo/vector-icons';
import { updateReservation, getReservationById } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function EditarReserva({ navigation, route }) {
    const reservationId = route?.params?.id;
    const [reservation, setReservation] = useState(null);
    const { error: showError, success: showSuccess } = useToast();
    const convertTo12hFormat = (time24) => {
        if (!time24) return '';
        try {
            const [hours, minutes] = time24.split(':').map(Number);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
        } catch (e) {
            return time24;
        }
    };

    const convertTo24hFormat = (time12) => {
        if (!time12) return '';
        try {
            const regex = /(\d{2}):(\d{2})\s(AM|PM)/i;
            const match = time12.match(regex);
            if (match) {
                let [, hours, minutes, ampm] = match;
                hours = parseInt(hours, 10);
                if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
                if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
                return `${String(hours).padStart(2, '0')}:${minutes}`;
            }
            return time12;
        } catch (e) {
            return time12;
        }
    };
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
            showError('No se pudo cargar la reserva');
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
            showError('Por favor completa todos los campos');
            return;
        }

        // Validate times
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        if (isNaN(startHour) || isNaN(endHour)) {
            showError('Formato de hora incorrecto');
            return;
        }

        const startTotalMin = startHour * 60 + (startMin || 0);
        const endTotalMin = endHour * 60 + (endMin || 0);

        if (endTotalMin <= startTotalMin) {
            showError('La hora de fin debe ser posterior a la de inicio');
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

            showSuccess('Reserva actualizada correctamente');
            setTimeout(() => navigation.goBack(), 1500);
        } catch (error) {
            console.error('Error updating reservation:', error);
            showError(error.message || 'Error al actualizar la reserva');
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

                <AnimatedCard animation="fadeUp" delay={0} duration={500}>
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
                </AnimatedCard>

                <AnimatedCard animation="fadeUp" delay={100} duration={500}>
                    <View style={styles.formSection}>\n                        <Text style={styles.sectionTitle}>Fecha y Hora</Text>

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
                                label="Inicio (HH:MM AM/PM)"
                                placeholder="02:00 PM"
                                value={convertTo12hFormat(startTime)}
                                onChangeText={(val) => setStartTime(convertTo24hFormat(val))}
                                icon={<Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />}
                                editable={!updating}
                            />
                        </View>
                        <View style={styles.timeSpacer} />
                        <View style={styles.timeInput}>
                            <InputField
                                label="Fin (HH:MM AM/PM)"
                                placeholder="04:00 PM"
                                value={convertTo12hFormat(endTime)}
                                onChangeText={(val) => setEndTime(convertTo24hFormat(val))}
                                icon={<Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />}
                                editable={!updating}
                            />
                        </View>
                    </View>
                </View>
                </AnimatedCard>

                <AnimatedCard animation="fadeUp" delay={200} duration={500}>
                    <Card style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Resumen</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Duración total:</Text>
                        <Text style={styles.summaryValue}>{calculateDuration()} horas</Text>
                    </View>
                </Card>
                </AnimatedCard>

                <AnimatedCard animation="fadeUp" delay={300} duration={500}>
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
                </AnimatedCard>

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
