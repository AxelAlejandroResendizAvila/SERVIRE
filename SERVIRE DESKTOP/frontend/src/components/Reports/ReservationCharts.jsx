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
    CalendarDays,
    Filter,
    Trophy,
    AlertCircle,
    LineChart as LineChartIcon,
    Building2,
    CheckCircle2,
    Activity,
    FileSpreadsheet,
    XCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { getReservationStats, getAdminRequests } from '../../services/api';
import ReportDashboard from './ReportDashboard';

const ReservationCharts = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [allRawRequests, setAllRawRequests] = useState([]);

    // --- ESTADOS PARA LA UI FILTRADA ---
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [displayStats, setDisplayStats] = useState([]);
    const [topSpaces, setTopSpaces] = useState([]);
    const [bottomSpaces, setBottomSpaces] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [generatingPdf, setGeneratingPdf] = useState(false);

    // --- LÓGICA DE FECHAS ---
    const todayObj = new Date();
    const maxDate = todayObj.toISOString().split('T')[0];
    const minDate = '2024-01-01';

    // Estados para los filtros
    const [reportMode, setReportMode] = useState('todos');
    const [startDate, setStartDate] = useState(maxDate);
    const [endDate, setEndDate] = useState(maxDate);

    // 1. CARGA INICIAL DE DATOS
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const statsData = await getReservationStats() || [];
            setStats(statsData);

            const reservations = await getAdminRequests() || [];
            setAllRawRequests(reservations);
        } catch (err) {
            console.error('Error cargando datos reales:', err);
            setError('Error al conectar con la base de datos de SERVIRE.');
            setStats([]); setAllRawRequests([]);
        } finally {
            setLoading(false);
        }
    };

    // 2. EL MOTOR DE FILTRADO (Sincroniza la UI automáticamente)
    useEffect(() => {
        const now = new Date();
        let currentFiltered = [...allRawRequests];

        if (reportMode === 'hoy') {
            currentFiltered = currentFiltered.filter(r => {
                if (!r.startDateRaw) return false;
                const d = new Date(r.startDateRaw);
                return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
            });
        } else if (reportMode === 'semana') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            currentFiltered = currentFiltered.filter(r => r.startDateRaw && new Date(r.startDateRaw) >= weekAgo && new Date(r.startDateRaw) <= now);
        } else if (reportMode === 'mes') {
            currentFiltered = currentFiltered.filter(r => {
                if (!r.startDateRaw) return false;
                const d = new Date(r.startDateRaw);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
        } else if (reportMode === 'ano') {
            currentFiltered = currentFiltered.filter(r => r.startDateRaw && new Date(r.startDateRaw).getFullYear() === now.getFullYear());
        } else if (reportMode === 'rango') {
            const start = new Date(`${startDate}T00:00:00`);
            const end = new Date(`${endDate}T23:59:59`);
            currentFiltered = currentFiltered.filter(r => {
                if (!r.startDateRaw) return false;
                const d = new Date(r.startDateRaw);
                return d >= start && d <= end;
            });
        }

        setFilteredRequests(currentFiltered);

        const dynamicSpaceStatsMap = new Map();
        stats.forEach(s => {
            dynamicSpaceStatsMap.set(s.spaceId, {
                spaceName: s.spaceName,
                totalCount: 0,
                confirmedCount: 0,
                cancelledCount: 0
            });
        });

        currentFiltered.forEach(r => {
            if(dynamicSpaceStatsMap.has(r.spaceId)) {
                const space = dynamicSpaceStatsMap.get(r.spaceId);
                space.totalCount += 1;
                if (r.status === 'approved' || r.status === 'completed') {
                    space.confirmedCount += 1;
                } else if (r.status === 'cancelled' || r.status === 'rejected') {
                    space.cancelledCount += 1;
                }
            }
        });

        const dynamicStats = Array.from(dynamicSpaceStatsMap.values());
        setDisplayStats(dynamicStats);

        const sortedDynamicStats = [...dynamicStats].sort((a, b) => b.confirmedCount - a.confirmedCount);
        setTopSpaces(sortedDynamicStats.slice(0, 5));
        setBottomSpaces(sortedDynamicStats.filter(s => s.confirmedCount > 0 || s.cancelledCount > 0).slice(-5).reverse());

        generateMonthlyData(currentFiltered);

    }, [allRawRequests, stats, reportMode, startDate, endDate]);

    const generateMonthlyData = (reservations) => {
        const monthlyStats = {};
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = date.toISOString().slice(0, 7);
            monthlyStats[key] = 0;
        }
        reservations.forEach(r => {
            if ((r.status === 'approved' || r.status === 'completed') && r.startDateRaw) {
                const month = r.startDateRaw.slice(0, 7);
                if (monthlyStats.hasOwnProperty(month)) monthlyStats[month]++;
            }
        });
        const monthlyArray = Object.entries(monthlyStats).map(([month, count]) => {
            const [year, monthNum] = month.split('-');
            const monthName = new Date(year, monthNum - 1).toLocaleString('es-ES', { month: 'short' });
            return { month: monthName.charAt(0).toUpperCase() + monthName.slice(1), reservas: count, fullMonth: month };
        });
        setMonthlyData(monthlyArray);
    };

    // Función para generar datos de tendencia según el filtro
    const generateTrendData = (reservations, mode) => {
        const now = new Date();
        
        if (mode === 'hoy') {
            // Por horas del día actual
            const hourlyStats = {};
            for (let i = 0; i < 24; i++) {
                const key = `${i.toString().padStart(2, '0')}:00`;
                hourlyStats[key] = { confirmadas: 0, rechazadas: 0 };
            }
            reservations.forEach(r => {
                if (r.startDateRaw) {
                    const date = new Date(r.startDateRaw);
                    const hour = `${date.getHours().toString().padStart(2, '0')}:00`;
                    if (hourlyStats[hour]) {
                        if (r.status === 'approved' || r.status === 'completed') {
                            hourlyStats[hour].confirmadas++;
                        } else if (r.status === 'declined' || r.status === 'rejected' || r.status === 'cancelled') {
                            hourlyStats[hour].rechazadas++;
                        }
                    }
                }
            });
            return Object.entries(hourlyStats).map(([hour, data]) => ({ 
                periodo: hour, 
                confirmadas: data.confirmadas, 
                rechazadas: data.rechazadas 
            }));
        } else if (mode === 'semana') {
            // Por días de esta semana
            const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            const weeklyStats = {};
            for (let i = 0; i < 7; i++) {
                const d = new Date(now);
                d.setDate(now.getDate() - now.getDay() + 1 + i);
                const key = d.toISOString().split('T')[0];
                weeklyStats[key] = { confirmadas: 0, rechazadas: 0, dayName: dayNames[i] };
            }
            reservations.forEach(r => {
                if (r.startDateRaw) {
                    const dateKey = r.startDateRaw.split('T')[0];
                    if (weeklyStats[dateKey]) {
                        if (r.status === 'approved' || r.status === 'completed') {
                            weeklyStats[dateKey].confirmadas++;
                        } else if (r.status === 'declined' || r.status === 'rejected' || r.status === 'cancelled') {
                            weeklyStats[dateKey].rechazadas++;
                        }
                    }
                }
            });
            return Object.entries(weeklyStats).map(([date, data]) => ({ 
                periodo: data.dayName, 
                confirmadas: data.confirmadas, 
                rechazadas: data.rechazadas 
            }));
        } else if (mode === 'mes') {
            // Por días del mes actual
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const monthlyDayStats = {};
            for (let i = 1; i <= daysInMonth; i++) {
                const d = new Date(now.getFullYear(), now.getMonth(), i);
                const key = d.toISOString().split('T')[0];
                monthlyDayStats[key] = { confirmadas: 0, rechazadas: 0 };
            }
            reservations.forEach(r => {
                if (r.startDateRaw) {
                    const dateKey = r.startDateRaw.split('T')[0];
                    if (monthlyDayStats[dateKey]) {
                        if (r.status === 'approved' || r.status === 'completed') {
                            monthlyDayStats[dateKey].confirmadas++;
                        } else if (r.status === 'declined' || r.status === 'rejected' || r.status === 'cancelled') {
                            monthlyDayStats[dateKey].rechazadas++;
                        }
                    }
                }
            });
            return Object.entries(monthlyDayStats).map(([date, data], idx) => ({ 
                periodo: (idx + 1).toString(), 
                confirmadas: data.confirmadas, 
                rechazadas: data.rechazadas 
            }));
        } else if (mode === 'ano') {
            // Por meses del año actual
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const yearlyStats = {};
            for (let i = 0; i < 12; i++) {
                yearlyStats[i] = { confirmadas: 0, rechazadas: 0, monthName: monthNames[i] };
            }
            reservations.forEach(r => {
                if (r.startDateRaw) {
                    const date = new Date(r.startDateRaw);
                    const monthIdx = date.getMonth();
                    if (r.status === 'approved' || r.status === 'completed') {
                        yearlyStats[monthIdx].confirmadas++;
                    } else if (r.status === 'declined' || r.status === 'rejected' || r.status === 'cancelled') {
                        yearlyStats[monthIdx].rechazadas++;
                    }
                }
            });
            return Object.entries(yearlyStats).map(([idx, data]) => ({ 
                periodo: data.monthName, 
                confirmadas: data.confirmadas, 
                rechazadas: data.rechazadas 
            }));
        } else if (mode === 'rango') {
            // Por días en el rango personalizado
            const start = new Date(startDate);
            const end = new Date(endDate);
            const rangeStats = {};
            const current = new Date(start);
            while (current <= end) {
                const key = current.toISOString().split('T')[0];
                rangeStats[key] = { confirmadas: 0, rechazadas: 0 };
                current.setDate(current.getDate() + 1);
            }
            reservations.forEach(r => {
                if (r.startDateRaw) {
                    const dateKey = r.startDateRaw.split('T')[0];
                    if (rangeStats[dateKey]) {
                        if (r.status === 'approved' || r.status === 'completed') {
                            rangeStats[dateKey].confirmadas++;
                        } else if (r.status === 'declined' || r.status === 'rejected' || r.status === 'cancelled') {
                            rangeStats[dateKey].rechazadas++;
                        }
                    }
                }
            });
            return Object.entries(rangeStats).map(([date, data]) => ({ 
                periodo: new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }), 
                confirmadas: data.confirmadas, 
                rechazadas: data.rechazadas 
            }));
        }
        
        return [];
    };

    // --- VARIABLES DE RESUMEN GLOBALES (Necesarias para el PDF y el Excel estructurado) ---
    const currentTotalReq = displayStats.reduce((sum, s) => sum + s.totalCount, 0);
    const currentConfirmed = displayStats.reduce((sum, s) => sum + s.confirmedCount, 0);
    const currentRejected = filteredRequests.filter(r => r.status === 'declined' || r.status === 'rejected' || r.status === 'cancelled').length;
    const currentRate = currentTotalReq > 0 ? Math.round((currentConfirmed / currentTotalReq) * 100) : 0;

    // 3. EXPORTAR A EXCEL (CSV ESTRUCTURADO)
    const downloadCSV = () => {
        const spaceNames = stats.reduce((acc, s) => ({ ...acc, [s.spaceId]: s.spaceName }), {});

        const headers = ["ID", "Espacio", "Fecha de Reserva", "Estatus"];
        const rows = filteredRequests.map(r => [
            r._id || r.id || '-',
            `"${spaceNames[r.spaceId] || 'Desconocido'}"`,
            r.startDateRaw ? new Date(r.startDateRaw).toLocaleDateString('es-ES') : '-',
            r.status === 'approved' || r.status === 'completed' ? 'Aprobada' : r.status === 'cancelled' || r.status === 'rejected' ? 'Cancelada/Rechazada' : 'Pendiente'
        ]);

        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // UTF-8 BOM para acentos en Excel

        // --- ESTRUCTURA MEJORADA DEL REPORTE EXCEL ---
        // 1. Título y Metadatos
        csvContent += "REPORTE DE RESERVAS SERVIRE\n";
        csvContent += `Generado el:,${new Date().toLocaleString('es-ES')}\n`;
        let filtroTxt = reportMode === 'rango' ? `Rango: ${startDate} al ${endDate}` : reportMode.toUpperCase();
        csvContent += `Filtro Aplicado:,${filtroTxt}\n\n`;

        // 2. Resumen General
        csvContent += "RESUMEN DEL PERIODO\n";
        csvContent += `Espacios Totales Registrados:,${stats.length}\n`;
        csvContent += `Total de Solicitudes Recibidas:,${currentTotalReq}\n`;
        csvContent += `Reservas Aprobadas/Confirmadas:,${currentConfirmed}\n`;
        csvContent += `Tasa de Efectividad:,${currentRate}%\n\n`;

        // 3. Tabla de Datos
        csvContent += "DETALLE DE SOLICITUDES\n";
        csvContent += headers.join(",") + "\n";
        csvContent += rows.map(e => e.join(",")).join("\n");

        // Descarga
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_servire_${reportMode}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 4. DESCARGAR PDF
    const downloadPDF = async () => {
        setGeneratingPdf(true);
        try {
            const totalReservasFiltro = filteredRequests.length;
            const totalConfirmadasFiltro = filteredRequests.filter(r => r.status === 'approved' || r.status === 'completed').length;
            const totalRechazadasFiltro = currentRejected;
            const tasaConfirmacionFiltro = totalReservasFiltro > 0 ? Math.round((totalConfirmadasFiltro / totalReservasFiltro) * 100) : 0;

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

            // Función para dibujar una gráfica de línea simple con Canvas
            const drawTrendChart = (title, trendData, color) => {
                drawSectionTitle(title, color);
                if (!trendData.length) {
                    addPageIfNeeded(10);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    doc.text('Sin datos disponibles para la tendencia.', margin + 2, y);
                    y += 10;
                    return;
                }

                addPageIfNeeded(50);
                const chartWidth = contentWidth;
                const chartHeight = 40;
                
                // Datos para la gráfica
                const maxValue = Math.max(...trendData.map(d => Math.max(d.confirmadas, d.rechazadas)), 1);
                const barWidth = (chartWidth - 4) / trendData.length;
                
                // Dibujar barras
                trendData.forEach((d, idx) => {
                    const xBar = margin + 2 + idx * barWidth;
                    const confirmHeight = (d.confirmadas / maxValue) * chartHeight * 0.8;
                    const rejectHeight = (d.rechazadas / maxValue) * chartHeight * 0.8;
                    
                    // Barra confirmadas (verde)
                    doc.setFillColor(34, 197, 94);
                    doc.rect(xBar, y + chartHeight - confirmHeight, barWidth * 0.45, confirmHeight, 'F');
                    
                    // Barra rechazadas (rojo)
                    doc.setFillColor(239, 68, 68);
                    doc.rect(xBar + barWidth * 0.45, y + chartHeight - rejectHeight, barWidth * 0.45, rejectHeight, 'F');
                });
                
                // Línea base
                doc.setDrawColor(200, 200, 200);
                doc.line(margin + 2, y + chartHeight, margin + chartWidth - 2, y + chartHeight);
                
                // Etiquetas X
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                trendData.forEach((d, idx) => {
                    const xLabel = margin + 2 + idx * barWidth + barWidth / 2;
                    doc.text(d.periodo, xLabel, y + chartHeight + 6, { align: 'center', maxWidth: barWidth });
                });
                
                // Leyenda
                y += chartHeight + 12;
                addPageIfNeeded(8);
                doc.setFillColor(34, 197, 94);
                doc.rect(margin + 2, y, 3, 3, 'F');
                doc.setTextColor(50, 50, 50);
                doc.setFontSize(9);
                doc.text('Confirmadas', margin + 7, y + 2.5);
                
                doc.setFillColor(239, 68, 68);
                doc.rect(margin + 60, y, 3, 3, 'F');
                doc.text('Rechazadas', margin + 65, y + 2.5);
                y += 8;
            };

            let periodoTexto = "Histórico General";
            if (reportMode === 'hoy') periodoTexto = "Reporte de Hoy";
            else if (reportMode === 'semana') periodoTexto = "Reporte de la Semana";
            else if (reportMode === 'mes') periodoTexto = "Reporte del Mes Actual";
            else if (reportMode === 'ano') periodoTexto = "Reporte del Año Actual";
            else if (reportMode === 'rango') periodoTexto = `Periodo: ${new Date(startDate).toLocaleDateString('es-ES')} al ${new Date(endDate).toLocaleDateString('es-ES')}`;

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

            drawSectionTitle(`Métricas del Periodo`, [13, 148, 136]);

            addPageIfNeeded(28);
            const gap = 4;
            const cardWidth = (contentWidth - gap * 3) / 4;

            drawMetricCard(margin, y, cardWidth, 'Espacios', stats.length, [71, 85, 105]);
            drawMetricCard(margin + (cardWidth + gap), y, cardWidth, 'Confirmadas', totalConfirmadasFiltro, [34, 197, 94]);
            drawMetricCard(margin + (cardWidth + gap) * 2, y, cardWidth, 'Solicitudes', totalReservasFiltro, [56, 189, 248]);
            drawMetricCard(margin + (cardWidth + gap) * 3, y, cardWidth, 'Efectividad', `${tasaConfirmacionFiltro}%`, [30, 41, 59]);
            y += 28;

            // Gráfica de tendencia
            const trendData = generateTrendData(filteredRequests, reportMode);
            drawTrendChart('Tendencia de Reservas', trendData, [13, 148, 136]);

            drawTable('Top 5 Espacios Más Reservados', topSpaces, [15, 118, 110]);
            drawTable('Top 5 Espacios Menos Reservados (con actividad)', bottomSpaces, [194, 65, 12]);

            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(120, 120, 120);
                doc.text(`SERVIRE • Página ${i} de ${totalPages}`, margin, pageHeight - 6);
            }

            doc.save(`reporte_servire_${reportMode}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error('Error:', err);
            alert('Error al generar el PDF.');
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
            <div className="mb-8">
                <ReportDashboard />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="flex flex-col mb-8 gap-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-1">Análisis Detallado de Espacios</h2>
                            <p className="text-gray-500 text-sm">
                                {filteredRequests.length} solicitudes encontradas en este periodo
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm flex-1 md:flex-none hover:border-gray-300 transition-colors">
                                <Filter size={16} className="text-gray-400" />
                                <select
                                    value={reportMode}
                                    onChange={(e) => setReportMode(e.target.value)}
                                    className="bg-transparent border-none text-sm text-slate-700 font-medium focus:outline-none cursor-pointer w-full"
                                >
                                    <option value="todos">Histórico (Todos)</option>
                                    <option value="hoy">Hoy</option>
                                    <option value="semana">Esta Semana</option>
                                    <option value="mes">Este Mes</option>
                                    <option value="ano">Este Año</option>
                                    <option disabled>──────────</option>
                                    <option value="rango">Rango Personalizado...</option>
                                </select>
                            </div>

                            <button onClick={loadData} className="p-2 bg-white border border-gray-200 text-slate-600 rounded-lg shadow-sm hover:bg-slate-50 transition-colors tooltip" title="Actualizar datos">
                                <RefreshCw size={18} />
                            </button>

                            {/* --- BOTÓN CSV (EXCEL) MEJORADO (DISEÑO GHOST) --- */}
                            <button
                                onClick={downloadCSV}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:border-emerald-300 transition-all font-medium text-sm shadow-sm"
                                title="Exportar reporte estructurado a Excel (CSV)"
                            >
                                <FileSpreadsheet size={18} className="text-emerald-600" />
                                <span className="hidden sm:inline">Excel (CSV)</span>
                            </button>

                            {/* BOTÓN PDF */}
                            <button
                                onClick={downloadPDF}
                                disabled={generatingPdf}
                                className="flex items-center justify-center gap-2 px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                {generatingPdf ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <DownloadCloud size={18} />}
                                Descargar PDF
                            </button>
                        </div>
                    </div>

                    {/* SUB-MENÚ ÚNICO: RANGO LIBRE */}
                    {reportMode === 'rango' && (
                        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-indigo-100 shadow-sm self-start md:self-end animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>

                            <div className="flex items-center gap-2 ml-2">
                                <span className="text-sm text-slate-500 font-medium">Desde:</span>
                                <input
                                    type="date"
                                    min={minDate}
                                    max={endDate}
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                                />
                            </div>

                            <span className="text-slate-300">-</span>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500 font-medium">Hasta:</span>
                                <input
                                    type="date"
                                    min={startDate}
                                    max={maxDate}
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Gráficas de Top/Bottom APILADAS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Top 5 Espacios */}
                    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-teal-50 rounded-lg">
                                    <Trophy className="text-teal-600" size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Top 5 Más Reservados</h3>
                            </div>
                        </div>

                        {topSpaces.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={topSpaces}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="spaceName" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                                    <Bar dataKey="confirmedCount" name="Aprobadas" stackId="a" fill="#0d9488" radius={[0, 0, 4, 4]} barSize={40} />
                                    <Bar dataKey="cancelledCount" name="Rechazadas/Canceladas" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[280px] flex flex-col items-center justify-center text-gray-400 text-sm">
                                <XCircle size={32} className="mb-2 opacity-50" />
                                No hay datos en este periodo
                            </div>
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
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                                    <Bar dataKey="confirmedCount" name="Aprobadas" stackId="a" fill="#f97316" radius={[0, 0, 4, 4]} barSize={40} />
                                    <Bar dataKey="cancelledCount" name="Rechazadas/Canceladas" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[280px] flex flex-col items-center justify-center text-gray-400 text-sm">
                                <XCircle size={32} className="mb-2 opacity-50" />
                                No hay datos en este periodo
                            </div>
                        )}
                    </div>
                </div>

                {/* Gráfica de Tendencia */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <LineChartIcon className="text-slate-700" size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Tendencia de Reservas</h3>
                        </div>
                    </div>

                    {(() => {
                        const trendData = generateTrendData(filteredRequests, reportMode);
                        return trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value) => value}
                                    />
                                    <Legend 
                                        iconType="square" 
                                        wrapperStyle={{ fontSize: '12px', color: '#64748b', paddingTop: '10px' }} 
                                    />
                                    <Bar dataKey="confirmadas" name="Confirmadas" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={40} />
                                    <Bar dataKey="rechazadas" name="Rechazadas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex flex-col items-center justify-center text-gray-400 text-sm">
                                <XCircle size={32} className="mb-2 opacity-50" />
                                No hay datos suficientes para mostrar la tendencia.
                            </div>
                        );
                    })()}
                </div>

                {/* Estadísticas Footer */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-100">
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1"><Building2 size={14}/> Espacios Totales</span>
                        <span className="text-2xl font-bold text-slate-800">{stats.length}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1"><CalendarDays size={14}/> Solicitudes (Filtro)</span>
                        <span className="text-2xl font-bold text-slate-800">{currentTotalReq}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1"><CheckCircle2 size={14}/> Aprobadas (Filtro)</span>
                        <span className="text-2xl font-bold text-teal-600">{currentConfirmed}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1"><Activity size={14}/> Tasa (Filtro)</span>
                        <span className="text-2xl font-bold text-blue-600">{currentRate}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReservationCharts;