import React, { useContext } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/LoginScreen";
import AdminDashboard from "../screens/AdminDashboard";
import SorterDashboard from "../screens/SorterDashboard";
import RecyclerDashboard from "../screens/RecyclerDashboard";

import { AuthContext } from "../authContext";

const Stack = createNativeStackNavigator();

// A simple loading screen component
function LoadingScreen() {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text>Loading...</Text>
        </View>
    );
}

export default function AppNavigator() {
    const { user, role, isLoading } = useContext(AuthContext);

    // 1. Show a loading screen while checking auth and fetching role
    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {/* 2. Check for user object to determine navigation stack */}
                {!user ? (
                    // User not logged in, show login screen
                    <Stack.Screen name="Login" component={LoginScreen} />
                ) : (
                    // User is logged in, determine screen based on role
                    <>
                        {role === "admin" ? (
                            <Stack.Screen name="Admin" component={AdminDashboard} />
                        ) : role === "sorter" ? (
                            <Stack.Screen name="Sorter" component={SorterDashboard} />
                        ) : role === "recycler" ? (
                            <Stack.Screen name="Recycler" component={RecyclerDashboard} />
                        ) : (
                            // Fallback screen if role is not found or invalid
                            // This prevents a crash and can show an error or redirect to login
                            <Stack.Screen name="Login" component={LoginScreen} />
                        )}
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
