import React from "react";
import { Merchant } from "../types";
import { Link } from "react-router-dom";
import { MapPin, ChevronRight } from "lucide-react";
import { isCurrentlyOpen } from "../utils/merchantUtils";
import LazyImage from "./LazyImage";

interface MerchantCardProps {
  merchant: Merchant;
  priority?: boolean;
}

const MerchantCard: React.FC<MerchantCardProps> = ({
  merchant,
  priority = true,
}) => {
  const isOpen = isCurrentlyOpen(merchant.openingHours);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
      <Link to={`/menu/${merchant.id}`}>
        <div className="flex p-3">
          <LazyImage
            src={
              merchant.logo.startsWith("http")
                ? merchant.logo
                : "/placeholder.svg"
            }
            alt=""
            className={`w-20 h-20 rounded-lg object-cover ${
              !isOpen ? "grayscale" : ""
            }`}
            loading="eager"
            priority={priority}
          />
          <div className="ml-4 flex-1 flex flex-col justify-center">
            <h3 className="font-bold text-lg">{merchant.name}</h3>
            <div className="flex items-center text-gray-600 text-sm mt-1">
              <MapPin size={14} className="mr-1" />
              <span>{merchant.address}</span>
            </div>
          </div>
        </div>
        <div
          className={`${
            isOpen ? "bg-orange-500 text-white" : "bg-gray-500 text-white"
          } py-2 px-4 text-center font-medium flex items-center justify-center`}
        >
          Lihat Menu <ChevronRight size={16} className="ml-1" />
        </div>
      </Link>
    </div>
  );
};

export default MerchantCard;
