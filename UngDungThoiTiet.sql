CREATE DATABASE WeatherAppDB;
USE WeatherAppDB;

CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(100) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);

-- Bảng 2: user_preferences (Liên kết 1-1 với users)
CREATE TABLE user_preferences (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL UNIQUE, 
    units NVARCHAR(10) DEFAULT 'metric', 
    theme NVARCHAR(10) DEFAULT 'light', 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng 3: favorites (Liên kết 1-N với users)
CREATE TABLE favorites (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    city_name NVARCHAR(255) NOT NULL,
    UNIQUE (user_id, city_name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng 4: search_history (Liên kết 1-N với users)
CREATE TABLE search_history (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL, 
    city_name NVARCHAR(255) NOT NULL,
    searched_at DATETIME DEFAULT GETDATE(), 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng 5: feedback (Liên kết 1-N với users, cho phép NULL)
CREATE TABLE feedback (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NULL, 
    message_text NVARCHAR(MAX) NOT NULL, 
    submitted_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
GO


-- BƯỚC 1: KHAI BÁO BIẾN (PHẦN QUAN TRỌNG NHẤT)
DECLARE @UserID1 INT, @UserID2 INT, @UserID3 INT;

-- BƯỚC 2: THÊM 3 USERS
-- (Lưu ý: Bạn phải dùng API /register để tạo user 
-- với mật khẩu thật mới đăng nhập được)
INSERT INTO users (username, password_hash)
VALUES 
('tranduyvu', '$2a$10$vWdFf.D.0.l.O.i.P.q.R.e.P.u.X.T.y.G.o.W.u.E.v.H.t'),
('thaychung', '$2a$10$x.Y.z.A.b.C.D.E.F.g.H.i.J.k.L.m.N.o.P.q.R.s.T'),
('banbe', '$2a$10$A.b.C.D.e.F.g.H.i.J.k.L.m.N.o.P.q.R.s.T.u.V.w');

-- BƯỚC 3: GÁN GIÁ TRỊ CHO BIẾN
SET @UserID1 = (SELECT id FROM users WHERE username = 'tranduyvu');
SET @UserID2 = (SELECT id FROM users WHERE username = 'thaychung');
SET @UserID3 = (SELECT id FROM users WHERE username = 'banbe');

-- BƯỚC 4: DÙNG CÁC BIẾN ĐÓ ĐỂ THÊM DỮ LIỆU CON
INSERT INTO user_preferences (user_id, units, theme)
VALUES
(@UserID1, 'metric', 'dark'),
(@UserID2, 'metric', 'light'),
(@UserID3, 'imperial', 'dark');

INSERT INTO favorites (user_id, city_name)
VALUES
(@UserID1, 'Hanoi'),
(@UserID1, 'Da Nang'),
(@UserID2, 'Ho Chi Minh City');

INSERT INTO search_history (user_id, city_name)
VALUES
(@UserID1, 'Tokyo'),
(@UserID2, 'Paris'),
(@UserID3, 'London');

INSERT INTO feedback (user_id, message_text)
VALUES
(@UserID1, 'Ứng dụng tốt, nên thêm cảnh báo thời tiết xấu.'),
(@UserID2, 'Giao diện rõ ràng, dễ sử dụng.'),
(NULL, 'Tôi là khách, tôi không tìm thấy thành phố Sapa?');

GO


SELECT * FROM users;
SELECT * FROM user_preferences;
SELECT * FROM favorites;
SELECT * FROM search_history;
SELECT * FROM feedback;

IF OBJECT_ID('feedback', 'U') IS NOT NULL 
    DROP TABLE feedback;
IF OBJECT_ID('search_history', 'U') IS NOT NULL 
    DROP TABLE search_history;
IF OBJECT_ID('favorites', 'U') IS NOT NULL 
    DROP TABLE favorites;
IF OBJECT_ID('user_preferences', 'U') IS NOT NULL 
    DROP TABLE user_preferences;
-- 2. Sau khi các bảng con đã bị xóa, mới được xóa bảng CHA
IF OBJECT_ID('users', 'U') IS NOT NULL 
    DROP TABLE users;