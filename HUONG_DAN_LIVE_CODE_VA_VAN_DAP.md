# HƯỚNG DẪN ÔN TẬP LIVE CODE & VẤN ĐÁP ĐỒ ÁN EXPRESS.JS (BOOK AN APPOINTMENT)

Tài liệu này được biên soạn bám sát cấu trúc đề thi thực hành tại chỗ (Live Code 45 phút) và buổi vấn đáp đồ án với giảng viên.

---

## PHẦN 1: TỔNG QUAN KIẾN TRÚC HỆ THỐNG CỦA BẠN

Dự án của bạn được tổ chức theo mô hình **Layered Architecture (Kiến trúc phân tầng)** kết hợp **Sequelize ORM (MySQL)**:

$$\text{Client (React / Postman)} \xrightarrow{\text{HTTP}} \text{Routes} \xrightarrow{\text{Middlewares}} \text{Controllers} \xrightarrow{} \text{Services} \xrightarrow{} \text{Repositories / Models} \xrightarrow{} \text{Database}$$

### Trách nhiệm từng tầng:
1. **`Routes` (`src/routes/`)**: Định nghĩa method (`GET`, `POST`, `PUT`, `DELETE`), URL path và gắn middleware.
2. **`Middlewares` (`src/middlewares/`)**:
   - `auth.middleware.js`: Kiểm tra Bearer JWT Token (`req.user = decoded`).
   - `validate.js`: Dùng `express-validator` bắt lỗi dữ liệu trước khi vào Controller.
3. **`Controllers` (`src/controllers/`)**: Đọc input từ `req.params`, `req.query`, `req.body` $\rightarrow$ gọi `Service` $\rightarrow$ dùng `response.success(res, data, message)` hoặc chuyển tiếp lỗi qua `next(error)`.
4. **`Services` (`src/services/`)**: Chứa **Nghiệp vụ (Business Logic)** (ví dụ: kiểm tra slot trống, hash mật khẩu, gửi email thông báo, phát socket).
5. **`Repositories / Models` (`src/repositories/`, `src/models/`)**: Thực thi câu lệnh truy vấn dữ liệu thông qua Sequelize (`findOne`, `findAll`, `create`, `update`, `destroy`).

---

## PHẦN 2: PHÂN TÍCH ĐỀ THI MINH HỌA & CÁC DẠNG ĐỀ LIVE CODE

### Phân tích đề minh họa (Đề số 7 trong ảnh):
* **Yêu cầu:** Mở rộng API Search người dùng:
  1. Tìm theo `username` HOẶC `displayName` (không phân biệt hoa thường).
  2. Loại người dùng có `_id` trong danh sách `blockedUsers` của `req.user`.
  3. Giữ yêu cầu cũ: loại chính người đang đăng nhập.

### Cách quy đổi sang Đồ án của bạn (Đặt lịch khám bệnh):
Giảng viên thường sẽ yêu cầu bạn mở rộng hoặc viết mới 1 API ngay trong đồ án này, ví dụ:
- **Dạng 1 (Search/Filter):** Mở rộng API tìm kiếm bác sĩ: Tìm theo tên HOẶC tiểu sử (`bio`), lọc theo khoảng giá khám (`price_min`, `price_max`), hoặc lọc theo chuyên khoa.
- **Dạng 2 (CRUD cơ bản):** Thêm API cho phép bác sĩ tạo/cập nhật thông tin dịch vụ, xóa hoặc hủy lịch hẹn kèm điều kiện trạng thái.
- **Dạng 3 (Query quan hệ/Association):** Thống kê số lượng cuộc hẹn theo từng bác sĩ hoặc lấy thông tin bệnh nhân kèm lịch sử khám.

---

## PHẦN 3: CÁC MẪU CODE LIVE DỄ GẶP TRONG 45 PHÚT

### Mẫu 1: Xử lý tìm kiếm với toán tử OR, LIKE (Không phân biệt hoa thường) & Phủ định (NOT IN / Not Equal)

Đây chính là dạng toán tử giống hệt đề thi mẫu số 7 nhưng áp dụng trên **Sequelize ORM**:

