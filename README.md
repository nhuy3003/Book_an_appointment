# TÌNH HUỐNG VẤN ĐÁP -- HỆ THỐNG ĐẶT LỊCH KHÁM BỆNH

**Backend:** Express.js 5 -- Sequelize -- MySQL\
**Frontend:** React (Vite)

Tài liệu tổng hợp các tình huống thực tế và câu hỏi có thể gặp khi bảo
vệ đồ án. Nội dung được gộp từ hai bộ câu hỏi, loại bỏ phần trùng lặp và
bổ sung các tình huống còn thiếu.

> Lưu ý: Các đoạn code dưới đây là ví dụ minh họa cách xử lý. Trên mỗi
> đoạn đều ghi **file cụ thể** cần viết (ví dụ
> `backend/src/services/appointment.service.js`). Khi trả lời giảng viên,
> đối chiếu đúng tên hàm và mã nguồn thật. Không nên khẳng định dự án đã
> có chức năng nếu file đó chưa triển khai. Không copy các đoạn minh họa
> vào source nếu chưa được yêu cầu.

## I. Kiến trúc và trách nhiệm từng tầng

Luồng xử lý tổng quát:

``` text
Client → Route (+ Middleware) → Controller → Service → Repository → Model → Database
```

  -----------------------------------------------------------------------
  Thành phần              Vị trí tham khảo        Trách nhiệm
  ----------------------- ----------------------- -----------------------
  Route                   `backend/src/routes/`    Khai báo URL, gắn
                          ví dụ                   middleware xác thực và
                          `appointment.route.js`  kiểm tra dữ liệu

  Middleware              `backend/src/middlewares/` Xác thực JWT, validate
                          `auth.middleware.js`,   dữ liệu, giới hạn
                          `validate.js`,          request, xử lý lỗi
                          `errorHandler.js`

  Controller              `backend/src/controllers/` Nhận `req`, lấy dữ liệu
                          `appointment.controller.js` cần thiết, gọi Service
                                                  và trả response

  Service                 `backend/src/services/`  Xử lý nghiệp vụ, kiểm
                          `appointment.service.js` tra quyền, transaction
                                                  và điều phối tác vụ

  Repository              `backend/src/repositories/` Truy vấn, thêm, sửa,
                          `appointment.repository.js`, xóa dữ liệu bằng
                          `bookable_slot.repository.js` Sequelize

  Entity / Model          `backend/src/models/`    Định nghĩa cấu trúc
                          `appointment.model.js`  bảng, kiểu dữ liệu và
                                                  quan hệ

  Database                `backend/src/DB/`        Lưu dữ liệu, khóa
                          `datlichkham.sql`       ngoại, unique, index và
                                                  bảo đảm toàn vẹn
  -----------------------------------------------------------------------

**Cách nhớ khi vấn đáp:** - Route/Middleware: request có được đi tiếp
không, dữ liệu có đúng định dạng không? - Controller: nhận request và
trả response. - Service: quyết định nghiệp vụ có được phép thực hiện
không. - Repository: truy vấn dữ liệu như thế nào? - Model/Database: dữ
liệu được cấu trúc và ràng buộc ra sao?

Module là cách nhóm các chức năng theo nghiệp vụ, không phải một tầng xử
lý độc lập trong luồng trên.

------------------------------------------------------------------------

## II. Các tình huống và câu hỏi vấn đáp

## Tình huống 1. Hai bệnh nhân cùng đặt một khung giờ (Race Condition)

**Câu hỏi:** Nếu hai bệnh nhân cùng bấm đặt một slot 09:00--09:30 gần
như đồng thời, làm sao tránh đặt trùng?

**Vấn đề:** Nếu chỉ đọc `status === "available"` rồi mới cập nhật, cả
hai request có thể cùng đọc được trạng thái `available` và cùng tạo lịch
hẹn.

**Ghi vào các file:**

-   Route nhận request: `backend/src/routes/appointment.route.js`
    (`POST /create`)
-   Controller gọi Service: `backend/src/controllers/appointment.controller.js`
    (hàm `createAppointment`)
-   Service mở transaction: `backend/src/services/appointment.service.js`
    (hàm `createAppointment`)
-   Repository khóa/cập nhật slot: `backend/src/repositories/bookable_slot.repository.js`
-   Tạo lịch: `backend/src/repositories/appointment.repository.js`
-   Model slot: `backend/src/models/bookable_slot.model.js`
-   Database InnoDB: `backend/src/DB/datlichkham.sql`

**Cách giải quyết:** - Service mở transaction cho toàn bộ thao tác đặt
lịch. - Repository khóa dòng slot bằng `SELECT ... FOR UPDATE`. - Kiểm
tra slot còn `available` hay không. - Chỉ cập nhật sang `booked` nếu
trạng thái hiện tại vẫn là `available`. - Tạo appointment trong cùng
transaction. Nếu có lỗi thì rollback.

**Repository — ghi vào `backend/src/repositories/bookable_slot.repository.js`:**

``` javascript
const findSlotByIdForUpdate = (id, transaction) =>
  BookableSlot.findByPk(id, {
    transaction,
    lock: transaction.LOCK.UPDATE
  });

const markSlotBookedIfAvailable = async (id, transaction) => {
  const [affectedRows] = await BookableSlot.update(
    { status: "booked" },
    {
      where: { id, status: "available" },
      transaction
    }
  );

  return affectedRows;
};
```

**Service — ghi vào `backend/src/services/appointment.service.js` (hàm `createAppointment`):**

