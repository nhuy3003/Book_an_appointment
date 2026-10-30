# Hệ thống đặt lịch khám bệnh

Backend Express 5 + Sequelize/MySQL, frontend React (Vite).

## Cài đặt và chạy

### 1. Cơ sở dữ liệu

Tạo database `datlichkhambenh` trên MySQL (XAMPP), rồi import schema:

`backend/src/DB/datlichkham.sql`

### 2. Backend

```bash
cd backend
copy .env.example .env
npm install
npm start
```

API: http://localhost:3000  
Swagger: http://localhost:3000/api-docs

### 3. Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Giao diện: http://localhost:5173 (hoặc cổng Vite in ra).
