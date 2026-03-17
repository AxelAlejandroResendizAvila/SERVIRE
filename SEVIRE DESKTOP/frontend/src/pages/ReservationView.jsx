import React, { useState, useEffect } from 'react';
import { Users, Clock, AlertCircle } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import { getSpaces, reserveSpace, joinWaitlist } from '../services/api';

const AREA_TYPES = ['Todos', 'Tics', 'Biblioteca', 'Laboratorio', 'Auditorio', 'Salas'];

const ReservationView = () => {
    const [spaces, setSpaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        const fetchSpaces = async () => {
            setLoading(true);
            try {
                const data = await getSpaces();
                setSpaces(data);
            } catch (error) {
                console.error('Failed to fetch spaces:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSpaces();
    }, []);

    const handleAction = async (space) => {
        setActionLoading(space.id);
        try {
            if (space.state === 'disponible') {
                await reserveSpace(space.id, 'user123');
                // Update local state to reflect change
                setSpaces(spaces.map(s => s.id === space.id ? { ...s, state: 'ocupado', waitlistCount: 0 } : s));
            } else {
                await joinWaitlist(space.id, 'user123');
                // Update waitlist count
                setSpaces(spaces.map(s => s.id === space.id ? { ...s, waitlistCount: s.waitlistCount + 1 } : s));
            }
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredSpaces = activeFilter === 'Todos'
        ? spaces
        : spaces.filter(space => space.type === activeFilter);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Reservar Espacio</h1>
                    <p className="text-gray-500 mt-1">Explora y reserva espacios disponibles en la universidad.</p>
                </div>

                {/* Quick Filters */}
                <div className="flex flex-wrap gap-2">
                    {AREA_TYPES.map(type => (
                        <button
                            key={type}
                            onClick={() => setActiveFilter(type)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeFilter === type
                                    ? 'bg-secondary text-white shadow-sm'
                                    : 'bg-white text-gray-600 border border-border hover:bg-gray-50'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredSpaces.map((space) => (
                        <Card key={space.id} className="flex flex-col h-full overflow-hidden">
                            <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-3">
                                    <Badge status={space.state} label={space.state === 'disponible' ? 'Disponible' : 'Ocupado'} />
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        {space.type}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-secondary mb-2 line-clamp-2">
                                    {space.name}
                                </h3>

                                <div className="space-y-2 mt-4">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Users size={16} className="mr-2 text-primary" />
                                        <span>Capacidad: {space.capacity} personas</span>
                                    </div>
                                    {space.state === 'ocupado' && space.waitlistCount > 0 && (
                                        <div className="flex items-center text-sm text-warning font-medium">
                                            <Clock size={16} className="mr-2" />
                                            <span>{space.waitlistCount} personas en fila</span>
                                        </div>
                                    )}
                                    {space.state === 'ocupado' && space.waitlistCount === 0 && (
                                        <div className="flex items-center text-sm text-gray-500">
                                            <AlertCircle size={16} className="mr-2" />
                                            <span>Sin fila de espera</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-border mt-auto">
                                <Button
                                    variant={space.state === 'disponible' ? 'primary' : 'warning'}
                                    className="w-full"
                                    onClick={() => handleAction(space)}
                                    disabled={actionLoading === space.id}
                                >
                                    {actionLoading === space.id ? (
                                        <span className="flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Procesando...
                                        </span>
                                    ) : space.state === 'disponible' ? (
                                        'Reservar'
                                    ) : (
                                        'Unirse a la fila'
                                    )}
                                </Button>
                            </div>
                        </Card>
                    ))}

                    {filteredSpaces.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-white rounded-card border border-border">
                            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-secondary">No hay espacios disponibles</h3>
                            <p className="text-gray-500 mt-1">Intenta con otros filtros de área.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReservationView;
