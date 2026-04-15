import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import Card from '../components/Card';
import AnimatedCard from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';
import { Ionicons } from '@expo/vector-icons';
import { getSpaces } from '../services/api';
import { config } from '../config';

export default function ExplorarEspacios({ navigation }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('Todas');
    const [activeBuilding, setActiveBuilding] = useState('Todos');
    const [spaces, setSpaces] = useState([]);
    const [categories, setCategories] = useState([]);
    const [edificios, setEdificios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSpaces();
    }, []);

    const fetchSpaces = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getSpaces();
            setSpaces(data || []);
            
            try {
                // Obtener categorías dinámicamente
                const catRes = await fetch(`${config.baseURL}/categorias`);
                if (catRes.ok) {
                    const cats = await catRes.json();
                    setCategories(cats || []);
                } else {
                    // Si no hay endpoint de categorías, usar las por defecto
                    setCategories([
                        { id: 1, name: 'Tics', description: 'Laboratorios de cómputo' },
                        { id: 2, name: 'Auditorio', description: 'Salas magnas' },
                        { id: 3, name: 'Salas', description: 'Salas de juntas o estudio' },
                        { id: 4, name: 'Laboratorio', description: 'Laboratorios experimentales' },
                        { id: 5, name: 'Biblioteca', description: 'Zonas de silencio y estudio' }
                    ]);
                }
            } catch(e) {
                console.warn('Error cargando categorías, usando por defecto:', e);
                setCategories([
                    { id: 1, name: 'Tics', description: 'Laboratorios de cómputo' },
                    { id: 2, name: 'Auditorio', description: 'Salas magnas' },
                    { id: 3, name: 'Salas', description: 'Salas de juntas o estudio' },
                    { id: 4, name: 'Laboratorio', description: 'Laboratorios experimentales' },
                    { id: 5, name: 'Biblioteca', description: 'Zonas de silencio y estudio' }
                ]);
            }
            
            try {
                const res = await fetch(`${config.baseURL}/espacios/edificios`);
                if (res.ok) {
                    const edifs = await res.json();
                    setEdificios(edifs || []);
                }
            } catch(e) {
                // Error al cargar edificios, no es crítico
                console.warn('Error cargando edificios:', e);
            }
        } catch (err) {
            console.error('Error fetching spaces:', err);
            setError(err.message || 'Hubo un problema al cargar los espacios. Por favor, intenta de nuevo.');
            setSpaces([]);
        } finally {
            setLoading(false);
        }
    };

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

    const filteredSpaces = spaces.filter(space => {
        // Filtrar por categoría usando categoryId
        let matchesFilter = activeFilter === 'Todas';
        if (!matchesFilter && activeFilter) {
            // activeFilter contiene el ID de la categoría seleccionada
            const selectedCatId = parseInt(activeFilter);
            matchesFilter = space.categoryId && space.categoryId === selectedCatId;
        }
        
        // Búsqueda mejorada con relevancia
        let matchesSearch = true;
        if (searchQuery.trim()) {
            const relevance = getRelevanceScore(space.name, searchQuery);
            matchesSearch = relevance > 0;
        }
        
        const matchesBuilding = activeBuilding === 'Todos' || space.buildingId === activeBuilding;
        return matchesFilter && matchesSearch && matchesBuilding;
    }).sort((a, b) => {
        // Ordenar por relevancia si hay búsqueda
        if (searchQuery.trim()) {
            const scoreA = getRelevanceScore(a.name, searchQuery);
            const scoreB = getRelevanceScore(b.name, searchQuery);
            return scoreB - scoreA;
        }
        return 0;
    });

    const getTypeIcon = (type) => {
        switch (type) {
            case 'Laboratorios':
                return 'flask';
            case 'Aulas':
                return 'book';
            case 'Salas de reuniones':
                return 'people';
            default:
                return 'business';
        }
    };

    return (
        <View style={styles.container}>
            <Header title="Explorar espacios" />

            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color={theme.colors.text.secondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar por nombre o edificio..."
                        placeholderTextColor={theme.colors.text.secondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <View style={styles.filtersContainer}>
                <Text style={styles.filterSectionLabel}>Categorías</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            activeFilter === 'Todas' && styles.activeFilterChip
                        ]}
                        onPress={() => setActiveFilter('Todas')}
                    >
                        <Text style={[
                            styles.filterText,
                            activeFilter === 'Todas' && styles.activeFilterText
                        ]}>
                            Todas
                        </Text>
                    </TouchableOpacity>
                    
                    {categories.map(category => (
                        <TouchableOpacity
                            key={category.id}
                            style={[
                                styles.filterChip,
                                activeFilter === category.id.toString() && styles.activeFilterChip
                            ]}
                            onPress={() => setActiveFilter(category.id.toString())}
                        >
                            <Text style={[
                                styles.filterText,
                                activeFilter === category.id.toString() && styles.activeFilterText
                            ]}>
                                {category.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                
                {edificios.length > 0 && (
                    <>
                        <Text style={styles.filterSectionLabel}>Edificios</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filtersScroll, { marginTop: 6 }]}>
                            <TouchableOpacity
                                style={[
                                    styles.filterChip,
                                    activeBuilding === 'Todos' && styles.activeFilterChip
                                ]}
                                onPress={() => setActiveBuilding('Todos')}
                            >
                                <Text style={[styles.filterText, activeBuilding === 'Todos' && styles.activeFilterText]}>
                                    Todos
                                </Text>
                            </TouchableOpacity>
                            
                            {edificios.map(ed => (
                                <TouchableOpacity
                                    key={ed.id}
                                    style={[
                                        styles.filterChip,
                                        activeBuilding === ed.id && styles.activeFilterChip
                                    ]}
                                    onPress={() => setActiveBuilding(ed.id)}
                                >
                                    <Text style={[
                                        styles.filterText,
                                        activeBuilding === ed.id && styles.activeFilterText
                                    ]}>
                                        {ed.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </>
                )}
            </View>

            <ScrollView contentContainerStyle={styles.listContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.loadingText}>Cargando espacios...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={fetchSpaces}>
                            <Text style={styles.retryText}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {filteredSpaces.map((space, index) => (
                            <AnimatedCard
                                key={space.id}
                                animation="fadeUp"
                                delay={index * 80}
                                duration={500}
                            >
                                <AnimatedButton
                                    onPress={() => navigation.navigate('FormularioReservas', { space })}
                                    style={styles.spaceCardButton}
                                >
                                    <Card style={styles.spaceCard}>
                                    {space.image ? (
                                        <Image
                                            source={{ uri: space.image.startsWith('http') ? space.image : `${config.baseURL.replace('/api', '')}${space.image}` }}
                                            style={styles.spaceImage}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={styles.spaceIconContainer}>
                                            <Ionicons 
                                                name={getTypeIcon(space.type)} 
                                                size={50} 
                                                color={theme.colors.primary} 
                                            />
                                        </View>
                                    )}
                                    <View style={styles.spaceInfo}>
                                        <View style={styles.spaceInfoHeader}>
                                            <View style={styles.spaceInfoText}>
                                                <Text style={styles.spaceName}>{space.name}</Text>
                                                <Text style={styles.spaceType}>{space.type}</Text>
                                            </View>
                                            <View style={[
                                                styles.statusDot,
                                                { backgroundColor: space.state === 'disponible' ? theme.colors.status.success : theme.colors.status.warning }
                                            ]} />
                                        </View>
                                        <Text style={styles.spaceLocation}>
                                            📍 {space.location}
                                        </Text>
                                        <Text style={styles.spaceCapacity}>
                                            👥 Capacidad: {space.capacity} personas
                                        </Text>
                                    </View>
                                </Card>
                                </AnimatedButton>
                            </AnimatedCard>
                        ))}
                        {filteredSpaces.length === 0 && (
                            <Text style={styles.emptyText}>No se encontraron espacios.</Text>
                        )}
                    </>
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
    searchContainer: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: 8,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: theme.spacing.md,
        height: 38,
    },
    searchIcon: {
        marginRight: 6,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.text.primary,
    },
    filtersContainer: {
        paddingBottom: 8,
        paddingTop: 4,
    },
    filtersScroll: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: 3,
        gap: 4,
    },
    filterChip: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface,
        marginRight: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    activeFilterChip: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    filterChipContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterSectionLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        paddingHorizontal: theme.spacing.lg,
        marginTop: 6,
        marginBottom: 3,
        textTransform: 'uppercase',
        letterSpacing: 0.2,
    },
    filterText: {
        ...theme.typography.body,
        fontWeight: '500',
        fontSize: 11,
    },
    activeFilterText: {
        color: theme.colors.text.inverse,
    },
    listContainer: {
        padding: theme.spacing.lg,
        alignItems: 'center',
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
    spaceCardButton: {
        width: '100%',
    },
    spaceCard: {
        flexDirection: 'column',
        alignItems: 'stretch',
        overflow: 'hidden',
        marginBottom: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        padding: 0,
    },
    spaceImage: {
        width: '100%',
        height: 200,
        borderTopLeftRadius: theme.borderRadius.lg,
        borderTopRightRadius: theme.borderRadius.lg,
    },
    spaceIconContainer: {
        width: '100%',
        height: 200,
        borderTopLeftRadius: theme.borderRadius.lg,
        borderTopRightRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    spaceInfo: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
    },
    spaceInfoHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },
    spaceInfoText: {
        flex: 1,
        marginRight: theme.spacing.md,
    },
    spaceName: {
        ...theme.typography.subheader,
        fontSize: 18,
        marginBottom: theme.spacing.xs,
    },
    spaceType: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    spaceLocation: {
        ...theme.typography.caption,
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    spaceCapacity: {
        ...theme.typography.caption,
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: theme.spacing.xs,
    },
    emptyText: {
        ...theme.typography.body,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
    }
});
