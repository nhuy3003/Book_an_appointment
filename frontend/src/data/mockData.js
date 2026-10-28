// ==================== MOCK DATA ====================
// Dữ liệu giả lập chuẩn theo database datlichkham.sql
// Sử dụng khi API chưa sẵn sàng

export const USE_MOCK = true; // Chuyển sang false khi API backend sẵn sàng

// ---------- Specialty ----------
export const mockSpecialties = [
  { id: 1, specialty_name: 'Cơ xương khớp', description: 'Chuyên khoa về xương, khớp, cơ và các mô liên kết' },
  { id: 2, specialty_name: 'Thần kinh', description: 'Chuyên khoa về hệ thần kinh trung ương và ngoại biên' },
  { id: 3, specialty_name: 'Tim mạch', description: 'Chuyên khoa về tim và hệ tuần hoàn' },
  { id: 4, specialty_name: 'Tai mũi họng', description: 'Chuyên khoa về tai, mũi, họng' },
  { id: 5, specialty_name: 'Da liễu', description: 'Chuyên khoa về da và các bệnh lý da liễu' },
  { id: 6, specialty_name: 'Nhi khoa', description: 'Chuyên khoa về chăm sóc sức khỏe trẻ em' },
  { id: 7, specialty_name: 'Sản phụ khoa', description: 'Chuyên khoa về sức khỏe phụ nữ và thai kỳ' },
  { id: 8, specialty_name: 'Mắt', description: 'Chuyên khoa về mắt và thị lực' },
];

// ---------- Doctor ----------
export const mockDoctors = [
  {
    id: 1,
    full_name: 'BS. Nguyễn Văn An',
    email: 'an.nguyen@clinic.vn',
    phone_number: '0901234567',
    address: 'Phòng khám Đa khoa Sài Gòn, Q.1, TP.HCM',
    specialty_id: 1,
    image_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
    experience_years: 15,
    price_per_appointment: 300000,
    bio: 'Tốt nghiệp Đại học Y Dược TP.HCM năm 2011. Hơn 15 năm kinh nghiệm trong lĩnh vực Cơ xương khớp. Từng tu nghiệp tại Nhật Bản.',
    Specialty: { id: 1, specialty_name: 'Cơ xương khớp' },
  },
  {
    id: 2,
    full_name: 'BS. Trần Thị Bình',
    email: 'binh.tran@clinic.vn',
    phone_number: '0912345678',
    address: 'Bệnh viện Chợ Rẫy, Q.5, TP.HCM',
    specialty_id: 2,
    image_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
    experience_years: 12,
    price_per_appointment: 350000,
    bio: 'Thạc sĩ Thần kinh học, Đại học Y Hà Nội. 12 năm kinh nghiệm chuyên sâu về các bệnh lý thần kinh.',
    Specialty: { id: 2, specialty_name: 'Thần kinh' },
  },
  {
    id: 3,
    full_name: 'PGS.TS. Lê Hoàng Cường',
    email: 'cuong.le@clinic.vn',
    phone_number: '0923456789',
    address: 'Viện Tim TP.HCM, Q.Phú Nhuận, TP.HCM',
    specialty_id: 3,
    image_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop&crop=face',
    experience_years: 20,
    price_per_appointment: 500000,
    bio: 'Phó Giáo sư, Tiến sĩ Tim mạch. Hơn 20 năm kinh nghiệm trong điều trị và can thiệp tim mạch.',
    Specialty: { id: 3, specialty_name: 'Tim mạch' },
  },
  {
    id: 4,
    full_name: 'BS. Phạm Minh Đức',
    email: 'duc.pham@clinic.vn',
    phone_number: '0934567890',
    address: 'Phòng khám Đa khoa Quốc tế, Q.3, TP.HCM',
    specialty_id: 4,
    image_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face',
    experience_years: 10,
    price_per_appointment: 250000,
    bio: 'Bác sĩ chuyên khoa Tai Mũi Họng. 10 năm kinh nghiệm khám và điều trị các bệnh lý TMH.',
    Specialty: { id: 4, specialty_name: 'Tai mũi họng' },
  },
  {
    id: 5,
    full_name: 'BS. Hoàng Thị Én',
    email: 'en.hoang@clinic.vn',
    phone_number: '0945678901',
    address: 'Bệnh viện Da liễu TP.HCM, Q.3, TP.HCM',
    specialty_id: 5,
    image_url: 'https://images.unsplash.com/photo-1594824476967-48c8b964f137?w=400&h=400&fit=crop&crop=face',
    experience_years: 8,
    price_per_appointment: 280000,
    bio: 'Chuyên gia Da liễu, tốt nghiệp ĐH Y Dược Huế. Chuyên trị mụn, nám, viêm da dị ứng.',
    Specialty: { id: 5, specialty_name: 'Da liễu' },
  },
  {
    id: 6,
    full_name: 'TS.BS. Vũ Quang Phúc',
    email: 'phuc.vu@clinic.vn',
    phone_number: '0956789012',
    address: 'Bệnh viện Nhi Đồng 1, Q.10, TP.HCM',
    specialty_id: 6,
    image_url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face',
    experience_years: 18,
    price_per_appointment: 400000,
    bio: 'Tiến sĩ Nhi khoa, 18 năm kinh nghiệm. Chuyên gia về hô hấp và tiêu hóa nhi.',
    Specialty: { id: 6, specialty_name: 'Nhi khoa' },
  },
];

