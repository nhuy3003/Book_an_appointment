# Implementation Plan — Nền tảng Backend Express

**Dự án:** Hệ thống đặt lịch khám bệnh (Book an appointment)  
**Stack:** Express 5, Sequelize, MySQL, JWT  
**Mục đích tài liệu:** mô tả *cách nhóm đã hiện thực* các yêu cầu bắt buộc phần Backend Express, kèm luồng thật và đoạn code trong repo.

---

## 0. Tổng quan triển khai

Nhóm dùng Express **không ép kiến trúc**, nên tự chọn mô hình 4 lớp:

| Lớp | Thư mục | Trách nhiệm |
|---|---|---|
| Route | `backend/src/routes/` | Khai báo URL, HTTP method, gắn middleware (auth, validate) |
| Controller | `backend/src/controllers/` | Đọc `req` (params, query, body, `req.user`), gọi service, trả JSON |
| Service | `backend/src/services/` | Nghiệp vụ: kiểm tra slot, tạo bệnh nhân, sinh mã hẹn, chuyển trạng thái |
| Repository + Model | `backend/src/repositories/`, `backend/src/models/` | Truy cập MySQL qua Sequelize |

Điểm vào ứng dụng:

- `server.js` — load `.env`, listen port, bắt `unhandledRejection`
- `app.js` — tạo `express()`, gắn **chuỗi middleware toàn cục**, mount router `/api`, đặt **error handler cuối cùng**

Chức năng thật dùng xuyên suốt tài liệu này: **bệnh nhân đặt lịch khám**  
`POST /api/appointments/create`  
(không đăng nhập; body JSON; ghi MySQL; trả 201).

---

## A. Nền tảng Backend (thuật ngữ Express)

### A.1. Luồng một request

#### A.1.1. Chuỗi middleware toàn cục (`app.js`)

Request **không** nhảy thẳng vào handler. Express chạy lần lượt `app.use(...)` theo **thứ tự khai báo**.

```javascript
// backend/src/app.js
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs, { explorer: true }));
app.use("/api", routes);

app.use(errorHandler); // luôn đặt cuối
```

| Middleware | Việc làm | Gọi `next()` hay kết thúc? |
|---|---|---|
| `cors()` | Cho phép frontend (Vite) gọi API | `next()` |
| `express.json()` | Parse body JSON → `req.body` | `next()` |
| `urlencoded` | Parse form | `next()` |
| `requestLogger` | Log method + URL | `next()` |
| `/api` router | Khớp path, vào route con | handler hoặc `next(err)` |
| `errorHandler` | 4 tham số `(err, req, res, next)` | **kết thúc** bằng `res.status().json()` |

Logger minh họa middleware 3 tham số, **phải** `next()` nếu không response sẽ treo:

```javascript
// backend/src/middlewares/requestLogger.js
const requestLogger = (req, res, next) => {
    const time = new Date().toISOString();
    console.log(`[${time}] ${req.method} ${req.originalUrl}`);
    next();
};
```

#### A.1.2. Vẽ luồng chức năng thật: đặt lịch khám

```
Client (React)
    |  POST /api/appointments/create
    |  Content-Type: application/json
    |  { bookable_slot_id, patient_name, phone_number, ... }
    v
cors  →  express.json()  →  requestLogger
    v
app.use("/api")  →  index.route  (prefix /appointments)
    v
appointment.route.js
    |  createAppointmentRules   (express-validator)
    |     thành công → next()
    |     sai schema → next(ApiError 400) ──► errorHandler
    v
appointment.controller.createAppointment
    |  chỉ lấy req.body, gọi service, trả 201
    v
appointment.service.createAppointment
    |  kiểm tra slot, tạo/cập nhật patient, tạo appointment, khóa slot
    v
repositories (Sequelize)  →  MySQL bảng appointment, patient, bookable_slot
    v
res.status(201).json({ success, message, data })
```

Nếu service `throw new ApiError(400, "Slot đã được đặt")`:

```
service throw → controller catch → next(error) → errorHandler → JSON 400
```

Với Express 5, nếu controller **không** `try/catch` mà `await` bị reject, runtime cũng đẩy lỗi vào error middleware. Nhóm vẫn `try/catch` + `next(error)` ở một số handler để kiểm soát (ví dụ đổi 404 danh sách thành mảng rỗng).

