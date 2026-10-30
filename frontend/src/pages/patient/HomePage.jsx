import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import doctorApi from '../../api/doctorApi';
import { formatCurrency } from '../../utils/formatters';

export default function HomePage() {
  const [specialties, setSpecialties] = useState([]);
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [specRes, docRes] = await Promise.all([
          doctorApi.getSpecialties(),
          doctorApi.getAll(),
        ]);
        const specData = specRes?.data || specRes || [];
        const docData = docRes?.data || docRes || [];
        setSpecialties(Array.isArray(specData) ? specData.slice(0, 6) : []);
        setFeaturedDoctors(Array.isArray(docData) ? docData.slice(0, 4) : []);
      } catch {
        // Fallback: dùng dữ liệu tĩnh nếu backend chưa có dữ liệu
        setSpecialties([
          { id: 1, specialty_name: 'Cơ Xương Khớp', description: 'Chẩn đoán và điều trị bệnh lý thoái hóa khớp, cột sống' },
          { id: 2, specialty_name: 'Tim Mạch', description: 'Khám và tư vấn huyết áp, rối loạn nhịp, bệnh mạch vành' },
          { id: 3, specialty_name: 'Thần Kinh', description: 'Điều trị đau đầu, rối loạn giấc ngủ, tiền đình' },
          { id: 4, specialty_name: 'Tai Mũi Họng', description: 'Khám nội soi mũi họng, viêm xoang, thanh quản' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const specialtyIcons = ['🦴', '❤️', '🧠', '👂', '👁️', '🦷'];

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

      {/* Thống kê nhanh */}
      <section className="grid grid-cols-3 gap-4">
        {[
          { label: 'Bác Sĩ Chuyên Khoa', value: featuredDoctors.length > 0 ? `${featuredDoctors.length}+` : '...', icon: '👨‍⚕️', color: 'from-blue-500 to-blue-600' },
          { label: 'Chuyên Khoa', value: specialties.length > 0 ? specialties.length : '...', icon: '🏥', color: 'from-emerald-500 to-emerald-600' },
          { label: 'Đặt Lịch Dễ Dàng', value: '24/7', icon: '⏰', color: 'from-purple-500 to-purple-600' },
        ].map((stat, i) => (
          <div key={i} className={`bg-gradient-to-br ${stat.color} text-white rounded-2xl p-5 text-center shadow-sm`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-extrabold">{loading ? '...' : stat.value}</div>
            <div className="text-xs opacity-80 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* Danh mục chuyên khoa */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Chuyên Khoa Nổi Bật</h2>
            <p className="text-xs text-slate-500">Các chuyên khoa phổ biến được đặt khám nhiều nhất</p>
          </div>
          <Link to="/doctors" className="text-xs font-semibold text-primary-600 hover:underline">
            Xem tất cả →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white p-5 rounded-xl border border-slate-100 animate-pulse">
                <div className="w-10 h-10 bg-slate-100 rounded-lg mb-3" />
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {specialties.map((item, idx) => (
              <Link
                key={item.id}
                to={`/doctors?specialty=${item.id}`}
                className="bg-white p-5 rounded-xl border border-slate-200/80 hover:border-primary-400 hover:shadow-sm transition cursor-pointer block"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-xl mb-3">
                  {specialtyIcons[idx] || '🏥'}
                </div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">{item.specialty_name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Bác sĩ nổi bật */}
      {featuredDoctors.length > 0 && (
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Bác Sĩ Được Đề Xuất</h2>
              <p className="text-xs text-slate-500">Đội ngũ y bác sĩ giàu kinh nghiệm</p>
            </div>
            <Link to="/doctors" className="text-xs font-semibold text-primary-600 hover:underline">
              Xem tất cả bác sĩ →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredDoctors.map(doctor => (
              <div key={doctor.id} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-md hover:border-primary-200 transition-all">
                <div className="bg-gradient-to-br from-primary-50 to-blue-100 h-28 flex items-center justify-center">
                  {doctor.image_url ? (
                    <img src={doctor.image_url} alt={doctor.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center">
                      <svg className="w-7 h-7 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-bold text-slate-800 text-xs truncate">{doctor.full_name}</p>
                  {doctor.specialty && <p className="text-[11px] text-primary-600 font-medium">{doctor.specialty}</p>}
                  <p className="text-xs font-bold text-slate-700 mt-1">{formatCurrency(doctor.price_per_appointment)}</p>
                  <Link
                    to="/doctors"
                    className="mt-2 block text-center bg-primary-50 hover:bg-primary-100 text-primary-700 text-[11px] font-semibold py-1.5 rounded-lg transition"
                  >
                    Đặt lịch
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Hướng dẫn đặt lịch */}
      <section className="bg-white border border-slate-200 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-slate-900 text-center mb-8">Đặt Lịch Dễ Dàng Trong 3 Bước</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Chọn Bác Sĩ', desc: 'Tìm kiếm và chọn bác sĩ phù hợp với chuyên khoa bạn cần', icon: '🔍' },
            { step: '2', title: 'Chọn Ngày & Giờ', desc: 'Chọn khung giờ còn trống phù hợp với lịch của bạn', icon: '📅' },
            { step: '3', title: 'Xác Nhận', desc: 'Nhập thông tin và nhận mã lịch hẹn để tra cứu', icon: '✅' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-14 h-14 bg-primary-600 text-white rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-md">
                {item.icon}
              </div>
              <div className="text-xs font-bold text-primary-600 uppercase mb-1">Bước {item.step}</div>
              <h3 className="font-bold text-slate-800 mb-2">{item.title}</h3>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
