import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Users, Tag, FileText, CheckCircle, AlertCircle, ArrowLeft, Save, ImagePlus, X, Trash2 } from 'lucide-react';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import { updateSpace, getCategories, getSpaceDetail, deleteGalleryImage } from '../services/api';

const EditSpace = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
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
    const [existingGallery, setExistingGallery] = useState([]);
    const [newGalleryImages, setNewGalleryImages] = useState([]);
    const [newGalleryPreviews, setNewGalleryPreviews] = useState([]);
    const mainImageRef = useRef(null);
    const galleryRef = useRef(null);

    const [errors, setErrors] = useState({});

    useEffect(() => {
        const loadData = async () => {
            setPageLoading(true);
            try {
                const [cats, space] = await Promise.all([
                    getCategories(),
                    getSpaceDetail(id)
                ]);
                setCategories(cats);
                setFormData({
                    nombre: space.name || '',
                    capacidad: space.capacity?.toString() || '',
                    id_categoria: space.categoryId?.toString() || '',
                    disponible: space.state === 'disponible',
                    descripcion: space.description || '',
                    ubicacion: space.location || ''
                });
                if (space.image) {
                    setMainImagePreview(`http://localhost:3000${space.image}`);
                }
                setExistingGallery(space.gallery || []);
            } catch (err) {
                setError('Error al cargar el espacio');
            } finally {
                setPageLoading(false);
            }
        };
        loadData();
    }, [id]);

    const validate = () => {
        const newErrors = {};
        if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
        if (!formData.capacidad || parseInt(formData.capacidad) < 1) newErrors.capacidad = 'La capacidad debe ser al menos 1';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
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
        setNewGalleryImages(prev => [...prev, ...files]);
        setNewGalleryPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    };

    const removeNewGalleryImage = (index) => {
        setNewGalleryImages(prev => prev.filter((_, i) => i !== index));
        setNewGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingGalleryImage = async (imageId) => {
        try {
            await deleteGalleryImage(imageId);
            setExistingGallery(prev => prev.filter(img => img.id !== imageId));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setError('');

        try {
            const fd = new FormData();
            fd.append('nombre', formData.nombre);
            fd.append('capacidad', formData.capacidad);
            if (formData.id_categoria) fd.append('id_categoria', formData.id_categoria);
            fd.append('disponible', formData.disponible);
            fd.append('descripcion', formData.descripcion);
            fd.append('ubicacion', formData.ubicacion);

            if (mainImage) fd.append('imagen', mainImage);
            newGalleryImages.forEach(file => fd.append('galeria', file));

            await updateSpace(id, fd);
            setSuccess(true);
            setTimeout(() => navigate('/reserva'), 1500);
        } catch (err) {
            setError(err.message || 'Error al actualizar');
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/reserva')} className="p-2 rounded-button hover:bg-gray-100 transition-colors text-gray-500 hover:text-secondary">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Editar Espacio</h1>
                    <p className="text-gray-500 mt-1">Modifica la información del espacio.</p>
                </div>
            </div>

            {success && (
                <div className="flex items-center gap-3 bg-success/10 border border-success/30 text-success p-4 rounded-card">
                    <CheckCircle size={22} />
                    <p className="font-semibold">¡Espacio actualizado! Redirigiendo...</p>
                </div>
            )}
            {error && (
                <div className="flex items-center gap-3 bg-danger/10 border border-danger/30 text-danger p-4 rounded-card">
                    <AlertCircle size={22} />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            <Card hover={false} className="overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-secondary via-primary/70 to-primary"></div>

                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                    {/* Main Image */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-secondary">
                            <ImagePlus size={16} className="text-primary" /> Imagen Principal
                        </label>
                        <div onClick={() => mainImageRef.current?.click()} className="cursor-pointer border-2 border-dashed border-border rounded-card hover:border-primary/50 transition-colors overflow-hidden">
                            {mainImagePreview ? (
                                <div className="relative">
                                    <img src={mainImagePreview} alt="Preview" className="w-full h-48 object-cover" />
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setMainImage(null); setMainImagePreview(null); }} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70">
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                    <ImagePlus size={36} className="mb-2" />
                                    <p className="text-sm font-medium">Click para cambiar imagen</p>
                                </div>
                            )}
                        </div>
                        <input ref={mainImageRef} type="file" accept="image/*" onChange={handleMainImageChange} className="hidden" />
                    </div>

                    {/* Gallery */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-secondary">
                            <ImagePlus size={16} className="text-primary" /> Galería
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {existingGallery.map(img => (
                                <div key={img.id} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                                    <img src={`http://localhost:3000${img.url}`} alt="Gallery" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => removeExistingGalleryImage(img.id)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {newGalleryPreviews.map((preview, idx) => (
                                <div key={`new-${idx}`} className="relative w-20 h-20 rounded-lg overflow-hidden border border-primary/30 group">
                                    <img src={preview} alt={`New ${idx}`} className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => removeNewGalleryImage(idx)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={() => galleryRef.current?.click()} className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center text-gray-400 hover:text-primary transition-colors">
                                <ImagePlus size={22} />
                            </button>
                        </div>
                        <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handleGalleryChange} className="hidden" />
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <label htmlFor="nombre" className="flex items-center gap-2 text-sm font-semibold text-secondary">
                            <Tag size={16} className="text-primary" /> Nombre <span className="text-danger">*</span>
                        </label>
                        <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej. Sala A3"
                            className={`w-full px-4 py-3 rounded-button border ${errors.nombre ? 'border-danger ring-2 ring-danger/20' : 'border-border'} bg-white text-secondary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all`} />
                        {errors.nombre && <p className="text-danger text-xs flex items-center gap-1"><AlertCircle size={12} /> {errors.nombre}</p>}
                    </div>

                    {/* Capacity & Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="capacidad" className="flex items-center gap-2 text-sm font-semibold text-secondary">
                                <Users size={16} className="text-primary" /> Capacidad <span className="text-danger">*</span>
                            </label>
                            <input type="number" id="capacidad" name="capacidad" min="1" value={formData.capacidad} onChange={handleChange} placeholder="30"
                                className={`w-full px-4 py-3 rounded-button border ${errors.capacidad ? 'border-danger ring-2 ring-danger/20' : 'border-border'} bg-white text-secondary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all`} />
                            {errors.capacidad && <p className="text-danger text-xs flex items-center gap-1"><AlertCircle size={12} /> {errors.capacidad}</p>}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="id_categoria" className="flex items-center gap-2 text-sm font-semibold text-secondary">
                                <Tag size={16} className="text-primary" /> Categoría
                            </label>
                            <select id="id_categoria" name="id_categoria" value={formData.id_categoria} onChange={handleChange}
                                className="w-full px-4 py-3 rounded-button border border-border bg-white text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none cursor-pointer">
                                <option value="">Sin categoría</option>
                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <label htmlFor="ubicacion" className="flex items-center gap-2 text-sm font-semibold text-secondary">
                            <MapPin size={16} className="text-primary" /> Ubicación
                        </label>
                        <input type="text" id="ubicacion" name="ubicacion" value={formData.ubicacion} onChange={handleChange} placeholder="Edificio B, Piso 2"
                            className="w-full px-4 py-3 rounded-button border border-border bg-white text-secondary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label htmlFor="descripcion" className="flex items-center gap-2 text-sm font-semibold text-secondary">
                            <FileText size={16} className="text-primary" /> Descripción
                        </label>
                        <textarea id="descripcion" name="descripcion" rows={3} value={formData.descripcion} onChange={handleChange} placeholder="Descripción del espacio..."
                            className="w-full px-4 py-3 rounded-button border border-border bg-white text-secondary placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none" />
                    </div>

                    {/* Availability */}
                    <div className="flex items-center justify-between p-4 bg-surface rounded-card border border-border">
                        <div>
                            <p className="font-semibold text-secondary text-sm">Disponibilidad</p>
                            <p className="text-xs text-gray-500 mt-0.5">{formData.disponible ? 'Disponible para reservas' : 'No disponible'}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="disponible" checked={formData.disponible} onChange={handleChange} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    <div className="border-t border-border"></div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => navigate('/reserva')} className="order-2 sm:order-1">Cancelar</Button>
                        <Button type="submit" variant="primary" size="lg" disabled={loading} className="order-1 sm:order-2">
                            {loading ? (
                                <span className="flex items-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Guardando...</span>
                            ) : (
                                <span className="flex items-center gap-2"><Save size={18} /> Guardar Cambios</span>
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default EditSpace;
