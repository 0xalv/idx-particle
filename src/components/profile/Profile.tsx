"use client";

import { useState, useMemo } from "react";
import profileData from "@/data/profile.json";
import Image from "next/image";

// Define the profile type based on your JSON structure
type ProfileItem = {
  logo: string;
  name: string;
  symbol: string;
  price: string;
  change: string;
  apy: string;
  tvl: string;
  theme: string;
  type: string;
  amount: number;
  unrealizedPL: string;
  realizedPL: string;
};

const Profile = () => {
  // Define acceptable columns for sorting
  type SortableColumn =
    | "name"
    | "price"
    | "amount"
    | "unrealizedPL"
    | "realizedPL"
    | "change"
    | "tvl";

  const [sortedColumn, setSortedColumn] = useState<SortableColumn>("name"); // Default sort by name
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc"); // Default sort direction is ascending

  // Calculate total realizedPL and unrealizedPL
  const totalRealizedPL = useMemo(
    () =>
      profileData.reduce(
        (total, item) =>
          total + parseFloat(item.realizedPL.replace(/[$,]/g, "")),
        0
      ),
    []
  );

  const totalUnrealizedPL = useMemo(
    () =>
      profileData.reduce(
        (total, item) =>
          total + parseFloat(item.unrealizedPL.replace(/[$,]/g, "")),
        0
      ),
    []
  );

  // Toggle sorting direction and set column to be sorted
  const handleSort = (column: SortableColumn) => {
    if (sortedColumn === column) {
      // Toggle sort direction if the same column is clicked again
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      setSortedColumn(column);
      setSortDirection("asc");
    }
  };

  // Function to convert TVL values with suffixes to numbers for comparison
  const parseTvlValue = (tvl: string): number => {
    let numericValue = parseFloat(tvl.replace(/[$,]/g, "")); // Remove "$" and commas
    if (tvl.includes("K")) numericValue *= 1_000;
    else if (tvl.includes("M")) numericValue *= 1_000_000;
    else if (tvl.includes("B")) numericValue *= 1_000_000_000;
    return numericValue;
  };

  // Function to sort the profile data
  const sortedData = [...profileData].sort((a, b) => {
    let aVal: any = a[sortedColumn as keyof ProfileItem];
    let bVal: any = b[sortedColumn as keyof ProfileItem];

    // Handle TVL sorting by converting suffixes
    if (sortedColumn === "tvl") {
      aVal = parseTvlValue(aVal);
      bVal = parseTvlValue(bVal);
    } else if (
      ["price", "change", "unrealizedPL", "realizedPL"].includes(sortedColumn)
    ) {
      // Remove "$", "%", and commas for numerical columns
      aVal = parseFloat(aVal.replace(/[$,%]/g, "").replace(",", ""));
      bVal = parseFloat(bVal.replace(/[$,%]/g, "").replace(",", ""));
    }

    if (sortDirection === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  return (
    <div className="px-2 pt-16 sm:px-4 md:px-8 md:pt-20 lg:px-12">
      <div className="mx-auto my-12 flex max-w-screen-2xl flex-col">
        {/* Summary of Totals */}
        <div className="mb-8 flex justify-between items-center bg-gray-100 rounded-lg p-6 shadow-lg">
          <div className="flex flex-col items-start">
            <span className="text-xl font-semibold text-gray-800">
              Total Unrealized PL
            </span>
            <span
              className={`text-3xl font-bold ${
                totalUnrealizedPL > 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              $
              {totalUnrealizedPL.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xl font-semibold text-gray-800">
              Total Realized PL
            </span>
            <span
              className={`text-3xl font-bold ${
                totalRealizedPL > 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              $
              {totalRealizedPL.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        <span className="text-[#1d2928] font-semibold">Your Portfolio</span>

        {/* Desktop Table */}
        <div className="bg-white border-gray-100 mt-8 w-full overflow-auto rounded-3xl border py-4 shadow-sm hidden md:flex flex-col">
          <div className="hidden justify-between py-6 md:flex">
            {/* Index Column Header */}
            <div
              onClick={() => handleSort("name")}
              className="text-[#627171] hover:text-[#364647] min-w-[410px] cursor-pointer items-center px-6 text-left text-sm font-medium"
            >
              Index
              {sortedColumn === "name" && (
                <span className="ml-1 inline-block">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </div>

            {/* Current Price Column Header */}
            <div
              onClick={() => handleSort("price")}
              className="text-[#627171] hover:text-[#364647] min-w-[130px] text-right text-sm font-medium cursor-pointer"
            >
              Current Price
              {sortedColumn === "price" && (
                <span className="ml-1 inline-block">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </div>

            {/* Amount Column Header */}
            <div
              onClick={() => handleSort("amount")}
              className="text-[#627171] hover:text-[#364647] min-w-[120px] text-center text-sm font-medium cursor-pointer"
            >
              Amount
              {sortedColumn === "amount" && (
                <span className="ml-1 inline-block">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </div>

            {/* Unrealized PL Column Header */}
            <div
              onClick={() => handleSort("unrealizedPL")}
              className="text-[#627171] hover:text-[#364647] min-w-[120px] text-center text-sm font-medium cursor-pointer"
            >
              Unrealized PL
              {sortedColumn === "unrealizedPL" && (
                <span className="ml-1 inline-block">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </div>

            {/* Realized PL Column Header */}
            <div
              onClick={() => handleSort("realizedPL")}
              className="text-[#627171] hover:text-[#364647] min-w-[120px] text-center text-sm font-medium cursor-pointer"
            >
              Realized PL
              {sortedColumn === "realizedPL" && (
                <span className="ml-1 inline-block">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </div>

            {/* 24h Column Header */}
            <div
              onClick={() => handleSort("change")}
              className="text-[#627171] hover:text-[#364647] min-w-[120px] text-right text-sm font-medium cursor-pointer"
            >
              24h
              {sortedColumn === "change" && (
                <span className="ml-1 inline-block">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </div>

            {/* TVL Column Header */}
            <div
              onClick={() => handleSort("tvl")}
              className="text-[#627171] text-sm font-medium min-w-[120px] px-2 pr-8 text-right cursor-pointer"
            >
              TVL
              {sortedColumn === "tvl" && (
                <span className="ml-1 inline-block">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </div>
          </div>

          {/* Data Rows for Desktop */}
          <div className="divide-gray-200 flex flex-col divide-y md:divide-y-0">
            {sortedData.map((product, index) => {
              const changeValue = parseFloat(product.change.replace("%", ""));
              const changeColor =
                changeValue > 0
                  ? "text-green-500"
                  : changeValue < 0
                  ? "text-red-500"
                  : "text-[#627171]";

              // Remove "$" sign and parse Unrealized PL value
              const unrealizedPLValue = parseFloat(
                product.unrealizedPL.replace("$", "").replace(",", "")
              );
              const unrealizedPLColor =
                unrealizedPLValue > 0
                  ? "text-green-500"
                  : unrealizedPLValue < 0
                  ? "text-red-500"
                  : "text-[#627171]";

              // Remove "$" sign and parse Realized PL value
              const realizedPLValue = parseFloat(
                product.realizedPL.replace("$", "").replace(",", "")
              );
              const realizedPLColor =
                realizedPLValue > 0
                  ? "text-green-500"
                  : realizedPLValue < 0
                  ? "text-red-500"
                  : "text-[#627171]";

              return (
                <a
                  key={index}
                  className="hover:bg-gray-100 hidden h-[60px] min-w-fit items-center justify-between odd:border-[#FBFCFC] odd:bg-[#FBFCFC] even:border-transparent hover:cursor-pointer md:flex"
                  href={`/products/${product.symbol.toLowerCase()}`}
                >
                  <div className="text-[#627171] text-sm font-medium min-w-[410px] flex items-center pl-6">
                    <div className="mr-2 overflow-hidden rounded-full">
                      <Image
                        alt={`${product.symbol} logo`}
                        loading="lazy"
                        width="30"
                        height="30"
                        decoding="async"
                        src={product.logo}
                        style={{ color: "transparent" }}
                      />
                    </div>
                    <div className="my-auto">
                      <span className="text-gray-950 mr-4 font-semibold">
                        {product.name}
                      </span>
                      <span className="text-gray-400">{product.symbol}</span>
                    </div>
                  </div>
                  <div className="text-[#627171] text-sm font-medium min-w-[130px] px-2 text-right">
                    {product.price}
                  </div>
                  <div className="text-[#627171] text-sm font-medium min-w-[120px] text-center">
                    {product.amount}
                  </div>
                  <div
                    className={`text-sm font-medium min-w-[120px] text-center ${unrealizedPLColor}`}
                  >
                    {product.unrealizedPL}
                  </div>
                  <div
                    className={`text-sm font-medium min-w-[120px] text-center ${realizedPLColor}`}
                  >
                    {product.realizedPL}
                  </div>
                  <div
                    className={`text-sm font-medium min-w-[120px] px-2 text-right ${changeColor}`}
                  >
                    {product.change}
                  </div>
                  <div className="text-[#627171] text-sm font-medium min-w-[120px] px-2 pr-8 text-right">
                    {product.tvl}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
