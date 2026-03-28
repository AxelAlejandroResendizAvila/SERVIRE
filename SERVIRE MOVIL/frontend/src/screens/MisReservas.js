import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import Card from '../components/Card';
// Importamos Button si lo llegas a necesitar, aunque aquí usamos TouchableOpacity para más control
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
        if (status !== 'pending') {
            Alert.alert('Error', 'Solo puedes cancelar reservas en estado pendiente');
            return;
        }

        Alert.alert(
            'Cancelar reserva',
            '¿Estás seguro de que quieres cancelar esta reserva?',
            [
                { text: 'No', style: 'cancel' },
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
            case 'approved': return theme.colors.status.success;
            case 'pending': return theme.colors.status.warning;
            case 'waitlisted': return theme.colors.status.warning;
            case 'declined': return theme.colors.status.error;
            default: return theme.colors.text.secondary;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'approved': return 'Confirmada';
            case 'pending': return 'Pendiente';
            case 'waitlisted': return 'En fila';
            case 'declined': return 'Cancelada';
            default: return status;
        }
    };

    const pendingReservations = reservations.filter(r => ['pending', 'waitlisted', 'approved'].includes(r.status));
    const pastReservations = reservations.filter(r => r.status === 'declined');

    const formatLocalTime = (utcTimeString) => {
        if (!utcTimeString) return '';
        try {
            const [hours, minutes] = utcTimeString.split(':');
            const date = new Date();
            date.setUTCHours(parseInt(hours, 10));
            date.setUTCMinutes(parseInt(minutes, 10));
            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        } catch (e) {
            return utcTimeString;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        try {
            const date = new Date(dateString + 'T00:00:00');
            return date.toLocaleDateString('es-ES', options);
        } catch (e) {
            return dateString;
        }
    };

    const renderReservationsList = (list) => (
        <>
            {list.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="calendar-clear-outline" size={64} color={theme.colors.primary + '60'} />
                    </View>
                    <Text style={styles.emptyTitle}>
                        {activeTab === 'pending' ? 'No tienes próximas reservas' : 'No hay historial'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {activeTab === 'pending'
                            ? 'Cuando agendes un nuevo espacio, aparecerá aquí para que puedas administrarlo.'
                            : 'Aquí verás las reservas que han sido canceladas o ya pasaron.'}
                    </Text>
                </View>
            ) : (
                list.map((reservation, index) => (
                    <Card key={`${reservation.id}-${index}`} style={styles.reservationCard}>
                        <View style={styles.cardHeader}>
                            <View style={styles.spaceInfo}>
                                <Ionicons name="location-outline" size={18} color={theme.colors.primary} />
                                <Text style={styles.spaceText} numberOfLines={1}>{reservation.space}</Text>
                            </View>
                            <View style={[
                                styles.statusPill,
                                { borderColor: getStatusColor(reservation.status), backgroundColor: getStatusColor(reservation.status) + '15' }
                            ]}>
                                <View style={[styles.statusDot, { backgroundColor: getStatusColor(reservation.status) }]} />
                                <Text style={[styles.statusText, { color: getStatusColor(reservation.status) }]}>
                                    {getStatusLabel(reservation.status)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.cardContent}>
                            {/* Columna de Tiempo */}
                            <View style={styles.timeSection}>
                                <View style={styles.timeContainer}>
                                    <View style={styles.timeBlock}>
                                        <Text style={styles.timeLabel}>Inicio</Text>
                                        <Text style={styles.timeValue}>{formatLocalTime(reservation.time.split(' - ')[0])}</Text>
                                    </View>
                                    <View style={styles.timeDivider}>
                                        <Ionicons name="arrow-forward-outline" size={16} color={theme.colors.primary} />
                                    </View>
                                    <View style={styles.timeBlock}>
                                        <Text style={styles.timeLabel}>Fin</Text>
                                        <Text style={styles.timeValue}>{formatLocalTime(reservation.time.split(' - ')[1])}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Detalles de la reserva */}
                            <View style={styles.detailsContainer}>
                                <View style={styles.dateHeader}>
                                    <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                                    <Text style={styles.dateText}>{formatDate(reservation.date)}</Text>
                                </View>

                                {reservation.createdAt && (
                                    <View style={styles.infoRow}>
                                        <Ionicons name="time-outline" size={14} color={theme.colors.text.secondary} />
                                        <Text style={styles.infoText}>Solicitada: {reservation.createdAt}</Text>
                                    </View>
                                )}

                                {/* Motivo de la reserva (si existe) */}
                                {reservation.motivo && (
                                    <View style={styles.bookingReasonContainer}>
                                        <Ionicons name="bookmark-outline" size={14} color={theme.colors.text.secondary} />
                                        <Text style={styles.bookingReasonText} numberOfLines={3}>
                                            <Text style={{fontWeight: '600'}}>Motivo: </Text>{reservation.motivo}
                                        </Text>
                                    </View>
                                )}

                                {/* Motivo de rechazo (si fue cancelada) */}
                                {reservation.status === 'declined' && reservation.motivo_rechazo && (
                                    <View style={styles.reasonContainer}>
                                        <Ionicons name="warning-outline" size={16} color={theme.colors.error} />
                                        <Text style={styles.reasonText} numberOfLines={3}>
                                            {reservation.motivo_rechazo}
                                        </Text>
                                    </View>
                                )}
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
                                    {canceling === reservation.id ? (
                                        <ActivityIndicator size="small" color={theme.colors.error} />
                                    ) : (
                                        <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                                    )}
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

            {/* Pestañas estilo Segmented Control */}
            <View style={styles.tabsWrapper}>
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
                            Historial
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={[styles.listContainer, reservations.length === 0 && { flexGrow: 1 }]}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.loadingText}>Cargando tus reservas...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="cloud-offline-outline" size={60} color={theme.colors.error + '80'} />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={fetchReservations}>
                            <Ionicons name="refresh-outline" size={18} color={theme.colors.text.inverse || '#fff'} />
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
    tabsWrapper: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border + '50',
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.border + '30', // Fondo gris claro
        borderRadius: theme.borderRadius.lg,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: theme.spacing.sm + 2,
        alignItems: 'center',
        borderRadius: theme.borderRadius.md,
    },
    activeTab: {
        backgroundColor: theme.colors.surface || '#fff', // Fondo blanco para la pestaña activa
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        ...theme.typography.body,
        fontWeight: '500',
        color: theme.colors.text.secondary,
    },
    activeTabText: {
        color: theme.colors.text.primary,
        fontWeight: 'bold',
    },
    listContainer: {
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xl * 2,
    },
    // Empty State Styles
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xl,
        marginTop: theme.spacing.xl * 2,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: theme.colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
        ...theme.typography.h3,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    emptySubtitle: {
        ...theme.typography.body,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    // Loading & Error
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.xl * 2,
    },
    loadingText: {
        marginTop: theme.spacing.md,
        ...theme.typography.body,
        color: theme.colors.text.secondary,
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.xl * 2,
    },
    errorText: {
        ...theme.typography.body,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.lg,
        textAlign: 'center',
        color: theme.colors.text.secondary,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.full,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    retryText: {
        color: theme.colors.text.inverse || '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Cards
    reservationCard: {
        padding: theme.spacing.md,
        marginBottom: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border + '60', // Borde un poco más visible
        backgroundColor: theme.colors.surface || '#ffffff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border + '30',
    },
    spaceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        flex: 1,
        paddingRight: theme.spacing.sm,
    },
    spaceText: {
        ...theme.typography.h3,
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        flexShrink: 1,
    },
    cardContent: {
        flexDirection: 'column',
        gap: theme.spacing.md,
    },
    timeSection: {
        backgroundColor: theme.colors.primary + '08',
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.primary + '15',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
    },
    timeBlock: {
        alignItems: 'center',
    },
    timeLabel: {
        fontSize: 11,
        color: theme.colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
        fontWeight: '600',
    },
    timeValue: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.primary,
    },
    timeDivider: {
        paddingHorizontal: theme.spacing.sm,
    },
    detailsContainer: {
        flex: 1,
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    dateText: {
        ...theme.typography.body,
        fontWeight: '600',
        color: theme.colors.text.primary,
        textTransform: 'capitalize',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
        gap: theme.spacing.sm,
    },
    infoText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    statusPill: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
        marginTop: 4,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    bookingReasonContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border + '40',
        gap: 6,
    },
    bookingReasonText: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    reasonContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: theme.spacing.md,
        backgroundColor: theme.colors.error + '10',
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
        gap: 6,
    },
    reasonText: {
        fontSize: 13,
        color: theme.colors.error,
        flex: 1,
        lineHeight: 18,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        paddingTop: theme.spacing.md,
        marginTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border + '50',
    },
    editButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.sm + 2,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.primary + '10',
        gap: theme.spacing.xs,
    },
    editButtonText: {
        color: theme.colors.primary,
        fontWeight: '700',
        fontSize: 14,
    },
    cancelButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.sm + 2,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.error + '10',
        gap: theme.spacing.xs,
    },
    cancelButtonText: {
        color: theme.colors.error,
        fontWeight: '700',
        fontSize: 14,
    },
});