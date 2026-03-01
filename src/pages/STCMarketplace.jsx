import dhmarketplaceServiceInstance from "../services/DHMarketPlaceServices";
import "./STCMarketplace.css";
import { useState } from "react";

const MAX_TOTAL_SIZE_MB = 5;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

const STCMarketplace = () => {

  const [formData, setFormData] = useState({
    image: [],
  });
  const [sizeError, setSizeError] = useState("");

  // Convert file to base64
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onSave = async (productData) => {
    try {
      const newProduct = {
        images: productData?.images || [],
      };

      const response = await dhmarketplaceServiceInstance.addProduct(newProduct);

      if (response?.data?.productCreationResponse?.success) {
        alert("Product Added Successfully");
      } else {
        throw new Error("Product Adding Failed!!");
      }
    } catch (error) {
      console.error("API Error:", error);
      alert({ title: "Product Operation failed!" });
    }
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);

    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      setSizeError(
        `Total image size exceeds ${MAX_TOTAL_SIZE_MB}MB. Please re-upload with smaller images.`
      );
      setFormData({ ...formData, image: [] });
      e.target.value = ""; // reset file input
      return;
    }

    setSizeError("");
    setFormData({ ...formData, image: selectedFiles });
  };

  const handleSave = async () => {
    if (sizeError || formData.image.length === 0) return;

    try {
      const base64Images = await Promise.all(
        formData.image.map((file) => fileToBase64(file))
      );

      const formatted = {
        images: base64Images,
      };

      await onSave(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="contact-form-field uploadType">
        <p>Upload Images</p>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
        />
        {sizeError && (
          <p style={{ color: "red", marginTop: "6px", fontSize: "14px" }}>
            ⚠️ {sizeError}
          </p>
        )}
      </div>
      <div className="flex justify-center">
        <button
          onClick={handleSave}
          disabled={!!sizeError || formData.image.length === 0}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </>
  );
};

export default STCMarketplace;