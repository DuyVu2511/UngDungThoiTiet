import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
import * as Location from "expo-location"; // F6: Import Location

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [theme, setTheme] = useState("light");

  // F6: State lưu trạng thái quyền vị trí
  const [locationPermissionStatus, setLocationPermissionStatus] =
    useState(null);

  // --- Theme Functions ---
  const updateTheme = async (newTheme) => {
    try {
      setTheme(newTheme); // Cập nhật UI ngay
      // Chỉ lưu vào CSDL nếu đã đăng nhập
      if (userId) {
        await api.put(`/api/preferences/${userId}`, { theme: newTheme });
      }
    } catch (e) {
      console.error("Lỗi cập nhật theme:", e);
      setTheme(newTheme === "light" ? "dark" : "light"); // Hoàn tác
    }
  };

  // --- Favorites Functions ---
  const fetchFavorites = async (id) => {
    try {
      const response = await api.get(`/api/favorites/${id}`);
      setFavorites(response.data || []);
    } catch (e) {
      console.error("Lỗi tải favorites:", e);
    }
  };
  const addFavorite = async (cityName) => {
    try {
      await api.post("/api/favorites", { userId: userId, cityName: cityName });
      // Cập nhật state toàn cục ngay lập tức
      setFavorites([...favorites, { city_name: cityName, id: Date.now() }]);
    } catch (e) {
      console.error("Lỗi thêm favorite:", e);
      throw e;
    }
  };
  const removeFavorite = async (cityName) => {
    try {
      await api.delete("/api/favorites", {
        data: { userId: userId, cityName: cityName },
      });
      // Cập nhật state toàn cục ngay lập tức
      setFavorites(favorites.filter((fav) => fav.city_name !== cityName));
    } catch (e) {
      console.error("Lỗi xóa favorite:", e);
      throw e;
    }
  };

  // --- Auth Functions ---
  const login = async (username, password) => {
    try {
      // Gọi API /api/login (đã sửa)
      const response = await api.post("/api/login", { username, password });
      const { token, userId, preferences } = response.data;
      setUserToken(token);
      setUserId(userId);
      await AsyncStorage.setItem("userToken", token);
      await AsyncStorage.setItem("userId", String(userId));
      if (preferences && preferences.theme) {
        setTheme(preferences.theme);
      }
      await fetchFavorites(userId);
      return response.data;
    } catch (e) {
      console.error("Lỗi đăng nhập:", e.response?.data || e.message);
      throw new Error(e.response?.data?.error || "Lỗi đăng nhập");
    }
  };
  const register = async (username, password) => {
    try {
      // Gọi API /api/register (đã sửa)
      const response = await api.post("/api/register", { username, password });
      return response.data;
    } catch (e) {
      console.error("Lỗi đăng ký:", e.response?.data || e.message);
      throw new Error(e.response?.data?.error || "Lỗi đăng ký");
    }
  };
  const logout = async () => {
    setIsLoading(true);
    setUserToken(null);
    setUserId(null);
    setFavorites([]);
    setTheme("light"); // Reset theme
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("userId");
    setIsLoading(false);
  };

  // F6: Hàm hỏi quyền vị trí
  const requestLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermissionStatus(status);
    return status;
  };

  // SỬA: Hàm checkLogin (Luôn chạy, kể cả khi là Khách)
  const checkLogin = async () => {
    try {
      // 1. Hỏi quyền GPS (cho cả Khách và User)
      await requestLocationPermission();

      // 2. Kiểm tra xem có token cũ không
      const token = await AsyncStorage.getItem("userToken");
      const id = await AsyncStorage.getItem("userId");

      if (token && id) {
        // Nếu có -> là User -> Tải dữ liệu
        setUserToken(token);
        setUserId(id);
        const prefResponse = await api.get(`/api/preferences/${id}`);
        if (prefResponse.data && prefResponse.data.theme) {
          setTheme(prefResponse.data.theme);
        }
        await fetchFavorites(id);
      }
      // 3. Nếu không có token -> là Khách -> không làm gì cả
      // (userToken vẫn là null)
    } catch (e) {
      console.error("Lỗi checkLogin:", e);
      // Nếu lỗi (vd: token hết hạn), xóa token cũ
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkLogin();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        register,
        userToken, // Sẽ là 'null' nếu là Khách
        userId, // Sẽ là 'null' nếu là Khách
        isLoading,
        favorites,
        addFavorite,
        removeFavorite,
        theme,
        updateTheme,
        locationPermissionStatus,
        requestLocationPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
