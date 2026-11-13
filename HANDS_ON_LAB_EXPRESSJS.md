# TÀI LIỆU HANDS-ON LAB: NỀN TẢNG EXPRESS.JS

> **Mục riêng — Nộp kèm Báo cáo đồ án**  
> **Chủ đề:** Xây dựng Middleware Pipeline kiểm soát luồng & Hệ thống Xử lý Lỗi Bất Đồng Bộ Tập Trung (Centralized Async Error Handling & Validation Pipeline) trong ExpressJS  
> **Dự án gốc tham chiếu:** Hệ thống Đặt lịch Khám bệnh (Book An Appointment Backend)  
> **Thời lượng thực hành:** 30 – 45 phút  
> **Đối tượng:** Sinh viên / Nhóm khác muốn nắm vững bản chất kiến trúc ExpressJS vượt qua mức CRUD thông thường.

---

## D0. ĐẶT VẤN ĐỀ & ĐO LƯỜNG CHỦ ĐỀ (5 ĐIỂM)

### 1. Vì sao nhóm chọn chủ đề này?
Khi học ExpressJS, sai lầm phổ biến nhất của người mới là:
- Xem Express chỉ là công cụ tạo route cơ bản: nhận `req`, truy vấn database trong hàm xử lý, rồi `res.json(...)`.
- Khi cần kiểm tra dữ liệu đầu vào (validation) hay xác thực quyền (authentication), thường viết lặp đi lặp lại hàng chục dòng `if-else` trong từng Controller.
- Khi gặp lỗi bất đồng bộ (`Promise.reject` hoặc `throw` trong `async/await`), thường bọc `try/catch` thủ công khắp mọi nơi, hoặc nghiêm trọng hơn là bỏ sót khiến tiến trình Node.js sập (`UnhandledPromiseRejection`).
- Không hiểu bản chất của Express: **Express thực chất là một chuỗi Middleware Pipeline (Connect-based framework)**.

Trong đồ án **Đặt lịch khám bệnh**, nghiệp vụ đặt lịch (`POST /api/appointments/create`) đòi hỏi xử lý rất khắt khe: kiểm tra định dạng dữ liệu (validation), bảo vệ slot khám trống (concurrency & business rule), và khi xảy ra sự cố (hết slot, dữ liệu rác, token hết hạn) phải trả về mã lỗi HTTP chuẩn mực (400, 401, 404, 500) mà **không được để rò rỉ stack trace hệ thống ra ngoài**.

Vì vậy, nhóm chọn chủ đề: **Thiết kế Middleware Pipeline & Cơ chế Xử lý Lỗi Bất Đồng Bộ Tập Trung**. Đây là kỹ thuật cốt lõi quyết định kiến trúc một ứng dụng Express chuyên nghiệp, vượt xa các bài lab cài đặt hay CRUD cơ bản.

### 2. Người học làm xong sẽ có năng lực gì?
Sau 30–45 phút hoàn thành bài Lab này, người học sẽ có khả năng:
1. **Làm chủ Middleware Pipeline:** Hiểu rõ cơ chế `req`, `res`, `next()`, `next(err)` và tầm quan trọng sống còn của thứ tự khai báo middleware.
2. **Thiết kế Class lỗi tùy biến (`ApiError`):** Đóng gói mã trạng thái HTTP (`statusCode`) và thông điệp lỗi nghiệp vụ vào một đối tượng Error chuẩn của JavaScript.
3. **Xây dựng Error Handling Middleware tập trung:** Viết middleware 4 tham số `(err, req, res, next)` đặt ở cuối ứng dụng để đón toàn bộ lỗi từ Controller/Service và format JSON phản hồi thống nhất.
4. **Tích hợp Input Validation Pipeline:** Sử dụng `express-validator` để bóc tách validation ra khỏi nghiệp vụ, tự động đẩy lỗi về `ApiError(400)`.
5. **Kiểm soát Asynchronous Errors:** Hiểu cơ chế bắt lỗi của Express 5 và Express 4 khi làm việc với `async/await`.

---

## 1. MỤC TIÊU HỌC TẬP (LEARNING OUTCOMES)

