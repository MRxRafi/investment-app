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
    };
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
    data,
    benchmarkData,
    height = 350,
    colors: {
        backgroundColor = '#09090b',
        lineColor = '#3b82f6',
        textColor = '#a1a1aa',
        areaTopColor = 'rgba(59, 130, 246, 0.2)',
        areaBottomColor = 'rgba(59, 130, 246, 0.0)',
    } = {},
}) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const portfolioSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
    const benchmarkSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

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
                vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
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
                    color: 'rgba(255, 255, 255, 0.2)',
                    width: 1,
                    style: 2, // Dashed
                },
                horzLine: {
                    color: 'rgba(255, 255, 255, 0.2)',
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
                color: '#52525b',
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

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data, benchmarkData, backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor, height]);

    return (
        <div 
            ref={chartContainerRef} 
            className="w-full relative"
            style={{ height: `${height}px` }}
        />
    );
};
