import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, ClipboardList, PlusSquare, Users, X, BarChart3 } from 'lucide-react';
import logo from "../../assets/logo_icon.png";
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const location = useLocation();

    const { user } = useAuth();

    const navItems = [
        { label: 'Espacios', icon: LayoutGrid, path: '/reserva' },
        ...(user?.rol === 'admin' ? [{ label: 'Crear Espacio', icon: PlusSquare, path: '/crear-espacio' }] : []),
        { label: 'Solicitudes', icon: ClipboardList, path: '/admin' },
    ];

    const adminItems = [
        { label: 'Usuarios', icon: Users, path: '/usuarios' },
        ...(user?.rol === 'admin' ? [{ label: 'Reportes', icon: BarChart3, path: '/reportes' }] : []),
    ];

    const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-64 bg-secondary text-white transform transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    md:translate-x-0 md:static md:inset-auto md:flex md:flex-col
  `;

    const renderNavLink = (item) => {
        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
        return (
            <NavLink
                key={item.label}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-button transition-colors duration-200 group ${isActive
                        ? 'bg-primary text-white font-medium'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                onClick={() => { if (window.innerWidth < 768) toggleSidebar() }}
            >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                {item.label}
            </NavLink>
        );
    };

    return (
        <>
            <aside className={sidebarClasses}>
                <div className="flex items-center justify-between h-16 px-6 bg-secondary/90 border-b border-white/10">
                    <span className="text-xl font-bold tracking-wider text-primary">SERVIRE</span>
                    <div className="flex items-center gap-4">
                        <img
                            src={logo}
                            alt="Logo SERVIRE"
                            className="w-12 h-12 object-contain"
                            style={{ mixBlendMode: 'multiply' }}
                        />
                        <button className="md:hidden text-white hover:text-primary" onClick={toggleSidebar}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 overflow-y-auto">
                    <div className="space-y-1">
                        {navItems.map(renderNavLink)}
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/10">
                        <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Administración
                        </p>
                        <div className="space-y-1">
                            {adminItems.map(renderNavLink)}
                        </div>
                    </div>
                </nav>
            </aside>

            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
                    onClick={toggleSidebar}
                />
            )}
        </>
    );
};

export default Sidebar;
