import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useApp } from "../state/AppContext.jsx";

const IRISH_CITIES = [
  "Dublin",
  "Cork",
  "Galway",
  "Limerick",
  "Waterford",
  "Belfast",
  "Derry",
  "Drogheda",
  "Dundalk",
  "Bray",
  "Sligo",
  "Kilkenny"
];

const CONDITIONS = ["New", "Like new", "Used", "Well loved"];

export default function PostPage() {
  const navigate = useNavigate();
  const { setItems } = useApp();
  const [imagePreview, setImagePreview] = useState(null);
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState(CONDITIONS[2]);
  const [city, setCity] = useState("Dublin");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [brand, setBrand] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [visionLoading, setVisionLoading] = useState(false);
  const [priceSheetOpen, setPriceSheetOpen] = useState(false);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [aiSuggestedPrice, setAiSuggestedPrice] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleVisionAnalyze = async () => {
    if (!imagePreview) {
      alert("Please upload an image first.");
      return;
    }
    setVisionLoading(true);
    try {
      const res = await axios.post("/api/vision/analyze", {
        image: imagePreview
      });
      const suggestion = res.data?.suggestion;
      if (suggestion) {
        setTitle(suggestion.title || title);
        setDescription(suggestion.description || description);
      }
    } catch (err) {
      console.error("Vision analyze failed", err);
      alert("Vision API request failed. Check console for details.");
    } finally {
      setVisionLoading(false);
    }
  };

  const handleEnhance = async () => {
    if (!description.trim()) return;
    setAiLoading(true);
    try {
      const res = await axios.post("/api/ai/enhance", {
        text: description
      });
      if (res.data?.enhancedText) {
        setDescription(res.data.enhancedText);
      }
      if (typeof res.data?.suggestedPrice === "number") {
        setAiSuggestedPrice(res.data.suggestedPrice);
      }
    } catch (err) {
      console.error("AI enhance failed", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numericPrice = Number(price);
    if (!title.trim() || !description.trim() || Number.isNaN(numericPrice)) {
      return;
    }

    try {
      const res = await axios.post("/api/items", {
        title: title.trim(),
        description: description.trim(),
        price: numericPrice,
        currency: "€",
        condition,
        brand: brand.trim() || "-",
        location: {
          label: city,
          city,
          address: address.trim(),
          postcode: postcode.trim()
        },
        imageUrl:
          imagePreview ||
          "https://images.pexels.com/photos/5699666/pexels-photo-5699666.jpeg?auto=compress&cs=tinysrgb&w=800"
      });

      setItems((prev) => [res.data, ...(prev || [])]);
      navigate(`/items/${res.data.id}`);
    } catch (err) {
      console.error("Create item failed", err);
      const msg = err.response?.data?.error || err.message || "Failed to submit. Please try again.";
      alert(msg);
    }
  };

  return (
    <div className="page post-page">
      <form className="card post-card" onSubmit={handleSubmit}>
        <h2 className="section-title">Smart Posting</h2>

        <div className="post-top-row">
          <div className="image-upload">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="image-upload-preview"
              />
            ) : (
              <div className="image-upload-placeholder">
                <span className="plus">＋</span>
                <span>Add photo</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          <div className="post-text-area">
            <label className="field-label">Say a few words</label>
            <textarea
              rows={4}
              placeholder="E.g. Healthy plant looking for a new home..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="ai-actions-row">
              <button
                type="button"
                className="chip-btn"
                onClick={handleVisionAnalyze}
                disabled={visionLoading}
              >
                {visionLoading ? "Analyzing photo..." : "Use photo (Vision API)"}
              </button>
              <button
                type="button"
                className="chip-btn chip-btn-ai"
                onClick={handleEnhance}
                disabled={aiLoading}
              >
                {aiLoading ? "AI is thinking..." : "AI"}
              </button>
            </div>
          </div>
        </div>

        <div className="divider" />

        <div className="post-fields">
          <label className="field-block">
            <span className="field-label">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Plant Jasmeen"
            />
          </label>

          <button
            type="button"
            className="field-row"
            onClick={() => setPriceSheetOpen(true)}
          >
            <div>
              <div className="field-title">Price</div>
              <div className="field-subtitle">
                {price ? `${price} €` : "Tap to set price"}
              </div>
            </div>
            <div className="field-right">
              {aiSuggestedPrice != null && (
                <span className="tag-soft">
                  AI: {aiSuggestedPrice.toFixed(0)} €
                </span>
              )}
              <span className="field-chevron">›</span>
            </div>
          </button>

          <button
            type="button"
            className="field-row"
            onClick={() => setLocationSheetOpen(true)}
          >
            <div>
              <div className="field-title">Location</div>
              <div className="field-subtitle">{city}</div>
            </div>
            <span className="field-chevron">›</span>
          </button>

          <label className="field-block">
            <span className="field-label">Condition</span>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="field-block">
            <span className="field-label">Brand</span>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Optional"
            />
          </label>
        </div>

        <button type="submit" className="primary-btn submit-btn">
          Submit
        </button>
      </form>

      {priceSheetOpen && (
        <div className="sheet-backdrop" onClick={() => setPriceSheetOpen(false)}>
          <div
            className="sheet"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <h3 className="sheet-title">Price</h3>
            <div className="sheet-body">
              <div className="price-input-wrapper">
                <span className="currency-prefix">€</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                />
              </div>
              <p className="sheet-hint">
                Recommended price (AI) will appear here when connected.
              </p>
            </div>
            <button
              type="button"
              className="primary-btn"
              onClick={() => setPriceSheetOpen(false)}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {locationSheetOpen && (
        <div
          className="sheet-backdrop"
          onClick={() => setLocationSheetOpen(false)}
        >
          <div
            className="sheet"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <h3 className="sheet-title">Location</h3>
            <div className="sheet-body">
              <label className="field-block">
                <span className="field-label">City</span>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  {IRISH_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-block">
                <span className="field-label">Address</span>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street and number"
                />
              </label>
              <label className="field-block">
                <span className="field-label">Postcode</span>
                <input
                  type="text"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  placeholder="Eircode"
                />
              </label>
            </div>
            <button
              type="button"
              className="primary-btn"
              onClick={() => setLocationSheetOpen(false)}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

