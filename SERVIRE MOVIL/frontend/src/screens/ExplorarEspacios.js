import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import Card from '../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { getSpaces } from '../services/api';
import { config } from '../config';

const FILTERS = ['Todos', 'Laboratorios', 'Aulas', 'Salas de reuniones', 'General'];

export default function ExplorarEspacios({ navigation }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [activeBuilding, setActiveBuilding] = useState('Todos');
    const [spaces, setSpaces] = useState([]);
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

    const filteredSpaces = spaces.filter(space => {
        const matchesFilter = activeFilter === 'Todos' || space.type === activeFilter;
        const matchesSearch = space.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesBuilding = activeBuilding === 'Todos' || space.buildingId === activeBuilding;
        return matchesFilter && matchesSearch && matchesBuilding;
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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
                    {FILTERS.map(filter => (
                        <TouchableOpacity
                            key={filter}
                            style={[
                                styles.filterChip,
                                activeFilter === filter && styles.activeFilterChip
                            ]}
                            onPress={() => setActiveFilter(filter)}
                        >
                            <Text style={[
                                styles.filterText,
                                activeFilter === filter && styles.activeFilterText
                            ]}>
                                {filter}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                
                {edificios.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filtersScroll, { marginTop: 10 }]}>
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                activeBuilding === 'Todos' && styles.activeFilterChip
                            ]}
                            onPress={() => setActiveBuilding('Todos')}
                        >
                            <Text style={[styles.filterText, activeBuilding === 'Todos' && styles.activeFilterText]}>
                                Todos los edificios
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
                        {filteredSpaces.map(space => (
                            <TouchableOpacity
                                key={space.id}
                                onPress={() => navigation.navigate('FormularioReservas', { space })}
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
                            </TouchableOpacity>
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
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.sm,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: theme.spacing.md,
        height: 48,
    },
    searchIcon: {
        marginRight: theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: theme.typography.body.fontSize,
        color: theme.colors.text.primary,
    },
    filtersContainer: {
        paddingBottom: theme.spacing.md,
    },
    filtersScroll: {
        paddingHorizontal: theme.spacing.lg,
    },
    filterChip: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface,
        marginRight: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    activeFilterChip: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    filterText: {
        ...theme.typography.body,
        fontWeight: '500',
    },
    activeFilterText: {
        color: theme.colors.text.inverse,
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
