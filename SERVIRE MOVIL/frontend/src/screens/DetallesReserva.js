import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import Button from '../components/Button';
import Card from '../components/Card';
import { Ionicons } from '@expo/vector-icons';

export default function DetallesReserva({ navigation }) {

    const handleCancel = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <Header title="Detalles de Reserva" showBack rightIcon="pencil-outline" onRightPress={() => { }} />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.statusHeader}>
                    <View style={styles.statusPill}>
                        <Text style={styles.statusText}>Confirmada</Text>
                    </View>
                    <Text style={styles.bookingId}>ID: #RES-89241</Text>
                </View>

                <Card style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="business-outline" size={20} color={theme.colors.primary} />
                        </View>
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Espacio</Text>
                            <Text style={styles.infoValue}>Laboratorio de Física</Text>
                            <Text style={styles.infoSubValue}>Edificio A, Piso 2</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                        </View>
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Fecha y Hora</Text>
                            <Text style={styles.infoValue}>Lunes, 3 de Febrero</Text>
                            <Text style={styles.infoSubValue}>10:00 AM - 12:00 PM</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
                        </View>
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Reservado por</Text>
                            <Text style={styles.infoValue}>Juan Pérez</Text>
                        </View>
                    </View>
                </Card>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Motivo de la reserva</Text>
                    <Card style={styles.reasonCard}>
                        <Text style={styles.reasonText}>Práctica de laboratorio correspondiente al módulo de electromagnetismo para estudiantes de segundo semestre.</Text>
                    </Card>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Reglas del espacio</Text>
                    <View style={styles.ruleItem}>
                        <Ionicons name="alert-circle" size={16} color={theme.colors.primary} />
                        <Text style={styles.ruleText}>No ingresar alimentos ni bebidas.</Text>
                    </View>
                    <View style={styles.ruleItem}>
                        <Ionicons name="alert-circle" size={16} color={theme.colors.primary} />
                        <Text style={styles.ruleText}>Dejar los equipos apagados al salir.</Text>
                    </View>
                    <View style={styles.ruleItem}>
                        <Ionicons name="alert-circle" size={16} color={theme.colors.primary} />
                        <Text style={styles.ruleText}>Uso obligatorio de bata blanca.</Text>
                    </View>
                </View>

                <View style={styles.actionsContainer}>
                    <Button
                        title="Cancelar Reserva"
                        variant="dangerOutline"
                        onPress={handleCancel}
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
    scrollContent: {
        padding: theme.spacing.lg,
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    statusPill: {
        backgroundColor: theme.colors.primary + '20',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.full,
    },
    statusText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    bookingId: {
        ...theme.typography.caption,
    },
    infoCard: {
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        ...theme.typography.caption,
        marginBottom: 2,
    },
    infoValue: {
        ...theme.typography.subheader,
        fontSize: 16,
    },
    infoSubValue: {
        ...theme.typography.body,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.md,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        ...theme.typography.subheader,
        marginBottom: theme.spacing.md,
    },
    reasonCard: {
        backgroundColor: theme.colors.surface,
        elevation: 0,
        shadowOpacity: 0,
    },
    reasonText: {
        ...theme.typography.body,
        lineHeight: 22,
    },
    ruleItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.sm,
    },
    ruleText: {
        ...theme.typography.body,
        marginLeft: theme.spacing.sm,
        flex: 1,
    },
    actionsContainer: {
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.xl,
    }
});
