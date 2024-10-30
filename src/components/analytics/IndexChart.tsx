import React, { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";

type DataPoint = {
  timestamp: string;
  price: string;
};

const IndexChart: React.FC<{ data: DataPoint[] }> = ({ data }) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Create the chart instance with dynamic width
    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { color: "#ffffff" },
        textColor: "#333",
      },
      grid: {
        vertLines: { color: "#e9e9e9" },
        horzLines: { color: "#e9e9e9" },
      },
      timeScale: {
        borderColor: "#e9e9e9",
        timeVisible: true,
        minBarSpacing: 5,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      rightPriceScale: {
        borderColor: "#e9e9e9",
      },
    });

    // Create the area series with a custom price format
    const areaSeries = chartRef.current.addAreaSeries({
      lineColor: "#3b82f6", // Tailwind Blue-500
      topColor: "rgba(59, 130, 246, 0.4)", // Lighter blue with opacity
      bottomColor: "rgba(59, 130, 246, 0)", // Transparent at the bottom
      priceFormat: {
        type: "custom",
        minMove: 0.01,
        formatter: (price: number) => `$${price.toFixed(2)}`, // Custom formatter to add $
      },
    });

    // Format and set data
    const formattedData = data.map((point) => ({
      time: Number(point.timestamp),
      value: parseFloat(point.price),
    }));

    areaSeries.setData(formattedData);
    chartRef.current.timeScale().fitContent();

    const visibleRange = {
      from: formattedData[0].time,
      to: formattedData[formattedData.length - 1].time,
    };
    chartRef.current.timeScale().setVisibleRange(visibleRange);

    // Handle resizing
    const handleResize = () => {
      if (chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      chartRef.current.remove();
    };
  }, [data]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};

export default IndexChart;
