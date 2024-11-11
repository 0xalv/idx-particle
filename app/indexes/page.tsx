"use client";

import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "@particle-network/connectkit";
import { Abi, Address } from "viem";
import { Controller, SetToken } from "@/abis";
import Link from "next/link";

const Indexes = () => {
  const controllerAddress = process.env.NEXT_PUBLIC_CONTROLLER as Address;
  if (!controllerAddress) throw new Error("Missing contract address");

  const publicClient = usePublicClient();
  const { address, isConnected } = useAccount();

  const [managedSets, setManagedSets] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSets = async () => {
      if (!publicClient || !controllerAddress || !address) return;
      setLoading(true);

      try {
        const result = await publicClient.readContract({
          address: controllerAddress,
          abi: Controller as Abi,
          functionName: "getSets",
        });
        const allSets = result as Address[];

        const managerCheckPromises = allSets.map(async (setAddress) => {
          try {
            const manager = await publicClient.readContract({
              address: setAddress,
              abi: SetToken as Abi,
              functionName: "manager",
            });
            return manager === address ? setAddress : null;
          } catch (err) {
            console.error(`Error fetching manager for set ${setAddress}`, err);
            return null;
          }
        });

        const setsManagedByUser = (
          await Promise.all(managerCheckPromises)
        ).filter((set) => set !== null) as Address[];

        setManagedSets(setsManagedByUser);
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
  }, [isConnected, publicClient, controllerAddress, address]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Deployed Indexes
            </h1>
            <p className="mt-2 text-gray-600">
              Manage and monitor your deployed index tokens
            </p>
          </div>
          <Link
            href="/factory"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Create New Index
          </Link>
        </div>

        {/* Connection Status */}
        <div className="mb-6">
          {!isConnected ? (
            <div className="rounded-lg bg-yellow-50 p-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.873-1.562 3.157-1.562 4.03 0l6.28 11.225c.87 1.556-.237 3.472-2.015 3.472H4.22c-1.778 0-2.885-1.916-2.015-3.472l6.28-11.225zM10 5a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
                  />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Connection Required
                  </h3>
                  <p className="mt-2 text-sm text-yellow-700">
                    Please connect your wallet to view deployed indexes.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-green-50 p-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.707-9.293a1 1 0 0 0-1.414-1.414L9 10.586 7.707 9.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4z"
                  />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Connected Successfully
                  </h3>
                  <p className="mt-2 text-sm text-green-700 font-mono">
                    {address}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4">
            <div className="flex">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM8.707 7.293a1 1 0 0 0-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 1 0 1.414 1.414L10 11.414l1.293 1.293a1 1 0 0 0 1.414-1.414L11.414 10l1.293-1.293a1 1 0 0 0-1.414-1.414L10 8.586 8.707 7.293z"
                />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error Loading Indexes
                </h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Indexes Grid */}
        {isConnected && !loading && !error && managedSets.length > 0 && (
          <div className="space-y-4">
            {managedSets.map((set, index) => (
              <Link href={`/indexes/${set}`} key={set} className="block group">
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="bg-blue-50 rounded-full px-3 py-1 shrink-0">
                        <span className="text-sm font-medium text-blue-700">
                          Managed Index #{index + 1}
                        </span>
                      </div>
                      <div className="font-mono text-sm text-gray-600 truncate">
                        {set}
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
                      <span className="mr-2">View Details</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M9 5l7 7-7 7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {isConnected && !loading && !error && managedSets.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No indexes found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new index.
            </p>
            <div className="mt-6">
              <Link
                href="/factory"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create New Index
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Indexes;
