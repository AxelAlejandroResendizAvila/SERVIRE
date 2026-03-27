import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Alert, ActivityIndicator, TouchableOpacity, FlatList, Modal, Image } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Card from '../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { createReservation, getSpaces } from '../services/api';
import { config } from '../config';

export default function FormularioReservas({ navigation, route }) {
    const initialSpace = route?.params?.space || null;
    const [space, setSpace] = useState(initialSpace);
    const [spaces, setSpaces] = useState([]);
    const [loadingSpaces, setLoadingSpaces] = useState(!initialSpace);
    const [showSpaceSelector, setShowSpaceSelector] = useState(!initialSpace);
    const [reason, setReason] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!initialSpace) {
            fetchSpaces();
        }
    }, []);

    const fetchSpaces = async () => {
        try {
            setLoadingSpaces(true);
            const data = await getSpaces();
            setSpaces(data || []);
        } catch (err) {
            console.error('Error fetching spaces:', err);
            Alert.alert('Error', 'No se pudieron cargar los espacios');
        } finally {
            setLoadingSpaces(false);
        }
    };

    const handleSelectSpace = (selectedSpace) => {
        setSpace(selectedSpace);
        setShowSpaceSelector(false);
    };

    const calculateDuration = () => {
        if (!startTime || !endTime) return 0;
        const [startHour] = startTime.split(':').map(Number);
        const [endHour] = endTime.split(':').map(Number);
        return Math.abs(endHour - startHour) || 0;
    };

    const handleConfirm = async () => {
        if (!date || !startTime || !endTime) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        if (!space?.id) {
            Alert.alert('Error', 'Espacio no encontrado');
            return;
        }

        setLoading(true);

        try {
            const [startHour, startMin] = startTime.split(':');
            const [endHour, endMin] = endTime.split(':');

            const fechaInicio = new Date(`${date}T${startHour}:${startMin}:00`).toISOString();
            const fechaFin = new Date(`${date}T${endHour}:${endMin}:00`).toISOString();

            const response = await createReservation({
                id_espacio: space.id,
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin,
                precio_total: 0, // Puedes calcular esto según tu lógica
            });

            if (response.reserva || response.success) {
                Alert.alert(
                    'Éxito',
                    response.message || 'Reserva creada correctamente',
                    [{ text: 'OK', onPress: () => {
                        navigation.navigate('MisReservas');
                    }}]
                );
            } else {
                Alert.alert('Error', 'No se pudo crear la reserva');
            }
        } catch (error) {
            console.error('Error creando reserva:', error);
            Alert.alert('Error', error.message || 'Error al crear la reserva');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Header title="Nueva reserva" showBack />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Selector de Espacio */}
                <TouchableOpacity onPress={() => setShowSpaceSelector(true)}>
                    <Card style={styles.spaceInfoCard}>
                        {space?.image ? (
                            <Image
                                source={{ uri: `${config.baseURL.replace('/api', '')}${space.image}` }}
                                style={styles.spaceImage}
                            />
                        ) : (
                            <View style={styles.spaceImagePlaceholder}>
                                <Ionicons name="business" size={40} color={theme.colors.primary} />
                            </View>
                        )}
                        <View style={styles.spaceDetails}>
                            <Text style={styles.spaceName}>{space?.name || 'Selecciona un espacio'}</Text>
                            <Text style={styles.spaceType}>{space?.type || 'Haz clic para elegir'}</Text>
                            <Text style={styles.spaceCapacity}>
                                📍 {space?.location || 'Ubicación no especificada'}
                            </Text>
                            <Text style={styles.spaceCapacity}>
                                👥 Capacidad: {space?.capacity || '?'} personas
                            </Text>
                            {space?.description && (
                                <Text style={styles.spaceDescription} numberOfLines={2}>
                                    {space.description}
                                </Text>
                            )}
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
                    </Card>
                </TouchableOpacity>

                {/* Modal para seleccionar espacios */}
                <Modal
                    visible={showSpaceSelector}
                    animationType="slide"
                    presentationStyle="pageSheet"
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setShowSpaceSelector(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.primary} />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Selecciona un espacio</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        {loadingSpaces ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                            </View>
                        ) : (
                            <FlatList
                                data={spaces}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity onPress={() => handleSelectSpace(item)}>
                                        <Card style={styles.spaceListItem}>
                                            {item.image ? (
                                                <Image
                                                    source={{ uri: `${config.baseURL.replace('/api', '')}${item.image}` }}
                                                    style={styles.spaceListImage}
                                                />
                                            ) : (
                                                <View style={styles.spaceListImagePlaceholder}>
                                                    <Ionicons name="business" size={32} color={theme.colors.primary} />
                                                </View>
                                            )}
                                            <View style={styles.spaceListContent}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.spaceListName}>{item.name}</Text>
                                                    <Text style={styles.spaceListType}>{item.type}</Text>
                                                    {item.location && (
                                                        <Text style={styles.spaceListLocation}>📍 {item.location}</Text>
                                                    )}
                                                    <Text style={styles.spaceListCapacity}>
                                                        👥 {item.capacity} personas
                                                    </Text>
                                                    {item.description && (
                                                        <Text style={styles.spaceListDescription} numberOfLines={1}>
                                                            {item.description}
                                                        </Text>
                                                    )}
                                                </View>
                                                <View style={[
                                                    styles.statusDot,
                                                    { backgroundColor: item.state === 'disponible' ? theme.colors.status.success : theme.colors.status.warning }
                                                ]} />
                                            </View>
                                        </Card>
                                    </TouchableOpacity>
                                )}
                                contentContainerStyle={styles.spaceListContainer}
                            />
                        )}
                    </View>
                </Modal>

                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Fecha y Hora</Text>

                    <InputField
                        label="Fecha (YYYY-MM-DD)"
                        placeholder="2025-02-15"
                        value={date}
                        onChangeText={setDate}
                        icon={<Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />}
                        editable={!loading}
                    />

                    <View style={styles.timeRow}>
                        <View style={styles.timeInput}>
                            <InputField
                                label="Inicio (HH:MM)"
                                placeholder="10:00"
                                value={startTime}
                                onChangeText={setStartTime}
                                icon={<Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />}
                                editable={!loading}
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
                                editable={!loading}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Detalles</Text>
                    <InputField
                        label="Motivo de la reserva (opcional)"
                        placeholder="¿Para qué necesitas el espacio?"
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        numberOfLines={4}
                        editable={!loading}
                    />
                </View>

                <Card style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Resumen</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Duración total:</Text>
                        <Text style={styles.summaryValue}>{calculateDuration()} horas</Text>
                    </View>
                </Card>

                <Button
                    title={loading ? "Procesando..." : "Confirmar Reserva"}
                    onPress={handleConfirm}
                    style={styles.confirmButton}
                    disabled={loading}
                />

                {loading && <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />}

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
        alignItems: 'flex-start',
        marginBottom: theme.spacing.xl,
        backgroundColor: theme.colors.surface,
        overflow: 'hidden',
    },
    spaceImage: {
        width: 120,
        height: 120,
        borderTopLeftRadius: theme.borderRadius.md,
        borderBottomLeftRadius: theme.borderRadius.md,
    },
    spaceImagePlaceholder: {
        width: 120,
        height: 120,
        borderTopLeftRadius: theme.borderRadius.md,
        borderBottomLeftRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.borderRadius.md,
    },
    spaceDetails: {
        flex: 1,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
    },
    spaceName: {
        ...theme.typography.subheader,
        fontSize: 16,
        marginBottom: theme.spacing.xs,
    },
    spaceType: {
        ...theme.typography.caption,
        marginTop: 2,
        color: theme.colors.text.secondary,
    },
    spaceCapacity: {
        ...theme.typography.caption,
        marginTop: 2,
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    spaceDescription: {
        ...theme.typography.caption,
        marginTop: theme.spacing.xs,
        fontSize: 12,
        color: theme.colors.text.secondary,
        fontStyle: 'italic',
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
    },
    loader: {
        marginTop: theme.spacing.md,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: theme.spacing.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    modalTitle: {
        ...theme.typography.subheader,
        fontSize: 18,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spaceListContainer: {
        padding: theme.spacing.lg,
    },
    spaceListItem: {
        marginBottom: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'flex-start',
        overflow: 'hidden',
    },
    spaceListImage: {
        width: 100,
        height: 100,
        borderTopLeftRadius: theme.borderRadius.md,
        borderBottomLeftRadius: theme.borderRadius.md,
    },
    spaceListImagePlaceholder: {
        width: 100,
        height: 100,
        borderTopLeftRadius: theme.borderRadius.md,
        borderBottomLeftRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    spaceListContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flex: 1,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
    },
    spaceListName: {
        ...theme.typography.subheader,
        fontSize: 16,
        marginBottom: theme.spacing.xs,
    },
    spaceListType: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    spaceListLocation: {
        ...theme.typography.caption,
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    spaceListCapacity: {
        ...theme.typography.caption,
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    spaceListDescription: {
        ...theme.typography.caption,
        fontSize: 11,
        color: theme.colors.text.secondary,
        fontStyle: 'italic',
        marginTop: theme.spacing.xs,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
});
