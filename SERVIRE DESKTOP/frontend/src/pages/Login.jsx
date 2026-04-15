import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/logo_servire.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login, logout } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validar que no use solo números (matrículas)
        const emailPart = email.split('@')[0];
        if (/^\d+$/.test(emailPart)) {
            setError('No puedes usar solo números (matrículas) como correo');
            setLoading(false);
            return;
        }

        const res = await login(email, password);
        if (res.success) {
            // Importante: No basta con que el login sea exitoso,
            // en desktop VALIDAMOS que el rol sea 'admin'
            // En React, el estado 'user' de AuthContext podría tardar un ms en actualizarse
            // pero podemos obtener el usuario desde el localStorage o la respuesta si la modificamos.
            // Para ser más seguros consultamos el usuario recién logueado
            
            // Re-chequeo manual del primer login
            const token = localStorage.getItem('servire_token');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.rol !== 'admin' && payload.rol !== 'operador') {
                    logout();
                    setError('Acceso denegado: Aplicación solo para Administradores y Operadores.');
                    setLoading(false);
                    return;
                }
            }

            navigate('/admin');
        } else {
            setError(res.error);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8">
                <div className="text-center mb-8 flex flex-col items-center">
                    <img 
                    src={logo} 
                    alt="Logo SERVIRE" 
                    className="w-50 h-auto mb-4" 
                    />
                    <h2 className="text-xl font-bold text-secondary">Panel Administrativo</h2>
                    <p className="text-gray-500">Solo personal autorizado</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-md mb-6 flex items-center text-sm">
                        <AlertCircle size={16} className="mr-2 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Correo Electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-border rounded-button focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            placeholder="admin@servire.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">
                            Contraseña</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-border rounded-button focus:ring-2 focus:ring-primary focus:border-primary transition-colors pr-10"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Verificando...' : 'Acceder al Panel'}
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-border text-center text-xs text-gray-400">
                    Soporte técnico: IT@servire.com
                </div>
            </Card>
        </div>
    );
};

export default Login;
