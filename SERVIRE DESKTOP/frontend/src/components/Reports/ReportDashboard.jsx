import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Award, Zap } from 'lucide-react';
import { getReservationStats, getAdminRequests } from '../../services/api';

const StatisticCard = ({ icon: Icon, label, value, trend, background, textColor }) => {
    return (
        <div className={`${background} rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:scale-105 transition-transform`}>
            <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">{Icon}</div>
                {trend && (
                    <div className={`flex items-center gap-1 text-sm font-semibold ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trend > 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">{label}</p>
            <p className={`text-4xl font-bold ${textColor}`}>{value}</p>
        </div>
    );
};

const ReportDashboard = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        totalSpaces: 0,
        totalReservations: 0,
        confirmedReservations: 0,
        approvalRate: 0,
        mostPopularSpace: '',
        leastPopularSpace: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const statsData = await getReservationStats();
            const allRequests = await getAdminRequests();

            setStats(statsData);

            // Calcular resumen
            const totalReservations = allRequests.length;
            const confirmedCount = allRequests.filter(r => r.status === 'approved').length;
            const topSpace = statsData.length > 0 ? statsData[0].spaceName : 'N/A';
            const bottomSpace = statsData.length > 0
                ? statsData.filter(s => s.confirmedCount > 0).pop()?.spaceName || 'N/A'
                : 'N/A';

            setSummary({
                totalSpaces: statsData.length,
                totalReservations,
                confirmedReservations: confirmedCount,
                approvalRate: totalReservations > 0 ? Math.round((confirmedCount / totalReservations) * 100) : 0,
                mostPopularSpace: topSpace,
                leastPopularSpace: bottomSpace
            });
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}

            {/*borrado icono dahs*/}
            
            <div>
                <h2 className="text-3xl font-bold text-secondary mb-2">Dashboard de Estadísticas</h2>
                <p className="text-gray-600">Resumen rápido del estado de los espacios y reservas</p>
            </div>

            {/* Grid de Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatisticCard
                    icon="🏢"
                    label="Total de Espacios"
                    value={summary.totalSpaces}
                    background="bg-gradient-to-br from-blue-500 to-blue-600"
                    textColor="text-white"
                />
                <StatisticCard
                    icon="📅"
                    label="Total de Reservas"
                    value={summary.totalReservations}
                    background="bg-gradient-to-br from-purple-500 to-purple-600"
                    textColor="text-white"
                />
                <StatisticCard
                    icon="✅"
                    label="Reservas Confirmadas"
                    value={summary.confirmedReservations}
                    background="bg-gradient-to-br from-green-500 to-green-600"
                    textColor="text-white"
                />
                <StatisticCard
                    icon="📈"
                    label="Tasa de Confirmación"
                    value={`${summary.approvalRate}%`}
                    background="bg-gradient-to-br from-orange-500 to-orange-600"
                    textColor="text-white"
                />
            </div>

            {/* Información Destacada */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 rounded-lg p-6 shadow-md">
                    <div className="flex items-start gap-4">
                        <div className="text-4xl">🏆</div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-secondary mb-2">Espacio Más Popular</h3>
                            <p className="text-gray-700 text-xl font-semibold">{summary.mostPopularSpace}</p>
                            <p className="text-green-600 text-sm mt-2">Mayor número de reservas confirmadas</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500 rounded-lg p-6 shadow-md">
                    <div className="flex items-start gap-4">
                        <div className="text-4xl">⚠️</div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-secondary mb-2">Espacio Menos Popular</h3>
                            <p className="text-gray-700 text-xl font-semibold">{summary.leastPopularSpace}</p>
                            <p className="text-orange-600 text-sm mt-2">Considera estrategias de promoción</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recomendaciones */}
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 shadow-md">
                <div className="flex items-start gap-4">
                    <Zap className="text-blue-600 mt-1" size={24} />
                    <div>
                        <h3 className="text-lg font-bold text-secondary mb-2">💡 Recomendaciones</h3>
                        <ul className="space-y-2 text-gray-700">
                            <li>✓ La tasa de confirmación es del {summary.approvalRate}% - {summary.approvalRate >= 70 ? 'Excelente' : summary.approvalRate >= 50 ? 'Buena' : 'Necesita mejorar'}</li>
                            <li>✓ Estás administrando {summary.totalSpaces} espacios con {summary.totalReservations} solicitudes totales</li>
                            <li>✓ Considera promocionar el espacio "{summary.leastPopularSpace}" para aumentar su ocupación</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportDashboard;
