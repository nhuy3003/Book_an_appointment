# Hệ thống đặt lịch khám bệnh

Backend Express 5 + Sequelize/MySQL, frontend React (Vite).

---

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

---

## 4. Các tình huống và câu hỏi vấn đáp khi bảo vệ đồ án (Kèm cách giải quyết theo kiến trúc Entity - Repository - Service - Controller - Module)

Dưới đây là các tình huống thực tế và câu hỏi nâng cao thường được Giảng viên đặt ra khi đi thi / vấn đáp bài tập lớn, kèm theo phương án giải quyết chi tiết trong mã nguồn theo đúng chuẩn kiến trúc 5 lớp của dự án:
- **Entity / Model:** Định nghĩa schema, kiểu dữ liệu, quan hệ bảng (Sequelize).
- **Repository:** Tầng giao tiếp cơ sở dữ liệu (Database Access Object).
- **Service:** Tầng xử lý logic nghiệp vụ, giao dịch (Transaction), kiểm tra điều kiện, gửi mail, socket, xóa cache.
- **Controller:** Tiếp nhận `req`, kiểm tra dữ liệu, gọi Service và trả về response JSON qua `res`.
- **Route / Module:** Khai báo tuyến đường URL, gắn các middleware xác thực, phân quyền và validation.

---

### Tình huống 1: Tranh chấp đồng thời (Race Condition) — Hai bệnh nhân cùng bấm đặt một khung giờ (Slot) tại cùng một tích tắc

* **Câu hỏi của Giảng viên:** *"Nếu có 2 bệnh nhân cùng mở trang đặt lịch và bấm xác nhận cho cùng một slot khám (ví dụ slot 9:00 - 9:30) tại cùng một miligiây, hệ thống xử lý thế nào để không bị trùng lịch (Double Booking)?"*
* **Vấn đề kỹ thuật:** Khi đọc dữ liệu đồng thời, cả 2 request đều thấy `slot.status === 'available'`. Nếu không có cơ chế khóa, cả 2 cùng tạo `Appointment` và cùng ghi đè trạng thái slot, dẫn đến xung đột dữ liệu nghiêm trọng.
* **Cách giải quyết trong code:**

#### 1. Entity / Model (`backend/src/models/bookable_slot.js`)
Định nghĩa trạng thái slot bằng ENUM, đánh chỉ mục (Index) trên `id` và `status`:
```javascript
const BookableSlot = sequelize.define("BookableSlot", {
  doctor_id: { type: DataTypes.INTEGER, allowNull: false },
  slot_date: { type: DataTypes.DATEONLY, allowNull: false },
  start_time: { type: DataTypes.TIME, allowNull: false },
  end_time: { type: DataTypes.TIME, allowNull: false },
  status: { 
    type: DataTypes.ENUM("available", "booked", "off"), 
    defaultValue: "available" 
  }
});
```

#### 2. Repository (`backend/src/repositories/bookable_slot.repository.js`)
Sử dụng **Atomic Update** (cập nhật nguyên tử) có điều kiện hoặc **Pessimistic Locking** (`lock: transaction.LOCK.UPDATE`):
```javascript
// Cập nhật nguyên tử: Chỉ đổi sang booked nếu status hiện tại đúng là 'available'
const lockAndBookSlotAtomic = async (slotId, transaction) => {
  const [affectedRows] = await BookableSlot.update(
    { status: "booked" },
    { 
      where: { id: slotId, status: "available" }, 
      transaction 
    }
  );
  return affectedRows > 0; // True nếu giành được slot, False nếu đã bị người khác đặt trước
};
```

#### 3. Service (`backend/src/services/appointment.service.js`)
Mở Sequelize Transaction, thực hiện khóa slot trước khi tạo lịch hẹn:
```javascript
const createAppointment = async (data) => {
  const t = await sequelize.transaction();
  try {
    // 1. Giành quyền đặt slot bằng Atomic Update
    const isSlotLocked = await slotRepository.lockAndBookSlotAtomic(data.bookable_slot_id, t);
    if (!isSlotLocked) {
      throw new ApiError(400, "Khung giờ này vừa có người đặt trước, vui lòng chọn khung giờ khác!");
    }

    // 2. Tìm hoặc tạo hồ sơ bệnh nhân
    let patient = await patientRepository.findOrCreatePatient(data, t);

    // 3. Tạo cuộc hẹn mới
    const appointment = await appointmentRepository.createAppointment({
      bookable_slot_id: data.bookable_slot_id,
      patient_id: patient.id,
      reason_for_visit: data.reason_for_visit,
      status: "pending"
    }, t);

    await t.commit(); // Ghi nhận thành công vào DB

    // 4. Xóa cache và thông báo sau khi commit thành công
    invalidateDoctorCache(slot.doctor_id);
    emitToDoctor(slot.doctor_id, "appointment:new", appointment);
    return appointment;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
```

#### 4. Controller (`backend/src/controllers/appointment.controller.js`)
```javascript
const createAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentService.createAppointment(req.body);
    return response.created(res, appointment, "Đặt lịch khám thành công");
  } catch (error) {
    next(error);
  }
};
```

#### 5. Route / Module (`backend/src/routes/appointment.route.js`)
```javascript
router.post("/create", createAppointmentRules, appointmentController.createAppointment);
```

---

### Tình huống 2: Hủy lịch khám & Hoàn trả Slot tự động (Máy trạng thái FSM & Xóa Cache tức thì)

* **Câu hỏi của Giảng viên:** *"Khi bác sĩ từ chối hoặc bệnh nhân hủy lịch hẹn, làm sao đảm bảo slot khám được mở lại cho bệnh nhân khác đặt ngay lập tức và giao diện không bị cache dữ liệu cũ?"*
* **Vấn đề kỹ thuật:** Trạng thái cuộc hẹn không được chuyển tùy tiện (ví dụ: đã `completed` thì không thể `cancelled`). Khi hủy, phải hoàn trả slot thành `available` và xóa cache danh sách slot trống trong RAM.
* **Cách giải quyết trong code:**

#### 1. Entity / Model (`backend/src/models/appointment.js`)
```javascript
const Appointment = sequelize.define("Appointment", {
  appointment_code: { type: DataTypes.STRING, unique: true },
  status: {
    type: DataTypes.ENUM("pending", "confirmed", "completed", "cancelled", "missed"),
    defaultValue: "pending"
  }
});
```

#### 2. Repository (`backend/src/repositories/appointment.repository.js`)
```javascript
const updateAppointmentStatus = async (id, status, transaction = null) => {
  return await Appointment.update({ status }, { where: { id }, transaction });
};
```

#### 3. Service (`backend/src/services/appointment.service.js`)
Áp dụng mô hình **Finite State Machine (FSM)** kiểm soát luồng chuyển đổi trạng thái:
```javascript
const updateAppointmentStatus = async (appointmentId, newStatus, doctorId) => {
  const appointment = await appointmentRepository.getAppointmentDetail(appointmentId, doctorId);
  if (!appointment) throw new ApiError(404, "Không tìm thấy lịch hẹn");

  const allowedTransitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["completed", "missed"],
    cancelled: [],
    completed: [],
    missed: []
  };

  if (!allowedTransitions[appointment.status]?.includes(newStatus)) {
    throw new ApiError(400, `Không thể chuyển từ trạng thái '${appointment.status}' sang '${newStatus}'`);
  }

  // Cập nhật trạng thái cuộc hẹn
  await appointmentRepository.updateAppointmentStatus(appointmentId, newStatus);

  // Nếu hủy hoặc bỏ lỡ: Mở lại khung giờ khám cho bệnh nhân khác
  if (newStatus === "cancelled" || newStatus === "missed") {
    await slotRepository.updateSlotStatus(appointment.bookable_slot_id, "available");
    // Xóa cache RAM ngay lập tức để người khác thấy lại slot trống
    invalidateDoctorCache(appointment.BookableSlot.doctor_id);
  }

  // Gửi thông báo realtime qua Socket.io
  emitToDoctor(doctorId, "appointment:status_changed", { appointmentId, newStatus });
  return { id: appointmentId, status: newStatus };
};
```

#### 4. Controller (`backend/src/controllers/appointment.controller.js`)
```javascript
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const doctorId = req.user.id;
    const result = await appointmentService.updateAppointmentStatus(id, status, doctorId);
    return response.success(res, result, "Cập nhật trạng thái lịch hẹn thành công");
  } catch (error) {
    next(error);
  }
};
```

#### 5. Route / Module (`backend/src/routes/appointment.route.js`)
```javascript
router.patch("/:id/status", authMiddleware, appointmentController.updateAppointmentStatus);
```

---

### Tình huống 3: Thu hồi Token tức thì khi Đăng xuất / Đổi mật khẩu trong kiến trúc JWT Stateless (Single Active Session)

* **Câu hỏi của Giảng viên:** *"JWT là Stateless, không lưu session trong database. Vậy nếu bác sĩ bấm Đăng xuất hoặc Đổi mật khẩu trên điện thoại, làm sao ngăn chặn kẻ gian lấy được token cũ trên máy tính tiếp tục gọi API?"*
* **Vấn đề kỹ thuật:** Token JWT có hạn dùng (ví dụ 24h) và không thể bị sửa đổi sau khi đã ký. Nếu không có cơ chế thu hồi (Revocation), token cũ vẫn có hiệu lực cho đến khi hết hạn.
* **Cách giải quyết trong code:**

#### 1. In-Memory Store Layer (`backend/src/utils/tokenBlacklist.js` & `tokenStore.js`)
Xây dựng cơ chế lưu trữ danh sách đen và quản lý phiên đơn (Single Session) trong RAM với TTL tự động dọn dẹp:
```javascript
// tokenBlacklist.js: Danh sách token đã đăng xuất / bị thu hồi
const blacklist = new Set();

const addToBlacklist = (token) => {
  blacklist.add(token);
  // Tự động giải phóng bộ nhớ khi token hết hạn 24h
  setTimeout(() => blacklist.delete(token), 24 * 60 * 60 * 1000);
};

const isBlacklisted = (token) => blacklist.has(token);

// tokenStore.js: Quản lý phiên đơn (Chỉ cho phép 1 phiên hoạt động cùng thời điểm)
const userTokens = new Map(); // doctorId -> activeToken

const setActiveToken = (doctorId, token) => {
  const oldToken = userTokens.get(doctorId);
  if (oldToken) addToBlacklist(oldToken); // Vô hiệu hóa token phiên cũ ngay lập tức
  userTokens.set(doctorId, token);
};
```

#### 2. Service (`backend/src/services/auth.service.js`)
```javascript
const loginDoctor = async (email, password) => {
  const doctor = await doctorRepository.findDoctorByEmail(email);
  if (!doctor || !(await bcrypt.compare(password, doctor.password))) {
    throw new ApiError(401, "Email hoặc mật khẩu không chính xác");
  }

  const token = jwt.sign({ id: doctor.id, role: "doctor" }, env.jwtSecret, { expiresIn: "24h" });
  setActiveToken(doctor.id, token); // Kích hoạt phiên mới, thu hồi phiên cũ
  return { token, doctor };
};

const logoutDoctor = async (token, doctorId) => {
  addToBlacklist(token); // Đưa token hiện tại vào blacklist
  userTokens.delete(doctorId);
};

const changePassword = async (doctorId, token, oldPassword, newPassword) => {
  const doctor = await doctorRepository.findDoctorById(doctorId);
  if (!(await bcrypt.compare(oldPassword, doctor.password))) {
    throw new ApiError(400, "Mật khẩu cũ không chính xác");
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await doctorRepository.updatePassword(doctorId, hashedPassword);

  // Đổi pass thành công -> Thu hồi token hiện tại bắt đăng nhập lại
  addToBlacklist(token);
};
```

#### 3. Middleware (`backend/src/middlewares/auth.middleware.js`)
Kiểm tra token có nằm trong Blacklist trước khi cho phép đi vào Controller:
```javascript
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Yêu cầu đăng nhập"));
  }
  const token = authHeader.split(" ")[1];

  // 1. Kiểm tra Blacklist
  if (isBlacklisted(token)) {
    return next(new ApiError(401, "Phiên làm việc đã hết hạn hoặc đã đăng xuất"));
  }

  // 2. Xác thực JWT
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    return next(new ApiError(401, "Token không hợp lệ hoặc đã hết hạn"));
  }
};
```

#### 4. Controller (`backend/src/controllers/auth.controller.js`)
```javascript
const logout = async (req, res, next) => {
  try {
    await authService.logoutDoctor(req.token, req.user.id);
    return response.success(res, null, "Đăng xuất thành công");
  } catch (error) {
    next(error);
  }
};
```

