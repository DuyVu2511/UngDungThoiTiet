import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
} from "react-native";
// Import SafeAreaView từ thư viện đúng
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
// Import Gradient
import { LinearGradient } from "expo-linear-gradient";
// Import Location (F6)
import * as Location from "expo-location";

const WeatherScreen = ({ navigation, route }) => {
  // --- STATE VÀ CONTEXT ---
  // Lấy userToken để kiểm tra Chế độ Khách
  const {
    userId,
    favorites,
    addFavorite,
    removeFavorite,
    theme,
    locationPermissionStatus,
    userToken,
  } = useContext(AuthContext);
  const isDarkMode = theme === "dark";
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const debounceTimer = useRef(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [timeAgo, setTimeAgo] = useState("");
  const [isGpsLocation, setIsGpsLocation] = useState(false); // State theo dõi GPS

  // --- HÀM LOGIC CHÍNH ---

  // Hàm tải thời tiết bằng TỌA ĐỘ (F6)
  const fetchWeatherByCoords = async (lat, lon, isRefresh = false) => {
    if (!isRefresh) setIsRefreshing(true);
    try {
      const response = await api.get(`/api/weather?lat=${lat}&lon=${lon}`);
      setWeatherData(response.data);
      const currentCityName = response.data.current.name;
      const now = Date.now();
      setLastUpdated(now);
      setSearchQuery(currentCityName);
      setIsGpsLocation(true); // Đánh dấu đây là dữ liệu GPS

      await AsyncStorage.setItem("lastCity", currentCityName);
      await AsyncStorage.setItem(
        "lastWeatherData",
        JSON.stringify(response.data)
      );
      await AsyncStorage.setItem("lastUpdatedTimestamp", JSON.stringify(now));
    } catch (e) {
      Alert.alert(
        "Lỗi GPS",
        "Không thể lấy dữ liệu thời tiết tại vị trí hiện tại."
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // Hàm tải thời tiết bằng TÊN (F1)
  const fetchWeather = async (city, isRefresh = false) => {
    if (!city) return;
    if (!isRefresh) setIsRefreshing(true);
    try {
      const response = await api.get(`/api/weather?city=${city}`);
      setWeatherData(response.data);
      const currentCityName = response.data.current.name;
      const now = Date.now();
      setLastUpdated(now);
      // Chỉ lưu lịch sử nếu đã đăng nhập
      if (userId) {
        api.post("/api/history", { userId: userId, cityName: currentCityName });
      }
      setIsGpsLocation(false); // Đánh dấu đây là dữ liệu TÌM KIẾM

      await AsyncStorage.setItem("lastCity", currentCityName);
      await AsyncStorage.setItem(
        "lastWeatherData",
        JSON.stringify(response.data)
      );
      await AsyncStorage.setItem("lastUpdatedTimestamp", JSON.stringify(now));
      setSearchQuery(currentCityName);
    } catch (e) {
      Alert.alert("Lỗi", "Không tìm thấy thành phố.");
    } finally {
      if (!isRefresh) setIsRefreshing(false);
    }
  };

  // Hàm gọi API đề xuất (F11)
  const fetchSuggestions = async (text) => {
    try {
      const response = await api.get(`/api/suggest?q=${text}`);
      setSuggestions(response.data);
    } catch (e) {
      console.error("Lỗi fetchSuggestions", e);
      setSuggestions([]);
    }
  };

  // --- HÀM XỬ LÝ UI ---

  // Xử lý gõ (Debounce)
  const onSearchTextChange = (text) => {
    setSearchQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 200);
  };

  // Xử lý nhấn đề xuất
  const onSuggestionPress = (city) => {
    setSearchQuery(city.name);
    setSuggestions([]);
    fetchWeather(city.name, false);
  };

  // Xử lý nhấn Tìm kiếm
  const handleSearch = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setSuggestions([]);
    fetchWeather(searchQuery, false);
  };

  // Xử lý Refresh thủ công
  const handleManualRefresh = () => {
    if (weatherData && weatherData.current) {
      fetchWeather(weatherData.current.name, false);
    }
  };

  // Xử lý Toggle Yêu thích (Kiểm tra Chế độ Khách)
  const handleToggleFavorite = async () => {
    // 1. KIỂM TRA KHÁCH (nếu userToken là null)
    if (!userToken) {
      Alert.alert(
        "Cần đăng nhập",
        "Bạn phải đăng nhập để sử dụng chức năng này.",
        [
          { text: "Để sau" },
          { text: "Đăng nhập", onPress: () => navigation.navigate("Login") }, // Mở modal Đăng nhập
        ]
      );
      return; // Dừng hàm
    }

    // 2. Logic cũ (nếu đã đăng nhập)
    if (!weatherData) return;
    const cityName = weatherData.current.name;
    try {
      if (isFavorite) {
        await removeFavorite(cityName);
        Alert.alert("Đã xóa", `Đã xóa "${cityName}" khỏi danh sách yêu thích.`);
      } else {
        await addFavorite(cityName);
        Alert.alert("Đã lưu", `Đã lưu "${cityName}" vào danh sách yêu thích.`);
      }
    } catch (e) {
      if (e.response && e.response.status === 409)
        Alert.alert("Thông báo", "Bạn đã lưu thành phố này rồi.");
      else Alert.alert("Lỗi", "Thao tác thất bại, vui lòng thử lại.");
    }
  };

  // F5/F6: Hàm onRefresh cho Pull-to-Refresh (Ưu tiên GPS)
  const onRefresh = React.useCallback(() => {
    if (locationPermissionStatus === "granted") {
      Location.getCurrentPositionAsync({})
        .then((location) =>
          fetchWeatherByCoords(
            location.coords.latitude,
            location.coords.longitude,
            false
          )
        )
        .catch(() => {
          if (weatherData?.current)
            fetchWeather(weatherData.current.name, false);
          else fetchWeather("Hanoi", false);
        });
    } else {
      if (weatherData && weatherData.current) {
        fetchWeather(weatherData.current.name, false);
      } else {
        fetchWeather("Hanoi", false);
      }
    }
  }, [weatherData, locationPermissionStatus]);

  // Hàm lấy icon
  const getWeatherIcon = (iconCode) =>
    `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

  // --- USEMEMO (Dự báo) ---
  const dailyForecast = useMemo(() => {
    if (!weatherData?.forecast?.list) return [];
    return weatherData.forecast.list.filter((item) =>
      item.dt_txt.includes("12:00:00")
    );
  }, [weatherData]);
  const hourlyForecast = useMemo(() => {
    if (!weatherData?.forecast?.list) return [];
    return weatherData.forecast.list.slice(0, 8);
  }, [weatherData]);

  // --- USEEFFECTS ---
  // (F6: Logic khởi động)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const savedData = await AsyncStorage.getItem("lastWeatherData");
        if (savedData) setWeatherData(JSON.parse(savedData));
        const savedTimestamp = await AsyncStorage.getItem(
          "lastUpdatedTimestamp"
        );
        if (savedTimestamp) setLastUpdated(JSON.parse(savedTimestamp));
        let cityToLoad = "Hanoi";
        setIsRefreshing(true);
        if (locationPermissionStatus === "granted") {
          try {
            let location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            const { latitude, longitude } = location.coords;
            await fetchWeatherByCoords(latitude, longitude, true);
            return;
          } catch (e) {
            console.error("Lỗi lấy vị trí GPS:", e);
            Alert.alert(
              "Lỗi GPS",
              "Không thể lấy vị trí. Tải thành phố đã lưu."
            );
          }
        }
        const savedCity = await AsyncStorage.getItem("lastCity");
        cityToLoad = savedCity || "Hanoi";
        setSearchQuery(cityToLoad);
        await fetchWeather(cityToLoad, true);
      } catch (e) {
        console.error("Lỗi tải dữ liệu ban đầu:", e);
        await fetchWeather("Hanoi", false);
      } finally {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    };
    if (locationPermissionStatus !== null) {
      loadInitialData();
    }
  }, [locationPermissionStatus]);

  // (Lắng nghe điều hướng từ Yêu thích)
  useEffect(() => {
    if (route.params?.city) {
      const cityFromFavorite = route.params.city;
      setSearchQuery(cityFromFavorite);
      fetchWeather(cityFromFavorite, false);
      navigation.setParams({ city: undefined });
    }
  }, [route.params?.city]);

  // (Cập nhật ngôi sao)
  useEffect(() => {
    if (weatherData && weatherData.current) {
      const cityName = weatherData.current.name;
      const checkFav = favorites.some((fav) => fav.city_name === cityName);
      setIsFavorite(checkFav);
    } else {
      setIsFavorite(false);
    }
  }, [weatherData, favorites]);

  // (Tự động refresh 5 phút)
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (weatherData && weatherData.current && weatherData.current.name) {
        fetchWeather(weatherData.current.name, true);
      }
    }, 300000);
    return () => clearInterval(intervalId);
  }, [weatherData]);

  // (Cập nhật "Time Ago")
  useEffect(() => {
    const updateTimeAgo = () => {
      if (!lastUpdated) {
        setTimeAgo("");
        return;
      }
      const now = Date.now();
      const minutesAgo = Math.round((now - lastUpdated) / 60000);
      if (minutesAgo < 1) setTimeAgo("vừa xong");
      else if (minutesAgo === 1) setTimeAgo("cập nhật 1 phút trước");
      else if (minutesAgo < 60) setTimeAgo(`cập nhật ${minutesAgo} phút trước`);
      else {
        const hoursAgo = Math.floor(minutesAgo / 60);
        setTimeAgo(`cập nhật ${hoursAgo} giờ trước`);
      }
    };
    updateTimeAgo();
    const intervalId = setInterval(updateTimeAgo, 60000);
    return () => clearInterval(intervalId);
  }, [lastUpdated]);

  // Giao diện Loading ban đầu
  if (isInitialLoading) {
    return (
      <View
        style={[styles.loadingContainer, isDarkMode && styles.containerDark]}
      >
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // --- GIAO DIỆN (UI) VỚI GRADIENT TĨNH ---
  return (
    <LinearGradient
      colors={
        isDarkMode ? ["#0F2027", "#203A43", "#2C5364"] : ["#56CCF2", "#2F80ED"]
      }
      style={styles.linearGradient}
    >
      <SafeAreaView style={styles.safeAreaContent} edges={["top"]}>
        {/* Thanh tìm kiếm */}
        <View
          style={[
            styles.searchContainer,
            isDarkMode && styles.searchContainerDark,
          ]}
        >
          <View style={styles.searchBox}>
            <TextInput
              style={[styles.searchInput, isDarkMode && styles.searchInputDark]}
              placeholder="Tìm kiếm thành phố..."
              placeholderTextColor={isDarkMode ? "#999" : "#fff"}
              value={searchQuery}
              onChangeText={onSearchTextChange}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity
              onPress={handleSearch}
              style={styles.searchButton}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="search" size={24} color="white" />
              )}
            </TouchableOpacity>
          </View>
          {/* Danh sách Đề xuất */}
          {suggestions.length > 0 && (
            <View
              style={[
                styles.suggestionsContainer,
                isDarkMode && styles.suggestionsContainerDark,
              ]}
            >
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => onSuggestionPress(item)}
                  >
                    <Text
                      style={[
                        styles.suggestionText,
                        isDarkMode && styles.textDark,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        {/* Nội dung thời tiết */}
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={isDarkMode ? "#FFFFFF" : "#000000"}
              colors={isDarkMode ? ["#FFFFFF"] : ["#000000"]}
            />
          }
        >
          {/* Nút Refresh thủ công */}
          {weatherData && (
            <View style={styles.refreshContainer}>
              <TouchableOpacity
                onPress={handleManualRefresh}
                style={[
                  styles.refreshButton,
                  isDarkMode && styles.refreshButtonDark,
                ]}
              >
                <Ionicons
                  name="refresh"
                  size={20}
                  color={isDarkMode ? "#fff" : "#000"}
                />
                <Text
                  style={[styles.refreshText, isDarkMode && styles.textDark]}
                >
                  Tải lại
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Ô thông tin thời tiết CHÍNH */}
          {weatherData && (
            <View
              style={[
                styles.currentWeatherBox,
                isDarkMode && styles.currentWeatherBoxDark,
              ]}
            >
              <View style={styles.cityHeader}>
                <Text
                  style={[styles.cityText, isDarkMode && styles.textDark]}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                >
                  {weatherData.current.name}
                </Text>
                <TouchableOpacity onPress={handleToggleFavorite}>
                  <Ionicons
                    name={isFavorite ? "star" : "star-outline"}
                    size={28}
                    color="#FFD700"
                  />
                </TouchableOpacity>
              </View>

              {/* Thông báo GPS (đã sửa logic) */}
              {isGpsLocation && (
                <Text
                  style={[
                    styles.timeAgoText,
                    isDarkMode && styles.textDark,
                    { fontWeight: "bold" },
                  ]}
                >
                  Vị trí hiện tại (GPS)
                </Text>
              )}

              <View style={styles.headerRow}>
                {timeAgo ? (
                  <Text
                    style={[styles.timeAgoText, isDarkMode && styles.textDark]}
                  >
                    {timeAgo}
                  </Text>
                ) : null}
              </View>
              <Image
                style={styles.mainIcon}
                source={{
                  uri: getWeatherIcon(weatherData.current.weather[0].icon),
                }}
              />
              <Text style={[styles.tempText, isDarkMode && styles.textDark]}>
                {Math.round(weatherData.current.main.temp)}°C
              </Text>
              <Text
                style={[styles.descriptionText, isDarkMode && styles.textDark]}
              >
                {weatherData.current.weather[0].description}
              </Text>
              <Text
                style={[styles.feelsLikeText, isDarkMode && styles.textDark]}
              >
                Cảm nhận: {Math.round(weatherData.current.main.feels_like)}°C
              </Text>
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text
                    style={[styles.detailLabel, isDarkMode && styles.textDark]}
                  >
                    Độ ẩm
                  </Text>
                  <Text
                    style={[styles.detailValue, isDarkMode && styles.textDark]}
                  >
                    {weatherData.current.main.humidity}%
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text
                    style={[styles.detailLabel, isDarkMode && styles.textDark]}
                  >
                    Tốc độ gió
                  </Text>
                  <Text
                    style={[styles.detailValue, isDarkMode && styles.textDark]}
                  >
                    {(weatherData.current.wind.speed * 3.6).toFixed(1)} km/h
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text
                    style={[styles.detailLabel, isDarkMode && styles.textDark]}
                  >
                    Tầm nhìn
                  </Text>
                  <Text
                    style={[styles.detailValue, isDarkMode && styles.textDark]}
                  >
                    {(weatherData.current.visibility / 1000).toFixed(1)} km
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Dự báo hàng giờ (F3) */}
          {hourlyForecast.length > 0 && (
            <View
              style={[styles.forecastBox, isDarkMode && styles.forecastBoxDark]}
            >
              <Text
                style={[styles.forecastTitle, isDarkMode && styles.textDark]}
              >
                Dự báo hàng giờ
              </Text>
              <FlatList
                data={hourlyForecast}
                keyExtractor={(item) => item.dt.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => {
                  const time = new Date(item.dt * 1000).toLocaleTimeString(
                    "vi-VN",
                    { hour: "2-digit", minute: "2-digit" }
                  );
                  const icon = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;
                  const temp = Math.round(item.main.temp);

                  return (
                    <View style={styles.hourlyItem}>
                      <Text
                        style={[
                          styles.hourlyTime,
                          isDarkMode && styles.textDark,
                        ]}
                      >
                        {time}
                      </Text>
                      <Image source={{ uri: icon }} style={styles.hourlyIcon} />
                      <Text
                        style={[
                          styles.hourlyTemp,
                          isDarkMode && styles.textDark,
                        ]}
                      >
                        {temp}°
                      </Text>
                    </View>
                  );
                }}
              />
            </View>
          )}

          {/* Dự báo 5 ngày (F4) */}
          {dailyForecast.length > 0 && (
            <View
              style={[styles.forecastBox, isDarkMode && styles.forecastBoxDark]}
            >
              <Text
                style={[styles.forecastTitle, isDarkMode && styles.textDark]}
              >
                Dự báo 5 ngày tới
              </Text>
              {dailyForecast.map((item) => {
                const day = new Date(item.dt * 1000).toLocaleDateString(
                  "vi-VN",
                  { weekday: "long" }
                );
                const icon = getWeatherIcon(item.weather[0].icon);
                const tempMax = Math.round(item.main.temp_max);
                const tempMin = Math.round(item.main.temp_min);

                return (
                  <View style={styles.dailyItem} key={item.dt}>
                    <Text
                      style={[styles.dailyDay, isDarkMode && styles.textDark]}
                    >
                      {day}
                    </Text>
                    <Image source={{ uri: icon }} style={styles.dailyIcon} />
                    <Text
                      style={[styles.dailyTemp, isDarkMode && styles.textDark]}
                    >
                      {tempMax}° / {tempMin}°
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// --- STYLESHEET (Đầy đủ) ---
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F4F8",
  },
  linearGradient: {
    flex: 1,
  },
  safeAreaContent: {
    flex: 1,
    backgroundColor: "transparent",
  },
  containerDark: {
    backgroundColor: "#121212",
  },
  textDark: {
    color: "#FFFFFF",
  },
  searchContainer: {
    backgroundColor: "transparent",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.3)",
  },
  searchContainerDark: {
    backgroundColor: "transparent",
    borderBottomColor: "rgba(255, 255, 255, 0.3)",
  },
  searchBox: {
    flexDirection: "row",
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    paddingLeft: 15,
    fontSize: 16,
    color: "#FFFFFF",
  },
  searchInputDark: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    color: "#FFFFFF",
  },
  searchButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 8,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
    width: 40,
    height: 40,
  },
  suggestionsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    marginTop: 5,
    elevation: 3,
  },
  suggestionsContainerDark: {
    backgroundColor: "rgba(50, 50, 50, 0.9)",
    borderColor: "#444",
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  suggestionText: {
    fontSize: 16,
    color: "#000",
  },
  scrollContainer: {
    padding: 20,
    zIndex: 1,
  },
  refreshContainer: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 2,
    borderColor: "rgba(255,255,255,0.3)",
    borderWidth: 1,
  },
  refreshButtonDark: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderColor: "rgba(255,255,255,0.3)",
  },
  refreshText: {
    marginLeft: 6,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  currentWeatherBox: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 15,
    elevation: 3,
    borderColor: "rgba(255,255,255,0.3)",
    borderWidth: 1,
  },
  currentWeatherBoxDark: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderColor: "rgba(255,255,255,0.3)",
  },
  cityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  cityText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
    marginRight: 10,
  },
  headerRow: {
    width: "100%",
    marginBottom: 10,
  },
  timeAgoText: {
    fontSize: 14,
    color: "#EEEEEE",
    fontStyle: "italic",
    textAlign: "left",
  },
  mainIcon: {
    width: 150,
    height: 150,
  },
  tempText: {
    fontSize: 64,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: -20,
  },
  descriptionText: {
    fontSize: 20,
    color: "#EEEEEE",
    textTransform: "capitalize",
    marginTop: -10,
  },
  feelsLikeText: {
    fontSize: 16,
    color: "#EEEEEE",
    marginTop: 5,
  },
  detailsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.3)",
    paddingTop: 15,
  },
  detailItem: {
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: "#EEEEEE",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 5,
  },

  // Style cho Dự báo hàng giờ (F3)
  hourlyItem: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    minWidth: 70,
    paddingVertical: 10,
  },
  hourlyTime: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  hourlyIcon: {
    width: 50,
    height: 50,
  },
  hourlyTemp: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },

  // Style cho Dự báo 5 ngày (F4)
  forecastBox: {
    marginTop: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 15,
    padding: 20,
    borderColor: "rgba(255,255,255,0.3)",
    borderWidth: 1,
  },
  forecastBoxDark: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderColor: "rgba(255,255,255,0.3)",
  },
  forecastTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },
  dailyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  dailyDay: {
    fontSize: 16,
    color: "#FFFFFF",
    flex: 1,
  },
  dailyIcon: {
    width: 40,
    height: 40,
    flex: 1,
    resizeMode: "contain",
  },
  dailyTemp: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "right",
  },
});

export default WeatherScreen;
