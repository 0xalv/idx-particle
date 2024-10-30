"use client";

import demoImage from "@/assets/demo.gif";
import Header from "@/components/header";
import { useAccount } from "@particle-network/connectkit";
import { isEVMChain } from "@particle-network/connectkit/chains";
import Image from "next/image";

export default function Index() {
  const { isConnected, chain } = useAccount();

  return (
    <>
      <Header />
      <main>
        {isConnected && chain && isEVMChain(chain) ? (
          <p>I am connected!</p>
        ) : (
          <Image
            sizes="100%"
            src={demoImage}
            style={{ width: "100%" }}
            alt="demo"
          />
        )}
      </main>
    </>
  );
}
