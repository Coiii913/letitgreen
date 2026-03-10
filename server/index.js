const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const Tesseract = require("tesseract.js");
const sharp = require("sharp");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.DEESEEK_API_KEY || "sk-008ec806b7ed408db3fe0f704bb3be24",
  baseURL: "https://api.deepseek.com",
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// In-memory data store (seed data so cards show on first load)
let items = [
  {
    id: "1",
    title: "Plant Jasmeen",
    description:
      "Healthy indoor plant in a ceramic pot. Looking for a new home in Dublin.",
    price: 30,
    currency: "EUR",
    distanceKm: 0.5,
    location: {
      label: "Trinity College Dublin",
      city: "Dublin",
      address: "College Green",
      postcode: "D02 PN40",
      lat: 53.3438,
      lng: -6.2546
    },
    condition: "New",
    brand: "Local",
    co2Kg: -2.3,
    postedMinutesAgo: 30,
    imageUrl:
      "https://images.pexels.com/photos/5699666/pexels-photo-5699666.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: ["living", "plant"]
  }
];

// Helper: compute CO2 saved for an item (kg)
const computeCo2SavedForItem = (it) => {
  const p = typeof it.productionEmission === "number" ? it.productionEmission : null;
  const d = typeof it.decayRate === "number" ? it.decayRate : null;

  if (p !== null && d !== null) {
    return Math.max(0, p * (1 - d));
  }
  if (p !== null) {
    return Math.max(0, p * (1 - 0.2));
  }
  if (typeof it.co2Kg === "number") {
    return Math.abs(it.co2Kg);
  }

  // Heuristic fallback based on tags and price
  let base = 20;
  if (it.tags?.includes("electronics")) base = 80;
  else if (it.tags?.includes("living") || it.tags?.includes("plant")) base = 15;
  else if (it.tags?.includes("clothing")) base = 8;
  else if (it.tags?.includes("sports")) base = 25;

  const priceFactor = Math.min(3, Math.max(0.5, (Number(it.price) || 20) / 50));
  const estimatedProduction = base * priceFactor;
  const assumedDecay = 0.2;
  return Math.max(0, estimatedProduction * (1 - assumedDecay));
};

// Ensure seed items have co2Saved computed
items = items.map((it) => ({ ...it, co2Saved: computeCo2SavedForItem(it) }));

// API: list items
app.get("/api/items", (req, res) => {
  res.json(items);
});

// API: get single item
app.get("/api/items/:id", (req, res) => {
  const item = items.find((i) => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }
  res.json(item);
});

// API: create item
app.post("/api/items", async (req, res) => {
  const {
    title,
    description,
    price,
    currency = "EUR",
    location,
    condition,
    brand,
    co2Kg,
    imageUrl,
    tags
  } = req.body || {};

  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  if (!title || !description || (numPrice !== 0 && !numPrice)) {
    return res.status(400).json({
      error: "title, description and price are required",
      received: { title: !!title, description: !!description, price }
    });
  }

  // Extract keywords using AI
  let keywords = [];
  try {
    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: `Extract key search keywords from this product description: "${description}". Return as JSON array of strings.`
        }
      ],
    });
    const content = response.choices[0].message.content;
    keywords = JSON.parse(content) || [];
  } catch (err) {
    console.error("Keyword extraction failed", err);
    // Fallback to simple split
    keywords = description.split(' ').slice(0, 5);
  }

  const newItem = {
    id: String(Date.now()),
    title: String(title).trim(),
    description: String(description).trim(),
    price: Number(numPrice),
    currency: currency || "EUR",
    distanceKm: location?.distanceKm ?? 0.5,
    location: {
      label: location?.label || location?.city || "Dublin",
      city: location?.city || "Dublin",
      address: location?.address || "",
      postcode: location?.postcode || "",
      lat: location?.lat ?? 53.3438,
      lng: location?.lng ?? -6.2546
    },
    condition: condition || "Used",
    brand: brand ? String(brand).trim() : "-",
    co2Kg: co2Kg ?? -2.3,
    postedMinutesAgo: 0,
    imageUrl:
      imageUrl && typeof imageUrl === "string" && imageUrl.startsWith("data:")
        ? imageUrl
        : imageUrl ||
          "https://images.pexels.com/photos/5699666/pexels-photo-5699666.jpeg?auto=compress&cs=tinysrgb&w=800",
    tags: Array.isArray(tags) ? tags : [],
    keywords: keywords
  };

  // Compute and attach co2Saved for the new item
  newItem.co2Saved = computeCo2SavedForItem(newItem);

  items.unshift(newItem);
  res.status(201).json(newItem);
});

