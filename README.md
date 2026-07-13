# WIS Quản Lý

Hệ thống quản lý nội bộ WIS gồm frontend TanStack Start và backend Express/MongoDB.

## Cấu trúc

```text
frontend/               Giao diện và route TanStack Start
backend/src/            API Express, model MongoDB và seed dữ liệu
backend/uploads/        File người dùng tải lên (không lưu vào Git)
scripts/                Script dùng chung của repository
```

## Chạy frontend

```bash
npm install
npm run dev
```

Frontend sử dụng biến `VITE_API_URL` nếu cần trỏ tới một địa chỉ API khác mặc định.

## Chạy backend

```bash
cd backend
npm install
npm run dev
```

Sao chép `backend/.env.example` thành `backend/.env`, sau đó cấu hình ít nhất
`MONGODB_URI` và `JWT_SECRET`. Không commit file `.env` lên Git.

Seed dữ liệu ban đầu khi cần:

```bash
cd backend
npm run seed
```

## Kiểm tra

```bash
npm run lint
npm run build
```

Backend có thể kiểm tra cú pháp entry bằng:

```bash
node --check backend/src/server.js
```
