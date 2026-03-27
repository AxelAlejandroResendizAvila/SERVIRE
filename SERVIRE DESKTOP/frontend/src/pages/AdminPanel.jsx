import React, { useState, useEffect } from 'react';
import { Check, X, AlertTriangle, RefreshCw, Clock, Users as UsersIcon } from 'lucide-react';
import Badge from '../components/UI/Badge';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import { getAdminRequests, approveReservation, declineReservation } from '../services/api';

const AdminPanel = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');

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
        if (activeTab === 'pending') return req.status === 'pending';
        if (activeTab === 'approved') return req.status === 'approved';
        if (activeTab === 'history') return req.status === 'declined' || req.status === 'completed';
        return true;
    });

    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const approvedCount = requests.filter(r => r.status === 'approved').length;

    const tabs = [
        { key: 'pending', label: 'Pendientes', count: pendingCount },
        { key: 'approved', label: 'Activas', count: approvedCount },
        { key: 'history', label: 'Historial', count: null },
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
                <Button variant="outline" onClick={fetchRequests} disabled={loading} className="shrink-0">
                    <RefreshCw size={16} className={`mr-1 ${loading ? 'animate-spin' : ''}`} /> Actualizar
                </Button>
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
                                    {activeTab === 'pending' && <th className="py-3 px-6 text-right">Acciones</th>}
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
                                        <td className="py-4 px-6 text-gray-600 text-sm">{req.time}</td>
                                        <td className="py-4 px-6">
                                            <Badge
                                                status={req.status === 'completed' ? 'approved' : req.status === 'declined' ? 'ocupado' : req.status}
                                                label={
                                                    req.status === 'pending' ? 'Pendiente' :
                                                        req.status === 'approved' ? 'Activa' :
                                                            req.status === 'completed' ? 'Completada' :
                                                                'Rechazada'
                                                }
                                            />
                                            {req.status === 'declined' && req.motivo_rechazo && (
                                                <div className="mt-2 text-xs text-red-600 bg-red-50 p-1.5 rounded flex items-start max-w-[200px]">
                                                    <AlertTriangle size={12} className="mr-1 mt-0.5 shrink-0" />
                                                    <span className="break-words line-clamp-2" title={req.motivo_rechazo}>
                                                        {req.motivo_rechazo}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        {activeTab === 'pending' && (
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex justify-end gap-2">
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
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        className="!p-1.5"
                                                        title="Rechazar"
                                                        onClick={() => handleDeclineClick(req)}
                                                        disabled={actionLoading === req.id}
                                                    >
                                                        <X size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        )}
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
                title="Rechazar Solicitud"
                actions={
                    <>
                        <Button variant="ghost" onClick={() => setIsDeclineModalOpen(false)}>Cancelar</Button>
                        <Button
                            variant="danger"
                            onClick={submitDecline}
                            disabled={actionLoading === selectedRequest?.id || !motivo.trim()}
                        >
                            {actionLoading === selectedRequest?.id ? 'Procesando...' : 'Confirmar Rechazo'}
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col gap-4 text-sm">
                    <div className="flex items-start bg-red-50 p-3 rounded-md text-red-800">
                        <AlertTriangle size={20} className="mr-2 shrink-0 text-red-600" />
                        <p>
                            ¿Rechazar la solicitud de <strong>{selectedRequest?.requester}</strong> para <strong>{selectedRequest?.space}</strong>?
                            El usuario será notificado del rechazo.
                        </p>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                        <label className="font-medium text-secondary">Motivo de cancelación (requerido)</label>
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
