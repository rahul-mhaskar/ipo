import React, { useEffect, useState, useMemo } from "react";
import Papa from "papaparse"; // Reverted to direct import, assuming npm install is handled

// IMPORTANT: Replace with your actual Google Sheet CSV URL
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRlsMurbsXT2UBQ2ADbyoiQtLUTznQU4vNzw3nS02_StSrFV9pkrnXOrNAjV_Yj-Byc_zw72z_rM0tQ/pub?output=csv";


const App = () => {
  const [ipoData, setIpoData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [showBrokerPopup, setShowBrokerPopup] = useState(false);
  const [showAllotmentPopup, setShowAllotmentPopup] = useState(false);
  const [allotmentLinks, setAllotmentLinks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [layoutMode, setLayoutMode] = useState('card'); // 'card' or 'table'
  const [isLoading, setIsLoading] = useState(true); // Loading state for data fetch

  // State for toggling table sections visibility
  const [showUpcomingSection, setShowUpcomingSection] = useState(false);
  const [showCurrentSection, setShowCurrentSection] = useState(true); // Default to open
  const [showListedSection, setShowListedSection] = useState(false);

  // Function to show a custom message box
  const showMessage = (msg) => {
    setMessage(msg);
    setShowMessageBox(true);
    setTimeout(() => {
      setShowMessageBox(false);
      setMessage("");
    }, 3000); // Hide after 3 seconds
  };

  useEffect(() => {
    setIsLoading(true); // Set loading state to true when fetching starts
    Papa.parse(GOOGLE_SHEET_CSV_URL, {
      download: true,
      header: true,
      complete: (result) => {
        // Filter out empty rows that PapaParse might include
        const cleanedData = result.data.filter(row => row.Name);
        setIpoData(cleanedData);
        if (cleanedData.length > 0) {
          showMessage("IPO data loaded successfully!");
        } else {
          showMessage("No IPO data found. Please check your Google Sheet CSV.");
        }
        setIsLoading(false); // Set loading to false when complete
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        showMessage("Failed to load IPO data. Please check the CSV URL and ensure it's publicly accessible.");
        setIsLoading(false); // Set loading to false on error
      }
    });
  }, []); // Run only once on component mount

  const sortBy = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Memoize sorted and filtered data for performance and categorization
  const { upcomingIpos, currentIpos, listedIpos } = useMemo(() => {
    let sortableItems = [...ipoData];

    // Filter based on search term
    if (searchTerm) {
      sortableItems = sortableItems.filter(ipo =>
        ipo.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipo.Status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipo.Type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipo.GMP?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipo.Price?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort based on sortConfig
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key] || "";
        const bVal = b[sortConfig.key] || "";

        // Handle numeric sorting for GMP, Price, IPO Size, Lot
        const numericKeys = ["GMP", "Price", "IPO Size", "Lot"];
        if (numericKeys.includes(sortConfig.key)) {
          const numA = parseFloat(String(aVal).replace(/[^0-9.-]+/g, ""));
          const numB = parseFloat(String(bVal).replace(/[^0-9.-]+/g, ""));
          if (sortConfig.direction === "asc") {
            return numA - numB;
          }
          return numB - numA;
        }

        // Default to string comparison for other keys
        if (sortConfig.direction === "asc") {
          return String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        }
        return String(bVal).localeCompare(String(aVal), undefined, { numeric: true });
      });
    }

    // Categorize IPOs based on status keywords
    const upcoming = [];
    const current = [];
    const listed = [];

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

  const handleApplyClick = () => {
    setShowBrokerPopup(true);
  };

  const handleAllotmentClick = (ipo) => {
    const links = [
      ipo.AllotmentLink1,
      ipo.AllotmentLink2,
      ipo.AllotmentLink3
    ].filter(Boolean); // Filter out undefined/null/empty strings
    setAllotmentLinks(links);
    setShowAllotmentPopup(true);
  };

  const getStatusContent = (status, ipo) => {
    const cleanStatus = status ? String(status).toLowerCase() : ''; // Handle undefined status
    if (cleanStatus.includes("apply")) {
      return (
        <span className="text-blue-600 cursor-pointer hover:underline font-semibold" onClick={handleApplyClick}>
          � {status}
        </span>
      );
    } else if (cleanStatus.includes("pre")) {
      return <span className="text-purple-600 font-semibold">🛒 {status}</span>;
    } else if (cleanStatus.includes("pending")) {
      return <span className="text-yellow-600 font-semibold">🕒 {status}</span>;
    } else if (cleanStatus.includes("allotted")) {
      return (
        <span className="text-green-600 hover:underline cursor-pointer font-semibold" onClick={() => handleAllotmentClick(ipo)}>
          ✅ {status}
        </span>
      );
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

  // Define headers for the table view based on your CSV columns
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
        <svg
          className={`w-6 h-6 text-blue-800 transform transition-transform duration-200 ${isVisible ? 'rotate-0' : '-rotate-90'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
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
                        {key === "Status"
                          ? getStatusContent(ipo[key], ipo)
                          : ipo[key] || 'N/A'} {/* Display N/A for empty cells */}
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
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-4 shadow-lg rounded-b-xl">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center mb-2 sm:mb-0">
            {/* Using a simple SVG for the logo as image path won't work directly */}
            <svg className="w-10 h-10 mr-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 22h20L12 2zm0 17l-5-10h10l-5 10z"/>
            </svg>
            <h1 className="text-3xl font-bold">IPO Tracker</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-1/2">
            <div className="relative w-full sm:w-2/3">
              <input
                type="text"
                id="searchInput"
                placeholder="Search IPOs..."
                className="w-full p-2 pl-10 rounded-lg bg-white bg-opacity-20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
              </svg>
            </div>
            {/* Toggle Button for Layout */}
            <button
              onClick={() => setLayoutMode(layoutMode === 'card' ? 'table' : 'card')}
              className="bg-white text-blue-700 font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-100 transition duration-300 ease-in-out w-full sm:w-auto"
            >
              Switch to {layoutMode === 'card' ? 'Table' : 'Card'} View
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Added pb-28 to account for fixed footer height */}
      <main className="container mx-auto p-4 flex-grow overflow-y-auto pb-28">
        <div className="mb-6 flex justify-end">
            <button
                onClick={() => sortBy("Name")}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out mr-2"
            >
                Sort by Name {sortConfig.key === "Name" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "⬍"}
            </button>
            <button
                onClick={() => sortBy("Open")}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
            >
                Sort by Open Date {sortConfig.key === "Open" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "⬍"}
            </button>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="text-center text-gray-600 py-8">
            <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>Loading IPO data...</p>
          </div>
        )}

        {/* Conditional Rendering for Layout */}
        {!isLoading && (layoutMode === 'card' ? (
          <section id="ipo-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ipoData.length > 0 ? ( // Use ipoData directly for card view, filtering handled by search
              displayedIpoData.map((ipo, index) => ( // Use displayedIpoData here for consistency with search/sort
                <div key={index} className="card p-6 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-blue-700 mb-2">{ipo.Name} ({ipo.Type})</h2>
                    <p className="text-gray-700 mb-1"><strong>Price:</strong> {ipo.Price || 'N/A'}</p>
                    <p className="text-gray-700 mb-1"><strong>Lot Size:</strong> {ipo.Lot || 'N/A'}</p>
                    <p className="text-gray-700 mb-1"><strong>Open Date:</strong> {ipo.Open || 'N/A'}</p>
                    <p className="text-gray-700 mb-4"><strong>Close Date:</strong> {ipo.Close || 'N/A'}</p>
                    <p className="text-gray-600 text-sm mb-4">
                      <strong>GMP:</strong> {ipo.GMP || 'N/A'} |
                      <strong> Est. Listing:</strong> {ipo["Est Listing"] || 'N/A'} |
                      <strong> IPO Size:</strong> {ipo["IPO Size"] || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${ipo.Status?.toLowerCase().includes('open') || ipo.Status?.toLowerCase().includes('apply') ? 'status-open' :
                        ipo.Status?.toLowerCase().includes('closed') || ipo.Status?.toLowerCase().includes('listed') || ipo.Status?.toLowerCase().includes('allotted') ? 'status-closed' :
                        'status-upcoming'}`}>
                      {getStatusContent(ipo.Status, ipo)}
                    </span>
                    <button
                      onClick={() => showMessage(`Details for ${ipo.Name}`)}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-600 col-span-full">No IPOs found matching your criteria.</p>
            )}
          </section>
        ) : (
          <div>
            {/* Render categorized table sections */}
            {renderTableSection("Current IPOs (Open & Awaiting Allotment)", currentIpos, showCurrentSection, () => setShowCurrentSection(!showCurrentSection))}
            {renderTableSection("Upcoming IPOs", upcomingIpos, showUpcomingSection, () => setShowUpcomingSection(!showUpcomingSection))}
            {renderTableSection("Listed/Closed IPOs", listedIpos, showListedSection, () => setShowListedSection(!showListedSection))}

            {displayedIpoData.length === 0 && (
              <p className="px-3 py-4 text-center text-gray-600 bg-white rounded-lg shadow-sm">No IPOs found matching your criteria across all categories.</p>
            )}
          </div>
        ))}


        {/* Message Box for alerts */}
        {showMessageBox && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
            <div className="bg-white p-8 rounded-lg shadow-2xl text-center relative transform scale-90 opacity-0 animate-fade-in-scale-up">
              <p className="text-2xl font-bold text-gray-800 mb-4">{message}</p>
              <button
                onClick={() => setShowMessageBox(false)}
                className="absolute top-2 right-2 text-gray-600 hover:text-black text-xl font-bold"
              >
                X
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Allotment Popup */}
      {showAllotmentPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-lg"
              onClick={() => setShowAllotmentPopup(false)}
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Check Allotment Links</h3>
            {allotmentLinks.length > 0 ? (
              <ul className="space-y-2">
                {allotmentLinks.map((link, idx) => (
                  <li key={idx}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800 break-all"
                    >
                      🔗 Check allotment link {idx + 1}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No allotment links available for this IPO.</p>
            )}
          </div>
        </div>
      )}

      {/* Floating Broker Banner */}
      {showBrokerPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center p-4">
          <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-3xl relative">
            <button
              onClick={() => setShowBrokerPopup(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-lg"
            >
              ×
            </button>
            <h2 className="text-lg font-semibold mb-4 text-center text-gray-800">
              🛡️ Open Demat account securely with verified investment brokers.
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {renderBrokerLinks()}
            </div>
          </div>
        </div>
      )}

      {/* Broker Referral Section (Sticky Footer) - Made more compact */}
      <footer id="broker-section" className="fixed bottom-0 left-0 w-full bg-white border-t shadow z-40 py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2">
          {/* WhatsApp Channel Section */}
          <div className="whatsapp-section text-center sm:text-left mb-1 sm:mb-0">
            <a
              href="https://whatsapp.com/channel/0029VbBPaggaCHaKAwEkOhhf9zdRl34"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-green-600 text-white px-4 py-1.5 rounded-full shadow-md hover:bg-green-700 hover:scale-105 transition transform text-sm"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                alt="WhatsApp"
                className="w-4 h-4 mr-1"
              />
              WhatsApp Updates
            </a>
          </div>
          
          <div className="flex flex-col items-center sm:items-end">
            <h2 className="text-sm font-semibold mb-1 text-center text-gray-800 hover:text-blue-600 transition-all">
              🛡️ Open Demat account securely with verified investment brokers.
            </h2>
            <div className="flex flex-wrap justify-center gap-2 overflow-x-auto pb-0.5">
              {renderBrokerLinks()}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
