import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import Header from '../components/Header';
import merchantsData from '../data/merchants.json';
import { ShoppingBag, Plus } from 'lucide-react';

const WHATSAPP_NUMBER = '6282217012023';
const DELIVERY_FEE = 5000;
const VILLAGES = [
  'Duduksampeyan',
  'Sumengko',
  'Petisbenem',
  'Setrohadi'
];

const CartPage: React.FC = () => {
  const { 
    getMerchantItems,
    getMerchantTotal,
    customerInfo,
    updateCustomerInfo,
    clearCart
  } = useCart();
  const navigate = useNavigate();

  // Get all merchants that have items in the cart
  const merchantsWithItems = merchantsData.filter(m => 
    getMerchantItems(m.id).length > 0
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateCustomerInfo({
      ...customerInfo,
      [name]: value,
    });
  };

  const handleCheckout = () => {
    if (!customerInfo.name || !customerInfo.village || !customerInfo.addressDetail) {
      alert('Mohon lengkapi data pengiriman');
      return;
    }

    const subtotal = merchantsWithItems.reduce((total, merchant) => {
      return total + getMerchantTotal(merchant.id);
    }, 0);
    
    const totalWithDelivery = subtotal + DELIVERY_FEE;

    // Format the order message for WhatsApp
    let message = `*Pesanan Baru dari DiOrder*\n\n`;
    message += `*Nama*: ${customerInfo.name}\n`;
    message += `*Alamat*:\n`;
    message += `Kecamatan: Duduksampeyan\n`;
    message += `Desa: ${customerInfo.village}\n`;
    message += `Detail Alamat: ${customerInfo.addressDetail}\n\n`;
    
    // Add orders from each merchant
    merchantsWithItems.forEach(merchant => {
      const items = getMerchantItems(merchant.id);
      const merchantSubtotal = getMerchantTotal(merchant.id);
      
      message += `*Detail Pesanan dari ${merchant.name}*:\n`;
      items.forEach((item) => {
        message += `- ${item.name} (${item.quantity}x) = ${formatCurrency(item.price * item.quantity)}\n`;
      });
      message += `Subtotal: ${formatCurrency(merchantSubtotal)}\n\n`;
    });
    
    message += `Subtotal Pesanan: ${formatCurrency(subtotal)}\n`;
    message += `Ongkir: ${formatCurrency(DELIVERY_FEE)}\n`;
    message += `*Total Keseluruhan*: ${formatCurrency(totalWithDelivery)}\n\n`;
    
    if (customerInfo.notes) {
      message += `*Catatan*: ${customerInfo.notes}\n\n`;
    }
    
    message += `Terima kasih telah memesan!`;
    
    // Encode the message for the URL
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp with the formatted message
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
    
    // Clear the entire cart after checkout
    clearCart();
    navigate('/');
  };

  const cartEmpty = merchantsWithItems.length === 0;
  const subtotal = merchantsWithItems.reduce((total, merchant) => {
    return total + getMerchantTotal(merchant.id);
  }, 0);
  const totalAmount = subtotal + DELIVERY_FEE;

  return (
    <div className="min-h-screen bg-gray-100 pb-32">
      <Header title="Keranjang" showBack />
      
      <div className="container mx-auto px-4 py-6">
        {cartEmpty ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Keranjang Kosong</h2>
            <p className="text-gray-600 mb-4">Anda belum menambahkan item ke keranjang</p>
            <button
              onClick={() => navigate('/')}
              className="bg-orange-500 text-white py-2 px-4 rounded-lg font-medium"
            >
              Lihat Merchant
            </button>
          </div>
        ) : (
          <>
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
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Kecamatan
                </label>
                <input
                  type="text"
                  value="Duduksampeyan"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-500 leading-tight bg-gray-100"
                  disabled
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="village">
                  Desa
                </label>
                <select
                  id="village"
                  name="village"
                  value={customerInfo.village}
                  onChange={handleInputChange}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Pilih Desa</option>
                  {VILLAGES.map(village => (
                    <option key={village} value={village}>
                      {village}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="addressDetail">
                  Detail Alamat
                </label>
                <textarea
                  id="addressDetail"
                  name="addressDetail"
                  value={customerInfo.addressDetail}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Masukkan detail alamat (RT/RW, nama gang, warna pagar, dll)"
                  rows={3}
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

            {merchantsWithItems.map(merchant => {
              const items = getMerchantItems(merchant.id);
              const merchantSubtotal = getMerchantTotal(merchant.id);

              return (
                <div key={merchant.id} className="bg-white rounded-lg shadow-md p-4 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg">{merchant.name}</h2>
                    <button
                      onClick={() => navigate(`/menu/${merchant.id}`)}
                      className="text-orange-500 flex items-center text-sm"
                    >
                      <Plus size={16} className="mr-1" />
                      Tambah Menu
                    </button>
                  </div>
                  
                  {items.map((item) => (
                    <CartItem 
                      key={item.id} 
                      item={item}
                      merchantId={merchant.id}
                    />
                  ))}
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between mb-2">
                      <span>Subtotal</span>
                      <span className="font-bold">{formatCurrency(merchantSubtotal)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {!cartEmpty && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="container mx-auto max-w-md">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ongkir</span>
                  <span>{formatCurrency(DELIVERY_FEE)}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-600">Total Pesanan:</span>
                <div className="font-bold text-lg">{formatCurrency(totalAmount)}</div>
              </div>
              <button
                onClick={handleCheckout}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg font-bold"
              >
                Buat Pesanan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;