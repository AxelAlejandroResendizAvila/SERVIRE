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

    // Get the next upcoming reservation (first confirmed one)
    const nextReservation = reservations.find(r => r.status === 'approved');

    // Map status to display text
    const getStatusDisplay = (status) => {
        if (status === 'approved') return 'Confirmada';
        if (status === 'waitlisted') return 'En lista de espera';
        if (status === 'declined') return 'Cancelada';
        return status;
    };

    // Map status to color
    const getStatusColor = (status) => {
        if (status === 'approved') return theme.colors.primary;
        if (status === 'waitlisted') return theme.colors.warning || '#FFA500';
        if (status === 'declined') return theme.colors.error || '#FF6B6B';
        return theme.colors.text.secondary;
    };

    return (
        <View style={styles.container}>
            <Header title="Inicio" rightIcon="notifications-outline" onRightPress={() => { }} />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.greetingContainer}>
                    <Text style={styles.greetingTitle}>Hola, {userName}</Text>
                    <Text style={styles.greetingSubtitle}>¿Qué espacio necesitas hoy?</Text>
                </View>

                <Card style={styles.newReservationCard}>
                    <View style={styles.cardHeader}>
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

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                ) : nextReservation ? (
                    <>
                        <Text style={styles.sectionTitle}>Próxima reserva</Text>
                        <Card style={styles.upcomingCard}>
                            <View style={styles.upcomingHeader}>
                                <Text style={styles.spaceName}>Espacio #{nextReservation.spaceId}</Text>
                                <View style={[styles.statusPill, { backgroundColor: getStatusColor(nextReservation.status) + '20' }]}>
                                    <Text style={[styles.statusText, { color: getStatusColor(nextReservation.status) }]}>
                                        {getStatusDisplay(nextReservation.status)}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.detailsRow}>
                                <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                                <Text style={styles.detailsText}>{nextReservation.date}</Text>
                            </View>
                            <View style={styles.detailsRow}>
                                <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
                                <Text style={styles.detailsText}>{nextReservation.time}</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.detailsLink}
                                onPress={() => navigation.navigate('MisReservas')}
                            >
                                <Text style={styles.detailsLinkText}>Ver todas mis reservas</Text>
                                <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </Card>
                    </>
                ) : null}

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
    greetingContainer: {
        marginBottom: theme.spacing.lg,
    },
    greetingTitle: {
        ...theme.typography.header,
    },
    greetingSubtitle: {
        ...theme.typography.body,
        marginTop: theme.spacing.xs,
    },
    newReservationCard: {
        backgroundColor: theme.colors.surface,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.background,
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
    upcomingCard: {
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
    },
    upcomingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    spaceName: {
        ...theme.typography.subheader,
        flex: 1,
    },
    statusPill: {
        backgroundColor: theme.colors.primary + '20', // transparent primary
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
    },
    statusText: {
        color: theme.colors.primary,
        fontSize: theme.typography.caption.fontSize,
        fontWeight: 'bold',
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    detailsText: {
        ...theme.typography.body,
        marginLeft: theme.spacing.sm,
    },
    detailsLink: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
        paddingTop: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    detailsLinkText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        marginRight: 4,
    },
    quickActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quickActionItem: {
        alignItems: 'center',
        width: '30%',
    },
    quickActionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.xs,
    },
    quickActionText: {
        ...theme.typography.caption,
        textAlign: 'center',
    }
});