#### A.1.3. Mount router con

```javascript
// backend/src/routes/index.route.js
const router = express.Router();
router.use("/auth", authRoute);
router.use("/appointments", appointmentRoute);
router.use("/doctor", doctorRoute);
router.use("/doctor-availability", doctorAvailabilityRoute);
// ...
module.exports = router;
```

URL đầy đủ = `/api` + prefix + path file con.  
Ví dụ: `/api` + `/appointments` + `/create` = `POST /api/appointments/create`.

---

### A.2. Routing: Router, params, query, body, mã HTTP

#### A.2.1. `express.Router`

Mỗi module nghiệp vụ một file router. File appointment:

```javascript
const router = express.Router();
router.get("/", authMiddleware, appointmentController.getAppointmentsByDoctorId);
router.get("/code/:code", appointmentController.getAppointmentByCode);
router.post("/create", createAppointmentRules, appointmentController.createAppointment);
router.get("/by-status/:status", authMiddleware, appointmentController.getAppointmentsByStatus);
router.get("/date/:date", authMiddleware, appointmentController.getAppointmentsByDate);
router.patch("/:id/status", authMiddleware, appointmentController.updateAppointmentStatus);
router.get("/:id", authMiddleware, appointmentController.getAppointmentDetail);
```

**Thứ tự route tĩnh trước route động:** `/code/:code` phải khai báo **trước** `/:id`. Nếu đảo, `GET /appointments/code/APT001` sẽ bị `id = "code"` — đây cũng là ví dụ “đảo thứ tự thì kết quả đổi”.

#### A.2.2. Route params

Nằm trên path, Express gắn vào `req.params`.

- `GET /api/appointments/code/:code` → `req.params.code` (tra cứu công khai)
- `GET /api/appointments/by-status/:status` → `req.params.status`
- `PATCH /api/appointments/:id/status` → `req.params.id`
- `GET /api/doctor/:id/available-slots` → `req.params.id` (bác sĩ)

Controller lấy param:

```javascript
const getAppointmentDetail = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const doctorId = req.user.id;
    const appointment =
      await appointmentService.getAppointmentDetail(appointmentId, doctorId);
    return response.success(res, appointment, "Lấy chi tiết lịch hẹn thành công");
  } catch (error) {
    next(error);
  }
};
```

#### A.2.3. Query string

Nằm sau `?`, Express gắn vào `req.query`. Không đổi path.

- `GET /api/appointments?status=pending&date=2026-11-02`
- `GET /api/doctor/all?specialty_id=1`
- `GET /api/doctor/:id/available-slots?date=2026-11-02`

```javascript
const { status, date } = req.query;
```

#### A.2.4. Body và `express.json()`

`POST`/`PATCH`/`PUT` gửi JSON. **Bắt buộc** có `app.use(express.json())` trước route, nếu không `req.body` là `undefined`.

Đặt lịch đọc:

```javascript
const data = req.body; // bookable_slot_id, patient_name, phone_number, ...
const appointment = await appointmentService.createAppointment(data);
```

Đổi trạng thái:

```javascript
const { id } = req.params;
const { status } = req.body;
```

#### A.2.5. Mã HTTP nhóm dùng

| Mã | Khi nào | Ví dụ trong code |
|---|---|---|
| **200** | Đọc / cập nhật thành công | `response.success(res, data, message)` mặc định 200 |
| **201** | Tạo mới | `res.status(201).json(...)` khi đặt lịch |
| **400** | Validate / nghiệp vụ sai | schema express-validator; slot đã booked |
| **401** | Chưa đăng nhập / token hỏng | `authMiddleware` |
| **403** | Đúng token nhưng không phải chủ tài nguyên | sửa lịch của bác sĩ khác |
| **404** | Không tìm thấy | `ApiError(404, "Slot không tồn tại")` |
| **500** | Lỗi không gán `statusCode` | `errorHandler` fallback |

Helper JSON thành công:

```javascript
// backend/src/utils/response.js
const success = (res, data, message = "Success") => {
    return res.json({ success: true, message, data });
};
```

Tạo lịch trả **201** (Created), không dùng 200:

```javascript
return res.status(201).json({
  success: true,
  message: "Đặt lịch khám thành công",
  data: appointment
});
```

Lỗi nghiệp vụ trong service dùng class gắn `statusCode`:

```javascript
// backend/src/utils/ApiError.js
class apiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}
```

```javascript
if (slot.status === "booked") {
    throw new ApiError(400, "Slot đã được đặt");
}
if (!slot) {
    throw new ApiError(404, "Slot không tồn tại");
}
```

---

### A.3. Validation đầu vào (express-validator)

Đề bài cho phép Zod / Joi / **express-validator**. Nhóm chọn **express-validator** vì chạy như middleware Express: `(req, res, next)`, gắn ngay trên route, lỗi đưa vào `errorHandler` chung.

#### A.3.1. Schema + middleware `validate`

```javascript
// backend/src/middlewares/validate.js
const { body, validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

const validate = (req, res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();

    const errors = result.array().map((e) => ({
        field: e.path,
        message: e.msg
    }));
    const err = new ApiError(400, errors[0].message);
    err.errors = errors;
    next(err);
};

const loginRules = [
    body("email").isEmail().withMessage("Email không hợp lệ"),
    body("password").notEmpty().withMessage("Mật khẩu là bắt buộc"),
    validate
];

const createAppointmentRules = [
    body("bookable_slot_id").custom(isPositiveInt).withMessage("Khung giờ khám không hợp lệ"),
    body("phone_number").notEmpty().withMessage("Số điện thoại là bắt buộc"),
    body("patient_name").notEmpty().withMessage("Họ tên bệnh nhân là bắt buộc"),
    validate
];
```

Gắn trên route **trước** controller:

```javascript
router.post("/login", loginRules, authController.loginDoctor);
router.post("/create", createAppointmentRules, appointmentController.createAppointment);
router.post("/bulk", authMiddleware, bulkScheduleRules, doctorController.bulkCreateSchedules);
```

Luồng: các rule `body()` chạy lần lượt → `validate` đọc `validationResult` → hợp lệ thì `next()` vào controller; sai thì `next(ApiError 400)` **không** gọi service.

#### A.3.2. Định dạng lỗi 400

`errorHandler` trả:

```json
{
  "success": false,
  "message": "Số điện thoại là bắt buộc",
  "errors": [
    { "field": "phone_number", "message": "Số điện thoại là bắt buộc" }
  ]
}
```

```javascript
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const payload = {
        success: false,
        message: err.message || "Internal Server Error",
    };
    if (err.errors) payload.errors = err.errors;
    res.status(statusCode).json(payload);
};
```

Validation **không thay** kiểm tra nghiệp vụ trong service (slot booked, bác sĩ nghỉ). Schema = hình dạng dữ liệu; service = quy tắc phòng khám.

---

### A.4. Truy cập dữ liệu: ORM + schema, không lưu trong RAM

#### A.4.1. Sequelize + MySQL

Kết nối đọc từ biến môi trường:

```javascript
// backend/src/config/database.js
const sequelize = new Sequelize(
    env.dbName,
    env.dbUser,
    env.dbPassword,
    { host: env.dbHost, dialect: "mysql", logging: false }
);
```

Model map bảng `appointment`:

```javascript
const Appointment = sequelize.define("Appointment", {
    appointment_code: DataTypes.STRING,
    patient_id: DataTypes.INTEGER,
    bookable_slot_id: DataTypes.INTEGER,
    status: {
        type: DataTypes.ENUM("pending", "confirmed", "completed", "cancelled", "missed"),
        defaultValue: "pending"
    },
    // ...
}, { tableName: "appointment", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
```

Repository gọi ORM, không viết SQL rải trong controller:

```javascript
return await Appointment.findAll({
    attributes: ["id", "appointment_code", "status", "reason_for_visit", ...],
    include: [
        { model: BookableSlot, attributes: ["slot_date", "start_time", "end_time"], where: { doctor_id: doctorId } },
        { model: Patient, attributes: PATIENT_FIELDS }
    ]
});
```

Service đặt lịch: `appointmentRepository.createAppointment(...)`, `slotRepository.updateSlotStatus(..., "booked")` — dữ liệu **persist** trên MySQL. Restart server, lịch hẹn vẫn còn.

#### A.4.2. Schema (file SQL)

Nhóm quản lý schema bằng dump MySQL (XAMPP), import khi cài đặt — vai trò tương đương “có schema”, không chỉ object trong bộ nhớ.

