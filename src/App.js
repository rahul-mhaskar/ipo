import React, { useEffect, useState, useMemo } from "react";
import Papa from "papaparse";

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSHEORz3aArzaDTOWYW6FlC1avk1TYKAhDKfyALmqg2HMDWiD60N6WG2wgMlPkvLWC9d7YzwplhCStb/pub?gid=0&single=true&output=csv";

const App = () => {
  const [ipoData, setIpoData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [showBrokerPopup, setShowBrokerPopup] = useState(false);
  const [showAllotmentPopup, setShowAllotmentPopup] = useState(false);
  const [allotmentLinks, setAllotmentLinks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [layoutMode, setLayoutMode] = useState('card');
  const [isLoading, setIsLoading] = useState(true);

  const [showUpcomingSection, setShowUpcomingSection] = useState(false);
  const [showCurrentSection, setShowCurrentSection] = useState(true);
  const [showListedSection, setShowListedSection] = useState(false);

  const showMessage = (msg) => {
    setMessage(msg);
    setShowMessageBox(true);
    setTimeout(() => {
      setShowMessageBox(false);
      setMessage("");
    }, 3000);
  };

  useEffect(() => {
    setIsLoading(true);
    Papa.parse(GOOGLE_SHEET_CSV_URL, {
      download: true,
      header: true,
      complete: (result) => {
        const cleanedData = result.data.filter(row => row.Name && row.Name.trim() !== '');
        setIpoData(cleanedData);
        if (cleanedData.length > 0) {
          showMessage("IPO data loaded successfully!");
        } else {
          showMessage("No IPO data found. Please check your Google Sheet CSV for content.");
        }
        setIsLoading(false);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        showMessage("Failed to load IPO data. Please check the CSV URL and ensure it's publicly accessible.");
        setIsLoading(false);
      }
    });
  }, []);

  const sortBy = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const { upcomingIpos, currentIpos, listedIpos } = useMemo(() => {
    let sortableItems = [...ipoData];
    if (searchTerm) {
      sortableItems = sortableItems.filter(ipo =>
        ipo.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipo.Status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipo.Type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipo.GMP?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipo.Price?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key] || "";
        const bVal = b[sortConfig.key] || "";
        const numericKeys = ["GMP", "Price", "IPO Size", "Lot"];
        if (numericKeys.includes(sortConfig.key)) {
          const numA = parseFloat(String(aVal).replace(/[^0-9.-]+/g, ""));
          const numB = parseFloat(String(bVal).replace(/[^0-9.-]+/g, ""));
          return sortConfig.direction === "asc" ? numA - numB : numB - numA;
        }
        return sortConfig.direction === "asc"
          ? String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
          : String(bVal).localeCompare(String(aVal), undefined, { numeric: true });
      });
    }

    const upcoming = [], current = [], listed = [];

    sortableItems.forEach(ipo => {
      const status = ipo.Status ? String(ipo.Status).toLowerCase() : '';
      if (status.includes("upcoming") || status.includes("pre-open")) {
        upcoming.push(ipo);
      } else if (status.includes("apply") || status.includes("open") || status.includes("pending") || status.includes("allotted")) {
        current.push(ipo);
      } else if (status.includes("listed") || status.includes("closed")) {
        listed.push(ipo);
      }
    });

    return { upcomingIpos: upcoming, currentIpos: current, listedIpos: listed };
  }, [ipoData, sortConfig, searchTerm]);

  // ✅ Add this line to fix the blank screen bug
  const displayedIpoData = [...currentIpos, ...upcomingIpos, ...listedIpos];

  const handleApplyClick = () => setShowBrokerPopup(true);

  const handleAllotmentClick = (ipo) => {
    const links = [
      ipo.AllotmentLink1,
      ipo.AllotmentLink2,
      ipo.AllotmentLink3
    ].filter(Boolean);
    setAllotmentLinks(links);
    setShowAllotmentPopup(true);
  };

  const getStatusContent = (status, ipo) => {
    const cleanStatus = status ? String(status).toLowerCase() : '';
    if (cleanStatus.includes("apply")) {
      return <span className="text-blue-600 cursor-pointer hover:underline font-semibold" onClick={handleApplyClick}>🚀 {status}</span>;
    } else if (cleanStatus.includes("pre")) {
      return <span className="text-purple-600 font-semibold">🛒 {status}</span>;
    } else if (cleanStatus.includes("pending")) {
      return <span className="text-yellow-600 font-semibold">🕒 {status}</span>;
    } else if (cleanStatus.includes("allotted")) {
      return <span className="text-green-600 hover:underline cursor-pointer font-semibold" onClick={() => handleAllotmentClick(ipo)}>✅ {status}</span>;
    } else if (cleanStatus.includes("listed")) {
      return <span className="text-indigo-700 font-semibold">📈 {status}</span>;
    } else {
      return <span className="text-gray-500 font-semibold">📅 {status}</span>;
    }
  };

  const renderBrokerLinks = () => {
    const brokers = [
      {
        name: "Zerodha",
        href: "https://zerodha.com/open-account?c=VCB643",
        logo: "https://zerodha.com/static/images/logo.svg",
      },
      {
        name: "Upstox",
        href: "https://upstox.onelink.me/0H1s/4LAYGW",
        logo: "https://assets.upstox.com/website/images/upstox-new-logo.svg",
      },
      {
        name: "Paytm Money",
        href: "https://paytmmoney.page.link/DSwSvdhoasovQYLz9",
        logo: "https://play-lh.googleusercontent.com/nXCY9Did341stoQEhCEH5wJW2FBybZYbpiYl2J-eCajYOXZ_XXXHX1ptjATuA0zayg",
      },
    ];
    return brokers.map((broker, idx) => (
      <a
        key={idx}
        href={broker.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => showMessage(`Opening ${broker.name} account link.`)}
        className="flex flex-col items-center w-20 sm:w-24 text-center hover:scale-105 hover:shadow-lg transition-all p-1 sm:p-2 bg-gray-50 rounded-lg"
      >
        <img src={broker.logo} alt={broker.name} className="h-6 sm:h-8 mb-0.5 object-contain" />
        <span className="text-xs text-gray-600">{broker.name}</span>
      </a>
    ));
  };

  const tableHeaders = [
    "Name", "Type", "Status", "GMP", "Subscription", "Price", "Est Listing",
    "IPO Size", "Lot", "Open", "Close", "BoA Dt", "Listing"
  ];

  const renderTableSection = (title, ipoList, isVisible, toggleVisibility) => (
    <div className="mb-8">
      <div
        className="flex items-center justify-between bg-blue-100 p-3 rounded-t-lg cursor-pointer hover:bg-blue-200 transition-colors duration-200"
        onClick={toggleVisibility}
      >
        <h3 className="text-lg font-semibold text-blue-800">{title} ({ipoList.length})</h3>
        <svg className={`w-6 h-6 text-blue-800 transform transition-transform duration-200 ${isVisible ? 'rotate-0' : '-rotate-90'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isVisible ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
        {ipoList.length > 0 ? (
          <div className="overflow-x-auto border-t border-gray-200">
            <table className="w-full text-sm bg-white rounded-b-lg shadow-sm">
              <thead className="bg-gray-50">
                <tr>
                  {tableHeaders.map((header) => (
                    <th
                      key={header}
                      onClick={() => sortBy(header)}
                      className="px-3 py-2 cursor-pointer text-left border-b border-gray-200 text-gray-700 whitespace-nowrap"
                    >
                      {header}
                      <span className={sortConfig.key === header ? "text-black" : "text-gray-400"}>
                        {sortConfig.key === header ? (
                          sortConfig.direction === "asc" ? " ▲" : " ▼"
                        ) : " ⬍"}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ipoList.map((ipo, index) => (
                  <tr key={index} className="border-t border-gray-100 hover:bg-gray-50">
                    {tableHeaders.map((key) => (
                      <td key={key} className="px-3 py-2 border-b border-gray-100 whitespace-nowrap">
                        {key === "Status" ? getStatusContent(ipo[key], ipo) : ipo[key] || 'N/A'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-3 py-4 text-center text-gray-600 bg-white rounded-b-lg">No IPOs in this category.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      {/* ...Header and Search omitted for brevity... */}

      <main className="container mx-auto p-4 flex-grow overflow-y-auto pb-28">
        {/* Sort buttons and loading indicator */}
        {ipoData.length === 0 && (
          <div className="text-center text-gray-600 py-8">
            <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8..." />
            </svg>
            <p>Loading IPO data...</p>
          </div>
        )}

        {/* Card or Table layout */}
        {layoutMode === 'card' ? (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedIpoData.length > 0 ? (
              displayedIpoData.map((ipo, index) => (
                <div key={index} className="card p-6 flex flex-col justify-between">
                  <h2 className="text-xl font-semibold text-blue-700">{ipo.Name} ({ipo.Type})</h2>
                  {/* Additional card details */}
                </div>
              ))
            ) : (
              !isLoading && <p className="text-center col-span-full text-gray-600">No IPOs found matching your criteria.</p>
            )}
          </section>
        ) : (
          <>
            {renderTableSection("Current IPOs", currentIpos, showCurrentSection, () => setShowCurrentSection(!showCurrentSection))}
            {renderTableSection("Upcoming IPOs", upcomingIpos, showUpcomingSection, () => setShowUpcomingSection(!showUpcomingSection))}
            {renderTableSection("Listed IPOs", listedIpos, showListedSection, () => setShowListedSection(!showListedSection))}
          </>
        )}
      </main>

      {/* Footer, Popups, Message box... (omitted for brevity) */}
    </div>
  );
};

export default App;
