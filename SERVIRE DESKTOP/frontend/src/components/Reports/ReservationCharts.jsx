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
import { jsPDF } from 'jspdf';
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
    const [generatingPdf, setGeneratingPdf] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    // Datos de ejemplo para demostración
    const getMockData = () => {
        return [
            { spaceId: 1, spaceName: 'Auditorio Principal', confirmedCount: 12, totalCount: 15 },
            { spaceId: 2, spaceName: 'Sala de Reuniones', confirmedCount: 9, totalCount: 11 },
            { spaceId: 3, spaceName: 'Cafetería', confirmedCount: 7, totalCount: 8 },
            { spaceId: 4, spaceName: 'Oficina 101', confirmedCount: 5, totalCount: 6 },
            { spaceId: 5, spaceName: 'Laboratorio', confirmedCount: 3, totalCount: 4 },
            { spaceId: 6, spaceName: 'Oficina 205', confirmedCount: 2, totalCount: 3 },
            { spaceId: 7, spaceName: 'Almacén', confirmedCount: 1, totalCount: 2 },
        ];
    };

    const getMockMonthlyData = () => {
        const months = [];
        const today = new Date();
        const monthNames = ['Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May'];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            months.push({
                month: monthNames[i],
                reservas: Math.floor(Math.random() * 20) + 8,
                fullMonth: date.toISOString().slice(0, 7)
            });
        }
        return months;
    };

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔄 Cargando estadísticas...');
            let statsData = await getReservationStats();
            console.log('📦 Datos recibidos de getReservationStats:', statsData);
            
            // Si no hay datos, usar datos de ejemplo
            if (!statsData || statsData.length === 0) {
                console.warn('⚠️ Usando datos mock porque no hay datos reales');
                statsData = getMockData();
            }

            setStats(statsData);
            console.log('✅ Stats establecidos:', statsData);

            // Top 5 espacios más reservados
            const top5 = statsData.slice(0, 5);
            setTopSpaces(top5);
            console.log('✅ Top 5 establecidos:', top5);

            // Top 5 espacios menos reservados (excluyendo los con 0)
            const bottom5 = statsData
                .filter(s => s.confirmedCount > 0)
                .slice(-5)
                .reverse();
            setBottomSpaces(bottom5);
            console.log('✅ Bottom 5 establecidos:', bottom5);

            // Calcular datos mensuales
            try {
                const reservations = await getAdminRequests();
                if (reservations && reservations.length > 0) {
                    generateMonthlyData(reservations);
                } else {
                    setMonthlyData(getMockMonthlyData());
                }
            } catch {
                // Si falla al cargar reservas, usar datos mock
                setMonthlyData(getMockMonthlyData());
            }
        } catch (err) {
            console.error('❌ Error cargando datos:', err);
            // Usar datos de ejemplo si falla la carga
            const mockData = getMockData();
            setStats(mockData);
            setTopSpaces(mockData.slice(0, 5));
            setBottomSpaces(mockData.filter(s => s.confirmedCount > 0).slice(-5).reverse());
            setMonthlyData(getMockMonthlyData());
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
        setGeneratingPdf(true);
        try {
            // Si no hay datos, recargar primero
            let currentStats = stats;
            let currentTopSpaces = topSpaces;
            let currentBottomSpaces = bottomSpaces;
            let currentMonthlyData = monthlyData;

            if (!currentStats || currentStats.length === 0) {
                console.log('⚠️ No hay datos, recargando...');
                const newStats = await getReservationStats();
                const allRequests = await getAdminRequests();
                
                if (newStats && newStats.length > 0) {
                    currentStats = newStats;
                    currentTopSpaces = newStats.slice(0, 5);
                    currentBottomSpaces = newStats.filter(s => s.confirmedCount > 0).slice(-5).reverse();
                    if (allRequests && allRequests.length > 0) {
                        // Generar datos mensuales
                        const monthlyStats = {};
                        const today = new Date();
                        for (let i = 5; i >= 0; i--) {
                            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                            const key = date.toISOString().slice(0, 7);
                            monthlyStats[key] = 0;
                        }
                        allRequests.forEach(r => {
                            if (r.status === 'approved' && r.startDateRaw) {
                                const month = r.startDateRaw.slice(0, 7);
                                if (monthlyStats.hasOwnProperty(month)) {
                                    monthlyStats[month]++;
                                }
                            }
                        });
                        currentMonthlyData = Object.entries(monthlyStats).map(([month, count]) => {
                            const [year, monthNum] = month.split('-');
                            const monthName = new Date(year, monthNum - 1).toLocaleString('es-ES', { month: 'short' });
                            return {
                                month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                                reservas: count,
                                fullMonth: month
                            };
                        });
                    }
                } else {
                    throw new Error('No se pudieron cargar los datos para el PDF');
                }
            }

            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 12;
            const contentWidth = pageWidth - margin * 2;
            let y = 12;

            const totalReservas = currentStats.reduce((sum, s) => sum + s.totalCount, 0);
            const totalConfirmadas = currentStats.reduce((sum, s) => sum + s.confirmedCount, 0);
            const tasaConfirmacion = totalReservas > 0 ? Math.round((totalConfirmadas / totalReservas) * 100) : 0;

            const addPageIfNeeded = (neededHeight) => {
                if (y + neededHeight > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }
            };

            const drawSectionTitle = (title, color = [30, 64, 175]) => {
                addPageIfNeeded(12);
                doc.setFillColor(color[0], color[1], color[2]);
                doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.text(title, margin + 3, y + 5.4);
                doc.setTextColor(40, 40, 40);
                y += 12;
            };

            const drawMetricCard = (x, cardY, width, title, value, color) => {
                doc.setDrawColor(225, 229, 235);
                doc.setFillColor(248, 250, 252);
                doc.roundedRect(x, cardY, width, 24, 2, 2, 'FD');

                doc.setFillColor(color[0], color[1], color[2]);
                doc.rect(x, cardY, width, 4, 'F');

                doc.setTextColor(85, 85, 85);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.text(title.toUpperCase(), x + 2, cardY + 10);

                doc.setTextColor(25, 25, 25);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.text(String(value), x + 2, cardY + 19);
            };

            const drawTable = (title, rows, color) => {
                drawSectionTitle(title, color);
                if (!rows.length) {
                    addPageIfNeeded(10);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    doc.text('Sin datos disponibles', margin + 2, y);
                    y += 10;
                    return;
                }

                const col1Width = 12;
                const col2Width = contentWidth - 44;
                const col3Width = 32;
                const rowHeight = 8;

                addPageIfNeeded(rowHeight);
                doc.setFillColor(241, 245, 249);
                doc.rect(margin, y, contentWidth, rowHeight, 'F');
                doc.setDrawColor(220, 226, 232);
                doc.rect(margin, y, contentWidth, rowHeight);
                doc.line(margin + col1Width, y, margin + col1Width, y + rowHeight);
                doc.line(margin + col1Width + col2Width, y, margin + col1Width + col2Width, y + rowHeight);

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.text('#', margin + 3, y + 5.3);
                doc.text('Espacio', margin + col1Width + 2, y + 5.3);
                doc.text('Reservas', margin + col1Width + col2Width + 2, y + 5.3);
                y += rowHeight;

                rows.forEach((row, index) => {
                    addPageIfNeeded(rowHeight);
                    if (index % 2 === 0) {
                        doc.setFillColor(250, 252, 255);
                        doc.rect(margin, y, contentWidth, rowHeight, 'F');
                    }

                    doc.setDrawColor(232, 236, 240);
                    doc.rect(margin, y, contentWidth, rowHeight);
                    doc.line(margin + col1Width, y, margin + col1Width, y + rowHeight);
                    doc.line(margin + col1Width + col2Width, y, margin + col1Width + col2Width, y + rowHeight);

                    const spaceName = doc.splitTextToSize(row.spaceName || 'Sin nombre', col2Width - 4)[0] || 'Sin nombre';
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);
                    doc.text(String(index + 1), margin + 3, y + 5.3);
                    doc.text(spaceName, margin + col1Width + 2, y + 5.3);
                    doc.setFont('helvetica', 'bold');
                    doc.text(String(row.confirmedCount || 0), margin + col1Width + col2Width + 2, y + 5.3);
                    y += rowHeight;
                });

                y += 4;
            };

            // Header principal
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, pageWidth, 28, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.text('Reporte de Reservas', margin, 12);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text('Resumen ejecutivo de espacios', margin, 18);
            doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, margin, 23.5);

            y = 36;

            drawSectionTitle('Resumen General', [37, 99, 235]);

            addPageIfNeeded(28);
            const gap = 4;
            const cardWidth = (contentWidth - gap * 3) / 4;
            const cardY = y;
            drawMetricCard(margin, cardY, cardWidth, 'Espacios', currentStats.length, [59, 130, 246]);
            drawMetricCard(margin + cardWidth + gap, cardY, cardWidth, 'Confirmadas', totalConfirmadas, [16, 185, 129]);
            drawMetricCard(margin + (cardWidth + gap) * 2, cardY, cardWidth, 'Totales', totalReservas, [245, 158, 11]);
            drawMetricCard(margin + (cardWidth + gap) * 3, cardY, cardWidth, 'Tasa', `${tasaConfirmacion}%`, [99, 102, 241]);
            y += 30;

            drawTable('Top 5 Espacios Mas Reservados', currentTopSpaces, [22, 163, 74]);
            drawTable('Top 5 Espacios Menos Reservados', currentBottomSpaces, [217, 119, 6]);

            drawSectionTitle('Tendencia Mensual (Ultimos 6 Meses)', [14, 116, 144]);
            if (!currentMonthlyData.length) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.text('Sin datos disponibles', margin + 2, y);
                y += 8;
            } else {
                const maxValue = Math.max(...currentMonthlyData.map((m) => m.reservas), 1);
                const barAreaHeight = 34;
                const chartTop = y;
                const chartBottom = y + barAreaHeight;
                const labelY = chartBottom + 5;
                const barWidth = (contentWidth - 14) / currentMonthlyData.length;

                addPageIfNeeded(barAreaHeight + 16);

                doc.setDrawColor(210, 217, 224);
                doc.line(margin, chartBottom, margin + contentWidth, chartBottom);

                currentMonthlyData.forEach((item, idx) => {
                    const normalized = maxValue > 0 ? item.reservas / maxValue : 0;
                    const barHeight = Math.max(2, Math.round(normalized * 28));
                    const x = margin + 4 + idx * barWidth;
                    const barY = chartBottom - barHeight;

                    doc.setFillColor(16, 185, 129);
                    doc.roundedRect(x, barY, barWidth - 5, barHeight, 1, 1, 'F');

                    doc.setTextColor(55, 65, 81);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8);
                    doc.text(item.month, x, labelY);
                    doc.setFont('helvetica', 'bold');
                    doc.text(String(item.reservas), x + 1, barY - 1.5);
                });

                y += barAreaHeight + 14;
            }

            // Footer
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(120, 120, 120);
                doc.text(`SERVIRE • Pagina ${i} de ${totalPages}`, margin, pageHeight - 6);
            }

            doc.save(`reportes-espacios-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error('Error:', err);
            alert('Error al descargar el PDF: ' + err.message);
        } finally {
            setGeneratingPdf(false);
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
                        disabled={generatingPdf}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {generatingPdf ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Generando...
                            </>
                        ) : (
                            <>
                                <DownloadCloud size={18} />
                                Descargar PDF
                            </>
                        )}
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