``` javascript
const appointment = await sequelize.transaction(async (t) => {
  const slot = await slotRepository.findSlotByIdForUpdate(
    data.bookable_slot_id,
    t
  );

  if (!slot) throw new ApiError(404, "Không tìm thấy khung giờ");
  if (slot.status !== "available") {
    throw new ApiError(409, "Khung giờ vừa được đặt hoặc không còn khả dụng");
  }

  const affected = await slotRepository.markSlotBookedIfAvailable(slot.id, t);
  if (affected === 0) {
    throw new ApiError(409, "Khung giờ vừa được người khác đặt");
  }

  return appointmentRepository.createAppointment({
    ...data,
    status: "pending"
  }, t);
});
```

**Trả lời ngắn:** Dùng transaction kết hợp khóa dòng `FOR UPDATE` và cập
nhật có điều kiện. Request thứ hai phải chờ, sau đó kiểm tra lại trạng
thái nên không thể đặt trùng slot.

## Tình huống 2. Bác sĩ cập nhật trạng thái lịch hẹn tùy ý (Finite State Machine)

**Câu hỏi:** Vì sao không cho client gửi trạng thái bất kỳ? Nếu lịch đã
`completed` mà client gửi `cancelled` thì sao?

**Ghi vào các file:**

-   Bảng chuyển trạng thái: `backend/src/constants/appointment.constants.js`
    (`ALLOWED_STATUS_TRANSITIONS`)
-   Route + JWT: `backend/src/routes/appointment.route.js`
    (`PATCH /:id/status`)
-   Validate enum `status`: `backend/src/middlewares/validate.js`
    (`updateAppointmentStatusRules`)
-   Controller lấy `req.body.status` và `req.user.id`:
    `backend/src/controllers/appointment.controller.js`
    (hàm `updateAppointmentStatus`)
-   Máy trạng thái (chỗ quyết định thật): `backend/src/services/appointment.service.js`
    (hàm `updateAppointmentStatus`)
-   Cập nhật DB: `backend/src/repositories/appointment.repository.js`
-   Enum cột `status`: `backend/src/models/appointment.model.js`

**Cách giải quyết:** Service kiểm tra trạng thái hiện tại và trạng thái
muốn chuyển đến theo quy tắc nghiệp vụ.

**Hằng số / kiểm tra chuyển trạng thái — ghi vào `backend/src/constants/appointment.constants.js`, rồi dùng trong `backend/src/services/appointment.service.js`:**

``` javascript
const ALLOWED_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "missed", "cancelled"],
  cancelled: [],
  completed: [],
  missed: []
};

if (!ALLOWED_TRANSITIONS[appointment.status]?.includes(newStatus)) {
  throw new ApiError(400, "Không thể chuyển sang trạng thái này");
}
```

-   Route/express-validator chỉ kiểm tra `status` có thuộc danh sách hợp
    lệ hay không.
-   Service kiểm tra chuyển đổi trạng thái có hợp lệ theo nghiệp vụ
    không.
-   Repository thực hiện cập nhật dữ liệu.

**Trả lời ngắn:** Client chỉ gửi trạng thái muốn cập nhật. Service mới
là nơi quyết định trạng thái đó có được phép chuyển hay không.

## Tình huống 3. Hủy lịch hẹn và mở lại slot

**Câu hỏi:** Khi bệnh nhân hủy lịch, làm sao mở lại slot cho người khác?
Nếu cập nhật appointment thành công nhưng cập nhật slot thất bại thì
sao?

**Ghi vào các file:**

-   Route bác sĩ đổi trạng thái: `backend/src/routes/appointment.route.js`
    (`PATCH /:id/status`)
-   Route bệnh nhân hủy theo mã: `backend/src/routes/appointment.route.js`
    (`POST /code/:code/cancel`)
-   Controller: `backend/src/controllers/appointment.controller.js`
    (hàm `updateAppointmentStatus` hoặc `cancelAppointmentByCode`)
-   Transaction hủy + mở slot: `backend/src/services/appointment.service.js`
-   Cập nhật lịch: `backend/src/repositories/appointment.repository.js`
    (hàm `updateAppointmentStatus`)
-   Mở lại slot: `backend/src/repositories/bookable_slot.repository.js`
    (hàm `updateSlotStatus`)
-   Xóa cache sau commit: `backend/src/services/doctor.service.js`
    (hàm `invalidateDoctorCache`, gọi từ appointment.service)

**Cách giải quyết:** Cập nhật appointment và slot trong cùng
transaction. Nếu một thao tác thất bại thì rollback cả hai.

**Service — ghi vào `backend/src/services/appointment.service.js`:**

``` javascript
await sequelize.transaction(async (t) => {
  const appointment = await appointmentRepository
    .getAppointmentDetail(appointmentId, t);

  if (!appointment) {
    throw new ApiError(404, "Không tìm thấy lịch hẹn");
  }

  // Kiểm tra trạng thái hiện tại trước khi hủy
  await appointmentRepository.updateAppointmentStatus(
    appointmentId,
    "cancelled",
    t
  );

  await slotRepository.updateSlotStatus(
    appointment.bookable_slot_id,
    "available",
    t
  );
});
```

Sau khi transaction thành công, xóa cache liên quan để giao diện cập
nhật slot mới.

**Trả lời ngắn:** Appointment và slot phải được cập nhật trong cùng
transaction để tránh trường hợp lịch đã hủy nhưng slot vẫn bị khóa.

## Tình huống 4. Bác sĩ A xem hoặc sửa lịch của bác sĩ B (Authorization)

**Câu hỏi:** Bác sĩ đã đăng nhập có thể xem tất cả lịch hẹn không? Làm
sao kiểm tra lịch thuộc bác sĩ nào?

**Ghi vào các file:**

-   Route gắn JWT: `backend/src/routes/appointment.route.js`
-   Middleware xác thực: `backend/src/middlewares/auth.middleware.js`
    (gán `req.user = { id, role }`)
-   Controller lấy `doctorId` từ token: `backend/src/controllers/appointment.controller.js`
    (hàm `getAppointmentDetail`, `updateAppointmentStatus`)
-   Kiểm tra quyền sở hữu: `backend/src/services/appointment.service.js`
-   Lọc theo `bookable_slot.doctor_id`: `backend/src/repositories/appointment.repository.js`
    (hàm `getAppointmentDetail`, `listAppointmentsByDoctor`, `buildDoctorSlotInclude`)
-   Quan hệ Model: `backend/src/models/appointment.model.js` và
    `backend/src/models/bookable_slot.model.js`

**Cách giải quyết:** - Route dùng `authMiddleware` để xác thực người
dùng. - Controller lấy `doctorId` từ `req.user.id`, không tin
`doctor_id` do client gửi. - Repository lọc lịch thông qua quan hệ
`appointment.bookable_slot_id` → `bookable_slot.doctor_id`. - Service
kiểm tra quyền sở hữu và trả lỗi phù hợp.

**Service — ghi vào `backend/src/services/appointment.service.js` (hàm `getAppointmentDetail` / `updateAppointmentStatus`):**

``` javascript
const appointment = await appointmentRepository.getAppointmentDetail(
  appointmentId,
  doctorId
);

if (!appointment) {
  throw new ApiError(404, "Không tìm thấy lịch hẹn");
}
```

Nếu cần phân biệt lịch không tồn tại và lịch thuộc bác sĩ khác, có thể
truy vấn thêm theo ID để trả 404 hoặc 403 phù hợp.

**Trả lời ngắn:** Đăng nhập không đồng nghĩa với có quyền xem mọi dữ
liệu. Phải lọc lịch theo `doctor_id` lấy từ token.

## Tình huống 5. Dữ liệu đầu vào thiếu, sai định dạng hoặc ngày khám trong quá khứ

**Câu hỏi:** Nếu client không gửi `bookable_slot_id`, gửi số điện thoại
sai hoặc chọn ngày khám đã qua thì xử lý ở đâu?

**Cách giải quyết:** Chia thành hai nhóm kiểm tra:

1.  **Route/Middleware:** kiểm tra dữ liệu đầu vào như trường bắt buộc,
    kiểu dữ liệu, email, số điện thoại.
2.  **Service:** kiểm tra điều kiện nghiệp vụ như slot tồn tại, slot còn
    trống, ngày giờ khám chưa qua.

**Ghi vào các file:**

-   Gắn rule vào route: `backend/src/routes/appointment.route.js`
    (`createAppointmentRules` trên `POST /create`)
-   Kiểm tra thiếu field / sai kiểu: `backend/src/middlewares/validate.js`
-   Ngày quá khứ, slot booked/off: `backend/src/services/appointment.service.js`
    (hàm `createAppointment`)
-   Đọc `slot_date` từ DB: `backend/src/repositories/bookable_slot.repository.js`
-   So sánh ngày: `backend/src/utils/dateHelper.js` (`todayStr`, `nowTimeStr`)

**Validate — ghi vào `backend/src/middlewares/validate.js` (`createAppointmentRules`):**

``` javascript
body("bookable_slot_id").notEmpty().isInt({ min: 1 });
body("phone_number").notEmpty();
body("patient_name").notEmpty();
```

**Kiểm tra ngày quá khứ — ghi vào `backend/src/services/appointment.service.js`:**

``` javascript
if (slot.slot_date < today) {
  throw new ApiError(400, "Không thể đặt lịch trong quá khứ");
}
```

**Trả lời ngắn:** Middleware kiểm tra định dạng dữ liệu; Service kiểm
tra điều kiện nghiệp vụ.

## Tình huống 6. Bác sĩ A không được đặt lịch thay cho bác sĩ B bằng cách gửi `doctor_id`

**Câu hỏi:** Nếu client tự sửa request và gửi `doctor_id` của bác sĩ
khác thì sao?

**Ghi vào các file:**

-   Body đặt lịch không dùng `doctor_id`: `backend/src/routes/appointment.route.js`
    và `backend/src/middlewares/validate.js`
-   Lấy bác sĩ từ slot: `backend/src/services/appointment.service.js`
    (hàm `createAppointment`)
-   Đọc slot: `backend/src/repositories/bookable_slot.repository.js`
    (hàm `findSlotById` / `findSlotByIdForUpdate`)
-   Cột `doctor_id` thuộc bảng slot: `backend/src/models/bookable_slot.model.js`,
    `backend/src/DB/datlichkham.sql`

**Cách giải quyết:** Không lấy `doctor_id` từ body để quyết định bác sĩ
của lịch hẹn. Hệ thống phải truy vấn slot theo `bookable_slot_id`, sau
đó lấy `doctor_id` từ bản ghi slot trong database.

**Service — ghi vào `backend/src/services/appointment.service.js`:**

``` javascript
const slot = await slotRepository.findById(data.bookable_slot_id);

if (!slot) throw new ApiError(404, "Không tìm thấy khung giờ");

const doctorId = slot.doctor_id;
```

**Trả lời ngắn:** Bác sĩ phụ trách được xác định từ slot trong database,
không tin `doctor_id` do client gửi lên.

## Tình huống 7. Mã lịch hẹn bị trùng (Unique Constraint)

**Câu hỏi:** Nếu hai lịch hẹn được tạo cùng lúc và sinh ra cùng
`appointment_code` thì sao?

**Ghi vào các file:**

-   Unique trên Model: `backend/src/models/appointment.model.js`
    (cột `appointment_code`)
