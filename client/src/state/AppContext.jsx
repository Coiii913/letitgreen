import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

const AppContext = createContext(null);

const FAVORITES_KEY = "green_market_favorites";
const CART_KEY = "green_market_cart";

// 默认中心（都柏林），定位失败时使用
const DEFAULT_CENTER = { lat: 53.3438, lng: -6.2546 };

export function AppProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    setLoadingItems(true);
    axios
      .get("/api/items")
      .then((res) => setItems(res.data || []))
      .catch((err) => {
        console.error("Failed to load items", err);
      })
      .finally(() => setLoadingItems(false));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation(DEFAULT_CENTER),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addToCart = (id) => {
    setCart((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((x) => x !== id));
  };

  const value = useMemo(
    () => ({
      items,
      setItems,
      loadingItems,
      userLocation,
      favorites,
      toggleFavorite,
      cart,
      addToCart,
      removeFromCart
    }),
    [items, loadingItems, userLocation, favorites, cart]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within AppProvider");
  }
  return ctx;
}

