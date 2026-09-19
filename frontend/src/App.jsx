import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar.jsx";
import { Footer } from "./components/layout/Footer.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { ProductDetailPage } from "./pages/ProductDetailPage.jsx";
import { CartPage } from "./pages/CartPage.jsx";
import { WishlistPage } from "./pages/WishlistPage.jsx";
import { AboutPage } from "./pages/AboutPage.jsx";
import { NotFoundPage } from "./pages/NotFoundPage.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";
import { AdminRoute } from "./components/admin/AdminRoute.jsx";
import { AuthPage } from "./pages/AuthPage.jsx";
import { OrdersPage } from "./pages/OrdersPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { ProductProvider } from "./context/ProductContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

import { ShopPage } from "./pages/ShopPage.jsx";
import { ScrollObserver } from "./components/common/ScrollObserver.jsx";

export default function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <CartProvider>
          <WishlistProvider>
            <div className="app-container">
              <ScrollObserver />
              <Navbar />
              <div className="app-content">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/product/:slug" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/my-orders" element={<OrdersPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    }
                  />
                  <Route path="/login" element={<AuthPage />} />
                  <Route path="/register" element={<AuthPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </div>
              <Footer />
            </div>
          </WishlistProvider>
        </CartProvider>
      </ProductProvider>
    </AuthProvider>
  );
}
