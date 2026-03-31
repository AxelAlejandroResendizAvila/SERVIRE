import React, { useState, useEffect } from 'react';
import { Check, X, AlertTriangle, RefreshCw, Clock, Users as UsersIcon, Search } from 'lucide-react';
import Badge from '../components/UI/Badge';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import { getAdminRequests, approveReservation, declineReservation } from '../services/api';

// Función para parsear fechas UTC correctamente (igual que en móbil)
const parseUTCDate = (isoString) => {
    if (!isoString) return 0;
    try {
        // Si no tiene Z, agrégalo para que sea interpretado como UTC
        const dateStr = isoString.includes('Z') ? isoString : isoString + 'Z';
        return new Date(dateStr).getTime();
    } catch (e) {
        return 0;
    }
};

// Función para construir fecha UTC desde date (YYYY-MM-DD) y time (HH:MM)
const constructUTCDate = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return 0;
    try {
        const [year, month, day] = dateStr.split('-');
        const [hours, minutes] = timeStr.split(':');
        return Date.UTC(
            parseInt(year, 10),
            parseInt(month, 10) - 1,
            parseInt(day, 10),
            parseInt(hours, 10),
            parseInt(minutes, 10)
        );
    } catch (e) {
        return 0;
    }
};

// Función para detectar si una reserva ya expiró
const isReservationExpired = (endDateRaw, date, time) => {
    let endTime = 0;
    
    if (date && time) {
        const [, endTimeStr] = time.split(' - ');
        endTime = constructUTCDate(date, endTimeStr);
    } else {
        endTime = parseUTCDate(endDateRaw);
    }
    
    return new Date().getTime() >= endTime;
};

const CountdownTimer = ({ startDateRaw, endDateRaw, date, time }) => {
    const [status, setStatus] = useState('');
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const updateTimer = () => {
            // Intentar usar date y time (más fiable) sino usar startDateRaw y endDateRaw
            let start, end;
            
            if (date && time) {
                const [startTimeStr, endTimeStr] = time.split(' - ');
                start = constructUTCDate(date, startTimeStr);
                end = constructUTCDate(date, endTimeStr);
            } else {
                start = parseUTCDate(startDateRaw);
                end = parseUTCDate(endDateRaw);
            }
            
            const now = new Date().getTime();

            if (now < start) {
                setStatus('pending');
                const distance = start - now;
                const d = Math.floor(distance / (1000 * 60 * 60 * 24));
                const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((distance % (1000 * 60)) / 1000);

                let timeStr = '';
                if (d > 0) {
                    timeStr = `${d}d ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
                } else {
                    timeStr = `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
                }

                setTimeLeft(timeStr);
                return;
            }

            if (now >= start && now < end) {
                setStatus('active');
                const distance = end - now;
                const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
                return;
            }

            setStatus('finished');
            setTimeLeft('Terminado');
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [startDateRaw, endDateRaw, date, time]);

    if (status === 'finished') {
        return <span className="inline-block mt-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">Terminado</span>;
    }

    if (status === 'pending') {
        return (
            <span className="inline-block mt-1 text-xs font-bold text-gray-700 bg-blue-100 px-2 py-0.5 rounded shadow-sm border border-gray-200">
                ⏱ Empieza en: {timeLeft}
            </span>
        );
    }

    return (
        <span className="inline-block mt-1 text-xs font-mono font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded shadow-sm border border-blue-200">
            ▶ En curso: {timeLeft}
        </span>
    );
};

