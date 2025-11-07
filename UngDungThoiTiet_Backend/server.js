const express = require("express");
const mssql = require("mssql");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios"); // Để gọi OpenWeatherMap

// --- CẤU HÌNH ---
const app = express();
app.use(cors());
app.use(express.json()); // Cho phép đọc JSON
const port = 3000;

// Khóa bí mật cho JWT (Đổi thành chuỗi của riêng bạn)
const JWT_SECRET = "day_la_khoa_bi_mat_cua_vu_va_khong_chia_se_cho_ai";

// <<< THAY THẾ 1: Cấu hình CSDL SQL SERVER của bạn >>>
const dbConfig = {
  server: "localhost",
  user: "tdv2210900138",
  password: "25112004", // <<< THAY MẬT KHẨU SQL CỦA BẠN
  database: "WeatherAppDB", // <<< TÊN CSDL BẠN ĐÃ TẠO
  options: {
    encrypt: true,
    trustServerCertificate: true, // Dùng cho local dev
  },
};

// <<< THAY THẾ 2: API Key của OpenWeatherMap (Giấu ở đây) >>>
const OWM_API_KEY = "2e04b3f5e10e62c6b3e19725a72ced95"; // <<< THAY API KEY CỦA BẠN
const OWM_API_BASE_URL = "https://api.openweathermap.org/data/2.5";

let pool; // Biến kết nối CSDL

// Hàm khởi động server và kết nối DB
async function startServer() {
  try {
    pool = await new mssql.ConnectionPool(dbConfig).connect();
    console.log("✅ Đã kết nối thành công SQL Server!");

    app.listen(port, () => {
      console.log(
        `🚀 Backend full-stack đang chạy tại http://localhost:${port}`
      );
    });
  } catch (err) {
    console.error("❌ Lỗi kết nối CSDL:", err);
  }
}

// ========= API TÀI KHOẢN (Giao tiếp với SQL) =========

