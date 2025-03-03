import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import Header from '../components/Header';
import { Merchant } from '../types';
import merchantsData from '../data/merchants.json';
import { ShoppingBag } from 'lucide-react';

const CartPage: React.FC = () => {
  const { merchantId } = useParams<{ merchantId: string }>();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const { cartItems, getCartTotal, customerInfo, updateCustomerInfo } = useCart();
  const navigate = useNavigate();
  
  useEffect(() => {
    const foundMerchant = merchantsData.find(
      (m) => m.id === Number(merchantId)
    );
    
    if (foundMerchant) {
      setMerchant(foundMerchant);
    }
  }, [merchantId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateCustomerInfo({
      ...customerInfo,
      [name]: value,
    });
  };

  const handleCheckout = () => {
    if (!merchant) return;
    
    // Format the order message for WhatsApp
    let message = `*Pesanan Baru dari DiOrder*\n\n`;
    message += `*Nama*: ${customerInfo.name}\n`;
    message += `*Alamat*: ${customerInfo.address}\n\n`;
    
    message += `*Detail Pesanan*:\n`;
    cartItems.forEach((item) => {
      message += `- ${item.name} (${item.quantity}x) = ${formatCurrency(item.price * item.quantity)}\n`;
    });
    
    message += `\n*Subtotal*: ${formatCurrency(getCartTotal())}\n`;
    message += `*Ongkir*: ${formatCurrency(merchant.delivery_fee)}\n`;
    message += `*Total*: ${formatCurrency(getCartTotal() + merchant.delivery_fee)}\n\n`;
    
    if (customerInfo.notes) {
      message += `*Catatan*: ${customerInfo.notes}\n\n`;
    }
    
    message += `Terima kasih telah memesan!`;
    
    // Encode the message for the URL
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp with the formatted message
    window.open(`https://wa.me/${merchant.whatsapp}?text=${encodedMessage}`, '_blank');
  };

  if (!merchant) {
    return <div>Loading...</div>;
  }

  const subtotal = getCartTotal();
  const total = subtotal + merchant.delivery_fee;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="Keranjang" showBack />
      
      <div className="container mx-auto px-4 py-6">
        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Keranjang Kosong</h2>
            <p className="text-gray-600 mb-4">Anda belum menambahkan item ke keranjang</p>
            <button
              onClick={() => navigate(`/menu/${merchantId}`)}
              className="bg-orange-500 text-white py-2 px-4 rounded-lg font-medium"
            >
              Lihat Menu
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="font-bold text-lg mb-4">Pesanan Anda</h2>
              
              {cartItems.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between mb-2">
                  <span>Subtotal</span>
                  <span className="font-bold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Ongkir</span>
                  <span className="font-bold">{formatCurrency(merchant.delivery_fee)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-orange-500 mt-2 pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="font-bold text-lg mb-4">Informasi Pengiriman</h2>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Nama Pemesan
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={customerInfo.name}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Masukkan nama Anda"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                  Alamat Pengiriman
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={customerInfo.address}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Masukkan alamat lengkap"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
                  Catatan Tambahan
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={customerInfo.notes}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Catatan tambahan untuk pesanan Anda"
                  rows={3}
                />
              </div>
            </div>
            
            <button
              onClick={handleCheckout}
              disabled={!customerInfo.name || !customerInfo.address}
              className={`w-full py-3 px-4 rounded-lg font-bold text-white ${
                !customerInfo.name || !customerInfo.address
                  ? 'bg-gray-400'
                  : 'bg-orange-500'
              }`}
            >
              Pesan via WhatsApp
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CartPage;