import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import Card from '../components/Card';
import { Ionicons } from '@expo/vector-icons';

export default function MisReservas({ navigation }) {
    const [activeTab, setActiveTab] = useState('upcoming');

    const rendersUpcoming = () => (
        <>
            <Text style={styles.dateHeader}>Lunes, 3 de Febrero</Text>
            <Card style={styles.reservationCard}>
                <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>10:00</Text>
                    <Text style={styles.timeAmPm}>AM</Text>
                    <View style={styles.timeLine} />
                    <Text style={styles.timeText}>12:00</Text>
                    <Text style={styles.timeAmPm}>PM</Text>
                </View>
                <View style={styles.detailsContainer}>
                    <Text style={styles.spaceName}>Laboratorio de Física</Text>
                    <Text style={styles.spaceLocation}>Edificio A, Piso 2</Text>
                    <View style={styles.statusPill}>
                        <Text style={styles.statusText}>Confirmada</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.detailsLink}
                        onPress={() => navigation.navigate('FeaturesStack', { screen: 'DetallesReserva' })}
                    >
                        <Text style={styles.detailsLinkText}>Ver detalles</Text>
                    </TouchableOpacity>
                </View>
            </Card>

            <Text style={styles.dateHeader}>Miércoles, 5 de Febrero</Text>
            <Card style={styles.reservationCard}>
                <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>14:00</Text>
                    <Text style={styles.timeAmPm}>PM</Text>
                    <View style={styles.timeLine} />
                    <Text style={styles.timeText}>16:00</Text>
                    <Text style={styles.timeAmPm}>PM</Text>
                </View>
                <View style={styles.detailsContainer}>
                    <Text style={styles.spaceName}>Sala de Estudio B</Text>
                    <Text style={styles.spaceLocation}>Biblioteca, Piso 1</Text>
                    <View style={[styles.statusPill, styles.pendingPill]}>
                        <Text style={[styles.statusText, styles.pendingText]}>Pendiente</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.detailsLink}
                        onPress={() => navigation.navigate('FeaturesStack', { screen: 'DetallesReserva' })}
                    >
                        <Text style={styles.detailsLinkText}>Ver detalles</Text>
                    </TouchableOpacity>
                </View>
            </Card>
        </>
    );

    const rendersPast = () => (
        <>
            <Text style={styles.dateHeader}>Semana pasada</Text>
            <Card style={styles.reservationCard}>
                <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>09:00</Text>
                    <Text style={styles.timeAmPm}>AM</Text>
                    <View style={styles.timeLine} />
                    <Text style={styles.timeText}>11:00</Text>
                    <Text style={styles.timeAmPm}>AM</Text>
                </View>
                <View style={styles.detailsContainer}>
                    <Text style={styles.spaceName}>Aula Magna 1</Text>
                    <Text style={styles.spaceLocation}>Edificio Principal</Text>
                    <View style={[styles.statusPill, styles.pastPill]}>
                        <Text style={[styles.statusText, styles.pastText]}>Completada</Text>
                    </View>
                </View>
            </Card>
        </>
    );

    return (
        <View style={styles.container}>
            <Header title="Mis reservas" />

            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
                    onPress={() => setActiveTab('upcoming')}
                >
                    <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
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
                {activeTab === 'upcoming' ? rendersUpcoming() : rendersPast()}
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
    dateHeader: {
        ...theme.typography.subheader,
        fontSize: 16,
        marginBottom: theme.spacing.md,
        marginTop: theme.spacing.sm,
    },
    reservationCard: {
        flexDirection: 'row',
        padding: 0, // Override default padding
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
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    timeAmPm: {
        fontSize: 10,
        color: theme.colors.text.secondary,
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
    spaceName: {
        ...theme.typography.subheader,
        fontSize: 16,
    },
    spaceLocation: {
        ...theme.typography.caption,
        marginTop: 2,
        marginBottom: theme.spacing.sm,
    },
    statusPill: {
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.primary + '15',
        borderWidth: 1,
        borderColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.full,
        marginBottom: theme.spacing.sm,
    },
    statusText: {
        color: theme.colors.primary,
        fontSize: theme.typography.caption.fontSize,
        fontWeight: 'bold',
    },
    pendingPill: {
        borderColor: theme.colors.status.warning,
        backgroundColor: theme.colors.status.warning + '15',
    },
    pendingText: {
        color: theme.colors.status.warning,
    },
    pastPill: {
        borderColor: theme.colors.text.secondary,
        backgroundColor: theme.colors.surface,
    },
    pastText: {
        color: theme.colors.text.secondary,
    },
    detailsLink: {
        marginTop: theme.spacing.xs,
    },
    detailsLinkText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        ...theme.typography.body,
    }
});
