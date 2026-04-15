import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import InputField from '../components/InputField';
import Button from '../components/Button';
import AnimatedCard from '../components/AnimatedCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function OlvideContrasenya({ navigation }) {
    const [telefono, setTelefono] = useState('');
    const [loading, setLoading] = useState(false);
    const { requestPasswordReset } = useAuth();
    const { error: showError, success: showSuccess } = useToast();

    const handleRequestReset = async () => {
        if (!telefono.trim()) {
            showError('Por favor ingresa tu número de teléfono');
            return;
        }

        // Validar teléfono: mínimo 10 dígitos
        const telefonoDigitos = telefono.replace(/\D/g, '');
        if (telefonoDigitos.length < 10) {
            showError('El teléfono debe tener al menos 10 dígitos');
            return;
        }

        setLoading(true);
        try {
            const result = await requestPasswordReset(telefono.trim());
            showSuccess('Código enviado a tu WhatsApp');
            
            // Navegar a pantalla de verificación
            setTimeout(() => {
                navigation.navigate('VerificarCodigo', { telefono: telefono.trim() });
            }, 1500);
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || 'Error al enviar código';
            showError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Header title="Recuperar Contraseña" />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <AnimatedCard animation="fadeUp" delay={0} duration={500}>
                    <View style={styles.infoCard}>
                        <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
                        <Text style={styles.description}>
                            Ingresa tu número de teléfono y te enviaremos un código por WhatsApp para que recuperes tu acceso.
                        </Text>
                    </View>
                </AnimatedCard>

                <AnimatedCard animation="fadeUp" delay={100} duration={500}>
                    <View style={styles.section}>
                        <InputField
                            label="Número de teléfono"
                            value={telefono}
                            onChangeText={setTelefono}
                            placeholder="55 1234 5678"
                            keyboardType="phone-pad"
                            editable={!loading}
                        />
                    </View>
                </AnimatedCard>

                <AnimatedCard animation="fadeUp" delay={200} duration={500}>
                    <Button
                        title={loading ? "Enviando código..." : "Enviar Código"}
                        onPress={handleRequestReset}
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
    section: {
        marginBottom: theme.spacing.xl,
    },
    button: {
        marginBottom: theme.spacing.md,
    },
});
