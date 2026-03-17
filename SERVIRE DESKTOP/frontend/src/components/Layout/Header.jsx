import React from 'react';
import { Menu, Search, Bell, LogOut } from 'lucide-react';
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
                <button className="relative p-2 text-gray-500 hover:text-primary transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1 right-1 h-2 w-2 bg-danger rounded-full border border-white"></span>
                </button>

                <div className="flex items-center space-x-3 border-l border-border pl-4">
                    <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                        {user?.nombre?.substring(0, 2).toUpperCase() || 'UN'}
                    </div>
                    <div className="hidden md:block">
                        <p className="text-sm font-medium">{user?.nombre || 'Usuario'}</p>
                        <p className="text-xs text-gray-500 break-all w-32 truncate">{user?.email || ''}</p>
                    </div>

                    <button
                        onClick={logout}
                        className="ml-2 p-2 text-gray-500 hover:text-danger hover:bg-red-50 rounded-full transition-colors"
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
