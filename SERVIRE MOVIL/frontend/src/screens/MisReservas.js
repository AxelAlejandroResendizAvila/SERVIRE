import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import Card from '../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { getMyReservations } from '../services/api';

export default function MisReservas({ navigation, route }) {
    const [activeTab, setActiveTab] = useState('pending');
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return theme.colors.status.success;
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
            case 'waitlisted':
                return 'En fila';
            case 'declined':
                return 'Cancelada';
            default:
                return status;
        }
    };

    const pendingReservations = reservations.filter(r => r.status === 'waitlisted' || r.status === 'approved');
    const pastReservations = reservations.filter(r => r.status !== 'waitlisted' && r.status !== 'approved');

    const renderReservationsList = (list) => (
        <>
            {list.length === 0 ? (
                <Text style={styles.emptyText}>No hay reservas</Text>
            ) : (
                list.map((reservation, index) => (
                    <TouchableOpacity
                        key={`${reservation.id}-${index}`}
                        onPress={() => navigation.navigate('FeaturesStack', {
                            screen: 'DetallesReserva',
                            params: { reservation }
                        })}
                    >
                        <Card style={styles.reservationCard}>
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
                                {reservation.waitlistPosition && (
                                    <Text style={styles.waitlistText}>
                                        Posición: {reservation.waitlistPosition}
                                    </Text>
                                )}
                            </View>
                        </Card>
                    </TouchableOpacity>
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
        flexDirection: 'row',
        padding: 0,
        marginBottom: theme.spacing.md,
    },
    timeContainer: {
        width: 80,
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: theme.borderRadius.lg,
        borderBottomLeftRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeText: {
        fontSize: 14,
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
        padding: theme.spacing.md,
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
        marginBottom: theme.spacing.sm,
    },
    statusText: {
        fontSize: theme.typography.caption.fontSize,
        fontWeight: 'bold',
    },
    waitlistText: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
    },
    emptyText: {
        ...theme.typography.body,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
        color: theme.colors.text.secondary,
    }
});
