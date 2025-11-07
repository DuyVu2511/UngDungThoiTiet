import React, { useContext } from "react";
import { View, Text, Button, StyleSheet, Switch, Alert } from "react-native";
import { AuthContext } from "../context/AuthContext";
// Import LinearGradient và SafeAreaView
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const SettingsScreen = () => {
  const { logout, theme, updateTheme } = useContext(AuthContext);
  const isDarkMode = theme === "dark";

  const handleThemeChange = (isDark) => {
    const newTheme = isDark ? "dark" : "light";
    updateTheme(newTheme);
  };

  return (
    <LinearGradient
      // Gradient Xám Bạc (sáng) hoặc Xám Than (tối)
      colors={isDarkMode ? ["#232526", "#414345"] : ["#E0EAFC", "#CFDEF3"]}
      style={styles.linearGradient}
    >
      <SafeAreaView style={styles.safeAreaContent} edges={["top"]}>
        <Text style={[styles.title, isDarkMode && styles.textDark]}>
          Cài Đặt
        </Text>

        <View style={[styles.settingRow, isDarkMode && styles.settingRowDark]}>
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
      </SafeAreaView>
    </LinearGradient>
  );
};

// StyleSheet đã sửa (nền trong suốt)
const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
  },
  safeAreaContent: {
    flex: 1,
    backgroundColor: "transparent",
    padding: 20, // Di chuyển padding vào đây
  },
  // Xóa style 'container' và 'containerDark' cũ
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#000", // Chữ đen (cho nền xám sáng)
  },
  textDark: {
    color: "#fff", // Chữ trắng (cho nền xám tối)
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.4)", // Nền trắng mờ
    padding: 15,
    borderRadius: 8,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderWidth: 1,
  },
  settingRowDark: {
    backgroundColor: "rgba(0, 0, 0, 0.2)", // Nền đen mờ
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  settingText: {
    fontSize: 18,
    color: "#000", // Chữ đen
  },
  logoutButton: {
    marginTop: 50,
  },
});

export default SettingsScreen;
