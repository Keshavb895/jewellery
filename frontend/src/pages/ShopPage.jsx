import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  ChevronDown,
  X,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Clock,
  ArrowRight,
} from "lucide-react";
import { ProductGrid } from "../components/product/ProductGrid.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";
import { useProducts } from "../context/ProductContext.jsx";
import { CATEGORIES } from "../data/demoProducts.js";

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, loading } = useProducts();
  const searchInputRef = useRef(null);

  const initialCat = searchParams.get("category") || "All";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [sortBy, setSortBy] = useState("featured");
  const [quickFilter, setQuickFilter] = useState("all"); // 'all' | 'trending' | 'new' | 'under2500'

  // Sync category state when URL search params change
  useEffect(() => {
    const cat = searchParams.get("category") || "All";
    setSelectedCategory(cat);
  }, [searchParams]);

  // Handle category change
  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    if (cat === "All") {
      searchParams.delete("category");
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: cat });
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setQuickFilter("all");
    setSortBy("featured");
    searchParams.delete("category");
    setSearchParams(searchParams);
  };

  // Determine all category buttons to display
  const displayCategories = useMemo(() => {
    const cats = [...CATEGORIES];
    // If a custom category was passed (like Jewellery Sets, Pendants, Bangles, Mangalsutra), keep it in list
    if (
      selectedCategory &&
      !cats.some((c) => c.toLowerCase() === selectedCategory.toLowerCase())
    ) {
      cats.push(selectedCategory);
    }
    return cats;
  }, [selectedCategory]);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts = { All: products.length };
    displayCategories.forEach((c) => {
      if (c !== "All") {
        counts[c] = products.filter((p) => {
          const prodCat = (p.category || "").toLowerCase();
          const target = c.toLowerCase();
          if (prodCat === target) return true;
          if (target === "jewellery sets" && (prodCat === "necklaces" || prodCat.includes("set"))) return true;
          if (target === "pendants" && (prodCat === "necklaces" || prodCat.includes("pendant"))) return true;
          if (target === "bangles" && (prodCat === "bracelets" || prodCat.includes("bangle"))) return true;
          if (target === "mangalsutra" && (prodCat === "necklaces" || prodCat.includes("mangalsutra"))) return true;
          return false;
        }).length;
      }
    });
    return counts;
  }, [products, displayCategories]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category filter
        const prodCat = (p.category || "").toLowerCase();
        const selCat = selectedCategory.toLowerCase();
        let matchesCategory = selCat === "all" || prodCat === selCat;
        if (!matchesCategory) {
          if (selCat === "jewellery sets" && (prodCat === "necklaces" || prodCat.includes("set"))) matchesCategory = true;
          if (selCat === "pendants" && (prodCat === "necklaces" || prodCat.includes("pendant"))) matchesCategory = true;
          if (selCat === "bangles" && (prodCat === "bracelets" || prodCat.includes("bangle"))) matchesCategory = true;
          if (selCat === "mangalsutra" && (prodCat === "necklaces" || prodCat.includes("mangalsutra"))) matchesCategory = true;
        }

        // Text search filter
        const term = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !term ||
          (p.name && p.name.toLowerCase().includes(term)) ||
          (p.description && p.description.toLowerCase().includes(term)) ||
          (p.material && p.material.toLowerCase().includes(term)) ||
          (p.category && p.category.toLowerCase().includes(term));

        // Quick filter pills
        let matchesQuick = true;
        if (quickFilter === "trending") matchesQuick = Boolean(p.isTrending);
        if (quickFilter === "new") matchesQuick = Boolean(p.isNewArrival);
        if (quickFilter === "under2500") matchesQuick = Number(p.price) <= 2500;

        return matchesCategory && matchesSearch && matchesQuick;
      })
      .sort((a, b) => {
        if (sortBy === "low") return Number(a.price) - Number(b.price);
        if (sortBy === "high") return Number(b.price) - Number(a.price);
        if (sortBy === "rating") return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        if (sortBy === "newest") {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        // Default "featured": trending / featured first
        const scoreA = (a.isFeatured ? 2 : 0) + (a.isTrending ? 1 : 0);
        const scoreB = (b.isFeatured ? 2 : 0) + (b.isTrending ? 1 : 0);
        return scoreB - scoreA;
      });
  }, [products, selectedCategory, searchTerm, sortBy, quickFilter]);

  const isFiltered =
    selectedCategory !== "All" ||
    searchTerm.trim() !== "" ||
    quickFilter !== "all" ||
    sortBy !== "featured";

  return (
    <main className="shop">
      {/* Breadcrumbs */}
      <div
        className="shop-breadcrumb"
        style={{
          padding: "20px 7vw 0",
          fontSize: "12px",
          color: "var(--muted)",
          display: "flex",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <Link to="/" style={{ color: "var(--muted)", textDecoration: "none" }}>
          Home
        </Link>
        <span>/</span>
        <span style={{ color: "var(--ink)", fontWeight: 500 }}>Shop All</span>
        {selectedCategory !== "All" && (
          <>
            <span>/</span>
            <span style={{ color: "#8a6d2b", fontWeight: 600 }}>{selectedCategory}</span>
          </>
        )}
      </div>

      {/* Luxury Editorial Header */}
      <div className="shophead reveal-up" style={{ padding: "40px 20px 30px" }}>
        <small
          style={{
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#8a6d2b",
            fontWeight: 600,
            fontSize: "11px",
            display: "inline-block",
            marginBottom: "10px",
          }}
        >
          COMPLETE JEWELRY COLLECTION
        </small>
        <h1 style={{ font: "400 52px 'Playfair Display', serif", margin: "0 0 14px", color: "#141210" }}>
          Jewelry, your way.
        </h1>
        <p style={{ color: "#6b625b", maxWidth: "560px", margin: "0 auto", lineHeight: 1.7, fontSize: "14.5px" }}>
          Explore every signature necklace, sculptural earring, stackable ring, and tennis bracelet crafted for everyday luxury.
        </p>
      </div>

      {/* Quick Filter Curations */}
      <div
        className="reveal-stagger"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          flexWrap: "wrap",
          padding: "0 5vw 28px",
        }}
      >
        <button
          type="button"
          onClick={() => setQuickFilter("all")}
          style={{
            padding: "8px 18px",
            borderRadius: "30px",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            border: "1px solid",
            borderColor: quickFilter === "all" ? "#141210" : "var(--line)",
            background: quickFilter === "all" ? "#141210" : "#fff",
            color: quickFilter === "all" ? "#fff" : "var(--ink)",
            transition: "all 0.2s ease",
          }}
        >
          All Curations
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter(quickFilter === "trending" ? "all" : "trending")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 18px",
            borderRadius: "30px",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            border: "1px solid",
            borderColor: quickFilter === "trending" ? "#c9822b" : "var(--line)",
            background: quickFilter === "trending" ? "#fbf4eb" : "#fff",
            color: quickFilter === "trending" ? "#a36015" : "var(--ink)",
            transition: "all 0.2s ease",
          }}
        >
          <Sparkles size={13} color="#c9822b" /> Trending Now
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter(quickFilter === "new" ? "all" : "new")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 18px",
            borderRadius: "30px",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            border: "1px solid",
            borderColor: quickFilter === "new" ? "#386b4a" : "var(--line)",
            background: quickFilter === "new" ? "#edf5f0" : "#fff",
            color: quickFilter === "new" ? "#235433" : "var(--ink)",
            transition: "all 0.2s ease",
          }}
        >
          <Clock size={13} color="#386b4a" /> New Arrivals
        </button>

        <button
          type="button"
          onClick={() => setQuickFilter(quickFilter === "under2500" ? "all" : "under2500")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 18px",
            borderRadius: "30px",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            border: "1px solid",
            borderColor: quickFilter === "under2500" ? "#8a6d2b" : "var(--line)",
            background: quickFilter === "under2500" ? "#fbf8f0" : "#fff",
            color: quickFilter === "under2500" ? "#8a6d2b" : "var(--ink)",
            transition: "all 0.2s ease",
          }}
        >
          <Tag size={13} color="#8a6d2b" /> Under ₹2,500
        </button>
      </div>

      {/* Main Filter Toolbar */}
      <div className="filters reveal-up">
        <div className="search">
          <Search size={16} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search pieces, metals, gemstones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 0 }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="cats">
          {displayCategories.map((cat) => {
            const count = categoryCounts[cat] ?? 0;
            const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                className={isActive ? "active" : ""}
                onClick={() => handleCategoryClick(cat)}
              >
                {cat} {count > 0 && <span style={{ opacity: 0.75, fontSize: "10px", marginLeft: "2px" }}>({count})</span>}
              </button>
            );
          })}
        </div>

        <label className="sort-label">
          <span>Sort</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="featured">Featured / Curated</option>
            <option value="newest">Newest Arrivals</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
          <ChevronDown size={14} />
        </label>
      </div>

      {/* Active Filter Info & Reset Button */}
      <div
        style={{
          padding: "0 7vw 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "13px",
          color: "var(--muted)",
        }}
      >
        <span>
          Showing{" "}
          <strong style={{ color: "var(--ink)" }}>{filteredProducts.length}</strong>{" "}
          {filteredProducts.length === 1 ? "piece" : "pieces"}
          {selectedCategory !== "All" && ` in ${selectedCategory}`}
          {quickFilter !== "all" && ` (${quickFilter})`}
          {searchTerm && ` matching "${searchTerm}"`}
        </span>

        {isFiltered && (
          <button
            type="button"
            onClick={clearAllFilters}
            style={{
              background: "none",
              border: "none",
              color: "#8a6d2b",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            Reset All Filters
          </button>
        )}
      </div>

      {/* Products Grid */}
      <div style={{ padding: "0 7vw" }}>
        {loading ? (
          <div className="loading-container">Loading jewelry collection...</div>
        ) : filteredProducts.length > 0 ? (
          <ProductGrid products={filteredProducts} />
        ) : (
          <EmptyState
            title="No jewelry pieces found"
            message="We couldn't find any pieces matching your current filters. Try resetting search terms or switching categories."
            actionText="Reset All Filters"
            onAction={clearAllFilters}
          />
        )}
      </div>
    </main>
  );
}
