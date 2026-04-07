import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Award,
    Zap,
    Building2,
    CalendarDays,
    CheckCircle2,
    Activity,
    AlertTriangle,
    Lightbulb,
    ChevronRight
} from 'lucide-react';
import { getReservationStats } from '../../services/api';

// Tarjeta de estadística: Fondo blanco, bordes sutiles, íconos corporativos
const StatisticCard = ({ icon: Icon, label, value, trend, iconBgColor, iconTextColor }) => {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${iconBgColor} ${iconTextColor}`}>
                    <Icon size={24} strokeWidth={2} />
                </div>
                {trend !== undefined && trend !== null && (
                    <div className={`flex items-center gap-1 text-sm font-semibold ${trend >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                        {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">{label}</p>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
        </div>
    );
};

const ReportDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        totalSpaces: 0,
        totalReservations: 0,
        confirmedReservations: 0,
        approvalRate: 0,
        mostPopularSpace: 'Sin datos suficientes',
        leastPopularSpace: 'Sin datos suficientes'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Traemos los datos REALES del backend
            const statsData = await getReservationStats() || [];

            // 1. Total de espacios registrados
            const totalSpaces = statsData.length;

            // 2. Sumamos todas las solicitudes históricas
            const totalReservations = statsData.reduce((sum, space) => sum + Number(space.totalCount || 0), 0);

            // 3. Sumamos solo las aprobadas/completadas
            const confirmedReservations = statsData.reduce((sum, space) => sum + Number(space.confirmedCount || 0), 0);

            // 4. Calculamos la tasa de efectividad general
            const approvalRate = totalReservations > 0
                ? Math.round((confirmedReservations / totalReservations) * 100)
                : 0;

            // 5. El más popular (Debe tener al menos 1 reserva confirmada para ser popular)
            const topSpace = totalSpaces > 0 && statsData[0].confirmedCount > 0
                ? statsData[0].spaceName
                : 'Sin datos suficientes';

            // 6. El menos popular (SOLO se calcula si hay al menos una reserva en todo el sistema)
            const bottomSpace = totalSpaces > 0 && totalReservations > 0
                ? statsData[totalSpaces - 1].spaceName
                : 'Sin datos suficientes';

            // Actualizamos el estado con la matemática real
            setSummary({
                totalSpaces,
                totalReservations,
                confirmedReservations,
                approvalRate,
                mostPopularSpace: topSpace,
                leastPopularSpace: bottomSpace
            });

        } catch (err) {
            console.error('Error cargando estadísticas reales:', err);
            setSummary({
                totalSpaces: 0, totalReservations: 0, confirmedReservations: 0, approvalRate: 0,
                mostPopularSpace: 'Error de conexión', leastPopularSpace: 'Error de conexión'
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 min-h-[40vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Limpio */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Dashboard de Estadísticas</h2>
                <p className="text-gray-500 text-sm">Resumen general en tiempo real del estado de los espacios y reservas</p>
            </div>

            {/* Grid de Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatisticCard
                    icon={Building2}
                    label="Total de Espacios"
                    value={summary.totalSpaces}
                    iconBgColor="bg-slate-100"
                    iconTextColor="text-slate-700"
                />
                <StatisticCard
                    icon={CalendarDays}
                    label="Total de Reservas"
                    value={summary.totalReservations}
                    iconBgColor="bg-blue-50"
                    iconTextColor="text-blue-600"
                />
                <StatisticCard
                    icon={CheckCircle2}
                    label="Reservas Confirmadas"
                    value={summary.confirmedReservations}
                    iconBgColor="bg-teal-50"
                    iconTextColor="text-teal-600"
                />
                <StatisticCard
                    icon={Activity}
                    label="Tasa de Confirmación"
                    value={`${summary.approvalRate}%`}
                    iconBgColor="bg-indigo-50"
                    iconTextColor="text-indigo-600"
                />
            </div>

            {/* Información Destacada */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex items-start gap-5 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-teal-50 rounded-lg">
                        <Award className="text-teal-600" size={28} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Espacio Más Solicitado</h3>
                        <p className="text-xl font-bold text-slate-800">{summary.mostPopularSpace}</p>
                        <p className="text-teal-600 text-sm mt-2 font-medium flex items-center gap-1">
                            <TrendingUp size={14} /> Mayor uso por estudiantes
                        </p>
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex items-start gap-5 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-orange-50 rounded-lg">
                        <AlertTriangle className="text-orange-500" size={28} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Espacio Menos Solicitado</h3>
                        <p className="text-xl font-bold text-slate-800">{summary.leastPopularSpace}</p>
                        <p className="text-orange-600 text-sm mt-2 font-medium flex items-center gap-1">
                            <TrendingDown size={14} /> Revisar estado o equipamiento
                        </p>
                    </div>
                </div>
            </div>

            {/* Recomendaciones */}
            <div className="bg-slate-800 rounded-xl p-6 shadow-md border border-slate-700 text-white mt-8">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-700 rounded-lg mt-1">
                        <Lightbulb className="text-teal-400" size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold mb-4 text-slate-100">Observaciones del Sistema</h3>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-slate-300 text-sm">
                                <ChevronRight size={16} className="text-teal-500 flex-shrink-0" />
                                <span>La tasa de confirmación histórica es del <strong>{summary.approvalRate}%</strong> ({summary.approvalRate >= 70 ? 'Excelente' : summary.approvalRate >= 50 ? 'Estable' : 'Baja'}).</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300 text-sm">
                                <ChevronRight size={16} className="text-teal-500 flex-shrink-0" />
                                <span>Actualmente se administran <strong>{summary.totalSpaces}</strong> espacios con un histórico de <strong>{summary.totalReservations}</strong> solicitudes.</span>
                            </li>
                            {summary.leastPopularSpace !== 'Sin datos suficientes' && (
                                <li className="flex items-center gap-3 text-slate-300 text-sm">
                                    <ChevronRight size={16} className="text-teal-500 flex-shrink-0" />
                                    <span>El espacio <strong>"{summary.leastPopularSpace}"</strong> presenta baja demanda. Verifica si requiere mantenimiento o mejor equipo para la comunidad.</span>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportDashboard;