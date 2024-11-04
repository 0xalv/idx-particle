// app/indexes/[address]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  useWallets,
  useAccount,
  usePublicClient,
} from "@particle-network/connectkit";
import { useParams } from "next/navigation";
import { Erc20, SetToken, BasicIssuanceModule } from "@/abis";
import {
  Abi,
  Address,
  formatUnits,
  parseEther,
  parseUnits,
  encodeFunctionData,
} from "viem";
import Link from "next/link";

interface SetDetailsProps {
  status?: string;
}

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

const SetDetails: React.FC<SetDetailsProps> = () => {
  const [primaryWallet] = useWallets();
  const { chain, address: userWallet, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const params = useParams();
  const address = params.address as `0x${string}`;

  const [tokenAmount, setTokenAmount] = useState<number>(1);
  const [approvalPosition, setApprovalPosition] = useState<number>(0);
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

  const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
  const basicIssuanceModuleAddress = process.env
    .NEXT_PUBLIC_BASIC_ISSUANCE_MODULE as `0x${string}`;
  const multicallAddress = process.env
    .NEXT_PUBLIC_MULTICALL_ADDRESS as `0x${string}`;

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

  const handleInputChangeApproval = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { value } = event.target;
    setApprovalPosition(value === "" ? 0 : parseInt(value));
  };

  // Contract write functions
  const handleApprove = async (position: number) => {
    if (!primaryWallet || !componentUnits || !chain || !userWallet) return;
    try {
      const walletClient = primaryWallet.getWalletClient();
      const hash = await walletClient.writeContract({
        address: componentUnits[0][position] as `0x${string}`,
        abi: Erc20 as Abi,
        functionName: "approve",
        args: [basicIssuanceModuleAddress, componentUnits[1][position]],
        chain,
        account: userWallet as Address,
      });
      console.log("Approval hash:", hash);
    } catch (error) {
      console.error("Error approving token:", error);
    }
  };

  const handleIssue = async () => {
    if (!primaryWallet || !chain || !userWallet) return;
    try {
      const walletClient = primaryWallet.getWalletClient();
      const hash = await walletClient.writeContract({
        address: basicIssuanceModuleAddress,
        abi: BasicIssuanceModule as Abi,
        functionName: "issue",
        args: [address, parseEther(`${tokenAmount}`), userWallet],
        chain,
        account: userWallet as Address,
      });
      console.log("Issue hash:", hash);
    } catch (error) {
      console.error("Error issuing tokens:", error);
    }
  };

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

  const getDistributionDisplay = () => {
    if (!componentUnits || !tokenDecimals || !tokenNames) return [];

    return componentUnits[1].map((unit, index) => {
      const decimals = tokenDecimals[index]?.result || 1;
      const name = tokenNames[index]?.result || "N/A";
      const quantity = parseFloat(formatUnits(unit, decimals));
      return `${name} - ${quantity.toFixed(0)}`;
    });
  };

  const handleBatchApprove = async () => {
    if (!primaryWallet || !componentUnits || !chain || !userWallet) return;

    const approvalCalls = componentUnits[0].map((tokenAddress, index) => ({
      target: tokenAddress,
      callData: encodeFunctionData({
        abi: Erc20,
        functionName: "approve",
        args: [basicIssuanceModuleAddress, componentUnits[1][index]],
      }),
    }));

    try {
      const walletClient = primaryWallet.getWalletClient();
      const hash = await walletClient.writeContract({
        address: multicallAddress,
        abi: [
          {
            inputs: [
              {
                internalType: "bytes[]",
                name: "data",
                type: "bytes[]",
              },
            ],
            name: "aggregate",
            outputs: [
              {
                internalType: "uint256",
                name: "blockNumber",
                type: "uint256",
              },
              {
                internalType: "bytes[]",
                name: "returnData",
                type: "bytes[]",
              },
            ],
            stateMutability: "nonpayable",
            type: "function",
          },
        ] as const,
        functionName: "aggregate",
        args: [approvalCalls.map((call) => call.callData)],
        chain,
        account: userWallet as Address,
      });
      console.log("Batch approve hash:", hash);
    } catch (error) {
      console.error("Error batch approving:", error);
    }
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
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-600">
                Underlying Assets Distribution
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
              <button
                onClick={handleInitialize}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Initialize Module
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount of Index Tokens
                </label>
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={handleInputChangeAmount}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Position for Approval
                </label>
                <input
                  type="number"
                  value={approvalPosition}
                  onChange={handleInputChangeApproval}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter position"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={handleBatchApprove}
                  disabled={!isConnected || !componentUnits}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: COLORS[0] }}
                >
                  Batch Approve
                </button>
                <button
                  onClick={() => handleApprove(approvalPosition)}
                  disabled={!isConnected || !componentUnits}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: COLORS[1] }}
                >
                  Approve
                </button>
                <button
                  onClick={handleIssue}
                  disabled={!isConnected}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: COLORS[2] }}
                >
                  Issue
                </button>
                <button
                  onClick={handleRedeem}
                  disabled={!isConnected}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: COLORS[3] }}
                >
                  Redeem
                </button>
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
          Back to Indexes
        </Link>
      </div>
    </div>
  );
};

export default SetDetails;
