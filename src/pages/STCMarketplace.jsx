import dhmarketplaceServiceInstance from "../services/DHMarketPlaceServices";
import "./STCMarketplace.css";
import { useState } from "react";

const STCMarketplace = () => {

  const [formData, setFormData] = useState({
    image: [],
  });
  
   // Convert file to base64
  const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]); // pure base64
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


 const handleSave = async () => {
  try {
    const base64Images = await Promise.all(
      formData.image.map((file) => fileToBase64(file))
    );

    const formatted = {
      images: base64Images, // array of base64 images
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
            onChange={(e) =>
              setFormData({ ...formData, image: Array.from(e.target.files) })
            }
          />
        </div>
        <div className="flex justify-center">
          <button 
            onClick={handleSave} 
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Save
          </button>
        </div>
    </>
  );
};

export default STCMarketplace;
