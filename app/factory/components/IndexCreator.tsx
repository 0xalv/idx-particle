"use client";

import dynamic from "next/dynamic";
import React, { useState } from "react";
import DownOutlined from "@ant-design/icons/DownOutlined";
import tokenList from "@/data/tokenListBaseSep.json";
import { Abi, parseUnits, Address, encodeFunctionData } from "viem";
import { useAccount, useWallets } from "@particle-network/connectkit";
import { SetTokenCreator } from "@/abis";
import { acrossBridgePlugin } from "@/utils/acrossBridge";
import {
  initKlaster,
  klasterNodeHost,
  loadBicoV2Account,
  buildTokenMapping,
  deployment,
  buildItx,
  singleTx,
  encodeBridgingOps,
  buildMultichainReadonlyClient,
  buildRpcInfo,
  rawTx,
} from "klaster-sdk";
import {
  baseSepolia,
  arbitrumSepolia,
} from "@particle-network/connectkit/chains";

const Modal = dynamic(() => import("antd/lib/modal"), {
  loading: () => <p>Loading...</p>,
  ssr: false,
});

interface Token {
  ticker: string;
  img: string;
  name: string;
  address: string;
  decimals: number;
}

interface SelectedToken {
  token: Token;
  amount: number;
}

export const IndexCreator: React.FC = () => {
  const [tokenOne] = useState<Token>(tokenList[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState<SelectedToken[]>([]);
  const [indexName, setIndexName] = useState("");
  const [indexSymbol, setIndexSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [primaryWallet] = useWallets();
  const { chain, address, isConnected } = useAccount();

  const setTokenCreatorAddress = process.env
    .NEXT_PUBLIC_SET_TOKEN_CREATOR as `0x${string}`;
  const basicIssuanceModuleAddress = process.env
    .NEXT_PUBLIC_BASIC_ISSUANCE_MODULE as `0x${string}`;
  const streamingFeeModuleAddress = process.env
    .NEXT_PUBLIC_STREAMING_FEE_MODULE as `0x${string}`;

  if (
    !setTokenCreatorAddress ||
    !basicIssuanceModuleAddress ||
    !streamingFeeModuleAddress
  ) {
    throw new Error("Missing contract address");
  }

  const openModal = () => {
    setIsOpen(true);
  };

  const modifyToken = (ticker: string) => {
    const tokenIndex = tokenList.findIndex((token) => token.ticker === ticker);
    if (tokenIndex === -1) return;

    const tokenData = tokenList[tokenIndex];
    const tokenExists = selectedTokens.some(
      (item) => item.token.ticker === tokenData.ticker
    );

    if (!tokenExists) {
      setSelectedTokens([...selectedTokens, { token: tokenData, amount: 1 }]);
    }
    setIsOpen(false);
    setSearchTerm(""); // Clear search term after selecting a token
  };

  const updateTokenAmount = (ticker: string, newAmount: string) => {
    setSelectedTokens(
      selectedTokens.map((item) =>
        item.token.ticker === ticker
          ? { ...item, amount: parseInt(newAmount) }
          : item
      )
    );
  };

  const removeToken = (ticker: string) => {
    setSelectedTokens(
      selectedTokens.filter((item) => item.token.ticker !== ticker)
    );
  };

  const totalAmount = selectedTokens.reduce(
    (sum, token) => sum + token.amount,
    0
  );

  const handleCreateIndex = async () => {
    if (
      !primaryWallet ||
      selectedTokens.length === 0 ||
      !indexName ||
      !indexSymbol
    )
      return;
    setLoading(true);
    const componentAddresses = selectedTokens.map(
      (token) => token.token.address
    );
    const componentUnits = selectedTokens.map((token) =>
      parseUnits(token.amount.toString(), token.token.decimals)
    );
    try {
      const walletClient = primaryWallet.getWalletClient();
      const createIndexArgs = [
        componentAddresses,
        componentUnits,
        [basicIssuanceModuleAddress, streamingFeeModuleAddress], // Modules [issue, fee]
        address as Address,
        indexName,
        indexSymbol,
      ];
      console.table(createIndexArgs);
      const hash = await walletClient.writeContract({
        address: setTokenCreatorAddress,
        abi: SetTokenCreator as Abi,
        functionName: "create",
        args: createIndexArgs,
        chain: chain,
        account: address as Address,
      });
      console.log("Transaction hash:", hash);
    } catch (error) {
      console.error("Error creating index:", error);
    } finally {
      setLoading(false);
    }
  };

  // const handleCreateIndex = async () => {
  //   if (
  //     !primaryWallet ||
  //     selectedTokens.length === 0 ||
  //     !indexName ||
  //     !indexSymbol
  //   )
  //     return;

  //   setLoading(true);

  //   const componentAddresses = selectedTokens.map(
  //     (token) => token.token.address
  //   );

  //   const componentUnits = selectedTokens.map((token) =>
  //     parseUnits(token.amount.toString(), token.token.decimals)
  //   );

  //   try {
  //     const walletClient = primaryWallet.getWalletClient();

  //     // Initialize Klaster with Biconomy as the account provider
  //     const klaster = await initKlaster({
  //       accountInitData: loadBicoV2Account({
  //         owner: address as Address,
  //       }),
  //       nodeUrl: klasterNodeHost.default,
  //     });

  //     // Set up the multichain client
  //     const mcClient = buildMultichainReadonlyClient([
  //       buildRpcInfo(baseSepolia.id, baseSepolia.rpcUrls.default.http[0]),
  //       buildRpcInfo(
  //         arbitrumSepolia.id,
  //         arbitrumSepolia.rpcUrls.default.http[0]
  //       ),
  //     ]);

  //     // Token mapping configuration for USDC on Base and Arbitrum
  //     const mappingUSDC = buildTokenMapping([
  //       deployment(
  //         arbitrumSepolia.id,
  //         "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"
  //       ),
  //       deployment(
  //         baseSepolia.id,
  //         "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
  //       ),
  //     ]);

  //     const uBalance = await mcClient.getUnifiedErc20Balance({
  //       tokenMapping: mappingUSDC,
  //       account: klaster.account,
  //     });

  //     console.log(uBalance);

  //     // Define the transaction for creating an index
  //     const createIndexTx = rawTx({
  //       gasLimit: 1000000n,
  //       to: setTokenCreatorAddress,
  //       data: encodeFunctionData({
  //         abi: SetTokenCreator as Abi,
  //         functionName: "create",
  //         args: [
  //           componentAddresses,
  //           componentUnits,
  //           [basicIssuanceModuleAddress, streamingFeeModuleAddress],
  //           address as Address,
  //           indexName,
  //           indexSymbol,
  //         ],
  //       }),
  //     });

  //     // Encode bridging ops to fund gas fees on Base from Arbitrum
  //     const bridgingOps = await encodeBridgingOps({
  //       tokenMapping: mappingUSDC,
  //       account: klaster.account,
  //       amount: parseUnits("5", uBalance.decimals),
  //       bridgePlugin: (data) => acrossBridgePlugin(data),
  //       client: mcClient,
  //       destinationChainId: baseSepolia.id,
  //       unifiedBalance: uBalance,
  //     });

  //     // Create interchain transaction for creating the index with bridged gas fees
  //     const iTx = buildItx({
  //       steps: bridgingOps.steps.concat(
  //         singleTx(baseSepolia.id, createIndexTx)
  //       ),
  //       feeTx: klaster.encodePaymentFee(arbitrumSepolia.id, "USDC"),
  //     });

  //     const quote = await klaster.getQuote(iTx);
  //     const signed = await walletClient.signMessage({
  //       message: { raw: quote.itxHash },
  //       account: address as Address,
  //     });

  //     const result = await klaster.execute(quote, signed);
  //     console.log("Index creation transaction hash:", result.itxHash);
  //   } catch (error) {
  //     console.error("Error creating index:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  if (!isConnected) {
    return (
      <div className="text-center text-red-500 mt-4">You are not logged in</div>
    );
  }

  const filteredTokens = tokenList.filter(
    (token) =>
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.ticker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    return (
      <div className="p-8 bg-white shadow-lg rounded-xl max-w-2xl mx-auto mt-10 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Create Your Index
        </h1>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            Select the underlying tokens
          </h2>
          <div
            className="flex items-center border border-gray-300 rounded-lg p-4 cursor-pointer transition-transform"
            onClick={openModal}
          >
            <img
              src={tokenOne.img}
              alt={tokenOne.ticker}
              className="w-8 h-8 mr-2"
            />
            <span className="text-gray-700 font-semibold">
              {tokenOne.ticker}
            </span>
            <DownOutlined className="ml-2 text-gray-500" />
          </div>

          <div className="mt-5">
            {selectedTokens.map((item, index) => (
              <div
                key={index}
                className="flex items-center mb-4 bg-gray-200 p-3 rounded-lg"
              >
                <img
                  src={item.token.img}
                  alt={item.token.ticker}
                  className="w-6 h-6 mr-3"
                />
                <span className="mr-3 text-gray-700 font-medium">
                  {item.token.ticker}
                </span>
                <input
                  type="number"
                  value={item.amount}
                  onChange={(e) =>
                    updateTokenAmount(item.token.ticker, e.target.value)
                  }
                  min="1"
                  className="border rounded p-2 w-20 text-center mr-3"
                />
                <button
                  onClick={() => removeToken(item.token.ticker)}
                  className="text-red-500 font-semibold"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            Index Name
          </h2>
          <input
            type="text"
            placeholder="Enter index name"
            value={indexName}
            onChange={(e) => setIndexName(e.target.value)}
            className="border rounded-lg p-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            Index Symbol
          </h2>
          <input
            type="text"
            placeholder="Enter index symbol"
            value={indexSymbol}
            onChange={(e) => setIndexSymbol(e.target.value)}
            className="border rounded-lg p-4 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          className={`w-full py-4 rounded-lg text-white font-bold transition-colors ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
          onClick={handleCreateIndex}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Index"}
        </button>

        <Modal
          open={isOpen}
          footer={null}
          onCancel={() => {
            setIsOpen(false);
            setSearchTerm(""); // Clear search term on modal close
          }}
          title="Select a token"
        >
          <div className="p-4">
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <div className="max-h-96 overflow-y-auto">
              {filteredTokens.map((token) => (
                <div
                  key={token.ticker}
                  onClick={() => modifyToken(token.ticker)}
                  className="flex items-center mb-3 p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-transform transform"
                >
                  <img
                    src={token.img}
                    alt={token.ticker}
                    className="w-8 h-8 mr-4"
                  />
                  <div>
                    <p className="text-gray-800 font-semibold">{token.name}</p>
                    <p className="text-gray-500 text-sm">{token.ticker}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      </div>
    );
  };

  return <div className="min-h-screen bg-gray-50 py-8">{renderContent()}</div>;
};
