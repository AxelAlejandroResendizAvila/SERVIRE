import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import InputField from '../components/InputField';
import Button from '../components/Button';
import AnimatedCard from '../components/AnimatedCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function CambiarContrasenya({ navigation, route }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { telefono, resetToken } = route?.params || {};
    const { resetPassword } = useAuth();
    const { error: showError, success: showSuccess } = useToast();

    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            showError('Por favor completa todos los campos');
            return;
        }

        if (newPassword !== confirmPassword) {
            showError('Las contraseñas no coinciden');
            return;
        }

        if (newPassword.length < 6) {
            showError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(telefono, newPassword, confirmPassword, resetToken);
            showSuccess('Contraseña actualizada correctamente');
            
            // Navegar a login después de 1.5 segundos
            setTimeout(() => {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            }, 1500);
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || 'Error al cambiar contraseña';
            showError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (!telefono || !resetToken) {
        return (
            <View style={styles.container}>
                <Header title="Cambiar Contraseña" />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Error: Datos inválidos</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header title="Cambiar Contraseña" />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <AnimatedCard animation="fadeUp" delay={0} duration={500}>
                    <View style={styles.infoCard}>
                        <Text style={styles.title}>Nueva Contraseña</Text>
                        <Text style={styles.description}>
                            Ingresa una nueva contraseña segura para tu cuenta.
                            Mínimo 6 caracteres.
                        </Text>
                    </View>
                </AnimatedCard>

                <AnimatedCard animation="fadeUp" delay={100} duration={500}>
                    <InputField
                        label="Nueva contraseña"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showPassword}
                        placeholder="Ingresa tu nueva contraseña"
                        editable={!loading}
                    />
                </AnimatedCard>

                <AnimatedCard animation="fadeUp" delay={150} duration={500}>
                    <InputField
                        label="Confirmar contraseña"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showPassword}
                        placeholder="Confirma tu nueva contraseña"
                        editable={!loading}
                    />
                </AnimatedCard>

                <AnimatedCard animation="fadeUp" delay={200} duration={500}>
                    <Button
                        title={loading ? "Actualizando..." : "Actualizar Contraseña"}
                        onPress={handleResetPassword}
                        disabled={loading}
                        style={styles.button}
                    />
                </AnimatedCard>

                <AnimatedCard animation="fadeUp" delay={300} duration={500}>
                    <Button
                        title="Volver a Login"
                        onPress={() => navigation.navigate('Login')}
                        variant="outline"
                        disabled={loading}
                    />
                </AnimatedCard>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    infoCard: {
        backgroundColor: theme.colors.secondary + '10',
        borderRadius: 12,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.secondary,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    description: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        lineHeight: 20,
    },
    button: {
        marginBottom: theme.spacing.md,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: theme.colors.error,
        fontSize: 16,
    },
});
