// ContactUs.js
import React, { useState } from "react";

const MIN_MESSAGE_LENGTH = 10;

export default function ContactUs({ user }) {
  const [message, setMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      setStatusMessage("Please sign in with Google to send a message.");
      return;
    }
    if (message.trim().length < MIN_MESSAGE_LENGTH) {
      setStatusMessage("Your message is too short.");
      return;
    }
    // Simulate sending
    console.log(`Message from ${user.email}: ${message}`);
    setStatusMessage("Thank you! Your message has been sent.");
    setMessage("");
    setTimeout(() => setStatusMessage(""), 3000);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-xl rounded-2xl border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Contact Us</h2>
      {!user && (
        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg shadow mb-4">
          <p className="text-sm font-medium">Please sign in with Google to contact us.</p>
        </div>
      )}
      {statusMessage && (
        <div className={`p-4 rounded-lg shadow-md mb-4 ${
          statusMessage.includes("sent") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          <p className="text-sm font-medium">{statusMessage}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={user?.displayName || "Guest"}
            readOnly
            className="w-full border border-gray-300 px-4 py-2 rounded-lg bg-gray-50 focus:outline-none"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={user?.email || "guest@example.com"}
            readOnly
            className="w-full border border-gray-300 px-4 py-2 rounded-lg bg-gray-50 focus:outline-none"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows="4"
            minLength={MIN_MESSAGE_LENGTH}
            className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={!user || message.trim().length < MIN_MESSAGE_LENGTH}
        >
          Send Message
        </button>
      </form>
    </div>
  );
}