```sql
-- backend/src/DB/datlichkham.sql
CREATE TABLE `appointment` (
  `id` int(11) NOT NULL,
  `appointment_code` varchar(50) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `bookable_slot_id` int(11) NOT NULL,
  `status` enum('pending','confirmed','completed','cancelled','missed') NOT NULL,
  ...
);
CREATE TABLE `bookable_slot` (
  `id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `slot_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `status` enum('available','booked','off') NOT NULL,
  ...
);
```

README hướng dẫn: tạo DB `datlichkhambenh` rồi import file này.

**Ghi chú thuyết trình:** phiên JWT hiện tại có `tokenStore` / blacklist **in-memory** (Map) — chỉ phiên đăng nhập. Dữ liệu nghiệp vụ (bác sĩ, slot, lịch hẹn) nằm MySQL.

---

### A.5. Cấu hình và công cụ

#### A.5.1. Biến môi trường

```javascript
// backend/src/config/env.js
require("dotenv").config();
module.exports = {
    port: process.env.PORT || 3000,
    jwtSecret: process.env.JWT_SECRET || "your_jwt_secret",
    dbHost: process.env.DB_HOST || "localhost",
    dbUser: process.env.DB_USER || "root",
    dbPassword: process.env.DB_PASSWORD || "",
    dbName: process.env.DB_NAME || "datlichkhambenh"
};
```

`server.js` gọi `dotenv` **trước** khi load `app`.

#### A.5.2. `.env.example` (backend)

```
PORT=3000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=datlichkhambenh
JWT_SECRET=your_jwt_secret
EMAIL_USER=
EMAIL_PASS=
```

File `.env` thật nằm `.gitignore`, không commit secret.

Frontend: `frontend/.env.example` → `VITE_API_BASE_URL=http://localhost:3000/api`.

#### A.5.3. npm scripts

```json
"scripts": {
  "start": "nodemon src/server.js",
  "dev": "nodemon src/server.js"
}
```

Express 5 nằm trong `dependencies`: `"express": "^5.2.1"`.

#### A.5.4. README — lệnh cài và chạy

Xem `README.md` gốc repo:

1. Import `backend/src/DB/datlichkham.sql`
2. `cd backend` → copy `.env.example` → `npm install` → `npm start`
3. `cd frontend` → copy `.env.example` → `npm install` → `npm run dev`

API `http://localhost:3000`, Swagger `http://localhost:3000/api-docs`.

---

### A.6. Cấu trúc dự án — vì sao chọn 4 lớp

Express chỉ cung cấp `app` / `Router` / middleware. Không có “Controller bắt buộc” như Nest hay Spring. Nếu viết hết SQL + nghiệp vụ trong `router.post(...)`, file phình, khó test, khó chia việc.

Nhóm tách:

1. **Route** — “URL này đi qua middleware nào, handler nào”. Không chứa `if (slot.booked)`.
2. **Controller** — biên dịch HTTP ↔ lời gọi hàm. Mỏng: vài chục dòng, không hàng trăm dòng nghiệp vụ.
3. **Service** — quy tắc phòng khám (slot trống, tạo patient theo SĐT, sinh `APT001`, chuyển `pending → confirmed`).
4. **Repository** — `findAll` / `create` / `update`, che Sequelize.

**Ví dụ cùng một chức năng đặt lịch**

Route: gắn validate + controller, không biết MySQL.

```javascript
router.post("/create", createAppointmentRules, appointmentController.createAppointment);
```

Controller (~15 dòng):

```javascript
const createAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentService.createAppointment(req.body);
    return res.status(201).json({
      success: true,
      message: "Đặt lịch khám thành công",
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};
```

Service: kiểm tra slot, patient, insert, khóa slot, thông báo — **đây mới là nghiệp vụ**.

Repository: `Appointment.create({ ...data, appointment_code: newCode })`.

Khi đổi MySQL → query khác, chỉ sửa repository. Khi đổi rule “không đặt slot off”, chỉ sửa service. Route/controller giữ nguyên.

Cây thư mục backend (rút gọn):

```
backend/src/
  app.js, server.js
  config/          env.js, database.js
  middlewares/     auth, validate, requestLogger, errorHandler
  routes/
  controllers/
  services/
  repositories/
  models/
  DB/datlichkham.sql
  utils/           ApiError, response, sendMail
```

