import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../state/AppContext.jsx";
import { distanceKm } from "../utils/geoUtils.js";

export default function ItemCard({ item }) {
  const navigate = useNavigate();
  const { favorites, toggleFavorite, userLocation } = useApp();
  const isFav = favorites.includes(item.id);

  const distance =
    userLocation && item.location?.lat != null && item.location?.lng != null
      ? distanceKm(
          userLocation.lat,
          userLocation.lng,
          item.location.lat,
          item.location.lng
        )
      : (item.distanceKm ?? 0.5);

  // Compute CO2 saved for display using available fields with fallbacks.
  const computeCo2Saved = (it) => {
    // If backend provided explicit productionEmission and decayRate, use formula.
    const p = typeof it.productionEmission === "number" ? it.productionEmission : null; // in kg
    const d = typeof it.decayRate === "number" ? it.decayRate : null; // fraction 0..1

    if (p !== null && d !== null) {
      return Math.max(0, p * (1 - d));
    }

    // If only productionEmission provided, assume a default decay rate (20%).
    if (p !== null) {
      return Math.max(0, p * (1 - 0.2));
    }

    // If legacy co2Kg exists and is negative (meaning saved), use its absolute value.
    if (typeof it.co2Kg === "number") {
      return Math.abs(it.co2Kg);
    }

    // Last-resort heuristic estimates based on tags and price.
    const baseByTag = (() => {
      if (it.tags?.includes("electronics")) return 80;
      if (it.tags?.includes("living") || it.tags?.includes("plant")) return 15;
      if (it.tags?.includes("clothing")) return 8;
      if (it.tags?.includes("sports")) return 25;
      return 20;
    })();

    // Scale by price a little (higher price -> likely larger item)
    const priceFactor = Math.min(3, Math.max(0.5, (Number(it.price) || 20) / 50));
    const estimatedProduction = baseByTag * priceFactor;
    const assumedDecay = 0.2;
    return Math.max(0, estimatedProduction * (1 - assumedDecay));
  };

  const co2SavedNum = computeCo2Saved(item);
  const co2Display = (typeof co2SavedNum === "number" ? co2SavedNum : 2.3).toFixed(1);

  return (
    <article className="item-card" onClick={() => navigate(`/items/${item.id}`)}>
      {/* 收藏按钮 */}
      <button
        type="button"
        className="item-card-fav"
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(item.id);
        }}
        aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
      >
        {isFav ? "★" : "☆"}
      </button>

      {/* 图片区域 */}
      <div className="item-card-image-wrapper">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="item-card-image"
        />
      </div>

      {/* 信息区域：左右分布 */}
      <div className="item-card-body">
        {/* 左侧：标题 + 距离位置 */}
        <div className="item-card-info-left">
          <h3 className="item-card-title">{item.title}</h3>
          <div className="item-card-location">
            {distance.toFixed(1)}km | {item.location?.label || item.location?.city || "Dublin"}
          </div>
        </div>

        {/* 右侧：价格 + 碳排放方块 */}
        <div className="item-card-info-right">
          <div className="item-card-price">€{item.price}</div>
          <div className="item-card-co2-badge">
            <span className="co2-num">-{co2Display}</span>
            <span className="co2-label">kg CO₂</span>
          </div>
        </div>
      </div>
    </article>
  );
}