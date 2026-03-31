import React, { useState, useEffect } from 'react';
import { Search, Shield, ShieldAlert, ShieldOff, RefreshCw, Mail, Phone, Users as UsersIcon, Lock } from 'lucide-react';
import Button from '../components/UI/Button';
import { getUsers, updateUserRole } from '../services/api';
import { useAuth } from '../context/AuthContext';

const UserManagement = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Cuenta cuántos admins hay en total
    const adminCount = users.filter(u => u.rol === 'admin').length;

    // Determina si el botón debe estar deshabilitado y por qué
    const getButtonState = (user) => {
        const isSelf = user.id === currentUser?.id;
        const isOnlyAdmin = user.rol === 'admin' && adminCount <= 1;

        if (isSelf) {
            return { disabled: true, reason: 'No puedes modificar tu propio rol' };
        }
        if (isOnlyAdmin) {
            return { disabled: true, reason: 'Debe haber al menos un administrador' };
        }
        return { disabled: false, reason: null };
    };

    const handleRoleChange = async (user) => {
        const { disabled, reason } = getButtonState(user);
        if (disabled) return;

        const newRole = user.rol === 'admin' ? 'usuario' : 'admin';
        const confirmMsg = user.rol === 'admin'
            ? `¿Quitar permisos de administrador a ${user.nombre}? Pasará a ser usuario normal.`
            : `¿Dar permisos de administrador a ${user.nombre}? Podrá gestionar espacios y reservas.`;

        if (!window.confirm(confirmMsg)) return;

        setActionLoading(user.id);
        try {
            await updateUserRole(user.id, newRole);
            await fetchUsers();
        } catch (error) {
            alert(error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredUsers = users.filter(u => {
        const str = `${u.nombre} ${u.email} ${u.rol}`.toLowerCase();
        return str.includes(searchQuery.toLowerCase());
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Gestión de Usuarios</h1>
                    <p className="text-gray-500 mt-1">
                        Busca usuarios y administra sus permisos de acceso.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                        />
                    </div>
                    <Button variant="outline" onClick={fetchUsers} disabled={loading} className="shrink-0 w-full sm:w-auto">
                        <RefreshCw size={16} className={`mr-1 ${loading ? 'animate-spin' : ''}`} /> Actualizar
                    </Button>
                </div>
            </div>

            {/* Info estadística */}
            <div className="flex gap-4">
                <div className="bg-primary/10 border border-primary/20 rounded-card px-4 py-3 flex items-center gap-2">
                    <Shield size={16} className="text-primary" />
                    <span className="text-sm font-medium text-primary">{adminCount} administrador{adminCount !== 1 ? 'es' : ''}</span>
                </div>
                <div className="bg-gray-100 border border-gray-200 rounded-card px-4 py-3 flex items-center gap-2">
                    <UsersIcon size={16} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">{users.length - adminCount} usuario{(users.length - adminCount) !== 1 ? 's' : ''}</span>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="bg-white rounded-card shadow-sm border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface text-gray-600 text-sm font-medium border-b border-border">
                                    <th className="py-3 px-6">Usuario</th>
                                    <th className="py-3 px-6">Contacto</th>
                                    <th className="py-3 px-6">Rol Actual</th>
                                    <th className="py-3 px-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => {
                                    const { disabled, reason } = getButtonState(user);
                                    const isSelf = user.id === currentUser?.id;

                                    return (
                                        <tr key={user.id} className={`border-b border-border transition-colors ${isSelf ? 'bg-primary/5' : 'hover:bg-gray-50'}`}>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold mr-3 text-sm ${
                                                        user.rol === 'admin' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        {user.nombre.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-secondary">{user.nombre}</span>
                                                            {isSelf && (
                                                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium border border-primary/20">
                                                                    Tú
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center text-xs text-gray-400 mt-0.5">
                                                            <Mail size={12} className="mr-1" /> {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Phone size={14} className="mr-1.5 text-gray-400" />
                                                    {user.telefono || 'Sin teléfono'}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center">
                                                    {user.rol === 'admin' ? (
                                                        <div className="flex items-center text-primary font-bold text-xs uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                                                            <Shield size={13} className="mr-1.5" />
                                                            Administrador
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center text-gray-500 font-medium text-xs uppercase tracking-wider bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                                                            <UsersIcon size={13} className="mr-1.5" />
                                                            Usuario
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {reason && (
                                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Lock size={12} />
                                                            {reason}
                                                        </span>
                                                    )}
                                                    <Button
                                                        variant={user.rol === 'admin' ? 'outline' : 'primary'}
                                                        size="sm"
                                                        onClick={() => handleRoleChange(user)}
                                                        disabled={disabled || actionLoading === user.id}
                                                        className={`min-w-[140px] ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                        title={reason || ''}
                                                    >
                                                        {actionLoading === user.id ? (
                                                            <RefreshCw size={14} className="animate-spin mr-2" />
                                                        ) : user.rol === 'admin' ? (
                                                            <><ShieldOff size={14} className="mr-2" /> Quitar Admin</>
                                                        ) : (
                                                            <><Shield size={14} className="mr-2" /> Hacer Admin</>
                                                        )}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="py-12 text-center text-gray-400">
                                            <UsersIcon size={40} className="mx-auto mb-3 opacity-50" />
                                            <p className="font-medium">No se encontraron usuarios</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
