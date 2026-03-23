import React, { useState, useEffect } from 'react';
import { Lock, Check, X, AlertTriangle, RefreshCw } from 'lucide-react';
import Badge from '../components/UI/Badge';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import { getAdminRequests, updateReservationStatus } from '../services/api';

const AdminPanel = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    // Modal state
    const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [declineReason, setDeclineReason] = useState('');

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

    useEffect(() => {
        fetchRequests();
        // Auto refresh every 5 seconds
        const interval = setInterval(fetchRequests, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleAuthorize = async (id) => {
        setUpdating(id);
        try {
            await updateReservationStatus(id, 'confirmada');
            setRequests(requests.map(req => 
                req.id === id ? { ...req, status: 'approved', estado: 'confirmada' } : req
            ));
        } catch (error) {
            console.error('Error authorizing:', error);
            alert('Error al autorizar la reserva');
        } finally {
            setUpdating(null);
        }
    };

    const handleDeclineClick = (request) => {
        setSelectedRequest(request);
        setDeclineReason('');
        setIsDeclineModalOpen(true);
    };

    const submitDecline = async () => {
        if (selectedRequest) {
            setUpdating(selectedRequest.id);
            try {
                await updateReservationStatus(selectedRequest.id, 'cancelada');
                setRequests(requests.map(req =>
                    req.id === selectedRequest.id ? { ...req, status: 'declined', estado: 'cancelada' } : req
                ));
            } catch (error) {
                console.error('Error declining:', error);
                alert('Error al rechazar la reserva');
            } finally {
                setUpdating(null);
            }
        }
        setIsDeclineModalOpen(false);
        setSelectedRequest(null);
    };

    const getStatusLabel = (status) => {
        switch(status) {
            case 'pending': return 'Pendiente';
            case 'approved': return 'Confirmada';
            case 'declined': return 'Cancelada';
            default: return status;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Panel de Administración</h1>
                    <p className="text-gray-500 mt-1">
                        Gestiona las solicitudes de reservación de espacios.
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchRequests}
                    disabled={loading}
                    className="flex items-center gap-2"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Actualizar
                </Button>
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
                                    <th className="py-3 px-6 w-1/5">Solicitante</th>
                                    <th className="py-3 px-6 w-1/5">Espacio</th>
                                    <th className="py-3 px-6 w-1/6">Fecha</th>
                                    <th className="py-3 px-6 w-1/6">Horario</th>
                                    <th className="py-3 px-6 w-1/8">Estado</th>
                                    <th className="py-3 px-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((req) => (
                                    <tr key={req.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mr-3 text-sm">
                                                    {req.requester.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-secondary">{req.requester}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-700">{req.space}</td>
                                        <td className="py-4 px-6 text-gray-600 text-sm">{req.date}</td>
                                        <td className="py-4 px-6 text-gray-600 text-sm">{req.time}</td>
                                        <td className="py-4 px-6">
                                            <Badge
                                                status={req.status === 'declined' ? 'danger' : req.status}
                                                label={getStatusLabel(req.status)}
                                            />
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {req.status === 'pending' && (
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        className="!p-1.5"
                                                        title="Autorizar"
                                                        onClick={() => handleAuthorize(req.id)}
                                                        disabled={updating !== null}
                                                    >
                                                        <Check size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        className="!p-1.5"
                                                        title="Declinar"
                                                        onClick={() => handleDeclineClick(req)}
                                                        disabled={updating !== null}
                                                    >
                                                        <X size={16} />
                                                    </Button>
                                                </div>
                                            )}
                                            {req.status !== 'pending' && (
                                                <span className="text-xs text-gray-400 italic">
                                                    {req.status === 'approved' ? 'Autorizado' : 'Rechazado'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                {requests.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-gray-500">
                                            No hay solicitudes de reserva.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Decline Options Modal */}
            <Modal
                isOpen={isDeclineModalOpen}
                onClose={() => setIsDeclineModalOpen(false)}
                title="Rechazar Reserva"
                actions={
                    <>
                        <Button variant="ghost" onClick={() => setIsDeclineModalOpen(false)}>Cancelar</Button>
                        <Button variant="danger" onClick={submitDecline} disabled={updating !== null}>
                            Confirmar Rechazo
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="flex items-start bg-red-50 p-3 rounded-md text-red-800 text-sm mb-4">
                        <AlertTriangle size={20} className="mr-2 shrink-0 text-red-600" />
                        <p>
                            Estás a punto de rechazar la reserva de <strong>{selectedRequest?.requester}</strong> para <strong>{selectedRequest?.space}</strong>.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                            Motivo del rechazo
                        </label>
                        <textarea
                            id="reason"
                            rows={3}
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="Ej. Espacio en mantenimiento..."
                        ></textarea>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminPanel;