---

## B. Cơ chế riêng của Express

### B.1. Middleware pipeline và thứ tự

#### B.1.1. Hợp đồng `(req, res, next)`

- Gọi `next()` → middleware sau (hoặc handler).
- Gọi `next(err)` → **bỏ qua** middleware 3 tham số, nhảy tới error middleware 4 tham số.
- Gọi `res.status().json()` / `res.send()` **không** `next()` → kết thúc vòng đời request.

`authMiddleware`: thiếu token thì **kết thúc 401**, không `next()` — handler phía sau không chạy. Token đúng thì gắn `req.user` rồi `next()`.

```javascript
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token required" });

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};
```

#### B.1.2. Gắn auth **trước** handler trên từng route

```javascript
router.get("/", authMiddleware, appointmentController.getAppointmentsByDoctorId);
router.patch("/:id/status", authMiddleware, appointmentController.updateAppointmentStatus);
```

Express gọi: `authMiddleware` → nếu `next()` → `getAppointmentsByDoctorId`. Controller dùng `req.user.id` — chỉ tồn tại vì auth đã chạy trước.

#### B.1.3. Ví dụ đảo thứ tự — kết quả đổi

**Đặt xác thực sau handler (sai):**

```javascript
// MINH HỌA — không dùng trong code thật
router.get("/", appointmentController.getAppointmentsByDoctorId, authMiddleware);
```

Handler chạy trước, `req.user` chưa có, hoặc dữ liệu đã trả về rồi auth mới chạy — **không bảo vệ** được API.

**Gắn `authMiddleware` cho cả `router.use()` của `/appointments` (sai với nghiệp vụ này):**

```javascript
// MINH HỌA
router.use(authMiddleware);
router.get("/code/:code", ...);
router.post("/create", ...);
```

Khi đó bệnh nhân **không đăng nhập** sẽ **không đặt lịch** và **không tra cứu mã**. Thiết kế đúng: auth **từng route** — public (`/create`, `/code/:code`) không gắn; nội bộ bác sĩ thì gắn.

**Đảo `/code/:code` và `/:id`:** tra cứu `APT001` bị hiểu thành `id`.

**Đảo `errorHandler` lên trước `app.use("/api")`:** lỗi `next(err)` từ route **không** gặp handler 4 tham số (đã đi qua rồi), dễ ra HTML 500 mặc định hoặc request treo.

Trong `app.js` nhóm **cố ý** để `errorHandler` **sau** mọi route.

---

### B.2. Xử lý lỗi bất đồng bộ tập trung

#### B.2.1. Middleware 4 tham số

Express nhận diện error middleware khi hàm có **đúng 4 đối số** `(err, req, res, next)`. Thiếu `next` trong chữ ký thì **không** phải error handler.

```javascript
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const payload = {
        success: false,
        message: err.message || "Internal Server Error",
    };
    if (err.errors) payload.errors = err.errors;
    res.status(statusCode).json(payload);
};
```

Luôn `app.use(errorHandler)` **cuối** `app.js`.

#### B.2.2. Lỗi trong hàm async đi đâu?

**Cách 1 — controller `next(error)` (nhóm dùng):**

```javascript
const createAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentService.createAppointment(req.body);
    return res.status(201).json({ success: true, message: "...", data: appointment });
  } catch (error) {
    next(error);
  }
};
```

`throw new ApiError(...)` trong service → reject promise `await` → `catch` → `next(error)` → `errorHandler` đọc `err.statusCode`.

**Cách 2 — Express 5 tự chuyển rejected promise:**  
Express 5 (`package.json`: `"express": "^5.2.1"`) nếu handler `async` reject mà không `try/catch`, framework **tự** `next(err)`. Không cần bọc thủ công như Express 4 (dễ `unhandledRejection`).

Nhóm vẫn `try/catch` ở một số chỗ vì muốn **xử lý riêng** trước khi xuống handler chung, ví dụ danh sách rỗng không muốn 404:

```javascript
} catch (error) {
  if (error.statusCode === 404) {
    return response.success(res, [], "Không có lịch hẹn nào");
  }
  next(error);
}
```

#### B.2.3. Tránh `unhandledRejection`

