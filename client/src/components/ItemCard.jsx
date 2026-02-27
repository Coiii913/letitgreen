import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../state/AppContext.jsx";

export default function ItemCard({ item }) {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useApp();
  const isFav = favorites.includes(item.id);

  // 格式化碳排放数字
  const co2Display = typeof item.co2Kg === "number" ? Math.abs(item.co2Kg).toFixed(1) : "2.3";

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
            {(item.distanceKm ?? 0.5).toFixed(1)}km | {item.location?.label || "Dublin"}
          </div>
        </div>

        {/* 右侧：价格 + 碳排放方块 */}
        <div className="item-card-info-right">
          <div className="item-card-price">€{item.price}</div>
          <div className="item-card-co2-badge">
            <span className="co2-num">{co2Display}</span>
            <span className="co2-label">kg CO₂</span>
          </div>
        </div>
      </div>
    </article>
  );
}