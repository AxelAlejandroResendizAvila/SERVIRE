import React, { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { DownloadCloud, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getReservationStats, getAdminRequests } from '../../services/api';
import ReportDashboard from './ReportDashboard';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const ReservationCharts = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [topSpaces, setTopSpaces] = useState([]);
    const [bottomSpaces, setBottomSpaces] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const statsData = await getReservationStats();
            setStats(statsData);

            // Top 5 espacios más reservados
            const top5 = statsData.slice(0, 5);
            setTopSpaces(top5);

            // Top 5 espacios menos reservados (excluyendo los con 0)
            const bottom5 = statsData
                .filter(s => s.confirmedCount > 0)
                .slice(-5)
                .reverse();
            setBottomSpaces(bottom5);

            // Calcular datos mensuales
            const reservations = await getAdminRequests();
            generateMonthlyData(reservations);
        } catch (err) {
            console.error('Error cargando datos:', err);
            setError('Error al cargar los datos de reservas');
        } finally {
            setLoading(false);
        }
    };

    const generateMonthlyData = (reservations) => {
        const monthlyStats = {};
        const today = new Date();

        // Inicializar últimos 6 meses
        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = date.toISOString().slice(0, 7);
            monthlyStats[key] = 0;
        }

        // Contar reservas por mes (solo confirmadas)
        reservations.forEach(r => {
            if (r.status === 'approved' && r.startDateRaw) {
                const month = r.startDateRaw.slice(0, 7);
                if (monthlyStats.hasOwnProperty(month)) {
                    monthlyStats[month]++;
                }
            }
        });

        const monthlyArray = Object.entries(monthlyStats).map(([month, count]) => {
            const [year, monthNum] = month.split('-');
            const monthName = new Date(year, monthNum - 1).toLocaleString('es-ES', { month: 'short' });
            return {
                month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                reservas: count,
                fullMonth: month
            };
        });

        setMonthlyData(monthlyArray);
    };

    const downloadPDF = async () => {
        try {
            const element = document.getElementById('reports-container');
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 280;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 10;

            // Primera página
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pdf.internal.pageSize.getHeight() - 20;

            // Páginas adicionales si es necesario
            while (heightLeft > 0) {
                position = heightLeft - imgHeight + 10;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }

            // Agregar información adicional
            const totalPages = pdf.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(10);
                pdf.setTextColor(128);
                pdf.text(
                    `Reporte General de Reservas - ${new Date().toLocaleDateString('es-ES')}`,
                    pdf.internal.pageSize.getWidth() / 2,
                    pdf.internal.pageSize.getHeight() - 5,
                    { align: 'center' }
                );
                pdf.text(
                    `Página ${i} de ${totalPages}`,
                    pdf.internal.pageSize.getWidth() - 20,
                    pdf.internal.pageSize.getHeight() - 5,
                    { align: 'right' }
                );
            }

            pdf.save(`reportes-espacios-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error('Error al descargar PDF:', err);
            alert('Error al descargar el PDF');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 m-4">
                {error}
                <button
                    onClick={loadData}
                    className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Dashboard Summary */}
            <div className="mb-12">
                <ReportDashboard />
            </div>

            {/* Detailed Reports */}
            <div id="reports-container" className="p-6 bg-white rounded-lg shadow-lg">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-secondary mb-2">📊 Análisis Detallado</h1>
                    <p className="text-gray-600">
                        Gráficas detalladas de espacios reservados al {new Date().toLocaleDateString('es-ES')}
                    </p>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-4 mb-8 justify-end">
                    <button
                        onClick={loadData}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                    >
                        <RefreshCw size={18} />
                        Actualizar
                    </button>
                    <button
                        onClick={downloadPDF}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                    >
                        <DownloadCloud size={18} />
                        Descargar PDF
                    </button>
                </div>

                {/* Gráficas principales */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Top 5 Espacios Más Reservados */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 shadow-lg">
                        <h2 className="text-2xl font-bold text-secondary mb-6">
                            🏆 Top 5 Espacios Más Reservados
                        </h2>
                        {topSpaces.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={topSpaces}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis
                                        dataKey="spaceName"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value) => [value, 'Reservas']}
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '2px solid #3b82f6',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Bar
                                        dataKey="confirmedCount"
                                        fill="#3b82f6"
                                        radius={[8, 8, 0, 0]}
                                        name="Reservas Confirmadas"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-gray-600">No hay datos disponibles</p>
                        )}
                        <div className="mt-6 space-y-2">
                            {topSpaces.map((space, idx) => (
                                <div key={space.spaceId} className="flex justify-between items-center p-3 bg-white rounded-lg">
                                    <span className="font-semibold text-gray-800">
                                        {idx + 1}. {space.spaceName}
                                    </span>
                                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                        {space.confirmedCount} reservas
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Espacios Menos Reservados */}
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 shadow-lg">
                        <h2 className="text-2xl font-bold text-secondary mb-6">
                            📊 Top 5 Espacios Menos Reservados
                        </h2>
                        {bottomSpaces.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={bottomSpaces}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis
                                        dataKey="spaceName"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value) => [value, 'Reservas']}
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '2px solid #f59e0b',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Bar
                                        dataKey="confirmedCount"
                                        fill="#f59e0b"
                                        radius={[8, 8, 0, 0]}
                                        name="Reservas Confirmadas"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-gray-600">No hay datos disponibles</p>
                        )}
                        <div className="mt-6 space-y-2">
                            {bottomSpaces.map((space, idx) => (
                                <div key={space.spaceId} className="flex justify-between items-center p-3 bg-white rounded-lg">
                                    <span className="font-semibold text-gray-800">
                                        {idx + 1}. {space.spaceName}
                                    </span>
                                    <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                        {space.confirmedCount} reservas
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Gráfica de Tendencia Mensual */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 shadow-lg mb-8">
                    <h2 className="text-2xl font-bold text-secondary mb-6">
                        📈 Tendencia de Reservas (Últimos 6 Meses)
                    </h2>
                    {monthlyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value) => [value, 'Reservas']}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '2px solid #10b981',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="reservas"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ fill: '#10b981', r: 6 }}
                                    activeDot={{ r: 8 }}
                                    name="Reservas Confirmadas"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-gray-600">No hay datos disponibles</p>
                    )}
                </div>

                {/* Estadísticas Generales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
                        <h3 className="text-lg font-semibold mb-2">Total de Espacios</h3>
                        <p className="text-4xl font-bold">{stats.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
                        <h3 className="text-lg font-semibold mb-2">Reservas Confirmadas</h3>
                        <p className="text-4xl font-bold">
                            {stats.reduce((sum, s) => sum + s.confirmedCount, 0)}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-6 text-white shadow-lg">
                        <h3 className="text-lg font-semibold mb-2">Total de Reservas</h3>
                        <p className="text-4xl font-bold">
                            {stats.reduce((sum, s) => sum + s.totalCount, 0)}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
                        <h3 className="text-lg font-semibold mb-2">Tasa de Confirmación</h3>
                        <p className="text-4xl font-bold">
                            {stats.length > 0
                                ? Math.round(
                                    (stats.reduce((sum, s) => sum + s.confirmedCount, 0) /
                                        stats.reduce((sum, s) => sum + s.totalCount, 0) || 1) * 100
                                )
                                : 0}
                            %
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReservationCharts;