```javascript
// File: src/repositories/doctor.repository.js
const { Op } = require("sequelize");
const { Doctor, Specialty } = require("../models/index");

const searchDoctors = async (keyword, currentDoctorId = null, excludeIds = []) => {
  const whereConditions = [];

  // 1. Tìm theo full_name HOẶC bio (Op.like)
  if (keyword) {
    whereConditions.push({
      [Op.or]: [
        { full_name: { [Op.like]: `%${keyword}%` } },
        { bio: { [Op.like]: `%${keyword}%` } }
      ]
    });
  }

  // 2. Loại bỏ chính mình (giống loại req.user)
  if (currentDoctorId) {
    whereConditions.push({
      id: { [Op.ne]: currentDoctorId }
    });
  }

  // 3. Loại bỏ danh sách ID bị loại trừ (giống blockedUsers trong đề mẫu)
  if (excludeIds && excludeIds.length > 0) {
    whereConditions.push({
      id: { [Op.notIn]: excludeIds }
    });
  }

  return await Doctor.findAll({
    where: {
      [Op.and]: whereConditions
    },
    attributes: ["id", "full_name", "email", "phone_number", "price_per_appointment", "bio"],
    include: [{ model: Specialty, attributes: ["id", "specialty_name"] }]
  });
};
```

### Mẫu 2: Quy trình 4 bước chuẩn để viết mới một tính năng CRUD bất kỳ

Nếu thầy cô yêu cầu: *"Em hãy viết API xóa lịch hẹn / hủy lịch hẹn / tạo thêm chuyên khoa"* $\rightarrow$ Bình tĩnh viết theo thứ tự 4 bước:

#### Bước 1: Viết hàm Repository (Thao tác DB)
```javascript
// Ví dụ hủy lịch hẹn trong appointment.repository.js
const cancelAppointment = async (appointmentId, doctorId) => {
  return await Appointment.update(
    { status: 'cancelled' },
    { where: { id: appointmentId } }
  );
};
```

#### Bước 2: Viết hàm Service (Nghiệp vụ + Validate Logic)
```javascript
// Trong appointment.service.js
const cancelAppointment = async (appointmentId, doctorId) => {
  const appointment = await appointmentRepository.getAppointmentDetail(appointmentId, doctorId);
  if (!appointment) {
    throw new ApiError(404, "Không tìm thấy lịch hẹn hoặc không có quyền thao tác");
  }
  if (appointment.status === 'completed') {
    throw new ApiError(400, "Lịch hẹn đã hoàn thành, không thể hủy");
  }
  return await appointmentRepository.cancelAppointment(appointmentId, doctorId);
};
```

#### Bước 3: Viết hàm Controller (Xử lý req/res)
```javascript
// Trong appointment.controller.js
const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;
    const result = await appointmentService.cancelAppointment(id, doctorId);
    return response.success(res, result, "Hủy lịch hẹn thành công");
  } catch (error) {
    next(error); // Chuyển sang middleware xử lý lỗi tập trung
  }
};
```

#### Bước 4: Khai báo Route
```javascript
// Trong appointment.route.js
router.put("/:id/cancel", authMiddleware, appointmentController.cancelAppointment);
```

---

## PHẦN 4: BỘ CÂU HỎI VẤN ĐÁP THƯỜNG GẶP & CÁCH TRẢ LỜI ĐIỂM CAO

### Câu 1: Em hãy giải thích cơ chế Middleware trong ExpressJS?
* **Trả lời:**
  * Express hoạt động như một chuỗi đường ống (**Middleware Pipeline**).
  * Mỗi middleware là một hàm nhận 3 tham số: `(req, res, next)`.
  * Middleware có thể: đọc/ghi dữ liệu vào `req` (như gắn `req.user`), can thiệp kết thúc phản hồi (`res.json`), hoặc gọi `next()` để chuyển sang middleware tiếp theo.
  * Nếu gọi `next(err)` kèm tham số, Express sẽ bỏ qua tất cả middleware thông thường và nhảy thẳng đến **Error-handling middleware** (hàm có 4 tham số `(err, req, res, next)`).

