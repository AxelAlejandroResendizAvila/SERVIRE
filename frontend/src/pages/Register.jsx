import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { AlertCircle } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        apellidos: '',
        email: '',
        contrasena: '',
        telefono: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const res = await register(formData);
        if (res.success) {
            navigate('/reserva');
        } else {
            setError(res.error);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-4">
            <Card className="w-full max-w-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary tracking-wider mb-2">SERVIRE</h1>
                    <p className="text-gray-500">Crea tu cuenta universitaria</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-md mb-6 flex items-center text-sm">
                        <AlertCircle size={16} className="mr-2" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1">Nombre</label>
                            <input
                                type="text" name="nombre" value={formData.nombre} onChange={handleChange} required
                                className="w-full px-3 py-2 border border-border rounded-button focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1">Apellidos</label>
                            <input
                                type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} required
                                className="w-full px-3 py-2 border border-border rounded-button focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Correo Institucional / Principal</label>
                        <input
                            type="email" name="email" value={formData.email} onChange={handleChange} required
                            className="w-full px-3 py-2 border border-border rounded-button focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Contraseña</label>
                        <input
                            type="password" name="contrasena" value={formData.contrasena} onChange={handleChange} required
                            className="w-full px-3 py-2 border border-border rounded-button focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">Teléfono (Opcional)</label>
                        <input
                            type="tel" name="telefono" value={formData.telefono} onChange={handleChange}
                            className="w-full px-3 py-2 border border-border rounded-button focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <Button type="submit" className="w-full mt-4" disabled={loading}>
                        {loading ? 'Registrando...' : 'Registrarse'}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="text-primary hover:underline font-medium">
                        Inicia sesión aquí
                    </Link>
                </div>
            </Card>
        </div>
    );
};

export default Register;
