import React from 'react';
import { calculateCarbonSaved, detectCategory } from '../utils/carbonCalculator';
import './ProductCard.css'; // 确保有这个CSS文件

const ProductCard = ({ product }) => {
  const {
    id,
    title,
    price,
    distance,
    location,
    image,
    category: propCategory
  } = product;

  // 检测商品类别
  const category = propCategory || detectCategory(title);
  
  // 计算碳节省量
  const carbonSaved = calculateCarbonSaved(category);

  return (
    <div className="product-card">
      <div className="product-image">
        <img src={image || '/placeholder.jpg'} alt={title} />
        {/* 碳标签 - 右下角 */}
        <div className="carbon-badge">
          <span className="carbon-value">{carbonSaved} kg</span>
          <span className="carbon-label">CO₂ saved</span>
        </div>
      </div>
      
      <div className="product-info">
        <h3 className="product-title">{title}</h3>
        <p className="product-price">€{price}</p>
        <p className="product-location">
          {distance} | {location}
        </p>
        <p className="product-carbon">{carbonSaved} KG CO₂</p>
      </div>
    </div>
  );
};

export default ProductCard;