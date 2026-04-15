import React, { useState, useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { theme } from '../theme/theme';
import Button from '../components/Button';
import InputField from '../components/InputField';
import AnimatedCard from '../components/AnimatedCard';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import LogoSVG from '../components/LogoSVG';
import { useToast } from '../context/ToastContext';

export default function RegistroScreen({ navigation }) {
    const [nombre, setNombre] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [telefono, setTelefono] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const { register } = useAuth();
    const { error: showError } = useToast();

    // Animación shake cuando hay error
    useEffect(() => {
        if (error) {
            shakeAnim.setValue(0);
            Animated.sequence([
                Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
                Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
            ]).start();
        }
    }, [error, shakeAnim]);

    const handleRegister = async () => {
        // Validación
        if (!nombre || !apellidos || !email || !password || !confirmPassword || !telefono) {
            showError('Por favor completa todos los campos');
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@(upq\.mx|upq\.edu\.mx)$/;
        if (!emailRegex.test(email.toLowerCase())) {
            showError('Por favor usa tu correo institucional (@upq.mx o @upq.edu.mx)');
            return;
        }

        // Validar que no sea solo números (evitar matrículas como "124049803@upq.mx")
        const emailPart = email.split('@')[0];
        if (/^\d+$/.test(emailPart)) {
            showError('No puedes usar solo números (matrículas) como correo');
            return;
        }

        if (password !== confirmPassword) {
            showError('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            showError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        // Validar teléfono: mínimo 10 dígitos
        const telefonoDigitos = telefono.replace(/\D/g, '');
        if (telefonoDigitos.length < 10) {
            showError('El teléfono debe tener al menos 10 dígitos');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await register(nombre, apellidos, email, password, telefono);

            if (response.token && response.usuario) {
                navigation.replace('MainTabs');
            } else {
                setError('Error en la respuesta del servidor');
            }
        } catch (err) {
            showError(err.message || 'Error al registrarse');
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

                <Text style={styles.title}>Crea una cuenta</Text>
                <Text style={styles.subtitle}>Crea una cuenta para empezar a reservar espacios.</Text>

                {error ? (
                    <Animated.View style={[styles.errorContainer, { transform: [{ translateX: shakeAnim }] }]}>
                        <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </Animated.View>
                ) : null}

                <View style={styles.formContainer}>
                    <AnimatedCard animation="fadeUp" delay={100} duration={500}>
                        <InputField
                            label="Nombre"
                            placeholder="John"
                            value={nombre}
                            onChangeText={setNombre}
                            icon={<Ionicons name="person-outline" size={20} color={theme.colors.text.secondary} />}
                            editable={!loading}
                        />
                    </AnimatedCard>

                    <AnimatedCard animation="fadeUp" delay={150} duration={500}>
                        <InputField
                            label="Apellidos"
                            placeholder="Doe"
                            value={apellidos}
                            onChangeText={setApellidos}
                            icon={<Ionicons name="person-outline" size={20} color={theme.colors.text.secondary} />}
                            editable={!loading}
                        />
                    </AnimatedCard>

                    <AnimatedCard animation="fadeUp" delay={200} duration={500}>
                        <InputField
                            label="Correo"
                            placeholder="john@upq.mx o john@upq.edu.mx"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            icon={<Ionicons name="mail-outline" size={20} color={theme.colors.text.secondary} />}
                            editable={!loading}
                        />
                    </AnimatedCard>

                    <AnimatedCard animation="fadeUp" delay={250} duration={500}>
                        <InputField
                            label="Telefono"
                            placeholder="+52 442 456 789"
                            value={telefono}
                            onChangeText={setTelefono}
                            keyboardType="phone-pad"
                            icon={<Ionicons name="call-outline" size={20} color={theme.colors.text.secondary} />}
                            editable={!loading}
                        />
                    </AnimatedCard>

                    <AnimatedCard animation="fadeUp" delay={300} duration={500}>
                        <InputField
                            label="Contrasena"
                            placeholder="Minimo 6 caracteres"
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

                    <AnimatedCard animation="fadeUp" delay={350} duration={500}>
                        <InputField
                            label="Confirmar"
                            placeholder="Repite tu contrasena"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            icon={<Ionicons name="lock-closed-outline" size={20} color={theme.colors.text.secondary} />}
                            rightIcon={
                                <Ionicons
                                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                                    size={20}
                                    color={theme.colors.text.secondary}
                                />
                            }
                            onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            editable={!loading}
                        />
                    </AnimatedCard>

                    <AnimatedCard animation="fadeUp" delay={400} duration={500}>
                        <Button
                            title={loading ? "Registrando..." : "Registrarse"}
                            onPress={handleRegister}
                            style={styles.registerButton}
                            disabled={loading}
                        />
                    </AnimatedCard>

                    {loading && <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />}

                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                    <Text
                        style={styles.footerLink}
                        onPress={() => navigation.navigate('Login')}
                    >
                        Inicia sesión aquí
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
    registerButton: {
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.xl,
    },
    loader: {
        marginTop: theme.spacing.md,
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
    }
});
