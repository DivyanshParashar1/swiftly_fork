import { useState } from "react";

export default function App() {
  const [resume, setResume] = useState({
    name: "Nakshatra Joshi",
    email: "nakshatra@email.com",
    phone: "9999999999"
  });

  const handleAutofill = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tab?.id) return;

    chrome.tabs.sendMessage(tab.id, {
      type: "AUTO_FILL",
      data: resume
    });
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>🚀 Autofill Assistant</h2>

      <button onClick={handleAutofill}>
        Auto Fill Form
      </button>
    </div>
  );
}