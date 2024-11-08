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
  getTokenAddressForChainId,
} from "klaster-sdk";

import axios from "axios";

import { getRoutes, RoutesRequest } from "@lifi/sdk";
import { Hex, parseAbi, encodeFunctionData } from "viem";

import { useState } from "react";
import Confetti from "react-confetti";
import tokenList from "@/data/tokenListBaseSep.json"; // Import token list
import { useAccount, useWallets } from "@particle-network/connectkit"; // Import wallet handling
import { Erc20v2 } from "@/abis"; // Assuming this is the correct path for the ERC20 ABI
import { Abi, Address, parseUnits } from "viem";
import {
  baseSepolia,
  optimismSepolia,
  arbitrumSepolia,
  sepolia, //https://faucet.triangleplatform.com/arbitrum/sepolia
} from "@particle-network/connectkit/chains";
import { BridgePluginParams, encodeApproveTx } from "klaster-sdk";
import { sep } from "path";

async function getAcrossSuggestedFees(data: BridgePluginParams) {
  const client = axios.create({
    baseURL: "https://testnet.across.to/api/",
  });

  const res = await client.get<RelayFeeResponse>(
    `suggested-fees?inputToken=${data.sourceToken}&outputToken=${data.destinationToken}&
    originChainId=${data.sourceChainId}&destinationChainId=${data.destinationChainId}&amount=${data.amount}`
  );

  return res.data;
}

function encodeAcrossCallData(
  data: BridgePluginParams,
  fees: RelayFeeResponse
) {
  const abi = parseAbi([
    "function depositV3(address depositor, address recipient, address inputToken, address outputToken, uint256 inputAmount, uint256 outputAmount, uint256 destinationChainId, address exclusiveRelayer, uint32 quoteTimestamp, uint32 fillDeadline, uint32 exclusivityDeadline, bytes calldata message) external",
  ]);
  const outputAmount = data.amount - BigInt(fees.totalRelayFee.total);
  const fillDeadline = Math.round(Date.now() / 1000) + 300;

  const [srcAddress, destAddress] = data.account.getAddresses([
    data.sourceChainId,
    data.destinationChainId,
  ]);
  if (!srcAddress || !destAddress) {
    throw Error(
      `Can't fetch address from multichain account for ${data.sourceChainId} or ${data.destinationChainId}`
    );
  }

  return encodeFunctionData({
    abi: abi,
    functionName: "depositV3",
    args: [
      srcAddress,
      destAddress,
      data.sourceToken,
      data.destinationToken,
      data.amount,
      outputAmount,
      BigInt(data.destinationChainId),
      fees.exclusiveRelayer,
      parseInt(fees.timestamp),
      fillDeadline,
      parseInt(fees.exclusivityDeadline),
      "0x",
    ],
  });
}

export const acrossBridgePlugin: BridgePlugin = async (data) => {
  const feesResponse = await getAcrossSuggestedFees(data);
  const outputAmount = data.amount - BigInt(feesResponse.totalRelayFee.total);

  // Approve sourceToken to the Across pool contract (for source chain)
  const acrossApproveTx = encodeApproveTx({
    tokenAddress: data.sourceToken,
    amount: data.amount,
    recipient: feesResponse.spokePoolAddress,
  });

  // Call across pool to initiate bridging
  const acrossCallTx = rawTx({
    to: feesResponse.spokePoolAddress,
    data: encodeAcrossCallData(data, feesResponse),
    gasLimit: BigInt(500000),
  });

  return {
    receivedOnDestination: outputAmount,
    txBatch: batchTx(data.sourceChainId, [acrossApproveTx, acrossCallTx]),
  };
};

interface FeeObject {
  pct: string;
  total: string;
}

interface Limits {
  minDeposit: string;
  maxDeposit: string;
  maxDepositInstant: string;
  maxDepositShortDelay: string;
  recommendedDepositInstant: string;
}

