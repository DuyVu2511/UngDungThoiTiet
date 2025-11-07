import React, { useContext } from "react";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthContext } from "../context/AuthContext";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import MainTabNavigator from "./MainTabNavigator"; // Đây là app chính (3 tab)
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  // <<< XÓA: Không cần userToken ở đây nữa
  const { isLoading, theme } = useContext(AuthContext);

  // Tùy chỉnh theme cho navigation (Giữ nguyên)
  const isDarkMode = theme === "dark";
  const navigationTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      background: isDarkMode ? "#121212" : "#F0F4F8",
    },
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // <<< SỬA: Thay đổi toàn bộ logic Stack.Navigator >>>
  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      <Stack.Navigator>
        {/* Nhóm 1: Ứng dụng chính (Luôn hiển thị) */}
        <Stack.Screen
          name="MainApp"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />

        {/* Nhóm 2: Các màn hình "Modal" (Hiện đè lên trên) */}
        <Stack.Group screenOptions={{ presentation: "modal" }}>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            // Tắt header của modal (vì chúng ta sẽ tự tạo nút Đóng)
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: "Đăng ký" }} // Giữ header (để có nút Quay lại)
          />
        </Stack.Group>
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
