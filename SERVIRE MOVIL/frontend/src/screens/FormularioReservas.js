import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Alert, ActivityIndicator, TouchableOpacity, FlatList, Modal, Image, KeyboardAvoidingView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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

    // Estados para Fechas y Horas (Usamos objetos Date para el Picker)
    const [date, setDate] = useState(new Date());
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date(new Date().setHours(new Date().getHours() + 1)));

    // Estados para mostrar/ocultar los calendarios
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const [loading, setLoading] = useState(false);

    // Formateadores para mostrar en los inputs
    const formattedDate = date.toISOString().split('T')[0];
    const formatTime = (d) => `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

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
        const diffMs = endTime.getTime() - startTime.getTime();
        const diffHrs = diffMs / (1000 * 60 * 60);
        return diffHrs > 0 ? diffHrs.toFixed(1) : 0;
    };

    const handleConfirm = async () => {
        // Asigno las horas elegidas a variables en español y más sencillas de leer
        const horaInicio = startTime;
        const horaFin = endTime;

        // Agregué esta validación para asegurarme de que la hora en la que termina la reserva no sea antes ni igual a cuando empieza
        if (horaFin <= horaInicio) {
            Alert.alert('Error', 'La hora de fin debe ser después de la hora de inicio.');
            return;
        }

        // Saco las horas y minutos exactos para comparar fácilmente el horario de la uni
        const horaDeInicio = horaInicio.getHours();
        const minutosDeInicio = horaInicio.getMinutes();
        const horaDeTermino = horaFin.getHours();
        const minutosDeTermino = horaFin.getMinutes();

        // Agregué esto para comprobar si la hora de inicio respeta el horario de la universidad (de 7:00 am a 8:40 pm)
        const inicioEsValido = horaDeInicio >= 7 && (horaDeInicio < 20 || (horaDeInicio === 20 && minutosDeInicio <= 40));

        // Y aquí hago exactamente la misma comprobación pero para la hora de cierre
        const finEsValido = horaDeTermino >= 7 && (horaDeTermino < 20 || (horaDeTermino === 20 && minutosDeTermino <= 40));

        // Si veo que cualquiera de las dos horas está fuera del horario establecido, detengo todo y lanzo una advertencia
        if (!inicioEsValido || !finEsValido) {
            Alert.alert('Horario no válido', 'Las reservas solo pueden ser entre las 07:00 am y las 20:40 pm.');
            return;
        }

        if (!space?.id) {
            Alert.alert('Error', 'Espacio no encontrado');
            return;
        }

        setLoading(true);

        try {
            // Construimos las fechas ISO combinando la fecha seleccionada y las horas seleccionadas
            const fechaInicio = new Date(date);
            fechaInicio.setHours(startTime.getHours(), startTime.getMinutes(), 0);

            const fechaFin = new Date(date);
            fechaFin.setHours(endTime.getHours(), endTime.getMinutes(), 0);

            const response = await createReservation({
                id_espacio: space.id,
                fecha_inicio: fechaInicio.toISOString(),
                fecha_fin: fechaFin.toISOString(),
                precio_total: 0,
            });

            if (response.reserva || response.success) {
                Alert.alert(
                    'Éxito',
                    response.message || 'Reserva creada correctamente',
                    [{ text: 'OK', onPress: () => {
                        navigation.navigate('HomeTabs', { screen: 'Reservas' });
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
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Header title="Nueva reserva" showBack />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >

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
                            <Text style={styles.modalTitle}>Información del espacio</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        {loadingSpaces ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                            </View>
                        ) : (
                            <FlatList
                                data={spaces.filter(s => s.id !== space?.id)}
                                ListHeaderComponent={() => (
                                    <View>
                                        {space && (
                                            <View style={styles.selectedSpaceDetail}>
                                                {space.image ? (
                                                    <Image
                                                        source={{ uri: `${config.baseURL.replace('/api', '')}${space.image}` }}
                                                        style={styles.detailImage}
                                                    />
                                                ) : (
                                                    <View style={styles.detailImagePlaceholder}>
                                                        <Ionicons name="business" size={60} color={theme.colors.primary} />
                                                    </View>
                                                )}
                                                <Text style={styles.detailName}>{space.name}</Text>
                                                <Text style={styles.detailType}>{space.type}</Text>

                                                <View style={styles.detailInfoRow}>
                                                    <Ionicons name="location-outline" size={16} color={theme.colors.text.secondary} />
                                                    <Text style={styles.detailInfoText}>{space.location || 'Ubicación no especificada'}</Text>
                                                </View>
                                                <View style={styles.detailInfoRow}>
                                                    <Ionicons name="people-outline" size={16} color={theme.colors.text.secondary} />
                                                    <Text style={styles.detailInfoText}>Capacidad: {space.capacity || '?'} personas</Text>
                                                </View>
                                                <View style={styles.detailInfoRow}>
                                                    <Ionicons name="information-circle-outline" size={16} color={theme.colors.text.secondary} />
                                                    <Text style={styles.detailInfoText}>Estado: {space.state}</Text>
                                                </View>
                                                {space.description && (
                                                    <Text style={styles.detailDescription}>{space.description}</Text>
                                                )}
                                            </View>
                                        )}
                                        <Text style={styles.submenuTitle}>
                                            {space ? "Otros espacios disponibles" : "Todos los espacios disponibles"}
                                        </Text>
                                    </View>
                                )}
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

                    {/* Selector de Fecha */}
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} disabled={loading}>
                        <View pointerEvents="none">
                            <InputField
                                label="Fecha"
                                value={formattedDate}
                                icon={<Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />}
                                editable={false}
                            />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.timeRow}>
                        {/* Selector de Hora Inicio */}
                        <TouchableOpacity style={styles.timeInput} onPress={() => setShowStartPicker(true)} disabled={loading}>
                            <View pointerEvents="none">
                                <InputField
                                    label="Inicio"
                                    value={formatTime(startTime)}
                                    icon={<Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />}
                                    editable={false}
                                />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.timeSpacer} />

                        {/* Selector de Hora Fin */}
                        <TouchableOpacity style={styles.timeInput} onPress={() => setShowEndPicker(true)} disabled={loading}>
                            <View pointerEvents="none">
                                <InputField
                                    label="Fin"
                                    value={formatTime(endTime)}
                                    icon={<Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />}
                                    editable={false}
                                />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Pickers Nativos */}
                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(Platform.OS === 'ios');
                            if (selectedDate) setDate(selectedDate);
                        }}
                    />
                )}
                {showStartPicker && (
                    <DateTimePicker
                        value={startTime}
                        mode="time"
                        is24Hour={true}
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowStartPicker(Platform.OS === 'ios');
                            if (selectedDate) setStartTime(selectedDate);
                        }}
                    />
                )}
                {showEndPicker && (
                    <DateTimePicker
                        value={endTime}
                        mode="time"
                        is24Hour={true}
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowEndPicker(Platform.OS === 'ios');
                            if (selectedDate) setEndTime(selectedDate);
                        }}
                    />
                )}

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

        </KeyboardAvoidingView>
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
    selectedSpaceDetail: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    detailImage: {
        width: '100%',
        height: 200,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.md,
    },
    detailImagePlaceholder: {
        width: '100%',
        height: 200,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.md,
    },
    detailName: {
        ...theme.typography.header,
        fontSize: 22,
        marginBottom: theme.spacing.xs,
        textAlign: 'center',
    },
    detailType: {
        ...theme.typography.subheader,
        color: theme.colors.primary,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    detailInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
        width: '100%',
    },
    detailInfoText: {
        ...theme.typography.body,
        marginLeft: theme.spacing.sm,
        color: theme.colors.text.secondary,
    },
    detailDescription: {
        ...theme.typography.body,
        marginTop: theme.spacing.md,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    submenuTitle: {
        ...theme.typography.subheader,
        fontSize: 18,
        color: theme.colors.secondary,
        marginBottom: theme.spacing.md,
        marginTop: theme.spacing.sm,
    },
});
