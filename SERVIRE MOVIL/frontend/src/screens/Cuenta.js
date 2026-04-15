import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../theme/theme';
import Header from '../components/Header';
import InputField from '../components/InputField';
import Button from '../components/Button';
import AnimatedCard from '../components/AnimatedCard';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Cuenta({ navigation }) {
    const { user, logout, changePassword, updateProfile, loading } = useAuth();
    const { error: showError, success: showSuccess } = useToast();
    
    // Estados para editar perfil
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState(user?.nombre || '');
    const [editPhone, setEditPhone] = useState(user?.telefono ? user.telefono.replace(/\D/g, '').slice(-10) : '');
    
    // Estados para cambiar contraseña
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [error, setError] = useState('');

    // Actualizar campos cuando cambia el usuario
    useEffect(() => {
        if (user) {
            setEditName(user.nombre || '');
            setEditPhone(user.telefono ? user.telefono.replace(/\D/g, '').slice(-10) : '');
        }
    }, [user]);

    // Extract user initials
    const getInitials = (nombre) => {
        if (!nombre) return 'U';
        const parts = nombre.trim().split(' ');
        return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
    };

    const handleChangePassword = async () => {
        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            showError('Por favor completa todos los campos');
            return;
        }

        if (newPassword !== confirmPassword) {
            showError('Las nuevas contraseñas no coinciden');
            return;
        }

        if (newPassword.length < 6) {
            showError('La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoadingPassword(true);
        setError('');

        try {
            await changePassword(currentPassword, newPassword);
            showSuccess('Contraseña actualizada correctamente');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || 'Error al cambiar contraseña';
            showError(errorMsg);
        } finally {
            setLoadingPassword(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!editName.trim() || !editPhone.trim()) {
            showError('Por favor completa todos los campos');
            return;
        }

        // Validar teléfono: mínimo 10 dígitos
        const telefonoDigitos = editPhone.replace(/\D/g, '');
        if (telefonoDigitos.length < 10) {
            showError('El teléfono debe tener al menos 10 dígitos');
            return;
        }

        setLoadingPassword(true);
        try {
            await updateProfile(editName.trim(), editPhone.trim());
            showSuccess('Perfil actualizado correctamente');
            setIsEditingProfile(false);
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || 'Error al actualizar perfil';
            showError(errorMsg);
        } finally {
            setLoadingPassword(false);
        }
    };

    const handleLogout = async () => {
        // Simple logout sin confirmación (confirmación con botones)
        showSuccess('Cerrando sesión...');
        await logout();
        setTimeout(() => {
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        }, 500);
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

                <AnimatedCard animation="fadeUp" delay={0} duration={500}>
                    <View style={styles.profileHeader}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{getInitials(user.nombre)}</Text>
                        </View>
                        <Text style={styles.profileName}>{user.nombre}</Text>
                        <Text style={styles.profileEmail}>{user.email}</Text>
                        {user.rol && (
                            <View style={[
                                styles.roleBadge, 
                                user.rol === 'admin' ? styles.adminBadge : user.rol === 'operador' ? styles.operadorBadge : styles.userBadge
                            ]}>
                                <Ionicons 
                                    name={user.rol === 'admin' ? "shield-checkmark" : user.rol === 'operador' ? "briefcase" : "person"} 
                                    size={12} 
                                    color={user.rol === 'admin' ? "#fff" : user.rol === 'operador' ? "#fff" : theme.colors.text.secondary} 
                                    style={{ marginRight: 4 }}
                                />
                                <Text style={[
                                    styles.roleText,
                                    user.rol === 'admin' ? styles.adminText : user.rol === 'operador' ? styles.operadorText : styles.userText
                                ]}>
                                    {user.rol === 'admin' ? 'Administrador' : user.rol === 'operador' ? 'Operador' : 'Usuario'}
                                </Text>
                            </View>
                        )}
                    </View>
                </AnimatedCard>

                <AnimatedCard animation="fadeUp" delay={100} duration={500}>
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Información personal</Text>
                            {!isEditingProfile && (
                                <TouchableOpacity onPress={() => {
                                    setEditName(user.nombre);
                                    setEditPhone(user.telefono ? user.telefono.replace(/\D/g, '').slice(-10) : '');
                                    setIsEditingProfile(true);
                                }}>
                                    <Ionicons name="pencil" size={20} color={theme.colors.primary} />
                                </TouchableOpacity>
                            )}
                        </View>
                        
                        {isEditingProfile ? (
                            <>
                                <AnimatedCard animation="fadeUp" delay={110} duration={500}>
                                    <InputField
                                        label="Nombre completo"
                                        value={editName}
                                        onChangeText={setEditName}
                                        placeholder="Tu nombre"
                                        editable={!loadingPassword}
                                    />
                                </AnimatedCard>
                                <AnimatedCard animation="fadeUp" delay={120} duration={500}>
                                    <InputField
                                        label="Teléfono"
                                        value={editPhone}
                                        onChangeText={setEditPhone}
                                        placeholder="10 dígitos ej: 5512345678"
                                        keyboardType="phone-pad"
                                        editable={!loadingPassword}
                                    />
                                </AnimatedCard>
                                <View style={styles.editButtonsContainer}>
                                    <Button
                                        title={loadingPassword ? "Guardando..." : "Guardar"}
                                        onPress={handleSaveProfile}
                                        style={styles.saveButton}
                                        disabled={loadingPassword}
                                    />
                                    <Button
                                        title="Cancelar"
                                        onPress={() => setIsEditingProfile(false)}
                                        variant="outline"
                                        style={styles.cancelButton}
                                        disabled={loadingPassword}
                                    />
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={styles.infoField}>
                                    <Text style={styles.infoLabel}>Nombre completo</Text>
                                    <Text style={styles.infoValue}>{user.nombre}</Text>
                                </View>
                                <View style={styles.infoField}>
                                    <Text style={styles.infoLabel}>Correo electrónico</Text>
                                    <Text style={styles.infoValue}>{user.email}</Text>
                                </View>
                                <View style={styles.infoField}>
                                    <Text style={styles.infoLabel}>Teléfono</Text>
                                    <Text style={styles.infoValue}>{user.telefono || 'No registrado'}</Text>
                                </View>
                            </>
                        )}
                    </View>
                </AnimatedCard>

                <AnimatedCard animation="fadeUp" delay={200} duration={500}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Seguridad</Text>
                        <AnimatedCard animation="fadeUp" delay={250} duration={500}>
                            <InputField
                                label="Contraseña actual"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry
                                placeholder="Ingresa tu contraseña actual"
                                editable={!loadingPassword}
                            />
                        </AnimatedCard>
                        <AnimatedCard animation="fadeUp" delay={300} duration={500}>
                            <InputField
                                label="Nueva contraseña"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                placeholder="Ingresa tu nueva contraseña"
                                editable={!loadingPassword}
                            />
                        </AnimatedCard>
                        <AnimatedCard animation="fadeUp" delay={350} duration={500}>
                            <InputField
                                label="Confirmar nueva contraseña"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                placeholder="Confirma tu nueva contraseña"
                                editable={!loadingPassword}
                            />
                        </AnimatedCard>
                        <AnimatedCard animation="fadeUp" delay={400} duration={500}>
                            <Button
                                title={loadingPassword ? "Actualizando..." : "Actualizar contraseña"}
                                onPress={handleChangePassword}
                                style={styles.saveButton}
                                disabled={loadingPassword}
                            />
                        </AnimatedCard>
                        <AnimatedCard animation="fadeUp" delay={450} duration={500}>
                            <TouchableOpacity onPress={() => navigation.navigate('OlvideContrasenya')}>
                                <Text style={styles.forgotPasswordLink}>¿Olvidaste tu contraseña?</Text>
                            </TouchableOpacity>
                        </AnimatedCard>
                    </View>
                </AnimatedCard>

                <AnimatedCard animation="fadeUp" delay={450} duration={500}>
                    <View style={[styles.section, styles.dangerZone]}>
                        <Button
                            title="Cerrar sesión"
                            variant="dangerOutline"
                            onPress={handleLogout}
                            disabled={loading}
                        />
                    </View>
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
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
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
        color: '#fff',
        fontWeight: 'bold',
    },
    infoField: {
        marginVertical: theme.spacing.md,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text.primary,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.background,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border || '#e0e0e0',
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
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        ...theme.typography.subheader,
        color: theme.colors.secondary,
        flex: 1,
    },
    saveButton: {
        flex: 1,
    },
    editButtonsContainer: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
    },
    cancelButton: {
        flex: 1,
    },
    dangerZone: {
        marginTop: theme.spacing.xl,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: theme.spacing.xl,
        marginHorizontal: -theme.spacing.lg,
        marginBottom: -theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.lg,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginTop: 8,
        borderWidth: 1,
    },
    adminBadge: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    operadorBadge: {
        backgroundColor: '#FF9800',
        borderColor: '#FF9800',
    },
    userBadge: {
        backgroundColor: '#f0f0f0',
        borderColor: '#e0e0e0',
    },
    roleText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    adminText: {
        color: '#fff',
    },
    operadorText: {
        color: '#fff',
    },
    userText: {
        color: theme.colors.text.secondary,
    },
    forgotPasswordLink: {
        textAlign: 'center',
        color: theme.colors.secondary,
        fontSize: 14,
        fontWeight: '600',
        marginTop: theme.spacing.md,
        textDecorationLine: 'underline',
    }
});