#### 5. Route / Module (`backend/src/routes/auth.route.js`)
```javascript
router.post("/login", loginRules, authController.loginDoctor);
router.post("/logout", authMiddleware, authController.logout);
router.post("/change-password", authMiddleware, changePasswordRules, authController.changePassword);
```

---

### Tình huống 4: Bác sĩ xin nghỉ đột xuất (Doctor Emergency Leave) và xử lý tự động các lịch hẹn đã đặt

* **Câu hỏi của Giảng viên:** *"Nếu ngày mai bác sĩ có việc đột xuất đăng ký nghỉ phép toàn bộ ngày, hệ thống xử lý các khung giờ khám và các cuộc hẹn đã có người đặt như thế nào?"*
* **Vấn đề kỹ thuật:** Phải vô hiệu hóa toàn bộ slot của bác sĩ trong ngày đó (`status = 'off'`), đồng thời tự động hủy các lịch hẹn đã đặt kèm theo lý do, thông báo cho bệnh nhân qua email và hoàn trả trạng thái.
* **Cách giải quyết trong code:**

#### 1. Entity / Model (`backend/src/models/doctor_availability.js` & `bookable_slot.js`)
Slot khám có `status: 'off'`, Bác sĩ đăng ký ngày nghỉ trong bảng `doctor_availability` hoặc cập nhật trạng thái slot.

#### 2. Repository (`backend/src/repositories/bookable_slot.repository.js`)
```javascript
const findSlotsByDoctorAndDate = async (doctorId, slotDate, transaction) => {
  return await BookableSlot.findAll({
    where: { doctor_id: doctorId, slot_date: slotDate },
    transaction
  });
};

const updateSlotsStatusByDate = async (doctorId, slotDate, status, transaction) => {
  return await BookableSlot.update(
    { status },
    { where: { doctor_id: doctorId, slot_date: slotDate }, transaction }
  );
};
```

#### 3. Service (`backend/src/services/doctor_availability.service.js`)
```javascript
const registerDayOff = async (doctorId, leaveDate, reason) => {
  const t = await sequelize.transaction();
  try {
    // 1. Tìm tất cả slot của bác sĩ trong ngày nghỉ
    const slots = await slotRepository.findSlotsByDoctorAndDate(doctorId, leaveDate, t);
    const slotIds = slots.map(s => s.id);

    // 2. Chuyển toàn bộ slot sang trạng thái 'off'
    await slotRepository.updateSlotsStatusByDate(doctorId, leaveDate, "off", t);

    // 3. Tìm các lịch hẹn đã được đặt trên các slot này
    const affectedAppointments = await appointmentRepository.findAppointmentsBySlotIds(slotIds, t);

    // 4. Hủy các lịch hẹn và ghi nhận lý do bác sĩ nghỉ
    for (const app of affectedAppointments) {
      if (app.status === "pending" || app.status === "confirmed") {
        await appointmentRepository.updateAppointmentStatus(app.id, "cancelled", t);
        // Gửi email xin lỗi bệnh nhân (chạy background sau commit)
        sendLeaveApologyEmail(app.Patient.email, app.appointment_code, leaveDate, reason);
      }
    }

    await t.commit();
    invalidateDoctorCache(doctorId); // Xóa cache ngày khám và slot
    return { success: true, cancelledCount: affectedAppointments.length };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};
```

#### 4. Controller (`backend/src/controllers/doctor_availability.controller.js`)
```javascript
const registerDayOff = async (req, res, next) => {
  try {
    const { date, reason } = req.body;
    const result = await doctorAvailabilityService.registerDayOff(req.user.id, date, reason);
    return response.success(res, result, "Đăng ký ngày nghỉ thành công và đã xử lý các lịch hẹn liên quan");
  } catch (error) {
    next(error);
  }
};
```

#### 5. Route / Module (`backend/src/routes/doctor_availability.route.js`)
```javascript
router.post("/day-off", authMiddleware, dayOffRules, doctorAvailabilityController.registerDayOff);
```

---

### Tình huống 5: Chống Spam đặt lịch ảo và Tấn công từ chối dịch vụ (Rate Limiting & Phone Spam Check)

