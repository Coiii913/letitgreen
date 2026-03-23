/**
 * 碳排放计算工具
 * 基于生产排放量和衰减率计算二手商品的碳节省量
 */

// 商品类别的基准排放量 (kg CO₂)
const BASE_EMISSIONS = {
  'plant': 5.2,      // 植物类
  'electronics': 85, // 电子产品
  'clothes': 12,     // 衣物类
  'furniture': 40,   // 家具类
  'books': 3.5,      // 书籍类
  'sports': 18,      // 运动器材
  'default': 10      // 默认值
};

// 商品类别的衰减率 (基于商品类型和使用寿命)
const DECAY_RATES = {
  'plant': 0.15,      // 植物衰减较慢
  'electronics': 0.4, // 电子产品衰减快
  'clothes': 0.3,     // 衣物中等衰减
  'furniture': 0.2,   // 家具衰减较慢
  'books': 0.1,       // 书籍几乎不衰减
  'sports': 0.25,     // 运动器材中等衰减
  'default': 0.25     // 默认衰减率
};

/**
 * 计算碳节省量
 * @param {string} category - 商品类别
 * @param {number} customEmission - 自定义排放量（可选）
 * @param {number} customDecay - 自定义衰减率（可选）
 * @returns {number} - 节省的CO₂量 (kg)
 */
export const calculateCarbonSaved = (category, customEmission = null, customDecay = null) => {
  // 获取基准排放量
  const productionEmission = customEmission || BASE_EMISSIONS[category] || BASE_EMISSIONS.default;
  
  // 获取衰减率
  const decayRate = customDecay || DECAY_RATES[category] || DECAY_RATES.default;
  
  // 计算公式: CO₂_Saved = Production_Emission × (1 - Decay_Rate)
  const carbonSaved = productionEmission * (1 - decayRate);
  
  // 保留一位小数
  return Math.round(carbonSaved * 10) / 10;
};

/**
 * 根据商品标题智能判断类别
 * @param {string} title - 商品标题
 * @returns {string} - 商品类别
 */
export const detectCategory = (title) => {
  if (!title) return 'default';
  
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('plant') || titleLower.includes('jasmin') || titleLower.includes('flower') || titleLower.includes('tree')) {
    return 'plant';
  } else if (titleLower.includes('phone') || titleLower.includes('laptop') || titleLower.includes('electronic') || titleLower.includes('tv')) {
    return 'electronics';
  } else if (titleLower.includes('shirt') || titleLower.includes('pant') || titleLower.includes('dress') || titleLower.includes('jacket')) {
    return 'clothes';
  } else if (titleLower.includes('chair') || titleLower.includes('table') || titleLower.includes('desk') || titleLower.includes('sofa')) {
    return 'furniture';
  } else if (titleLower.includes('book') || titleLower.includes('novel') || titleLower.includes('magazine')) {
    return 'books';
  } else if (titleLower.includes('ball') || titleLower.includes('racket') || titleLower.includes('bike') || titleLower.includes('sport')) {
    return 'sports';
  }
  
  return 'default';
};