// ---------- Bookable Slot ----------
// Hàm tạo mock slot cho 7 ngày tới
export const generateMockSlots = (doctorId) => {
  const slots = [];
  const today = new Date();

  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);

    // Bỏ qua Chủ nhật
    if (date.getDay() === 0) continue;

    const dateStr = date.toISOString().split('T')[0];

    const timeSlots = [
      { start: '08:00:00', end: '08:30:00' },
      { start: '08:30:00', end: '09:00:00' },
      { start: '09:00:00', end: '09:30:00' },
      { start: '09:30:00', end: '10:00:00' },
      { start: '10:00:00', end: '10:30:00' },
      { start: '10:30:00', end: '11:00:00' },
      { start: '13:30:00', end: '14:00:00' },
      { start: '14:00:00', end: '14:30:00' },
      { start: '14:30:00', end: '15:00:00' },
      { start: '15:00:00', end: '15:30:00' },
      { start: '15:30:00', end: '16:00:00' },
      { start: '16:00:00', end: '16:30:00' },
    ];

    timeSlots.forEach((time, idx) => {
      // Ngẫu nhiên một số slot đã booked
      const isBooked = Math.random() < 0.3;
      slots.push({
        id: dayOffset * 100 + idx + 1 + doctorId * 1000,
        doctor_id: doctorId,
        slot_date: dateStr,
        start_time: time.start,
        end_time: time.end,
        status: isBooked ? 'booked' : 'available',
        availability_id: dayOffset,
      });
    });
  }

  return slots;
};

// ---------- Appointment (lookup result) ----------
export const mockAppointmentLookup = {
  id: 1,
  appointment_code: 'APT001',
  status: 'pending',
  reason_for_visit: 'Đau đầu gối kéo dài 2 tuần',
  note: '',
  price: 300000,
  payment_method: 'offline',
  payment_status: 'pending',
  created_at: '2026-10-26T10:00:00Z',
  Patient: {
    id: 1,
    full_name: 'Nguyễn Thị Mai',
    email: 'mai.nguyen@gmail.com',
    phone_number: '0967890123',
  },
  BookableSlot: {
    id: 101,
    slot_date: '2026-10-28',
    start_time: '08:00:00',
    end_time: '08:30:00',
    Doctor: {
      id: 1,
      full_name: 'BS. Nguyễn Văn An',
      Specialty: { specialty_name: 'Cơ xương khớp' },
    },
  },
};