* **Câu hỏi của Giảng viên:** *"Bệnh nhân không cần đăng nhập vẫn đặt được lịch khám qua số điện thoại. Làm sao ngăn chặn trường hợp một đối tượng viết script tự động gọi API spam hàng trăm cuộc hẹn ảo để phá hoại?"*
* **Vấn đề kỹ thuật:** API công khai (`public endpoint`) rất dễ bị spam. Cần kiểm soát theo 2 lớp: Tầng mạng (Rate Limiting theo IP) và Tầng nghiệp vụ (Kiểm tra giới hạn số lịch hẹn chưa hoàn tất của cùng một số điện thoại).
* **Cách giải quyết trong code:**

#### 1. Middleware Layer: Giới hạn tần suất gọi API (`backend/src/middlewares/rateLimiter.js`)
Tự xây dựng bộ đếm sliding window trong RAM hoặc sử dụng middleware:
```javascript
const requestCounts = new Map(); // IP -> { count, resetTime }

const appointmentRateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 phút
  const maxRequests = 5;       // Tối đa 5 lần đặt lịch / phút / 1 IP

  const record = requestCounts.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count++;
  }

  requestCounts.set(ip, record);

  if (record.count > maxRequests) {
    return next(new ApiError(429, "Bạn thao tác quá nhanh, vui lòng thử lại sau 1 phút!"));
  }
  next();
};
```

#### 2. Repository Layer (`backend/src/repositories/appointment.repository.js`)
```javascript
const countActiveAppointmentsByPhone = async (phoneNumber) => {
  return await Appointment.count({
    include: [{
      model: Patient,
      where: { phone_number: phoneNumber }
    }],
    where: {
      status: ["pending", "confirmed"]
    }
  });
};
```

#### 3. Service Layer (`backend/src/services/appointment.service.js`)
Kiểm tra nghiệp vụ trước khi tạo lịch:
```javascript
// Trong createAppointment:
const activeCount = await appointmentRepository.countActiveAppointmentsByPhone(data.phone_number);
if (activeCount >= 3) {
  throw new ApiError(400, "Số điện thoại này hiện có 3 lịch hẹn đang chờ khám. Vui lòng hoàn thành buổi khám trước khi đặt thêm!");
}
```

#### 4. Route / Module (`backend/src/routes/appointment.route.js`)
Gắn middleware chặn rate limit trước validation và controller:
```javascript
router.post(
  "/create", 
  appointmentRateLimiter,     // 1. Chặn spam theo IP
  createAppointmentRules,     // 2. Validate dữ liệu
  appointmentController.createAppointment // 3. Thực thi nghiệp vụ
);
```

---

### Tình huống 6: Tìm kiếm, lọc và phân trang dữ liệu lớn kết hợp Caching trong RAM (Pagination & Cache Invalidation)

* **Câu hỏi của Giảng viên:** *"Khi dữ liệu cuộc hẹn lên tới hàng triệu dòng, truy vấn danh sách lịch hẹn của bác sĩ thế nào để không làm nghẽn cơ sở dữ liệu và tốc độ phản hồi nhanh nhất?"*
* **Vấn đề kỹ thuật:** Truy vấn `SELECT *` không phân trang sẽ gây tràn RAM (Out of Memory). Không đánh Index sẽ gây Full Table Scan (quét toàn bộ ổ cứng). Cần kết hợp: Database Indexing + Phân trang (`limit`, `offset`) + Cache RAM.
* **Cách giải quyết trong code:**

#### 1. Entity / Model (`backend/src/models/appointment.js`)
Tạo **Composite Index** (chỉ mục kết hợp) trong migration / schema:
```sql
ALTER TABLE `appointment` ADD INDEX `idx_doctor_slot_status` (`bookable_slot_id`, `status`);
```

#### 2. Repository (`backend/src/repositories/appointment.repository.js`)
Sử dụng `findAndCountAll` với phân trang và chỉ chọn các trường cần thiết:
```javascript
const getAppointmentsPaginated = async (doctorId, { page = 1, limit = 10, status, date }) => {
  const offset = (page - 1) * limit;
  const whereCondition = {};
  if (status) whereCondition.status = status;

  return await Appointment.findAndCountAll({
    where: whereCondition,
    include: [{
      model: BookableSlot,
      where: { 
        doctor_id: doctorId,
        ...(date ? { slot_date: date } : {})
      }
    }, {
      model: Patient,
      attributes: ["id", "full_name", "phone_number"] // Chỉ lấy trường cần dùng
    }],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["id", "DESC"]]
  });
};
```

