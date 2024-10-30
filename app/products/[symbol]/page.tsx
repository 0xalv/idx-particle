"use client";

import React, { useEffect, useState } from "react";
import IndexChart from "@/components/analytics/IndexChart";
import IndexDetails from "@/components/analytics/IndexDetails";
import IndexDistribution from "@/components/analytics/IndexDistribution";

type DataPoint = {
  timestamp: string;
  price: string;
};

type PriceData = {
  "24h-ts": DataPoint[];
  "7d-ts": DataPoint[];
  "1m-ts": DataPoint[];
  "3m-ts": DataPoint[];
  "6m-ts": DataPoint[];
};

type TokenData = {
  id: string;
  name: string;
  symbol: string;
  address: string;
  "deploy-timestamp": string;
  "price-data": DataSection;
  "mcap-data": DataSection;
  "fees-data": DataSection;
  "token-data": {
    supply: string;
    "issuance-data": DataSection;
    "redeem-data": DataSection;
    distribution: Distribution[];
  };
};

type DataSection = {
  [key: string]: string;
};

type Distribution = {
  symbol: string;
  address: string;
  portion: string;
};

const ProductInfo: React.FC = () => {
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [selectedRange, setSelectedRange] = useState<
    "24h-ts" | "7d-ts" | "1m-ts" | "3m-ts" | "6m-ts"
  >("24h-ts");

  // Available time ranges for easy scalability
  const timeRanges = ["24h-ts", "7d-ts", "1m-ts", "3m-ts", "6m-ts"] as const;

  // Fetch chart data from advanced-info.json and token data from basic-info.json
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch("/advanced-info.json");
        const json = await response.json();
        setPriceData(json["price-data"]);
        setChartData(json["price-data"]["24h-ts"]); // Default to 24h data
      } catch (error) {
        console.error("Failed to load chart data:", error);
      }
    };

    const fetchTokenData = async () => {
      try {
        const response = await fetch("/basic-info.json");
        const json = await response.json();
        setTokenData(json); // Set the token data for IndexDetails
      } catch (error) {
        console.error("Failed to load token data:", error);
      }
    };

    fetchChartData();
    fetchTokenData();
  }, []);

  // Update chart data when selectedRange changes
  useEffect(() => {
    if (priceData) {
      setChartData(priceData[selectedRange]);
    }
  }, [selectedRange, priceData]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-16 px-2 sm:px-4 md:px-6 lg:px-8">
      {" "}
      {/* Tighter padding */}
      <div className="flex flex-col items-center mb-12 space-y-8 md:space-y-10 max-w-screen-xl w-full">
        {" "}
        {/* Reduced space-y */}
        <h2 className="text-[#364647] max-w-3xl text-center text-3xl font-bold md:text-4xl lg:text-5xl lg:leading-tight">
          Knowledge is leverage. <br /> Leverage maximizes returns.
        </h2>
        <h3 className="text-[#859393] max-w-lg text-center text-sm font-medium md:text-base">
          Gain deep insights into index metrics and trends to leverage smarter,
          data-driven decisions.
        </h3>
      </div>
      {/* First row: Chart */}
      <div className="w-full max-w-6xl mb-8">
        <div className="w-full p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-center mb-4 text-gray-800">
            {tokenData ? `${tokenData.symbol} Price` : "Loading..."}
          </h2>

          <div className="flex justify-center space-x-2 mb-4">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-4 py-2 rounded-lg transition ${
                  selectedRange === range
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-200 text-gray-700 hover:bg-blue-100"
                }`}
              >
                {range.toUpperCase().replace("-TS", "")}
              </button>
            ))}
          </div>

          {chartData.length > 0 ? (
            <IndexChart data={chartData} />
          ) : (
            <p className="text-center text-gray-500">Loading data...</p>
          )}
        </div>
      </div>
      {/* Second row: Details and Distribution */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {tokenData && (
          <div className="p-6 bg-white rounded-lg shadow-lg">
            <IndexDetails tokenData={tokenData} />
          </div>
        )}
        {tokenData && (
          <div className="p-6 bg-white rounded-lg shadow-lg h-auto">
            <IndexDistribution tokenData={tokenData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductInfo;