// Stub: vision / AI
app.post("/api/vision/analyze", async (req, res) => {
  const { image } = req.body;
  console.log("Vision analyze request received", { imageSize: image?.length });
  if (!image) {
    return res.status(400).json({ error: "Image is required" });
  }
  
  try {
    // Step 1: Extract image data and convert to buffer
    let imageBuffer;
    if (image.startsWith("data:")) {
      // data:image/jpeg;base64,...
      const base64Data = image.split(",")[1];
      imageBuffer = Buffer.from(base64Data, "base64");
    } else {
      imageBuffer = Buffer.from(image);
    }
    
    console.log("Processing image with local OCR (Tesseract)...");
    
    // Step 2: Use Tesseract for text recognition (OCR)
    const result = await Tesseract.recognize(imageBuffer, "eng");
    const extractedText = result.data.text;
    console.log("Extracted text from image:", extractedText.substring(0, 200));
    
    // Step 3: Use DeepSeek to enhance and create product listing from extracted info
    let productDescription = extractedText.trim();
    if (productDescription.length < 10) {
      productDescription = "A product image for Dublin student market";
    }
    
    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: `Based on this information extracted from a product image: "${productDescription}"
          
Generate a compelling product listing for a second-hand marketplace in Dublin. Consider:
- Is it furniture, electronics, books, clothing, or other items?
- Would it fit in a small student dorm room (typically 10-15 sqm)?
- What are its key features and selling points?

Return ONLY a valid JSON response (no markdown, no code blocks):
{
  "title": "Product title (3-5 words, suitable for small Dublin dorms)",
  "description": "2-3 sentence product description with size, condition, and suitability for Dublin students"
}`
        }
      ],
    });
    
    console.log("DeepSeek response:", response.choices[0].message.content.substring(0, 200));
    const content = response.choices[0].message.content.trim();
    
    let parsed;
    try {
      // Clean up response - remove markdown code blocks if present
      let cleanedContent = content;
      if (cleanedContent.includes("```json")) {
        cleanedContent = cleanedContent.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      }
      parsed = JSON.parse(cleanedContent);
    } catch (e) {
      console.log("Failed to parse JSON response, using fallback");
      parsed = {
        title: "Second-hand Product",
        description: content.substring(0, 200)
      };
    }
    
    res.json({
      status: "ok",
      suggestion: {
        title: parsed.title || "Second-hand Item",
        description: parsed.description || "A great item for Dublin students"
      },
      extractedText: extractedText.substring(0, 100) // Debug: show what was extracted
    });
    
  } catch (err) {
    console.error("Vision analyze failed:", err.message);
    res.status(500).json({ 
      error: "AI analysis failed: " + (err.message || "Unknown error") 
    });
  }
});

app.post("/api/ai/enhance", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }
  try {
    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: `Enhance this product description for a second-hand marketplace: "${text}". Also extract key keywords for search. Return in JSON format: {"enhancedText": "...", "keywords": ["key1", "key2"]}`
        }
      ],
    });
    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);
    res.json({
      status: "ok",
      enhancedText: parsed.enhancedText || text,
      keywords: parsed.keywords || []
    });
  } catch (err) {
    console.error("AI enhance failed", err);
    res.status(500).json({ error: "AI enhancement failed" });
  }
});

// API: AI search
app.post("/api/search", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }
  try {
    // Use AI to analyze query and find matching items
    const prompt = `User search query: "${query}". Analyze this query for a second-hand marketplace. Consider context like Dublin student dorms (typical size ~10-15 sqm). For items that match, calculate a "compatibility score" (0-100) based on size fit for small spaces, and a "value index" (0-100) based on price vs quality. Return JSON: {"matches": [{"itemId": "id", "compatibilityScore": 85, "valueIndex": 90, "reason": "brief explanation"}]}`;
    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
    });
    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);
    const matches = parsed.matches || [];
    // Filter items based on matches
    const matchedItems = items.filter(item => matches.some(m => m.itemId === item.id));
    // Add scores to items
    const enrichedItems = matchedItems.map(item => {
      const match = matches.find(m => m.itemId === item.id);
      return { ...item, compatibilityScore: match?.compatibilityScore || 0, valueIndex: match?.valueIndex || 0, matchReason: match?.reason || "" };
    });
    res.json({ items: enrichedItems });
  } catch (err) {
    console.error("AI search failed", err);
    // Fallback to simple search
    const term = query.toLowerCase();
    const filtered = items.filter(item =>
      item.title.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.keywords?.some(k => k.toLowerCase().includes(term))
    );
    res.json({ items: filtered });
  }
});

// Optional: serve built client
const clientDistPath = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDistPath));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDistPath, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
