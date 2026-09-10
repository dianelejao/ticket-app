import { createContext, useContext, useState, useMemo } from 'react';

const CartContext = createContext(null);

/**
 * Panier en memoire (par session). Un item = une categorie de billet pour un evenement.
 * { event, category, quantity }
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = (event, category, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.category.id === category.id);
      if (existing) {
        return prev.map((i) =>
          i.category.id === category.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { event, category, quantity }];
    });
  };

  const updateQuantity = (categoryId, quantity) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.category.id !== categoryId)
        : prev.map((i) => (i.category.id === categoryId ? { ...i, quantity } : i))
    );
  };

  const removeItem = (categoryId) => {
    setItems((prev) => prev.filter((i) => i.category.id !== categoryId));
  };

  const clearCart = () => setItems([]);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.category.price_ariary) * i.quantity, 0),
    [items]
  );

  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
