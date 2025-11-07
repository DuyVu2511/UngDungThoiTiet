import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
// <<< F6: Import Location >>>
import * as Location from "expo-location";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [theme, setTheme] = useState("light");

  // <<< F6: State lưu trạng thái quyền vị trí >>>
  const [locationPermissionStatus, setLocationPermissionStatus] =
    useState(null);

  // --- Theme Functions ---
  const updateTheme = async (newTheme) => {
    try {
      setTheme(newTheme);
      await api.put(`/api/preferences/${userId}`, { theme: newTheme });
    } catch (e) {
      console.error("Lỗi cập nhật theme:", e);
      setTheme(newTheme === "light" ? "dark" : "light");
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
      setFavorites(favorites.filter((fav) => fav.city_name !== cityName));
    } catch (e) {
      console.error("Lỗi xóa favorite:", e);
      throw e;
    }
  };

  // --- Auth Functions ---
  const login = async (username, password) => {
    try {
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
    setTheme("light");
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("userId");
    setIsLoading(false);
  };

  // <<< F6: Hàm hỏi quyền vị trí >>>
  const requestLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermissionStatus(status); // Cập nhật state toàn cục
    return status;
  };

  // <<< F6: Sửa hàm checkLogin >>>
  const checkLogin = async () => {
    try {
      // Hỏi quyền vị trí ngay khi kiểm tra đăng nhập
      await requestLocationPermission();

      const token = await AsyncStorage.getItem("userToken");
      const id = await AsyncStorage.getItem("userId");

      if (token && id) {
        setUserToken(token);
        setUserId(id);
        const prefResponse = await api.get(`/api/preferences/${id}`);
        if (prefResponse.data && prefResponse.data.theme) {
          setTheme(prefResponse.data.theme);
        }
        await fetchFavorites(id);
      }
    } catch (e) {
      console.error("Lỗi checkLogin:", e);
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
        userToken,
        userId,
        isLoading,
        favorites,
        addFavorite,
        removeFavorite,
        theme,
        updateTheme,
        // <<< F6: Cung cấp state quyền vị trí >>>
        locationPermissionStatus,
        requestLocationPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
