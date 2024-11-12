import React, { useState } from "react";
import { formatUnits } from "viem";

interface TokenData {
  id: string;
  name: string;
  symbol: string;
  address: string;
  "deploy-timestamp": string;
  "price-data": DataSection;
  "token-data": {
    mcap: string;
    supply: string;
    distribution: Distribution[];
  };
}

interface DataSection {
  [key: string]: string;
}

interface Distribution {
  symbol: string;
  address: string;
  portion: string;
}

const IndexDetails: React.FC<{ tokenData: TokenData }> = ({ tokenData }) => {
  const [selectedDataSection, setSelectedDataSection] =
    useState<string>("price-data");

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDataSection(event.target.value);
  };

  const deployDate = new Date(
    Number(tokenData["deploy-timestamp"]) * 1000
  ).toLocaleDateString();

  const formatKey = (key: string) => {
    if (key === "price") return "Current Price";
    if (key.includes("delta")) {
      return key
        .replace("delta", "")
        .replace(/-/g, "")
        .replace("h", "H")
        .replace("d", "D")
        .replace("m", "M")
        .replace(/^\w/, (c) => c.toUpperCase());
    }
    return key.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  };

  const formatValue = (key: string, value: string) => {
    const timePeriods = ["24H", "7D", "1M", "3M", "6M"];
    const formattedKey = formatKey(key);

    if (timePeriods.some((period) => formattedKey.startsWith(period))) {
      return `${parseFloat(value).toLocaleString("en-US")}%`;
    }

    if (key === "price") {
      return `$${parseFloat(value).toLocaleString("en-US")}`;
    }

    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      return numericValue.toLocaleString("en-US");
    }

    return value;
  };

  const getColorClass = (key: string, value: string) => {
    const timePeriods = ["24H", "7D", "1M", "3M", "6M"];
    const formattedKey = formatKey(key);

    if (timePeriods.some((period) => formattedKey.startsWith(period))) {
      return parseFloat(value) > 0 ? "text-green-600" : "text-red-600";
    }

    return "text-[#627171]";
  };

  const renderDataSection = () => {
    let data = tokenData[selectedDataSection as keyof TokenData];

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-inner border border-gray-200">
          <div className="space-y-1">
            {Object.entries(data).map(([key, value]) => {
              const displayValue =
                typeof value === "string" ? formatValue(key, value) : "-";
              const colorClass =
                typeof value === "string"
                  ? getColorClass(key, value)
                  : "text-[#627171]";

              return (
                <div
                  key={key}
                  className="text-sm flex justify-between text-gray-700"
                >
                  <span className="font-medium">{formatKey(key)}:</span>
                  <span className={colorClass}>{displayValue}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-full transition-all duration-300">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900">
        {tokenData.name} ({tokenData.symbol})
      </h2>
      <p className="text-gray-700 mb-1">
        <strong className="font-semibold">Address:</strong>
        <span className="block text-gray-600 break-words">
          {tokenData.address}
        </span>
      </p>
      <p className="text-gray-700 mb-1">
        <strong className="font-semibold">Deployed on:</strong> {deployDate}
      </p>
      <p className="text-gray-700 mb-4">
        <strong className="font-semibold">Supply:</strong>{" "}
        {formatUnits(BigInt(tokenData["token-data"].supply), 18)}
      </p>
      <p className="text-gray-700 mb-4">
        <strong className="font-semibold">Market Cap:</strong> $198.4
      </p>

      <label className="block mb-3">
        <span className="text-sm font-semibold text-gray-800">
          Select Data Type:
        </span>
        <select
          onChange={handleSelectChange}
          className="mt-1 block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800 font-medium"
          value={selectedDataSection}
        >
          <option value="price-data">Price Data</option>
        </select>
      </label>

      {renderDataSection()}
    </div>
  );
};

export default IndexDetails;
