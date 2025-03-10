import React from 'react';
import { Merchant } from '../types';
import { Link } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';

interface MerchantCardProps {
  merchant: Merchant;
}

const MerchantCard: React.FC<MerchantCardProps> = ({ merchant }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
      <div className="flex p-3">
        <img
          src={merchant.logo}
          alt={merchant.name}
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div className="ml-4 flex-1">
          <h3 className="font-bold text-lg">{merchant.name}</h3>
          <div className="flex items-center text-gray-600 text-sm mt-1">
            <MapPin size={14} className="mr-1" />
            <span>{merchant.address}</span>
          </div>
        </div>
      </div>
      <Link
        to={`/menu/${merchant.id}`}
        className=" bg-orange-500 text-white py-2 px-4 text-center font-medium flex items-center justify-center"
      >
        Lihat Menu <ChevronRight size={16} className="ml-1" />
      </Link>
    </div>
  );
};

export default MerchantCard;