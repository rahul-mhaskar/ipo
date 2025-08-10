import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Papa from "papaparse";
import websiteLogo from './Track my IPO_3D_Logo.png';
import * as config from './config';

import { auth, provider, db } from './firebase.js';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';

const App = () => {
  const [ipoData, setIpoData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [showBrokerPopup, setShowBrokerPopup] = useState(false);
  const [showAllotmentPopup, setShowAllotmentPopup] = useState(false);
  const [allotmentLinks, setAllotmentLinks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [layoutMode, setLayoutMode] = useState('table');
  const [ipoTypeFilter, setIpoTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing...");
  const [showUpcomingSection, setShowUpcomingSection] = useState(false);
  const [showCurrentSection, setShowCurrentSection] = useState(true);
  const [showListedSection, setShowListedSection] = useState(false);
  const [showAboutUsModal, setShowAboutUsModal] = useState(false);
  const [showContactUsModal, setShowContactUsModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    contactNumber: '',
    locality: '',
    email: ''
  });
  const [contactFormMessage, setContactFormMessage] = useState('');
  const [isFooterExpanded, setIsFooterExpanded] = useState(true);
  const footerTimeoutRef = useRef(null);
  const bounceIntervalRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedIpoDetails, setSelectedIpoDetails] = useState(null);

  // Firebase User and Auth Loading
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- showMessage must be defined before usage! ---
  const showMessage = useCallback((msg) => {
    setMessage(msg);
    setShowMessageBox(true);
    setTimeout(() => {
      setShowMessageBox(false);
      setMessage("");
    }, 500);
  }, []);

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
          setTimeout(() => {
            footerElement.classList.remove('animate-bounce-once');
          }, 500);
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

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      showMessage("Failed to sign in. Please try again.");
    }
  }, [showMessage]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);
      showMessage("You have been signed out.");
    } catch (error) {
      console.error("Error signing out:", error);
      showMessage("Failed to sign out. Please try again.");
    }
  }, [showMessage]);

  const bounceAnimationCss = `
    @keyframes bounce-once {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-5px);
      }
    }
    .animate-bounce-once {
      animation: bounce-once 0.5s ease-in-out;
    }
  `;
  const monthMap = {
    "jan": 0, "feb": 1, "mar": 2, "apr": 3, "may": 4, "jun": 5,
    "jul": 6, "aug": 7, "sep": 8, "oct": 9, "nov": 10, "dec": 11
  };
  const parseDateForSort = (dateString) => {
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
  };

  useEffect(() => {
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
        console.error("Error parsing CSV:", error);
        setLoadingProgress(0);
        setLoadingText(`Error: ${error.message}. Please check URL.`);
        setTimeout(() => {
          setIsLoading(false);
          showMessage(`Failed to load IPO data: ${error.message}. Please check the CSV URL and ensure it's publicly accessible.`);
        }, 2000);
      }
    });
    return () => {
      clearInterval(progressInterval);
    };
  }, [refreshTrigger, showMessage]);

  const sortBy = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
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
        ipo.Price?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipo.Description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (ipoTypeFilter !== 'All') {
      sortableItems = sortableItems.filter(ipo =>
        ipo.Type?.toLowerCase().includes(ipoTypeFilter.toLowerCase())
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
          if (sortConfig.direction === "asc") return numA - numB;
          return numB - numA;
        }
        const dateKeys = ["Open", "Close", "BoA Dt", "Listing"];
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
    const upcoming = [];
    const current = [];
    const listed = [];
    sortableItems.forEach(ipo => {
      const status = ipo.Status ? String(ipo.Status).toLowerCase() : '';
      if (status.includes("upcoming") || status.includes("pre-open")) upcoming.push(ipo);
      else if (status.includes("apply") || status.includes("open") || status.includes("pending") || status.includes("allotment")) current.push(ipo);
      else if (status.includes("listed") || status.includes("closed")) listed.push(ipo);
    });
    return { upcomingIpos: upcoming, currentIpos: current, listedIpos: listed };
  }, [ipoData, sortConfig, searchTerm, ipoTypeFilter]);

  const displayedIpoData = useMemo(() => {
    let filteredAndSortedItems = [...ipoData];
    if (searchTerm) {
      filteredAndSortedItems = filteredAndSortedItems.filter(ipo =>
        ipo.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipo.Status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipo.Type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipo.GMP?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipo.Price?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (ipoTypeFilter !== 'All') {
      filteredAndSortedItems = filteredAndSortedItems.filter(ipo =>
        ipo.Type?.toLowerCase().includes(ipoTypeFilter.toLowerCase())
      );
    }
    if (sortConfig.key) {
      filteredAndSortedItems.sort((a, b) => {
        const aVal = a[sortConfig.key] || "";
        const bVal = b[sortConfig.key] || "";
        const numericKeys = ["GMP", "Price", "IPO Size", "Lot"];
        const dateKeys = ["Open", "Close", "BoA Dt", "Listing"];
        if (numericKeys.includes(sortConfig.key)) {
          const numA = parseFloat(String(aVal).replace(/[^0-9.-]+/g, ""));
          const numB = parseFloat(String(bVal).replace(/[^0-9.-]+/g, ""));
          if (sortConfig.direction === "asc") {
            return numA - numB;
          }
          return numB - numA;
        } else if (dateKeys.includes(sortConfig.key)) {
          const dateA = parseDateForSort(aVal);
          const dateB = parseDateForSort(bVal);
          if (dateA === null && dateB === null) return 0;
          if (dateA === null) return sortConfig.direction === "asc" ? 1 : -1;
          if (dateB === null) return sortConfig.direction === "asc" ? -1 : 1;
          if (sortConfig.direction === "asc") {
            return dateA.getTime() - dateB.getTime();
          }
          return dateB.getTime() - dateA.getTime();
        }
        if (sortConfig.direction === "asc") {
          return String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        }
        return String(bVal).localeCompare(String(aVal), undefined, { numeric: true });
      });
    }
    let finalDisplayedItems = [];
    if (layoutMode === 'card') {
      if (statusFilter === 'All') {
        finalDisplayedItems = filteredAndSortedItems.filter(ipo => {
          const status = ipo.Status ? String(ipo.Status).toLowerCase() : '';
          return !status.includes("listed") && !status.includes("closed");
        });
      } else if (statusFilter === 'Current') {
        finalDisplayedItems = filteredAndSortedItems.filter(ipo => {
          const status = ipo.Status ? String(ipo.Status).toLowerCase() : '';
          return status.includes("apply") || status.includes("open") || status.includes("pending") || status.includes("allotment");
        });
      } else if (statusFilter === 'Upcoming') {
        finalDisplayedItems = filteredAndSortedItems.filter(ipo => {
          const status = ipo.Status ? String(ipo.Status).toLowerCase() : '';
          return status.includes("upcoming") || status.includes("pre-open");
        });
      }
    } else {
      finalDisplayedItems = filteredAndSortedItems;
    }
    return finalDisplayedItems;
  }, [ipoData, sortConfig, searchTerm, ipoTypeFilter, statusFilter, layoutMode]);
  const handleApplyClick = () => {
    setShowBrokerPopup(true);
  };
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
      return (
        <span className="text-blue-600 cursor-pointer hover:underline font-semibold" onClick={handleApplyClick}>
          🚀 {status}
        </span>
      );
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
  const renderBrokerLinks = () => {
    return config.BROKER_LINKS.map((broker, idx) => (
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
    console.log("Contact Form Submitted:", contactForm);
    setContactFormMessage(`we are experiencing technical difficulties. Please write us at ${config.CONTACT_EMAIL}`);
    setTimeout(() => {
      setContactForm({ name: '', contactNumber: '', locality: '', email: '' });
      setContactFormMessage('');
      setShowContactUsModal(false);
    }, 5000);
  };
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <style>{bounceAnimationCss}</style>
      {(isLoading || authLoading) && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-600 to-purple-700 text-white flex flex-col items-center justify-center z-50 transition-opacity duration-500 opacity-100">
          <svg className="animate-spin h-16 w-16 text-white mb-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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

          
      <header className="fixed top-0 w-full z-50 bg-gradient-to-r from-blue-600 to-purple-700 text-white p-1 sm:p-2 shadow-lg rounded-b-xl">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
          <div className="flex w-full sm:w-auto justify-between items-center sm:mb-0">
            <div className="sm:hidden">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
            </div>
            <div className="flex items-center flex-grow sm:flex-grow-0 justify-center sm:justify-start">
              <img
                src={websiteLogo}
                alt="Track My IPO Logo"
                className="h-10 sm:h-12 mr-2"
              />
              <h1 className="text-xl sm:text-2xl font-bold font-heading">Track My IPO</h1>
            </div>
            <div className="sm:hidden">
              <button
                onClick={() => setRefreshTrigger(prev => prev + 1)}
                className="p-2 -mr-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.836 3.582a4.5 4.5 0 01-1.314 3.424m-10.74 0a4.5 4.5 0 01-1.314-3.424M5.582 9h.582m0 0a5.952 5.952 0 01-.027-.678C6.184 6.84 8.01 5 10.25 5H18m0 0c-3.111 0-5.64 2.53-5.64 5.64M12 20c-3.111 0-5.64-2.53-5.64-5.64m0 0a5.952 5.952 0 01-.027-.678M18 10.64a5.952 5.952 0 01.027.678" />
                </svg>
              </button>
            </div>
          </div>
          <nav className="hidden sm:flex items-center space-x-6 text-sm font-semibold">
            <button
              onClick={() => { setIpoTypeFilter('All'); setStatusFilter('All'); setLayoutMode('table'); }}
              className="hover:text-blue-200 transition-colors duration-200"
            >
              All IPOs
            </button>
            <button
              onClick={() => { setIpoTypeFilter('Main Board'); setStatusFilter('All'); setLayoutMode('table'); }}
              className="hover:text-blue-200 transition-colors duration-200"
            >
              Main Board
            </button>
            <button
              onClick={() => { setIpoTypeFilter('SME'); setStatusFilter('All'); setLayoutMode('table'); }}
              className="hover:text-blue-200 transition-colors duration-200"
            >
              SME
            </button>
            <button
              onClick={() => setShowAboutUsModal(true)}
              className="hover:text-blue-200 transition-colors duration-200"
            >
              About Us
            </button>
            <button
              onClick={() => setShowContactUsModal(true)}
              className="hover:text-blue-200 transition-colors duration-200"
            >
              Contact Us
            </button>
            <button
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              className="p-1 rounded-md hover:bg-white hover:text-blue-600 transition-colors duration-200"
              aria-label="Refresh Data"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.836 3.582a4.5 4.5 0 01-1.314 3.424m-10.74 0a4.5 4.5 0 01-1.314-3.424M5.582 9h.582m0 0a5.952 5.952 0 01-.027-.678C6.184 6.84 8.01 5 10.25 5H18m0 0c-3.111 0-5.64 2.53-5.64 5.64M12 20c-3.111 0-5.64-2.53-5.64-5.64m0 0a5.952 5.952 0 01-.027-.678M18 10.64a5.952 5.952 0 01.027.678" />
              </svg>
            </button>
            {/* ----------------------------------------------------
                ADDED: Conditional rendering for auth buttons
            ---------------------------------------------------- */}
            {user ? (
              <>
                <span className="text-white text-sm font-semibold">{user.displayName || user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="py-1 px-3 rounded-full text-sm font-semibold bg-white text-blue-600 hover:bg-gray-100 transition-colors duration-200"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="py-1 px-3 rounded-full text-sm font-semibold bg-white text-blue-600 hover:bg-gray-100 transition-colors duration-200"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>
      <div className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white p-4 transform transition-transform duration-300 ease-in-out z-50 sm:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        <div className="flex items-center mb-6">
          <img src={websiteLogo} alt="Track My IPO Logo" className="h-10 mr-2" />
          <h2 className="text-xl font-bold">Menu</h2>
        </div>
        <nav className="flex flex-col space-y-4 text-sm font-semibold">
          <button
            onClick={() => { setIpoTypeFilter('All'); setStatusFilter('All'); setLayoutMode('table'); setIsSidebarOpen(false); }}
            className="text-left py-2 hover:text-blue-200 transition-colors duration-200 border-b border-gray-700"
          >
            All IPOs
          </button>
          <button
            onClick={() => { setIpoTypeFilter('Main Board'); setStatusFilter('All'); setLayoutMode('table'); setIsSidebarOpen(false); }}
            className="text-left py-2 hover:text-blue-200 transition-colors duration-200 border-b border-gray-700"
          >
            Main Board
          </button>
          <button
            onClick={() => { setIpoTypeFilter('SME'); setStatusFilter('All'); setLayoutMode('table'); setIsSidebarOpen(false); }}
            className="text-left py-2 hover:text-blue-200 transition-colors duration-200 border-b border-gray-700"
          >
            SME
          </button>
          <button
            onClick={() => { setShowAboutUsModal(true); setIsSidebarOpen(false); }}
            className="text-left py-2 hover:text-blue-200 transition-colors duration-200 border-b border-gray-700"
          >
            About Us
          </button>
          <button
            onClick={() => { setShowContactUsModal(true); setIsSidebarOpen(false); }}
            className="text-left py-2 hover:text-blue-200 transition-colors duration-200 border-b border-gray-700"
          >
            Contact Us
          </button>
          {/* ----------------------------------------------------
              ADDED: Conditional rendering for mobile auth buttons
          ---------------------------------------------------- */}
          <div className="border-t border-gray-700 pt-4 mt-4">
            {user ? (
              <div className="flex flex-col space-y-2">
                <span className="text-white text-sm font-semibold">{user.displayName || user.email}</span>
                <button
                  onClick={() => { handleSignOut(); setIsSidebarOpen(false); }}
                  className="w-full text-left py-2 px-3 rounded-md text-sm font-semibold bg-white text-blue-600 hover:bg-gray-100 transition-colors duration-200"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { signInWithGoogle(); setIsSidebarOpen(false); }}
                className="w-full text-left py-2 px-3 rounded-md text-sm font-semibold bg-white text-blue-600 hover:bg-gray-100 transition-colors duration-200"
              >
                Sign In
              </button>
            )}
          </div>
        </nav>
      </div>
      <main className="flex-grow container mx-auto px-4 py-8 mt-16 sm:mt-24">
        <div className="bg-white p-4 rounded-xl shadow-lg mb-8 flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-full sm:w-auto flex-grow lg:flex-grow-0">
              <input
                type="text"
                placeholder="Search IPOs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 flex-grow text-sm focus:outline-none"
              />
              <span className="p-2 bg-gray-100 border-l border-gray-300">
                <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M12.9 14.32a8 8 0 111.414-1.414l5.36 5.36a1 1 0 01-1.414 1.414l-5.36-5.36zM8 14a6 6 0 100-12 6 6 0 000 12z"></path>
                </svg>
              </span>
            </div>
            <div className="hidden sm:flex space-x-2">
              <button
                onClick={() => setIpoTypeFilter('All')}
                className={`py-2 px-4 rounded-lg text-sm font-semibold transition-colors duration-200 ${ipoTypeFilter === 'All' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                All
              </button>
              <button
                onClick={() => setIpoTypeFilter('Main Board')}
                className={`py-2 px-4 rounded-lg text-sm font-semibold transition-colors duration-200 ${ipoTypeFilter === 'Main Board' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Mainboard
              </button>
              <button
                onClick={() => setIpoTypeFilter('SME')}
                className={`py-2 px-4 rounded-lg text-sm font-semibold transition-colors duration-200 ${ipoTypeFilter === 'SME' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                SME
              </button>
            </div>
            <div className="hidden sm:flex space-x-2">
              <button
                onClick={() => setLayoutMode('table')}
                className={`p-2 rounded-lg transition-colors duration-200 ${layoutMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                aria-label="Toggle Table View"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={() => setLayoutMode('card')}
                className={`p-2 rounded-lg transition-colors duration-200 ${layoutMode === 'card' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                aria-label="Toggle Card View"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
          <div className="sm:hidden flex w-full justify-between items-center space-x-2">
            <div className="relative w-1/2">
              <select
                value={ipoTypeFilter}
                onChange={(e) => setIpoTypeFilter(e.target.value)}
                className="block w-full p-2 text-sm bg-gray-200 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="All">All Types</option>
                <option value="Main Board">Mainboard</option>
                <option value="SME">SME</option>
              </select>
              <span className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 pointer-events-none">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </span>
            </div>
            <div className="relative w-1/2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full p-2 text-sm bg-gray-200 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="All">All Status</option>
                <option value="Current">Current</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Listed">Listed</option>
              </select>
              <span className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 pointer-events-none">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </span>
            </div>
            <div className="flex space-x-2 w-auto">
              <button
                onClick={() => setLayoutMode('table')}
                className={`p-2 rounded-lg transition-colors duration-200 ${layoutMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                aria-label="Toggle Table View"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={() => setLayoutMode('card')}
                className={`p-2 rounded-lg transition-colors duration-200 ${layoutMode === 'card' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                aria-label="Toggle Card View"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {layoutMode === 'table' ? (
          <div>
            {renderTableSection("Current IPOs", currentIpos, showCurrentSection, () => setShowCurrentSection(!showCurrentSection))}
            {renderTableSection("Upcoming IPOs", upcomingIpos, showUpcomingSection, () => setShowUpcomingSection(!showUpcomingSection))}
            {renderTableSection("Listed IPOs", listedIpos, showListedSection, () => setShowListedSection(!showListedSection))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedIpoData.length > 0 ? (
              displayedIpoData.map((ipo, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg overflow-hidden p-6 hover:shadow-xl transition-shadow duration-300 flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{ipo.Name}</h3>
                    <span className={`text-sm font-semibold px-2 py-1 rounded-full ${ipo.Type?.toLowerCase().includes("sme") ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                      {ipo.Type}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 flex-grow">
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-700 mr-2">Status:</span>
                      {getStatusContent(ipo.Status, ipo)}
                    </div>
                    {ipo.Open && (
                      <p>
                        <span className="font-semibold text-gray-700">Open:</span> {ipo.Open}
                      </p>
                    )}
                    {ipo.Close && (
                      <p>
                        <span className="font-semibold text-gray-700">Close:</span> {ipo.Close}
                      </p>
                    )}
                    {ipo.Price && (
                      <p>
                        <span className="font-semibold text-gray-700">Price:</span> {ipo.Price}
                      </p>
                    )}
                    {ipo["IPO Size"] && (
                      <p>
                        <span className="font-semibold text-gray-700">IPO Size:</span> {ipo["IPO Size"]}
                      </p>
                    )}
                    {ipo.GMP && (
                      <p>
                        <span className="font-semibold text-gray-700">GMP:</span> {ipo.GMP}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleViewDetailsClick(ipo)}
                    className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
                  >
                    View Details
                  </button>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-600 py-8">No IPOs found matching the criteria.</p>
            )}
          </div>
        )}
      </main>
      <footer
        id="footer"
        className={`bg-gray-800 text-white transition-all duration-500 ease-in-out transform ${isFooterExpanded ? 'h-auto py-6 translate-y-0' : 'h-16 -translate-y-0'}`}
        onMouseEnter={() => setIsFooterExpanded(true)}
        onMouseLeave={() => setIsFooterExpanded(false)}
      >
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col items-center justify-between">
            <div
              id="broker-section"
              className="flex justify-center flex-wrap gap-4 mb-4 items-center w-full"
            >
              {renderBrokerLinks()}
            </div>
          </div>
          <div className="text-sm border-t border-gray-700 pt-4">
            <p className="mb-1">© 2024 Track My IPO. All Rights Reserved.</p>
            <p>Disclaimer: The information provided is for informational purposes only. Consult a financial advisor before making any investment decisions.</p>
          </div>
        </div>
      </footer>
      {showMessageBox && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white text-center px-6 py-3 rounded-xl shadow-lg z-[60] transition-transform duration-300 ease-out transform-gpu">
          {message}
        </div>
      )}
      {showBrokerPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-bold text-gray-800">Open a Demat Account</h4>
              <button onClick={() => setShowBrokerPopup(false)} className="text-gray-500 hover:text-gray-800">
                ×
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Please open a Demat account with one of our trusted partners to apply for IPOs.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {config.BROKER_LINKS.map((broker, idx) => (
                <a
                  key={idx}
                  href={broker.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <img src={broker.logo} alt={broker.name} className="h-8 mb-2" />
                  <span className="text-sm font-semibold">{broker.name}</span>
                </a>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Note: Clicking a link will take you to an external site to open an account.
            </p>
          </div>
        </div>
      )}
      {showAllotmentPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-bold text-gray-800">Check Allotment Status</h4>
              <button onClick={() => setShowAllotmentPopup(false)} className="text-gray-500 hover:text-gray-800">
                ×
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Check your IPO allotment status using the links below.
            </p>
            <ul className="space-y-3">
              {allotmentLinks.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-blue-100 text-blue-700 py-3 px-4 rounded-lg font-semibold hover:bg-blue-200 text-center transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {showAboutUsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-11/12 max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-2xl font-bold text-gray-800">About Us</h4>
              <button onClick={() => setShowAboutUsModal(false)} className="text-gray-500 hover:text-gray-800">
                ×
              </button>
            </div>
            <div className="text-gray-700 space-y-4">
              <p>
                Welcome to **Track My IPO**, your one-stop destination for tracking the latest Initial Public Offerings. We provide up-to-date information on upcoming, current, and listed IPOs, including key details like GMP (Grey Market Premium), price bands, subscription status, and more.
              </p>
              <p>
                Our mission is to empower retail investors by providing a clean, easy-to-use interface to monitor IPOs, helping you make informed decisions. We strive to be a reliable source for all your IPO-related information.
              </p>
            </div>
          </div>
        </div>
      )}
      {showContactUsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-11/12 max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-2xl font-bold text-gray-800">Contact Us</h4>
              <button onClick={() => setShowContactUsModal(false)} className="text-gray-500 hover:text-gray-800">
                ×
              </button>
            </div>
            <div className="text-gray-700 space-y-4">
              <form onSubmit={handleContactFormSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={contactForm.name}
                    onChange={handleContactFormChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactFormChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">Contact Number (10 digits)</label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={contactForm.contactNumber}
                    onChange={handleContactFormChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="locality" className="block text-sm font-medium text-gray-700">Locality</label>
                  <input
                    type="text"
                    id="locality"
                    name="locality"
                    value={contactForm.locality}
                    onChange={handleContactFormChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Submit
                </button>
                {contactFormMessage && (
                  <p className="mt-2 text-center text-sm text-red-600">
                    {contactFormMessage}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
      {showDetailsModal && selectedIpoDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-11/12 max-w-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-2xl font-bold text-gray-800">{selectedIpoDetails.Name} Details</h4>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-800">
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
              {Object.entries(selectedIpoDetails).map(([key, value]) => {
                if (value && key !== 'AllotmentLink1') {
                  return (
                    <div key={key}>
                      <span className="font-semibold text-gray-900">{key}:</span> {value}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
