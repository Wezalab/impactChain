import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";

void SplashScreen.preventAutoHideAsync();

const BG = "#0A1628";
const TEXT = "#F1F5F9";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 2 } },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isReady } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    const onLogin = segments[0] === "login";
    if (!isAuthenticated && !onLogin) {
      console.log("[AuthGate] Not authenticated, redirecting to login");
      router.replace("/login");
    } else if (isAuthenticated && onLogin) {
      console.log("[AuthGate] Authenticated, redirecting to tabs");
      router.replace("/(tabs)");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isReady, segments]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <AuthGate>
      <Stack
        screenOptions={{
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: BG },
          headerTintColor: TEXT,
          headerTitleStyle: { fontWeight: "700" as const, fontSize: 17 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: BG },
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false, animation: "fade" }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="project/[id]" options={{ title: "Project Details", presentation: "card" }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", headerShown: false }} />
      </Stack>
    </AuthGate>
  );
}

export default function RootLayout() {
  useEffect(() => {
    console.log("[ImpactChain] App initialized");
    void SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: BG }}>
        <StatusBar style="light" />
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
