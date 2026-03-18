import React from "react";
// 1. Import the SafeAreaProvider
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/authContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
    return (
        // 2. Wrap your entire application with the provider
        <SafeAreaProvider>
            <AuthProvider>
                <AppNavigator />
            </AuthProvider>
        </SafeAreaProvider>
    );
}