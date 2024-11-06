// src/components/IndexDistribution.tsx
import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface Distribution {
  symbol: string;
  address: string;
  portion: string;
}

interface TokenData {
  "token-data": {
    distribution: Distribution[];
  };
}

const COLORS = [
  "#4F46E5",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#A855F7",
];

const IndexDistribution: React.FC<{ tokenData: TokenData }> = ({
  tokenData,
}) => {
  const data = tokenData["token-data"].distribution.map((item) => ({
    name: item.symbol,
    value: parseFloat(item.portion),
  }));

  return (
    <div
      className={`w-full p-4 bg-white rounded-lg shadow-lg flex flex-col transition-all duration-300 ${
        data.length ? "h-full" : "h-auto"
      }`}
    >
      <h2 className="text-xl font-semibold text-center mb-4 text-gray-800">
        Token Distribution
      </h2>
      {data.length > 0 ? (
        <>
          <div className="flex-grow flex items-center justify-center">
            {/* ResponsiveContainer takes the full width and height of its parent */}
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="70%"
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name }) => name}
                  labelLine={false}
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    borderColor: "#e5e7eb",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Scrollable Legend */}
          <div className="flex flex-wrap justify-center mt-4 max-h-24 overflow-y-auto">
            {data.map((entry, index) => (
              <div key={index} className="flex items-center mr-4 mb-2">
                <div
                  className="w-3 h-3 mr-2 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-sm text-gray-700">{entry.name}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-center text-gray-500">No data available</p>
      )}
    </div>
  );
};

export default IndexDistribution;