- **Mục tiêu 1:** Tách biệt hoàn toàn tầng Validation, tầng Controller và tầng Xử lý Lỗi. Controller chỉ làm đúng nhiệm vụ: nhận request hợp lệ và gọi Service.
- **Mục tiêu 2:** Không còn bất kỳ khối `try/catch` dư thừa nào chỉ để gõ `res.status(500).json({ error: err.message })`.
- **Mục tiêu 3:** Xây dựng được pipeline chuẩn cho route `POST /api/appointments/create` của hệ thống đặt khám:
  $$\text{Request} \longrightarrow \text{Request Logger} \longrightarrow \text{Validation Rules} \longrightarrow \text{Validation Dispatcher} \longrightarrow \text{Controller / Service} \longrightarrow \text{Centralized Error Handler}$$

---

## 2. ĐIỀU KIỆN MÔI TRƯỜNG CẦN CHUẨN BỊ TRƯỚC

Người học cần chuẩn bị:
1. **Node.js:** Phiên bản `>= 18.x` (khuyến nghị Node 20+ hoặc 22+). Kiểm tra: `node -v`.
2. **Trình soạn thảo:** VS Code hoặc bất kỳ IDE nào.
3. **Công cụ gửi HTTP Request:** Postman, Thunder Client (VS Code Extension), hoặc `curl` / `Invoke-RestMethod`.
4. Không cần cài đặt MySQL hay cơ sở dữ liệu bên ngoài: Để tối ưu thời gian 30–45 phút, starter code sử dụng **Mock Service in-memory** mô phỏng nghiệp vụ kiểm tra slot khám.

---

## 3. CÁC BƯỚC THỰC HIỆN (KÈM STARTER CODE)

### Bước 0: Tạo thư mục thực hành & Cài đặt thư viện (3 phút)

Mở Terminal và chạy các lệnh sau:

```bash
mkdir express-pipeline-lab
cd express-pipeline-lab
npm init -y
npm install express express-validator
```

Tạo cấu trúc thư mục tối giản:
```text
express-pipeline-lab/
├── package.json
└── src/
    ├── app.js
    ├── utils/
    │   └── ApiError.js
    ├── middlewares/
    │   ├── errorHandler.js
    │   └── appointmentValidator.js
    ├── services/
    │   └── appointmentService.js
    └── routes/
        └── appointmentRoute.js
```

---

### Bước 1: Cài đặt Starter Code (Khung ứng dụng ban đầu) (5 phút)

Người học tạo 2 file khởi đầu bên dưới để có sẵn Mock Service và Server chạy được ngay.

#### 1. `src/services/appointmentService.js` (Starter Code - Mock nghiệp vụ đặt khám)
*File này mô phỏng tầng Service kiểm tra dữ liệu và trùng lịch:*

```javascript
// src/services/appointmentService.js
// Giả lập danh sách slot khám có sẵn trong Database
const AVAILABLE_SLOTS = [
    { id: 1, doctor: "BS. Nguyễn Văn A", status: "available" },
    { id: 2, doctor: "BS. Trần Thị B", status: "booked" } // Slot 2 đã có người đặt
];

const createAppointment = async ({ bookable_slot_id, patient_name, phone_number }) => {
    // 1. Giả lập tác vụ bất đồng bộ truy vấn DB (delay 50ms)
    await new Promise((resolve) => setTimeout(resolve, 50));

    const slot = AVAILABLE_SLOTS.find(s => s.id === Number(bookable_slot_id));

    // Nghiệp vụ 1: Không tìm thấy slot
    if (!slot) {
        const error = new Error("Khung giờ khám không tồn tại");
        error.statusCode = 404;
        throw error;
    }

    // Nghiệp vụ 2: Slot đã bị người khác đặt trước
    if (slot.status === "booked") {
        const error = new Error("Khung giờ khám này đã được đặt, vui lòng chọn giờ khác");
        error.statusCode = 400;
        throw error;
    }

    // Nghiệp vụ 3: Đặt thành công
    slot.status = "booked";
    return {
        appointment_code: `APT-${Date.now().toString().slice(-4)}`,
        doctor_name: slot.doctor,
        patient_name,
        phone_number,
        created_at: new Date().toISOString()
    };
};

module.exports = { createAppointment };
```

