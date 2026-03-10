import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { useApp } from "../state/AppContext.jsx";
import SearchBar from "../components/SearchBar.jsx";
import CategoryTabs from "../components/CategoryTabs.jsx";
import ItemCard from "../components/ItemCard.jsx";

export default function HomePage() {
  const { items: allItems, loadingItems } = useApp();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("recommend");
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Debounce the search input to avoid spamming the AI search endpoint
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!debouncedSearch) {
      setFilteredItems(allItems);
      return;
    }
    setSearchLoading(true);
    axios.post("/api/search", { query: debouncedSearch })
      .then(res => {
        setFilteredItems(res.data.items || []);
      })
      .catch(err => {
        console.error("Search failed", err);
        // Fallback to local filter
        const term = debouncedSearch.toLowerCase();
        setFilteredItems(allItems.filter(item =>
          item.title.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term) ||
          (item.keywords || []).some(k => k.toLowerCase().includes(term))
        ));
      })
      .finally(() => setSearchLoading(false));
  }, [debouncedSearch, allItems]);

  const finalFiltered = useMemo(() => {
    return filteredItems.filter((item) => {
      if (category === "living" && !item.tags?.includes("living")) return false;
      if (category === "electronics" && !item.tags?.includes("electronics")) return false;
      if (category === "sports" && !item.tags?.includes("sports")) return false;
      return true;
    });
  }, [filteredItems, category]);

  return (
    <div className="page home-page">
      <section className="home-hero">
        <SearchBar value={search} onChange={setSearch} />
        <CategoryTabs value={category} onChange={setCategory} />

      </section>
      <section className="home-grid-wrapper">
        {(loadingItems || searchLoading) && <div className="soft-pill">Loading items...</div>}
        {!loadingItems && !searchLoading && finalFiltered.length === 0 && (
          <div className="soft-pill">No items match your search yet.</div>
        )}
        <div className="home-grid">
          {finalFiltered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}

