import React, { useState, useCallback, useRef } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { X, MapPin } from "lucide-react";

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (address: string) => void;
}

const containerStyle = {
  width: "100%",
  height: "400px",
};

// Default center (Indonesia)
const defaultCenter = {
  lat: -6.2,
  lng: 106.816666,
};

const MapModal: React.FC<MapModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
}) => {
  const [marker, setMarker] = useState<google.maps.LatLngLiteral | null>(null);
  const [address, setAddress] = useState<string>("");
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyBhDwQcSRVGmPKfsYnQNaxZeUNYKxJMdKA", // Replace with your API key
  });

  const onMapLoad = useCallback(() => {
    geocoderRef.current = new google.maps.Geocoder();
  }, []);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const position = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      setMarker(position);

      // Get address from coordinates
      if (geocoderRef.current) {
        geocoderRef.current.geocode(
          { location: position },
          (results, status) => {
            if (status === "OK" && results && results[0]) {
              setAddress(results[0].formatted_address);
            } else {
              setAddress(
                `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
              );
            }
          }
        );
      }
    }
  }, []);

  const handleConfirm = () => {
    if (address) {
      onSelectLocation(address);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold flex items-center">
            <MapPin className="mr-2 text-orange-500" size={20} />
            Pilih Lokasi
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={marker || defaultCenter}
              zoom={15}
              onClick={handleMapClick}
              onLoad={onMapLoad}
            >
              {marker && <Marker position={marker} />}
            </GoogleMap>
          ) : (
            <div className="h-[400px] flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-orange-500 border-solid"></div>
            </div>
          )}

          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Alamat yang dipilih:</p>
            <div className="p-2 border rounded-md bg-gray-50 min-h-[40px]">
              {address || "Klik pada peta untuk memilih lokasi"}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md mr-2"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              disabled={!address}
              className={`px-4 py-2 rounded-md ${
                address
                  ? "bg-orange-500 text-white"
                  : "bg-gray-300 text-gray-500"
              }`}
            >
              Konfirmasi Lokasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapModal;
