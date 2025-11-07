import React, { useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Button,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

// <<< THÊM: Component "Yêu cầu Đăng nhập" >>>
const RequireLogin = () => {
  const navigation = useNavigation();
  const { theme } = useContext(AuthContext);
  const isDarkMode = theme === "dark";

  return (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, isDarkMode && styles.textDark]}>
        Bạn cần đăng nhập để xem danh sách yêu thích.
      </Text>
      <Button
        title="Đăng nhập ngay"
        onPress={() => navigation.navigate("Login")} // Mở modal Đăng nhập
      />
    </View>
  );
};

const FavoritesScreen = () => {
  // <<< SỬA: Lấy thêm 'userToken' >>>
  const { favorites, theme, userToken } = useContext(AuthContext);
  const isDarkMode = theme === "dark";
  const navigation = useNavigation();

  const handlePressCity = (cityName) => {
    navigation.navigate("Weather", { city: cityName });
  };

  // <<< SỬA: Bọc toàn bộ return trong <SafeAreaView> >>>
  return (
    <LinearGradient
      colors={isDarkMode ? ["#0F2027", "#203A43"] : ["#a8e063", "#56ab2f"]}
      style={styles.linearGradient}
    >
      <SafeAreaView style={styles.safeAreaContent} edges={["top"]}>
        {/* <<< SỬA: Kiểm tra userToken ở đây >>> */}
        {!userToken ? (
          <RequireLogin /> // Hiển thị "Yêu cầu Đăng nhập"
        ) : (
          // Nếu đã đăng nhập, hiển thị danh sách
          <>
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
                    <Text
                      style={[styles.itemText, isDarkMode && styles.textDark]}
                    >
                      {item.city_name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

// (StyleSheet giữ nguyên, chỉ thêm 'emptyContainer')
const styles = StyleSheet.create({
  linearGradient: { flex: 1 },
  safeAreaContent: { flex: 1, padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#FFFFFF",
  },
  textDark: { color: "#FFFFFF" },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    color: "#EEEEEE",
    marginTop: 20,
  },
  itemContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  itemContainerDark: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  itemText: { fontSize: 18, color: "#FFFFFF" },
  // <<< THÊM: Style cho "Yêu cầu Đăng nhập" >>>
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default FavoritesScreen;