// API 1: Đăng ký (POST /api/register)
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Thiếu username hoặc password" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const query = `
        INSERT INTO users (username, password_hash) 
        OUTPUT INSERTED.id
        VALUES (@username, @passwordHash)
      `;
    const request = pool.request();
    request.input("username", mssql.NVarChar, username);
    request.input("passwordHash", mssql.NVarChar, passwordHash);

    const result = await request.query(query);
    const userId = result.recordset[0].id;

    // Tự động tạo 'preferences' cho user mới
    await pool
      .request()
      .input("userId", mssql.Int, userId)
      .query("INSERT INTO user_preferences (user_id) VALUES (@userId)");

    res
      .status(201)
      .json({ message: "Tạo tài khoản thành công", userId: userId });
  } catch (error) {
    if (error.number === 2627 || error.number === 2601) {
      return res.status(409).json({ error: "Username đã tồn tại" });
    }
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ khi đăng ký" });
  }
});

// API 2: Đăng nhập (POST /api/login)
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const query = "SELECT * FROM users WHERE username = @username";
    const request = pool.request();
    request.input("username", mssql.NVarChar, username);

    const result = await request.query(query);
    const user = result.recordset[0];

    if (!user) {
      return res.status(404).json({ error: "Sai username hoặc password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Sai username hoặc password" });
    }

    // Lấy thông tin preferences
    const prefResult = await pool
      .request()
      .input("userId", mssql.Int, user.id)
      .query(
        "SELECT units, theme FROM user_preferences WHERE user_id = @userId"
      );

    // Tạo Token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" } // Token hết hạn sau 1 giờ
    );

    res.json({
      message: "Đăng nhập thành công",
      token: token,
      userId: user.id, // Trả về userId
      preferences: prefResult.recordset[0], // Trả về cài đặt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ khi đăng nhập" });
  }
});

// ========= API DỮ LIỆU USER (Giao tiếp với SQL) =========

// API 3: Lấy danh sách thành phố yêu thích (GET /api/favorites/:userId)
app.get("/api/favorites/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const query = "SELECT id, city_name FROM favorites WHERE user_id = @userId";
    const request = pool.request();
    request.input("userId", mssql.Int, userId);

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ khi lấy favorites" });
  }
});

// API 4: Thêm thành phố yêu thích (POST /api/favorites)
app.post("/api/favorites", async (req, res) => {
  const { userId, cityName } = req.body;

  try {
    const query =
      "INSERT INTO favorites (user_id, city_name) VALUES (@userId, @cityName)";
    const request = pool.request();
    request.input("userId", mssql.Int, userId);
    request.input("cityName", mssql.NVarChar, cityName);

    await request.query(query);
    res.status(201).json({ message: "Đã lưu thành phố" });
  } catch (error) {
    if (error.number === 2627 || error.number === 2601) {
      return res.status(409).json({ error: "Đã lưu thành phố này rồi" });
    }
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ khi lưu favorite" });
  }
});

// API: Xóa thành phố yêu thích
// API 10: Xóa thành phố yêu thích (DELETE /api/favorites)
app.delete("/api/favorites", async (req, res) => {
  const { userId, cityName } = req.body;
  if (!userId || !cityName) {
    return res.status(400).json({ error: "Thiếu userId hoặc cityName" });
  }

  try {
    const query =
      "DELETE FROM favorites WHERE user_id = @userId AND city_name = @cityName";
    const request = pool.request();
    request.input("userId", mssql.Int, userId);
    request.input("cityName", mssql.NVarChar, cityName);

    await request.query(query);
    res.status(200).json({ message: "Đã xóa khỏi danh sách yêu thích" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ khi xóa favorite" });
  }
});

// API 5: Lấy cài đặt (GET /api/preferences/:userId)
app.get("/api/preferences/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const query =
      "SELECT units, theme FROM user_preferences WHERE user_id = @userId";
    const request = pool.request();
    request.input("userId", mssql.Int, userId);

    const result = await request.query(query);
    if (result.recordset.length === 0) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy cài đặt cho user này." });
    }
    res.json(result.recordset[0]); // Trả về object cài đặt
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ khi lấy cài đặt" });
  }
});

// API 6: Cập nhật cài đặt (PUT /api/preferences/:userId)
app.put("/api/preferences/:userId", async (req, res) => {
  const { userId } = req.params;
  const { units, theme } = req.body; // Lấy cài đặt mới từ body

  let setClause = [];
  if (units) setClause.push("units = @units");
  if (theme) setClause.push("theme = @theme");
  if (setClause.length === 0) {
    return res.status(400).json({ error: "Không có thông tin gì để cập nhật" });
  }

  try {
    const query = `
              UPDATE user_preferences 
              SET ${setClause.join(", ")} 
              WHERE user_id = @userId
          `;

    const request = pool.request();
    request.input("userId", mssql.Int, userId);
    if (units) request.input("units", mssql.NVarChar, units);
    if (theme) request.input("theme", mssql.NVarChar, theme);

    await request.query(query);
    res.json({ message: "Cập nhật cài đặt thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ khi cập nhật cài đặt" });
  }
});

// API 7: Lấy lịch sử tìm kiếm (GET /api/history/:userId)
app.get("/api/history/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    // Lấy 5 thành phố gần nhất
    const query = `
              SELECT TOP 5 id, city_name, searched_at 
              FROM search_history 
              WHERE user_id = @userId 
              ORDER BY searched_at DESC
          `;
    const request = pool.request();
    request.input("userId", mssql.Int, userId);

    const result = await request.query(query);
    res.json(result.recordset); // Trả về 1 mảng
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ khi lấy lịch sử" });
  }
});

// API 8: Thêm vào lịch sử tìm kiếm (POST /api/history)
app.post("/api/history", async (req, res) => {
  const { userId, cityName } = req.body;
  try {
    const query =
      "INSERT INTO search_history (user_id, city_name) VALUES (@userId, @cityName)";
    const request = pool.request();
    request.input("userId", mssql.Int, userId);
    request.input("cityName", mssql.NVarChar, cityName);

    await request.query(query);
    res.status(201).json({ message: "Đã lưu lịch sử tìm kiếm" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ khi lưu lịch sử" });
  }
});

// API 9: Gửi feedback (POST /api/feedback)
app.post("/api/feedback", async (req, res) => {
  const { userId, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Nội dung feedback không được rỗng" });
  }

  try {
    const query =
      "INSERT INTO feedback (user_id, message_text) VALUES (@userId, @message)";
    const request = pool.request();

    if (userId) {
      request.input("userId", mssql.Int, userId);
    } else {
      request.input("userId", mssql.Int, null); // Cho phép khách vãng lai
    }
    request.input("message", mssql.NVarChar, message);

    await request.query(query);
    res.status(201).json({ message: "Cảm ơn bạn đã gửi góp ý!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi máy chủ khi gửi feedback" });
  }
});

// API 11: Đề xuất thành phố (GET /api/suggest) - ĐỔI SANG DÙNG GEO API
app.get("/api/suggest", async (req, res) => {
  const { q } = req.query; // q = query (từ khóa tìm kiếm)

  // Giữ nguyên logic < 2
  if (!q || q.length < 2) {
    return res.json([]); // Trả về mảng rỗng
  }

  try {
    // SỬ DỤNG API GEO/1.0/DIRECT ỔN ĐỊNH HƠN
    const response = await axios.get(
      `http://api.openweathermap.org/geo/1.0/direct`, // <<< API GEO ỔN ĐỊNH
      {
        params: {
          q: q,
          limit: 5, // Lấy tối đa 5 đề xuất
          appid: OWM_API_KEY,
        },
      }
    );

    // response.data là một mảng (VD: [ { name: "London", ... } ])
    const suggestions = response.data.map((item) => {
      let label = item.name;
      if (item.state) label += `, ${item.state}`;
      if (item.country) label += `, ${item.country}`;

      return {
        // Tạo ID duy nhất bằng cách ghép lat+lon (để sửa lỗi "same key")
        id: `${item.lat}-${item.lon}`,
        name: item.name,
        label: label,
      };
    });

    res.json(suggestions);
  } catch (error) {
    console.error("Lỗi từ OWM khi gọi /api/suggest (GEO):", error.message);
    res.status(500).json({ error: "Lỗi khi lấy đề xuất" });
  }
});

