import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaSearch, FaFilter } from 'react-icons/fa';
import DoctorCard from '../components/common/DoctorCard';
import { USE_MOCK, mockDoctors, mockSpecialties } from '../data/mockData';
import { doctorApi, specialtyApi } from '../api/apiServices';

const PRICE_RANGES = [
  { value: '', label: 'Tất cả mức giá' },
  { value: 'under200', label: 'Dưới 200,000đ' },
  { value: '200to300', label: '200,000đ - 300,000đ' },
  { value: '300to500', label: '300,000đ - 500,000đ' },
  { value: 'over500', label: 'Trên 500,000đ' },
];

function DoctorListPage() {
  const [searchParams] = useSearchParams();

  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || '');
  const [priceRange, setPriceRange] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (USE_MOCK) {
          setDoctors(mockDoctors);
          setSpecialties(mockSpecialties);
        } else {
          const [doctorsRes, specialtiesRes] = await Promise.all([
            doctorApi.getAll(),
            specialtyApi.getAll(),
          ]);
          setDoctors(doctorsRes.data || doctorsRes);
          setSpecialties(specialtiesRes.data || specialtiesRes);
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sync specialty from URL params when they change
  useEffect(() => {
    const specialtyParam = searchParams.get('specialty');
    if (specialtyParam) {
      setSelectedSpecialty(specialtyParam);
    }
  }, [searchParams]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      // Filter by search term
      if (searchTerm) {
        const name = (doctor.full_name || '').toLowerCase();
        if (!name.includes(searchTerm.toLowerCase())) {
          return false;
        }
      }

      // Filter by specialty
      if (selectedSpecialty) {
        if (String(doctor.specialty_id) !== String(selectedSpecialty)) {
          return false;
        }
      }

      // Filter by price range
      if (priceRange) {
        const price = doctor.price || 0;
        switch (priceRange) {
          case 'under200':
            if (price >= 200000) return false;
            break;
          case '200to300':
            if (price < 200000 || price > 300000) return false;
            break;
          case '300to500':
            if (price < 300000 || price > 500000) return false;
            break;
          case 'over500':
            if (price <= 500000) return false;
            break;
          default:
            break;
        }
      }

      return true;
    });
  }, [doctors, searchTerm, selectedSpecialty, priceRange]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Tìm Bác sĩ</h1>
          <p className="mt-2 text-gray-500 text-lg">
            Tìm kiếm và đặt lịch khám với bác sĩ phù hợp nhất
          </p>
        </div>

        {/* Filter Bar */}
        <div className="sticky top-0 z-20 bg-white shadow rounded-xl p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên bác sĩ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400"
              />
            </div>

            {/* Specialty Dropdown */}
            <div className="relative md:w-56">
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white cursor-pointer"
              >
                <option value="">Tất cả chuyên khoa</option>
                {specialties.map((s) => (
                  <option key={s.specialty_id || s.id} value={s.specialty_id || s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range Dropdown */}
            <div className="relative md:w-52">
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 bg-white cursor-pointer"
              >
                {PRICE_RANGES.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Result Count */}
            <p className="text-gray-600 mb-4 font-medium">
              Tìm thấy <span className="text-blue-600">{filteredDoctors.length}</span> bác sĩ
            </p>

            {filteredDoctors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDoctors.map((doctor) => (
                  <DoctorCard key={doctor.doctor_id || doctor.id} doctor={doctor} />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-32 h-32 mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <FaFilter className="text-4xl text-gray-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Không tìm thấy bác sĩ phù hợp
                </h3>
                <p className="text-gray-400 max-w-md">
                  Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để tìm bác sĩ phù hợp với nhu cầu của bạn.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DoctorListPage;
