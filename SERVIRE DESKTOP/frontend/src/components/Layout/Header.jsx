import React from 'react';
import { Menu, Search, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 lg:px-8 z-30 shadow-sm">
            <div className="flex items-center">
                <button
                    onClick={toggleSidebar}
                    className="md:hidden mr-4 p-2 text-text-primary hover:bg-surface rounded-button transition-colors"
                >
                    <Menu size={24} />
                </button>

                <div className="hidden sm:flex relative items-center">
                    <Search className="absolute left-3 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Buscar espacios..."
                        className="pl-10 pr-4 py-2 w-64 rounded-card bg-surface border-none focus:ring-2 focus:ring-primary focus:outline-none text-sm transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 border-l border-border pl-4">
                    <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center font-bold text-white text-sm shadow-sm">
                        {user?.nombre?.substring(0, 2).toUpperCase() || 'AD'}
                    </div>
                    <div className="hidden md:block">
                        <p className="text-sm font-semibold text-gray-800">{user?.nombre || 'Admin'}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[140px]">{user?.email || ''}</p>
                        {user?.rol === 'admin' && (
                            <div className="flex items-center gap-1 mt-0.5">
                                <Shield size={10} className="text-primary" />
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">Administrador</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={logout}
                        className="ml-2 p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Cerrar sesión"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
