import React, { useMemo, useState } from "react";
import { useApp } from "../state/AppContext.jsx";
import SearchBar from "../components/SearchBar.jsx";
import CategoryTabs from "../components/CategoryTabs.jsx";
import ItemCard from "../components/ItemCard.jsx";

export default function HomePage() {
  const { items, loadingItems } = useApp();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("recommend");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (category === "living" && !item.tags?.includes("living")) return false;
      if (
        category === "electronics" &&
        !item.tags?.includes("electronics")
      ) {
        return false;
      }
      if (category === "sports" && !item.tags?.includes("sports")) {
        return false;
      }
      if (!term) return true;
      return (
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        (item.location?.label || "")
          .toLowerCase()
          .includes(term)
      );
    });
  }, [items, search, category]);

  return (
    <div className="page home-page">
      <section className="home-hero">
        <SearchBar value={search} onChange={setSearch} />
        <CategoryTabs value={category} onChange={setCategory} />
  
      </section>
      <section className="home-grid-wrapper">
        {loadingItems && <div className="soft-pill">Loading items...</div>}
        {!loadingItems && filtered.length === 0 && (
          <div className="soft-pill">No items match your search yet.</div>
        )}
        <div className="home-grid">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}