### Câu 2: Dự án của em xác thực người dùng như thế nào? JWT hoạt động ra sao?
* **Trả lời:**
  * Dự án sử dụng **JSON Web Token (JWT)** không lưu session trên server (Stateless).
  * Khi bác sĩ login thành công, server dùng thư viện `jsonwebtoken` với `JWT_SECRET` để ký một chuỗi token chứa `{ id, email, role }` và trả về client.
  * Mỗi request cần bảo vệ, client gửi token trong header: `Authorization: Bearer <token>`.
  * Middleware `auth.middleware.js` sẽ lấy chuỗi này, gọi `jwt.verify(token, secret)`. Nếu hợp lệ, gán payload vào `req.user` để các Controller phía sau sử dụng.

### Câu 3: Tại sao lại phân chia Controller, Service và Repository mà không viết hết vào Route?
* **Trả lời:**
  * Tuân thủ nguyên lý **Single Responsibility Principle (SRP)** và mô hình kiến trúc phân tầng:
    * **Route:** Chỉ làm nhiệm vụ điều hướng URL.
    * **Controller:** Chỉ giao tiếp với tầng giao vận HTTP (lấy params, query, body và trả HTTP status, JSON).
    * **Service:** Chứa toàn bộ nghiệp vụ (tính toán, ràng buộc logic, kiểm tra điều kiện). Tầng này độc lập với Express, có thể tái sử dụng hoặc viết Unit Test dễ dàng.
    * **Repository:** Cách ly tầng truy cập dữ liệu (ORM/Database). Nếu sau này đổi từ Sequelize MySQL sang MongoDB thì chỉ cần sửa tầng Repository, toàn bộ Service và Controller giữ nguyên.

### Câu 4: Xử lý lỗi trong hệ thống được thực hiện như thế nào để không sập server?
* **Trả lời:**
  * Hệ thống dùng lớp tùy biến `ApiError extends Error` chứa mã `statusCode` và thông báo lỗi `message`.
  * Trong các Controller đều dùng `try...catch` và đẩy lỗi xuống tầng cuối qua `next(error)`.
  * Cuối pipeline có middleware xử lý lỗi tập trung `errorHandler(err, req, res, next)` để log lỗi và trả JSON chuẩn cho client: `{ success: false, message: err.message, status: err.statusCode || 500 }`, ngăn chặn việc lộ cấu trúc file hay stack trace ra ngoài.

### Câu 5: Sequelize ORM có những phương thức truy vấn cơ bản nào?
* **Trả lời:**
  * `Model.findAll({ where: { ... } })`: Lấy danh sách bản ghi.
  * `Model.findOne({ where: { ... } })`: Lấy 1 bản ghi đầu tiên thỏa điều kiện.
  * `Model.findByPk(id)`: Tìm bản ghi theo Primary Key.
  * `Model.create(data)`: Thêm mới bản ghi (tương đương `INSERT INTO`).
  * `Model.update(data, { where: { ... } })`: Cập nhật (tương đương `UPDATE ... WHERE`).
  * `Model.destroy({ where: { ... } })`: Xóa (tương đương `DELETE FROM`).
  * Các toán tử trong `Op`: `Op.eq` (=), `Op.ne` (!=), `Op.like` (LIKE), `Op.in` (IN), `Op.notIn` (NOT IN), `Op.or` (HOẶC), `Op.and` (VÀ), `Op.between` (khoảng).

---

## PHẦN 5: CHECKLIST TRƯỚC GIỜ BƯỚC VÀO LIVE CODE
1. Mở sẵn MySQL / XAMPP, kiểm tra DB `datlichkhambenh` đã start.
2. Kiểm tra file `.env` ở cả 2 thư mục `backend` và `frontend`.
3. Chạy thử backend: `cd backend && npm run dev` $\rightarrow$ Đảm bảo console báo database connected.
4. Mở sẵn Postman hoặc Thunder Client với các request mẫu (Login, Create, Search, Get List) để test ngay sau khi viết xong code.
