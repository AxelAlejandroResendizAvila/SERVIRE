import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, AlertCircle, Plus, Pencil, Trash2, Unlock, Eye, MapPin, ChevronLeft, ChevronRight, X, ZoomIn, FileText, Search, Filter } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import Modal from '../components/UI/Modal';
import { getSpaces, deleteSpace, freeSpace, getSpaceDetail, getCategories, getEdificios, API_URL } from '../services/api';

const ReservationView = () => {
    const navigate = useNavigate();
    const [spaces, setSpaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const [categories, setCategories] = useState([]);
    const [edificios, setEdificios] = useState([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todas');
    const [filterLocation, setFilterLocation] = useState('Todos');
    const [filterMinCapacity, setFilterMinCapacity] = useState('');
    const [showFiltersToggle, setShowFiltersToggle] = useState(false);

    const [deleteModal, setDeleteModal] = useState({ open: false, space: null });
    const [detailModal, setDetailModal] = useState({ open: false, space: null, loading: false });
    const [lightbox, setLightbox] = useState({ open: false, images: [], currentIndex: 0 });

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [cats, edifs, data] = await Promise.all([
                getCategories(),
                getEdificios(),
                getSpaces()
            ]);
            setCategories(cats);
            setEdificios(edifs);
            setSpaces(data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSpaces = async () => {
        try {
            const data = await getSpaces();
            setSpaces(data);
        } catch (error) {
            console.error('Failed to fetch spaces:', error);
        }
    };

    useEffect(() => { fetchInitialData(); }, []);

    const handleDelete = async () => {
        if (!deleteModal.space) return;
        setActionLoading(deleteModal.space.id);
        try {
            await deleteSpace(deleteModal.space.id);
            setSpaces(spaces.filter(s => s.id !== deleteModal.space.id));
            setDeleteModal({ open: false, space: null });
        } catch (error) {
            console.error('Delete failed:', error);
            alert(error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleFreeSpace = async (space) => {
        setActionLoading(space.id);
        try {
            const result = await freeSpace(space.id);
            alert(result.message);
            fetchSpaces();  // Refresh
        } catch (error) {
            console.error('Free space failed:', error);
            alert(error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleViewDetail = async (space) => {
        setDetailModal({ open: true, space: null, loading: true });
        try {
            const detail = await getSpaceDetail(space.id);
            setDetailModal({ open: true, space: detail, loading: false });
        } catch (error) {
            console.error('Failed to load detail:', error);
            setDetailModal({ open: false, space: null, loading: false });
        }
    };

    const openLightbox = (index, allImages) => {
        setLightbox({ open: true, images: allImages, currentIndex: index });
    };

    const nextImage = (e) => {
        e.stopPropagation();
        setLightbox(prev => ({
            ...prev,
            currentIndex: (prev.currentIndex + 1) % prev.images.length
        }));
    };

    const prevImage = (e) => {
        e.stopPropagation();
        setLightbox(prev => ({
            ...prev,
            currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length
        }));
    };

    const filteredSpaces = spaces.filter(space => {
        const str = `${space.name} ${space.location} ${space.type} ${space.capacity}`.toLowerCase();
        const matchesSearch = str.includes(searchQuery.toLowerCase());

        const matchesCategory = filterCategory === 'Todas' || space.categoryId?.toString() === filterCategory.toString();
        const matchesBuilding = filterLocation === 'Todos' || space.buildingId?.toString() === filterLocation.toString();
        const matchesCapacity = filterMinCapacity === '' || space.capacity >= parseInt(filterMinCapacity);

        return matchesSearch && matchesCategory && matchesBuilding && matchesCapacity;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Gestión de Espacios</h1>
                    <p className="text-gray-500 mt-1">Administra todos los espacios de la universidad.</p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                    <div className="relative w-full md:w-64">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar en tiempo real..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                        />
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button 
                            variant={showFiltersToggle ? "primary" : "outline"} 
                            onClick={() => setShowFiltersToggle(!showFiltersToggle)} 
                            className="flex-1 md:flex-none"
                        >
                            <Filter size={16} className="mr-1.5" /> Filtros
                        </Button>
                        <Button variant="primary" onClick={() => navigate('/crear-espacio')} className="flex-1 md:flex-none shrink-0">
                            <Plus size={18} className="mr-1" /> Nuevo Espacio
                        </Button>
                    </div>
                </div>
            </div>

            {showFiltersToggle && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface p-5 rounded-2xl border border-border shadow-sm">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Edificio</label>
                        <select 
                            value={filterLocation} 
                            onChange={(e) => setFilterLocation(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-border rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                            <option value="Todos">Todos los edificios</option>
                            {edificios.map(ed => <option key={ed.id} value={ed.id}>{ed.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</label>
                        <select 
                            value={filterCategory} 
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-border rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                            <option value="Todas">Todas las categorías</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Capacidad Min.</label>
                        <input 
                            type="number" 
                            min="1"
                            placeholder="Ej. 10"
                            value={filterMinCapacity}
                            onChange={(e) => setFilterMinCapacity(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-border rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredSpaces.map((space) => (
                        <Card 
                            key={space.id} 
                            onClick={() => handleViewDetail(space)} 
                            className="flex flex-col h-full overflow-hidden group cursor-pointer hover:shadow-md transition-shadow relative"
                        >
                            {/* Floating Modify Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/editar-espacio/${space.id}`); }}
                                className="absolute top-3 right-3 p-2.5 bg-white/90 text-gray-600 hover:text-primary rounded-full shadow-md hover:shadow-lg transition-all z-10 opacity-0 group-hover:opacity-100"
                                title="Modificar espacio"
                            >
                                <Pencil size={18} />
                            </button>

                            {/* Image or placeholder */}
                            {space.image ? (
                                <div className="h-40 overflow-hidden">
                                    <img
                                        src={space.image.startsWith('http') ? space.image : `${API_URL}${space.image}`}
                                        alt={space.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            ) : (
                                <div className="h-40 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 flex items-center justify-center">
                                    <MapPin size={40} className="text-primary/30" />
                                </div>
                            )}

                            <div className="p-4 flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge status={space.state} label={space.state === 'disponible' ? 'Disponible' : 'Ocupado'} />
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                        {space.type}
                                    </span>
                                </div>

                                <h3 className="text-base font-bold text-secondary mb-1 line-clamp-1">
                                    {space.name}
                                </h3>
                                {space.location && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                                        <MapPin size={12} /> {space.location}
                                    </p>
                                )}

                                <div className="space-y-1.5 mt-2">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Users size={14} className="mr-1.5 text-primary" />
                                        <span>Capacidad: {space.capacity}</span>
                                    </div>
                                    {space.waitlistCount > 0 && (
                                        <div className="flex items-center text-sm text-warning font-medium">
                                            <Clock size={14} className="mr-1.5" />
                                            <span>{space.waitlistCount} en fila</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}

                    {filteredSpaces.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-white rounded-card border border-border">
                            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-secondary">No hay espacios</h3>
                            <p className="text-gray-500 mt-1">Crea tu primer espacio para empezar.</p>
                            <Button variant="primary" className="mt-4" onClick={() => navigate('/crear-espacio')}>
                                <Plus size={18} className="mr-1" /> Crear Espacio
                            </Button>
                        </div>
                    )}
                </div>
            )}

    
            <Modal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, space: null })}
                title="Eliminar Espacio"
                actions={
                    <>
                        <Button variant="ghost" onClick={() => setDeleteModal({ open: false, space: null })}>Cancelar</Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            disabled={actionLoading === deleteModal.space?.id}
                        >
                            {actionLoading ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                    </>
                }
            >
                <div className="flex items-start bg-red-50 p-3 rounded-md text-red-800 text-sm">
                    <AlertCircle size={20} className="mr-2 shrink-0 text-red-600" />
                    <p>
                        ¿Estás seguro de eliminar <strong>{deleteModal.space?.name}</strong>?
                        Todas las reservas asociadas serán canceladas. Esta acción no se puede deshacer.
                    </p>
                </div>
            </Modal>

            <Modal
                isOpen={detailModal.open}
                onClose={() => setDetailModal({ open: false, space: null, loading: false })}
                title={detailModal.space?.name || 'Detalle del Espacio'}
            >
                {detailModal.loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : detailModal.space && (
                    <div className="space-y-4">
                        {/* Space Details */}
                        <div className="grid grid-cols-2 gap-3 text-sm bg-surface p-3 rounded-lg border border-border">
                            <div><span className="text-gray-500">Categoría:</span> <strong className="ml-1">{detailModal.space.type}</strong></div>
                            <div><span className="text-gray-500">Capacidad:</span> <strong className="ml-1">{detailModal.space.capacity} {detailModal.space.capacity === 1 ? 'persona' : 'personas'}</strong></div>
                            <div>
                                <span className="text-gray-500 mr-2">Estado:</span>
                                <Badge
                                    status={detailModal.space.state}
                                    label={detailModal.space.state === 'disponible' ? 'Disponible' : 'Ocupado'}
                                />
                            </div>
                            {detailModal.space.location && (
                                <div><span className="text-gray-500">Ubicación:</span> <strong className="ml-1">{detailModal.space.location}</strong></div>
                            )}
                        </div>

              
                        {detailModal.space.description && (
                            <div className="bg-blue-50/50 p-3.5 rounded-lg border border-blue-100">
                                <h4 className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <FileText size={12} /> Descripción
                                </h4>
                                <p className="text-sm text-secondary leading-relaxed">{detailModal.space.description}</p>
                            </div>
                        )}

                        {(() => {
                            const allImages = [];
                            if (detailModal.space.image) allImages.push(detailModal.space.image);
                            if (detailModal.space.gallery?.length > 0) {
                                detailModal.space.gallery.forEach(img => allImages.push(img.url));
                            }
                            
                            if (allImages.length > 0) {
                                return (
                                    <div>
                                        <h4 className="text-sm font-semibold text-secondary mb-2">Imágenes del Espacio</h4>
                                        <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
                                            {allImages.map((imgUrl, idx) => (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => openLightbox(idx, allImages)}
                                                    className="relative h-28 w-40 shrink-0 rounded-lg overflow-hidden border border-border cursor-pointer group snap-start"
                                                >
                                                    <img
                                                        src={imgUrl.startsWith('http') ? imgUrl : `${API_URL}${imgUrl}`}
                                                        alt={`Espacio ${idx}`}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                    <div className="absolute inset-0 bg-secondary/0 group-hover:bg-secondary/40 transition-colors duration-300 flex items-center justify-center">
                                                        <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-75 group-hover:scale-100" size={28} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}

                
                        <div>
                            <h4 className="text-sm font-semibold text-secondary mb-2">
                                Fila de Reservas ({detailModal.space.waitlist?.filter(w => w.status === 'pendiente').length || 0} pendientes)
                            </h4>
                            {detailModal.space.waitlist?.length > 0 ? (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {detailModal.space.waitlist.map((item, idx) => (
                                        <div key={item.id} className={`flex items-center justify-between p-2.5 rounded-lg border text-sm ${item.status === 'pendiente' ? 'bg-blue-50 border-blue-200' :
                                            item.status === 'confirmada' ? 'bg-green-50 border-green-200' :
                                                'bg-gray-50 border-gray-200'
                                            }`}>
                                            <div className="flex items-center gap-2">
                                                {item.status === 'pendiente' && (
                                                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                                        {idx + 1}
                                                    </span>
                                                )}
                                                <div>
                                                    <p className="font-medium text-secondary">{item.requester}</p>
                                                    <p className="text-xs text-gray-500">{item.email} • {item.createdAt}</p>
                                                </div>
                                            </div>
                                            <Badge
                                                status={item.status === 'pendiente' ? 'pending' : item.status === 'confirmada' ? 'approved' : 'declined'}
                                                label={item.status === 'pendiente' ? 'Pendiente' : item.status === 'confirmada' ? 'Activa' : item.status}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No hay solicitudes para este espacio.</p>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-5 border-t border-border gap-4 sm:gap-0">
                            {detailModal.space.state === 'ocupado' ? (
                                <Button
                                    variant="success"
                                    onClick={() => {
                                        setDetailModal({ open: false, space: null, loading: false });
                                        handleFreeSpace(detailModal.space);
                                    }}
                                >
                                    <Unlock size={18} className="mr-2" /> Liberar Espacio
                                </Button>
                            ) : (
                                <div></div>
                            )}

                            <div className="flex gap-3 w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    className="flex-1 sm:flex-none"
                                    onClick={() => navigate(`/editar-espacio/${detailModal.space.id}`)}
                                >
                                    <Pencil size={18} className="mr-2" /> Modificar
                                </Button>
                                <Button
                                    variant="danger"
                                    className="flex-1 sm:flex-none"
                                    onClick={() => {
                                        setDeleteModal({ open: true, space: detailModal.space });
                                        setDetailModal({ open: false, space: null, loading: false });
                                    }}
                                >
                                    <Trash2 size={18} className="mr-2" /> Eliminar
                                </Button>
                            </div>
                        </div>

                    </div>
                )}
            </Modal>

            {lightbox.open && lightbox.images.length > 0 && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-sm transition-opacity"
                    onClick={() => setLightbox({ open: false, images: [], currentIndex: 0 })}
                >
                    <button 
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-50"
                        onClick={(e) => { e.stopPropagation(); setLightbox({ open: false, images: [], currentIndex: 0 }); }}
                    >
                        <X size={28} />
                    </button>

                    <div className="absolute top-6 left-6 px-3 py-1.5 rounded-full bg-black/50 border border-white/20 text-white text-sm font-medium tracking-wide z-50">
                        {lightbox.currentIndex + 1} / {lightbox.images.length}
                    </div>

                    <img
                        src={lightbox.images[lightbox.currentIndex].startsWith('http') ? lightbox.images[lightbox.currentIndex] : `${API_URL}${lightbox.images[lightbox.currentIndex]}`}
                        alt="Espacio expandido"
                        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()} // Prevent close when clicking image
                    />

                    {lightbox.images.length > 1 && (
                        <>
                            <button 
                                className="absolute left-4 sm:left-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-110 transition-all z-50 transform -translate-y-1/2 top-1/2"
                                onClick={prevImage}
                            >
                                <ChevronLeft size={36} />
                            </button>
                            <button 
                                className="absolute right-4 sm:right-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-110 transition-all z-50 transform -translate-y-1/2 top-1/2"
                                onClick={nextImage}
                            >
                                <ChevronRight size={36} />
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReservationView;
