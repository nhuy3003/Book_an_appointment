import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarCheck, FaUserMd, FaShieldAlt, FaClock } from 'react-icons/fa';
import { USE_MOCK, mockSpecialties, mockDoctors } from '../data/mockData';
import { specialtyApi, doctorApi } from '../api/apiServices';
import SpecialtyCard from '../components/common/SpecialtyCard';
import DoctorCard from '../components/common/DoctorCard';

const features = [
  {
    icon: FaCalendarCheck,
    title: 'Đặt lịch dễ dàng',
    description: 'Chọn bác sĩ và đặt lịch chỉ trong 2 phút',
  },
  {
    icon: FaUserMd,
    title: 'Bác sĩ chuyên khoa',
    description: 'Đội ngũ bác sĩ giàu kinh nghiệm',
  },
  {
    icon: FaShieldAlt,
    title: 'Bảo mật thông tin',
    description: 'Thông tin cá nhân được bảo mật tuyệt đối',
  },
  {
    icon: FaClock,
    title: 'Tiết kiệm thời gian',
    description: 'Không cần xếp hàng chờ đợi',
  },
];

export default function HomePage() {
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        if (USE_MOCK) {
          setSpecialties(mockSpecialties);
        } else {
          const res = await specialtyApi.getAll();
          setSpecialties(res.data ?? res);
        }
      } catch (err) {
        console.error('Failed to fetch specialties:', err);
      } finally {
        setLoadingSpecialties(false);
      }
    };
    fetchSpecialties();
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        if (USE_MOCK) {
          setDoctors(mockDoctors);
        } else {
          const res = await doctorApi.getAll();
          setDoctors(res.data ?? res);
        }
      } catch (err) {
        console.error('Failed to fetch doctors:', err);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  return (
    <div>
      {/* ===== Section 1: Hero Banner ===== */}
      <section className="relative min-h-[420px] flex items-center bg-gradient-to-r from-sky-500 to-blue-700 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-80px] right-[-60px] w-[320px] h-[320px] rounded-full bg-white/10" />
        <div className="absolute bottom-[-100px] right-[120px] w-[240px] h-[240px] rounded-full bg-white/5" />
        <div className="absolute top-[40%] left-[-40px] w-[160px] h-[160px] rounded-full bg-white/5" />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8 py-16">
          {/* Left – copy */}
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
              Đặt lịch khám bệnh
              <br />
              trực tuyến
            </h1>
            <p className="mt-4 text-lg text-blue-100 max-w-lg">
              Hệ thống đặt lịch khám nhanh chóng, tiện lợi. Lựa chọn bác sĩ
              phù hợp và đặt lịch chỉ trong vài phút.
            </p>
            <div className="mt-8">
              <Link
                to="/doctors"
                className="inline-block bg-white text-blue-700 font-semibold rounded-full px-8 py-3 shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all duration-200"
              >
                Đặt lịch ngay
              </Link>
            </div>
          </div>

          {/* Right – decorative medical illustration (SVG) */}
          <div className="hidden md:flex items-center justify-center">
            <svg
              viewBox="0 0 400 320"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full max-w-sm drop-shadow-xl"
            >
              {/* Clipboard body */}
              <rect x="100" y="40" width="200" height="260" rx="18" fill="white" fillOpacity="0.95" />
              <rect x="160" y="20" width="80" height="36" rx="10" fill="#38bdf8" />
              <circle cx="200" cy="38" r="8" fill="white" />
              {/* Lines on clipboard */}
              <rect x="140" y="90" width="120" height="10" rx="5" fill="#e0f2fe" />
              <rect x="140" y="115" width="100" height="10" rx="5" fill="#e0f2fe" />
              <rect x="140" y="140" width="80" height="10" rx="5" fill="#e0f2fe" />
              {/* Check marks */}
              <circle cx="125" cy="95" r="8" fill="#22c55e" />
              <path d="M121 95l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="125" cy="120" r="8" fill="#22c55e" />
              <path d="M121 120l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="125" cy="145" r="8" fill="#dbeafe" />
              {/* Stethoscope */}
              <path d="M260 200 Q280 160 310 170 Q340 180 320 220 Q300 260 270 240" stroke="#38bdf8" strokeWidth="5" fill="none" strokeLinecap="round" />
              <circle cx="270" cy="240" r="12" fill="#38bdf8" />
              <circle cx="270" cy="240" r="5" fill="white" />
              {/* Heart */}
              <path d="M170 200 C170 185 185 175 200 190 C215 175 230 185 230 200 C230 220 200 245 200 245 C200 245 170 220 170 200Z" fill="#ef4444" fillOpacity="0.85" />
              {/* Plus signs */}
              <rect x="340" y="70" width="20" height="6" rx="3" fill="white" fillOpacity="0.5" />
              <rect x="347" y="63" width="6" height="20" rx="3" fill="white" fillOpacity="0.5" />
              <rect x="50" y="180" width="16" height="5" rx="2.5" fill="white" fillOpacity="0.4" />
              <rect x="55" y="175" width="5" height="16" rx="2.5" fill="white" fillOpacity="0.4" />
            </svg>
          </div>
        </div>
      </section>

      {/* ===== Section 2: Features Bar ===== */}
      <section className="relative z-10 -mt-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
                  <Icon />
                </div>
                <h3 className="font-semibold text-gray-800">{feat.title}</h3>
                <p className="text-sm text-gray-500">{feat.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== Section 3: Specialty Grid ===== */}
      <section className="bg-gray-50 py-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section heading */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800">Chuyên khoa nổi bật</h2>
            <div className="mt-3 mx-auto w-20 h-1 rounded-full bg-blue-600" />
          </div>

          {loadingSpecialties ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : specialties.length === 0 ? (
            <p className="text-center text-gray-500">Không có chuyên khoa nào.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {specialties.map((specialty) => (
                <SpecialtyCard key={specialty.id} specialty={specialty} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== Section 4: Featured Doctors ===== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section heading */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800">Bác sĩ tiêu biểu</h2>
            <div className="mt-3 mx-auto w-20 h-1 rounded-full bg-blue-600" />
          </div>

          {loadingDoctors ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : doctors.length === 0 ? (
            <p className="text-center text-gray-500">Không có bác sĩ nào.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          )}

          {/* View all doctors link */}
          <div className="text-center mt-10">
            <Link
              to="/doctors"
              className="inline-block border-2 border-blue-600 text-blue-600 font-semibold rounded-full px-8 py-3 hover:bg-blue-600 hover:text-white transition-colors duration-200"
            >
              Xem tất cả bác sĩ
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Section 5: CTA Banner ===== */}
      <section className="bg-gradient-to-r from-blue-600 to-sky-500 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Bạn cần tư vấn sức khỏe?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Đội ngũ bác sĩ chuyên khoa luôn sẵn sàng hỗ trợ bạn
          </p>
          <div className="mt-8">
            <Link
              to="/doctors"
              className="inline-block bg-white text-blue-700 font-semibold rounded-full px-8 py-3 shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all duration-200"
            >
              Tìm bác sĩ ngay
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
