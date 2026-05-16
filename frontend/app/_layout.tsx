import React, { useCallback } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Stack, SplashScreen } from "expo-router";
import {
  useFonts,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_400Regular,
} from "@expo-google-fonts/playfair-display";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
} from "@expo-google-fonts/manrope";
import { DMSerifDisplay_400Regular } from "@expo-google-fonts/dm-serif-display";
import { DancingScript_700Bold } from "@expo-google-fonts/dancing-script";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_400Regular,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    DMSerifDisplay_400Regular,
    DancingScript_700Bold,
  });

  const onReady = useCallback(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) {
    return (
      <View style={styles.loader} testID="font-loader">
        <ActivityIndicator size="large" color="#E26D5A" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} onLayout={onReady} testID="root-layout">
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#FAF9F6" },
          headerTitleStyle: {
            fontFamily: "PlayfairDisplay_700Bold",
            fontSize: 20,
            color: "#1A1A1A",
          },
          headerTintColor: "#1A1A1A",
          contentStyle: { backgroundColor: "#FAF9F6" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="editor" options={{ title: "Edit Invite" }} />
        <Stack.Screen name="my-invites" options={{ title: "My Invites" }} />
        <Stack.Screen
          name="preview/[id]"
          options={{ title: "Preview", presentation: "modal" }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: "#FAF9F6",
    alignItems: "center",
    justifyContent: "center",
  },
});
