import { Link } from 'react-router-dom';

function DoctorCard({ doctor }) {
  return (
    <div className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow duration-300 border border-gray-200">
      <div className="flex flex-col items-center">
        <img
          src={doctor.image_url || '/default-avatar.png'}
          alt={doctor.full_name}
          className="w-20 h-20 rounded-full object-cover mb-4 border-2 border-blue-100"
        />
        <h3 className="text-lg font-semibold text-gray-800 text-center">
          {doctor.full_name}
        </h3>
        <span className="inline-block bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1 rounded-full mt-2">
          {doctor.Specialty?.specialty_name}
        </span>
        <div className="mt-4 w-full space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Kinh nghiệm</span>
            <span className="font-medium text-gray-800">
              {doctor.experience_years} năm
            </span>
          </div>
          <div className="flex justify-between">
            <span>Giá khám</span>
            <span className="font-medium text-emerald-600">
              {doctor.price_per_appointment?.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
        <Link
          to={`/doctor/${doctor.id}`}
          className="mt-5 w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors duration-200"
        >
          Đặt lịch khám
        </Link>
      </div>
    </div>
  );
}

export default DoctorCard;
