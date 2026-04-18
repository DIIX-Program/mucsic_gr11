# 👋 Hướng dẫn Chạy Dự án - MusicEVE (Spotify Mini)

Tài liệu này hướng dẫn bạn cách thiết lập môi trường, cấu trúc dự án và cách vận hành ứng dụng.

---

## 📂 1. Cấu trúc Dự án (Project Structure)

Dự án được xây dựng theo kiến trúc **Layered Architecture** (Phân lớp) trên Backend và **Component-based** trên Frontend.

```text
Music_11/
├── src/
│   ├── backend/                # 🚀 BACKEND (Node.js + TS)
│   │   ├── config/             # Cấu hình DB (Connection Pool)
│   │   ├── controllers/        # Xử lý Logic Request/Response
│   │   ├── db/                 # SQL Scripts & Seeding
│   │   ├── middleware/         # Auth & RBAC (Phân quyền)
│   │   ├── repositories/       # Truy vấn SQL Server trực tiếp
│   │   ├── routes/             # Định nghĩa API Endpoints
│   │   └── services/           # Business Logic
│   ├── components/             # 🎨 FRONTEND COMPONENTS (React)
│   ├── hooks/                  # Custom React Hooks (TanStack Query)
│   ├── pages/                  # Các trang (Home, Admin, Search...)
│   ├── store/                  # Quản lý State (Zustand)
│   ├── App.tsx                 # Routing & Layout chính
│   └── main.tsx                # Entry point Frontend
├── server.ts                   # 🟢 SERVER ENTRY POINT (Express)
├── data.md                     # Schema Database chuẩn
├── .env                        # Biến môi trường (DB, JWT)
└── package.json                # Dependencies & Scripts
```

---

## ⚙️ 2. Yêu cầu Hệ thống
- **Node.js**: Phiên bản 18+
- **SQL Server**: Phiên bản 2019 hoặc mới hơn (Docker hoặc Local)
- **Database Name**: `musicdb`

---

## 🚀 3. Các bước Chạy Dự án

### Bước 1: Cài đặt Dependencies
Mở terminal tại thư mục gốc và chạy:
```bash
npm install
```

### Bước 2: Cấu hình Môi trường (.env)
Đảm bảo file `.env` chứa thông tin kết nối SQL Server của bạn:
```env
PORT=3000
JWT_SECRET=super-secret-key-music-app
DB_SERVER=localhost
DB_NAME=musicdb
DB_USER=sa
DB_PASSWORD=123456
NODE_ENV=development
```

### Bước 3: Khởi tạo Database Schema
Sử dụng công cụ quản lý SQL (như SSMS hoặc Azure Data Studio), mở và thực thi file:
`src/backend/db/setup.sql`
> [!IMPORTANT]
> Bước này sẽ tạo toàn bộ bảng và các ràng buộc (Foreign Keys) theo chuẩn `data.md`.

### Bước 4: Nạp Dữ liệu mẫu (Admin, Users & Nhạc)
Bạn có hai cách để nạp dữ liệu:

**Cách 1: Chạy trực tiếp Query SQL (Khuyên dùng)**
Mở SSMS hoặc Azure Data Studio, copy và chạy nội dung file:
`src/backend/db/insert_data.sql`
> Cách này đảm bảo dữ liệu được nạp vào chính xác mà không phụ thuộc vào kết nối Node.js.

**Cách 2: Sử dụng lệnh npm**
```bash
npm run seed
```
> Cách này yêu cầu SQL Server phải được bật TCP/IP và cấu hình đúng Port 1433.

### Bước 5: Chạy Ứng dụng
Khởi động cả Backend và Frontend (Vite) bằng một lệnh duy nhất:
```bash
npm run dev
```
Ứng dụng sẽ chạy tại: **http://localhost:3000** (hoặc port bạn cấu hình).

---

## 🛠️ 4. Các lệnh hữu ích khác
- `npm run build`: Đóng gói ứng dụng cho production.
- `npm run seed`: Reset và tạo lại dữ liệu mẫu (Admin/Users).
- `npm run lint`: Kiểm tra lỗi Typescript.

---

## 🛡️ Tính năng Admin Moderation
Để truy cập trang quản trị bài hát và bình luận:
1. Đăng nhập bằng tài khoản `admin`.
2. Click vào biểu tượng **Khiên bảo vệ** trên thanh TopBar bên phải.
3. Tại đây bạn có thể **Phê duyệt** hoặc **Từ chối** các nội dung vừa upload.