-   Unique trên Database: `backend/src/DB/datlichkham.sql`
    (`UNIQUE` cho `appointment_code`)
-   Sinh mã sau khi insert (`APT` + id): `backend/src/repositories/appointment.repository.js`
    (hàm `createAppointment`)

**Cách giải quyết:** - Tạo mã lịch hẹn theo cách hạn chế trùng, ví dụ
dựa trên ID sau khi insert hoặc dùng mã ngẫu nhiên đủ dài. - Đặt ràng
buộc `UNIQUE` cho cột `appointment_code` trong database. - Nếu phát sinh
lỗi trùng mã, xử lý và tạo lại mã theo thiết kế.

**Model — ghi vào `backend/src/models/appointment.model.js`:**

``` javascript
appointment_code: {
  type: DataTypes.STRING,
  unique: true
}
```

**Trả lời ngắn:** Không chỉ kiểm tra trùng ở code. Cần có ràng buộc
UNIQUE ở database để bảo vệ dữ liệu.

## Tình huống 8. Gửi email hoặc Socket thất bại sau khi tạo lịch

**Câu hỏi:** Nếu lưu lịch hẹn thành công nhưng Gmail hoặc Socket bị lỗi
thì lịch có bị hủy không?

**Ghi vào các file:**

-   Transaction đặt lịch + gửi mail sau commit: `backend/src/services/appointment.service.js`
    (hàm `createAppointment`)
-   Hàm gửi Gmail: `backend/src/utils/sendMail.js`
-   Socket realtime: `backend/src/utils/socket.js` (`emitToDoctor`)
-   Thông báo insystem: `backend/src/services/notification.service.js`

**Cách giải quyết:** - Transaction chỉ bao gồm các thao tác dữ liệu cốt
lõi: khóa slot, tạo bệnh nhân và tạo appointment. - Commit transaction
trước. - Email, Socket và thông báo là tác vụ phụ, xử lý riêng sau
commit. - Nếu gửi thất bại thì ghi log hoặc đưa vào hàng đợi để thử gửi
lại; không rollback lịch đã tạo.

**Service — ghi vào `backend/src/services/appointment.service.js` (sau khi transaction commit):**

``` javascript
const appointment = await sequelize.transaction(async (t) => {
  // Khóa slot và tạo appointment trong transaction
  return appointmentRepository.createAppointment(data, t);
});

// Tác vụ phụ sau commit
try {
  await sendMail(email, subject, html);
} catch (error) {
  console.error("Gửi email thất bại:", error.message);
}

return appointment;
```

**Trả lời ngắn:** Email/Socket không phải dữ liệu cốt lõi của việc đặt
lịch. Lỗi thông báo không được làm mất lịch hẹn đã lưu thành công.

## Tình huống 9. Danh sách có nhiều dữ liệu -- phân trang và lọc

**Câu hỏi:** Nếu hệ thống có hàng nghìn hoặc hàng triệu lịch hẹn, có nên
lấy toàn bộ dữ liệu rồi trả về frontend không?

**Ghi vào các file:**

-   Query `?page=&limit=&status=&date=`: `backend/src/routes/appointment.route.js`
    (`GET /`)
-   Validate query: `backend/src/middlewares/validate.js`
    (`listAppointmentQueryRules`)
-   Parse `page`/`limit`: `backend/src/utils/pagination.js`
    và `backend/src/constants/appointment.constants.js` (`DEFAULT_LIMIT`, `MAX_LIMIT`)
-   Controller chuyển query: `backend/src/controllers/appointment.controller.js`
    (hàm `getAppointmentsByDoctorId`)
-   Service gọi list: `backend/src/services/appointment.service.js`
    (hàm `listAppointments`)
-   `findAndCountAll` + `limit`/`offset` + lọc: `backend/src/repositories/appointment.repository.js`
    (hàm `listAppointmentsByDoctor`)

**Cách giải quyết:** - Phân trang bằng `limit` và `offset`. - Lọc theo
trạng thái, ngày khám ngay trong truy vấn database. - Chỉ lấy các trường
cần thiết. - Giới hạn `limit` tối đa để client không yêu cầu quá nhiều
dữ liệu.

**Repository — ghi vào `backend/src/repositories/appointment.repository.js` (kết hợp parse page ở `backend/src/services/appointment.service.js` hoặc `backend/src/utils/pagination.js`):**

``` javascript
const page = Math.max(Number(query.page) || 1, 1);
const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);
const offset = (page - 1) * limit;

const result = await Appointment.findAndCountAll({
  where: query.status ? { status: query.status } : {},
  limit,
  offset,
  order: [["id", "DESC"]],
  distinct: true
});
```

**Trả lời ngắn:** Phân trang và lọc ngay tại database giúp giảm dữ liệu
trả về, giảm tải server và tăng tốc độ phản hồi.

## Tình huống 10. Bác sĩ nghỉ ngày hoặc tắt mẫu lịch khi đã có người đặt

**Câu hỏi:** Nếu bác sĩ đăng ký nghỉ một ngày nhưng đã có bệnh nhân đặt
lịch thì hệ thống xử lý thế nào?

**Ghi vào các file:**

-   Route nghỉ ngày: `backend/src/routes/doctor_availability.route.js`
    (`PATCH /day-off`)
-   Route tắt/xóa mẫu lịch: `backend/src/routes/doctor_availability.route.js`
    (`PATCH /:idCalendar/disable`, `DELETE /:idCalendar`)
-   Controller: `backend/src/controllers/doctor_availability.controller.js`
    (hàm `setDayOff`, `disableSchedule`, `deleteSchedule`)
-   Nghiệp vụ nghỉ ngày / không xóa booked: `backend/src/services/doctor_availability.service.js`
    (hàm `setDayOff`, `deleteSchedule`, `disableSchedule`)
