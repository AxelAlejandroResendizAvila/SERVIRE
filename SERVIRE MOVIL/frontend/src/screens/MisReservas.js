import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';
import { useBadge } from '../context/BadgeContext';
import { getMyReservations, cancelReservation } from '../services/api';
const isReservationPast = (date, time) => {
    if (!date || !time) return false;
    try {
        const timeParts = time.split(' - ');
        if (timeParts.length < 2) return false;
        const endTimeStr = timeParts[1];
        const [endHrs, endMins] = endTimeStr.split(':');
        const [year, month, day] = date.split('-');
        
        const endMs = Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), parseInt(endHrs, 10), parseInt(endMins, 10));
        return new Date().getTime() >= endMs;
    } catch (e) {
        return false;
    }
};

const CountdownTimer = ({ date, time }) => {
    const [status, setStatus] = useState('');
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const updateTimer = () => {
            if (!date || !time) return;
            
            try {
                const [startTimeStr, endTimeStr] = time.split(' - ');
                const [startHrs, startMins] = startTimeStr.split(':');
                const [endHrs, endMins] = endTimeStr.split(':');
                const [year, month, day] = date.split('-');

                const startMs = Date.UTC(
                    parseInt(year, 10), 
                    parseInt(month, 10) - 1, 
                    parseInt(day, 10), 
                    parseInt(startHrs, 10), 
                    parseInt(startMins, 10)
                );

                const endMs = Date.UTC(
                    parseInt(year, 10), 
                    parseInt(month, 10) - 1, 
                    parseInt(day, 10), 
                    parseInt(endHrs, 10), 
                    parseInt(endMins, 10)
                );

                const now = new Date().getTime();

                if (now < startMs) {
                    setStatus('pending');
                    const distance = startMs - now;
                    const d = Math.floor(distance / (1000 * 60 * 60 * 24));
                    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((distance % (1000 * 60)) / 1000);

                    let timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                    if (d > 0) {
                        timeStr = `${d}d ${timeStr}`;
                    }

                    setTimeLeft(`Falta ${timeStr} para que empiece tu turno`);
                    return;
                }

                if (now >= startMs && now < endMs) {
                    setStatus('active');
                    const distance = endMs - now;
                    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((distance % (1000 * 60)) / 1000);
                    
                    setTimeLeft(`Te falta ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} para terminar`);
                    return;
                }

                setStatus('finished');
            } catch (error) {
                console.error('Error calculando tiempo restante:', error);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [date, time]);

    if (!status || status === 'finished') return null;

    return (
        <View style={styles.countdownContainer}>
            <Ionicons 
                name={status === 'active' ? "time" : "hourglass-outline"} 
                size={14} 
                color={status === 'active' ? theme.colors.status.success : theme.colors.primary} 
            />
            <Text style={[
                styles.countdownText,
                status === 'active' ? { color: theme.colors.status.success } : { color: theme.colors.primary }
            ]}>
                {timeLeft}
            </Text>
        </View>
    );
};

export default function MisReservas({ navigation, route }) {
    const [activeTab, setActiveTab] = useState('pending');
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [canceling, setCanceling] = useState(null);
    const [error, setError] = useState('');
    const { clearBadge } = useBadge();

    useEffect(() => {
        fetchReservations();
        
        // Auto-refresh cada 30 segundos
        const autoRefreshInterval = setInterval(() => {
            fetchReservations();
        }, 30 * 1000);

        return () => {
            clearInterval(autoRefreshInterval);
        };
    }, []);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getMyReservations();
            setReservations(data || []);
            
            // Verificar si hay reservas con cambios (approved/declined)
            if (data && data.length > 0) {
                const hasChanges = data.some(res => res.status === 'approved' || res.status === 'declined');
                if (hasChanges) {
                    await AsyncStorage.setItem('reservationChanges', 'true');
                }
            }
        } catch (err) {
            console.error('Error fetching reservations:', err);
            setError(err.message || 'Hubo un problema al cargar tus reservas. Por favor, intenta de nuevo.');
            setReservations([]);
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

    const handleDeleteHistory = (id) => {
        Alert.alert(
            'Eliminar del historial',
            '¿Seguro que quieres eliminar este registro de tu historial?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    onPress: async () => {
                        setCanceling(id);
                        try {
                            await cancelReservation(id);
                            Alert.alert('Éxito', 'Reserva eliminada del historial');
                            fetchReservations();
                        } catch (error) {
                            Alert.alert('Error', error.message || 'Error al eliminar la reserva');
                        } finally {
                            setCanceling(null);
                        }
                    },
                    style: 'destructive',
                }
            ]
        );
    };

    const getStatusColor = (reservation) => {
        const isPast = isReservationPast(reservation.date, reservation.time);
        
        // Reservas terminadas = gris (independiente si es completed o approved + past)
        if (reservation.status === 'completed') return theme.colors.text.secondary;
        if (isPast && reservation.status === 'approved') return theme.colors.text.secondary;
        
        // Si está rechazada, rojo
        if (reservation.status === 'declined') return theme.colors.status.error;
        
        // Si pasó su tiempo pero es pending/waitlisted = gris (expirada)
        if (isPast) return theme.colors.text.secondary;

        // Estados activos normales
        if (reservation.status === 'approved') return theme.colors.status.success; // Verde = confirmada activa
        if (reservation.status === 'pending' || reservation.status === 'waitlisted') return theme.colors.status.warning; // Amarillo = pendiente/fila
        
        return theme.colors.text.secondary; // Default
    };

    const getStatusLabel = (reservation) => {
        const isPast = isReservationPast(reservation.date, reservation.time);
        
        // Si el backend dice que está 'completed', siempre mostrar 'Terminada'
        if (reservation.status === 'completed') return 'Terminada';
        
        // Si pasó su tiempo pero el backend aún dice 'approved', también es terminada
        if (reservation.status === 'approved' && isPast) return 'Terminada';
        
        // Si pasó su tiempo pero el backend aún dice 'pending'
        if (reservation.status === 'pending' && isPast) return 'Expirada';
        if (reservation.status === 'waitlisted' && isPast) return 'Expirada';
        
        // Estados normales
        switch (reservation.status) {
            case 'approved': return 'Confirmada';
            case 'pending': return 'Pendiente';
            case 'waitlisted': return 'En fila';
            case 'declined': return 'Cancelada';
            default: return reservation.status;
        }
    };

    const pendingReservations = reservations.filter(r => {
        // Nunca mostrar completed/declined en activas
        if (r.status === 'completed' || r.status === 'declined') return false;
        
        // Excluir reservas que ya pasaron
        if (isReservationPast(r.date, r.time)) return false;
        
        // Mostrar pending, waitlisted, approved que aún no pasan
        return ['pending', 'waitlisted', 'approved'].includes(r.status);
    });
    
    const pastReservations = reservations.filter(r => {
        // Mostrar completed y declined siempre
        if (r.status === 'completed' || r.status === 'declined') return true;
        
        // Mostrar approved/pending/waitlisted que ya pasaron (terminadas/expiradas)
        if (isReservationPast(r.date, r.time)) return true;
        
        return false;
    });

    const formatLocalTime = (utcTimeString) => {
        if (!utcTimeString) return '';
        try {
            const [hours, minutes] = utcTimeString.split(':');
            const date = new Date();
            date.setUTCHours(parseInt(hours, 10));
            date.setUTCMinutes(parseInt(minutes, 10));
            
            // Convertir a formato 12 horas con AM/PM
            let hour = date.getHours();
            const minute = date.getMinutes().toString().padStart(2, '0');
            const ampm = hour >= 12 ? 'PM' : 'AM';
            hour = hour % 12;
            hour = hour ? hour : 12; // Las 0 horas se muestran como 12
            
            return `${hour.toString().padStart(2, '0')}:${minute} ${ampm}`;
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
                        {/* Cabecera de la Tarjeta */}
                        <View style={styles.cardHeader}>
                            <View style={styles.spaceInfo}>
                                <Ionicons name="location-outline" size={18} color={theme.colors.primary} />
                                <View style={styles.spaceTextContainer}>
                                    <Text style={styles.spaceText} numberOfLines={1}>{reservation.spaceName}</Text>
                                    {reservation.buildingName && (
                                        <Text style={styles.buildingText} numberOfLines={1}>
                                            <Ionicons name="business-outline" size={12} color={theme.colors.text.secondary} /> {reservation.buildingName}
                                        </Text>
                                    )}
                                </View>
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

                                {reservation.status === 'approved' && !isReservationPast(reservation.date, reservation.time) && (
                                    <CountdownTimer date={reservation.date} time={reservation.time} />
                                )}
                            </View>

                            {/* Detalles de la reserva */}
                            <View style={styles.detailsContainer}>
                                {/* Contenedor que alinea Fecha a la izquierda y Píldora a la derecha */}
                                <View style={styles.dateAndStatusContainer}>
                                    <View style={styles.dateHeader}>
                                        <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                                        <Text style={styles.dateText}>{formatDate(reservation.date)}</Text>
                                    </View>

                                    <View style={[
                                        styles.statusPill,
                                        { borderColor: getStatusColor(reservation), backgroundColor: getStatusColor(reservation) + '15' }
                                    ]}>
                                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(reservation) }]} />
                                        <Text style={[styles.statusText, { color: getStatusColor(reservation) }]}>
                                            {getStatusLabel(reservation)}
                                        </Text>
                                    </View>
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
                                            <Text style={{ fontWeight: '600' }}>Motivo: </Text>{reservation.motivo}
                                        </Text>
                                    </View>
                                )}

                                {/* Motivo de rechazo (si fue cancelada) */}
                                {reservation.status === 'declined' && reservation.motivo_rechazo && (
                                    <View style={styles.reasonContainer}>
                                        <Ionicons name="information-circle-outline" size={16} color={theme.colors.error} />
                                        <Text style={styles.reasonText} numberOfLines={3}>
                                            <Text style={{ fontWeight: '600' }}>Motivo rechazo: </Text>{reservation.motivo_rechazo}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Botones de acción - solo si está pendiente */}
                        {reservation.status === 'pending' && !isReservationPast(reservation.date, reservation.time) && (
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

                        {/* Botones de acción - Historial */}
                        {(reservation.status === 'declined' || isReservationPast(reservation.date, reservation.time)) && (
                            <View style={styles.actionsContainer}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => handleDeleteHistory(reservation.id)}
                                    disabled={canceling === reservation.id}
                                >
                                    {canceling === reservation.id ? (
                                        <ActivityIndicator size="small" color={theme.colors.error} />
                                    ) : (
                                        <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                                    )}
                                    <Text style={styles.cancelButtonText}>
                                        {canceling === reservation.id ? 'Eliminando...' : 'Eliminar del historial'}
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
        backgroundColor: theme.colors.border + '30',
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
        backgroundColor: theme.colors.surface || '#fff',
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
    reservationCard: {
        padding: theme.spacing.md,
        marginBottom: theme.spacing.lg,
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
    },
    spaceTextContainer: {
        flex: 1,
        flexDirection: 'column',
    },
    spaceText: {
        ...theme.typography.h3,
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        flexShrink: 1,
    },
    buildingText: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    cardContent: {
        flexDirection: 'column',
        gap: theme.spacing.md,
    },
    timeSection: {
        backgroundColor: theme.colors.primary + '08',
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.primary + '15',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
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
    countdownContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.sm,
        paddingTop: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.primary + '20',
        gap: theme.spacing.xs,
    },
    countdownText: {
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    detailsContainer: {
        flex: 1,
    },
    dateAndStatusContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.sm,
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        flex: 1,
    },
    dateText: {
        ...theme.typography.body,
        fontWeight: '600',
        color: theme.colors.text.primary,
        textTransform: 'capitalize',
        flexShrink: 1,
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
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
        gap: 6,
        flexShrink: 0,
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
        marginTop: theme.spacing.sm,
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
        marginTop: theme.spacing.sm,
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
        marginTop: theme.spacing.sm,
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