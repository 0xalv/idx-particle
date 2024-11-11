// app/indexes/[indexAddress]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  useWallets,
  useAccount,
  usePublicClient,
} from "@particle-network/connectkit";
import { useParams } from "next/navigation";
import {
  Erc20,
  SetToken,
  BasicIssuanceModule,
  StreamingFeeModule,
} from "@/abis";
import {
  Abi,
  Address,
  formatUnits,
  parseEther,
  parseUnits,
  encodeFunctionData,
} from "viem";
import Link from "next/link";

interface ContractData {
  abi: any;
  address: `0x${string}`;
  functionName: string;
}

interface ComponentUnits {
  0: string[];
  1: bigint[];
}

interface TokenDecimal {
  result: number;
  status: string;
}

interface DataItem {
  result: string | number | boolean | bigint | any[];
  status: string;
}

const SetDetails = () => {
  const [primaryWallet] = useWallets();
  const { chain, address: userWallet, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const params = useParams();
  const address = params.indexAddress as `0x${string}`;

  const [tokenAmount, setTokenAmount] = useState<number>(1);
  const [tokenContracts, setTokenContracts] = useState<ContractData[]>([]);
  const [stateComponentDecimals, setStateComponentDecimals] = useState<
    ContractData[]
  >([]);
  const [componentUnits, setComponentUnits] = useState<ComponentUnits | null>(
    null
  );
  const [tokenDecimals, setTokenDecimals] = useState<TokenDecimal[] | null>(
    null
  );
  const [formattedData, setFormattedData] = useState<Record<
    string,
    DataItem
  > | null>(null);
  const [tokenNames, setTokenNames] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingFeePercentage, setStreamingFeePercentage] =
    useState<string>("2"); // this is the fee set by the user in hte fee input
  const [streamingFeeIndex, setStreamingFeeIndex] = useState<string | null>(
    null
  ); // this is the fee obtained directly from the index, using the StreamingFeeModule

  const MAX_FEE_PERCENTAGE = 10; // 10%

  const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
  const basicIssuanceModuleAddress = process.env
    .NEXT_PUBLIC_BASIC_ISSUANCE_MODULE as `0x${string}`;
  const multicallAddress = process.env
    .NEXT_PUBLIC_MULTICALL_ADDRESS as `0x${string}`;
  const streamingFeeModuleAddress = process.env
    .NEXT_PUBLIC_STREAMING_FEE_MODULE as `0x${string}`;
  const COLORS = [
    "#4F46E5",
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#A855F7",
  ];

  const keyMapping: Record<number, string> = {
    0: "name",
    1: "symbol",
    2: "totalSupply",
    3: "decimals",
    4: "components",
    5: "manager",
    6: "isInitialized",
  };

  // Fetch main index data
  useEffect(() => {
    const fetchMainData = async () => {
      if (!publicClient || !address) return;
      try {
        const results = await Promise.all([
          publicClient.readContract({
            address,
            abi: SetToken,
            functionName: "name",
          }),
          publicClient.readContract({
            address,
            abi: SetToken,
            functionName: "symbol",
          }),
          publicClient.readContract({
            address,
            abi: SetToken,
            functionName: "totalSupply",
          }),
          publicClient.readContract({
            address,
            abi: SetToken,
            functionName: "decimals",
          }),
          publicClient.readContract({
            address,
            abi: SetToken,
            functionName: "getComponents",
          }),
          publicClient.readContract({
            address,
            abi: SetToken,
            functionName: "manager",
          }),
          publicClient.readContract({
            address,
            abi: SetToken,
            functionName: "isInitializedModule",
            args: [basicIssuanceModuleAddress],
          }),
        ]);

        const formattedResults = results.map((result, index) => ({
          result: result as string | number | boolean | bigint | any[],
          status: "success",
        }));

        const formattedData: Record<string, DataItem> = Object.fromEntries(
          Object.entries(formattedResults).map(([index, item]) => [
            keyMapping[Number(index)] || index,
            item,
          ])
        );

        setFormattedData(formattedData);

        // Set component contracts for further queries
        if (Array.isArray(results[4])) {
          setTokenContracts(
            (results[4] as string[]).map((tokenAddress) => ({
              abi: Erc20,
              address: tokenAddress as `0x${string}`,
              functionName: "symbol",
            }))
          );
          setStateComponentDecimals(
            (results[4] as string[]).map((tokenAddress) => ({
              abi: Erc20,
              address: tokenAddress as `0x${string}`,
              functionName: "decimals",
            }))
          );
        }

        setIsOwner(
          (results[5] as string).toLowerCase() === userWallet?.toLowerCase()
        );
        setIsInitialized(results[6] as boolean);
      } catch (err) {
        setError("Error fetching main data");
        console.error(err);
      }
    };

    if (isConnected) {
      fetchMainData();
    }
  }, [
    isConnected,
    publicClient,
    address,
    userWallet,
    basicIssuanceModuleAddress,
  ]);

  // Fetch token names
  useEffect(() => {
    const fetchTokenNames = async () => {
      if (!publicClient || tokenContracts.length === 0) return;
      try {
        const names = await Promise.all(
          tokenContracts.map((contract) =>
            publicClient.readContract({
              address: contract.address,
              abi: Erc20,
              functionName: contract.functionName,
            })
          )
        );
        setTokenNames(
          names.map((name) => ({ result: name, status: "success" }))
        );
      } catch (err) {
        console.error("Error fetching token names:", err);
      }
    };

    fetchTokenNames();
  }, [publicClient, tokenContracts]);

  // Fetch component units
  useEffect(() => {
    const fetchComponentUnits = async () => {
      if (!publicClient || !address) return;
      try {
        const units = await publicClient.readContract({
          address: basicIssuanceModuleAddress,
          abi: BasicIssuanceModule,
          functionName: "getRequiredComponentUnitsForIssue",
          args: [address, parseEther(`${tokenAmount}`)],
        });
        setComponentUnits(units as unknown as ComponentUnits);
      } catch (err) {
        console.error("Error fetching component units:", err);
      }
    };

    fetchComponentUnits();
  }, [publicClient, address, tokenAmount, basicIssuanceModuleAddress]);

  // Fetch token decimals
  useEffect(() => {
    const fetchTokenDecimals = async () => {
      if (!publicClient || stateComponentDecimals.length === 0) return;
      try {
        const decimals = await Promise.all(
          stateComponentDecimals.map((contract) =>
            publicClient.readContract({
              address: contract.address,
              abi: Erc20,
              functionName: contract.functionName,
            })
          )
        );
        setTokenDecimals(
          decimals.map((decimal) => ({
            result: Number(decimal), // Explicitly convert to number
            status: "success",
          }))
        );
      } catch (err) {
        console.error("Error fetching token decimals:", err);
      }
    };

    fetchTokenDecimals();
  }, [publicClient, stateComponentDecimals]);

  const handleInputChangeAmount = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { value } = event.target;
    setTokenAmount(value === "" ? 0 : parseFloat(value));
  };

  // fetch streaming fee
  useEffect(() => {
    const fetchStreamingFee = async () => {
      if (!publicClient || !address || !streamingFeeModuleAddress) return;

      try {
        const fee = (await publicClient.readContract({
          address: streamingFeeModuleAddress,
          abi: StreamingFeeModule,
          functionName: "feeStates",
          args: [address],
        })) as [bigint, bigint, bigint, bigint];
        setStreamingFeeIndex(formatUnits(fee[2], 16));
      } catch (err) {
        console.error("Error fetching streaming fee:", err);
      }
    };

    fetchStreamingFee();
  }, [publicClient, address, streamingFeeModuleAddress]);

  const handleRedeem = async () => {
    if (!primaryWallet || !chain || !userWallet) return;
    try {
      const walletClient = primaryWallet.getWalletClient();
      const hash = await walletClient.writeContract({
        address: basicIssuanceModuleAddress,
        abi: BasicIssuanceModule as Abi,
        functionName: "redeem",
        args: [address, parseEther(`${tokenAmount}`), userWallet],
        chain,
        account: userWallet as Address,
      });
      console.log("Redeem hash:", hash);
    } catch (error) {
      console.error("Error redeeming tokens:", error);
    }
  };

  // For initializing the basicIssuanceModule without the streamingFeesModule
  const handleInitialize = async () => {
    if (!primaryWallet || !chain || !userWallet) return;
    try {
      const walletClient = primaryWallet.getWalletClient();
      const hash = await walletClient.writeContract({
        address: basicIssuanceModuleAddress,
        abi: BasicIssuanceModule as Abi,
        functionName: "initialize",
        args: [address, ADDRESS_ZERO],
        chain,
        account: userWallet as Address,
      });
      console.log("Initialize hash:", hash);
    } catch (error) {
      console.error("Error initializing:", error);
    }
  };

  const handleStreamingFeeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue <= MAX_FEE_PERCENTAGE) {
      setStreamingFeePercentage(value); // Set the raw input value without forcing decimals
    } else if (value === "") {
      setStreamingFeePercentage(""); // Allow clearing the input
    }
  };

  const handleBatchInitialize = async () => {
    if (!primaryWallet || !chain || !userWallet) return;

    try {
      const walletClient = primaryWallet.getWalletClient();

      // Initialize BasicIssuanceModule
      console.log("Initializing BasicIssuanceModule...");
      const basicIssuanceHash = await walletClient.writeContract({
        address: basicIssuanceModuleAddress,
        abi: BasicIssuanceModule as Abi,
        functionName: "initialize",
        args: [address, ADDRESS_ZERO],
        chain,
        account: userWallet as Address,
      });
      console.log(
        "BasicIssuanceModule initialization hash:",
        basicIssuanceHash
      );

      // Initialize StreamingFeeModule
      console.log("Initializing StreamingFeeModule...");
      const feeSettings = {
        feeRecipient: userWallet,
        maxStreamingFeePercentage: parseUnits(
          (Number(MAX_FEE_PERCENTAGE) / 100).toString(),
          18
        ),
        streamingFeePercentage: parseUnits(
          (Number(streamingFeePercentage) / 100).toString(),
          18
        ),
        lastStreamingFeeTimestamp: BigInt(0),
      };

      const streamingFeeHash = await walletClient.writeContract({
        address: streamingFeeModuleAddress,
        abi: StreamingFeeModule as Abi,
        functionName: "initialize",
        args: [address, feeSettings],
        chain,
        account: userWallet as Address,
      });
      console.log("StreamingFeeModule initialization hash:", streamingFeeHash);

      return {
        basicIssuanceHash,
        streamingFeeHash,
      };
    } catch (error) {
      console.error("Error in batch initialize:", error);
      throw error;
    }
  };

  const handleBatchApproveAndIssue = async () => {
    if (!primaryWallet || !componentUnits || !chain || !userWallet) return;

    try {
      const walletClient = primaryWallet.getWalletClient();

      // Approve each token sequentially
      for (let i = 0; i < componentUnits[0].length; i++) {
        const tokenAddress = componentUnits[0][i] as `0x${string}`;
        const tokenAmount = componentUnits[1][i];

        // Approve each token
        await walletClient.writeContract({
          address: tokenAddress,
          abi: Erc20 as Abi,
          functionName: "approve",
          args: [basicIssuanceModuleAddress, tokenAmount],
          chain,
          account: userWallet as Address,
        });
        console.log(
          `Approval successful for token at position ${i}:`,
          tokenAddress
        );
      }

      // After all tokens are approved, proceed with issuing the tokens
      const issueHash = await walletClient.writeContract({
        address: basicIssuanceModuleAddress,
        abi: BasicIssuanceModule as Abi,
        functionName: "issue",
        args: [address, parseEther(`${tokenAmount}`), userWallet],
        chain,
        account: userWallet as Address,
      });
      console.log("Issue transaction hash:", issueHash);
    } catch (error) {
      console.error("Error in batch approve and issue:", error);
    }
  };

  const getDistributionDisplay = () => {
    if (!componentUnits || !tokenDecimals || !tokenNames) return [];

    return componentUnits[1].map((unit, index) => {
      const decimals = tokenDecimals[index]?.result || 1;
      const name = tokenNames[index]?.result || "N/A";
      const quantity = parseFloat(formatUnits(unit, decimals));
      return `${name} - ${quantity.toFixed(0)}`;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Index Information
          </h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600">Status</span>
              <div className="font-medium text-gray-900 mt-1">
                {isInitialized ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Initialized
                  </span>
                ) : (
                  <span className="text-yellow-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    Pending
                  </span>
                )}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600">Role</span>
              <div className="font-medium text-gray-900 mt-1">
                {isOwner ? "Manager" : "User"}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg col-span-2">
              <span className="text-gray-600">Connected Address</span>
              <div className="font-medium text-gray-900 mt-1 truncate">
                {userWallet || "Not Connected"}
              </div>
            </div>
          </div>
        </div>

        {/* Main Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {formattedData
                    ? String(formattedData.name.result)
                    : "Loading..."}
                </h2>
                <p className="text-gray-600 mt-1">
                  {formattedData ? String(formattedData.symbol.result) : ""}
                </p>
              </div>
              <div className="mt-2 md:mt-0 text-right">
                <div className="text-sm text-gray-600">Total Supply</div>
                <div className="text-lg font-medium">
                  {formattedData
                    ? parseFloat(
                        formatUnits(
                          formattedData.totalSupply.result as bigint,
                          formattedData.decimals.result as number
                        )
                      ).toFixed(0)
                    : "0"}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-600">Index Address</div>
              <div className="font-mono text-sm bg-gray-50 p-3 rounded-lg break-all">
                {address}
              </div>
              <div className="text-sm text-gray-600">Index Manager</div>
              <div className="font-mono text-sm bg-gray-50 p-3 rounded-lg break-all">
                {formattedData ? formattedData.manager.result : "N/A"}
              </div>
              <div className="text-sm text-gray-600">Index Streaming Fee</div>
              <div
                className="inline-flex px-3 py-1 text-white rounded-full text-sm font-medium"
                style={{ backgroundColor: COLORS[2] }}
              >
                {streamingFeeIndex
                  ? `${parseFloat(streamingFeeIndex).toFixed(2)}%`
                  : "Loading..."}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                Underlying Assets Required
              </div>
              <div className="flex flex-wrap gap-2">
                {getDistributionDisplay().map((distribution, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-white rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  >
                    {distribution}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          {formattedData && formattedData.isInitialized.result === false ? (
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Module Initialization Required
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Streaming Fee Percentage (max {MAX_FEE_PERCENTAGE}%)
                </label>
                <input
                  type="number"
                  value={streamingFeePercentage}
                  onChange={handleStreamingFeeChange}
                  onBlur={() => {
                    // Format to two decimals on blur if the input is not empty
                    if (streamingFeePercentage) {
                      setStreamingFeePercentage(
                        parseFloat(streamingFeePercentage).toFixed(2)
                      );
                    }
                  }}
                  min="0"
                  max={MAX_FEE_PERCENTAGE}
                  step="0.01"
                  className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter fee percentage"
                />

                <p className="mt-1 text-sm text-gray-500">
                  Annual fee percentage charged on the index
                </p>
              </div>
              <button
                onClick={handleBatchInitialize}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Initialize Module
              </button>
            </div>
          ) : (
            <div className="space-y-4 bg-white shadow-md rounded-lg p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount of Index Tokens to Issue/Redeem
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <input
                    type="number"
                    value={tokenAmount}
                    onChange={handleInputChangeAmount}
                    className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                    placeholder="Enter amount"
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={handleBatchApproveAndIssue}
                      disabled={!isConnected}
                      className="px-4 py-2 text-white font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      style={{
                        backgroundColor: "#007BFF",
                        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      Issue
                    </button>
                    <button
                      onClick={handleRedeem}
                      disabled={!isConnected}
                      className="px-4 py-2 text-white font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      style={{
                        backgroundColor: "#109b43",
                        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      Redeem
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Back Navigation */}
        <Link
          href="/indexes"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <span className="mr-2">←</span>
          Back to Analytics
        </Link>
      </div>
    </div>
  );
};

export default SetDetails;
