import React from 'react';

export default function DoctorAppointmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Danh Sách Lịch Hẹn Khám Bệnh</h1>
          <p className="text-xs text-slate-500">Xem và cập nhật trạng thái các ca hẹn của bệnh nhân</p>
        </div>
      </div>
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
        [Dev 1 - Tiếp tục hoàn thiện bảng danh sách appointments, dropdown đổi status và ghi chú khám bệnh]
      </div>
    </div>
  );
}

