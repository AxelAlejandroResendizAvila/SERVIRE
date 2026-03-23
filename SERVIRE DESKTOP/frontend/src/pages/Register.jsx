import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        apellidos: '',
        email: '',
        contrasena: '',
        telefono: ''
    });

    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    // Validaciones
    const validations = {
        nombre: {
            regex: /^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]{2,}$/,
            message: 'El nombre debe tener al menos 2 caracteres y solo letras'
        },
        apellidos: {
            regex: /^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]{2,}$/,
            message: 'Los apellidos deben tener al menos 2 caracteres y solo letras'
        },
        email: {
            regex: /^[a-zA-Z]+\.[a-zA-Z]+@upq\.edu\.mx$|^[^\s@]+@(upq\.edu\.mx|upq\.mx)$/,
            message: 'Usa un email institucional válido (@upq.edu.mx o @upq.mx)'
        },
        contrasena: {
            regex: /^.{6,}$/,
            message: 'La contraseña debe tener al menos 6 caracteres'
        },
        telefono: {
            regex: /^([0-9]{10})?$/,
            message: 'El teléfono debe tener 10 dígitos (opcional)'
        }
    };

    const validateField = (fieldName, value) => {
        if (!value && fieldName !== 'telefono') {
            return true;
        }

        if (fieldName === 'telefono' && !value) {
            return true;
        }

        const validation = validations[fieldName];
        const isValid = validation.regex.test(value);

        setErrors(prev => {
            const updated = { ...prev };
            if (isValid) {
                delete updated[fieldName];
            } else {
                updated[fieldName] = validation.message;
            }
            return updated;
        });

        return isValid;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (value || name !== 'telefono') {
            validateField(name, value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');

        // Validar todos los campos requeridos
        const requiredFields = ['nombre', 'apellidos', 'email', 'contrasena'];
        let isValid = true;

        requiredFields.forEach(field => {
            if (!validateField(field, formData[field])) {
                isValid = false;
            }
        });

        // Validar teléfono si está presente
        if (formData.telefono && !validateField('telefono', formData.telefono)) {
            isValid = false;
        }

        if (!isValid) return;

        setLoading(true);

        const res = await register(formData);
        if (res.success) {
            navigate('/reserva');
        } else {
            setServerError(res.error || 'Error al registrar');
        }
        setLoading(false);
    };

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary tracking-wider mb-2">SERVIRE</h1>
                    <p className="text-gray-500">Crea tu cuenta institucional</p>
                </div>

                {serverError && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-md mb-6 flex items-center text-sm">
                        <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                        {serverError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-button focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
                                    errors.nombre ? 'border-red-500' : 'border-border'
                                }`}
                                placeholder="Juan"
                                required
                            />
                            {errors.nombre && (
                                <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-1">
                                Apellidos *
                            </label>
                            <input
                                type="text"
                                name="apellidos"
                                value={formData.apellidos}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-button focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
                                    errors.apellidos ? 'border-red-500' : 'border-border'
                                }`}
                                placeholder="Pérez García"
                                required
                            />
                            {errors.apellidos && (
                                <p className="text-red-500 text-xs mt-1">{errors.apellidos}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">
                            Correo Institucional *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-button focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
                                errors.email ? 'border-red-500' : 'border-border'
                            }`}
                            placeholder="nombre.apellido@upq.edu.mx"
                            required
                        />
                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">
                            Contraseña *
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="contrasena"
                                value={formData.contrasena}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-button focus:ring-2 focus:ring-primary focus:border-primary transition-colors pr-10 ${
                                    errors.contrasena ? 'border-red-500' : 'border-border'
                                }`}
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {showPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>

                        {errors.contrasena && (
                            <p className="text-red-500 text-xs mt-1">{errors.contrasena}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1">
                            Teléfono
                        </label>
                        <input
                            type="tel"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-button focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
                                errors.telefono ? 'border-red-500' : 'border-border'
                            }`}
                            placeholder="1234567890"
                        />
                        {errors.telefono && (
                            <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full mt-6"
                        disabled={loading || hasErrors}
                    >
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
