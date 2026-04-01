"use client";

import React, { useEffect, useRef } from 'react';
import { 
    createChart,
    ColorType,
    IChartApi, 
    ISeriesApi,
    Time,
    AreaSeries,
    LineSeries
} from 'lightweight-charts';

interface ChartData {
    time: string; // YYYY-MM-DD
    value: number;
}

interface TradingViewChartProps {
    data: ChartData[];
    benchmarkData?: ChartData[];
    height?: number;
    colors?: {
        backgroundColor?: string;
        lineColor?: string;
        textColor?: string;
        areaTopColor?: string;
        areaBottomColor?: string;
        gridColor?: string;
        benchmarkColor?: string;
    };
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
    data = [],
    benchmarkData = [],
    height = 350,
    colors: {
        backgroundColor = '#09090b',
        lineColor = '#3b82f6',
        textColor = '#a1a1aa',
        areaTopColor = 'rgba(59, 130, 246, 0.2)',
        areaBottomColor = 'rgba(59, 130, 246, 0.0)',
        gridColor = 'rgba(255, 255, 255, 0.03)',
        benchmarkColor = '#52525b',
    } = {},
}) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const portfolioSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
    const benchmarkSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartContainerRef.current || !data || data.length === 0) return;

        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({ 
                    width: chartContainerRef.current.clientWidth 
                });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: backgroundColor },
                textColor,
                fontFamily: 'Inter, system-ui, sans-serif',
            },
            width: chartContainerRef.current.clientWidth,
            height: height,
            grid: {
                vertLines: { color: gridColor },
                horzLines: { color: gridColor },
            },
            rightPriceScale: {
                borderVisible: false,
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
                alignLabels: true,
            },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: false,
            },
            crosshair: {
                vertLine: {
                    color: backgroundColor === '#ffffff' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)',
                    width: 1,
                    style: 2, // Dashed
                },
                horzLine: {
                    color: backgroundColor === '#ffffff' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)',
                    width: 1,
                    style: 2, // Dashed
                },
            },
            handleScroll: true,
            handleScale: true,
        });

        // Function to prepare data (sort and deduplicate by time)
        const prepareData = (rawData: ChartData[]) => {
            const uniqueData = new Map<string, number>();
            rawData.forEach(d => {
                // If we have multiple points for the same day, take the last one
                uniqueData.set(d.time, d.value);
            });

            return Array.from(uniqueData.entries())
                .map(([time, value]) => ({ time: time as Time, value }))
                .sort((a, b) => {
                    const timeA = typeof a.time === 'string' ? new Date(a.time).getTime() : (a.time as number);
                    const timeB = typeof b.time === 'string' ? new Date(b.time).getTime() : (b.time as number);
                    return timeA - timeB;
                });
        };

        const portfolioSeries = chart.addSeries(AreaSeries, {
            lineColor,
            topColor: areaTopColor,
            bottomColor: areaBottomColor,
            lineWidth: 2,
            priceFormat: {
                type: 'price',
                precision: 0,
                minMove: 1,
            },
        });

        // Set Portfolio Data
        portfolioSeries.setData(prepareData(data));

        // Set Benchmark Data (Line Series)
        let benchmarkSeries: ISeriesApi<"Line"> | null = null;
        if (benchmarkData && benchmarkData.length > 0) {
            const bSeries = chart.addSeries(LineSeries, {
                color: benchmarkColor,
                lineWidth: 1,
                lineStyle: 2, // Dashed
                priceFormat: {
                    type: 'price',
                    precision: 0,
                    minMove: 1,
                },
            });
            bSeries.setData(prepareData(benchmarkData));
            benchmarkSeries = bSeries;
        }

        chart.timeScale().fitContent();

        chartRef.current = chart;
        portfolioSeriesRef.current = portfolioSeries;
        benchmarkSeriesRef.current = benchmarkSeries;

        const sortedData = [...data].sort((a,b)=> new Date(a.time).getTime() - new Date(b.time).getTime());
        const firstPort = sortedData.length > 0 ? sortedData[0].value : 1;
        
        let firstBench = 1;
        if (benchmarkData && benchmarkData.length > 0) {
            const sortedB = [...benchmarkData].sort((a,b)=> new Date(a.time).getTime() - new Date(b.time).getTime());
            firstBench = sortedB[0].value;
        }

        chart.subscribeCrosshairMove(param => {
            if (!tooltipRef.current || !chartContainerRef.current) return;
            
            if (
                param.point === undefined ||
                !param.time ||
                param.point.x < 0 ||
                param.point.x > chartContainerRef.current.clientWidth ||
                param.point.y < 0 ||
                param.point.y > chartContainerRef.current.clientHeight
            ) {
                tooltipRef.current.style.display = 'none';
                return;
            }

            const rawPortValue = param.seriesData.get(portfolioSeries) as any;
            const rawBenchValue = benchmarkSeries ? (param.seriesData.get(benchmarkSeries) as any) : undefined;

            if (rawPortValue && rawPortValue.value !== undefined) {
                tooltipRef.current.style.display = 'block';
                
                const portValue = rawPortValue.value;
                const portPct = firstPort !== 0 ? ((portValue - firstPort) / firstPort) * 100 : 0;
                
                let bHtml = '';
                if (rawBenchValue && rawBenchValue.value !== undefined) {
                    const bValue = rawBenchValue.value;
                    const bPct = firstBench !== 0 ? ((bValue - firstBench) / firstBench) * 100 : 0;
                    bHtml = `
                        <div style="display: flex; justify-content: space-between; gap: 16px; margin-top: 6px;">
                            <span style="color: ${benchmarkColor}; font-weight: 700;">MSCI World</span>
                            <span style="font-weight: 700; color: white;">
                                ${bValue.toLocaleString('es-ES', {maximumFractionDigits:0})}€ 
                                <span style="color: ${bPct >= 0 ? '#34d399' : '#f87171'}; font-size: 11px; margin-left: 4px;">
                                    ${bPct > 0 ? '+' : ''}${bPct.toFixed(2)}%
                                </span>
                            </span>
                        </div>
                    `;
                }

                let dateStr = '';
                if (typeof param.time === 'string') {
                    dateStr = param.time;
                } else if (typeof param.time === 'number') {
                    dateStr = new Date(param.time * 1000).toLocaleDateString('es-ES');
                } else if (typeof param.time === 'object') {
                    const timeObj = param.time as any;
                    if (timeObj.year) {
                        dateStr = `${timeObj.year}-${String(timeObj.month).padStart(2, '0')}-${String(timeObj.day).padStart(2, '0')}`;
                    }
                }

                tooltipRef.current.innerHTML = `
                    <div style="font-size: 11px; color: ${textColor}; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">
                        ${dateStr}
                    </div>
                    <div style="display: flex; justify-content: space-between; gap: 16px;">
                        <span style="color: ${lineColor}; font-weight: 700;">Cartera</span>
                        <span style="font-weight: 700; color: white;">
                            ${portValue.toLocaleString('es-ES', {maximumFractionDigits:0})}€ 
                            <span style="color: ${portPct >= 0 ? '#34d399' : '#f87171'}; font-size: 11px; margin-left: 4px;">
                                ${portPct > 0 ? '+' : ''}${portPct.toFixed(2)}%
                            </span>
                        </span>
                    </div>
                    ${bHtml}
                `;

                // Calculate tooltip position
                const tooltipW = tooltipRef.current.offsetWidth || 200;
                const tooltipH = tooltipRef.current.offsetHeight || 100;
                let left = param.point.x + 15;
                if (left + tooltipW > chartContainerRef.current.clientWidth) {
                    left = param.point.x - tooltipW - 15;
                }
                let top = param.point.y + 15;
                if (top + tooltipH > chartContainerRef.current.clientHeight) {
                    top = param.point.y - tooltipH - 15;
                }

                tooltipRef.current.style.left = left + 'px';
                tooltipRef.current.style.top = top + 'px';
            } else {
                tooltipRef.current.style.display = 'none';
            }
        });

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data, benchmarkData, backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor, gridColor, benchmarkColor, height]);

    const calculateReturn = (arr?: ChartData[]) => {
        if (!arr || arr.length < 2) return null;
        const sorted = [...arr].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        const first = sorted[0].value;
        const last = sorted[sorted.length - 1].value;
        if (first === 0) return 0;
        return ((last - first) / first) * 100;
    };

    const portReturn = calculateReturn(data);
    const benchReturn = calculateReturn(benchmarkData);

    return (
        <div className="relative w-full">
            <div 
                ref={chartContainerRef} 
                className="w-full relative"
                style={{ height: `${height}px` }}
            />
            {/* Hover Tooltip Element */}
            <div 
                ref={tooltipRef}
                className="absolute z-50 pointer-events-none bg-[#09090b]/90 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] font-plus-jakarta text-xs"
                style={{ display: 'none' }}
            />
            {/* Legend Overlay */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
                {portReturn !== null && (
                    <div className="flex items-center gap-2.5 bg-[#09090b]/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-lg">
                        <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ backgroundColor: lineColor }} />
                        <span className="text-xs font-bold text-zinc-300 font-plus-jakarta uppercase tracking-widest">Cartera</span>
                        <span className={`text-xs font-black px-1.5 py-0.5 rounded ${portReturn >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {portReturn > 0 ? '+' : ''}{portReturn.toFixed(2)}%
                        </span>
                    </div>
                )}
                {benchReturn !== null && (
                    <div className="flex items-center gap-2.5 bg-[#09090b]/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-lg">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: benchmarkColor }} />
                        <span className="text-xs font-bold text-zinc-300 font-plus-jakarta uppercase tracking-widest">MSCI World</span>
                        <span className={`text-xs font-black px-1.5 py-0.5 rounded ${benchReturn >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {benchReturn > 0 ? '+' : ''}{benchReturn.toFixed(2)}%
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