```javascript
// backend/src/server.js
process.on("unhandledRejection", (reason) => {
    console.error("unhandledRejection:", reason);
});
```

Kết hợp: (1) Express 5 bắt reject của handler, (2) service throw `ApiError`, (3) controller `next(error)`, (4) log process-level. Không nuốt lỗi im lặng.

Không viết `res.status(500).json` rải khắp route — `reports` / `doctor_availability` / `auth.logout` đều `next(err)` về một chỗ.

---

### B.3. Phân tách trách nhiệm: handler mỏng, nghiệp vụ ở service

#### B.3.1. Controller không chứa rule phòng khám

Controller đặt lịch **không** kiểm tra `slot.status === "booked"`. Chỉ:

1. Lấy input HTTP  
2. Gọi service  
3. Gắn mã HTTP + JSON  
4. `next(error)` khi fail  

#### B.3.2. Service chứa nghiệp vụ

```javascript
const createAppointment = async (data) => {
    const slot = await slotRepository.findSlotById(data.bookable_slot_id);
    if (!slot) throw new ApiError(404, "Slot không tồn tại");
    if (slot.status === "booked") throw new ApiError(400, "Slot đã được đặt");
    if (slot.status === "off") throw new ApiError(400, "Bác sĩ bận ngày này");

    // tìm / tạo patient theo SĐT
    // appointmentRepository.createAppointment(...)
    // slotRepository.updateSlotStatus(..., "booked")
    // notification + email
    return appointment;
};
```

Đổi trạng thái (`pending → confirmed | cancelled`, `confirmed → completed | missed`) cũng nằm service `updateAppointmentStatus`, kèm trả slot về `available` khi hủy/missed.

#### B.3.3. Vì sao không nhét hết vào route?

Một `router.post("/create", async (req, res) => { ... 200 dòng Sequelize ... })` sẽ:

- Khó unit test nghiệp vụ không cần HTTP  
- Trùng logic nếu thêm kênh khác (admin tạo hộ)  
- Trộn 400 validate với 400 “slot booked”

Tách lớp đúng tinh thần đề: *route handler mỏng, không dài hàng trăm dòng*.

---

## 3. Bảng đối chiếu đề bài ↔ code

| Yêu cầu đề | Hiện thực trong repo |
|---|---|
| Request → middleware → handler → service/data → JSON | `app.js` + `POST /appointments/create` |
| `express.Router`, params, query, body, `express.json()` | `routes/*`, `req.params` / `req.query` / `req.body` |
| Mã HTTP đúng | 200 helper, 201 create, 400 validate/nghiệp vụ, 401 auth, 404 `ApiError` |
| Validation schema + 400 | `express-validator` + `errorHandler` |
| ORM/schema, không chỉ RAM | Sequelize + `datlichkham.sql` |
| `.env`, `.env.example`, npm scripts, README | `config/env.js`, `backend/.env.example`, `package.json`, `README.md` |
| Cấu trúc tự chọn, giải thích được | Route / Controller / Service / Repository |
| Pipeline `(req,res,next)`, đảo thứ tự đổi kết quả | auth trước handler; error handler cuối; `/code/:code` trước `/:id` |
| Error middleware 4 tham số, Express 5, unhandledRejection | `errorHandler.js`, Express 5.2, `server.js` |
| Handler mỏng, nghiệp vụ service | `createAppointment` controller vs service |

---

## 4. Gợi ý slide / mục thuyết trình (2–3 phút)

1. Vẽ 1 slide luồng `POST /api/appointments/create` (mục A.1.2).  
2. Chỉ `app.js`: `express.json` trước route, `errorHandler` sau route.  
3. Chỉ route: `createAppointmentRules` rồi controller; `authMiddleware` **không** có trên `/create`, **có** trên `GET /`. Hỏi ngược: nếu gắn auth lên `/create` thì bệnh nhân đặt được không?  
4. Chỉ `validate.js` + JSON 400.  
5. Chỉ service `throw ApiError` + `next(error)` + Express 5.  
6. Kết: Express không ép MVC — nhóm **chọn** 4 lớp để tách HTTP khỏi nghiệp vụ và khỏi SQL.

---

*Tài liệu bám code hiện tại trong `backend/src`. Có thể copy nguyên vào chương Implementation / Thiết kế Backend của báo cáo.*
