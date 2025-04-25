import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { SettingsProvider } from "./context/SettingsContext";
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import CartPage from "./pages/CartPage";
import { PageTransitionContent } from "./components/PageTransition";

// Layout component that includes the PageTransition inside the Router context
const AppLayout = () => {
  return (
    <>
      <PageTransitionContent />
      <Outlet />
    </>
  );
};

// Define routes with the layout wrapper
const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "menu/:merchantId", element: <MenuPage /> },
      { path: "cart", element: <CartPage /> },
    ],
  },
]);

function App() {
  return (
    <SettingsProvider>
      <CartProvider>
        <div className="max-w-md mx-auto min-h-screen bg-gray-100 shadow-lg relative">
          <RouterProvider router={router} />
        </div>
      </CartProvider>
    </SettingsProvider>
  );
}

export default App;