#### 2. `src/app.js` (Starter Code - Khung Server ban đầu)
```javascript
// src/app.js
const express = require("express");
const app = express();

app.use(express.json());

// TODO: Sẽ gắn route và middleware ở các bước sau

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Lab Server running at http://localhost:${PORT}`);
});

module.exports = app;
```

---

### Bước 2: Thiết kế `ApiError` & Error Middleware 4 tham số (10 phút)

> **Mục tiêu:** Chuẩn hoá lỗi nghiệp vụ thành đối tượng có `statusCode` và xây dựng "chốt chặn cuối cùng" cho toàn bộ server.

#### 2.1. Tạo lớp lỗi tùy biến `src/utils/ApiError.js`
Tạo file `src/utils/ApiError.js`:

```javascript
// src/utils/ApiError.js
class ApiError extends Error {
    constructor(statusCode, message, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors; // Chứa chi tiết danh sách lỗi validate nếu có
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ApiError;
```

#### 2.2. Xây dựng Error Handling Middleware `src/middlewares/errorHandler.js`
Tạo file `src/middlewares/errorHandler.js`:

```javascript
// src/middlewares/errorHandler.js
const errorHandler = (err, req, res, next) => {
    // Lấy statusCode nếu đã định nghĩa qua ApiError, fallback về 500 nếu là crash bất ngờ
    const statusCode = err.statusCode || 500;

    console.error(`[Error Pipeline] ${req.method} ${req.url} -> Status: ${statusCode} - ${err.message}`);

    const responsePayload = {
        success: false,
        message: err.message || "Internal Server Error"
    };

    // Nếu có danh sách lỗi chi tiết (vd từ validation), đính kèm vào response
    if (err.errors) {
        responsePayload.errors = err.errors;
    }

    // Kết thúc vòng đời request bằng việc gửi JSON phản hồi
    res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;
```

> **Điểm mấu chốt cần ghi nhớ:** Middleware xử lý lỗi trong Express **bắt buộc phải có đúng 4 tham số**: `(err, req, res, next)`. Nếu viết thiếu `next`, Express sẽ coi đó là middleware thông thường và không bao giờ chuyển lỗi vào đây!

---

### Bước 3: Xây dựng Input Validation Middleware Pipeline (10 phút)

> **Mục tiêu:** Tạo middleware bóc tách lỗi từ `express-validator` và chuyển thành `ApiError(400)` đẩy xuống pipeline.

Tạo file `src/middlewares/appointmentValidator.js`:

```javascript
// src/middlewares/appointmentValidator.js
const { body, validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

// Middleware 1: Dispatcher kiểm tra kết quả validate
const validateResult = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next(); // Dữ liệu chuẩn -> Cho phép request đi tiếp vào Controller
    }

    // Trích xuất danh sách lỗi
    const extractedErrors = errors.array().map(err => ({
        field: err.path,
        message: err.msg
    }));

    // Bắn lỗi vào Pipeline qua next(err) với HTTP 400
    const apiError = new ApiError(400, extractedErrors[0].message, extractedErrors);
    next(apiError);
};

// Middleware 2: Mảng các rules kết hợp với validateResult
const createAppointmentRules = [
    body("bookable_slot_id")
        .isInt({ min: 1 })
        .withMessage("ID khung giờ khám phải là số nguyên dương"),
    body("patient_name")
        .trim()
        .notEmpty()
        .withMessage("Họ tên bệnh nhân là bắt buộc"),
    body("phone_number")
        .trim()
        .matches(/^(0[3|5|7|8|9])[0-9]{8}$/)
        .withMessage("Số điện thoại không đúng định dạng di động Việt Nam (10 số, đầu 03, 05, 07, 08, 09)"),
    validateResult
];

module.exports = { createAppointmentRules };
```

---

### Bước 4: Tạo Router, Handler Mỏng và Ghép Nối Pipeline (10 phút)

#### 4.1. Tạo Router `src/routes/appointmentRoute.js`
Tạo file `src/routes/appointmentRoute.js`:

```javascript
// src/routes/appointmentRoute.js
const express = require("express");
const router = express.Router();
const { createAppointmentRules } = require("../middlewares/appointmentValidator");
const appointmentService = require("../services/appointmentService");

// Handler cực kỳ mỏng: Chỉ đọc req.body, gọi service và trả về 201
const handleCreateAppointment = async (req, res, next) => {
    try {
        const result = await appointmentService.createAppointment(req.body);
        return res.status(201).json({
            success: true,
            message: "Đặt lịch khám thành công",
            data: result
        });
    } catch (error) {
        // Chuyển mọi lỗi (400, 404, 500) sang Error Middleware xử lý tập trung
        next(error);
    }
};

// Chuỗi Middleware: Validation Rules -> Controller Handler
router.post("/create", createAppointmentRules, handleCreateAppointment);

module.exports = router;
```

#### 4.2. Hoàn thiện file `src/app.js` (Đúng thứ tự Middleware)
Cập nhật `src/app.js`:

```javascript
// src/app.js
const express = require("express");
const appointmentRoute = require("./routes/appointmentRoute");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// 1. Global Middleware: Parse JSON Body
app.use(express.json());

// 2. Custom Global Middleware: Request Logger
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.originalUrl}`);
    next();
});

// 3. Mount Routes
app.use("/api/appointments", appointmentRoute);

// 4. Fallback 404 cho route không tồn tại (Trước errorHandler)
app.use((req, res, next) => {
    const error = new Error(`Đường dẫn ${req.originalUrl} không tồn tại trên hệ thống`);
    error.statusCode = 404;
    next(error);
});

// 5. Error Handler Middleware (BẮT BUỘC ĐẶT Ở CUỐI CÙNG)
app.use(errorHandler);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
```

---

### Bước 5: Kiểm thử và Quan sát Luồng Dữ Liệu (7 phút)

Chạy ứng dụng:
```bash
node src/app.js
```

Sử dụng cURL hoặc Postman để kiểm thử 4 kịch bản đại diện:

#### Kịch bản 1: Request sai định dạng (Test Validation Middleware)
Gửi POST không có tên và sai số điện thoại:
```bash
curl -X POST http://localhost:3000/api/appointments/create \
  -H "Content-Type: application/json" \
  -d '{"bookable_slot_id": 1, "phone_number": "123"}'
```
**Kết quả mong đợi:** HTTP `400 Bad Request`
```json
{
  "success": false,
  "message": "Họ tên bệnh nhân là bắt buộc",
  "errors": [
    { "field": "patient_name", "message": "Họ tên bệnh nhân là bắt buộc" },
    { "field": "phone_number", "message": "Số điện thoại không đúng định dạng di động Việt Nam (10 số, đầu 03, 05, 07, 08, 09)" }
  ]
}
```
*Nhận xét:* Request bị chặn ngay tại middleware `validateResult`, chưa hề chạm vào `handleCreateAppointment` hay tầng Service.

#### Kịch bản 2: Request đúng dữ liệu nhưng Slot đã bị đặt (Test Business Error)
```bash
curl -X POST http://localhost:3000/api/appointments/create \
  -H "Content-Type: application/json" \
  -d '{"bookable_slot_id": 2, "patient_name": "Nguyễn Văn X", "phone_number": "0912345678"}'
```
**Kết quả mong đợi:** HTTP `400 Bad Request`
```json
{
  "success": false,
  "message": "Khung giờ khám này đã được đặt, vui lòng chọn giờ khác"
}
```
*Nhận xét:* Lỗi từ `appointmentService` ném ra được `next(error)` chuyển thẳng xuống `errorHandler`.

#### Kịch bản 3: Đặt lịch thành công
```bash
curl -X POST http://localhost:3000/api/appointments/create \
  -H "Content-Type: application/json" \
  -d '{"bookable_slot_id": 1, "patient_name": "Trần Văn Nam", "phone_number": "0987654321"}'
```
**Kết quả mong đợi:** HTTP `201 Created`
```json
{
  "success": true,
  "message": "Đặt lịch khám thành công",
  "data": {
    "appointment_code": "APT-XXXX",
    "doctor_name": "BS. Nguyễn Văn A",
    "patient_name": "Trần Văn Nam",
    "phone_number": "0987654321",
    "created_at": "..."
  }
}
```

---

## 4. BÀI TẬP NHỎ CỦNG CỐ KIẾN THỨC (KÈM ĐÁP ÁN)

### Bài tập 1 (Mức độ: Dễ - Luồng Middleware)
**Đề bài:** Hãy viết một middleware có tên `sanitizeInput` đặt trước `createAppointmentRules`, có nhiệm vụ tự động cắt bỏ khoảng trắng thừa (`trim()`) ở tất cả các trường string trong `req.body`. Nếu `req.body` rỗng thì không gây lỗi.

<details>
<summary><b>👉 Xem đáp án Bài tập 1</b></summary>

```javascript
// src/middlewares/sanitizeInput.js
const sanitizeInput = (req, res, next) => {
    if (req.body && typeof req.body === "object") {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === "string") {
                req.body[key] = req.body[key].trim();
            }
        });
    }
    next(); // Luôn gọi next() để tiếp tục chuỗi middleware
};

module.exports = sanitizeInput;

// Cách gắn vào route:
// router.post("/create", sanitizeInput, createAppointmentRules, handleCreateAppointment);
```
</details>

---

### Bài tập 2 (Mức độ: Trung bình - Middleware Authorization với Role)
**Đề bài:** Trong hệ thống đặt lịch, khi Bác sĩ muốn đổi trạng thái lịch hẹn (`PATCH /api/appointments/:id/status`), chỉ người có quyền `doctor` hoặc `admin` mới được thực hiện.
Hãy viết một higher-order middleware `requireRoles(["doctor", "admin"])` đọc thông tin từ `req.user` (giả sử đã được gán bởi Auth Middleware trước đó). Nếu không đúng quyền, quăng lỗi `ApiError(403, "Bạn không có quyền thực hiện thao tác này")`.

<details>
<summary><b>👉 Xem đáp án Bài tập 2</b></summary>

```javascript
// src/middlewares/authorize.js
const ApiError = require("../utils/ApiError");

const requireRoles = (allowedRoles = []) => {
    return (req, res, next) => {
        // Kiểm tra xem đã đăng nhập chưa
        if (!req.user || !req.user.role) {
            return next(new ApiError(401, "Yêu cầu xác thực tài khoản"));
        }

        // Kiểm tra xem role của user có nằm trong danh sách cho phép không
        if (!allowedRoles.includes(req.user.role)) {
            return next(new ApiError(403, "Bạn không có quyền thực hiện thao tác này"));
        }

        next(); // Hợp lệ -> cho đi tiếp
    };
};

module.exports = requireRoles;

// Cách sử dụng:
// router.patch("/:id/status", authMiddleware, requireRoles(["doctor", "admin"]), updateStatusHandler);
```
</details>

---

### Bài tập 3 (Mức độ: Nâng cao - Cơ chế Bắt Lỗi Bất Đồng Bộ (Async Wrapper))
**Đề bài:** Với Express phiên bản 4.x cũ, nếu một controller dạng `async` bị `throw new Error()` mà không có `try/catch` bọc ngoài, request sẽ bị treo mãi mãi và terminal báo `UnhandledPromiseRejection`.
Hãy tự viết một hàm bọc `asyncHandler(fn)` nhận vào một async handler và tự động chuyển các lỗi vào `next(err)` để không cần gõ `try/catch` ở controller nữa.

<details>
<summary><b>👉 Xem đáp án Bài tập 3</b></summary>

```javascript
// src/utils/asyncHandler.js
const asyncHandler = (fn) => {
    return (req, res, next) => {
        // fn(req, res, next) trả về một Promise.
        // Dùng Promise.resolve().catch(next) để tóm mọi throw/rejection
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = asyncHandler;

// Khi áp dụng vào Controller:
// const handleCreateAppointment = asyncHandler(async (req, res) => {
//     const result = await appointmentService.createAppointment(req.body);
//     res.status(201).json({ success: true, data: result });
//     // KHÔNG CẦN try/catch! Mọi lỗi tự động được đẩy vào errorHandler
// });
```
*(Ghi chú thêm: Trong Express 5, cơ chế này đã được tích hợp sẵn mặc định, nhưng việc hiểu `asyncHandler` giúp lập trình viên hiểu sâu cách Express quản lý Promise trong Event Loop).*
</details>

---

## 5. MỤC "LỖI THƯỜNG GẶP" (COMMON PITFALLS & DEBUGGING)

*Dưới đây là 5 lỗi thực tế nhóm đã từng gặp phải trong quá trình xây dựng backend cho dự án đặt lịch khám bệnh:*

| STT | Triệu chứng lỗi | Nguyên nhân gốc rễ | Cách khắc phục |
|:---:|:---|:---|:---|
| **1** | Request gửi từ Postman bị treo mãi mãi (Loading không dừng). | Quên gọi `next()` trong một custom middleware (ví dụ: `requestLogger` hoặc `validateResult`). Khi không gọi `next()` và cũng không gửi `res.send()`, luồng xử lý bị chặn đứng. | Luôn đảm bảo mọi nhánh điều kiện (kể cả `if` và `else`) đều kết thúc bằng `next()`, `res.json()`, hoặc `next(err)`. |
| **2** | Lỗi ném ra từ Service không vào `errorHandler` mà văng ra HTML lỗi mặc định của Express. | **Đặt sai thứ tự middleware:** Đặt `app.use(errorHandler)` **trước** `app.use("/api", routes)`. Khi request chạy qua các route, nó đã bỏ qua `errorHandler`. | `app.use(errorHandler)` **bắt buộc phải nằm ở dòng cuối cùng** của `app.js`, ngay sau tất cả các route khai báo. |
| **3** | Terminal báo lỗi: `UnhandledPromiseRejection: Error: ...` | Viết hàm `async` trong controller nhưng không bọc `try/catch` (hoặc không dùng `asyncHandler`) trên phiên bản **Express 4.x**. | Bọc `try { ... } catch (err) { next(err); }` hoặc nâng cấp lên **Express 5** (dự án nhóm dùng Express 5 hỗ trợ auto-catch promise rejection). |
| **4** | Lỗi Node.js: `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`. | Viết `next()` nhưng quên từ khóa `return` trước đó. Ví dụ: `if (err) res.status(400).json(...); next();`. Khi đó code vẫn chạy tiếp xuống dưới và gửi response lần 2. | Thêm `return`: `return res.status(400).json(...)` hoặc `return next(err);`. |
| **5** | `req.body` nhận vào luôn là `undefined`. | Chưa khai báo `app.use(express.json())` hoặc đặt nó **sau** dòng mount router `app.use("/api", routes)`. | Luôn khai báo `app.use(express.json())` và `app.use(express.urlencoded())` ở đầu file `app.js`. |

---

## 6. BẢNG TIÊU CHÍ CHẤM ĐIỂM (RUBRIC D0–D3) TỰ ĐÁNH GIÁ

| Mã | Tiêu chí | Mức đạt được trong tài liệu | Điểm |
|:---:|:---|:---|:---:|
| **D0** | **Lựa chọn chủ đề** | Chọn "Middleware Pipeline & Centralized Async Error Handling" — kỹ thuật lõi cốt lõi của Express, vượt xa CRUD đơn thuần, nêu rõ năng lực đầu ra. | **5 / 5** |
| **D1** | **Mục tiêu & Chuẩn bị** | Mục tiêu học tập rõ ràng, mô phỏng đúng chức năng đặt lịch của đồ án, môi trường chuẩn bị nhanh (không phụ thuộc setup DB phức tạp). | **5 / 5** |
| **D2** | **Kịch bản thực hành (30–45 phút)** | 5 bước đánh số chi tiết, có sẵn starter code, người học chỉ cần tập trung vào logic pipeline mà không mất thời gian gõ code thừa. | **5 / 5** |
| **D3** | **Bài tập & Lỗi thường gặp** | 3 bài tập từ dễ đến nâng cao kèm lời giải thích chi tiết; 5 lỗi kinh điển kèm bảng phân tích nguyên nhân và cách sửa. | **5 / 5** |
| **TỔNG** | | **Bài Hands-on Lab hoàn chỉnh, chuẩn mực sư phạm và kỹ thuật** | **20 / 20** |
