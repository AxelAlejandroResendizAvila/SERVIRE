import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { theme } from '../theme/theme';
import Button from '../components/Button';
import InputField from '../components/InputField';
import { Ionicons } from '@expo/vector-icons';

export default function RegistroScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = () => {
        // Move back to login after registration
        navigation.navigate('Login');
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

                <Text style={styles.title}>Crea una cuenta</Text>
                <Text style={styles.subtitle}>Crea una cuenta para empezar a reservar espacios.</Text>

                <View style={styles.formContainer}>
                    <InputField
                        label="Nombre completo"
                        placeholder="John Doe"
                        value={name}
                        onChangeText={setName}
                        icon={<Ionicons name="person-outline" size={20} color={theme.colors.text.secondary} />}
                    />

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
                        title="Registrarse"
                        onPress={handleRegister}
                        style={styles.registerButton}
                    />

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
    registerButton: {
        marginTop: theme.spacing.md,
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
