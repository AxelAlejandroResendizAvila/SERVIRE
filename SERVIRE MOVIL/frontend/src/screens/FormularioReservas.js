import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Alert, ActivityIndicator, TouchableOpacity, FlatList, Modal, Image, KeyboardAvoidingView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Card from '../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { createReservation, getSpaces, getSpaceById } from '../services/api';
import { config } from '../config';

export default function FormularioReservas({ navigation, route }) {
    const initialSpace = route?.params?.space || null;
    const [space, setSpace] = useState(initialSpace);
    const [spaceGallery, setSpaceGallery] = useState([]);
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
    const formatTime = (d) => {
        let hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; 
        return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    };

    useEffect(() => {
        if (!initialSpace) {
            fetchSpaces();
        }
    }, []);

    // Cargar galería cuando space cambia (sea por initialSpace o por selección manual)
    useEffect(() => {
        if (space && space.id) {
            loadSpaceGallery(space.id);
        }
    }, [space?.id]);

    const loadSpaceGallery = async (spaceId) => {
        try {
            const details = await getSpaceById(spaceId);
            if (details && details.gallery) {
                setSpaceGallery(details.gallery);
            }
        } catch (err) {
            console.error('Error fetching space details:', err);
        }
    };

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
        // La galería se cargará automáticamente en el useEffect
    };

    const calculateDuration = () => {
        const startTotalHours = startTime.getHours() + (startTime.getMinutes() / 60);
        const endTotalHours = endTime.getHours() + (endTime.getMinutes() / 60);
        const diffHrs = endTotalHours - startTotalHours;
        return diffHrs > 0 ? diffHrs.toFixed(1) : 0;
    };

    const handleConfirm = async () => {
        const horaDeInicio = startTime.getHours();
        const minutosDeInicio = startTime.getMinutes();
        const horaDeTermino = endTime.getHours();
        const minutosDeTermino = endTime.getMinutes();

        // Validación: verificar que la fecha no sea hoy con una hora en el pasado
        const today = new Date();
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            Alert.alert('Error', 'No puedes reservar en fechas pasadas');
            return;
        }

        // Si es hoy, verificar que la hora de inicio no sea en el pasado
        if (selectedDate.getTime() === today.getTime()) {
            const nowDateObj = new Date();
            const selectedStartTime = new Date(date);
            selectedStartTime.setHours(horaDeInicio, minutosDeInicio, 0);
            
            if (selectedStartTime < nowDateObj) {
                Alert.alert('Error', 'No puedes reservar en horas que ya pasaron');
                return;
            }
        }

        const inicioTotalMinutos = horaDeInicio * 60 + minutosDeInicio;
        const finTotalMinutos = horaDeTermino * 60 + minutosDeTermino;

        if (finTotalMinutos <= inicioTotalMinutos) {
            Alert.alert('Error', 'La hora de fin debe ser después de la hora de inicio.');
            return;
        }

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
                        navigation.replace('MainTabs', { screen: 'Reservas' });
                    }}]
                );
            } else {
                Alert.alert('Error', 'No se pudo crear la reserva');
            }
        } catch (error) {
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
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.spaceImagePlaceholder}>
                                <Ionicons name="business" size={60} color={theme.colors.primary} />
                            </View>
                        )}
                        <View style={styles.spaceDetails}>
                            <View style={styles.spaceHeaderRow}>
                                <View style={styles.spaceTextContainer}>
                                    <Text style={styles.spaceName}>{space?.name || 'Selecciona un espacio'}</Text>
                                    <Text style={styles.spaceType}>{space?.type || 'Haz clic para elegir'}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
                            </View>
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
                    </Card>
                </TouchableOpacity>

                {/* Galería de imágenes del espacio */}
                {spaceGallery && spaceGallery.length > 0 && (
                    <View style={styles.galleryContainer}>
                        <Text style={styles.galleryTitle}>Más fotos del espacio</Text>
                        <FlatList
                            data={spaceGallery}
                            renderItem={({ item }) => (
                                <View style={styles.galleryItem}>
                                    <Image
                                        source={{ uri: `${config.baseURL.replace('/api', '')}${item.url}` }}
                                        style={styles.galleryImage}
                                        resizeMode="cover"
                                    />
                                </View>
                            )}
                            keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            pagingEnabled
                            scrollEventThrottle={16}
                        />
                    </View>
                )}

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
                                                        resizeMode="cover"
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
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <View style={styles.spaceListImagePlaceholder}>
                                                    <Ionicons name="business" size={32} color={theme.colors.primary} />
                                                </View>
                                            )}
                                            <View style={styles.spaceListContent}>
                                                <View style={styles.spaceListHeader}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.spaceListName}>{item.name}</Text>
                                                        <Text style={styles.spaceListType}>{item.type}</Text>
                                                    </View>
                                                    <View style={[
                                                        styles.statusDot,
                                                        { backgroundColor: item.state === 'disponible' ? theme.colors.status.success : theme.colors.status.warning }
                                                    ]} />
                                                </View>
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
                        is24Hour={false}
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
                        is24Hour={false}
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
        flexDirection: 'column',
        alignItems: 'stretch',
        marginBottom: theme.spacing.xl,
        backgroundColor: theme.colors.surface,
        overflow: 'hidden',
        borderRadius: theme.borderRadius.lg,
        padding: 0,
    },
    spaceImage: {
        width: '100%',
        height: 240,
        borderTopLeftRadius: theme.borderRadius.lg,
        borderTopRightRadius: theme.borderRadius.lg,
    },
    spaceImagePlaceholder: {
        width: '100%',
        height: 240,
        borderTopLeftRadius: theme.borderRadius.lg,
        borderTopRightRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    spaceDetails: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
    },
    spaceHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },
    spaceTextContainer: {
        flex: 1,
        marginRight: theme.spacing.md,
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
        marginBottom: theme.spacing.lg,
        flexDirection: 'column',
        alignItems: 'stretch',
        overflow: 'hidden',
        borderRadius: theme.borderRadius.lg,
        padding: 0,
    },
    spaceListImage: {
        width: '100%',
        height: 180,
        borderTopLeftRadius: theme.borderRadius.lg,
        borderTopRightRadius: theme.borderRadius.lg,
    },
    spaceListImagePlaceholder: {
        width: '100%',
        height: 180,
        borderTopLeftRadius: theme.borderRadius.lg,
        borderTopRightRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    spaceListContent: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
    },
    spaceListHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
        marginBottom: theme.spacing.sm,
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
        marginTop: theme.spacing.xs,
    },
    selectedSpaceDetail: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.xl,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    detailImage: {
        width: '100%',
        height: 240,
        borderTopLeftRadius: theme.borderRadius.lg,
        borderTopRightRadius: theme.borderRadius.lg,
    },
    detailImagePlaceholder: {
        width: '100%',
        height: 240,
        borderTopLeftRadius: theme.borderRadius.lg,
        borderTopRightRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailName: {
        ...theme.typography.header,
        fontSize: 22,
        marginBottom: theme.spacing.xs,
        textAlign: 'center',
        marginTop: theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
    },
    detailType: {
        ...theme.typography.subheader,
        color: theme.colors.primary,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
        paddingHorizontal: theme.spacing.lg,
    },
    detailInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
        width: '100%',
        paddingHorizontal: theme.spacing.lg,
    },
    detailInfoText: {
        ...theme.typography.body,
        marginLeft: theme.spacing.sm,
        color: theme.colors.text.secondary,
    },
    detailDescription: {
        ...theme.typography.body,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.lg,
        textAlign: 'center',
        fontStyle: 'italic',
        paddingHorizontal: theme.spacing.lg,
    },
    submenuTitle: {
        ...theme.typography.subheader,
        fontSize: 18,
        color: theme.colors.secondary,
        marginBottom: theme.spacing.md,
        marginTop: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
    },
    // Estilos para la galería
    galleryContainer: {
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
    },
    galleryTitle: {
        ...theme.typography.subheader,
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
        marginLeft: theme.spacing.lg,
    },
    galleryItem: {
        marginHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    galleryImage: {
        width: 280,
        height: 180,
        resizeMode: 'cover',
        borderRadius: theme.borderRadius.lg,
    },
});
