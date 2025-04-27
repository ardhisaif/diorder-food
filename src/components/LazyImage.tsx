import React, { useState, useEffect, useMemo } from "react";
import { ImageIcon } from "lucide-react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  loading?: "eager" | "lazy";
  width?: number;
  height?: number;
  priority?: boolean;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = "",
  fallbackSrc = "/placeholder.svg",
  loading = "lazy",
  width,
  height,
  priority = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(src);

  // If this is a priority image or first meaningful image, use eager loading
  const loadingStrategy = priority ? "eager" : loading;

  // Try to extract width from URL for Supabase images to optimize size
  const optimizedSrc = useMemo(() => {
    if (src.includes("supabase.co/storage/v1/object/public/merchant")) {
      // If width is provided, add resize parameter
      if (width) {
        const urlObj = new URL(src);
        // Add width transform parameter for Supabase storage
        urlObj.searchParams.set("width", width.toString());
        return urlObj.toString();
      }
    }
    return src;
  }, [src, width]);

  useEffect(() => {
    setImgSrc(optimizedSrc);
    setIsLoading(true);
    setError(false);
  }, [optimizedSrc]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
    setImgSrc(fallbackSrc);
  };

  // Set explicit dimensions if provided
  const dimensionProps: React.ImgHTMLAttributes<HTMLImageElement> = {};
  if (width) dimensionProps.width = width;
  if (height) dimensionProps.height = height;

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
          loading={loadingStrategy}
          onLoad={handleLoad}
          onError={handleError}
          {...dimensionProps}
          fetchPriority={priority ? "high" : "auto"}
        />
      )}
    </div>
  );
};

export default LazyImage;
