import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import InputField from '../components/InputField';
import Button from '../components/Button';
import AnimatedCard from '../components/AnimatedCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function VerificarCodigo({ navigation, route }) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(900); // 15 minutos
    const telefono = route?.params?.telefono;
    const { verifyResetCode } = useAuth();
    const { error: showError, success: showSuccess } = useToast();

    // Timer countdown
    useEffect(() => {
        const interval = setInterval(() => {
            setTimer(prev => {
                if (prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleVerifyCode = async () => {
        if (!code.trim()) {
            showError('Por favor ingresa el código');
            return;
        }

        if (code.length !== 6) {
            showError('El código debe tener 6 dígitos');
            return;
        }

        setLoading(true);
        try {
            const result = await verifyResetCode(telefono, code);
            showSuccess('Código verificado');
            
            // Navegar a cambiar contraseña con el resetToken
            setTimeout(() => {
                navigation.navigate('CambiarContrasenya', {
                    telefono,
                    resetToken: result.resetToken,
                });
            }, 1500);
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || 'Error al verificar código';
            showError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (!telefono) {
        return (
            <View style={styles.container}>
                <Header title="Verificar Código" />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Error: Datos inválidos</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header title="Verificar Código" />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <AnimatedCard animation="fadeUp" delay={0} duration={500}>
                    <View style={styles.infoCard}>
                        <Text style={styles.title}>Ingresa el Código</Text>
                        <Text style={styles.description}>
                            Hemos enviado un código de 6 dígitos a tu WhatsApp.
                            {'\n'}
                            {`Teléfono: ${telefono}`}
                        </Text>
                        <Text style={styles.timer}>
                            Expira en: {formatTime(timer)}
                        </Text>
                    </View>
                </AnimatedCard>

                <AnimatedCard animation="fadeUp" delay={100} duration={500}>
                    <View style={styles.section}>
                        <InputField
                            label="Código de 6 dígitos"
                            value={code}
                            onChangeText={setCode}
                            placeholder="000000"
                            keyboardType="number-pad"
                            maxLength={6}
                            editable={!loading && timer > 0}
                        />
                    </View>
                </AnimatedCard>

                <AnimatedCard animation="fadeUp" delay={200} duration={500}>
                    <Button
                        title={loading ? "Verificando..." : "Verificar Código"}
                        onPress={handleVerifyCode}
                        disabled={loading || timer === 0}
                        style={styles.button}
                    />
                </AnimatedCard>

                <AnimatedCard animation="fadeUp" delay={300} duration={500}>
                    <Button
                        title="Volver"
                        onPress={() => navigation.goBack()}
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
        backgroundColor: theme.colors.primary + '10',
        borderRadius: 12,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
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
        marginBottom: theme.spacing.sm,
    },
    timer: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.error,
        marginTop: theme.spacing.sm,
    },
    section: {
        marginBottom: theme.spacing.xl,
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