#### 3. Service Layer (`backend/src/services/appointment.service.js`)
Tích hợp Cache RAM với cơ chế tạo key tự động và TTL:
```javascript
const getAppointmentsWithCache = async (doctorId, query) => {
  const cacheKey = `appointments:doc:${doctorId}:page:${query.page || 1}:status:${query.status || 'all'}`;
  
  // Kiểm tra cache RAM
  const cachedData = cache.get(cacheKey);
  if (cachedData) return cachedData;

  // Nếu cache miss: Truy vấn CSDL
  const result = await appointmentRepository.getAppointmentsPaginated(doctorId, query);
  
  // Lưu cache 60 giây
  cache.set(cacheKey, result, 60);
  return result;
};
```

#### 4. Controller (`backend/src/controllers/appointment.controller.js`)
```javascript
const getAppointments = async (req, res, next) => {
  try {
    const data = await appointmentService.getAppointmentsWithCache(req.user.id, req.query);
    return response.success(res, data, "Lấy danh sách lịch hẹn thành công");
  } catch (error) {
    next(error);
  }
};
```

#### 5. Route / Module (`backend/src/routes/appointment.route.js`)
```javascript
router.get("/", authMiddleware, appointmentController.getAppointments);
```

---

### Tình huống 7: Tính toàn vẹn dữ liệu khi gửi Email / Socket thất bại (Tách biệt Transaction & Asynchronous Failure Handling)

* **Câu hỏi của Giảng viên:** *"Trong hàm đặt lịch hẹn, nếu lưu DB thành công nhưng khi gọi dịch vụ gửi Gmail thông báo bị rớt mạng (Timeout / SMTP Auth Error), thì lịch hẹn có bị hủy không? Bệnh nhân có bị báo lỗi 500 không?"*
* **Vấn đề kỹ thuật:** Các thao tác phụ (Side Effects) như gửi Mail, SMS, Socket phụ thuộc vào bên thứ ba (Third-party Service). Nếu gom chung vào DB Transaction hoặc không bọc try-catch riêng, một lỗi gửi mail nhỏ sẽ làm rollback toàn bộ lịch hẹn của bệnh nhân.
* **Cách giải quyết trong code:**

#### 1. Nguyên tắc thiết kế (Decoupling Core DB & Side Effects)
* **Giao dịch cốt lõi (Core Transaction):** Tạo bệnh nhân, tạo lịch hẹn, khóa slot $\rightarrow$ Bắt buộc phải thành công trọn vẹn trong `transaction`.
* **Tác vụ thông báo phụ (Side Effects):** Gửi email, phát Socket.io $\rightarrow$ Chạy sau khi `transaction.commit()` và bọc trong khối `try-catch` riêng biệt (non-blocking).

#### 2. Triển khai trong Service (`backend/src/services/appointment.service.js`)
```javascript
const createAppointment = async (data) => {
  // GIAI ĐOẠN 1: GIAO DỊCH DATABASE BẮT BUỘC
  const t = await sequelize.transaction();
  let appointment;
  try {
    // Thao tác DB (Atomic book slot, create patient, create appointment)
    appointment = await appointmentRepository.createAppointment(appointmentData, t);
    await slotRepository.updateSlotStatus(data.bookable_slot_id, "booked", t);
    await t.commit(); // DỮ LIỆU ĐÃ AN TOÀN TRONG MYSQL
  } catch (dbError) {
    await t.rollback();
    throw dbError; // Lỗi DB mới báo lỗi về client
  }

  // GIAI ĐOẠN 2: THÔNG BÁO VÀ TIỆN ÍCH NGOẠI VI (KHÔNG ĐƯỢC CHẶN PHẢN HỒI)
  // Xóa cache RAM
  invalidateDoctorCache(slot.doctor_id);

  // Phát Socket Realtime (nếu lỗi mạng thì ghi log, không làm fail API)
  try {
    emitToDoctor(slot.doctor_id, "appointment:new", appointment);
  } catch (socketErr) {
    console.error("[Socket Error] Gửi thông báo realtime thất bại:", socketErr.message);
  }

  // Gửi Email qua SMTP (chạy ngầm, không await làm chậm response)
  sendMail(doctor.email, "Lịch hẹn mới", emailHtml).catch((mailErr) => {
    console.error("[Mail Error] Gửi mail thất bại (lỗi SMTP):", mailErr.message);
    // Có thể ghi vào bảng `failed_jobs` để worker retry gửi lại sau
  });

  return appointment; // Luôn trả kết quả thành công cho bệnh nhân
};
```