-   Update slot chưa đặt: `backend/src/repositories/bookable_slot.repository.js`
    (hàm `updateUnbookedSlotsByDate`, `deleteUnbookedSlotsByAvailabilityFrom`,
    `countBookedByAvailability`)
-   Lịch còn lại trong ngày: `backend/src/repositories/appointment.repository.js`
    (hàm `getActiveAppointmentsByDoctorAndDate`)
-   FK CASCADE: `backend/src/DB/datlichkham.sql`

**Cách giải quyết an toàn:** - Chỉ chuyển các slot `available` sang
`off`. - Không xóa slot `booked`. - Không tự động hủy các appointment đã
có người đặt nếu chưa có quy trình xử lý và xác nhận riêng. - Trả về
danh sách hoặc số lượng lịch bị ảnh hưởng để bác sĩ/bộ phận phụ trách xử
lý riêng. - Nếu tắt mẫu lịch, cần kiểm tra slot đã đặt trước khi xóa;
tránh xóa dây chuyền làm mất lịch hẹn.

**Repository / Service — ghi vào `backend/src/repositories/bookable_slot.repository.js` (gọi từ `backend/src/services/doctor_availability.service.js`, hàm `setDayOff`):**

``` javascript
await BookableSlot.update(
  { status: "off" },
  {
    where: {
      doctor_id: doctorId,
      slot_date: leaveDate,
      status: "available"
    },
    transaction: t
  }
);
```

Nếu cần hủy lịch đã đặt, phải có nghiệp vụ riêng: xác định các
appointment bị ảnh hưởng, cập nhật trạng thái hợp lệ trong transaction,
lưu lý do và thông báo cho bệnh nhân sau commit.

**Trả lời ngắn:** Chỉ tắt slot chưa có người đặt. Slot `booked` và lịch
hẹn hiện có phải được giữ lại để xử lý riêng, tránh làm mất lịch của
bệnh nhân.

## Tình huống 11. Token hết hạn hoặc đăng nhập trên thiết bị khác

**Câu hỏi:** JWT hết hạn thì hệ thống xử lý thế nào? Nếu bác sĩ đăng
nhập trên máy khác thì token cũ có còn sử dụng được không?

**Ghi vào các file:**

-   Gắn JWT trên route: `backend/src/routes/auth.route.js` và
    `backend/src/routes/appointment.route.js`
-   Verify JWT, hết hạn, token máy khác: `backend/src/middlewares/auth.middleware.js`
-   Ký token khi login (`expiresIn`): `backend/src/services/auth.service.js`
-   Một phiên / token hiện tại: `backend/src/utils/tokenStore.js`
-   Secret JWT: `backend/src/config/env.js`

**Cách giải quyết:** - JWT được ký với thời gian hết hạn, ví dụ
`expiresIn: "24h"`. - Middleware dùng `jwt.verify()` để kiểm tra chữ ký
và thời hạn. - Nếu token hết hạn hoặc không hợp lệ, trả về 401. - Nếu dự
án chỉ cho phép một phiên đăng nhập, có thể lưu token đang hoạt động
theo user và từ chối token cũ.

**Trả lời ngắn:** Middleware xác thực token ở mỗi request. Token hết hạn
hoặc không hợp lệ sẽ bị từ chối; chính sách một phiên cần thêm cơ chế
lưu phiên đang hoạt động.

## Tình huống 12. Thu hồi token ngay khi đăng xuất hoặc đổi mật khẩu

**Câu hỏi:** JWT là stateless, vậy sau khi đăng xuất hoặc đổi mật khẩu
làm sao ngăn token cũ tiếp tục gọi API?

**Ghi vào các file:**

-   Blacklist token: `backend/src/utils/tokenBlacklist.js`
    (`addToBlacklist` / `hasToken`)
-   Kiểm tra blacklist mỗi request: `backend/src/middlewares/auth.middleware.js`
-   Logout đưa token vào blacklist: `backend/src/services/auth.service.js`
    và `backend/src/controllers/auth.controller.js`
-   Route logout: `backend/src/routes/auth.route.js`

**Cách giải quyết:** Có thể dùng blacklist hoặc cơ chế version/session
để thu hồi token. Với blacklist, middleware kiểm tra token đã bị thu hồi
trước khi cho request đi tiếp.

**Blacklist — ghi vào `backend/src/utils/tokenBlacklist.js`:**

``` javascript
const blacklist = new Set();

const addToBlacklist = (token) => {
  blacklist.add(token);
};

const isBlacklisted = (token) => blacklist.has(token);
```

**Kiểm tra blacklist — ghi vào `backend/src/middlewares/auth.middleware.js`:**

``` javascript
if (isBlacklisted(token)) {
  return next(new ApiError(401, "Phiên làm việc đã bị thu hồi"));
}
```

Khi logout hoặc đổi mật khẩu thành công, đưa token hiện tại vào
blacklist. Nếu muốn thu hồi tất cả token của người dùng, cần cơ chế quản
lý phiên hoặc token version theo user.

**Lưu ý:** Lưu blacklist bằng `Set` trong RAM chỉ phù hợp minh họa hoặc
hệ thống chạy một tiến trình. Dữ liệu sẽ mất khi restart và không đồng
bộ giữa nhiều server. Hệ thống triển khai thực tế nên dùng Redis hoặc
database có TTL/cơ chế quản lý phiên.

**Trả lời ngắn:** JWT tự nó không thu hồi được sau khi phát hành. Cần
blacklist hoặc quản lý phiên/token version để middleware từ chối token
đã bị thu hồi.

