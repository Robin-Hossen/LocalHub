import { createContext, useContext, useState, useEffect } from "react";

import { useAuth } from "./AuthContext";

import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCartAPI,
} from "../services/cartService";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated, user, isLoadingUser } = useAuth();

  const isCustomer = isAuthenticated && user?.role === "CUSTOMER";

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCart = async () => {
    try {
      setLoading(true);

      const data = await getCart();

      setCartItems(
        data.items.map((item) => ({
          id: item.id,
          productId: item.product,
          name: item.product_name,
          category: "",
          price: Number(item.selling_price),
          quantity: item.quantity,
          subtotal: Number(item.subtotal),
        })),
      );
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoadingUser) return;

    if (isCustomer) {
      loadCart();
    } else {
      setCartItems([]);
    }
  }, [isCustomer, isLoadingUser]);

  const addToCart = async (product) => {
    if (!isAuthenticated) {
      return false;
    }

    try {
      const data = await addCartItem(product.id, 1);

      setCartItems(
        data.items.map((item) => ({
          id: item.id,
          productId: item.product,
          name: item.product_name,
          category: "",
          price: Number(item.selling_price),
          quantity: item.quantity,
          subtotal: Number(item.subtotal),
        })),
      );

      return true;
    } catch (error) {
      console.error("Failed to add product:", error);
      throw error;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;

    await updateCartItem(itemId, quantity);
    await loadCart();
  };

  const removeFromCart = async (itemId) => {
    await removeCartItem(itemId);
    await loadCart();
  };

  const clearCart = async () => {
    await clearCartAPI();
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartTotal,
        loading,
        loadCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
