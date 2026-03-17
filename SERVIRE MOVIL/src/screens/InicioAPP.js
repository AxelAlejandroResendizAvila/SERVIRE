import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';

export default function InicioAPP({ navigation }) {
    return (
        <View style={styles.container}>
            <Header title="Inicio" rightIcon="notifications-outline" onRightPress={() => { }} />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.greetingContainer}>
                    <Text style={styles.greetingTitle}>Hola, Juan Pérez</Text>
                    <Text style={styles.greetingSubtitle}>¿Qué espacio necesitas hoy?</Text>
                </View>

                <Card style={styles.newReservationCard}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="add" size={24} color={theme.colors.primary} />
                        </View>
                        <View style={styles.cardHeaderText}>
                            <Text style={styles.cardTitle}>Nueva reserva</Text>
                            <Text style={styles.cardSubtitle}>Programa tu próximo espacio</Text>
                        </View>
                    </View>
                    <Button
                        title="Crear reserva"
                        onPress={() => navigation.navigate('FeaturesStack', { screen: 'FormularioReservas' })}
                    />
                </Card>

                <Text style={styles.sectionTitle}>Próxima reserva</Text>
                <Card style={styles.upcomingCard}>
                    <View style={styles.upcomingHeader}>
                        <Text style={styles.spaceName}>Laboratorio de Física</Text>
                        <View style={styles.statusPill}>
                            <Text style={styles.statusText}>Confirmada</Text>
                        </View>
                    </View>
                    <View style={styles.detailsRow}>
                        <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                        <Text style={styles.detailsText}>Lun, 3 de Feb</Text>
                    </View>
                    <View style={styles.detailsRow}>
                        <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
                        <Text style={styles.detailsText}>10:00 AM - 12:00 PM</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.detailsLink}
                        onPress={() => navigation.navigate('FeaturesStack', { screen: 'DetallesReserva' })}
                    >
                        <Text style={styles.detailsLinkText}>Ver detalles</Text>
                        <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                    </TouchableOpacity>
                </Card>

                <Text style={styles.sectionTitle}>Accesos rápidos</Text>
                <View style={styles.quickActionsContainer}>
                    <QuickActionItem
                        icon="calendar"
                        title="Mis reservas"
                        onPress={() => navigation.navigate('MisReservas')}
                    />
                    <QuickActionItem
                        icon="search"
                        title="Explorar"
                        onPress={() => navigation.navigate('ExplorarEspacios')}
                    />
                    <QuickActionItem
                        icon="person"
                        title="Cuenta"
                        onPress={() => navigation.navigate('Cuenta')}
                    />
                </View>

            </ScrollView>
        </View>
    );
}

function QuickActionItem({ icon, title, onPress }) {
    return (
        <TouchableOpacity style={styles.quickActionItem} onPress={onPress}>
            <View style={styles.quickActionIcon}>
                <Ionicons name={icon} size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.quickActionText}>{title}</Text>
        </TouchableOpacity>
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
    greetingContainer: {
        marginBottom: theme.spacing.lg,
    },
    greetingTitle: {
        ...theme.typography.header,
    },
    greetingSubtitle: {
        ...theme.typography.body,
        marginTop: theme.spacing.xs,
    },
    newReservationCard: {
        backgroundColor: theme.colors.surface,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    cardHeaderText: {
        flex: 1,
    },
    cardTitle: {
        ...theme.typography.subheader,
    },
    cardSubtitle: {
        ...theme.typography.caption,
        marginTop: 2,
    },
    sectionTitle: {
        ...theme.typography.subheader,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    upcomingCard: {
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
    },
    upcomingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    spaceName: {
        ...theme.typography.subheader,
        flex: 1,
    },
    statusPill: {
        backgroundColor: theme.colors.primary + '20', // transparent primary
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
    },
    statusText: {
        color: theme.colors.primary,
        fontSize: theme.typography.caption.fontSize,
        fontWeight: 'bold',
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    detailsText: {
        ...theme.typography.body,
        marginLeft: theme.spacing.sm,
    },
    detailsLink: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
        paddingTop: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    detailsLinkText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        marginRight: 4,
    },
    quickActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quickActionItem: {
        alignItems: 'center',
        width: '30%',
    },
    quickActionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.xs,
    },
    quickActionText: {
        ...theme.typography.caption,
        textAlign: 'center',
    }
});
