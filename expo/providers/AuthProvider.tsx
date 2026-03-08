import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo } from "react";

export interface WalletInfo {
  address: string;
  walletType: "metamask" | "argent" | "braavos" | "coinbase" | "walletconnect" | "phantom";
  network: "ethereum" | "starknet" | "polygon" | "celo";
  displayName: string;
}

const STORAGE_KEY = "impactchain_wallet";

function generateAddress(network: string): string {
  const chars = "0123456789abcdef";
  let addr = "0x";
  const len = network === "starknet" ? 64 : 40;
  for (let i = 0; i < len; i++) {
    addr += chars[Math.floor(Math.random() * chars.length)];
  }
  return addr;
}

export function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);

  const walletQuery = useQuery({
    queryKey: ["wallet-session"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as WalletInfo) : null;
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (walletQuery.data !== undefined) {
      setWallet(walletQuery.data);
      setIsReady(true);
    } else if (!walletQuery.isLoading) {
      setIsReady(true);
    }
  }, [walletQuery.data, walletQuery.isLoading]);

  const connectMutation = useMutation({
    mutationFn: async (params: { walletType: WalletInfo["walletType"]; network: WalletInfo["network"] }) => {
      const names: Record<string, string> = {
        metamask: "MetaMask",
        argent: "Argent",
        braavos: "Braavos",
        coinbase: "Coinbase Wallet",
        walletconnect: "WalletConnect",
        phantom: "Phantom",
      };
      const info: WalletInfo = {
        address: generateAddress(params.network),
        walletType: params.walletType,
        network: params.network,
        displayName: names[params.walletType] ?? params.walletType,
      };
      await new Promise((r) => setTimeout(r, 1500));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(info));
      console.log("[Auth] Wallet connected:", info.displayName, shortenAddress(info.address));
      return info;
    },
    onSuccess: (data) => {
      setWallet(data);
      queryClient.setQueryData(["wallet-session"], data);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log("[Auth] Wallet disconnected");
    },
    onSuccess: () => {
      setWallet(null);
      queryClient.setQueryData(["wallet-session"], null);
    },
  });

  const connect = useCallback(
    (walletType: WalletInfo["walletType"], network: WalletInfo["network"]) => {
      return connectMutation.mutateAsync({ walletType, network });
    },
    [connectMutation]
  );

  const disconnect = useCallback(() => {
    return disconnectMutation.mutateAsync();
  }, [disconnectMutation]);

  return useMemo(() => ({
    wallet,
    isAuthenticated: !!wallet,
    isReady,
    isConnecting: connectMutation.isPending,
    connect,
    disconnect,
    shortenAddress,
  }), [wallet, isReady, connectMutation.isPending, connect, disconnect]);
});
