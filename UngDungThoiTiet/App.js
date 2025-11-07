import React from "react";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { StatusBar } from "expo-status-bar";

export default function App() {
  return (
    // Bọc toàn bộ ứng dụng bằng AuthProvider
    // để bất kỳ màn hình nào cũng truy cập được state đăng nhập
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