// ========= API THỜI TIẾT (Proxy - Giao tiếp với OpenWeatherMap) =========
// 🛡️ API này giúp giấu API Key an toàn
app.get("/api/weather", async (req, res) => {
  const { city, lat, lon } = req.query;

  let locationQuery = "";
  if (city) {
    locationQuery = `q=${city}`;
  } else if (lat && lon) {
    locationQuery = `lat=${lat}&lon=${lon}`;
  } else {
    return res
      .status(400)
      .json({ error: "Thiếu thông tin thành phố hoặc tọa độ" });
  }

  try {
    // Backend gọi song song 2 API của OpenWeatherMap
    const [currentResponse, forecastResponse] = await Promise.all([
      axios.get(
        `${OWM_API_BASE_URL}/weather?${locationQuery}&appid=${OWM_API_KEY}&units=metric&lang=vi`
      ),
      axios.get(
        `${OWM_API_BASE_URL}/forecast?${locationQuery}&appid=${OWM_API_KEY}&units=metric&lang=vi`
      ),
    ]);

    // Gộp 2 kết quả lại và trả về cho React Native
    const responseData = {
      current: currentResponse.data,
      forecast: forecastResponse.data,
    };

    res.json(responseData);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Lỗi khi gọi OpenWeatherMap" });
  }
});

// ========= KHỞI ĐỘNG SERVER =========
startServer();
