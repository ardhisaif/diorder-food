import React from 'react';
import { Merchant } from '../types';
import MerchantCard from '../components/MerchantCard';
import Header from '../components/Header';
import merchants from '../data/merchants.json';
import { Store } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="Diorder" />
      
      <main className="container mx-auto px-4 py-6">
        <div className="bg-orange-100 rounded-lg p-4 mb-6 flex items-center">
          <Store size={24} className="text-orange-500 mr-3" />
          <div>
            <h2 className="font-bold text-lg">Pesan Makanan Online</h2>
            <p className="text-sm text-gray-600">
              Pilih merchant favorit dan pesan langsung via WhatsApp
            </p>
          </div>
        </div>
        
        <h2 className="text-xl font-bold mb-4">Daftar Merchant</h2>
        
        <div className="grid gap-4">
          {merchants.map((merchant: Merchant) => (
            <MerchantCard key={merchant.id} merchant={merchant} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default HomePage;