## Tình huống 13. Chống spam đặt lịch (Rate Limiting)

**Câu hỏi:** Nếu người dùng viết script gọi API đặt lịch hàng trăm lần
thì hệ thống ngăn chặn thế nào?

**Ghi vào các file:**

-   Middleware giới hạn request: tạo/ghi vào
    `backend/src/middlewares/appointmentRateLimiter.js`
    (dự án có thể chưa có file này — đây là vị trí nên đặt)
-   Gắn trước controller đặt lịch: `backend/src/routes/appointment.route.js`
    (`POST /create`)
-   Kiểm tra số lịch đang hoạt động theo SĐT (nếu có): `backend/src/services/appointment.service.js`
    + `backend/src/repositories/appointment.repository.js`

**Cách giải quyết:** - Giới hạn số request theo IP trong một khoảng thời
gian. - Có thể kiểm tra thêm số lịch `pending` hoặc `confirmed` theo số
điện thoại. - Đặt middleware rate limit trước controller.

**Middleware — ghi vào `backend/src/middlewares/appointmentRateLimiter.js`:**

``` javascript
const requestCounts = new Map();

const appointmentRateLimiter = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 5;

  let record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
  } else {
    record.count += 1;
  }

  requestCounts.set(ip, record);

  if (record.count > maxRequests) {
    return next(new ApiError(429, "Bạn thao tác quá nhanh, vui lòng thử lại sau"));
  }

  next();
};
```

**Gắn middleware — ghi vào `backend/src/routes/appointment.route.js`:**

``` javascript
router.post(
  "/create",
  appointmentRateLimiter,
  createAppointmentRules,
  appointmentController.createAppointment
);
```

**Lưu ý:** Bộ đếm `Map` trong RAM chỉ mang tính minh họa; production nên
dùng giải pháp rate limit có store dùng chung nếu chạy nhiều instance.
Cần cấu hình `trust proxy` đúng nếu ứng dụng chạy sau reverse proxy.

**Trả lời ngắn:** Dùng Rate Limiting để giới hạn request theo IP và có
thể kết hợp kiểm tra số lịch đang hoạt động theo số điện thoại.

## Tình huống 14. Xóa cache sau khi đặt hoặc hủy lịch

**Câu hỏi:** Nếu hệ thống cache danh sách slot trống, sau khi có người
đặt hoặc hủy lịch thì làm sao tránh hiển thị dữ liệu cũ?

**Ghi vào các file:**

-   Gọi xóa cache sau commit đặt/hủy: `backend/src/services/appointment.service.js`
-   Hàm xóa cache theo bác sĩ: `backend/src/services/doctor.service.js`
    (`invalidateDoctorCache`)
-   Store cache: `backend/src/utils/cache.js`

**Cách giải quyết:** - Sau khi transaction đặt lịch thành công, xóa
cache slot của bác sĩ/ngày liên quan. - Sau khi hủy lịch thành công và
mở lại slot, cũng xóa cache. - Không xóa cache trước khi transaction
commit, tránh trường hợp transaction rollback nhưng cache đã bị xóa
không cần thiết.

**Service — ghi vào `backend/src/services/appointment.service.js` (sau `sequelize.transaction`), hàm xóa cache nằm ở `backend/src/services/doctor.service.js`:**

``` javascript
await sequelize.transaction(async (t) => {
  // Cập nhật appointment và slot
});

// Chỉ xóa cache sau khi transaction thành công
invalidateDoctorCache(doctorId);
```

**Trả lời ngắn:** Xóa cache sau khi dữ liệu database được commit để
frontend lấy được trạng thái slot mới nhất.

## Tình huống 15. Optimistic Locking và Pessimistic Locking khác nhau thế nào?

**Câu hỏi:** Hai cách khóa dữ liệu này khác nhau ra sao? Đồ án nên dùng
cách nào khi hai người đặt cùng slot?

**Ghi vào các file (Pessimistic — đồ án đang minh họa cách này):**

-   `SELECT ... FOR UPDATE`: `backend/src/repositories/bookable_slot.repository.js`
    (hàm `findSlotByIdForUpdate`)
-   `UPDATE ... WHERE status = 'available'`: cùng file
    (hàm `markSlotBookedIfAvailable`)
-   Mở transaction: `backend/src/services/appointment.service.js`
-   Engine InnoDB: `backend/src/DB/datlichkham.sql`
-   Kết nối Sequelize: `backend/src/config/database.js`

Optimistic locking (nếu thầy hỏi “viết thì để đâu”): thêm cột `version`
vào `backend/src/models/bookable_slot.model.js` và điều kiện `where: { id, version }`
trong repository; **không bắt buộc có trong đồ án**.

**Cách giải quyết:** - **Pessimistic Locking:** khóa dòng dữ liệu khi
transaction đang xử lý, ví dụ `SELECT ... FOR UPDATE`. Request khác phải
chờ khóa được giải phóng. - **Optimistic Locking:** không khóa ngay từ
đầu, dùng cột version hoặc điều kiện cập nhật để phát hiện dữ liệu đã bị
thay đổi.

Với tình huống hai người cùng đặt một slot, có thể dùng Pessimistic
Locking kết hợp transaction trong MySQL/InnoDB.

**Trả lời ngắn:** Pessimistic Locking khóa dòng khi xử lý; Optimistic
Locking kiểm tra xung đột khi cập nhật. Với đặt slot, `FOR UPDATE` là
cách dễ giải thích và phù hợp cho tình huống tranh chấp.

## Tình huống 16. Vì sao không đặt UNIQUE cho `appointment.bookable_slot_id`?

**Câu hỏi:** Nếu một slot chỉ được một bệnh nhân đặt, tại sao không đặt
UNIQUE cho `bookable_slot_id` trong bảng appointment?

