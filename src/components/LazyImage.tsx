import React, { useState, useEffect, useMemo } from "react";
import { ImageIcon } from "lucide-react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  loading?: "eager" | "lazy";
  priority?: boolean;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  className = "",
  fallbackSrc = "/placeholder.svg",
  loading = "lazy",
  priority = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(src);

  // If this is a priority image or first meaningful image, use eager loading
  const loadingStrategy = priority ? "eager" : loading;

  // Try to extract width from URL for Supabase images to optimize size
  const optimizedSrc = useMemo(() => {
    // Optimasi hanya untuk gambar Supabase merchant/menu
    if (
      src.includes("supabase.co/storage/v1/object/public/merchant") ||
      src.includes("supabase.co/storage/v1/object/public/menu")
    ) {
      try {
        // Don't replace the path, keep original object URL
        const urlObj = new URL(src);
        return urlObj.toString();
      } catch{
        // console.error("Error optimizing image URL:", e);
        return src;
      }
    }
    return src;
  }, [src]);

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

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={imgSrc}
        alt=""
        className={`w-full h-full object-cover transition-opacity duration-30`}
        loading={loadingStrategy}
        onLoad={handleLoad}
        onError={handleError}
        style={{ background: isLoading ? "#f3f4f6" : undefined }}
      />
      {/* Loading spinner dihapus */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <ImageIcon className="h-8 w-8 text-gray-400" aria-hidden="true" />
        </div>
      )}
    </div>
  );
};

export default LazyImage;
