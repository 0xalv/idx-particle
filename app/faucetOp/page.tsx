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
  batchTx,
  BridgePlugin,
  rawTx,
} from "klaster-sdk";

import { getRoutes, RoutesRequest } from "@lifi/sdk";
import { Hex } from "viem";

import { useState } from "react";
import Confetti from "react-confetti";
import tokenList from "@/data/tokenListBaseSep.json"; // Import token list
import { useAccount, useWallets } from "@particle-network/connectkit"; // Import wallet handling
import { Erc20v2 } from "@/abis"; // Assuming this is the correct path for the ERC20 ABI
import { Abi, Address, parseUnits, encodeFunctionData } from "viem";
import {
  baseSepolia,
  optimismSepolia,
  arbitrumSepolia, //https://faucet.triangleplatform.com/arbitrum/sepolia
} from "@particle-network/connectkit/chains";

export const liFiBrigePlugin: BridgePlugin = async (data: any) => {
  const routesRequest: RoutesRequest = {
    fromChainId: data.sourceChainId,
    toChainId: data.destinationChainId,
    fromTokenAddress: data.sourceToken,
    toTokenAddress: data.destinationToken,
    fromAmount: data.amount.toString(),
    options: {
      order: "FASTEST",
    },
  };

  const result = await getRoutes(routesRequest);
  const route = result.routes.at(0);

  if (!route) {
    throw Error("...");
  }

  const routeSteps = route.steps.map((step) => {
    if (!step.transactionRequest) {
      throw Error("...");
    }
    const { to, gasLimit, data, value } = step.transactionRequest;
    if (!to || !gasLimit || !data || !value) {
      throw Error("...");
    }
    return rawTx({
      to: to as Address,
      gasLimit: BigInt(gasLimit),
      data: data as Hex,
      value: BigInt(value),
    });
  });

  return {
    receivedOnDestination: BigInt(route.toAmountMin),
    txBatch: batchTx(data.sourceChainId, routeSteps),
  };
};

