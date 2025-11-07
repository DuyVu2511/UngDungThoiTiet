import React, { useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
// Import LinearGradient và SafeAreaView
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const FavoritesScreen = () => {
  const { favorites, theme } = useContext(AuthContext);
  const isDarkMode = theme === "dark";
  const navigation = useNavigation();

  const handlePressCity = (cityName) => {
    // Chuyển sang tab 'Weather' và gửi kèm tham số (param) 'city'
    navigation.navigate("Weather", { city: cityName });
  };

  return (
    <LinearGradient
      // Gradient Xanh Lá (sáng) hoặc Xanh Rêu Đậm (tối)
      colors={isDarkMode ? ["#0F2027", "#203A43"] : ["#a8e063", "#56ab2f"]}
      style={styles.linearGradient}
    >
      <SafeAreaView style={styles.safeAreaContent} edges={["top"]}>
        <Text style={[styles.title, isDarkMode && styles.textDark]}>
          Thành phố đã lưu
        </Text>

        {favorites.length === 0 ? (
          <Text style={[styles.emptyText, isDarkMode && styles.textDark]}>
            Bạn chưa lưu thành phố nào.
          </Text>
        ) : (
          <FlatList
            data={favorites}
            keyExtractor={(item) => item.id?.toString() || item.city_name}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.itemContainer,
                  isDarkMode && styles.itemContainerDark,
                ]}
                onPress={() => handlePressCity(item.city_name)}
              >
                <Text style={[styles.itemText, isDarkMode && styles.textDark]}>
                  {item.city_name}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
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
    marginBottom: 20,
    textAlign: "center",
    color: "#FFFFFF", // Chữ trắng (đẹp trên nền xanh)
  },
  textDark: {
    color: "#FFFFFF", // Giữ nguyên chữ trắng
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    color: "#EEEEEE", // Chữ trắng nhạt
    marginTop: 20,
  },
  itemContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)", // Nền trắng mờ
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)", // Viền trắng mờ
  },
  itemContainerDark: {
    backgroundColor: "rgba(0, 0, 0, 0.2)", // Nền đen mờ
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  itemText: {
    fontSize: 18,
    color: "#FFFFFF", // Chữ trắng
  },
});

export default FavoritesScreen;
