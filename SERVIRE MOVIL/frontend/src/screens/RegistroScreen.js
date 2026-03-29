import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { theme } from '../theme/theme';
import Button from '../components/Button';
import InputField from '../components/InputField';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import LogoSVG from '../components/LogoSVG';

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
    const { register } = useAuth();

    const handleRegister = async () => {
        // Validación
        if (!nombre || !apellidos || !email || !password || !confirmPassword) {
            setError('Por favor completa todos los campos');
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@(upq\.mx|upq\.edu\.mx)$/;
        if (!emailRegex.test(email.toLowerCase())) {
            setError('Por favor usa tu correo institucional (@upq.mx o @upq.edu.mx)');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await register(nombre, apellidos, email, password, telefono);

            if (response.token && response.usuario) {
                Alert.alert('Éxito', 'Te has registrado correctamente. ¡Bienvenido!');
                navigation.replace('MainTabs');
            } else {
                setError('Error en la respuesta del servidor');
            }
        } catch (err) {
            setError(err.message || 'Error al registrarse');
            Alert.alert('Error', err.message || 'Error al registrarse');
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
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                <View style={styles.formContainer}>
                    <InputField
                        label="Nombre"
                        placeholder="John"
                        value={nombre}
                        onChangeText={setNombre}
                        icon={<Ionicons name="person-outline" size={20} color={theme.colors.text.secondary} />}
                        editable={!loading}
                    />

                    <InputField
                        label="Apellidos"
                        placeholder="Doe"
                        value={apellidos}
                        onChangeText={setApellidos}
                        icon={<Ionicons name="person-outline" size={20} color={theme.colors.text.secondary} />}
                        editable={!loading}
                    />

                    <InputField
                        label="Correo electrónico"
                        placeholder="john@example.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        icon={<Ionicons name="mail-outline" size={20} color={theme.colors.text.secondary} />}
                        editable={!loading}
                    />

                    <InputField
                        label="Teléfono (opcional)"
                        placeholder="+34 123 456 789"
                        value={telefono}
                        onChangeText={setTelefono}
                        keyboardType="phone-pad"
                        icon={<Ionicons name="call-outline" size={20} color={theme.colors.text.secondary} />}
                        editable={!loading}
                    />

                    <InputField
                        label="Contraseña"
                        placeholder="Mínimo 6 caracteres"
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

                    <InputField
                        label="Confirmar contraseña"
                        placeholder="Repite tu contraseña"
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

                    <Button
                        title={loading ? "Registrando..." : "Registrarse"}
                        onPress={handleRegister}
                        style={styles.registerButton}
                        disabled={loading}
                    />

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
