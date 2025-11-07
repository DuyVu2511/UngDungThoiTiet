import React, { useContext } from "react";
// <<< THÊM 1: Import DefaultTheme và DarkTheme >>>
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthContext } from "../context/AuthContext";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import MainTabNavigator from "./MainTabNavigator";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { userToken, isLoading, theme } = useContext(AuthContext);

  // <<< THÊM 2: Tạo chủ đề (theme) cho navigation >>>
  // Tùy chỉnh theme của React Navigation để khớp với app
  const isDarkMode = theme === "dark";
  const navigationTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme), // Dùng theme gốc
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      // Ghi đè màu nền chính để khớp với màu nền app của bạn
      background: isDarkMode ? "#121212" : "#F0F4F8",
    },
  };
  // === HẾT THÊM 2 ===

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    // <<< THÊM 3: Áp dụng theme vào NavigationContainer >>>
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      <Stack.Navigator>
        {userToken == null ? (
          // Luồng CHƯA đăng nhập
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: "Quay lại Đăng nhập" }}
            />
          </>
        ) : (
          // Luồng ĐÃ đăng nhập
          <Stack.Screen
            name="MainApp"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AppNavigator;
