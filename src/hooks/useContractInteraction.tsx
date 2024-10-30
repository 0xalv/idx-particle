// src/hooks/useContractInteraction.ts

import { useState, useMemo, useEffect } from "react";
import {
  useAccount,
  usePublicClient,
  useWallets,
} from "@particle-network/connectkit";
import {
  parseAbiToMethodList,
  convertToString,
  ABI_TYPE,
  MethodItem,
} from "@/util";
import { Abi, Address } from "viem";

interface UseContractInteractionProps {
  abiValue: string;
  contractAddress: Address;
}

export function useContractInteraction({
  abiValue,
  contractAddress,
}: UseContractInteractionProps) {
  const { chain, address } = useAccount();
  const [primaryWallet] = useWallets();
  const publicClient = usePublicClient();

  const [readResult, setReadResult] = useState<string>("");
  const [btnLoading, setBtnLoading] = useState(false);
  const [params, setParams] = useState<Record<string, string>>({});
  const [selectMethod, setSelectMethod] = useState("");

  const methodList = useMemo(() => parseAbiToMethodList(abiValue), [abiValue]);

  const selectedMethodData = useMemo(
    () => methodList.find((item) => item.name === selectMethod),
    [methodList, selectMethod]
  ) as MethodItem | undefined;

  const functionParams = useMemo(() => {
    return selectedMethodData?.inputs.map((input) => {
      return input.type === "uint256" && params[input.name]
        ? BigInt(params[input.name])
        : params[input.name];
    });
  }, [selectedMethodData, params]);

  useEffect(() => {
    setReadResult("");
    setParams({});
  }, [selectMethod]);

  const handleReadContract = async () => {
    if (!publicClient || !contractAddress || !selectedMethodData) return;

    try {
      setBtnLoading(true);
      const result = await publicClient.readContract({
        address: contractAddress,
        abi: JSON.parse(abiValue) as Abi,
        functionName: selectedMethodData.abi?.name! as string,
        args: functionParams || [],
      });
      setReadResult(convertToString(result));
    } catch (error: any) {
      console.error(error);
      setReadResult(`Error: ${error.message}`);
    } finally {
      setBtnLoading(false);
    }
  };

  const handleWriteContract = async () => {
    if (!primaryWallet || !contractAddress || !selectedMethodData) return;

    try {
      setBtnLoading(true);
      const walletClient = primaryWallet.getWalletClient();
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: JSON.parse(abiValue) as Abi,
        functionName: selectedMethodData.abi?.name! as string,
        args: functionParams,
        chain,
        account: address as Address,
      });
      setReadResult(`Transaction Hash: ${hash}`);
    } catch (error: any) {
      console.error(error);
      setReadResult(`Error: ${error.message}`);
    } finally {
      setBtnLoading(false);
    }
  };

  return {
    methodList,
    readResult,
    btnLoading,
    setParams,
    setSelectMethod,
    handleReadContract,
    handleWriteContract,
  };
}
