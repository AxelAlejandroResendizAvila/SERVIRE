import React, { useState, useEffect } from 'react';
import { 
    Search, Shield, ShieldAlert, ShieldOff, RefreshCw, Mail, 
    Phone, Users as UsersIcon, Lock, Ban, Trash2, X, AlertTriangle, Eye, EyeOff 
} from 'lucide-react';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import { 
    getUsers, toggleOperador, transferAdmin, toggleBlockUser, deleteUser 
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const UserManagement = () => {
    const { user: currentUser, logout } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('Todos');
    const [actionLoading, setActionLoading] = useState(null);
    
    // Modal states
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferTarget, setTransferTarget] = useState(null);
    const [transferPassword, setTransferPassword] = useState('');
    const [transferPhrase, setTransferPhrase] = useState('');
    const [showTransferPassword, setShowTransferPassword] = useState(false);
    const [transferLoading, setTransferLoading] = useState(false);

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

    const isAdmin = currentUser?.rol === 'admin';
    const isOperador = currentUser?.rol === 'operador';

    const handleToggleOperador = async (user) => {
        if (!isAdmin) return;
        if (user.id === currentUser.id) return;
        
        setActionLoading(user.id);
        try {
            await toggleOperador(user.id);
            await fetchUsers();
        } catch (error) {
            alert(error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleBlock = async (user) => {
        if (!isAdmin && !isOperador) return;
        if (user.rol === 'admin') return; // Cannot block admin
        if (isOperador && user.rol === 'operador') return; // Operators cannot block other operators
        if (user.id === currentUser.id) return;

        setActionLoading(user.id);
        try {
            await toggleBlockUser(user.id);
            await fetchUsers();
        } catch (error) {
            alert(error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (user) => {
        if (!isAdmin) return;
        if (user.id === currentUser.id) return;
        if (user.rol === 'admin') return;

        if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente la cuenta de ${user.nombre}? Esta acción no se puede deshacer.`)) return;

        setActionLoading(user.id);
        try {
            await deleteUser(user.id);
            await fetchUsers();
        } catch (error) {
            alert(error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleOpenTransfer = (user) => {
        setTransferTarget(user);
        setShowTransferModal(true);
        setTransferPassword('');
        setTransferPhrase('');
    };

    const handleTransferAdmin = async (e) => {
        e.preventDefault();
        if (!transferTarget) return;

        setTransferLoading(true);
        try {
            const res = await transferAdmin(transferTarget.id, transferPassword, transferPhrase);
            alert(res.mensaje);
            logout(); // Session closes after transferring admin
        } catch (error) {
            alert(error.message);
        } finally {
            setTransferLoading(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const str = `${u.nombre} ${u.email} ${u.rol}`.toLowerCase();
        const matchesSearch = str.includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'Todos' || u.rol === filterRole.toLowerCase();
        return matchesSearch && matchesRole;
    });

    const adminCount = users.filter(u => u.rol === 'admin').length;
    const operatorCount = users.filter(u => u.rol === 'operador').length;

    return (
        <div className="space-y-6 relative">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Gestión de Usuarios</h1>
                    <p className="text-gray-500 mt-1">
                        {isAdmin ? 'Administra roles, bloquea cuentas y gestiona permisos.' : 'Gestiona y bloquea cuentas de usuario.'}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar usuario..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                        />
                    </div>
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="px-4 py-2 border border-border rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white w-full sm:w-auto"
                    >
                        <option value="Todos">Todos los roles</option>
                        <option value="Admin">Administrador</option>
                        <option value="Operador">Operador</option>
                        <option value="Usuario">Usuario</option>
                    </select>
                    <Button variant="outline" onClick={fetchUsers} disabled={loading} className="shrink-0 w-full sm:w-auto">
                        <RefreshCw size={16} className={`mr-1 ${loading ? 'animate-spin' : ''}`} /> Actualizar
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap gap-4">
                <div className="bg-primary/10 border border-primary/20 rounded-card px-4 py-3 flex items-center gap-2">
                    <Shield size={16} className="text-primary" />
                    <span className="text-sm font-medium text-primary">{adminCount} Administrador</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-card px-4 py-3 flex items-center gap-2">
                    <ShieldAlert size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">{operatorCount} Operador{operatorCount !== 1 ? 'es' : ''}</span>
                </div>
                <div className="bg-gray-100 border border-gray-200 rounded-card px-4 py-3 flex items-center gap-2">
                    <UsersIcon size={16} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">{users.length - adminCount - operatorCount} Usuario{(users.length - adminCount - operatorCount) !== 1 ? 's' : ''}</span>
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
                                    <th className="py-3 px-6">Estado</th>
                                    <th className="py-3 px-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => {
                                    const isSelf = user.id === currentUser?.id;
                                    const canManageRole = isAdmin && !isSelf;
                                    // Admin puede bloquear/desbloquear cualquiera (excepto admin)
                                    // Operador puede bloquear/desbloquear usuarios (no operadores/admin)
                                    const canBlock = (isAdmin || isOperador)
                                        && user.rol !== 'admin'
                                        && !(isOperador && user.rol === 'operador')
                                        && !isSelf;
                                    const canDelete = isAdmin && user.rol !== 'admin' && !isSelf;

                                    return (
                                        <tr key={user.id} className={`border-b border-border transition-colors ${isSelf ? 'bg-primary/5' : 'hover:bg-gray-50'} ${user.bloqueado ? 'opacity-75' : ''}`}>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold mr-3 text-sm ${
                                                        user.rol === 'admin' ? 'bg-primary text-white' : 
                                                        user.rol === 'operador' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        {user.nombre.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-secondary">{user.nombre}</span>
                                                            {isSelf && (
                                                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium border border-primary/20">Tú</span>
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
                                                            <Shield size={13} className="mr-1.5" /> Admin
                                                        </div>
                                                    ) : user.rol === 'operador' ? (
                                                        <div className="flex items-center text-blue-600 font-bold text-xs uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                                                            <ShieldAlert size={13} className="mr-1.5" /> Operador
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center text-gray-500 font-medium text-xs uppercase tracking-wider bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                                                            <UsersIcon size={13} className="mr-1.5" /> Usuario
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                {user.bloqueado ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                                                        <Ban size={12} /> BLOQUEADO
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                                                        Activo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Admin only: Roles */}
                                                    {isAdmin && user.rol !== 'admin' && !isSelf && (
                                                        <>
                                                            <Button 
                                                                variant="outline" size="sm" 
                                                                onClick={() => handleToggleOperador(user)}
                                                                className="h-8 px-2 flex items-center justify-center"
                                                                title={user.rol === 'operador' ? 'Quitar rol Operador' : 'Hacer Operador'}
                                                                disabled={actionLoading === user.id}
                                                            >
                                                                <ShieldAlert size={14} className={user.rol === 'operador' ? 'text-blue-600' : 'text-gray-400'} />
                                                            </Button>
                                                            <Button 
                                                                variant="outline" size="sm" 
                                                                onClick={() => handleOpenTransfer(user)}
                                                                className="h-8 px-2 flex items-center justify-center"
                                                                title="Transferir Administrador"
                                                                disabled={actionLoading === user.id || user.bloqueado}
                                                            >
                                                                <Shield size={14} className="text-primary" />
                                                            </Button>
                                                        </>
                                                    )}

                                                    {/* Admin/Operator: Blocking */}
                                                    {canBlock && (
                                                        <Button 
                                                            variant={user.bloqueado ? 'primary' : 'outline'} size="sm"
                                                            onClick={() => handleToggleBlock(user)}
                                                            className={`h-8 px-2 flex items-center justify-center ${!user.bloqueado && 'border-red-200 text-red-500 hover:bg-red-50'}`}
                                                            title={user.bloqueado ? 'Desbloquear' : 'Bloquear'}
                                                            disabled={actionLoading === user.id}
                                                        >
                                                            <Ban size={14} />
                                                        </Button>
                                                    )}

                                                    {/* Admin only: Delete */}
                                                    {canDelete && (
                                                        <Button 
                                                            variant="outline" size="sm"
                                                            onClick={() => handleDeleteUser(user)}
                                                            className="h-8 px-2 flex items-center justify-center border-red-200 text-red-600 hover:bg-red-50"
                                                            title="Eliminar permanentemente"
                                                            disabled={actionLoading === user.id}
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    )}
                                                    
                                                    {!canBlock && !canManageRole && !canDelete && !isSelf && (
                                                        <Lock size={14} className="text-gray-300" title="Sin permisos sobre este usuario" />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Admin Transfer Modal */}
            {showTransferModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
                                <Shield className="text-primary" size={20} /> Transferir Admin
                            </h3>
                            <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 flex gap-3">
                            <AlertTriangle size={24} className="text-amber-600 shrink-0" />
                            <p className="text-xs text-amber-800">
                                <strong>Advertencia:</strong> Estás a punto de ceder tu rol de Administrador a <strong>{transferTarget?.nombre}</strong>. 
                                Perderás el poder absoluto y tu sesión se cerrará automáticamente.
                            </p>
                        </div>

                        <form onSubmit={handleTransferAdmin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirmación requerida</label>
                                <p className="text-[10px] text-gray-400 mb-2 italic">Escribe exactamente: "Otorgo mi permiso a admin"</p>
                                <input
                                    type="text"
                                    value={transferPhrase}
                                    onChange={(e) => setTransferPhrase(e.target.value)}
                                    placeholder="Otorgo mi permiso a admin"
                                    className="w-full px-3 py-2 border border-border rounded-md text-sm focus:ring-1 focus:ring-primary outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tu contraseña</label>
                                <div className="relative">
                                    <input
                                        type={showTransferPassword ? 'text' : 'password'}
                                        value={transferPassword}
                                        onChange={(e) => setTransferPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-3 py-2 border border-border rounded-md text-sm focus:ring-1 focus:ring-primary outline-none pr-10"
                                        required
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowTransferPassword(!showTransferPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showTransferPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowTransferModal(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={transferLoading || transferPhrase !== 'Otorgo mi permiso a admin'}
                                >
                                    {transferLoading ? 'Transfiriendo...' : 'Confirmar'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
