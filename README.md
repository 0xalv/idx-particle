# IDX - Seamless Cross-Chain Index Creation Platform

IDX is a cutting-edge platform for creating and managing crypto indexes across different blockchains, leveraging advanced chain abstraction technologies for a seamless user experience.

## 💫 Protocol Overview

IDX builds on Set Protocol to enable anyone to create and manage their own crypto indexes:

- **Create**: Design your index by selecting tokens and their allocations
- **Manage**: Set streaming fees (up to 10%) that accrue to you as the manager
- **Trade**: Users can mint (issue) or redeem index tokens at their underlying value
- **Earn**: Index managers earn streaming fees from all holders

## 🌟 Key Features

- **User-Friendly Index Creation**: Create custom crypto indexes with multiple tokens in just a few clicks
- **Cross-Chain Capabilities**: Seamlessly interact with indexes across Base Sepolia and Arbitrum Sepolia
- **Automated Gas Management**: Smart cross-chain gas bridging from Arbitrum to Base
- **Social Login & Web3 Wallets**: Simplified onboarding through Particle Connect
- **Streaming Fees**: Built-in revenue model for index managers
- **Batch Operations**: One-click token approvals and issuance

## 🔧 Technical Stack

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Smart Account Infrastructure**: Klaster SDK for chain abstraction
- **Wallet Management**: Particle Connect for seamless authentication
- **Token Standards**: ERC20-compatible with SetToken protocol
- **Networks**: Base Sepolia & Arbitrum Sepolia testnets

## 🚀 Under The Hood

IDX combines Particle Connect's authentication with Klaster's smart account capabilities to provide:

- Cross-chain bridging via Across Protocol
- Batch transaction processing
- Smart contract interactions without network switching

## 💡 Innovation Highlights

- **Chain-Abstracted UX**: Users interact with multiple chains without knowing the underlying complexity
- **Smart Gas Management**: Automated USDC bridging for gas fees
- **Unified Interface**: Single dashboard for multi-chain index management
- **Social Login**: Web2-like authentication experience for Web3 functionality

## 🛠️ Development Notes

Built with:

- Particle Connect for authentication and wallet management
- Klaster SDK for cross-chain operations
- SetToken protocol for index functionality
- Across Protocol for token bridging

## Contracts Repository:

- Contracts: https://github.com/uri011/particle-hackathon-contracts

## Server Repository

Here is the docker image of the server: https://hub.docker.com/repository/docker/uri011/server-particle/general

- Server: https://github.com/uri011/particle-hackathon-server
