import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../theme/theme';
import Button from '../components/Button';
import InputField from '../components/InputField';
import AnimatedCard from '../components/AnimatedCard';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import LogoSVG from '../components/LogoSVG';
import { useToast } from '../context/ToastContext';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const { error: showError } = useToast();

    const handleLogin = async () => {
        // Validación
        if (!email || !password) {
            showError('Por favor completa todos los campos');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.toLowerCase())) {
            showError('Por favor ingresa un correo electrónico válido');
            return;
        }


        setLoading(true);
        setError('');

        try {
            const response = await login(email, password);
            
            if (response.token && response.usuario) {
                // Login exitoso
                navigation.replace('MainTabs');
            } else {
                setError('Error en la respuesta del servidor');
            }
        } catch (err) {
            showError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.logoContainer}>
                    <LogoSVG size={80} />
                </View>

                <Text style={styles.title}>Iniciar sesión</Text>
                <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

                {error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                <View style={styles.formContainer}>
                    <AnimatedCard animation="fadeUp" delay={100} duration={500}>
                        <InputField
                            label="Correo electrónico"
                            placeholder="Introduce tu correo"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            icon={<Ionicons name="mail-outline" size={20} color={theme.colors.text.secondary} />}
                            editable={!loading}
                        />
                    </AnimatedCard>

                    <AnimatedCard animation="fadeUp" delay={200} duration={500}>
                        <InputField
                            label="Contraseña"
                            placeholder="Introduce tu contraseña"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            icon={<Ionicons name="lock-closed-outline" size={20} color={theme.colors.text.secondary} />}
                            rightIcon={
                                <Ionicons
                                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                                    size={20}
                                    color={theme.colors.text.secondary}
                                />
                            }
                            onRightIconPress={() => setShowPassword(!showPassword)}
                            editable={!loading}
                        />
                    </AnimatedCard>

                    <AnimatedCard animation="fadeUp" delay={300} duration={500}>
                        <Button
                            title={loading ? "Cargando..." : "Entrar"}
                            onPress={handleLogin}
                            style={styles.loginButton}
                            disabled={loading}
                        />
                    </AnimatedCard>

                    {loading && <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />}

                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
                    <Text
                        style={styles.footerLink}
                        onPress={() => navigation.navigate('Registro')}
                    >
                        Regístrate aquí
                    </Text>
                </View>

                <View style={styles.forgotPasswordContainer}>
                    <Text
                        style={styles.footerLink}
                        onPress={() => navigation.navigate('OlvideContrasenya')}
                    >
                        ¿Olvidaste tu contraseña?
                    </Text>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: theme.spacing.lg,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        justifyContent: 'center',
    },
    logoText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    title: {
        ...theme.typography.header,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        ...theme.typography.body,
        marginBottom: theme.spacing.xl,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.error || '#dc3545',
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderRadius: 4,
    },
    errorText: {
        color: theme.colors.error || '#dc3545',
        marginLeft: theme.spacing.md,
        flex: 1,
    },
    formContainer: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    loginButton: {
        marginTop: theme.spacing.md,
    },
    loader: {
        marginTop: theme.spacing.md,
    },
    orText: {
        textAlign: 'center',
        color: theme.colors.text.secondary,
        marginVertical: theme.spacing.md,
    },
    googleButton: {
        marginBottom: theme.spacing.xl,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 'auto',
    },
    footerText: {
        color: theme.colors.text.secondary,
    },
    footerLink: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    forgotPasswordContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.md,
    }
});
