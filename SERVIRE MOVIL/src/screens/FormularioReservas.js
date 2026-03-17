import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Card from '../components/Card';
import { Ionicons } from '@expo/vector-icons';

export default function FormularioReservas({ navigation }) {
    const [reason, setReason] = useState('');

    // In a real app we'd use a DateTimePicker for these
    const [date, setDate] = useState('2025-02-15');
    const [startTime, setStartTime] = useState('10:00');
    const [endTime, setEndTime] = useState('12:00');

    const handleConfirm = () => {
        // Navigate home or to success screen
        navigation.popToTop();
        navigation.navigate('MisReservas');
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
                        <Text style={styles.spaceName}>Laboratorio de Física</Text>
                        <Text style={styles.spaceLocation}>Edificio A, Piso 2</Text>
                    </View>
                </Card>

                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Fecha y Hora</Text>

                    <InputField
                        label="Fecha"
                        value={date}
                        onChangeText={setDate}
                        icon={<Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />}
                    />

                    <View style={styles.timeRow}>
                        <View style={styles.timeInput}>
                            <InputField
                                label="Inicio"
                                value={startTime}
                                onChangeText={setStartTime}
                                icon={<Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />}
                            />
                        </View>
                        <View style={styles.timeSpacer} />
                        <View style={styles.timeInput}>
                            <InputField
                                label="Fin"
                                value={endTime}
                                onChangeText={setEndTime}
                                icon={<Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Detalles</Text>
                    <InputField
                        label="Motivo de la reserva"
                        placeholder="¿Para qué necesitas el espacio?"
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        numberOfLines={4}
                    />
                </View>

                <Card style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Resumen</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Duración total:</Text>
                        <Text style={styles.summaryValue}>2 horas</Text>
                    </View>
                </Card>

                <Button
                    title="Confirmar Reserva"
                    onPress={handleConfirm}
                    style={styles.confirmButton}
                />

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
    spaceLocation: {
        ...theme.typography.caption,
        marginTop: 2,
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
    }
});
