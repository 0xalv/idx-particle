"use client";

import React from "react";

import { ConnectKitProvider, createConfig } from "@particle-network/connectkit";
import { authWalletConnectors } from "@particle-network/connectkit/auth";
import type { Chain } from "@particle-network/connectkit/chains";
// embedded wallet start
import { EntryPosition, wallet } from "@particle-network/connectkit/wallet";
// embedded wallet end

// evm start
import {
  baseSepolia,
  optimismSepolia,
  defineChain,
  arbitrumSepolia,
  sepolia,
} from "@particle-network/connectkit/chains";

const neoXTestnet = defineChain({
  id: 12227332,
  name: "neoX Testnet",
  nativeCurrency: {
    name: "Gas",
    symbol: "GAS",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://neoxt4seed1.ngd.network"] },
  },
  blockExplorers: {
    default: {
      name: "NEOX Chain Explorer",
      url: "https://xt4scan.ngd.network/",
    },
  },
  testnet: true,
});

import { evmWalletConnectors } from "@particle-network/connectkit/evm";
// evm end

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;
const clientKey = process.env.NEXT_PUBLIC_CLIENT_KEY as string;
const appId = process.env.NEXT_PUBLIC_APP_ID as string;
const walletConnectProjectId = process.env
  .NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as string;

if (!projectId || !clientKey || !appId) {
  throw new Error("Please configure the Particle project in .env first!");
}

const supportChains: Chain[] = [];
// evm start
supportChains.push(baseSepolia, optimismSepolia, arbitrumSepolia, sepolia);
// evm end

const config = createConfig({
  projectId,
  clientKey,
  appId,
  appearance: {
    recommendedWallets: [
      { walletId: "metaMask", label: "Recommended" },
      { walletId: "coinbaseWallet", label: "Popular" },
    ],
    language: "en-US",
    theme: {
      // primary button
      "--pcm-primary-button-color": "#ffffff",
      "--pcm-primary-button-bankground": "#2563EB",
      "--pcm-primary-button-hover-background": "#353738",
    },
  },
  walletConnectors: [
    authWalletConnectors(),
    // evm start
    evmWalletConnectors({
      // TODO: replace it with your app metadata.
      metadata: {
        name: "IDX",
        icon: "",
        // icon:
        //   typeof window !== "undefined"
        //     ? `${window.location.origin}/favicon.ico`
        //     : "",
        description: "A simple way of creating/buting crypto indexes.",
        url: typeof window !== "undefined" ? window.location.origin : "",
      },
      walletConnectProjectId: walletConnectProjectId,
    }),
    // evm end
  ],
  plugins: [
    // embedded wallet start
    wallet({
      visible: true,
      entryPosition: EntryPosition.BR,
    }),
    // embedded wallet end
  ],
  chains: supportChains as unknown as readonly [Chain, ...Chain[]],
});

// Wrap your application with this component.
export const ParticleConnectkit = ({ children }: React.PropsWithChildren) => {
  return <ConnectKitProvider config={config}>{children}</ConnectKitProvider>;
};
