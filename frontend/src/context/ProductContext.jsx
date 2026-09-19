import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getProducts, createProductApi, updateProductApi, deleteProductApi } from "../services/api.js";

const ProductContext = createContext();

const LOCAL_PRODUCTS_KEY = "aurelia_managed_products";

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load products from API and merge with locally saved additions / deletions
  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const fetched = await getProducts();
      const savedLocal = localStorage.getItem(LOCAL_PRODUCTS_KEY);

      if (savedLocal) {
        try {
          const { added = [], deletedIds = [] } = JSON.parse(savedLocal);
          // Filter out deleted items
          let merged = fetched.filter(p => !deletedIds.includes(p.id) && !deletedIds.includes(p._id));
          // Add newly created items that aren't already in fetched
          for (const item of added) {
            if (!deletedIds.includes(item.id) && !deletedIds.includes(item._id)) {
              if (!merged.some(m => (m.id || m._id) === (item.id || item._id))) {
                merged.unshift(item);
              }
            }
          }
          setProducts(merged);
          setLoading(false);
          return;
        } catch {
          // Ignore parse errors
        }
      }

      setProducts(fetched);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const addProduct = async (productData) => {
    const created = await createProductApi(productData);

    // Save to local storage cache for persistence
    try {
      const saved = JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY) || '{"added":[],"deletedIds":[]}');
      saved.added.unshift(created);
      localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(saved));
    } catch {
      // Ignore
    }

    setProducts(prev => [created, ...prev]);
    return created;
  };

  const updateProduct = async (id, productData) => {
    const updated = await updateProductApi(id, productData);

    try {
      const saved = JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY) || '{"added":[],"deletedIds":[]}');
      saved.added = saved.added.map(p => ((p.id || p._id) === id ? updated : p));
      localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(saved));
    } catch {
      // Ignore
    }

    setProducts(prev => prev.map(p => ((p.id || p._id) === id ? updated : p)));
    return updated;
  };

  const deleteProduct = async (id) => {
    await deleteProductApi(id);

    try {
      const saved = JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY) || '{"added":[],"deletedIds":[]}');
      if (!saved.deletedIds.includes(id)) {
        saved.deletedIds.push(id);
      }
      saved.added = saved.added.filter(p => (p.id || p._id) !== id);
      localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(saved));
    } catch {
      // Ignore
    }

    setProducts(prev => prev.filter(p => (p.id || p._id) !== id));
    return true;
  };

  const decrementStock = (orderedItems = []) => {
    setProducts(prev =>
      prev.map(p => {
        const ordered = orderedItems.find(item => (item.id || item._id) === (p.id || p._id));
        if (ordered) {
          const newStock = Math.max(0, (Number(p.stock) || 0) - (Number(ordered.quantity) || 1));
          return { ...p, stock: newStock };
        }
        return p;
      })
    );
    // Background refresh from MongoDB Atlas
    setTimeout(loadCatalog, 1200);
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        addProduct,
        updateProduct,
        deleteProduct,
        decrementStock,
        refreshProducts: loadCatalog,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
}
