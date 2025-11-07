import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity, // <<< THÊM: Dùng nút bấm tùy chỉnh
  ActivityIndicator, // <<< THÊM: Vòng quay Loading
  KeyboardAvoidingView, // Giúp bàn phím không che ô nhập liệu
  Platform,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient"; // <<< THÊM: Gradient
import { SafeAreaView } from "react-native-safe-area-context"; // <<< THÊM: SafeAreaView

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // <<< THÊM: State loading >>>
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setIsLoading(true); // Bật loading
    try {
      await login(username, password);
      // Đăng nhập thành công, AppNavigator sẽ tự chuyển màn hình
    } catch (e) {
      Alert.alert("Đăng nhập thất bại", e.message);
      setIsLoading(false); // Tắt loading nếu lỗi
    }
    // Không cần tắt loading ở đây vì app sẽ chuyển màn hình
  };

  return (
    // <<< SỬA: Dùng LinearGradient làm nền >>>
    <LinearGradient
      colors={["#56CCF2", "#2F80ED"]} // Gradient xanh (giống WeatherScreen)
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Dùng KeyboardAvoidingView để bàn phím không che mất ô nhập */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <Text style={styles.title}>Chào mừng!</Text>

          <TextInput
            style={styles.input}
            placeholder="Tên đăng nhập"
            placeholderTextColor="#EEEEEE" // Đổi màu chữ gợi ý
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu"
            placeholderTextColor="#EEEEEE" // Đổi màu chữ gợi ý
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* <<< SỬA: Thay <Button> bằng <TouchableOpacity> >>> */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={isLoading} // Không cho nhấn khi đang tải
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" /> // Hiển thị vòng quay
            ) : (
              <Text style={styles.buttonText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={styles.secondaryButtonText}>
              Chưa có tài khoản? Đăng ký
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// <<< SỬA: StyleSheet đã được nâng cấp >>>
const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
    color: "#FFFFFF", // Chữ trắng
  },
  input: {
    height: 50, // Cao hơn
    backgroundColor: "rgba(255, 255, 255, 0.2)", // Nền trắng mờ
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    fontSize: 16,
    color: "#FFFFFF", // Chữ trắng
  },
  button: {
    backgroundColor: "#007AFF", // Màu xanh (giống nút search)
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    height: 50,
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    marginTop: 20,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
});

export default LoginScreen;
