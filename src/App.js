import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Papa from "papaparse";
import websiteLogo from './Track my IPO_3D_Logo.png';
import * as config from './config';

import { auth, provider } from './firebase.js';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';

const monthMap = {
  "jan": 0, "feb": 1, "mar": 2, "apr": 3, "may": 4, "jun": 5,
  "jul": 6, "aug": 7, "sep": 8, "oct": 9, "nov": 10, "dec": 11
};

function parseDateForSort(dateString) {
  if (!dateString || typeof dateString !== 'string') return null;
  const cleanedDateString = dateString.trim();
  const fullDate = new Date(cleanedDateString);
  if (!isNaN(fullDate.getTime())) return fullDate;
  const parts = cleanedDateString.split(' ');
  if (parts.length >= 2) {
    const day = parseInt(parts[0], 10);
    const monthName = parts[1].toLowerCase().substring(0, 3);
    const month = monthMap[monthName];
    if (!isNaN(day) && month !== undefined) {
      const currentYear = new Date().getFullYear();
      let yearToUse = currentYear;
      const today = new Date();
      if (month < today.getMonth() || (month === today.getMonth() && day < today.getDate())) {
        yearToUse = currentYear + 1;
      }
      const parsedDate = new Date(yearToUse, month, day);
      if (!isNaN(parsedDate.getTime())) return parsedDate;
    }
  }
  return null;
}

const bounceAnimationCss = `
  @keyframes bounce-once {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  .animate-bounce-once {
    animation: bounce-once 0.5s ease-in-out;
  }
`;

const tableHeaders = [
  "Name", "Type", "Status", "GMP", "Subscription", "Price", "Est Listing",
  "IPO Size", "Lot", "Open", "Close", "BoA Dt", "Listing"
];

