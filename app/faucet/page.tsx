"use client";

import { useState } from "react";
import Confetti from "react-confetti";

const tokens = [
  { ticker: "BTC", name: "Bitcoin" },
  { ticker: "ETH", name: "Ethereum" },
  { ticker: "BNB", name: "BNB" },
  { ticker: "USDT", name: "Tether" },
  { ticker: "SOL", name: "Solana" },
  { ticker: "ADA", name: "Cardano" },
  { ticker: "XRP", name: "Ripple" },
  { ticker: "DOT", name: "Polkadot" },
  { ticker: "DOGE", name: "Dogecoin" },
  { ticker: "AVAX", name: "Avalanche" },
];

export default function Component() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [mintedTokens, setMintedTokens] = useState<string[]>([]);

  const handleMint = () => {
    setShowConfetti(true);
    setMintedTokens(
      tokens.map((token) => `You have received 100 ${token.ticker} tokens.`)
    );
    setTimeout(() => setShowConfetti(false), 5000);
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
          className="bg-blue-500 hover:bg-blue-400 text-white rounded-lg px-11 py-3 transition-colors"
        >
          Mint Tokens
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
