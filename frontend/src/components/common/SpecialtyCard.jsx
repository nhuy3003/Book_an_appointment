import { Link } from 'react-router-dom';
import {
  FaBone,
  FaBrain,
  FaHeartbeat,
  FaHeadSideCough,
  FaAllergies,
  FaBaby,
  FaFemale,
  FaEye,
  FaStethoscope,
} from 'react-icons/fa';

const iconMap = {
  'Cơ xương khớp': FaBone,
  'Thần kinh': FaBrain,
  'Tim mạch': FaHeartbeat,
  'Tai mũi họng': FaHeadSideCough,
  'Da liễu': FaAllergies,
  'Nhi khoa': FaBaby,
  'Sản phụ khoa': FaFemale,
  'Mắt': FaEye,
};

function SpecialtyCard({ specialty }) {
  const Icon = iconMap[specialty.specialty_name] || FaStethoscope;

  return (
    <Link to={`/doctors?specialty=${specialty.id}`}>
      <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
        <div className="flex items-center justify-center w-14 h-14 bg-blue-50 text-blue-600 rounded-full mb-4 mx-auto">
          <Icon className="text-2xl" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">
          {specialty.specialty_name}
        </h3>
        <p className="text-sm text-gray-500 text-center line-clamp-2">
          {specialty.description}
        </p>
      </div>
    </Link>
  );
}

export default SpecialtyCard;
