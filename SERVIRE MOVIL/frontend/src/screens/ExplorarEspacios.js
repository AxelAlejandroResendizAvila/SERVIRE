import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import Card from '../components/Card';
import { Ionicons } from '@expo/vector-icons';

const FILTERS = ['Todos', 'Laboratorios', 'Aulas', 'Salas de reuniones'];

const SPACES = [
    { id: '1', name: 'Laboratorio de Física', location: 'Edificio A, Piso 2', type: 'Laboratorios', available: true },
    { id: '2', name: 'Aula Magna 1', location: 'Edificio Principal', type: 'Aulas', available: false },
    { id: '3', name: 'Sala de Estudio B', location: 'Biblioteca, Piso 1', type: 'Salas de reuniones', available: true },
    { id: '4', name: 'Laboratorio de Química', location: 'Edificio C, Piso 1', type: 'Laboratorios', available: true },
];

export default function ExplorarEspacios({ navigation }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('Todos');

    const filteredSpaces = SPACES.filter(space => {
        const matchesFilter = activeFilter === 'Todos' || space.type === activeFilter;
        const matchesSearch = space.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

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
                {filteredSpaces.map(space => (
                    <TouchableOpacity
                        key={space.id}
                        onPress={() => navigation.navigate('FeaturesStack', { screen: 'FormularioReservas' })}
                    >
                        <Card style={styles.spaceCard}>
                            <View style={styles.spaceIconContainer}>
                                <Ionicons name="business" size={24} color={theme.colors.primary} />
                            </View>
                            <View style={styles.spaceInfo}>
                                <Text style={styles.spaceName}>{space.name}</Text>
                                <Text style={styles.spaceLocation}>{space.location}</Text>
                            </View>
                            <View style={[
                                styles.statusDot,
                                { backgroundColor: space.available ? theme.colors.status.success : theme.colors.status.warning }
                            ]} />
                        </Card>
                    </TouchableOpacity>
                ))}
                {filteredSpaces.length === 0 && (
                    <Text style={styles.emptyText}>No se encontraron espacios.</Text>
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
    spaceLocation: {
        ...theme.typography.caption,
        marginTop: 2,
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