// ---------- Danh sách lịch hẹn cá nhân (mock cho tài khoản đã đăng nhập) ----------
export const mockMyAppointments = [
  {
    id: 1,
    appointment_code: 'APT001',
    status: 'pending',
    reason_for_visit: 'Đau đầu gối kéo dài 2 tuần',
    note: '',
    price: 300000,
    payment_method: 'offline',
    payment_status: 'pending',
    created_at: '2026-10-26T10:00:00Z',
    Patient: {
      id: 1,
      full_name: 'Nguyễn Thị Mai',
      email: 'mai.nguyen@gmail.com',
      phone_number: '0967890123',
    },
    BookableSlot: {
      id: 101,
      slot_date: '2026-10-30',
      start_time: '08:00:00',
      end_time: '08:30:00',
      Doctor: {
        id: 1,
        full_name: 'BS. Nguyễn Văn An',
        Specialty: { specialty_name: 'Cơ xương khớp' },
      },
    },
  },
  {
    id: 2,
    appointment_code: 'APT002',
    status: 'confirmed',
    reason_for_visit: 'Khám tổng quát định kỳ',
    note: 'Bệnh nhân có tiền sử huyết áp cao',
    price: 500000,
    payment_method: 'online',
    payment_status: 'paid',
    created_at: '2026-10-25T08:30:00Z',
    Patient: {
      id: 1,
      full_name: 'Nguyễn Thị Mai',
      email: 'mai.nguyen@gmail.com',
      phone_number: '0967890123',
    },
    BookableSlot: {
      id: 305,
      slot_date: '2026-10-31',
      start_time: '09:00:00',
      end_time: '09:30:00',
      Doctor: {
        id: 3,
        full_name: 'PGS.TS. Lê Hoàng Cường',
        Specialty: { specialty_name: 'Tim mạch' },
      },
    },
  },
  {
    id: 3,
    appointment_code: 'APT003',
    status: 'completed',
    reason_for_visit: 'Đau vai gáy, tê tay trái',
    note: '',
    price: 350000,
    payment_method: 'offline',
    payment_status: 'paid',
    created_at: '2026-10-20T14:00:00Z',
    Patient: {
      id: 1,
      full_name: 'Nguyễn Thị Mai',
      email: 'mai.nguyen@gmail.com',
      phone_number: '0967890123',
    },
    BookableSlot: {
      id: 207,
      slot_date: '2026-10-22',
      start_time: '14:00:00',
      end_time: '14:30:00',
      Doctor: {
        id: 2,
        full_name: 'BS. Trần Thị Bình',
        Specialty: { specialty_name: 'Thần kinh' },
      },
    },
  },
  {
    id: 4,
    appointment_code: 'APT004',
    status: 'cancelled',
    reason_for_visit: 'Viêm họng tái phát',
    note: 'Bệnh nhân hủy do bận công việc',
    price: 250000,
    payment_method: 'offline',
    payment_status: 'pending',
    created_at: '2026-10-18T09:15:00Z',
    Patient: {
      id: 1,
      full_name: 'Nguyễn Thị Mai',
      email: 'mai.nguyen@gmail.com',
      phone_number: '0967890123',
    },
    BookableSlot: {
      id: 410,
      slot_date: '2026-10-20',
      start_time: '10:00:00',
      end_time: '10:30:00',
      Doctor: {
        id: 4,
        full_name: 'BS. Phạm Minh Đức',
        Specialty: { specialty_name: 'Tai mũi họng' },
      },
    },
  },
  {
    id: 5,
    appointment_code: 'APT005',
    status: 'completed',
    reason_for_visit: 'Khám da mặt, nổi mụn nhiều',
    note: '',
    price: 280000,
    payment_method: 'online',
    payment_status: 'paid',
    created_at: '2026-10-15T11:00:00Z',
    Patient: {
      id: 1,
      full_name: 'Nguyễn Thị Mai',
      email: 'mai.nguyen@gmail.com',
      phone_number: '0967890123',
    },
    BookableSlot: {
      id: 503,
      slot_date: '2026-10-17',
      start_time: '08:30:00',
      end_time: '09:00:00',
      Doctor: {
        id: 5,
        full_name: 'BS. Hoàng Thị Én',
        Specialty: { specialty_name: 'Da liễu' },
      },
    },
  },
];
