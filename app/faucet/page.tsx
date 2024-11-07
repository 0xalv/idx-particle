"use client";

import { useState } from "react";
import Confetti from "react-confetti";
import tokenList from "@/data/tokenListBaseSep.json"; // Import token list
import { useAccount, useWallets } from "@particle-network/connectkit"; // Import wallet handling
import { Erc20v2 } from "@/abis"; // Assuming this is the correct path for the ERC20 ABI
import { Abi, Address } from "viem";

export default function Component() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [mintedTokens, setMintedTokens] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [primaryWallet] = useWallets(); // Get primary wallet
  const { chain, address, isConnected } = useAccount(); // Get wallet connection state

  const handleMint = async () => {
    if (!isConnected) {
      alert("Please connect your wallet.");
      return;
    }

    if (!primaryWallet || !address) {
      alert("Wallet is not available.");
      return;
    }

    setLoading(true);
    setShowConfetti(true);

    try {
      const walletClient = primaryWallet.getWalletClient();

      // Limit the tokens to be minted to the first two tokens in the tokenList
      const tokensToMint = tokenList.slice(0, 2);

      // Mint 100 tokens for each of the selected tokens
      const mintPromises = tokensToMint.map(async (token) => {
        const mintAmount = BigInt(100 * 10 ** token.decimals); // Calculate mint amount based on decimals

        await walletClient.writeContract({
          address: token.address as `0x${string}`,
          abi: Erc20v2 as Abi, // Assuming this is the correct ABI reference for ERC20
          functionName: "mint",
          args: [address, mintAmount],
          chain: chain,
          account: address as Address,
        });

        return `You have received 100 ${token.ticker} tokens.`;
      });

      const mintResults = await Promise.all(mintPromises);
      setMintedTokens(mintResults);

      setTimeout(() => setShowConfetti(false), 10000); // Hide confetti after 10 seconds
    } catch (error) {
      console.error("Minting failed:", error);
      alert("Minting failed, please check the console for more details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {showConfetti && <Confetti />}
      <div className="flex flex-col items-center mb-12 space-y-8 md:space-y-10 max-w-screen-xl w-full mx-auto">
        <h2 className="text-[#364647] max-w-3xl text-center text-3xl font-bold md:text-4xl lg:text-5xl lg:leading-tight">
          Test Tokens Available. <br /> Start Trading Now.
        </h2>
        <h3 className="text-[#859393] max-w-lg text-center text-sm font-medium md:text-base">
          Use this tool to get tokens for testing the platform. Mint multiple
          tokens at once to explore all features.
        </h3>
        <button
          onClick={handleMint}
          disabled={loading}
          className={`${
            loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-400"
          } text-white rounded-lg px-11 py-3 transition-colors`}
        >
          {loading ? "Minting Tokens..." : "Mint Tokens"}
        </button>
      </div>

      {mintedTokens.length > 0 && (
        <div className="max-w-lg mx-auto mt-8">
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-2">
            {mintedTokens.map((message, index) => (
              <p
                key={index}
                className="text-[#364647] text-sm md:text-base text-center"
              >
                {message}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