---

### Tình huống 8: Thứ tự khai báo Route và Cơ chế Xử lý lỗi tập trung trong Express 5 (Pipeline & Global Error Handler)

* **Câu hỏi của Giảng viên:** 
  1. *"Tại sao trong route appointment, dòng `router.get('/code/:code')` bắt buộc phải đặt TRƯỚC dòng `router.get('/:id')`?"*
  2. *"Cơ chế xử lý lỗi tập trung (Global Error Handling) trong Express 5 hoạt động như thế nào? Khi Service ném `throw new ApiError(404, '...')`, luồng đi của lỗi ra sao?"*
* **Cách giải quyết trong code:**

#### 1. Thứ tự Route trong Module (`backend/src/routes/appointment.route.js`)
Express quét route theo thứ tự từ trên xuống dưới:
```javascript
// ĐÚNG: Route tĩnh / cụ thể đặt TRƯỚC
router.get("/code/:code", appointmentController.getAppointmentByCode);

// Route tham số động đặt SAU
router.get("/:id", authMiddleware, appointmentController.getAppointmentDetail);
```
* **Giải thích:** Nếu đảo ngược lại, khi bệnh nhân tra cứu `GET /api/appointments/code/APT001`, Express sẽ khớp ngay vào route `/:id` với giá trị tham số `req.params.id = "code"`. Khi đó controller cố ép kiểu số nguyên để tìm trong DB sẽ gây lỗi logic hoặc trả về 404 sai nghiệp vụ.

#### 2. Luồng xử lý lỗi tập trung (Global Error Pipeline)
* **Tầng Service:** Khi có lỗi nghiệp vụ, ném lỗi kèm mã HTTP:
  ```javascript
  throw new ApiError(404, "Không tìm thấy chi tiết lịch hẹn");
  ```
* **Tầng Controller:** Bọc try-catch và đẩy lỗi sang middleware tiếp theo:
  ```javascript
  catch (error) {
    next(error); // Chuyển giao lỗi cho Global Error Handler
  }
  ```
* **Tầng Error Handler (`backend/src/middlewares/errorHandler.js`):** Middleware 4 tham số `(err, req, res, next)` đặt ở cuối cùng của `app.js`:
  ```javascript
  const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const responsePayload = {
      success: false,
      message: err.message || "Lỗi máy chủ nội bộ",
      errors: err.errors || null
    };

    if (process.env.NODE_ENV === "development") {
      responsePayload.stack = err.stack;
    }

    res.status(statusCode).json(responsePayload);
  };

  module.exports = errorHandler;
  ```
* **Tầng App (`backend/src/app.js`):**
  ```javascript
  app.use("/api", rootRouter);
  app.use(errorHandler); // Luôn đứng sau tất cả các route để tóm mọi lỗi
  ```

---

## 5. Tóm tắt nhanh bảng ánh xạ kiến trúc đồ án khi trả lời vấn đáp

| Thành phần | Vị trí thư mục | Trách nhiệm chính |
| :--- | :--- | :--- |
| **Entity / Model** | `backend/src/models/` | Định nghĩa cấu trúc bảng MySQL (Sequelize), khóa ngoại, chỉ mục (Indexes). |
| **Repository** | `backend/src/repositories/` | Thực thi các câu lệnh truy vấn dữ liệu (`findAll`, `create`, `update`, atomic lock). |
| **Service** | `backend/src/services/` | Logic nghiệp vụ, máy trạng thái (FSM), quản lý Transaction, Socket, Mail, xóa Cache RAM. |
| **Controller** | `backend/src/controllers/` | Tiếp nhận request từ Client, gọi Service, định dạng và trả về mã HTTP (`200`, `201`, `400`...). |
| **Route / Module** | `backend/src/routes/` | Khai báo URL endpoint, gắn chuỗi Middleware xác thực (`authMiddleware`) và kiểm tra dữ liệu (`validate`). |
| **Middleware & Utils** | `backend/src/middlewares/`, `backend/src/utils/` | Xử lý lỗi tập trung (`errorHandler`), quản lý Blacklist token trong RAM, mã hóa Bcrypt, kết nối Socket.io. |
