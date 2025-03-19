import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import CartPage from "./pages/CartPage";

// Definisikan konfigurasi route dengan opsi future
const router = createBrowserRouter(
  [
    { path: "/", element: <HomePage /> },
    { path: "/menu/:merchantId", element: <MenuPage /> },
    { path: "/cart", element: <CartPage /> },
  ],
  {
    future: {
      v7_relativeSplatPath: true, // Mengaktifkan cara baru menangani splat path
    },
  }
);

function App() {
  return (
    <CartProvider>
      <div className="max-w-md mx-auto min-h-screen bg-gray-100 shadow-lg">
        <RouterProvider router={router} />
      </div>
    </CartProvider>
  );
}

export default App;
