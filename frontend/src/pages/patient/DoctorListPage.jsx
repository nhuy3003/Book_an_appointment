import React from 'react';
import { Link } from 'react-router-dom';

export default function DoctorListPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Danh Sách Bác Sĩ</h1>
          <p className="text-xs text-slate-500">Tìm kiếm bác sĩ và lựa chọn ngày giờ khám phù hợp</p>
        </div>
      </div>
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
        [Dev 2 - Tiếp tục xây dựng giao diện Card Bác sĩ, Bộ lọc Chuyên khoa và nút Đặt lịch]
      </div>
    </div>
  );
}

