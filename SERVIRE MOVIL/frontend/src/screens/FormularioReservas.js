import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, ActivityIndicator, TouchableOpacity, FlatList, Modal, Image, KeyboardAvoidingView, TextInput, Animated } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Card from '../components/Card';
import AnimatedCard from '../components/AnimatedCard';
import { Ionicons } from '@expo/vector-icons';
import { createReservation, getSpaces, getSpaceById, getToken } from '../services/api';
import { config } from '../config';
import { useToast } from '../context/ToastContext';

export default function FormularioReservas({ navigation, route }) {
    const initialSpace = route?.params?.space || null;
    const { error: showError } = useToast();
    const [space, setSpace] = useState(initialSpace);
    const [spaceGallery, setSpaceGallery] = useState([]);
    const [spaces, setSpaces] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loadingSpaces, setLoadingSpaces] = useState(!initialSpace);
    const [showSpaceSelector, setShowSpaceSelector] = useState(!initialSpace);
    const [modalSearchQuery, setModalSearchQuery] = useState('');
    const [modalFilterCategory, setModalFilterCategory] = useState('Todas');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const shakeAnim = useRef(new Animated.Value(0)).current;

    // Estados para Fechas y Horas (Usamos objetos Date para el Picker)
    const [date, setDate] = useState(new Date());
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date(new Date().setHours(new Date().getHours() + 1)));

    // Estados para mostrar/ocultar los calendarios
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const [loading, setLoading] = useState(false);

    // Animación shake cuando hay error
    useEffect(() => {
        if (error) {
            shakeAnim.setValue(0);
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
            ]).start();
        }
    }, [error, shakeAnim]);

    // Formateadores para mostrar en los inputs
    // Función para crear ISO string que preserve la hora local del usuario
    const toLocalISOString = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getSeconds()).padStart(2, '0');
        const ms = String(dateObj.getMilliseconds()).padStart(3, '0');
        // Devuelve hora local como si fuera UTC: "2026-04-15T19:30:00.000Z"
        // El backend entiende que esta es la hora local del usuario
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}Z`;
    };

    // Función para obtener fecha local en formato YYYY-MM-DD sin convertir a UTC
    const getLocalDateString = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formattedDate = getLocalDateString(date);
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
            // Error loading space details
        }
    };

    const fetchSpaces = async () => {
        try {
            setLoadingSpaces(true);
            const data = await getSpaces();
            setSpaces(data || []);
            
            // Also fetch categories
            try {
                const catRes = await fetch(`${config.baseURL}/categorias`);
                if (catRes.ok) {
                    const cats = await catRes.json();
                    setCategories(cats || []);
                }
            } catch(e) {
                // Error loading categories
            }
        } catch (err) {
            setError('No se pudieron cargar los espacios');
        } finally {
            setLoadingSpaces(false);
        }
    };

    const handleSelectSpace = (selectedSpace) => {
        setSpace(selectedSpace);
        setShowSpaceSelector(false);
        // Limpiar filtros del modal
        setModalSearchQuery('');
        setModalFilterCategory('Todas');
        // Limpiar error
        setError('');
        // La galería se cargará automáticamente en el useEffect
    };

    // Función para calcular la relevancia de la búsqueda
    const getRelevanceScore = (text, query) => {
        if (!query) return 0;
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        
        // Coincidencia exacta
        if (lowerText === lowerQuery) return 1000;
        // Comienza con la búsqueda
        if (lowerText.startsWith(lowerQuery)) return 500;
        // Contiene la búsqueda
        if (lowerText.includes(lowerQuery)) return 100;
        return 0;
    };

    // Filtrados de espacios en el modal
    const getFilteredSpacesForModal = () => {
        return spaces.filter(s => {
            if (s.id === space?.id) return false; // Excluir el espacio actual
            
            // Búsqueda mejorada con relevancia
            let matchesSearch = true;
            if (modalSearchQuery.trim()) {
                const relevance = getRelevanceScore(s.name, modalSearchQuery);
                matchesSearch = relevance > 0;
            }
            
            let matchesCategory = modalFilterCategory === 'Todas';
            if (!matchesCategory && modalFilterCategory) {
                const selectedCat = categories.find(c => c.id.toString() === modalFilterCategory);
                if (selectedCat) {
                    matchesCategory = s.categoryId && s.categoryId === selectedCat.id;
                }
            }
            
            return matchesSearch && matchesCategory;
        }).sort((a, b) => {
            // Ordenar por relevancia si hay búsqueda
            if (modalSearchQuery.trim()) {
                const scoreA = getRelevanceScore(a.name, modalSearchQuery);
                const scoreB = getRelevanceScore(b.name, modalSearchQuery);
                return scoreB - scoreA;
            }
            return 0;
        });
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
            showError('No puedes reservar en fechas pasadas');
            return;
        }

        // Si es hoy, verificar que la hora de inicio no sea en el pasado
        if (selectedDate.getTime() === today.getTime()) {
            const nowDateObj = new Date();
            const selectedStartTime = new Date(date);
            selectedStartTime.setHours(horaDeInicio, minutosDeInicio, 0);
            
            if (selectedStartTime < nowDateObj) {
                showError('No puedes reservar en horas que ya pasaron');
                return;
            }
        }

        const inicioTotalMinutos = horaDeInicio * 60 + minutosDeInicio;
        const finTotalMinutos = horaDeTermino * 60 + minutosDeTermino;

        if (finTotalMinutos <= inicioTotalMinutos) {
            showError('La hora de fin debe ser después de la hora de inicio.');
            return;
        }

        // Agregué esto para comprobar si la hora de inicio respeta el horario de la universidad (de 7:00 am a 8:40 pm)
        const inicioEsValido = horaDeInicio >= 7 && (horaDeInicio < 20 || (horaDeInicio === 20 && minutosDeInicio <= 40));

        // Y aquí hago exactamente la misma comprobación pero para la hora de cierre
        const finEsValido = horaDeTermino >= 7 && (horaDeTermino < 20 || (horaDeTermino === 20 && minutosDeTermino <= 40));

        // Si veo que cualquiera de las dos horas está fuera del horario establecido, detengo todo y lanzo una advertencia
        if (!inicioEsValido || !finEsValido) {
            showError('Las reservas solo pueden ser entre las 07:00 am y las 20:40 pm.');
            return;
        }

        if (!space?.id) {
            showError('Espacio no encontrado');
            return;
        }

        setLoading(true);

        try {
            // VERIFICAR QUE EL TOKEN EXISTE ANTES DE HACER LA RESERVA
            const token = await getToken();
            if (!token) {
                showError('No se encontró el token de sesión. Por favor, inicia sesión nuevamente.');
                setLoading(false);
                return;
            }
            console.log('✅ Token verificado, procediendo con la reserva');

            // Construimos las fechas ISO combinando la fecha seleccionada y las horas seleccionadas
            const fechaInicio = new Date(date);
            fechaInicio.setHours(startTime.getHours(), startTime.getMinutes(), 0);

            const fechaFin = new Date(date);
            fechaFin.setHours(endTime.getHours(), endTime.getMinutes(), 0);

            const response = await createReservation({
                id_espacio: space.id,
                fecha_inicio: toLocalISOString(fechaInicio),
                fecha_fin: toLocalISOString(fechaFin),
                precio_total: 0,
            });

            if (response.reserva || response.success) {
                // Reserva creada correctamente - mostrar éxito
                setError('');
                setTimeout(() => {
                    navigation.replace('MainTabs', { screen: 'Reservas' });
                }, 500);
            } else {
                showError('No se pudo crear la reserva');
            }
        } catch (error) {
            showError(error.message || 'Error al crear la reserva');
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

                {/* Error Container con Animación */}
                {error ? (
                    <Animated.View style={[styles.errorContainer, { transform: [{ translateX: shakeAnim }] }]}>
                        <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </Animated.View>
                ) : null}

                {/* Selector de Espacio */}
                <TouchableOpacity onPress={() => setShowSpaceSelector(true)}>
                    <AnimatedCard
                        animation="fadeUp"
                        duration={600}
                    >
                        <Card style={styles.spaceInfoCard}>
                            {space?.image ? (
                                <Image
                                    source={{ uri: space.image.startsWith('http') ? space.image : `${config.baseURL.replace('/api', '')}${space.image}` }}
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
                    </AnimatedCard>
                </TouchableOpacity>

                {/* Galería de imágenes del espacio */}
                {spaceGallery && spaceGallery.length > 0 && (
                    <AnimatedCard animation="fadeIn" delay={400} duration={500}>
                        <View style={styles.galleryTitleContainer}>
                            <Text style={styles.galleryTitle}>Más fotos del espacio</Text>
                        </View>
                        <View style={styles.galleryContainer}>
                            <FlatList
                                data={spaceGallery}
                                renderItem={({ item }) => (
                                    <View style={styles.galleryItem}>
                                        <Image
                                            source={{ uri: item.url.startsWith('http') ? item.url : `${config.baseURL.replace('/api', '')}${item.url}` }}
                                            style={styles.galleryImage}
                                            resizeMode="cover"
                                        />
                                    </View>
                                )}
                                keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                pagingEnabled={false}
                                scrollEventThrottle={16}
                                nestedScrollEnabled={true}
                            />
                        </View>
                    </AnimatedCard>
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

                        {/* Búsqueda en el modal */}
                        <View style={styles.modalSearchContainer}>
                            <View style={styles.modalSearchInputContainer}>
                                <Ionicons name="search" size={18} color={theme.colors.text.secondary} style={{ marginRight: 8 }} />
                                <TextInput
                                    style={styles.modalSearchInput}
                                    placeholder="Buscar espacios..."
                                    placeholderTextColor={theme.colors.text.secondary}
                                    value={modalSearchQuery}
                                    onChangeText={setModalSearchQuery}
                                />
                            </View>
                        </View>

                        {/* Filtros de categoría en el modal */}
                        {categories.length > 0 && (
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false} 
                                contentContainerStyle={styles.modalFiltersContainer}
                            >
                                <TouchableOpacity
                                    style={[
                                        styles.modalFilterChip,
                                        modalFilterCategory === 'Todas' && styles.modalActiveFilterChip
                                    ]}
                                    onPress={() => setModalFilterCategory('Todas')}
                                >
                                    <Text style={[
                                        styles.modalFilterText,
                                        modalFilterCategory === 'Todas' && styles.modalActiveFilterText
                                    ]}>
                                        Todas
                                    </Text>
                                </TouchableOpacity>
                                
                                {categories.map(category => (
                                    <TouchableOpacity
                                        key={category.id}
                                        style={[
                                            styles.modalFilterChip,
                                            modalFilterCategory === category.id.toString() && styles.modalActiveFilterChip
                                        ]}
                                        onPress={() => setModalFilterCategory(category.id.toString())}
                                    >
                                        <Text style={[
                                            styles.modalFilterText,
                                            modalFilterCategory === category.id.toString() && styles.modalActiveFilterText
                                        ]}>
                                            {category.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {loadingSpaces ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                            </View>
                        ) : (
                            <FlatList
                                data={getFilteredSpacesForModal()}
                                ListHeaderComponent={() => (
                                    <View>
                                        {space && (
                                            <View style={styles.selectedSpaceDetail}>
                                                {space.image ? (
                                                    <Image
                                                        source={{ uri: space.image.startsWith('http') ? space.image : `${config.baseURL.replace('/api', '')}${space.image}` }}
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
                                        {getFilteredSpacesForModal().length > 0 && (
                                            <Text style={styles.submenuTitle}>
                                                {space ? "Otros espacios disponibles" : "Todos los espacios disponibles"}
                                            </Text>
                                        )}
                                    </View>
                                )}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity onPress={() => handleSelectSpace(item)}>
                                        <Card style={styles.spaceListItem}>
                                            {item.image ? (
                                                <Image
                                                    source={{ uri: item.image.startsWith('http') ? item.image : `${config.baseURL.replace('/api', '')}${item.image}` }}
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
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="search" size={48} color={theme.colors.text.secondary} />
                                        <Text style={styles.emptyText}>No se encontraron espacios</Text>
                                    </View>
                                }
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

                <AnimatedCard
                    animation="fadeUp"
                    duration={600}
                >
                    <Card style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>Resumen</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Duración total:</Text>
                            <Text style={styles.summaryValue}>{calculateDuration()} horas</Text>
                        </View>
                    </Card>
                </AnimatedCard>

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
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.error || '#dc3545',
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderRadius: 4,
    },
    errorText: {
        color: theme.colors.error || '#dc3545',
        marginLeft: theme.spacing.md,
        fontSize: 13,
        fontWeight: '500',
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
    galleryTitleContainer: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    galleryContainer: {
        marginBottom: theme.spacing.lg,
        height: 220,
    },
    galleryTitle: {
        ...theme.typography.subheader,
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    galleryItem: {
        marginHorizontal: theme.spacing.sm,
        marginVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    galleryImage: {
        width: 280,
        height: 200,
        borderRadius: theme.borderRadius.lg,
    },
    // Estilos para búsqueda y filtros en el modal
    modalSearchContainer: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: 8,
    },
    modalSearchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: theme.spacing.md,
        height: 38,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    modalSearchInput: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.text.primary,
    },
    modalFiltersContainer: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: 3,
        gap: 4,
    },
    modalFilterChip: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface,
        marginRight: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    modalActiveFilterChip: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    modalFilterText: {
        fontSize: 11,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    modalActiveFilterText: {
        color: theme.colors.text.inverse,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xl * 3,
    },
    emptyText: {
        marginTop: theme.spacing.md,
        fontSize: 14,
        color: theme.colors.text.secondary,
        fontWeight: '500',
    },
});
