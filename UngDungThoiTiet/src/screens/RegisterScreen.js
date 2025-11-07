import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity, // <<< THÊM
  ActivityIndicator, // <<< THÊM
  KeyboardAvoidingView, // <<< THÊM
  Platform,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient"; // <<< THÊM
import { SafeAreaView } from "react-native-safe-area-context"; // <<< THÊM

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); // <<< THÊM
  const { register } = useContext(AuthContext);

  const handleRegister = async () => {
    if (!username || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setIsLoading(true); // Bật loading
    try {
      const response = await register(username, password);
      Alert.alert("Thành công", response.message);
      navigation.goBack(); // Quay lại màn hình Đăng nhập
    } catch (e) {
      Alert.alert("Đăng ký thất bại", e.message);
    } finally {
      setIsLoading(false); // Tắt loading
    }
  };

  return (
    // <<< SỬA: Dùng LinearGradient làm nền >>>
    <LinearGradient
      colors={["#56CCF2", "#2F80ED"]} // Gradient xanh
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <Text style={styles.title}>Tạo tài khoản</Text>

          <TextInput
            style={styles.input}
            placeholder="Tên đăng nhập"
            placeholderTextColor="#EEEEEE"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu"
            placeholderTextColor="#EEEEEE"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* <<< SỬA: Thay <Button> bằng <TouchableOpacity> >>> */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Đăng ký</Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// <<< SỬA: StyleSheet (giống hệt LoginScreen) >>>
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
    color: "#FFFFFF",
  },
  input: {
    height: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    fontSize: 16,
    color: "#FFFFFF",
  },
  button: {
    backgroundColor: "#007AFF",
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
  // (Không cần nút secondary)
});

export default RegisterScreen;
