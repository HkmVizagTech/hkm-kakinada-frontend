import React, { useEffect, useRef, useState } from "react";
import {
  BrowserMultiFormatReader,
  NotFoundException,
} from "@zxing/library";
import axios from "axios";
import { useToast } from "@chakra-ui/react"; 

const SuccessIcon = () => (
  <span style={{
    color: "#21cc51",
    fontSize: "1.5em",
    verticalAlign: "middle",
    marginRight: 6
  }}>✔️</span>
);
const WarningIcon = () => (
  <span style={{
    color: "#ff6b6b",
    fontSize: "1.5em",
    verticalAlign: "middle",
    marginRight: 6
  }}>⚠️</span>
);

const AdminQrScanner = () => {
  const videoRef = useRef(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [candidate, setCandidate] = useState(null);
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const toast = useToast();


  const lastScanRef = useRef({ value: "", time: 0 });

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    codeReader
      .listVideoInputDevices()
      .then((videoInputDevices) => {
        if (videoInputDevices.length === 0) {
          setError("No camera device found.");
          return;
        }
        const selectedDeviceId = videoInputDevices[0].deviceId;

        codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          async (res, err) => {
            if (res) {
              const scannedText = res.getText();
              setResult(scannedText);
              setError("");
              setStatus("");
              setMessage("");
              setCandidate(null);

             
              const now = Date.now();
              if (
                scannedText !== lastScanRef.current.value ||
                now - lastScanRef.current.time > 1500
              ) {
                lastScanRef.current = { value: scannedText, time: now };
                toast({
                  title: "QR Code Scanned",
                 
                  status: "success",
                  duration: 1800,
                  isClosable: true,
                  position: "top",
                });
              }

              try {
                console.log("📱 Sending QR token to backend:", scannedText);
                const token = localStorage.getItem("token");
                
                const res = await fetch(
                  "https://hkm-vanabhojan-backend-882278565284.europe-west1.run.app/users/admin/attendance-scan",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ token: scannedText })
                  }
                );
                
                const response = await res.json();
                console.log("✅ Backend response:", response);
                setCandidate(response.data);
                setStatus(response.status);
                setMessage(response.message);
              } catch (e) {
                console.error(" Error scanning QR:", e.response?.data || e.message);
                
                // Handle authentication errors
                if (e.response?.status === 401 || e.response?.status === 403) {
                  localStorage.removeItem("token");
                  localStorage.removeItem("role");
                  window.location.href = "/admin/login";
                  return;
                }
                
                setCandidate(null);
                setStatus("");
                setMessage("");
                setError(
                  e.response?.data?.message ||
                  e.message ||
                  "Error fetching candidate details"
                );
              }
            }
            if (err && !(err instanceof NotFoundException)) {
              setError(err.message || "QR scan error");
            }
          }
        );
      })
      .catch((err) => setError(err.message));

    return () => {
      codeReader.reset();
    };
  }, [toast]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f3f5f9 0%, #e9ecef 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "18px",
        boxShadow: "0 6px 30px 0 rgba(0,0,0,0.15)",
        padding: "32px 28px 40px 28px",
        width: "100%",
        maxWidth: "420px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <h2 style={{
          fontWeight: 700,
          marginBottom: "18px",
          letterSpacing: "0.5px",
          color: "#222"
        }}>Admin QR Scanner</h2>
        <video
          ref={videoRef}
          style={{
            width: "100%",
            maxWidth: "360px",
            height: "auto",
            borderRadius: "12px",
            border: "4px solid #e5eaf2",
            marginBottom: "26px",
            boxShadow: "0 2px 12px 0 rgba(44,62,80,0.07)"
          }}
        />
        {result && (
          <div style={{
            display: "flex",
            alignItems: "center",
            fontWeight: 700,
            fontSize: "1.1em",
            marginBottom: "16px",
            color: "#222"
          }}>
            <SuccessIcon />
           {/* <span>QR Code: <span style={{ fontWeight: 800, fontFamily: "monospace", letterSpacing: "0.5px" }}>{result}</span></span> */}
          </div>
        )}
        {candidate && (
          <div style={{
            marginBottom: "18px",
            width: "100%",
            background: "#f7fafd",
            borderRadius: "12px",
            boxShadow: "0 1.5px 6px 0 rgba(33, 204, 81, 0.04)",
            padding: "18px 16px",
            fontSize: "1.08em",
            color: "#2d3748"
          }}>
            <div style={{marginBottom: 6}}><b>Name:</b> {candidate.name}</div>
            {/* Uncomment for more details if available:
            {candidate.email && <div style={{marginBottom: 6}}><b>Email:</b> {candidate.email}</div>}
            {candidate.gender && <div style={{marginBottom: 6}}><b>Gender:</b> {candidate.gender}</div>}
            {candidate.college && <div><b>College:</b> {candidate.college}</div>} */}
          </div>
        )}
        {message && (
          <div style={{
            color: status === "already-marked" ? "#f44336" : "#21cc51",
            fontWeight: 700,
            fontSize: "1.05em",
            marginBottom: "6px",
            display: "flex",
            alignItems: "center"
          }}>
            {status === "already-marked" ? <WarningIcon /> : <SuccessIcon />}
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div style={{
            color: "#f44336",
            fontWeight: 600,
            marginTop: "18px",
            fontSize: "1em"
          }}>
            <WarningIcon />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminQrScanner;