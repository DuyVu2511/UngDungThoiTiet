import React, { useContext } from "react";
import { View, Text, Button, StyleSheet, Switch, Alert } from "react-native";
import { AuthContext } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

// Component "Yêu cầu Đăng nhập"
const RequireLogin = () => {
  const navigation = useNavigation();
  const { theme } = useContext(AuthContext);
  const isDarkMode = theme === "dark";

  return (
    <View style={styles.emptyContainer}>
      <Text
        style={[
          styles.emptyText,
          isDarkMode ? styles.textDark : styles.textLight,
        ]}
      >
        Bạn cần đăng nhập để xem Cài đặt.
      </Text>
      <Button
        title="Đăng nhập ngay"
        onPress={() => navigation.navigate("Login")} // Mở modal Đăng nhập
      />
    </View>
  );
};

const SettingsScreen = () => {
  // Lấy thêm 'userToken'
  const { logout, theme, updateTheme, userToken } = useContext(AuthContext);
  const isDarkMode = theme === "dark";

  const handleThemeChange = (isDark) => {
    const newTheme = isDark ? "dark" : "light";
    updateTheme(newTheme);
  };

  return (
    <LinearGradient
      colors={isDarkMode ? ["#232526", "#414345"] : ["#E0EAFC", "#CFDEF3"]}
      style={styles.linearGradient}
    >
      <SafeAreaView style={styles.safeAreaContent} edges={["top"]}>
        {/* Kiểm tra userToken ở đây */}
        {!userToken ? (
          <RequireLogin /> // Hiển thị "Yêu cầu Đăng nhập"
        ) : (
          // Nếu đã đăng nhập, hiển thị cài đặt
          <>
            <Text style={[styles.title, isDarkMode && styles.textDark]}>
              Cài Đặt
            </Text>
            <View
              style={[styles.settingRow, isDarkMode && styles.settingRowDark]}
            >
              <Text style={[styles.settingText, isDarkMode && styles.textDark]}>
                Giao diện tối
              </Text>
              <Switch
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={isDarkMode ? "#f5dd4b" : "#f4f3f4"}
                onValueChange={handleThemeChange}
                value={isDarkMode}
              />
            </View>
            <View style={styles.logoutButton}>
              <Button title="Đăng xuất" onPress={logout} color="red" />
            </View>
          </>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

// StyleSheet (thêm 'emptyContainer' và 'textLight')
const styles = StyleSheet.create({
  linearGradient: { flex: 1 },
  safeAreaContent: { flex: 1, padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#000",
  },
  textDark: { color: "#fff" },
  textLight: { color: "#000" }, // Màu chữ cho nền sáng
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    padding: 15,
    borderRadius: 8,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderWidth: 1,
  },
  settingRowDark: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  settingText: { fontSize: 18, color: "#000" },
  logoutButton: { marginTop: 50 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    color: "#333",
    marginBottom: 20,
  },
});

export default SettingsScreen;