export default function Component() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [mintedTokens, setMintedTokens] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [primaryWallet] = useWallets(); // Get primary wallet
  const { chain, address, isConnected, chainId } = useAccount(); // Get wallet connection state

  const erc20Abi = [
    {
      name: "transfer",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "to", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [{ type: "bool" }],
    },
  ] as const;

  function createErc20TransferData({
    to,
    amount,
    decimals = 18,
  }: {
    to: `0x${string}`;
    amount: string | number;
    decimals?: number;
  }) {
    const parsedAmount = parseUnits(amount.toString(), decimals);
    return encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [to, parsedAmount],
    });
  }

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

    try {
      // Initialize Klaster with Biconomy as the account provider
      const klaster = await initKlaster({
        accountInitData: loadBicoV2Account({
          owner: address as Address,
        }),
        nodeUrl: klasterNodeHost.default,
      });

      const klasterBaseAddress = klaster.account.getAddress(baseSepolia.id);
      console.log("Klaster's Base Sepolia Address:", klasterBaseAddress);

      const klasterOptimismAddress = klaster.account.getAddress(optimismSepolia.id);
      console.log("Klaster's Optimism Sepolia Address:", klasterOptimismAddress);

      const klasterArbitrumAddress = klaster.account.getAddress(arbitrumSepolia.id);
      console.log("Klaster's Arbitrum Sepolia Address:", klasterArbitrumAddress);

      console.log(klaster);

      const mcClient = buildMultichainReadonlyClient([
        // buildRpcInfo(
        //   optimismSepolia.id,
        //   optimismSepolia.rpcUrls.default.http[0]
        // ),
        buildRpcInfo(baseSepolia.id, baseSepolia.rpcUrls.default.http[0]),
        buildRpcInfo(arbitrumSepolia.id, arbitrumSepolia.rpcUrls.default.http[0]),
      ]);

      const mappingUSDC = buildTokenMapping([
        // deployment(
        //   optimismSepolia.id,
        //   "0x5fd84259d66Cd46123540766Be93DFE6D43130D7"
        // ),
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

      // const bridgePluginParams: any = {
      //   fromChainId: arbitrumSepolia.id,
      //   toChainId: baseSepolia.id,
      //   fromTokenAddress: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
      //   toTokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      //   fromAmount: data.amount.toString(),
      //   options: {
      //     order: "FASTEST",
      //   },
        
      // }

      // const bridgePluginResult = await liFiBrigePlugin(bridgePluginParams);

      const bridgingOps = await encodeBridgingOps({
        tokenMapping: mappingUSDC,
        account: klaster.account,
        amount: uBalance.balance - parseUnits("1", uBalance.decimals), // Don't send entire balance
        bridgePlugin: liFiBrigePlugin,
        client: mcClient,
        destinationChainId: baseSepolia.id,
        unifiedBalance: uBalance,
      });

      const sendUSDC = rawTx({
        gasLimit: 90000n,
        to: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        data: encodeFunctionData({
          abi: Erc20v2,
          functionName: "transfer",
          args: [address, bridgingOps.totalReceivedOnDestination],
        }),
      });

      console.log("Add: ", address);

      // Define the interchain transaction (iTx)
      const iTx = buildItx({
        steps: bridgingOps.steps.concat(singleTx(baseSepolia.id, sendUSDC)),
        feeTx: klaster.encodePaymentFee(baseSepolia.id, "USDC"),
      });

      const quote = await klaster.getQuote(iTx);

      const walletClient = primaryWallet.getWalletClient();

      const signed = await walletClient.signMessage({
        message: {
          raw: quote.itxHash,
        },
        account: address as Address,
      });

      const result = await klaster.execute(quote, signed);

      console.log(result.itxHash);

      // // Set up multichain RPC client for Optimism and Base
      // const mcClient = buildMultichainReadonlyClient([
      //   buildRpcInfo(
      //     optimismSepolia.id,
      //     optimismSepolia.rpcUrls.default.http[0]
      //   ),
      //   buildRpcInfo(baseSepolia.id, baseSepolia.rpcUrls.default.http[0]),
      // ]);

      // // Build a token mapping by calling the buildTokenMapping function and passing instances of
      // // deployment object into the array. These represent the chainId → address mappings.
      // const mcUSDC = buildTokenMapping([
      //   deployment(
      //     optimismSepolia.id,
      //     "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
      //   ),
      //   deployment(
      //     baseSepolia.id,
      //     "0x5fd84259d66Cd46123540766Be93DFE6D43130D7"
      //   ),
      // ]);

      // // Encode the destination chain action (minting tokens on Base Sepolia)
      // const mintTokensOp = encodeFunctionData({
      //   abi: Erc20v2, // Replace with your actual ERC20 ABI
      //   functionName: "mint", // Name of the mint function
      //   args: [address, 10 * 18 * 10], // Example: mint 10 tokens to the user
      // });
    } catch (error) {
      console.error("Cross-chain mint failed:", error);
    } finally {
      setLoading(false);
    }
  };

  //   const handleMint = async () => {
  //     if (!isConnected) {
  //       alert("Please connect your wallet.");
  //       return;
  //     }

  //     if (!primaryWallet || !address) {
  //       alert("Wallet is not available.");
  //       return;
  //     }

  //     setLoading(true);
  //     setShowConfetti(true);

  //     try {
  //       const walletClient = primaryWallet.getWalletClient();

  //       // Limit the tokens to be minted to the first two tokens in the tokenList
  //       const tokensToMint = tokenList.slice(0, 2);

  //       // Mint 100 tokens for each of the selected tokens
  //       const mintPromises = tokensToMint.map(async (token) => {
  //         const mintAmount = BigInt(100 * 10 ** token.decimals); // Calculate mint amount based on decimals

  //         await walletClient.writeContract({
  //           address: token.address as `0x${string}`,
  //           abi: Erc20v2 as Abi, // Assuming this is the correct ABI reference for ERC20
  //           functionName: "mint",
  //           args: [address, mintAmount],
  //           chain: chain,
  //           account: address as Address,
  //         });

  //         return `You have received 100 ${token.ticker} tokens.`;
  //       });

  //       const mintResults = await Promise.all(mintPromises);
  //       setMintedTokens(mintResults);

  //       setTimeout(() => setShowConfetti(false), 10000); // Hide confetti after 10 seconds
  //     } catch (error) {
  //       console.error("Minting failed:", error);
  //       alert("Minting failed, please check the console for more details.");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

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
