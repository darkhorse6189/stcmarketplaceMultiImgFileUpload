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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("idle"); // "idle" | "uploading" | "success"

  const [lock, setLock] = useState({ locked: false, lockedBy: "" });
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const stompRef = useRef(null);
  const xhrRef = useRef(null);
  const tickIntervalRef = useRef(null); // to clear interval on cancel

  useEffect(() => {
    console.log("INNNN");

    const client = new Client({
      webSocketFactory: () => new SockJS("http://filelocking-0-rahul-uideployment.apps.nprdc-ocp.dhdigital.co.in/ws"),
      onConnect: () => {
        client.subscribe("/topic/lock", (msg) => {
          const data = JSON.parse(msg.body);
          console.log("Lock update:", data);
          setLock(data);
        });

        client.subscribe("/topic/files", (msg) => {
          const data = JSON.parse(msg.body);
          setFiles(Array.isArray(data) ? data : []);
        });

        fetch("http://filelocking-0-rahul-uideployment.apps.nprdc-ocp.dhdigital.co.in/api/lock/status")
          .then((r) => r.json())
          .then((data) => {
            console.log("Initial lock status:", data);
            setLock(data);
          });

        fetch("http://filelocking-0-rahul-uideployment.apps.nprdc-ocp.dhdigital.co.in/api/lock/files")
          .then((r) => r.json())
          .then((data) => setFiles(Array.isArray(data) ? data : []));
      },
    });
    client.activate();
    stompRef.current = client;

    window.addEventListener("beforeunload", () => {
      fetch(`http://filelocking-0-rahul-uideployment.apps.nprdc-ocp.dhdigital.co.in/api/lock/release?userId=${MY_ID}`, { method: "POST" });
    });

    return () => client.deactivate();
  }, []);

  const isSameUser = lock.lockedBy === MY_ID;
  const isBlocked = lock.locked;

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
        // alert("Product Added Successfully");
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

    const res = await fetch(`http://filelocking-0-rahul-uideployment.apps.nprdc-ocp.dhdigital.co.in/api/lock/acquire?userId=${MY_ID}`, { method: "POST" });
    const { acquired } = await res.json();

    if (!acquired) {
      alert("Another user is uploading.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);

    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const batchSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

    if (batchSize > MAX_BATCH_SIZE_BYTES) {
      setSizeError(
        `This batch exceeds ${MAX_BATCH_SIZE_MB}MB (${formatFileSize(batchSize)}). Please re-upload with smaller images.`
      );
      e.target.value = "";
      return;
    }

    setSizeError("");
    setAllFiles((prev) => [...prev, ...selectedFiles]);
    e.target.value = "";
  };

  const resetProgressState = () => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
    setUploadProgress(0);
    setUploadStatus("idle");
  };

  const handleClearAll = () => {
    if (xhrRef.current) xhrRef.current.abort();
    fetch(`http://filelocking-0-rahul-uideployment.apps.nprdc-ocp.dhdigital.co.in/api/lock/release?userId=${MY_ID}`, { method: "POST" });
    setSelectedFile(null);
    setUploading(false);
    setAllFiles([]);
    setSizeError("");
    resetProgressState();
  };

  const handleSave = async () => {
    if (allFiles.length === 0) return;

    setUploadStatus("uploading");
    setUploadProgress(0);

    try {
      // Phase 1 (0–60%): real per-file base64 conversion progress
      const base64Images = [];
      for (let i = 0; i < allFiles.length; i++) {
        const b64 = await fileToBase64(allFiles[i]);
        base64Images.push(b64);
        setUploadProgress(Math.round(((i + 1) / allFiles.length) * 60));
      }

      // Phase 2 (60–90%): simulated tick while API call is in-flight
      let tick = 60;
      tickIntervalRef.current = setInterval(() => {
        tick = Math.min(tick + 3, 90);
        setUploadProgress(tick);
      }, 200);

      await onSave({ images: base64Images });

      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;

      // Phase 3: jump to 100% on success
      setUploadProgress(100);
      setUploadStatus("success");

      setTimeout(() => {
        resetProgressState();
      }, 3000);
    } catch (err) {
      console.error(err);
      resetProgressState();
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

        {isBlocked && (
          <p style={{ color: "red" }}>🔒 {lock.lockedBy} is uploading. Please wait...</p>
        )}

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

      {/* Progress Bar */}
      {uploadStatus !== "idle" && (
        <div style={{ marginTop: "14px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px",
            }}
          >
            <span style={{ fontSize: "13px", color: "#374151", fontWeight: 500 }}>
              {uploadStatus === "success" ? "✅ Upload complete!" : "⏫ Uploading..."}
            </span>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: uploadStatus === "success" ? "#16a34a" : "#3b82f6",
              }}
            >
              {uploadProgress}%
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "8px",
              backgroundColor: "#e2e8f0",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${uploadProgress}%`,
                borderRadius: "999px",
                backgroundColor: uploadStatus === "success" ? "#16a34a" : "#3b82f6",
                transition: "width 0.25s ease, background-color 0.4s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-center" style={{ marginTop: "16px" }}>
        <button
          onClick={handleSave}
          disabled={allFiles.length === 0 || uploadStatus === "uploading"}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploadStatus === "uploading" ? "Uploading..." : "Save"}
        </button>
      </div>
    </>
  );
};

export default STCMarketplace;