// Función para convertir tiempo UTC a hora local
const formatLocalTime = (utcTimeString) => {
    if (!utcTimeString) return '';
    try {
        const [hours, minutes] = utcTimeString.split(':');
        const date = new Date();
        date.setUTCHours(parseInt(hours, 10));
        date.setUTCMinutes(parseInt(minutes, 10));
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch (e) {
        return utcTimeString;
    }
};

const AdminPanel = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [searchQuery, setSearchQuery] = useState('');

    const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [motivo, setMotivo] = useState('');

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await getAdminRequests();
            setRequests(data);
        } catch (error) {
            console.error('Failed to fetch admin requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    const handleApprove = async (id) => {
        setActionLoading(id);
        try {
            await approveReservation(id);
            fetchRequests();
        } catch (error) {
            alert(error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeclineClick = (request) => {
        setSelectedRequest(request);
        setMotivo('');
        setIsDeclineModalOpen(true);
    };

    const submitDecline = async () => {
        if (!selectedRequest) return;
        if (!motivo.trim()) {
            alert('El motivo de cancelación es requerido');
            return;
        }
        setActionLoading(selectedRequest.id);
        try {
            await declineReservation(selectedRequest.id, motivo);
            fetchRequests();
        } catch (error) {
            alert(error.message);
        } finally {
            setActionLoading(null);
            setIsDeclineModalOpen(false);
            setSelectedRequest(null);
            setMotivo('');
        }
    };

    const filteredRequests = requests.filter(req => {
        let matchesTab = true;
        
        if (activeTab === 'pending') {
            matchesTab = req.status === 'pending';
        } else if (activeTab === 'approved') {
            // Las reservas 'approved' expiradas NO van en activas
            matchesTab = req.status === 'approved' && !isReservationExpired(req.endDateRaw, req.date, req.time);
        } else if (activeTab === 'history') {
            // El historial incluye declined, completed, y approved expiradas
            matchesTab = req.status === 'declined' || req.status === 'completed' || 
                        (req.status === 'approved' && isReservationExpired(req.endDateRaw, req.date, req.time));
        }

        const str = `${req.requester} ${req.requesterEmail} ${req.space} ${req.date} ${req.time} ${req.status} ${req.motivo_rechazo || ''}`.toLowerCase();
        const matchesSearch = str.includes(searchQuery.toLowerCase());

        return matchesTab && matchesSearch;
    });

    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const approvedCount = requests.filter(r => r.status === 'approved' && !isReservationExpired(r.endDateRaw, r.date, r.time)).length;

    const tabs = [
        { key: 'pending', label: 'Pendientes', count: pendingCount },
        { key: 'approved', label: 'Activas', count: approvedCount },
        { key: 'history', label: 'Historial', count: null },
        { key: 'all', label: 'Todos', count: requests.length },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Solicitudes de Reserva</h1>
                    <p className="text-gray-500 mt-1">
                        Aprueba o rechaza las solicitudes de los usuarios.
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full sm:w-64">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar solicitud..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white"
                        />
                    </div>
                    <Button variant="outline" onClick={fetchRequests} disabled={loading} className="shrink-0 w-full sm:w-auto">
                        <RefreshCw size={16} className={`mr-1 ${loading ? 'animate-spin' : ''}`} /> Actualizar
                    </Button>
                </div>
            </div>

            <div className="flex gap-1 bg-surface p-1 rounded-card border border-border w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-button text-sm font-medium transition-all ${activeTab === tab.key
                            ? 'bg-white text-secondary shadow-sm'
                            : 'text-gray-500 hover:text-secondary'
                            }`}
                    >
                        {tab.label}
                        {tab.count !== null && tab.count > 0 && (
                            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                                }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="bg-white rounded-card shadow-sm border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface text-gray-600 text-sm font-medium border-b border-border">
                                    {activeTab === 'pending' && <th className="py-3 px-6 w-12">#</th>}
                                    <th className="py-3 px-6">Solicitante</th>
                                    <th className="py-3 px-6">Espacio</th>
                                    <th className="py-3 px-6">Fecha</th>
                                    <th className="py-3 px-6">Horario</th>
                                    <th className="py-3 px-6">Estado</th>
                                    <th className="py-3 px-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.map((req) => (
                                    <tr key={req.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                                        {activeTab === 'pending' && (
                                            <td className="py-4 px-6">
                                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                                    {req.queuePosition || '—'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mr-3 text-xs">
                                                    {req.requester.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-secondary block">{req.requester}</span>
                                                    <span className="text-xs text-gray-400">{req.requesterEmail}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-700 font-medium">{req.space}</td>
                                        <td className="py-4 px-6 text-gray-600 text-sm">{req.date}</td>
                                        <td className="py-4 px-6 text-gray-600 text-sm">
                                            <div>
                                                {formatLocalTime(req.time.split(' - ')[0])} - {formatLocalTime(req.time.split(' - ')[1])}
                                            </div>
                                            {req.status === 'approved' && req.date && req.time && !isReservationExpired(req.endDateRaw, req.date, req.time) && (
                                                <CountdownTimer startDateRaw={req.startDateRaw} endDateRaw={req.endDateRaw} date={req.date} time={req.time} />
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            {(() => {
                                                const isExpired = isReservationExpired(req.endDateRaw, req.date, req.time);
                                                const statusLabel = 
                                                    req.status === 'pending' ? 'Pendiente' :
                                                    req.status === 'approved' && isExpired ? 'Terminada' :
                                                    req.status === 'approved' ? 'Activa' :
                                                    req.status === 'completed' ? 'Terminada' :
                                                    'Rechazada';
                                                
                                                // Color del badge: gris para terminadas, rojo para rechazadas
                                                const statusType = 
                                                    isExpired || req.status === 'completed' ? 'declined' :
                                                    req.status === 'declined' ? 'declined' : 
                                                    req.status;
                                                
                                                return (
                                                    <Badge
                                                        status={statusType}
                                                        label={statusLabel}
                                                    />
                                                );
                                            })()}
                                            {req.status === 'declined' && req.motivo_rechazo && (
                                                <div className="mt-2 text-xs text-red-600 bg-red-50 p-1.5 rounded flex items-start max-w-[200px]">
                                                    <AlertTriangle size={12} className="mr-1 mt-0.5 shrink-0" />
                                                    <span className="break-words line-clamp-2" title={req.motivo_rechazo}>
                                                        {req.motivo_rechazo}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                {req.status === 'pending' && (
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        className="!p-1.5"
                                                        title="Aprobar — Otorgar espacio"
                                                        onClick={() => handleApprove(req.id)}
                                                        disabled={actionLoading === req.id}
                                                    >
                                                        {actionLoading === req.id ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        ) : (
                                                            <Check size={16} />
                                                        )}
                                                    </Button>
                                                )}
                                                {(req.status === 'pending' || (req.status === 'approved' && !isReservationExpired(req.endDateRaw, req.date, req.time))) && (
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        className="!p-1.5"
                                                        title={req.status === 'approved' ? "Cancelar Reserva" : "Rechazar Solicitud"}
                                                        onClick={() => handleDeclineClick(req)}
                                                        disabled={actionLoading === req.id}
                                                    >
                                                        <X size={16} />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {filteredRequests.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-gray-400">
                                            <Clock size={40} className="mx-auto mb-3 opacity-50" />
                                            <p className="font-medium">
                                                {activeTab === 'pending' ? 'No hay solicitudes pendientes' :
                                                    activeTab === 'approved' ? 'No hay reservas activas' :
                                                        'No hay historial aún'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal
                isOpen={isDeclineModalOpen}
                onClose={() => setIsDeclineModalOpen(false)}
                title={selectedRequest?.status === 'approved' ? "Cancelar Reserva Activa" : "Rechazar Solicitud"}
                actions={
                    <>
                        <Button variant="ghost" onClick={() => setIsDeclineModalOpen(false)}>Cancelar</Button>
                        <Button
                            variant="danger"
                            onClick={submitDecline}
                            disabled={actionLoading === selectedRequest?.id || !motivo.trim()}
                        >
                            {actionLoading === selectedRequest?.id ? 'Procesando...' : (selectedRequest?.status === 'approved' ? 'Confirmar Cancelación' : 'Confirmar Rechazo')}
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col gap-4 text-sm">
                    <div className="flex items-start bg-red-50 p-3 rounded-md text-red-800">
                        <AlertTriangle size={20} className="mr-2 shrink-0 text-red-600" />
                        <p>
                            {selectedRequest?.status === 'approved'
                                ? <>¿Estás seguro de cancelar la reserva activa de <strong>{selectedRequest?.requester}</strong> en <strong>{selectedRequest?.space}</strong>?</>
                                : <>¿Rechazar la solicitud de <strong>{selectedRequest?.requester}</strong> para <strong>{selectedRequest?.space}</strong>?</>}
                            <br />El usuario será notificado de este cambio de estado.
                        </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="font-medium text-secondary">Motivo de la decisión (requerido)</label>
                        <textarea
                            className="w-full border border-border rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 resize-none min-h-[80px]"
                            placeholder="Describe el motivo del rechazo..."
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminPanel;
