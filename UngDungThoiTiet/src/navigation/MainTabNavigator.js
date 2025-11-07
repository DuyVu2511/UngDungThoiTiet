import React, { useContext } from "react"; // <<< THÊM useContext
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext"; // <<< IMPORT AuthContext

// Import các màn hình của bạn
import WeatherScreen from "../screens/WeatherScreen";
import FavoritesScreen from "../screens/FavoritesScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  // === THAY ĐỔI 1: Lấy 'theme' từ Context ===
  const { theme } = useContext(AuthContext);
  const isDarkMode = theme === "dark";

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        // === THAY ĐỔI 2: Đặt màu dựa trên isDarkMode ===
        tabBarActiveTintColor: isDarkMode ? "#FFFFFF" : "#007AFF", // Màu icon (chọn)
        tabBarInactiveTintColor: isDarkMode ? "#888888" : "gray", // Màu icon (không chọn)
        tabBarStyle: {
          backgroundColor: isDarkMode ? "#1e1e1e" : "#FFFFFF", // Màu nền thanh tab
          borderTopColor: isDarkMode ? "#444" : "#E0E0E0", // Màu viền trên
        },
        // === HẾT THAY ĐỔI 2 ===

        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Weather") {
            iconName = focused ? "cloud" : "cloud-outline";
          } else if (route.name === "Favorites") {
            iconName = focused ? "star" : "star-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {/* (Phần này giữ nguyên) */}
      <Tab.Screen
        name="Weather"
        component={WeatherScreen}
        options={{ title: "Thời tiết" }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: "Yêu thích" }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Cài đặt" }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
