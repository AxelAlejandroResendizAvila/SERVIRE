import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useReservations } from '../hooks/useReservations';

export default function InicioAPP({ navigation }) {
    const { user } = useAuth();
    const { reservations, loading } = useReservations();
    const userName = user?.nombre || 'Usuario';

    // Obtenemos el total de reservas para el resumen simple
    const totalReservations = reservations?.length || 0;

    return (
        <View style={styles.container}>
            <Header title="Inicio" rightIcon="notifications-outline" onRightPress={() => { }} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Saludo */}
                <View style={styles.greetingContainer}>
                    <Text style={styles.greetingTitle}>Hola, {userName}</Text>
                    <Text style={styles.greetingSubtitle}>¿Qué espacio necesitas hoy?</Text>
                </View>

                {/* Tarjeta de Nueva Reserva */}
                <Card style={styles.newReservationCard}>
                    <View style={styles.cardHeaderSimple}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="add" size={24} color={theme.colors.primary} />
                        </View>
                        <View style={styles.cardHeaderText}>
                            <Text style={styles.cardTitle}>Nueva reserva</Text>
                            <Text style={styles.cardSubtitle}>Programa tu próximo espacio</Text>
                        </View>
                    </View>
                    <Button
                        title="Crear reserva"
                        onPress={() => navigation.navigate('FormularioReservas')}
                    />
                </Card>

                {/* Sección Simplificada: Resumen de Actividad */}
                <Text style={styles.sectionTitle}>Tu actividad</Text>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                ) : (
                    <Card style={styles.summaryCard}>
                        <View style={styles.summaryContent}>
                            <View style={styles.summaryIconContainer}>
                                <Ionicons name="calendar" size={28} color={theme.colors.primary} />
                            </View>
                            <View style={styles.summaryTextContainer}>
                                <Text style={styles.summaryTitle}>Mis espacios</Text>
                                <Text style={styles.summarySubtitle}>
                                    Tuviste {totalReservations} {totalReservations === 1 ? 'reserva registrada' : 'reservas registradas'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.summaryButton}
                            onPress={() => navigation.navigate('Reservas')}
                        >
                            <Text style={styles.summaryButtonText}>Administrar</Text>
                            <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </Card>
                )}

                {/* Acciones Rápidas */}
                <Text style={styles.sectionTitle}>Acciones rápidas</Text>
                <View style={styles.quickActionsContainer}>
                    <TouchableOpacity style={styles.quickActionItem} onPress={() => navigation.navigate('Explorar')}>
                        <View style={styles.quickActionIcon}>
                            <Ionicons name="search-outline" size={24} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.quickActionText}>Explorar</Text>
                        <Text style={styles.quickActionSubText}>espacios</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.quickActionItem} onPress={() => navigation.navigate('Reservas')}>
                        <View style={styles.quickActionIcon}>
                            <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.quickActionText}>Mis</Text>
                        <Text style={styles.quickActionSubText}>reservas</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.quickActionItem} onPress={() => navigation.navigate('Cuenta')}>
                        <View style={styles.quickActionIcon}>
                            <Ionicons name="person-outline" size={24} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.quickActionText}>Mi</Text>
                        <Text style={styles.quickActionSubText}>cuenta</Text>
                    </TouchableOpacity>
                </View>

                {/* Tip/Info Card innovadora */}
                <View style={styles.tipCard}>
                    <View style={styles.tipIconContainer}>
                        <Ionicons name="bulb-outline" size={24} color="#FFF" />
                    </View>
                    <View style={styles.tipTextContainer}>
                        <Text style={styles.tipTitle}>¿Sabías qué?</Text>
                        <Text style={styles.tipBody}>Puedes reservar espacios hasta con 1 hora de anticipación. Planifica tus actividades.</Text>
                    </View>
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
        paddingBottom: theme.spacing.xl * 2,
    },
    greetingContainer: {
        marginBottom: theme.spacing.lg,
    },
    greetingTitle: {
        ...theme.typography.header,
    },
    greetingSubtitle: {
        ...theme.typography.body,
        marginTop: theme.spacing.xs,
        color: theme.colors.text.secondary,
    },
    newReservationCard: {
        backgroundColor: theme.colors.surface,
        marginBottom: theme.spacing.md,
    },
    cardHeaderSimple: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    cardHeaderText: {
        flex: 1,
    },
    cardTitle: {
        ...theme.typography.subheader,
    },
    cardSubtitle: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    sectionTitle: {
        ...theme.typography.subheader,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    loadingContainer: {
        paddingVertical: theme.spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Estilos del Resumen Simple
    summaryCard: {
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border + '60',
        backgroundColor: theme.colors.surface || '#ffffff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    summaryContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    summaryIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: theme.colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    summaryTextContainer: {
        flex: 1,
    },
    summaryTitle: {
        ...theme.typography.h3,
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    summarySubtitle: {
        ...theme.typography.body,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    summaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border + '30',
        paddingTop: theme.spacing.md,
    },
    summaryButtonText: {
        color: theme.colors.primary,
        fontWeight: '700',
        marginRight: 4,
    },
    // Acciones Rápidas
    quickActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.xl,
    },
    quickActionItem: {
        alignItems: 'center',
        width: '30%',
    },
    quickActionIcon: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: theme.colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.primary + '20',
    },
    quickActionText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    quickActionSubText: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    // Tip Card
    tipCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    tipIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    tipTextContainer: {
        flex: 1,
    },
    tipTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 2,
    },
    tipBody: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 18,
    }
});