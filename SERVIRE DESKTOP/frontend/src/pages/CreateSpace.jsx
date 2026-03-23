import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Tag, FileText, CheckCircle, AlertCircle, ArrowLeft, Plus, Sparkles, ImagePlus, X } from 'lucide-react';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import { createSpace, getCategories } from '../services/api';

const CreateSpace = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        nombre: '',
        capacidad: '',
        id_categoria: '',
        disponible: true,
        descripcion: '',
        ubicacion: ''
    });

    // Image state
    const [mainImage, setMainImage] = useState(null);
    const [mainImagePreview, setMainImagePreview] = useState(null);
    const [galleryImages, setGalleryImages] = useState([]);
    const [galleryPreviews, setGalleryPreviews] = useState([]);
    const mainImageRef = useRef(null);
    const galleryRef = useRef(null);

    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchCategories = async () => {
            const data = await getCategories();
            setCategories(data);
        };
        fetchCategories();
    }, []);

    const validate = () => {
        const newErrors = {};
        if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
        if (!formData.capacidad || parseInt(formData.capacidad) < 1) newErrors.capacidad = 'La capacidad debe ser al menos 1';
        if (formData.nombre.trim().length > 100) newErrors.nombre = 'Máximo 100 caracteres';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleMainImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMainImage(file);
            setMainImagePreview(URL.createObjectURL(file));
        }
    };

    const handleGalleryChange = (e) => {
        const files = Array.from(e.target.files);
        setGalleryImages(prev => [...prev, ...files]);
        const previews = files.map(f => URL.createObjectURL(f));
        setGalleryPreviews(prev => [...prev, ...previews]);
    };

    const removeGalleryImage = (index) => {
        setGalleryImages(prev => prev.filter((_, i) => i !== index));
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setError('');

        try {
            // Build FormData for multipart upload
            const fd = new FormData();
            fd.append('nombre', formData.nombre);
            fd.append('capacidad', formData.capacidad);
            if (formData.id_categoria) fd.append('id_categoria', formData.id_categoria);
            fd.append('disponible', formData.disponible);
            fd.append('descripcion', formData.descripcion);
            fd.append('ubicacion', formData.ubicacion);

            if (mainImage) fd.append('imagen', mainImage);
            galleryImages.forEach(file => fd.append('galeria', file));

            await createSpace(fd);
            setSuccess(true);
            setTimeout(() => {
                navigate('/reserva');
            }, 1500);
        } catch (err) {
            setError(err.message || 'Error al crear el espacio');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/reserva')}
                    className="p-2 rounded-button hover:bg-gray-100 transition-colors text-gray-500 hover:text-secondary"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-secondary flex items-center gap-2">
                        <Sparkles size={24} className="text-primary" />
                        Crear Nuevo Espacio
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Agrega un nuevo espacio disponible para reservaciones.
                    </p>
                </div>
            </div>

            {success && (
                <div className="flex items-center gap-3 bg-success/10 border border-success/30 text-success p-4 rounded-card">
                    <CheckCircle size={22} />
                    <div>
                        <p className="font-semibold">¡Espacio creado exitosamente!</p>
                        <p className="text-sm opacity-80">Redirigiendo...</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-3 bg-danger/10 border border-danger/30 text-danger p-4 rounded-card">
                    <AlertCircle size={22} />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            <Card hover={false} className="overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-secondary"></div>

                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                    {/* Main Image Upload */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-secondary">
                            <ImagePlus size={16} className="text-primary" />
                            Imagen Principal
                        </label>
                        <div
                            onClick={() => mainImageRef.current?.click()}
                            className="cursor-pointer border-2 border-dashed border-border rounded-card hover:border-primary/50 transition-colors overflow-hidden"
                        >
                            {mainImagePreview ? (
                                <div className="relative">
                                    <img src={mainImagePreview} alt="Preview" className="w-full h-48 object-cover" />
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setMainImage(null); setMainImagePreview(null); }}
                                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                    <ImagePlus size={36} className="mb-2" />
                                    <p className="text-sm font-medium">Click para seleccionar imagen</p>
                                    <p className="text-xs mt-1">JPEG, PNG, WebP • Máx. 5MB</p>
                                </div>
                            )}
                        </div>
                        <input ref={mainImageRef} type="file" accept="image/*" onChange={handleMainImageChange} className="hidden" />
                    </div>

                    {/* Gallery Images Upload */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-secondary">
                            <ImagePlus size={16} className="text-primary" />
                            Galería de Imágenes <span className="text-xs text-gray-400 font-normal">(opcional)</span>
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {galleryPreviews.map((preview, idx) => (
                                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                                    <img src={preview} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeGalleryImage(idx)}
                                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => galleryRef.current?.click()}
                                className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
                            >
                                <Plus size={24} />
                            </button>
                        </div>
                        <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handleGalleryChange} className="hidden" />
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <label htmlFor="nombre" className="flex items-center gap-2 text-sm font-semibold text-secondary">
                            <Tag size={16} className="text-primary" />
                            Nombre del Espacio <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder="Ej. Sala de Conferencias A3"
                            className={`w-full px-4 py-3 rounded-button border ${errors.nombre ? 'border-danger ring-2 ring-danger/20' : 'border-border'} bg-white text-secondary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all`}
                        />
                        {errors.nombre && (
                            <p className="text-danger text-xs flex items-center gap-1 mt-1"><AlertCircle size={12} /> {errors.nombre}</p>
                        )}
                    </div>

                    {/* Capacity & Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="capacidad" className="flex items-center gap-2 text-sm font-semibold text-secondary">
                                <Users size={16} className="text-primary" />
                                Capacidad <span className="text-danger">*</span>
                            </label>
                            <input
                                type="number"
                                id="capacidad"
                                name="capacidad"
                                min="1"
                                max="1000"
                                value={formData.capacidad}
                                onChange={handleChange}
                                placeholder="Ej. 30"
                                className={`w-full px-4 py-3 rounded-button border ${errors.capacidad ? 'border-danger ring-2 ring-danger/20' : 'border-border'} bg-white text-secondary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all`}
                            />
                            {errors.capacidad && (
                                <p className="text-danger text-xs flex items-center gap-1 mt-1"><AlertCircle size={12} /> {errors.capacidad}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="id_categoria" className="flex items-center gap-2 text-sm font-semibold text-secondary">
                                <Tag size={16} className="text-primary" />
                                Categoría
                            </label>
                            <select
                                id="id_categoria"
                                name="id_categoria"
                                value={formData.id_categoria}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-button border border-border bg-white text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Sin categoría</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <label htmlFor="ubicacion" className="flex items-center gap-2 text-sm font-semibold text-secondary">
                            <MapPin size={16} className="text-primary" />
                            Ubicación
                        </label>
                        <input
                            type="text"
                            id="ubicacion"
                            name="ubicacion"
                            value={formData.ubicacion}
                            onChange={handleChange}
                            placeholder="Ej. Edificio B, Piso 2"
                            className="w-full px-4 py-3 rounded-button border border-border bg-white text-secondary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label htmlFor="descripcion" className="flex items-center gap-2 text-sm font-semibold text-secondary">
                            <FileText size={16} className="text-primary" />
                            Descripción
                        </label>
                        <textarea
                            id="descripcion"
                            name="descripcion"
                            rows={3}
                            value={formData.descripcion}
                            onChange={handleChange}
                            placeholder="Describe el espacio, equipamiento disponible, etc."
                            className="w-full px-4 py-3 rounded-button border border-border bg-white text-secondary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                        ></textarea>
                    </div>

                    {/* Availability Toggle */}
                    <div className="flex items-center justify-between p-4 bg-surface rounded-card border border-border">
                        <div>
                            <p className="font-semibold text-secondary text-sm">Disponibilidad</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {formData.disponible ? 'El espacio estará disponible para reservas' : 'El espacio se mostrará como no disponible'}
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="disponible"
                                checked={formData.disponible}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    <div className="border-t border-border"></div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => navigate('/reserva')} className="order-2 sm:order-1">
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" size="lg" disabled={loading} className="order-1 sm:order-2">
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Creando...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <Plus size={18} />
                                    Crear Espacio
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default CreateSpace;