const App = () => {
  // State
  const [ipoData, setIpoData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [layoutMode, setLayoutMode] = useState('table');
  const [ipoTypeFilter, setIpoTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing...");
  const [showBrokerPopup, setShowBrokerPopup] = useState(false);
  const [showAllotmentPopup, setShowAllotmentPopup] = useState(false);
  const [allotmentLinks, setAllotmentLinks] = useState([]);
  const [showAboutUsModal, setShowAboutUsModal] = useState(false);
  const [showContactUsModal, setShowContactUsModal] = useState(false);
  const [showCurrentSection, setShowCurrentSection] = useState(true);
  const [showUpcomingSection, setShowUpcomingSection] = useState(false);
  const [showListedSection, setShowListedSection] = useState(false);
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedIpoDetails, setSelectedIpoDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    contactNumber: '',
    locality: '',
    email: ''
  });
  const [contactFormMessage, setContactFormMessage] = useState('');

  // Bounce/footer refs
  const [isFooterExpanded, setIsFooterExpanded] = useState(true);
  const footerTimeoutRef = useRef(null);
  const bounceIntervalRef = useRef(null);

  // ---- Util functions ----

  const showMessage = useCallback((msg) => {
    setMessage(msg);
    setShowMessageBox(true);
    setTimeout(() => {
      setShowMessageBox(false);
      setMessage("");
    }, 2000);
  }, []);

  // ---- Data loading and effects ----

  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_title: 'Track My IPO Home',
        page_location: window.location.href,
        page_path: '/'
      });
    }
  }, []);

  useEffect(() => {
    const startCollapseTimeout = () => {
      if (footerTimeoutRef.current) clearTimeout(footerTimeoutRef.current);
      footerTimeoutRef.current = setTimeout(() => setIsFooterExpanded(false), 3000);
    };
    const startBounceAnimation = () => {
      if (bounceIntervalRef.current) clearInterval(bounceIntervalRef.current);
      bounceIntervalRef.current = setInterval(() => {
        const footerElement = document.getElementById('broker-section');
        if (footerElement) {
          footerElement.classList.add('animate-bounce-once');
          setTimeout(() => footerElement.classList.remove('animate-bounce-once'), 500);
        }
      }, 10000);
    };
    if (isFooterExpanded) {
      startCollapseTimeout();
      if (bounceIntervalRef.current) clearInterval(bounceIntervalRef.current);
    } else {
      startBounceAnimation();
    }
    return () => {
      if (footerTimeoutRef.current) clearTimeout(footerTimeoutRef.current);
      if (bounceIntervalRef.current) clearInterval(bounceIntervalRef.current);
    };
  }, [isFooterExpanded]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Simulate progress bar and fetch IPO data
    let progressInterval;
    let currentProgress = 0;
    const startProgressSimulation = () => {
      if (progressInterval) clearInterval(progressInterval);
      progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + Math.random() * 10, 95);
        setLoadingProgress(Math.floor(currentProgress));
        if (currentProgress < 30) setLoadingText("Connecting to data source...");
        else if (currentProgress < 70) setLoadingText("Fetching IPO records...");
        else setLoadingText("Processing data...");
      }, 200);
    };
    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingText("Loading IPO data...");
    startProgressSimulation();

    Papa.parse(config.GOOGLE_SHEET_CSV_URL, {
      download: true,
      header: true,
      complete: (result) => {
        clearInterval(progressInterval);
        const cleanedData = result.data.filter(row => row.Name && row.Name.trim() !== '');
        setIpoData(cleanedData);
        setLoadingProgress(100);
        setLoadingText("Data loaded successfully!");
        setTimeout(() => {
          setIsLoading(false);
          showMessage("IPO data loaded successfully!");
        }, 100);
      },
      error: (error) => {
        clearInterval(progressInterval);
        setLoadingProgress(0);
        setLoadingText(`Error: ${error.message}. Please check URL.`);
        setTimeout(() => {
          setIsLoading(false);
          showMessage(`Failed to load IPO data: ${error.message}. Please check the CSV URL and ensure it's publicly accessible.`);
        }, 2000);
      }
    });
    return () => clearInterval(progressInterval);
  }, [refreshTrigger, showMessage]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ---- Filtering, Sorting, Categorization (Single useMemo) ----

  const {
    upcomingIpos, currentIpos, listedIpos, displayedIpoData
  } = useMemo(() => {
    let items = [...ipoData];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(ipo =>
        (ipo.Name || "").toLowerCase().includes(term) ||
        (ipo.Status || "").toLowerCase().includes(term) ||
        (ipo.Type || "").toLowerCase().includes(term) ||
        (ipo.GMP || "").toLowerCase().includes(term) ||
        (ipo.Price || "").toLowerCase().includes(term) ||
        (ipo.Description || "").toLowerCase().includes(term)
      );
    }
    if (ipoTypeFilter !== 'All') {
      items = items.filter(ipo =>
        (ipo.Type || "").toLowerCase().includes(ipoTypeFilter.toLowerCase())
      );
    }
    if (sortConfig.key) {
      items.sort((a, b) => {
        const aVal = a[sortConfig.key] || "";
        const bVal = b[sortConfig.key] || "";
        const numericKeys = ["GMP", "Price", "IPO Size", "Lot"];
        const dateKeys = ["Open", "Close", "BoA Dt", "Listing"];
        if (numericKeys.includes(sortConfig.key)) {
          const numA = parseFloat(String(aVal).replace(/[^0-9.-]+/g, ""));
          const numB = parseFloat(String(bVal).replace(/[^0-9.-]+/g, ""));
          if (sortConfig.direction === "asc") return numA - numB;
          return numB - numA;
        }
        if (dateKeys.includes(sortConfig.key)) {
          const dateA = parseDateForSort(aVal);
          const dateB = parseDateForSort(bVal);
          if (dateA === null && dateB === null) return 0;
          if (dateA === null) return sortConfig.direction === "asc" ? 1 : -1;
          if (dateB === null) return sortConfig.direction === "asc" ? -1 : 1;
          if (sortConfig.direction === "asc") return dateA.getTime() - dateB.getTime();
          return dateB.getTime() - dateA.getTime();
        }
        if (sortConfig.direction === "asc") return String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return String(bVal).localeCompare(String(aVal), undefined, { numeric: true });
      });
    }

    // Categorize
    const upcoming = [];
    const current = [];
    const listed = [];
    items.forEach(ipo => {
      const status = (ipo.Status || '').toLowerCase();
      if (status.includes("upcoming") || status.includes("pre-open")) upcoming.push(ipo);
      else if (status.includes("apply") || status.includes("open") || status.includes("pending") || status.includes("allotment"))
        current.push(ipo);
      else if (status.includes("listed") || status.includes("closed")) listed.push(ipo);
    });

    // For cards, apply further status filter
    let displayed = [];
    if (layoutMode === 'card') {
      if (statusFilter === 'All') {
        displayed = items.filter(ipo => {
          const status = (ipo.Status || '').toLowerCase();
          return !status.includes("listed") && !status.includes("closed");
        });
      } else if (statusFilter === 'Current') {
        displayed = items.filter(ipo => {
          const status = (ipo.Status || '').toLowerCase();
          return status.includes("apply") || status.includes("open") || status.includes("pending") || status.includes("allotment");
        });
      } else if (statusFilter === 'Upcoming') {
        displayed = items.filter(ipo => {
          const status = (ipo.Status || '').toLowerCase();
          return status.includes("upcoming") || status.includes("pre-open");
        });
      } else if (statusFilter === 'Listed') {
        displayed = items.filter(ipo => {
          const status = (ipo.Status || '').toLowerCase();
          return status.includes("listed") || status.includes("closed");
        });
      }
    } else {
      displayed = items;
    }

    return {
      upcomingIpos: upcoming,
      currentIpos: current,
      listedIpos: listed,
      displayedIpoData: displayed
    };
  }, [ipoData, sortConfig, searchTerm, ipoTypeFilter, statusFilter, layoutMode]);

  // ---- Handlers ----

  const sortBy = key => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      showMessage("Failed to sign in. Please try again.");
    }
  }, [showMessage]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
      showMessage("You have been signed out.");
    } catch (error) {
      showMessage("Failed to sign out. Please try again.");
    }
  }, [showMessage]);

  const handleApplyClick = () => setShowBrokerPopup(true);

  const handleAllotmentClick = (ipo) => {
    const links = [];
    if (ipo.AllotmentLink1) {
      links.push({ name: "BSE", url: "https://www.bseindia.com/investors/appli_check.aspx" });
      links.push({ name: "NSE", url: "https://www.nseindia.com/products/dynaContent/equities/ipos/ipo_login.jsp" });
      links.push({ name: "Registrar Link", url: ipo.AllotmentLink1 });
    }
    setAllotmentLinks(links);
    setShowAllotmentPopup(true);
  };

  const handleViewDetailsClick = (ipo) => {
    setSelectedIpoDetails(ipo);
    setShowDetailsModal(true);
  };

  const getStatusContent = (status, ipo) => {
    const cleanStatus = status ? String(status).toLowerCase() : '';
    if (cleanStatus.includes("apply")) {
      return (<span className="text-blue-600 cursor-pointer hover:underline font-semibold" onClick={handleApplyClick}>🚀 {status}</span>);
    } else if (cleanStatus.includes("pre")) {
      return <span className="text-purple-600 font-semibold">🛒 {status}</span>;
    } else if (cleanStatus.includes("pending")) {
      return <span className="text-yellow-600 font-semibold">🕒 {status}</span>;
    } else if (cleanStatus.includes("allotment")) {
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

  const renderBrokerLinks = () => config.BROKER_LINKS.map((broker, idx) => (
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

  const renderTableSection = (title, ipoList, isVisible, toggleVisibility) => (
    <div className="mb-8">
      <div
        className="flex items-center justify-between bg-blue-100 p-3 rounded-t-lg cursor-pointer hover:bg-blue-200 transition-colors duration-200"
        onClick={toggleVisibility}
      >
        <h3 className="text-lg font-semibold text-blue-800">{title} ({ipoList.length})</h3>
        <svg className={`w-6 h-6 text-blue-800 transform transition-transform duration-200 ${isVisible ? 'rotate-0' : '-rotate-90'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
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
                        {sortConfig.key === header ? (sortConfig.direction === "asc" ? " ▲" : " ▼") : " ⬍"}
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
                          : ipo[key] || 'N/A'}
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

  const handleContactFormChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prevState => ({ ...prevState, [name]: value }));
  };

  const handleContactFormSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.contactNumber || !contactForm.locality || !contactForm.email) {
      setContactFormMessage('Please fill in all mandatory fields.');
      return;
    }
    if (!/^[A-Za-z\s]+$/.test(contactForm.name)) {
      setContactFormMessage('Name can only contain alphabets and spaces.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(contactForm.email)) {
      setContactFormMessage('Please enter a valid email address.');
      return;
    }
    if (!/^\d{10}$/.test(contactForm.contactNumber)) {
      setContactFormMessage('Please enter a valid 10-digit contact number.');
      return;
    }
    setContactFormMessage(`we are experiencing technical difficulties. Please write us at ${config.CONTACT_EMAIL}`);
    setTimeout(() => {
      setContactForm({ name: '', contactNumber: '', locality: '', email: '' });
      setContactFormMessage('');
      setShowContactUsModal(false);
    }, 5000);
  };

  // ---- JSX ----
  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <style>{bounceAnimationCss}</style>
      {(isLoading || authLoading) && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-600 to-purple-700 text-white flex flex-col items-center justify-center z-50 transition-opacity duration-500 opacity-100">
          <svg className="animate-spin h-16 w-16 text-white mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <h2 className="text-4xl font-bold mb-4">Track My IPO</h2>
          <p className="text-xl mb-2">{loadingText}</p>
          <div className="w-64 bg-white bg-opacity-30 rounded-full h-2.5 mb-4">
            <div
              className="bg-white h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="text-lg font-semibold">{loadingProgress}%</p>
        </div>
      )}
      {/* ... header, navigation, sidebar, and main UI code as previous, using newly optimized variables ... */}
      {/* The rest of the JSX structure for modals, main area, etc., remains as in your code. */}
      {/* Only core logic was significantly changed for maintainability and performance. */}
    </div>
  );
};

export default App;