interface RelayFeeResponse {
  estimatedFillTimeSec: number;
  capitalFeePct: string;
  capitalFeeTotal: string;
  relayGasFeePct: string;
  relayGasFeeTotal: string;
  relayFeePct: string;
  relayFeeTotal: string;
  lpFeePct: string;
  timestamp: string;
  isAmountTooLow: boolean;
  quoteBlock: string;
  exclusiveRelayer: Address;
  exclusivityDeadline: string;
  spokePoolAddress: Address;
  totalRelayFee: FeeObject;
  relayerCapitalFee: FeeObject;
  relayerGasFee: FeeObject;
  lpFee: FeeObject;
  limits: Limits;
}

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
          gasLimit: 700000n,
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
          amount: parseUnits("3.111", uBalance.decimals),
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

  // const handleMint = async () => {
  //   if (!isConnected) {
  //     alert("Please connect your wallet.");
  //     return;
  //   }

  //   if (!primaryWallet || !address) {
  //     alert("Wallet is not available.");
  //     return;
  //   }

  //   setLoading(true);

  //   try {
  //     // Initialize Klaster with Biconomy as the account provider
  //     const klaster = await initKlaster({
  //       accountInitData: loadBicoV2Account({
  //         owner: address as Address,
  //       }),
  //       nodeUrl: klasterNodeHost.default,
  //     });

  //     console.log("Base id: ", baseSepolia.id);
  //     console.log("Sepolia id: ", sepolia.id);

  //     const klasterBaseAddress = klaster.account.getAddress(baseSepolia.id);
  //     console.log("Klaster's Base Sepolia Address:", klasterBaseAddress);

  //     const klasterSepoliaAddress = klaster.account.getAddress(sepolia.id);
  //     console.log("Klaster's Sepolia Address:", klasterSepoliaAddress);

  //     const klasterOptimismAddress = klaster.account.getAddress(
  //       optimismSepolia.id
  //     );
  //     console.log(
  //       "Klaster's Optimism Sepolia Address:",
  //       klasterOptimismAddress
  //     );

  //     const klasterArbitrumAddress = klaster.account.getAddress(
  //       arbitrumSepolia.id
  //     );
  //     console.log(
  //       "Klaster's Arbitrum Sepolia Address:",
  //       klasterArbitrumAddress
  //     );

  //     console.log(klaster);

  //     const mcClient = buildMultichainReadonlyClient([
  //       // buildRpcInfo(
  //       //   optimismSepolia.id,
  //       //   optimismSepolia.rpcUrls.default.http[0]
  //       // ),
  //       buildRpcInfo(baseSepolia.id, baseSepolia.rpcUrls.default.http[0]),
  //       // buildRpcInfo(sepolia.id, sepolia.rpcUrls.default.http[0]),
  //       buildRpcInfo(
  //         arbitrumSepolia.id,
  //         arbitrumSepolia.rpcUrls.default.http[0]
  //       ),
  //     ]);

  //     const mappingUSDC = buildTokenMapping([
  //       // deployment(
  //       //   optimismSepolia.id,
  //       //   "0x5fd84259d66Cd46123540766Be93DFE6D43130D7"
  //       // ),
  //       deployment(
  //         arbitrumSepolia.id,
  //         "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"
  //       ),
  //       deployment(
  //         baseSepolia.id,
  //         "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
  //       ),
  //       // deployment(sepolia.id, "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"),
  //     ]);

  //     const uBalance = await mcClient.getUnifiedErc20Balance({
  //       tokenMapping: mappingUSDC,
  //       account: klaster.account,
  //     });

  //     console.log(uBalance);

  //     const destinationChainId = baseSepolia.id;

  //     const bridgingOps = await encodeBridgingOps({
  //       tokenMapping: mappingUSDC,
  //       account: klaster.account,
  //       amount: parseUnits("3.111", uBalance.decimals),
  //       bridgePlugin: (data) => acrossBridgePlugin(data),
  //       client: mcClient,
  //       destinationChainId: destinationChainId,
  //       unifiedBalance: uBalance,
  //     });

  //     const destChainTokenAddress = getTokenAddressForChainId(
  //       mappingUSDC,
  //       destinationChainId
  //     )!;

  //     const sendUSDC = rawTx({
  //       gasLimit: 120000n,
  //       to: destChainTokenAddress,
  //       data: encodeFunctionData({
  //         abi: Erc20v2,
  //         functionName: "transfer",
  //         args: [address, bridgingOps.totalReceivedOnDestination],
  //       }),
  //     });

  //     // Define the interchain transaction (iTx)
  //     const iTx = buildItx({
  //       steps: bridgingOps.steps.concat(singleTx(destinationChainId, sendUSDC)),
  //       feeTx: klaster.encodePaymentFee(arbitrumSepolia.id, "USDC"),
  //     });

  //     const quote = await klaster.getQuote(iTx);

  //     console.log(quote.itxHash);

  //     const walletClient = primaryWallet.getWalletClient();

  //     const signed = await walletClient.signMessage({
  //       message: {
  //         raw: quote.itxHash,
  //       },
  //       account: address as Address,
  //     });

  //     const result = await klaster.execute(quote, signed);

  //     console.log(result.itxHash);
  //   } catch (error) {
  //     console.error("Cross-chain mint failed:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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
