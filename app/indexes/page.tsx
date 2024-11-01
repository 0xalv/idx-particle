// src/components/Indexes.tsx
"use client";

import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "@particle-network/connectkit";
import { Abi, Address } from "viem";
import { Controller } from "@/abis"; // Import your Controller ABI

interface IndexesProps {
  status: string | undefined;
}

const Indexes: React.FC<IndexesProps> = ({ status }) => {
  const controllerAddress = process.env.NEXT_PUBLIC_CONTROLLER as Address;
  if(!controllerAddress) {
    throw new Error("Missing contract address");
  }
  const publicClient = usePublicClient();
  const { address, isConnected } = useAccount();

  const [sets, setSets] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSets = async () => {
      if (!publicClient || !controllerAddress) return;
      setLoading(true);

      try {
        const result = await publicClient.readContract({
          address: controllerAddress,
          abi: Controller as Abi, // Adjust the ABI import if necessary
          functionName: "getSets",
        });
        setSets(result as Address[]); // Assume result is an array of addresses
      } catch (err) {
        setError("Error fetching sets");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isConnected) {
      fetchSets();
    }
  }, [isConnected, publicClient, controllerAddress]);

  return (
    <>
      <div className="p-4">
        <p>{isConnected}</p>
        {!isConnected ? (
          <div className="text-center text-red-500">You are not logged in</div>
        ) : loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <p>Indexes Deployed:</p>
            {sets.map((set, index) => (
              <div key={index} className="p-4 bg-gray-100 rounded shadow">
                <p className="font-bold">Set Address:</p>
                <p className="text-blue-500">{set}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Indexes;
