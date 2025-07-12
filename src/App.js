import React, { useEffect, useState } from "react";
import axios from "axios";
import "./app.css";

function App() {
  const [ipos, setIpos] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const [selectedIPO, setSelectedIPO] = useState(null);
  const [showBrokerPopup, setShowBrokerPopup] = useState(false);
  const [showAllotmentPopup, setShowAllotmentPopup] = useState(false);

  useEffect(() => {
    axios
      .get(
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vRlsMurbsXT2UBQ2ADbyoiQtLUTznQU4vNzw3nS02_StSrFV9pkrnXOrNAjV_Yj-Byc_zw72z_rM0tQ/pub?output=csv"
      )
      .then((response) => {
        const rows = response.data.split("\n");
        const headers = rows[0].split(",");
        const data = rows.slice(1).map((row) => {
          const values = row.split(",");
          const entry = {};
          headers.forEach((header, index) => {
            entry[header.trim()] = values[index]?.trim();
          });
          return entry;
        });
        setIpos(data);
      });
  }, []);

  const sortTable = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedIpos = [...ipos].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valA = a[sortConfig.key] || "";
    const valB = b[sortConfig.key] || "";
    return sortConfig.direction === "ascending"
      ? valA.localeCompare(valB)
      : valB.localeCompare(valA);
  });

  const handleApplyClick = (ipo) => {
    setSelectedIPO(ipo);
    setShowBrokerPopup(true);
  };

  const handleAllotmentClick = (ipo) => {
    setSelectedIPO(ipo);
    setShowAllotmentPopup(true);
  };

  const closePopup = () => {
    setShowBrokerPopup(false);
    setShowAllotmentPopup(false);
    setSelectedIPO(null);
  };

  const brokerLinks = [
    {
      name: "Zerodha",
      url: "https://zerodha.com/open-account?referralCode=YOUR_REF",
      logo: "https://yourcdn.com/logos/zerodha.png",
    },
    {
      name: "Upstox",
      url: "https://upstox.com/open-account?referralCode=YOUR_REF",
      logo: "https://yourcdn.com/logos/upstox.png",
    },
    {
      name: "Groww",
      url: "https://groww.in/open-account?referralCode=YOUR_REF",
      logo: "https://yourcdn.com/logos/groww.png",
    },
    {
      name: "Angel One",
      url: "https://angelone.in/open-account?referralCode=YOUR_REF",
      logo: "https://yourcdn.com/logos/angelone.png",
    },
  ];

  const renderStatusIcon = (status) => {
    if (status.includes("Upcoming")) return "🗓️";
    if (status.includes("Open")) return "🟢";
    if (status.includes("Closed")) return "🕒";
    if (status.includes("Allotted")) return "✅";
    if (status.includes("Listed")) return "📈";
    return "❔";
  };

  return (
    <div className="App">
      <h1>📊 IPO Tracker</h1>
      <div className="table-container">
        <table className="ipo-table">
          <thead>
            <tr>
              {["Name", "Subscription", "Price", "Est Listing", "IPO Size", "Lot", "Open dt", "Close dt", "BoA Dt", "Listing dt", "Type", "Status"].map((header) => (
                <th key={header} onClick={() => sortTable(header)}>
                  {header} {sortConfig.key === header ? (sortConfig.direction === "ascending" ? "▲" : "▼") : ""}
                </th>
              ))}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedIpos.map((ipo, index) => (
              <tr key={index}>
                <td>{ipo.Name}</td>
                <td>{ipo.Subscription}</td>
                <td>{ipo.Price}</td>
                <td>{ipo["Est Listing"]}</td>
                <td>{ipo["IPO Size"]}</td>
                <td>{ipo.Lot}</td>
                <td>{ipo["Open dt"]}</td>
                <td>{ipo["Close dt"]}</td>
                <td>{ipo["BoA Dt"]}</td>
                <td>{ipo["Listing dt"]}</td>
                <td>{ipo.Type}</td>
                <td>{renderStatusIcon(ipo.Status)} {ipo.Status}</td>
                <td>
                  {ipo.Status?.includes("Open") || ipo.Status?.includes("Pre") ? (
                    <button onClick={() => handleApplyClick(ipo)}>Apply Now</button>
                  ) : ipo.Status?.includes("Allotted") || ipo.Status?.includes("Listed") ? (
                    <button onClick={() => handleAllotmentClick(ipo)}>Check Allotment</button>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showBrokerPopup && selectedIPO && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closePopup}>×</button>
            <h2>🛡️ Apply securely via verified investment brokers</h2>
            <div className="broker-banner-popup">
              {brokerLinks.map((broker) => (
                <a
                  key={broker.name}
                  href={broker.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="broker-card"
                  onClick={() => console.log(`Clicked on ${broker.name}`)}
                >
                  <img src={broker.logo} alt={broker.name} />
                  <span>{broker.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAllotmentPopup && selectedIPO && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closePopup}>×</button>
            <h2>Check Allotment</h2>
            {[selectedIPO.AllotmentLink1, selectedIPO.AllotmentLink2, selectedIPO.AllotmentLink3]
              .filter(Boolean)
              .map((link, idx) => (
                <div key={idx} className="allotment-link">
                  <a href={link} target="_blank" rel="noopener noreferrer">
                    Check allotment link {idx + 1} ↗
                  </a>
                </div>
              ))}
          </div>
        </div>
      )}

      <footer className="sticky-footer">
        <p className="ref-text">🛡️ Open Demat account securely with verified investment brokers.</p>
        <div className="broker-banner">
          {brokerLinks.map((broker) => (
            <a
              key={broker.name}
              href={broker.url}
              target="_blank"
              rel="noopener noreferrer"
              className="broker-card"
              onClick={() => console.log(`Clicked on ${broker.name}`)}
            >
              <img src={broker.logo} alt={broker.name} />
              <span>{broker.name}</span>
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default App;
