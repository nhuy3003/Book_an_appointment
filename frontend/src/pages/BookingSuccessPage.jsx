import { useLocation, Link } from 'react-router-dom';
import { FaCheckCircle, FaCalendarAlt, FaUserMd, FaClock, FaCopy, FaSearch } from 'react-icons/fa';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function BookingSuccessPage() {
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  const appointmentCode = location.state?.appointmentCode || 'APT001';
  const doctorName = location.state?.doctorName;
  const appointmentDate = location.state?.date || location.state?.appointmentDate;
  const timeSlot = location.state?.time || location.state?.timeSlot;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(appointmentCode);
      setCopied(true);
      toast.success('Đã sao chép mã cuộc hẹn!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Không thể sao chép. Vui lòng sao chép thủ công.');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6 animate-bounce" style={{ animationIterationCount: 3 }}>
            <FaCheckCircle className="text-6xl text-green-500 mx-auto drop-shadow-md" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-green-600 mb-2">
            Đặt lịch khám thành công!
          </h1>
          <p className="text-gray-500 mb-8">
            Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của chúng tôi
          </p>

          {/* Appointment Code */}
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2 font-medium">Mã cuộc hẹn của bạn</p>
            <div className="bg-gray-100 rounded-xl p-4 flex items-center justify-center gap-3">
              <span className="font-mono text-3xl font-bold text-blue-600 tracking-wider">
                {appointmentCode}
              </span>
              <button
                onClick={handleCopy}
                className={`p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                  copied
                    ? 'bg-green-100 text-green-600'
                    : 'bg-white text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                }`}
                title="Sao chép mã"
              >
                <FaCopy className="text-lg" />
              </button>
            </div>
          </div>

          {/* Info Summary */}
          {(doctorName || appointmentDate || timeSlot) && (
            <div className="border border-gray-200 rounded-xl p-4 mb-6 text-left">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Thông tin lịch hẹn
              </h3>
              <div className="space-y-3">
                {doctorName && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <FaUserMd className="text-blue-500 flex-shrink-0" />
                    <span className="text-sm">
                      <span className="text-gray-400 mr-1">Bác sĩ:</span>
                      <span className="font-medium">{doctorName}</span>
                    </span>
                  </div>
                )}
                {appointmentDate && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <FaCalendarAlt className="text-blue-500 flex-shrink-0" />
                    <span className="text-sm">
                      <span className="text-gray-400 mr-1">Ngày khám:</span>
                      <span className="font-medium">{appointmentDate}</span>
                    </span>
                  </div>
                )}
                {timeSlot && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <FaClock className="text-blue-500 flex-shrink-0" />
                    <span className="text-sm">
                      <span className="text-gray-400 mr-1">Giờ khám:</span>
                      <span className="font-medium">{timeSlot}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warning Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 text-left">
            <p className="text-amber-700 text-sm">
              ⚠️ Vui lòng lưu lại mã cuộc hẹn để tra cứu thông tin lịch khám.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/tra-cuu"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors duration-200"
            >
              <FaSearch />
              Tra cứu lịch hẹn
            </Link>
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
