import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, ChevronRight, Activity } from 'lucide-react';
import Card from '../components/UI/Card';
import Badge from '../components/UI/Badge';
import { getMyReservations, getSpaces } from '../services/api';

const QueuePosition = ({ position, total }) => {
    const percentage = Math.max(10, Math.min(100, ((total - position + 1) / total) * 100));

    return (
        <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-warning flex items-center">
                    <Activity size={16} className="mr-2" />
                    Fila de espera
                </span>
                <span className="text-sm font-bold text-orange-800">
                    Posición {position} de {total}
                </span>
            </div>

            <div className="w-full bg-orange-200 rounded-full h-2.5">
                <div
                    className="bg-warning h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>

            <p className="text-xs text-orange-600 mt-2">
                {position === 1
                    ? '¡Eres el siguiente! Te notificaremos si el espacio se libera.'
                    : 'Te notificaremos cuando tu posición avance.'}
            </p>
        </div>
    );
};

const MyReservations = () => {
    const [reservations, setReservations] = useState([]);
    const [spacesData, setSpacesData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [resData, spaces] = await Promise.all([
                    getMyReservations('user123'),
                    getSpaces()
                ]);

                const spacesMap = spaces.reduce((acc, space) => {
                    acc[space.id] = space;
                    return acc;
                }, {});

                setSpacesData(spacesMap);
                setReservations(resData);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-secondary">Mis Reservas</h1>
                <p className="text-gray-500 mt-1">
                    Gestiona tus reservas activas y consulta tu posición en la fila de espera.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : reservations.length === 0 ? (
                <Card className="text-center py-12">
                    <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-secondary">No tienes reservas activas</h3>
                    <p className="text-gray-500 mt-2">Visita la sección de Inicio para reservar un espacio.</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {reservations.map((res) => {
                        const spaceInfo = spacesData[res.spaceId];
                        if (!spaceInfo) return null;

                        return (
                            <Card key={res.id} className="p-0 overflow-hidden">
                                <div className="flex flex-col md:flex-row border-l-4 border-l-primary">
                                    <div className="flex-1 p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-bold text-secondary">
                                                {spaceInfo.name}
                                            </h3>
                                            <Badge
                                                status={res.status}
                                                label={res.status === 'approved' ? 'Aprobada' : 'En cola'}
                                            />
                                        </div>

                                        <div className="flex flex-wrap gap-y-2 text-sm text-gray-600 mt-3">
                                            <div className="flex items-center w-full sm:w-1/2">
                                                <Calendar size={16} className="mr-2 text-primary/70" />
                                                <span>{res.date}</span>
                                            </div>
                                            <div className="flex items-center w-full sm:w-1/2">
                                                <Clock size={16} className="mr-2 text-primary/70" />
                                                <span>{res.time}</span>
                                            </div>
                                            <div className="flex items-center w-full sm:w-1/2">
                                                <MapPin size={16} className="mr-2 text-primary/70" />
                                                <span>{spaceInfo.type} • Capacidad: {spaceInfo.capacity}</span>
                                            </div>
                                        </div>

                                        {res.status === 'waitlisted' && (
                                            <QueuePosition
                                                position={res.waitlistPosition}
                                                total={res.waitlistTotal}
                                            />
                                        )}
                                    </div>

                                    <div className="bg-gray-50 flex items-center justify-center p-4 border-t md:border-t-0 md:border-l border-gray-100 md:w-32 hover:bg-gray-100 cursor-pointer transition-colors text-primary font-medium group">
                                        <span className="md:hidden mr-2">Ver detalles</span>
                                        <span className="hidden md:inline">Detalles</span>
                                        <ChevronRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyReservations;
