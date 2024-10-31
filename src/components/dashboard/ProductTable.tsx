"use client";

import { useState } from "react";
import products from "@/data/products.json";

const ProductTable = () => {
  // State to track the sorting direction (up or down)
  const [isArrowDown, setIsArrowDown] = useState(false);

  // Function to handle header click and toggle the arrow direction
  const handleHeaderClick = () => {
    setIsArrowDown(!isArrowDown); // Toggle the arrow direction
  };

  return (
    <div className="px-2 pt-16 sm:px-4 md:px-8 md:pt-20 lg:px-12">
      <div className="flex flex-col items-center space-y-10 md:space-y-12">
        <h2 className="text-[#364647] max-w-3xl text-center text-3xl font-bold md:text-4xl lg:text-5xl lg:leading-tight">
          Crypto is complex. <br /> Our products make it simple.
        </h2>

        <h3 className="text-[#859393] max-w-lg text-center text-sm font-medium md:text-base">
          Unlock powerful sector, leverage and yield strategies with our simple
          tokens.
        </h3>

        <a
          href="/swap"
          className="bg-[#01bec3] text-white hover:bg-[#44d7d7] rounded-lg px-11 py-3"
        >
          Trade Now
        </a>
      </div>

      <div className="mx-auto my-12 flex max-w-screen-2xl flex-col">
        <span className="text-[#1d2928] font-semibold">All Indexes</span>

        {/* Desktop Table */}
        <div className="bg-white border-gray-100 mt-8 w-full overflow-auto rounded-3xl border py-4 shadow-sm hidden md:flex flex-col">
          <div className="hidden justify-between py-6 md:flex">
            <div
              onClick={handleHeaderClick}
              className="text-[#627171] hover:text-[#364647] min-w-[410px] cursor-pointer items-center px-6 text-left text-sm font-medium"
            >
              Index
              {isArrowDown ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  className="ml-1 inline-block h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  className="ml-1 inline-block h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1-1.06 1.06L10 8.061 6.31 11.78a.75.75 0 1 1-1.06-1.06l4.25-4.25z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="text-[#627171] hover:text-[#364647] min-w-[120px] text-center text-sm font-medium">
              Type
            </div>
            <div className="text-[#627171] hover:text-[#364647] min-w-[120px] text-center text-sm font-medium">
              Theme
            </div>
            <div className="text-[#627171] hover:text-[#364647] min-w-[130px] text-right text-sm font-medium">
              Current Price
            </div>
            <div className="text-[#627171] hover:text-[#364647] min-w-[120px] text-right text-sm font-medium">
              24h
            </div>
            <div className="text-[#627171] hover:text-[#364647] min-w-[120px] text-center text-sm font-medium">
              APY
            </div>
            <div className="text-[#627171] hover:text-[#364647] min-w-[120px] text-right text-sm font-medium pr-8">
              TVL
            </div>
          </div>

          {/* Data Rows for Desktop */}
          <div className="divide-gray-200 flex flex-col divide-y md:divide-y-0">
            {products.map((product, index) => {
              const changeValue = parseFloat(product.change);
              const changeColor =
                changeValue > 0
                  ? "text-green-500"
                  : changeValue < 0
                  ? "text-red-500"
                  : "text-[#627171]";
              const typeBgColor =
                product.type === "Index"
                  ? "bg-[#f4ecff]"
                  : product.type === "Yield"
                  ? "bg-[#ffeff6]"
                  : product.type === "Leverage"
                  ? "bg-[#e7f2ff]"
                  : "";

              return (
                <a
                  key={index}
                  className="hover:bg-gray-100 hidden h-[60px] min-w-fit items-center justify-between odd:border-[#FBFCFC] odd:bg-[#FBFCFC] even:border-transparent hover:cursor-pointer md:flex"
                  href={`/products/${product.address}`}
                >
                  <div className="text-[#627171] text-sm font-medium min-w-[410px] flex items-center pl-6">
                    <div className="mr-2 overflow-hidden rounded-full">
                      <img
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
                  <div className="text-[#627171] text-sm font-medium min-w-[120px]">
                    <div
                      className={`border-[#627171] mx-auto w-28 rounded-2xl border px-4 py-1 text-center ${typeBgColor}`}
                    >
                      {product.type}
                    </div>
                  </div>
                  <div className="text-[#627171] text-sm font-medium min-w-[120px] text-center">
                    <div className="bg-gray-300 border-[#627171] mx-auto w-28 rounded-2xl border px-4 py-1">
                      {product.theme}
                    </div>
                  </div>
                  <div className="text-[#627171] text-sm font-medium min-w-[130px] px-2 text-right">
                    {product.price}
                  </div>
                  <div
                    className={`text-sm font-medium min-w-[120px] px-2 text-right ${changeColor}`}
                  >
                    {product.change}
                  </div>
                  <div className="text-[#627171] text-sm font-medium min-w-[120px] text-center">
                    {product.apy}
                  </div>
                  <div className="text-[#627171] text-sm font-medium min-w-[120px] px-2 pr-8 text-right">
                    {product.tvl}
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* Mobile Table */}
        <div className="bg-white border-gray-100 mt-8 w-full overflow-auto rounded-3xl border py-4 shadow-sm md:hidden">
          {products.map((product, index) => {
            const changeValue = parseFloat(product.change);
            const changeColor =
              changeValue > 0
                ? "text-green-500"
                : changeValue < 0
                ? "text-red-500"
                : "text-[#627171]";

            return (
              <div
                key={index}
                className="flex flex-col items-center justify-between px-4 py-6 bg-[#fcffff] border-b border-[#E7ECEE]"
              >
                <div className="text-[#627171] text-sm font-medium text-right flex w-full self-start pb-4">
                  <div className="mr-2 min-w-[30px] overflow-hidden rounded-full">
                    <img
                      alt={`${product.symbol} logo`}
                      loading="lazy"
                      width="30"
                      height="30"
                      decoding="async"
                      src={product.logo}
                      style={{ color: "transparent" }}
                    />
                  </div>
                  <div className="my-auto truncate">
                    <span className="text-gray-950 mr-4 font-semibold">
                      {product.name}
                    </span>
                    <span className="text-gray-400">{product.symbol}</span>
                  </div>
                </div>
                <div className="flex w-full content-between items-center py-2">
                  <div className="text-[#627171] flex-grow text-sm font-medium">
                    Current Price
                  </div>
                  <div className="flex-grow">
                    <div className="text-[#627171] text-sm font-medium text-right">
                      {product.price}
                    </div>
                  </div>
                </div>
                <div className="flex w-full content-between items-center py-2">
                  <div className="text-[#627171] flex-grow text-sm font-medium">
                    24h
                  </div>
                  <div className="flex-grow">
                    <div
                      className={`text-sm font-medium text-right ${changeColor}`}
                    >
                      {product.change}
                    </div>
                  </div>
                </div>
                <div className="flex w-full content-between items-center py-2">
                  <div className="text-[#627171] flex-grow text-sm font-medium">
                    APY
                  </div>
                  <div className="flex-grow">
                    <div className="text-[#627171] text-sm font-medium text-right">
                      {product.apy}
                    </div>
                  </div>
                </div>
                <div className="flex w-full content-between items-center py-2">
                  <div className="text-[#627171] flex-grow text-sm font-medium">
                    TVL
                  </div>
                  <div className="flex-grow">
                    <div className="text-[#627171] text-sm font-medium text-right">
                      {product.tvl}
                    </div>
                  </div>
                </div>
                <a
                  className="text-[#01bec3] ring-[#01bec3] mt-4 w-full rounded-md bg-white px-3.5 py-2.5 text-center text-sm font-semibold shadow-sm ring-1 ring-inset hover:bg-gray-50"
                  href={`/products/${product.symbol.toLowerCase()}`}
                >
                  Trade {product.symbol}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductTable;
