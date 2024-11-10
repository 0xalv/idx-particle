"use client";

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
  getTokenAddressForChainId,
} from "klaster-sdk";

import { acrossBridgePlugin } from "@/utils/acrossBridge";

import { useState } from "react";
import Confetti from "react-confetti";
import tokenList from "@/data/tokenListBaseSep.json"; // Import token list
import { useAccount, useWallets } from "@particle-network/connectkit"; // Import wallet handling
import { Erc20v2 } from "@/abis";
import { Address, parseUnits, encodeFunctionData } from "viem";
import {
  baseSepolia,
  arbitrumSepolia,
} from "@particle-network/connectkit/chains";

export default function Component() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [mintedTokens, setMintedTokens] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [primaryWallet] = useWallets(); // Get primary wallet
  const { chain, address, isConnected, chainId } = useAccount(); // Get wallet connection state

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

      // Initialize Klaster with Biconomy as the account provider
      const klaster = await initKlaster({
        accountInitData: loadBicoV2Account({
          owner: address as Address,
        }),
        nodeUrl: klasterNodeHost.default,
      });

      console.log(
        "Smart Account: ",
        klaster.account.getAddress(arbitrumSepolia.id)
      );

      // Set up the multichain client
      const mcClient = buildMultichainReadonlyClient([
        buildRpcInfo(baseSepolia.id, baseSepolia.rpcUrls.default.http[0]),
        buildRpcInfo(
          arbitrumSepolia.id,
          arbitrumSepolia.rpcUrls.default.http[0]
        ),
      ]);

      // Token mapping configuration (example for USDC on Base and Arbitrum)
      const mappingUSDC = buildTokenMapping([
        deployment(
          arbitrumSepolia.id,
          "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"
        ),
        deployment(
          baseSepolia.id,
          "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
        ),
      ]);

      const uBalance = await mcClient.getUnifiedErc20Balance({
        tokenMapping: mappingUSDC,
        account: klaster.account,
      });

      console.log(uBalance);

      const destinationChainId = baseSepolia.id;

      const destChainTokenAddress = getTokenAddressForChainId(
        mappingUSDC,
        destinationChainId
      )!;

      // Minting Tokens on Base
      const tokensToMint = tokenList.slice(0, 2); // Limited to 2 tokens to test it with klaster
      const mintPromises = tokensToMint.map(async (token) => {
        const mintAmount = BigInt(100 * 10 ** token.decimals); // Example: mint 100 tokens

        const mintTx = rawTx({
          gasLimit: 1000000n,
          to: token.address as Address,
          data: encodeFunctionData({
            abi: Erc20v2,
            functionName: "mint",
            args: [address, mintAmount],
          }),
        });

        // Encode bridging ops to fund gas fees on Base from Arbitrum
        const bridgingOps = await encodeBridgingOps({
          tokenMapping: mappingUSDC,
          account: klaster.account,
          amount: parseUnits("5", uBalance.decimals),
          bridgePlugin: (data) => acrossBridgePlugin(data),
          client: mcClient,
          destinationChainId: baseSepolia.id,
          unifiedBalance: uBalance,
        });

        // Create interchain transaction
        const iTx = buildItx({
          steps: bridgingOps.steps.concat(singleTx(baseSepolia.id, mintTx)),
          feeTx: klaster.encodePaymentFee(arbitrumSepolia.id, "USDC"),
        });

        const quote = await klaster.getQuote(iTx);
        const signed = await walletClient.signMessage({
          message: { raw: quote.itxHash },
          account: address as Address,
        });

        const result = await klaster.execute(quote, signed);
        console.log(`Minting transaction hash: ${result.itxHash}`);

        return `You have received 100 ${token.ticker} tokens.`;
      });

      // Wait for all minting transactions to complete
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
          Use this tool to get tokens for testing the platform from Arbitrum
          Sepolia using <strong>Klaster</strong>.
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
