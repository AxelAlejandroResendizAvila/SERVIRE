import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { theme } from '../theme/theme';
import Button from '../components/Button';
import InputField from '../components/InputField';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        // Navigate to Main App flow in a real app.
        // Assuming root navigator switches depending on auth state.
        // For UI demonstration, we might just navigate directly.
        navigation.replace('MainTabs');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>Servire</Text>
                </View>

                <Text style={styles.title}>Iniciar sesión</Text>
                <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

                <View style={styles.formContainer}>
                    <InputField
                        label="Correo electrónico"
                        placeholder="Introduce tu correo"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        icon={<Ionicons name="mail-outline" size={20} color={theme.colors.text.secondary} />}
                    />

                    <InputField
                        label="Contraseña"
                        placeholder="Introduce tu contraseña"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        icon={<Ionicons name="lock-closed-outline" size={20} color={theme.colors.text.secondary} />}
                    />

                    <Button
                        title="Entrar"
                        onPress={handleLogin}
                        style={styles.loginButton}
                    />

                    <Text style={styles.orText}>O</Text>

                    <Button
                        title="Entrar con Google"
                        variant="outline"
                        onPress={() => { }}
                        style={styles.googleButton}
                    />
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
    formContainer: {
        width: '100%',
    },
    loginButton: {
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
    }
});
