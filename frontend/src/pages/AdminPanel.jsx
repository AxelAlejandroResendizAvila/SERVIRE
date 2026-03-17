import React, { useState, useEffect } from 'react';
import { Lock, Check, X, AlertTriangle } from 'lucide-react';
import Badge from '../components/UI/Badge';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import { getAdminRequests } from '../services/api';

const AdminPanel = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [declineReason, setDeclineReason] = useState('');

    useEffect(() => {
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
        fetchRequests();
    }, []);

    const handleAuthorize = (id) => {
        setRequests(requests.map(req => req.id === id ? { ...req, status: 'approved' } : req));
    };

    const handleDeclineClick = (request) => {
        setSelectedRequest(request);
        setDeclineReason('');
        setIsDeclineModalOpen(true);
    };

    const submitDecline = () => {
        if (selectedRequest) {
            setRequests(requests.map(req =>
                req.id === selectedRequest.id ? { ...req, status: 'declined', reason: declineReason } : req
            ));
        }
        setIsDeclineModalOpen(false);
        setSelectedRequest(null);
    };

    const handleBlock = (id) => {
        setRequests(requests.map(req => req.id === id ? { ...req, status: 'blocked' } : req));
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-secondary">Panel de Administración</h1>
                <p className="text-gray-500 mt-1">
                    Gestiona las solicitudes de reservación y aparta espacios.
                </p>
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
                                    <th className="py-3 px-6 w-1/4">Solicitante</th>
                                    <th className="py-3 px-6 w-1/4">Espacio</th>
                                    <th className="py-3 px-6 w-1/6">Horario</th>
                                    <th className="py-3 px-6 w-1/6">Estado</th>
                                    <th className="py-3 px-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((req) => (
                                    <tr key={req.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mr-3">
                                                    {req.requester.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-secondary">{req.requester}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-700">{req.space}</td>
                                        <td className="py-4 px-6 text-gray-600 text-sm">{req.time}</td>
                                        <td className="py-4 px-6">
                                            <Badge
                                                status={req.status === 'blocked' ? 'danger' : req.status === 'declined' ? 'danger' : req.status}
                                                label={
                                                    req.status === 'pending' ? 'Pendiente' :
                                                        req.status === 'approved' ? 'Aprobado' :
                                                            req.status === 'blocked' ? 'Bloqueado' :
                                                                'Rechazado'
                                                }
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
                                                    >
                                                        <Check size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        className="!p-1.5"
                                                        title="Declinar"
                                                        onClick={() => handleDeclineClick(req)}
                                                    >
                                                        <X size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="warning"
                                                        size="sm"
                                                        className="!p-1.5"
                                                        title="Apartar / Bloqueo Especial"
                                                        onClick={() => handleBlock(req.id)}
                                                    >
                                                        <Lock size={16} />
                                                    </Button>
                                                </div>
                                            )}
                                            {req.status !== 'pending' && (
                                                <span className="text-sm text-gray-400 italic">Previamente gestionado</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                {requests.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-gray-500">
                                            No hay solicitudes pendientes.
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
                title="Declinar Solicitud"
                actions={
                    <>
                        <Button variant="ghost" onClick={() => setIsDeclineModalOpen(false)}>Cancelar</Button>
                        <Button variant="danger" onClick={submitDecline} disabled={!declineReason.trim()}>Confirmar Rechazo</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="flex items-start bg-red-50 p-3 rounded-md text-red-800 text-sm mb-4">
                        <AlertTriangle size={20} className="mr-2 shrink-0 text-red-600" />
                        <p>
                            Estás a punto de declinar la solicitud de <strong>{selectedRequest?.requester}</strong> para <strong>{selectedRequest?.space}</strong>.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                            Motivo de rechazo (requerido)
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
