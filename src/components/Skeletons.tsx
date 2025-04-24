import React from "react";

export const MerchantSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4 animate-pulse">
      <div className="flex p-3">
        <div className="w-20 h-20 rounded-lg bg-gray-200"></div>
        <div className="ml-4 flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
      <div className="bg-gray-200 py-2 px-4 h-8"></div>
    </div>
  );
};

export const ProductSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4 animate-pulse">
      <div className="flex">
        <div className="w-24 h-24 bg-gray-200"></div>
        <div className="p-3 flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MenuItemSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4 animate-pulse">
      <div className="flex">
        <div className="w-24 h-24 bg-gray-200"></div>
        <div className="p-3 flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="flex justify-between items-center mt-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CartItemSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center py-4 border-b animate-pulse">
      <div className="w-20 h-20 min-w-20 rounded-md bg-gray-200"></div>
      <div className="ml-0 sm:ml-4 mt-3 sm:mt-0 flex-1 w-full">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 gap-2">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-200"></div>
            <div className="mx-3 w-6"></div>
            <div className="w-8 h-8 rounded-full bg-gray-200"></div>
          </div>
        </div>
        <div className="mt-3 h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="mt-2">
          <div className="w-full h-16 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    </div>
  );
};

export const CategorySkeleton: React.FC = () => {
  return (
    <div className="mb-6 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-1/4 mb-3"></div>
      {Array(3)
        .fill(0)
        .map((_, i) => (
          <MenuItemSkeleton key={i} />
        ))}
    </div>
  );
};
