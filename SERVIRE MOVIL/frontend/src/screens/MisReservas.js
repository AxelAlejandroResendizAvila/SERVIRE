import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';
import { getMyReservations, cancelReservation } from '../services/api';

export default function MisReservas({ navigation, route }) {
    const [activeTab, setActiveTab] = useState('pending');
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [canceling, setCanceling] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchReservations();
        // Refresh cuando vuelvo a este screen
        const unsubscribe = navigation.addListener('focus', () => {
            fetchReservations();
        });
        return unsubscribe;
    }, [navigation]);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getMyReservations();
            setReservations(data || []);
        } catch (err) {
            console.error('Error fetching reservations:', err);
            setError('Error al cargar tus reservas');
            Alert.alert('Error', 'No se pudieron cargar tus reservas');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id, status) => {
        // Solo permitir cancelar si está pendiente
        if (status !== 'pending') {
            Alert.alert('Error', 'Solo puedes cancelar reservas en estado pendiente');
            return;
        }

        Alert.alert(
            'Cancelar reserva',
            '¿Estás seguro de que quieres cancelar esta reserva?',
            [
                {
                    text: 'No',
                    style: 'cancel',
                },
                {
                    text: 'Sí, cancelar',
                    onPress: async () => {
                        setCanceling(id);
                        try {
                            await cancelReservation(id);
                            Alert.alert('Éxito', 'Reserva cancelada correctamente');
                            fetchReservations();
                        } catch (error) {
                            console.error('Error canceling:', error);
                            Alert.alert('Error', error.message || 'Error al cancelar la reserva');
                        } finally {
                            setCanceling(null);
                        }
                    },
                    style: 'destructive',
                }
            ]
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return theme.colors.status.success;
            case 'pending':
                return theme.colors.status.warning;
            case 'waitlisted':
                return theme.colors.status.warning;
            case 'declined':
                return theme.colors.status.error;
            default:
                return theme.colors.text.secondary;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'approved':
                return 'Confirmada';
            case 'pending':
                return 'Pendiente';
            case 'waitlisted':
                return 'En fila';
            case 'declined':
                return 'Cancelada';
            default:
                return status;
        }
    };

    const pendingReservations = reservations.filter(r => r.status === 'pending' || r.status === 'waitlisted' || r.status === 'approved');
    const pastReservations = reservations.filter(r => r.status === 'declined');

    const renderReservationsList = (list) => (
        <>
            {list.length === 0 ? (
                <Text style={styles.emptyText}>No hay reservas</Text>
            ) : (
                list.map((reservation, index) => (
                    <Card key={`${reservation.id}-${index}`} style={styles.reservationCard}>
                        <View style={styles.cardContent}>
                            <View style={styles.timeContainer}>
                                <Text style={styles.timeText}>{reservation.time.split(' - ')[0]}</Text>
                                <View style={styles.timeLine} />
                                <Text style={styles.timeText}>{reservation.time.split(' - ')[1]}</Text>
                            </View>
                            <View style={styles.detailsContainer}>
                                <Text style={styles.dateText}>{reservation.date}</Text>
                                <View style={[
                                    styles.statusPill,
                                    { borderColor: getStatusColor(reservation.status), backgroundColor: getStatusColor(reservation.status) + '15' }
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        { color: getStatusColor(reservation.status) }
                                    ]}>
                                        {getStatusLabel(reservation.status)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Botones de acción - solo si está pendiente */}
                        {reservation.status === 'pending' && (
                            <View style={styles.actionsContainer}>
                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={() => navigation.navigate('FeaturesStack', {
                                        screen: 'EditarReserva',
                                        params: { id: reservation.id }
                                    })}
                                >
                                    <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
                                    <Text style={styles.editButtonText}>Editar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => handleCancel(reservation.id, reservation.status)}
                                    disabled={canceling === reservation.id}
                                >
                                    <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                                    <Text style={styles.cancelButtonText}>
                                        {canceling === reservation.id ? 'Cancelando...' : 'Cancelar'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </Card>
                ))
            )}
        </>
    );

    return (
        <View style={styles.container}>
            <Header title="Mis reservas" />

            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                    onPress={() => setActiveTab('pending')}
                >
                    <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
                        Próximas
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'past' && styles.activeTab]}
                    onPress={() => setActiveTab('past')}
                >
                    <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
                        Anteriores
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.listContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.loadingText}>Cargando reservas...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={fetchReservations}>
                            <Text style={styles.retryText}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    renderReservationsList(activeTab === 'pending' ? pendingReservations : pastReservations)
                )}
            </ScrollView>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: theme.colors.primary,
    },
    tabText: {
        ...theme.typography.body,
        fontWeight: '500',
    },
    activeTabText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    listContainer: {
        padding: theme.spacing.lg,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xl * 2,
    },
    loadingText: {
        marginTop: theme.spacing.md,
        ...theme.typography.body,
        color: theme.colors.text.secondary,
    },
    errorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xl * 2,
    },
    errorText: {
        ...theme.typography.body,
        marginTop: theme.spacing.md,
        textAlign: 'center',
        color: theme.colors.error,
    },
    retryButton: {
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
    },
    retryText: {
        color: theme.colors.text.inverse,
        fontWeight: 'bold',
    },
    reservationCard: {
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    cardContent: {
        flexDirection: 'row',
        marginBottom: theme.spacing.md,
    },
    timeContainer: {
        width: 80,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    timeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    timeLine: {
        width: 2,
        height: 16,
        backgroundColor: theme.colors.border,
        marginVertical: 4,
    },
    detailsContainer: {
        flex: 1,
    },
    dateText: {
        ...theme.typography.body,
        fontWeight: '500',
        marginBottom: theme.spacing.sm,
    },
    statusPill: {
        alignSelf: 'flex-start',
        borderWidth: 1,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.full,
    },
    statusText: {
        fontSize: theme.typography.caption.fontSize,
        fontWeight: 'bold',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    editButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.primary + '10',
        gap: theme.spacing.xs,
    },
    editButtonText: {
        color: theme.colors.primary,
        fontWeight: '600',
        fontSize: 12,
    },
    cancelButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.error + '10',
        gap: theme.spacing.xs,
    },
    cancelButtonText: {
        color: theme.colors.error,
        fontWeight: '600',
        fontSize: 12,
    },
    emptyText: {
        ...theme.typography.body,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
        color: theme.colors.text.secondary,
    }
});
