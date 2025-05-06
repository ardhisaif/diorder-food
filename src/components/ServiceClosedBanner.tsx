import React from "react";

interface ServiceClosedBannerProps {
  className?: string;
}

const ServiceClosedBanner: React.FC<ServiceClosedBannerProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`bg-red-100 border-l-4 border-red-500 text-red-700 p-4 ${className}`}
    >
      <div className="flex items-center">
        <p>
          <span className="font-bold">Layanan Sedang Tutup. </span> Anda hanya
          dapat melihat menu. Pemesanan tidak dapat dilakukan saat ini. 
        </p>
      </div>
    </div>
  );
};

export default ServiceClosedBanner;
