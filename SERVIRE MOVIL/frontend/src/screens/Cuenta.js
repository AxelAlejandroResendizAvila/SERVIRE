import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import InputField from '../components/InputField';
import Button from '../components/Button';

export default function Cuenta({ navigation }) {
    const [name, setName] = useState('Juan Pérez');
    const [email, setEmail] = useState('juan.perez@ejemplo.com');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleLogout = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'AuthStack' }],
        });
    };

    return (
        <View style={styles.container}>
            <Header title="Cuenta" />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>JP</Text>
                    </View>
                    <Text style={styles.profileName}>Juan Pérez</Text>
                    <Text style={styles.profileEmail}>juan.perez@ejemplo.com</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información personal</Text>
                    <InputField
                        label="Nombre completo"
                        value={name}
                        onChangeText={setName}
                    />
                    <InputField
                        label="Correo electrónico"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                    />
                    <Button
                        title="Guardar cambios"
                        onPress={() => { }}
                        style={styles.saveButton}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Seguridad</Text>
                    <InputField
                        label="Contraseña actual"
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        secureTextEntry
                    />
                    <InputField
                        label="Nueva contraseña"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                    />
                    <Button
                        title="Actualizar contraseña"
                        onPress={() => { }}
                        style={styles.saveButton}
                    />
                </View>

                <View style={[styles.section, styles.dangerZone]}>
                    <Button
                        title="Cerrar sesión"
                        variant="dangerOutline"
                        onPress={handleLogout}
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
