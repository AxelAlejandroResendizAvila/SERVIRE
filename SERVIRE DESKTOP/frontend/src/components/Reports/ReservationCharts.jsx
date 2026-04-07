import React, { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import {
    DownloadCloud,
    RefreshCw,
    Filter,
    Trophy,
    AlertCircle,
    LineChart as LineChartIcon,
    Building2,
    CheckCircle2,
    CalendarDays,
    Activity
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { getReservationStats, getAdminRequests } from '../../services/api';
import ReportDashboard from './ReportDashboard';

const ReservationCharts = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [topSpaces, setTopSpaces] = useState([]);
    const [bottomSpaces, setBottomSpaces] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [allRawRequests, setAllRawRequests] = useState([]); // Guardamos todo para filtrar rápido

    // Filtro para el PDF
    const [reportFilter, setReportFilter] = useState('todos');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Traer estadísticas reales (Si está vacío, no inventa datos)
            const statsData = await getReservationStats() || [];
            setStats(statsData);

            // Ordenamos y sacamos Tops
            const sortedStats = [...statsData].sort((a, b) => b.confirmedCount - a.confirmedCount);
            setTopSpaces(sortedStats.slice(0, 5));
            setBottomSpaces(sortedStats.filter(s => s.confirmedCount > 0).slice(-5).reverse());

            // 2. Traer historial de reservas para calcular línea de tiempo
            const reservations = await getAdminRequests() || [];
            setAllRawRequests(reservations); // Guardar para usar en el PDF

            if (reservations.length > 0) {
                generateMonthlyData(reservations);
            } else {
                setMonthlyData([]);
            }

        } catch (err) {
            console.error('Error cargando datos reales:', err);
            setError('Error al conectar con la base de datos de SERVIRE.');
            // Si falla, limpiar las gráficas
            setStats([]); setTopSpaces([]); setBottomSpaces([]); setMonthlyData([]);
        } finally {
            setLoading(false);
        }
    };

    const generateMonthlyData = (reservations) => {
        const monthlyStats = {};
        const today = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = date.toISOString().slice(0, 7);
            monthlyStats[key] = 0;
        }

        reservations.forEach(r => {
            // Solo contamos las aprobadas para la línea de tendencia
            if ((r.status === 'approved' || r.status === 'completed') && r.startDateRaw) {
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
            const now = new Date();
            let periodoTexto = "Histórico General";
            let filteredRequests = [...allRawRequests];

            // 1. Filtrar las reservaciones en crudo según la selección
            if (reportFilter === 'dia') {
                periodoTexto = "Reporte del Día";
                filteredRequests = filteredRequests.filter(r => {
                    if (!r.startDateRaw) return false;
                    return new Date(r.startDateRaw).toDateString() === now.toDateString();
                });
            } else if (reportFilter === 'semana') {
                periodoTexto = "Reporte de la Semana";
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filteredRequests = filteredRequests.filter(r => {
                    if (!r.startDateRaw) return false;
                    return new Date(r.startDateRaw) >= weekAgo;
                });
            } else if (reportFilter === 'mes') {
                periodoTexto = "Reporte del Mes Actual";
                filteredRequests = filteredRequests.filter(r => {
                    if (!r.startDateRaw) return false;
                    const d = new Date(r.startDateRaw);
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                });
            }

            // 2. Recalcular las estadísticas de los espacios basándonos SOLO en el filtro
            const dynamicSpaceStatsMap = new Map();

            // Inicializar el mapa con todos los espacios a cero
            stats.forEach(s => {
                dynamicSpaceStatsMap.set(s.spaceId, {
                    spaceName: s.spaceName,
                    totalCount: 0,
                    confirmedCount: 0
                });
            });

            // Llenar el mapa contando las solicitudes filtradas
            filteredRequests.forEach(r => {
                if(dynamicSpaceStatsMap.has(r.spaceId)) {
                    const space = dynamicSpaceStatsMap.get(r.spaceId);
                    space.totalCount += 1;
                    if (r.status === 'approved' || r.status === 'completed') {
                        space.confirmedCount += 1;
                    }
                }
            });

            const dynamicStats = Array.from(dynamicSpaceStatsMap.values());
            const sortedDynamicStats = [...dynamicStats].sort((a, b) => b.confirmedCount - a.confirmedCount);

            // Recalcular Top y Bottom para el PDF
            const pdfTopSpaces = sortedDynamicStats.slice(0, 5);
            const pdfBottomSpaces = sortedDynamicStats.filter(s => s.confirmedCount > 0).slice(-5).reverse();

            // Totales para las tarjetas del PDF
            const totalReservasFiltro = filteredRequests.length;
            const totalConfirmadasFiltro = filteredRequests.filter(r => r.status === 'approved' || r.status === 'completed').length;
            const tasaConfirmacionFiltro = totalReservasFiltro > 0 ? Math.round((totalConfirmadasFiltro / totalReservasFiltro) * 100) : 0;

            // --- INICIO DIBUJO jsPDF ---
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 12;
            const contentWidth = pageWidth - margin * 2;
            let y = 12;

            const addPageIfNeeded = (neededHeight) => {
                if (y + neededHeight > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }
            };

            const drawSectionTitle = (title, color = [15, 23, 42]) => {
                addPageIfNeeded(12);
                doc.setFillColor(color[0], color[1], color[2]);
                doc.roundedRect(margin, y, contentWidth, 8, 1, 1, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.text(title, margin + 4, y + 5.5);
                doc.setTextColor(40, 40, 40);
                y += 12;
            };

            const drawMetricCard = (x, cardY, width, title, value, color) => {
                doc.setDrawColor(226, 232, 240);
                doc.setFillColor(248, 250, 252);
                doc.roundedRect(x, cardY, width, 22, 1, 1, 'FD');
                doc.setFillColor(color[0], color[1], color[2]);
                doc.rect(x, cardY, width, 3, 'F');
                doc.setTextColor(100, 116, 139);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.text(title.toUpperCase(), x + 3, cardY + 9);
                doc.setTextColor(30, 41, 59);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(15);
                doc.text(String(value), x + 3, cardY + 17);
            };

            const drawTable = (title, rows, color) => {
                drawSectionTitle(title, color);
                if (!rows.length) {
                    addPageIfNeeded(10);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    doc.text('Sin datos registrados en este periodo.', margin + 2, y);
                    y += 10;
                    return;
                }

                const col1Width = 12;
                const col2Width = contentWidth - 44;
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
                doc.text('Aprobadas', margin + col1Width + col2Width + 2, y + 5.3);
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

                    const spaceName = doc.splitTextToSize(row.spaceName || 'Desconocido', col2Width - 4)[0] || '';
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

            // Header corporativo
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, pageWidth, 30, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.text('Reporte de Reservas SERVIRE', margin, 14);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(148, 163, 184);
            doc.text(`Periodo Analizado: ${periodoTexto}`, margin, 20);
            doc.text(`Generado el: ${new Date().toLocaleString('es-ES')}`, margin, 25);

            y = 38;

            drawSectionTitle(`Métricas del Periodo`, [13, 148, 136]); // Teal

            addPageIfNeeded(28);
            const gap = 4;
            const cardWidth = (contentWidth - gap * 3) / 4;

            drawMetricCard(margin, y, cardWidth, 'Espacios Totales', stats.length, [71, 85, 105]);
            drawMetricCard(margin + cardWidth + gap, y, cardWidth, 'Confirmadas', totalConfirmadasFiltro, [13, 148, 136]);
            drawMetricCard(margin + (cardWidth + gap) * 2, y, cardWidth, 'Solicitudes', totalReservasFiltro, [56, 189, 248]);
            drawMetricCard(margin + (cardWidth + gap) * 3, y, cardWidth, 'Efectividad', `${tasaConfirmacionFiltro}%`, [30, 41, 59]);
            y += 28;

            drawTable('Top 5 Espacios Más Reservados', pdfTopSpaces, [15, 118, 110]); // Dark Teal
            drawTable('Top 5 Espacios Menos Reservados', pdfBottomSpaces, [194, 65, 12]); // Dark Orange

            // Tendencia Mensual solo si es Histórico (No tiene sentido en reportes de 1 día)
            if (reportFilter === 'todos' && monthlyData.length > 0) {
                drawSectionTitle('Tendencia Mensual (Últimos 6 Meses)', [30, 41, 59]);
                const maxValue = Math.max(...monthlyData.map((m) => m.reservas), 1);
                const barAreaHeight = 34;
                const chartBottom = y + barAreaHeight;
                const barWidth = (contentWidth - 14) / monthlyData.length;

                addPageIfNeeded(barAreaHeight + 16);
                doc.setDrawColor(210, 217, 224);
                doc.line(margin, chartBottom, margin + contentWidth, chartBottom);

                monthlyData.forEach((item, idx) => {
                    const normalized = maxValue > 0 ? item.reservas / maxValue : 0;
                    const barHeight = Math.max(2, Math.round(normalized * 28));
                    const x = margin + 4 + idx * barWidth;
                    const barY = chartBottom - barHeight;

                    doc.setFillColor(13, 148, 136); // Teal
                    doc.roundedRect(x, barY, barWidth - 5, barHeight, 1, 1, 'F');
                    doc.setTextColor(55, 65, 81);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8);
                    doc.text(item.month, x, chartBottom + 5);
                    doc.setFont('helvetica', 'bold');
                    doc.text(String(item.reservas), x + 1, barY - 1.5);
                });
                y += barAreaHeight + 14;
            }

            // Footer del PDF
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(120, 120, 120);
                doc.text(`SERVIRE • Página ${i} de ${totalPages}`, margin, pageHeight - 6);
            }

            doc.save(`reporte-servire-${reportFilter}-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error('Error:', err);
            alert('Error al generar el PDF. Asegúrate de tener datos reales primero.');
        } finally {
            setGeneratingPdf(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-lg mx-auto mt-10">
                <AlertCircle className="text-red-500 mx-auto mb-3" size={32} />
                <h3 className="text-lg font-bold text-red-800 mb-1">Problema de Conexión</h3>
                <p className="text-red-600 text-sm mb-4">{error}</p>
                <button onClick={loadData} className="px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-medium">Reintentar</button>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            {/* Dashboard Summary Limpio */}
            <div className="mb-8">
                <ReportDashboard />
            </div>

            {/* Contenedor de Análisis Detallado */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                {/* Header y Filtros */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-1">Análisis Detallado</h2>
                        <p className="text-gray-500 text-sm">
                            Desglose de datos históricos reales al {new Date().toLocaleDateString('es-ES')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm flex-1 md:flex-none">
                            <Filter size={16} className="text-gray-400" />
                            <select
                                value={reportFilter}
                                onChange={(e) => setReportFilter(e.target.value)}
                                className="bg-transparent border-none text-sm text-slate-700 font-medium focus:outline-none cursor-pointer w-full"
                            >
                                <option value="todos">Histórico (Todos)</option>
                                <option value="dia">Reporte del Día</option>
                                <option value="semana">Reporte Semanal</option>
                                <option value="mes">Reporte Mensual</option>
                            </select>
                        </div>

                        <button
                            onClick={loadData}
                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition tooltip"
                            title="Actualizar datos"
                        >
                            <RefreshCw size={20} />
                        </button>

                        <button
                            onClick={downloadPDF}
                            disabled={generatingPdf || stats.length === 0}
                            className="flex items-center gap-2 px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {generatingPdf ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <DownloadCloud size={18} />
                            )}
                            Descargar PDF
                        </button>
                    </div>
                </div>

                {/* Gráficas de Top/Bottom */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Top 5 Espacios */}
                    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-teal-50 rounded-lg">
                                <Trophy className="text-teal-600" size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Top 5 Más Reservados</h3>
                        </div>

                        {topSpaces.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={topSpaces}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="spaceName" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="confirmedCount" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">Aún no hay reservaciones confirmadas</div>
                        )}
                    </div>

                    {/* Menos Reservados */}
                    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <AlertCircle className="text-orange-500" size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Menos Reservados</h3>
                        </div>

                        {bottomSpaces.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={bottomSpaces}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="spaceName" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="confirmedCount" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">Aún no hay reservaciones confirmadas</div>
                        )}
                    </div>
                </div>

                {/* Gráfica de Tendencia */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-slate-100 rounded-lg">
                            <LineChartIcon className="text-slate-700" size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Tendencia de Reservas (Últimos 6 Meses)</h3>
                    </div>

                    {monthlyData.length > 0 && monthlyData.some(m => m.reservas > 0) ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="reservas"
                                    stroke="#1e293b"
                                    strokeWidth={3}
                                    dot={{ fill: '#1e293b', r: 4, strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: '#0d9488', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">El historial de tendencia comenzará a generarse con las primeras reservas.</div>
                    )}
                </div>

                {/* Estadísticas de pie de página limpias */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-100">
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1"><Building2 size={14}/> Espacios Totales</span>
                        <span className="text-2xl font-bold text-slate-800">{stats.length}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1"><CalendarDays size={14}/> Histórico Solicitudes</span>
                        <span className="text-2xl font-bold text-slate-800">{stats.reduce((sum, s) => sum + Number(s.totalCount || 0), 0)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1"><CheckCircle2 size={14}/> Histórico Aprobadas</span>
                        <span className="text-2xl font-bold text-teal-600">{stats.reduce((sum, s) => sum + Number(s.confirmedCount || 0), 0)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1"><Activity size={14}/> Tasa Media</span>
                        <span className="text-2xl font-bold text-blue-600">
                            {stats.length > 0 && stats.reduce((sum, s) => sum + Number(s.totalCount || 0), 0) > 0
                                ? Math.round((stats.reduce((sum, s) => sum + Number(s.confirmedCount || 0), 0) / stats.reduce((sum, s) => sum + Number(s.totalCount || 0), 0)) * 100)
                                : 0}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReservationCharts;