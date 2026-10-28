const statusConfig = {
  pending: {
    label: 'Chờ xác nhận',
    classes: 'bg-amber-100 text-amber-700',
  },
  confirmed: {
    label: 'Đã xác nhận',
    classes: 'bg-blue-100 text-blue-700',
  },
  completed: {
    label: 'Hoàn thành',
    classes: 'bg-green-100 text-green-700',
  },
  cancelled: {
    label: 'Đã hủy',
    classes: 'bg-red-100 text-red-700',
  },
  missed: {
    label: 'Vắng mặt',
    classes: 'bg-gray-100 text-gray-700',
  },
};

function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${config.classes}`}
    >
      {config.label}
    </span>
  );
}

export default StatusBadge;
