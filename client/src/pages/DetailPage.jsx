import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useApp } from "../state/AppContext.jsx";

export default function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, favorites, toggleFavorite, addToCart } = useApp();
  const [item, setItem] = useState(() =>
    items.find((i) => i.id === id) || null
  );
  const [loading, setLoading] = useState(!item);

  useEffect(() => {
    if (item) return;
    let active = true;
    setLoading(true);
    axios
      .get(`/api/items/${id}`)
      .then((res) => {
        if (active) setItem(res.data);
      })
      .catch((err) => {
        console.error("Failed to load item", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, item]);

  if (loading || !item) {
    return (
      <div className="page detail-page">
        <div className="soft-pill">Loading item...</div>
      </div>
    );
  }

  const isFav = favorites.includes(item.id);

  const waLink = `https://wa.me/353000000000?text=${encodeURIComponent(
    `Hi, I'm interested in your item "${item.title}" on Sustainable Swaps in Dublin.`
  )}`;

  return (
    <div className="page detail-page">
      <div className="detail-layout">
        <section className="detail-gallery">
          <div className="detail-image-wrapper">
            <img src={item.imageUrl} alt={item.title} />
          </div>
          <div className="detail-gallery-thumbs">
            <button
              type="button"
              className="thumb is-active"
              aria-label="Current image"
            >
              <img src={item.imageUrl} alt={item.title} />
            </button>
          </div>
        </section>

        <section className="detail-main">
          <div className="detail-header">
            <button
              type="button"
              className="fav-circle"
              onClick={() => toggleFavorite(item.id)}
              aria-label={isFav ? "Unfavorite" : "Favorite"}
            >
              {isFav ? "★" : "☆"}
            </button>
            </div>

          <h1 className="detail-title">{item.title}</h1>
          <div className="detail-price-row">
            <div className="detail-price">
              {item.price}
              <span>{item.currency || "€"}</span>
            </div>
            <div className="detail-tags">
              <span className="tag-soft">
                {item.condition || "Used"} · {item.brand || "-"}
              </span>
              <span className="tag-soft">
                {item.location?.city || "Dublin"},{" "}
                {item.location?.postcode || ""}
              </span>
            </div>
          </div>

          <p className="detail-description">{item.description}</p>

          <section className="detail-ai-report">
            <h2>AI Environmental Snapshot</h2>
            <p>
              Choosing this second-hand item may avoid up to{" "}
              <strong>
                {typeof item.co2Kg === "number"
                  ? `${item.co2Kg.toFixed(1)} kg`
                  : "a few kg"}
              </strong>{" "}
              of CO₂ compared to buying new, based on typical production and
              transport footprints for similar items.
            </p>
            <p className="detail-ai-footnote">
              This is an indicative estimate only. Connect your own AI service
              later for precise, product-specific numbers.
            </p>
          </section>

          <div className="detail-actions">
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="primary-btn"
            >
              Chat on WhatsApp
            </a>
            <button
              type="button"
              className="solid-btn secondary"
              onClick={() => toggleFavorite(item.id)}
            >
              {isFav ? "✓ Added" : "Add to cart"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

