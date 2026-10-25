import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

export default function DoctorSchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Quản Lý Lịch Làm Việc (Doctor Availability)</h1>
          <p className="text-xs text-slate-500">Cấu hình ca khám bệnh hàng tuần theo thứ (Monday - Sunday)</p>
        </div>
      </div>
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
        [Dev 1 - Tiếp tục hoàn thiện bảng tuần, modal thêm ca làm việc và nút gạt bật/tắt active]
      </div>
    </div>
  );
}