**Đối chiếu file (không thêm UNIQUE `bookable_slot_id`):**

-   Schema appointment: `backend/src/DB/datlichkham.sql`
    (cột `bookable_slot_id` chỉ là FK, không UNIQUE)
-   Model: `backend/src/models/appointment.model.js`
-   Trạng thái slot (`available` / `booked`): `backend/src/models/bookable_slot.model.js`
    và `backend/src/repositories/bookable_slot.repository.js`

**Giải thích:** Nếu hệ thống lưu lại các lịch đã hủy để phục vụ lịch sử,
nhiều dòng appointment có thể cùng tham chiếu một slot qua các lần đặt
khác nhau. Đặt UNIQUE trực tiếp sẽ ngăn việc tạo lịch mới sau khi lịch
cũ đã hủy.

Có thể quản lý trạng thái đặt chỗ ở bảng `bookable_slot`, kết hợp
transaction và cập nhật có điều kiện. Ràng buộc cụ thể cần phù hợp với
thiết kế dữ liệu thực tế.

**Trả lời ngắn:** Vì lịch đã hủy vẫn có thể được lưu để tra cứu lịch sử.
Không nên đặt UNIQUE đơn giản trên `bookable_slot_id` nếu thiết kế cho
phép đặt lại slot sau khi hủy.

## Tình huống 17. Không tìm thấy dữ liệu: trả 404 hay 200 với mảng rỗng?

**Câu hỏi:** Khi bác sĩ chưa có lịch hẹn nào, API nên trả 404 hay trả
danh sách rỗng?

**Ghi vào các file:**

-   Danh sách rỗng → 200: `backend/src/controllers/appointment.controller.js`
    (hàm `getAppointmentsByDoctorId`) và
    `backend/src/services/appointment.service.js` (hàm `listAppointments`)
-   Chi tiết không có → 404: `backend/src/services/appointment.service.js`
    (hàm `getAppointmentDetail`, `getAppointmentByCode`)
-   Format JSON: `backend/src/utils/response.js`

**Cách giải quyết:** - Với API lấy danh sách, thường trả `200 OK` và
mảng rỗng nếu không có dữ liệu. - Với API lấy chi tiết một bản ghi theo
ID, nếu không tồn tại thì trả `404 Not Found`.

**Ví dụ response — Controller trả qua `backend/src/utils/response.js`:**

``` json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

**Trả lời ngắn:** Danh sách không có dữ liệu thì trả 200 với mảng rỗng;
truy vấn một bản ghi không tồn tại thì trả 404.

## Tình huống 18. Thứ tự khai báo Route trong Express

**Câu hỏi:** Vì sao route cụ thể như `/code/:code` nên đặt trước route
động `/:id`?

**Ghi vào file:** `backend/src/routes/appointment.route.js`
(các route tĩnh `/code/:code`, `/create`, `/by-status/:status` phải đứng
trước `/:id` và `/:id/status`).

**Giải thích:** Express kiểm tra các route theo thứ tự khai báo. Nếu
route `/:id` đứng trước, request `/code/APT001` có thể khớp với route
động ở segment đầu tiên, khiến `req.params.id` nhận giá trị `"code"`.

**Route — ghi vào `backend/src/routes/appointment.route.js`:**

``` javascript
// Route cụ thể đặt trước
router.get("/code/:code", appointmentController.getAppointmentByCode);

// Route động đặt sau
router.get("/:id", appointmentController.getAppointmentDetail);
```

**Trả lời ngắn:** Đặt route cụ thể trước route động để tránh route tổng
quát bắt nhầm request.

## Tình huống 19. Global Error Handler trong Express 5

**Câu hỏi:** Khi Service ném `ApiError(404, "...")`, lỗi đi qua những
tầng nào và được trả về client ra sao?

**Ghi vào các file:**

-   Class lỗi: `backend/src/utils/apiError.js`
-   `throw new ApiError(...)` trong Service: `backend/src/services/appointment.service.js`
-   `next(error)` trong Controller: `backend/src/controllers/appointment.controller.js`
-   Global handler: `backend/src/middlewares/errorHandler.js`
-   `app.use(errorHandler)` đặt cuối: `backend/src/app.js`
-   Gắn route gốc: `backend/src/routes/index.route.js`

**Luồng xử lý:** 1. Service phát sinh lỗi bằng `throw`. 2. Controller
chuyển lỗi bằng `next(error)` nếu đang dùng `try-catch`. 3. Global Error
Handler nhận lỗi và tạo response JSON. 4. Middleware xử lý lỗi phải được
khai báo sau các route.

**Error handler — ghi vào `backend/src/middlewares/errorHandler.js`:**

``` javascript
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Lỗi máy chủ nội bộ",
    errors: err.errors || null
  });
};
```

**Gắn cuối app — ghi vào `backend/src/app.js`:**

``` javascript
app.use("/api", rootRouter);
app.use(errorHandler);
```

**Lưu ý Express 5:** Nếu một route handler hoặc middleware trả về
Promise bị reject hoặc phát sinh lỗi trong hàm `async`, Express 5 tự
chuyển lỗi đến error-handling middleware. Vì vậy, `try-catch` và
`next(error)` vẫn có thể dùng để kiểm soát rõ luồng, nhưng không phải
lúc nào cũng bắt buộc như cách viết cũ.

**Trả lời ngắn:** Global Error Handler là middleware có 4 tham số, đặt
sau các route để tập trung xử lý lỗi và trả response thống nhất.

------------------------------------------------------------------------

## III. Sơ đồ luồng quan trọng cần nhớ

### 1. Luồng đặt lịch

``` text
Client gửi request
    ↓
