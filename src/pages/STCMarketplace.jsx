import dhmarketplaceServiceInstance from "../services/DHMarketPlaceServices";
import "./STCMarketplace.css";
import { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const MAX_BATCH_SIZE_MB = 5;
const MAX_BATCH_SIZE_BYTES = MAX_BATCH_SIZE_MB * 1024 * 1024;
const MY_ID = sessionStorage.getItem("userId");

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const STCMarketplace = () => {
  const [allFiles, setAllFiles] = useState([]);
  const [sizeError, setSizeError] = useState("");


  const [lock, setLock] = useState({ locked: false, lockedBy: "" });
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const stompRef = useRef(null);
  const xhrRef = useRef(null);

  useEffect(() => {


    console.log("INNNN");
    
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      onConnect: () => {
        // BUG FIX 1: was setting files instead of lock
        client.subscribe("/topic/lock", (msg) => {
          const data = JSON.parse(msg.body);
          console.log("Lock update:", data);
          setLock(data);
        });

        client.subscribe("/topic/files", (msg) => {
          const data = JSON.parse(msg.body);
          setFiles(Array.isArray(data) ? data : []);
        });

        // BUG FIX 2: was not returning r.json()
        fetch("http://localhost:8080/api/lock/status")
          .then(r => r.json())
          .then((data) => {
            console.log("Initial lock status:", data);
            setLock(data);
          });

        fetch("http://localhost:8080/api/lock/files")
          .then(r => r.json())
          .then((data) => setFiles(Array.isArray(data) ? data : []));
      },
    });
    client.activate();
    stompRef.current = client;

    window.addEventListener("beforeunload", () => {
      fetch(`http://localhost:8080/api/lock/release?userId=${MY_ID}`, { method: "POST" });
    });

    return () => client.deactivate();
  }, []);

  const isSameUser = lock.lockedBy === MY_ID;
  const isBlocked = lock.locked; // block everyone including same user



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
        setAllFiles([]);
      } else {
        throw new Error("Product Adding Failed!!");
      }
    } catch (error) {
      console.error("API Error:", error);
      alert("Product Operation failed!");
    }
  };

  const handleImageChange = async (e) => {



    const file = e.target.files[0];
    if (!file) return;

    if (lock.locked) {
      alert(`🔒 ${lock.lockedBy} is uploading. Please wait.`);
      e.target.value = "";
      return;
    }

    const res = await fetch(`http://localhost:8080/api/lock/acquire?userId=${MY_ID}`, { method: "POST" });
    const { acquired } = await res.json();

    if (!acquired) {
      alert("Another user is uploading.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);



    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const batchSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);

    if (batchSize > MAX_BATCH_SIZE_BYTES) {
      setSizeError(
        `This batch exceeds ${MAX_BATCH_SIZE_MB}MB (${formatFileSize(batchSize)}). Please re-upload with smaller images.`
      );
      e.target.value = "";
      return;
    }

    setSizeError("");
    setAllFiles((prev) => [...prev, ...selectedFiles]); // append to existing
    e.target.value = "";
  };

  const handleClearAll = () => {

    if (xhrRef.current) xhrRef.current.abort();
    fetch(`http://localhost:8080/api/lock/release?userId=${MY_ID}`, { method: "POST" });
    setSelectedFile(null);
    setUploading(false);


    setAllFiles([]);
    setSizeError("");
  };

  const handleSave = async () => {
    if (allFiles.length === 0) return;

    try {
      const base64Images = await Promise.all(
        allFiles.map((file) => fileToBase64(file))
      );
      await onSave({ images: base64Images });
    } catch (err) {
      console.error(err);
    }
    setSizeError("");
  };

  const totalSize = allFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <>
      {/* Upload Area */}
      <div className="contact-form-field uploadType">


        <h2>File Upload</h2>

        <p>My ID: {MY_ID}</p>
        <p>Lock state: {JSON.stringify(lock)}</p>

        {isBlocked && <p style={{ color: "red" }}>🔒 {lock.lockedBy} is uploading. Please wait...</p>}


        <p>Upload Images</p>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          onClick={(e) => {
            if (isBlocked) {
              e.preventDefault();
              alert(`🔒 ${lock.lockedBy} is uploading. Please wait.`);
            }
          }}
        />


        {/* Cancel button — shown as soon as file is selected OR lock is mine */}
        {(selectedFile || uploading || isSameUser) && (
          <button onClick={handleClearAll} style={{ color: "red", cursor: "pointer" }}>
            ✖ Cancel
          </button>
        )}


        {sizeError && (
          <p style={{ color: "red", marginTop: "6px", fontSize: "14px" }}>
            ⚠️ {sizeError}
          </p>
        )}
      </div>

      {/* File Preview List */}
      {allFiles.length > 0 && (
        <div
          style={{
            marginTop: "16px",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 14px",
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: "14px", color: "#374151" }}>
              📁 {allFiles.length} file{allFiles.length > 1 ? "s" : ""} selected
              &nbsp;·&nbsp;
              <span style={{ color: "#6b7280", fontWeight: 400 }}>
                {formatFileSize(totalSize)} total
              </span>
            </span>
            <button
              onClick={handleClearAll}
              style={{
                fontSize: "13px",
                color: "#ef4444",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              ✕ Clear All
            </button>
          </div>

        </div>
      )}

      {/* Save Button Only */}
      <div className="flex justify-center" style={{ marginTop: "16px" }}>
        <button
          onClick={handleSave}
          disabled={allFiles.length === 0}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </>
  );
};

export default STCMarketplace;