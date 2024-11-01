"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "antd";
import { DownOutlined } from "@ant-design/icons";
import tokenList from "@/data/tokenList.json";
import { Abi, parseUnits, Address } from "viem";
import { useAccount, useWallets } from "@particle-network/connectkit";
import { SetTokenCreator } from "@/abis"; // Import your ABI file here

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

const Factory: React.FC = () => {
  const [tokenOne] = useState<Token>(tokenList[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState<SelectedToken[]>([]);
  const [indexName, setIndexName] = useState("");
  const [indexSymbol, setIndexSymbol] = useState("");
  const [loading, setLoading] = useState(false);

  const [primaryWallet] = useWallets();
  const { chain, address, isConnected } = useAccount();

  // ! DEPRECATED now use connected address
  // const managerAddress = process.env
  //   .NEXT_PUBLIC_MANAGER_ADDRESS as `0x${string}`;
  const setTokenCreatorAddress = process.env
    .NEXT_PUBLIC_SET_TOKEN_CREATOR as `0x${string}`;
  const basicIssuanceModuleAddress = process.env
    .NEXT_PUBLIC_BASIC_ISSUANCE_MODULE as `0x${string}`;
  const multicllAddress = process.env.NEXT_MULTICALL_ADDRESS as `0x${string}`;

  if (!setTokenCreatorAddress || !basicIssuanceModuleAddress) {
    throw new Error("Missing contract address");
  }

  const openModal = () => {
    setIsOpen(true);
  };

  const modifyToken = (i: number) => {
    const tokenData = tokenList[i];
    const tokenExists = selectedTokens.some(
      (item) => item.token.ticker === tokenData.ticker
    );

    if (!tokenExists) {
      setSelectedTokens([...selectedTokens, { token: tokenData, amount: 1 }]);
    }
    setIsOpen(false);
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
        [basicIssuanceModuleAddress],
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
      // Handle success (e.g., show a success message)
    } catch (error) {
      console.error("Error creating index:", error);
      // Handle error (e.g., show an error message)
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center text-red-500">You are not logged in</div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Create Your Index</h1>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Select the underlying tokens</h2>
        <div className="flex items-center cursor-pointer" onClick={openModal}>
          <img
            src={tokenOne.img}
            alt={tokenOne.ticker}
            className="w-8 h-8 mr-2"
          />
          {tokenOne.ticker}
          <DownOutlined className="ml-2" />
        </div>
        <div className="mt-4">
          {selectedTokens.map((item, index) => {
            const percentage = ((item.amount / totalAmount) * 100).toFixed(2);
            return (
              <div key={index} className="flex items-center mb-2">
                <img
                  src={item.token.img}
                  alt={item.token.ticker}
                  className="w-6 h-6 mr-2"
                />
                <span className="mr-2">{item.token.ticker}</span>
                <input
                  type="number"
                  value={item.amount}
                  onChange={(e) =>
                    updateTokenAmount(item.token.ticker, e.target.value)
                  }
                  min="1"
                  className="border p-1 mr-2"
                />
                <button
                  onClick={() => removeToken(item.token.ticker)}
                  className="text-red-500"
                >
                  Remove
                </button>
                <span className="ml-2">{percentage}%</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Index name</h2>
          <input
            type="text"
            placeholder="Enter index name"
            value={indexName}
            onChange={(e) => setIndexName(e.target.value)}
            className="border p-2 w-full"
          />
        </div>
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Index symbol</h2>
          <input
            type="text"
            placeholder="Enter index symbol"
            value={indexSymbol}
            onChange={(e) => setIndexSymbol(e.target.value)}
            className="border p-2 w-full"
          />
        </div>
      </div>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleCreateIndex}
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Index"}
      </button>

      <Modal
        open={isOpen}
        footer={null}
        onCancel={() => setIsOpen(false)}
        title="Select a token"
      >
        <div>
          {tokenList.map((token, i) => (
            <div
              key={i}
              onClick={() => modifyToken(i)}
              className="cursor-pointer flex items-center mb-2"
            >
              <img
                src={token.img}
                alt={token.ticker}
                className="w-8 h-8 mr-2"
              />
              <div>
                <p>{token.name}</p>
                <p>{token.ticker}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default Factory;
