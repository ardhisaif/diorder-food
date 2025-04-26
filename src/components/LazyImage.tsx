import React, { useState, useEffect } from "react";
import { ImageIcon } from "lucide-react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = "",
  fallbackSrc = "/placeholder.svg",
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(src);

  useEffect(() => {
    setImgSrc(src);
    setIsLoading(true);
    setError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
    setImgSrc(fallbackSrc);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <ImageIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
        </div>
      ) : (
        <img
          src={imgSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
};

export default LazyImage;
