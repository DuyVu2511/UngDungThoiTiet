import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ❗️❗️ ĐÂY LÀ ĐỊA CHỈ BACKEND CỦA BẠN (DÙNG CHO MÁY ẢO ANDROID)
const BASE_URL = "http://172.16.9.12:3000";

const api = axios.create({
  baseURL: BASE_URL,
});

// Cấu hình "interceptor" để tự động gắn Token vào mỗi yêu cầu
// sau khi bạn đăng nhập
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // (Phần này bạn sẽ cần code thêm ở backend để đọc JWT)
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
