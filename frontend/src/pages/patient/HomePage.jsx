import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  const mockSpecialties = [
    { id: 1, specialty_name: 'Cơ Xương Khớp', desc: 'Chẩn đoán và điều trị bệnh lý thoái hóa khớp, cột sống' },
    { id: 2, specialty_name: 'Tim Mạch', desc: 'Khám và tư vấn huyết áp, rối loạn nhịp, bệnh mạch vành' },
    { id: 3, specialty_name: 'Thần Kinh', desc: 'Điều trị đau đầu, rối loạn giấc ngủ, tiền đình' },
    { id: 4, specialty_name: 'Tai Mũi Họng', desc: 'Khám nội soi mũi họng, viêm xoang, thanh quản' },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-8 sm:p-12 shadow-sm">
        <div className="max-w-2xl space-y-4">
          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Đặt Lịch Nhanh Chóng
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
            Chăm Sóc Sức Khỏe Toàn Diện Cho Bạn & Gia Đình
          </h1>
          <p className="text-blue-100 text-sm sm:text-base">
            Tra cứu bác sĩ giỏi theo chuyên khoa, lựa chọn khung giờ thuận tiện và đặt lịch khám trong tích tắc.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/doctors"
              className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-5 py-2.5 rounded-lg text-sm shadow transition"
            >
              Tìm Bác Sĩ & Đặt Hẹn
            </Link>
            <Link
              to="/booking-lookup"
              className="bg-blue-800/60 hover:bg-blue-800 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition"
            >
              Tra Cứu Lịch Hẹn
            </Link>
          </div>
        </div>
      </section>

      {/* Danh mục chuyên khoa */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Chuyên Khoa Nổi Bật</h2>
            <p className="text-xs text-slate-500">Các chuyên khoa phổ biến được đặt khám nhiều nhất</p>
          </div>
          <Link to="/doctors" className="text-xs font-semibold text-primary-600 hover:underline">
            Xem tất cả chuyên khoa →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockSpecialties.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-xl border border-slate-200/80 hover:border-primary-400 hover:shadow-sm transition"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center font-bold mb-3">
                #{item.id}
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-1">{item.specialty_name}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