Route + Middleware
    - Kiểm tra dữ liệu đầu vào
    - Kiểm tra giới hạn request (nếu có)
    ↓
Controller
    - Nhận dữ liệu và gọi Service
    ↓
Service + Transaction
    - Kiểm tra slot
    - Khóa slot
    - Kiểm tra trạng thái và ngày giờ
    - Tạo appointment
    - Cập nhật slot thành booked
    ↓
Commit transaction
    ↓
Sau commit
    - Xóa cache
    - Gửi email / Socket (nếu có)
    ↓
Trả response cho Client
```

### 2. Luồng hủy lịch

``` text
Client gửi yêu cầu hủy
    ↓
Route + Middleware
    ↓
Controller
    ↓
Service
    - Kiểm tra lịch có tồn tại
    - Kiểm tra quyền người thực hiện
    - Kiểm tra trạng thái có được hủy
    ↓
Transaction
    - Cập nhật appointment thành cancelled
    - Mở lại slot thành available
    ↓
Commit
    ↓
Xóa cache và gửi thông báo (nếu có)
```

### 3. Luồng xử lý lỗi

``` text
Route / Controller / Service / Repository
                  ↓
              Phát sinh lỗi
                  ↓
       Global Error Handler
                  ↓
        Response JSON thống nhất
```

------------------------------------------------------------------------

## IV. Bảng câu trả lời nhanh khi vấn đáp

  ----------------------------------------------------------------------------
                           STT Câu hỏi                   Ý chính cần trả lời
  ---------------------------- ------------------------- ---------------------
                             1 Hai người cùng đặt một    Transaction +
                               slot?                     `FOR UPDATE` + cập
                                                         nhật có điều kiện

                             2 Ai kiểm soát trạng thái   Service kiểm tra quy
                               lịch?                     tắc chuyển trạng thái

                             3 Hủy lịch có mở lại slot?  Có, cập nhật
                                                         appointment và slot
                                                         trong cùng
                                                         transaction

                             4 Bác sĩ A xem lịch bác sĩ  Lọc theo `doctor_id`
                               B?                        lấy từ token và quan
                                                         hệ slot

                             5 Dữ liệu sai định dạng?    Middleware validate;
                                                         Service kiểm tra
                                                         nghiệp vụ

                             6 Client gửi `doctor_id`    Không tin body; lấy
                               giả?                      bác sĩ từ slot trong
                                                         database

                             7 Mã lịch hẹn bị trùng?     Sinh mã phù hợp và
                                                         đặt UNIQUE ở database

                             8 Email/Socket lỗi?         Không rollback dữ
                                                         liệu cốt lõi đã
                                                         commit

                             9 Danh sách nhiều dữ liệu?  Phân trang, lọc ở
                                                         database, giới hạn
                                                         `limit`

                            10 Bác sĩ nghỉ ngày?         Chỉ chuyển slot chưa
                                                         đặt sang `off`; giữ
                                                         slot `booked`

                            11 Token hết hạn?            Middleware xác thực
                                                         JWT và trả 401

                            12 Thu hồi token?            Blacklist hoặc quản
                                                         lý phiên/token
                                                         version

                            13 Chống spam?               Rate Limiting và kiểm
                                                         tra giới hạn nghiệp
                                                         vụ

                            14 Cache cũ sau đặt/hủy?     Xóa cache sau khi
                                                         transaction commit

                            15 Optimistic/Pessimistic?   Khác nhau ở cách phát
                                                         hiện và xử lý tranh
                                                         chấp

                            16 Vì sao không UNIQUE slot  Cần lưu lịch sử và
                               trong appointment?        cho phép đặt lại sau
                                                         khi hủy

                            17 Danh sách rỗng trả mã gì? Thường 200 + `[]`;
                                                         chi tiết không tồn
                                                         tại là 404

                            18 Vì sao route cụ thể đặt   Tránh route động bắt
                               trước?                    nhầm request

                            19 Global Error Handler?     Middleware 4 tham số,
                                                         đặt cuối các route
  ----------------------------------------------------------------------------

------------------------------------------------------------------------

## V. Một số điểm cần kiểm tra lại trong source code trước khi bảo vệ

1.  Kiểm tra đúng tên model, repository, service và đường dẫn file trong
    dự án; tài liệu chỉ dùng tên tham khảo.
2.  Đảm bảo thao tác tạo appointment và cập nhật trạng thái slot nằm
    trong cùng transaction.
3.  Khi hủy lịch, cập nhật appointment và mở lại slot trong cùng
    transaction.
4.  Khi bác sĩ nghỉ, không cập nhật tất cả slot thành `off` một cách
    không điều kiện; phải giữ slot `booked`.
5.  Không gửi email trước khi transaction commit. Nếu gửi thất bại,
    không làm mất lịch đã tạo.
6.  Nếu dùng cache, bảo đảm key cache có đủ các tham số ảnh hưởng kết
    quả như bác sĩ, ngày, trang, trạng thái; xóa cache sau khi dữ liệu
    thay đổi.
7.  Nếu dùng blacklist/token store trong RAM, phải nêu rõ giới hạn khi
    server restart hoặc chạy nhiều instance.
8.  Rate limiter tự viết bằng `Map` cũng có giới hạn tương tự; không xem
    đây là giải pháp đầy đủ cho môi trường nhiều server.
9.  Với truy vấn phân trang có `include`, kiểm tra `distinct: true` và
    quan hệ Sequelize để tránh đếm sai bản ghi.
10. Không học thuộc các đoạn code minh họa như thể toàn bộ đã có trong
    dự án. Nên nắm luồng xử lý, vị trí từng tầng và đối chiếu với source
    thực tế.
