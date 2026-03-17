import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import Card from '../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { getSpaces } from '../services/api';

const FILTERS = ['Todos', 'Laboratorios', 'Aulas', 'Salas de reuniones', 'General'];

export default function ExplorarEspacios({ navigation }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [spaces, setSpaces] = useState([]);
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
        } catch (err) {
            console.error('Error fetching spaces:', err);
            setError('Error al cargar los espacios');
            Alert.alert('Error', 'No se pudieron cargar los espacios');
        } finally {
            setLoading(false);
        }
    };

    const filteredSpaces = spaces.filter(space => {
        const matchesFilter = activeFilter === 'Todos' || space.type === activeFilter;
        const matchesSearch = space.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
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
                                onPress={() => navigation.navigate('FeaturesStack', { 
                                    screen: 'FormularioReservas',
                                    params: { space }
                                })}
                            >
                                <Card style={styles.spaceCard}>
                                    <View style={styles.spaceIconContainer}>
                                        <Ionicons 
                                            name={getTypeIcon(space.type)} 
                                            size={24} 
                                            color={theme.colors.primary} 
                                        />
                                    </View>
                                    <View style={styles.spaceInfo}>
                                        <Text style={styles.spaceName}>{space.name}</Text>
                                        <Text style={styles.spaceType}>{space.type}</Text>
                                        <Text style={styles.spaceCapacity}>
                                            Capacidad: {space.capacity} personas
                                        </Text>
                                    </View>
                                    <View style={[
                                        styles.statusDot,
                                        { backgroundColor: space.state === 'disponible' ? theme.colors.status.success : theme.colors.status.warning }
                                    ]} />
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
        flexDirection: 'row',
        alignItems: 'center',
    },
    spaceIconContainer: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    spaceInfo: {
        flex: 1,
    },
    spaceName: {
        ...theme.typography.subheader,
        fontSize: 16,
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
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginLeft: theme.spacing.md,
    },
    emptyText: {
        ...theme.typography.body,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
    }
});
