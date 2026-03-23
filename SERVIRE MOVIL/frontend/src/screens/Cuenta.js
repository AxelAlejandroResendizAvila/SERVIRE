import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function Cuenta({ navigation }) {
    const { user, logout, changePassword, loading } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [error, setError] = useState('');

    // Extract user initials
    const getInitials = (nombre) => {
        if (!nombre) return 'U';
        const parts = nombre.trim().split(' ');
        return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
    };

    const handleChangePassword = async () => {
        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Las nuevas contraseñas no coinciden');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoadingPassword(true);
        setError('');

        try {
            await changePassword(currentPassword, newPassword);
            Alert.alert('Éxito', 'Contraseña actualizada correctamente');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error('Error changing password:', err);
            const errorMsg = err.response?.data?.error || err.message || 'Error al cambiar contraseña';
            Alert.alert('Error', errorMsg);
        } finally {
            setLoadingPassword(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Cerrar sesión',
            '¿Estás seguro de que deseas cerrar sesión?',
            [
                {
                    text: 'Cancelar',
                    onPress: () => { },
                    style: 'cancel',
                },
                {
                    text: 'Cerrar sesión',
                    onPress: async () => {
                        await logout();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'AuthStack' }],
                        });
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    if (!user) {
        return (
            <View style={styles.container}>
                <Header title="Cuenta" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header title="Cuenta" />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(user.nombre)}</Text>
                    </View>
                    <Text style={styles.profileName}>{user.nombre}</Text>
                    <Text style={styles.profileEmail}>{user.email}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información personal</Text>
                    <InputField
                        label="Nombre completo"
                        value={user.nombre}
                        editable={false}
                    />
                    <InputField
                        label="Correo electrónico"
                        value={user.email}
                        keyboardType="email-address"
                        editable={false}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Seguridad</Text>
                    <InputField
                        label="Contraseña actual"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        secureTextEntry
                        placeholder="Ingresa tu contraseña actual"
                        editable={!loadingPassword}
                    />
                    <InputField
                        label="Nueva contraseña"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                        placeholder="Ingresa tu nueva contraseña"
                        editable={!loadingPassword}
                    />
                    <InputField
                        label="Confirmar nueva contraseña"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        placeholder="Confirma tu nueva contraseña"
                        editable={!loadingPassword}
                    />
                    <Button
                        title={loadingPassword ? "Actualizando..." : "Actualizar contraseña"}
                        onPress={handleChangePassword}
                        style={styles.saveButton}
                        disabled={loadingPassword}
                    />
                </View>

                <View style={[styles.section, styles.dangerZone]}>
                    <Button
                        title="Cerrar sesión"
                        variant="dangerOutline"
                        onPress={handleLogout}
                        disabled={loading}
                    />
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        padding: theme.spacing.lg,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.md,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.text.inverse,
    },
    profileName: {
        ...theme.typography.header,
        fontSize: 20,
    },
    profileEmail: {
        ...theme.typography.body,
        marginTop: 4,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        ...theme.typography.subheader,
        marginBottom: theme.spacing.md,
        color: theme.colors.secondary,
    },
    saveButton: {
        marginTop: theme.spacing.sm,
    },
    dangerZone: {
        marginTop: theme.spacing.xl,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: theme.spacing.xl,
    }
});
