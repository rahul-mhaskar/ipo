import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Papa from "papaparse";

// Import your website logo from the src folder
// IMPORTANT: Replace 'websiteLogo.png' with your actual logo file name and path within src/
import websiteLogo from './Track My IPO - Logo.png'; // Example: if your logo is directly in src/

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRlsMurbsXT2UBQ2ADbyoiQtLUTznQU4vNzw3nS02_StSrFV9pkrnXOrNAjV_Yj-Byc_zw72z_rM0tQ/pub?output=csv";

// Use the imported logo for the main website logo
const WEBSITE_LOGO_URL = websiteLogo; // Now uses the imported local asset

const App = () => {
  const [ipoData, setIpoData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [showBrokerPopup, setShowBrokerPopup] = useState(false);
  const [showAllotmentPopup, setShowAllotmentPopup] = useState(false);
  const [allotmentLinks, setAllotmentLinks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [layoutMode, setLayoutMode] = useState('table'); // 'card' or 'table'

  // NEW STATE: Filter for IPO Type (All, Mainboard, SME)
  const [ipoTypeFilter, setIpoTypeFilter] = useState('All'); // Default to 'All'

  // States for the new splash screen loading animation
  const [isLoading, setIsLoading] = useState(true); // Controls visibility of the full splash screen
  const [loadingProgress, setLoadingProgress] = useState(0); // For percentage display
  const [loadingText, setLoadingText] = useState("Initializing..."); // Dynamic loading messages

  // State for toggling table sections visibility
  const [showUpcomingSection, setShowUpcomingSection] = useState(false);
  const [showCurrentSection, setShowCurrentSection] = useState(true); // Default to open
  const [showListedSection, setShowListedSection] = useState(false);

  // States for About Us and Contact Us modals
  const [showAboutUsModal, setShowAboutUsModal] = useState(false);
  const [showContactUsModal, setShowContactUsModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    contactNumber: '',
    locality: '',
    email: ''
  });
  const [contactFormMessage, setContactFormMessage] = useState('');

  // State for footer visibility (for shutter effect)
  const [isFooterExpanded, setIsFooterExpanded] = useState(true); // Start expanded
  const footerTimeoutRef = useRef(null); // Ref to store the timeout ID
  const bounceIntervalRef = useRef(null); // Ref for bounce animation interval

  // State for sidebar (hamburger menu)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // New state for triggering data refresh
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // State for controlling the mobile sort dropdown visibility
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Google Analytics Page View Tracking
  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_title: 'Track My IPO Home',
        page_location: window.location.href,
        page_path: '/'
      });
    }
  }, []);

  // Effect for footer shutter behavior
  useEffect(() => {
    // Function to collapse footer after a delay
    const startCollapseTimeout = () => {
      if (footerTimeoutRef.current) {
        clearTimeout(footerTimeoutRef.current);
      }
      footerTimeoutRef.current = setTimeout(() => {
        setIsFooterExpanded(false);
      }, 3000); // Collapse after 3 seconds
    };

    // Function to start bounce animation
    const startBounceAnimation = () => {
      if (bounceIntervalRef.current) {
        clearInterval(bounceIntervalRef.current);
      }
      bounceIntervalRef.current = setInterval(() => {
        // Add a class for a quick bounce animation
        const footerElement = document.getElementById('broker-section');
        if (footerElement) {
          footerElement.classList.add('animate-bounce-once');
          setTimeout(() => {
            footerElement.classList.remove('animate-bounce-once');
          }, 500); // Remove bounce class after animation
        }
      }, 10000); // Bounce every 10 seconds
    };

    if (isFooterExpanded) {
      startCollapseTimeout(); // Start timer to collapse
      if (bounceIntervalRef.current) {
        clearInterval(bounceIntervalRef.current); // Stop bouncing if expanded
      }
    } else {
      startBounceAnimation(); // Start bouncing if collapsed
    }

    // Cleanup function
    return () => {
      if (footerTimeoutRef.current) {
        clearTimeout(footerTimeoutRef.current);
      }
      if (bounceIntervalRef.current) {
        clearInterval(bounceIntervalRef.current);
      }
    };
  }, [isFooterExpanded]); // Re-run when footer expansion state changes

  // Add CSS for bounce animation directly in the component for simplicity
  // In a real app, this would be in a CSS file.
  const bounceAnimationCss = `
    @keyframes bounce-once {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-5px); /* Small upward bounce */
      }
    }
    .animate-bounce-once {
      animation: bounce-once 0.5s ease-in-out;
    }
  `;


  // Function to show a custom message box
  const showMessage = useCallback((msg) => {
    setMessage(msg);
    setShowMessageBox(true);
    // Auto-hide after 0.5 seconds (reduced from 1.5 seconds)
    setTimeout(() => {
      setShowMessageBox(false);
      setMessage("");
    }, 500); // Reduced delay here
  }, []);

  // Helper for parsing dates for sorting (DD Month YYYY or DD Month format)
  const monthMap = {
    "jan": 0, "feb": 1, "mar": 2, "apr": 3, "may": 4, "jun": 5,
    "jul": 6, "aug": 7, "sep": 8, "oct": 9, "nov": 10, "dec": 11
  };

  const parseDateForSort = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return null;
    const cleanedDateString = dateString.trim();

    // Try parsing with a full year first (e.g., "21 June 2024")
    const fullDate = new Date(cleanedDateString);
    if (!isNaN(fullDate.getTime())) {
      return fullDate;
    }

    // Fallback for "DD Month" format, assuming current year
    const parts = cleanedDateString.split(' ');
    if (parts.length >= 2) {
      const day = parseInt(parts[0], 10);
      const monthName = parts[1].toLowerCase().substring(0, 3);
      const month = monthMap[monthName];

      if (!isNaN(day) && month !== undefined) {
        const currentYear = new Date().getFullYear();
        // Heuristic: If the month/day has already passed this year, assume it's for next year.
        // This helps sort "20 Dec" (past) before "05 Jan" (next year) if no year is provided.
        let yearToUse = currentYear;
        const today = new Date();
        if (month < today.getMonth() || (month === today.getMonth() && day < today.getDate())) {
          yearToUse = currentYear + 1;
        }
        const parsedDate = new Date(yearToUse, month, day);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
    }
    return null; // Unable to parse
  };

  useEffect(() => {
    let progressInterval;
    let currentProgress = 0;

    // Function to simulate loading progress
    const startProgressSimulation = () => {
      // Clear any existing interval to prevent multiple intervals running
      if (progressInterval) clearInterval(progressInterval);
      
      progressInterval = setInterval(() => {
        // Simulate progress up to 95% before actual data load completes
        currentProgress = Math.min(currentProgress + Math.random() * 10, 95);
        setLoadingProgress(Math.floor(currentProgress));

        // Update loading text based on progress
        if (currentProgress < 30) {
          setLoadingText("Connecting to data source...");
        } else if (currentProgress < 70) {
          setLoadingText("Fetching IPO records...");
        } else {
          setLoadingText("Processing data...");
        }
      }, 200); // Update every 200ms
    };

    setIsLoading(true); // Ensure splash screen is visible
    setLoadingProgress(0); // Reset progress
    setLoadingText("Loading IPO data..."); // Initial message
    startProgressSimulation(); // Start progress simulation

    Papa.parse(GOOGLE_SHEET_CSV_URL, {
      download: true,
      header: true,
      complete: (result) => {
        clearInterval(progressInterval); // Stop the progress simulation
        const cleanedData = result.data.filter(row => row.Name && row.Name.trim() !== '');
        setIpoData(cleanedData);

        setLoadingProgress(100); // Set progress to 100% immediately
        setLoadingText("Data loaded successfully!"); // Final success message on splash

        setTimeout(() => { // Briefly show 100% and success message before hiding splash
          setIsLoading(false); // Hide the splash screen
          showMessage("IPO data loaded successfully!"); // Show confirmation in the main message box
        }, 100); // Reduced delay here (from 500ms to 100ms)

      },
      error: (error) => {
        clearInterval(progressInterval); // Stop the progress simulation
        console.error("Error parsing CSV:", error);
        setLoadingProgress(0); // Reset progress on error
        setLoadingText(`Error: ${error.message}. Please check URL.`); // Display error on splash
        
        setTimeout(() => { // Show error message briefly on splash, then hide splash
            setIsLoading(false); // Hide the splash screen
            showMessage(`Failed to load IPO data: ${error.message}. Please check the CSV URL and ensure it's publicly accessible.`);
        }, 2000); // Show error on splash for 2 seconds before hiding
      }
    });

    // Cleanup function for the effect
    return () => {
      clearInterval(progressInterval); // Clear interval if component unmounts
    };
  }, [refreshTrigger, showMessage]); // Run on mount AND when refreshTrigger changes

  const sortBy = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Memoize sorted and filtered data for performance and categorization
  const { upcomingIpos, currentIpos, listedIpos, totalIposCount, currentMainboardCount, currentSmeCount } = useMemo(() => {
    let sortableItems = [...ipoData];

    // Apply search term filter first
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

    // Apply IPO Type filter
    if (ipoTypeFilter !== 'All') {
      sortableItems = sortableItems.filter(ipo =>
        ipo.Type?.toLowerCase().includes(ipoTypeFilter.toLowerCase())
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

        // Handle date sorting for specific date columns
        const dateKeys = ["Open", "Close", "BoA Dt", "Listing"];
        if (dateKeys.includes(sortConfig.key)) {
          const dateA = parseDateForSort(aVal);
          const dateB = parseDateForSort(bVal);

          // Handle null dates (e.g., 'N/A') by pushing them to the end
          if (dateA === null && dateB === null) return 0;
          if (dateA === null) return sortConfig.direction === "asc" ? 1 : -1;
          if (dateB === null) return sortConfig.direction === "asc" ? -1 : 1;

          if (sortConfig.direction === "asc") {
            return dateA.getTime() - dateB.getTime();
          }
          return dateB.getTime() - dateA.getTime();
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
      } else if (status.includes("apply") || status.includes("open") || status.includes("pending") || status.includes("allotment")) {
        current.push(ipo);
      } else if (status.includes("listed") || status.includes("closed")) {
        listed.push(ipo);
      }
    });

    // Calculate Mainboard and SME counts for current IPOs (after all filters)
    let currentMainboard = 0;
    let currentSme = 0;
    current.forEach(ipo => {
      if (ipo.Type && ipo.Type.toLowerCase().includes("main board")) {
        currentMainboard++;
      } else if (ipo.Type && ipo.Type.toLowerCase().includes("sme")) {
        currentSme++;
      }
    });


    return {
      upcomingIpos: upcoming,
      currentIpos: current,
      listedIpos: listed,
      totalIposCount: sortableItems.length, // Total IPOs after search and type filter
      currentMainboardCount: currentMainboard,
      currentSmeCount: currentSme
    };
  }, [ipoData, sortConfig, searchTerm, ipoTypeFilter]); // Added ipoTypeFilter to dependencies

  // This is used for card view and for determining if any IPOs match search
  const displayedIpoData = useMemo(() => {
    let filteredItems = [...ipoData];

    // Apply search term filter
    if (searchTerm) {
      filteredItems = filteredItems.filter(ipo =>
        ipo.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipo.Status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipo.Type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipo.GMP?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipo.Price?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ipo.Description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply IPO Type filter for card view
    if (ipoTypeFilter !== 'All') {
      filteredItems = filteredItems.filter(ipo =>
        ipo.Type?.toLowerCase().includes(ipoTypeFilter.toLowerCase())
      );
    }

    // Apply sorting for card view as well
    if (sortConfig.key) {
      filteredItems.sort((a, b) => {
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
        // Default to string comparison for other keys
        if (sortConfig.direction === "asc") {
          return String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        }
        return String(bVal).localeCompare(String(aVal), undefined, { numeric: true });
      });
    }
    return filteredItems;
  }, [ipoData, sortConfig, searchTerm, ipoTypeFilter]); // Added ipoTypeFilter to dependencies


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

  // Helper function to render a collapsible table section
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
    // Basic validation
    if (!contactForm.name || !contactForm.contactNumber || !contactForm.locality || !contactForm.email) {
      setContactFormMessage('Please fill in all mandatory fields.');
      return;
    }
    // Name field validation: only alphabets and spaces
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

    // Simulate form submission
    console.log("Contact Form Submitted:", contactForm);
    setContactFormMessage('we are experiencing technical difficulties. Please write us at trackmyipo@outlook.com');
    // Clear form after a short delay
    setTimeout(() => {
      setContactForm({ name: '', contactNumber: '', locality: '', email: '' });
      setContactFormMessage('');
      setShowContactUsModal(false); // Close modal after submission
    }, 5000);
  };

  // Effect to close sidebar if screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) { // Tailwind's 'sm' breakpoint
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      {/* Inject global styles for animations */}
      <style>{bounceAnimationCss}</style>

      {/* Full-screen Loading Splash Screen */}
      {isLoading && (
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

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-gradient-to-r from-blue-600 to-purple-700 text-white p-1 sm:p-2 shadow-lg rounded-b-xl">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
          {/* Mobile Top Row: Hamburger, Logo, Title */}
          <div className="flex w-full sm:w-auto justify-between items-center sm:mb-0">
            {/* Mobile: Hamburger Icon */}
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

            {/* Logo and Title - Centered on mobile, left on desktop */}
            <div className="flex items-center flex-grow sm:flex-grow-0 justify-center sm:justify-start">
            {/* Website Logo */}
              <img
                src={WEBSITE_LOGO_URL}
                alt="Website Logo"
                className="w-12 h-12 sm:w-16 sm:h-16 mr-2 sm:mr-4 object-contain" // Reduced size
                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/40x40/000000/FFFFFF?text=Logo"; }} // Fallback logo
              />
              <h1 className="text-lg sm:text-xl font-bold whitespace-nowrap text-center flex-grow">Track My IPO</h1> {/* Reduced font size */}
            </div>

            {/* Placeholder for desktop buttons to maintain spacing on mobile if needed, but hidden */}
            <div className="hidden sm:flex w-auto items-center gap-2">
              {/* These buttons are now moved to the rightmost div for desktop */}
            </div>
          </div>

          {/* Mobile Second Row: Search Bar & Switch View Button */}
          <div className="flex w-full sm:hidden items-center gap-2 -mt-1 mb-1"> {/* Increased gap to 2 */}
            <div className="relative flex-grow">
              <input
                type="text"
                id="searchInputMobile"
                placeholder="Search IPOs..."
                className="w-full p-1 pl-7 rounded-lg bg-white bg-opacity-20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-white text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-white w-3.5 h-3.5" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
              </svg>
            </div>
            <button
              onClick={() => setLayoutMode(layoutMode === 'card' ? 'table' : 'card')}
              className="flex-shrink-0 bg-white text-blue-700 font-bold py-1 px-2 rounded-lg shadow-md hover:bg-blue-100 transition duration-300 ease-in-out text-xs whitespace-nowrap" // Adjusted padding for better fit
            >
              Switch to {layoutMode === 'card' ? 'Table' : 'Card'} View
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar (Drawer) */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-blue-800 text-white z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out sm:hidden`}>
        <div className="p-4 flex justify-between items-center border-b border-blue-700">
          <h2 className="text-xl font-bold">Navigation</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="text-white text-2xl">
            &times;
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {/* About Us Button (Mobile Sidebar) */}
          <button
            onClick={() => { setShowAboutUsModal(true); setIsSidebarOpen(false); }}
            className="block w-full text-left py-2 px-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            About Us
          </button>
          {/* Contact Us Button (Mobile Sidebar) */}
          <button
            onClick={() => { setShowContactUsModal(true); setIsSidebarOpen(false); }}
            className="block w-full text-left py-2 px-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Contact Us
          </button>
        </nav>
      </div>
      {/* Overlay for sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* New Fixed Sort and Total IPOs Bar */}
      {/* Adjusted top based on new header height (approx 92px for mobile header) */}
      <div className="fixed top-[92px] sm:top-[80px] w-full z-40 bg-gray-200 p-1.5 sm:p-2 shadow-md flex flex-col sm:flex-row justify-between items-center text-gray-700 text-xs sm:text-sm">
        <div className="mb-1 sm:mb-0 text-center sm:text-left text-xs sm:text-sm">
          Total IPOs: {totalIposCount} (Current: {currentIpos.length} | Mainboard: {currentMainboardCount} | SME: {currentSmeCount})
        </div>
        <div className="flex gap-1 sm:gap-2 items-center flex-wrap justify-center sm:flex-nowrap"> {/* Added flex-wrap and justify-center for mobile */}
          {/* Refresh button */}
          <button
            onClick={() => {
              setRefreshTrigger(prev => prev + 1); // Increment to trigger useEffect
              showMessage("Refreshing IPO data...");
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded-lg transition duration-300 ease-in-out text-xs whitespace-nowrap" // Adjusted padding/font
          >
            Refresh
          </button>

          {/* Mobile Sort Dropdown Trigger */}
          <div className="relative sm:hidden">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded-lg transition duration-300 ease-in-out text-xs whitespace-nowrap flex items-center" // Adjusted padding/font
            >
              Sort
              <svg className={`w-3 h-3 ml-1 transform transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            {showSortDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg z-50 py-1 w-32 min-w-max"> {/* min-w-max to prevent text wrapping */}
                <button
                  onClick={() => { sortBy("Name"); setShowSortDropdown(false); }}
                  className="block w-full text-left px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Name {sortConfig.key === "Name" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                </button>
                <button
                  onClick={() => { sortBy("Open"); setShowSortDropdown(false); }}
                  className="block w-full text-left px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Open Date {sortConfig.key === "Open" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                </button>
              </div>
            )}
          </div>

          {/* Desktop Sort Buttons - visible on sm and up */}
          <button
            onClick={() => sortBy("Name")}
            className="hidden sm:block bg-blue-500 hover:bg-blue-600 text-white font-bold py-0.5 px-1 rounded-lg transition duration-300 ease-in-out text-[0.65rem] whitespace-nowrap"
          >
            Sort by Name {sortConfig.key === "Name" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "⬍"}
          </button>
          <button
            onClick={() => sortBy("Open")}
            className="hidden sm:block bg-blue-500 hover:bg-blue-600 text-white font-bold py-0.5 px-1 rounded-lg transition duration-300 ease-in-out text-[0.65rem] whitespace-nowrap"
          >
            Sort by Open Date {sortConfig.key === "Open" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "⬍"}
          </button>

          {/* IPO Type Filter Radios */}
          <div className="flex items-center gap-1 ml-2 flex-wrap sm:flex-nowrap"> {/* Added flex-wrap for mobile */}
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="ipoType"
                value="All"
                checked={ipoTypeFilter === 'All'}
                onChange={(e) => setIpoTypeFilter(e.target.value)}
              />
              <span className="ml-1 text-gray-700 text-xs whitespace-nowrap">All</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="ipoType"
                value="Main Board"
                checked={ipoTypeFilter === 'Main Board'}
                onChange={(e) => setIpoTypeFilter(e.target.value)}
              />
              <span className="ml-1 text-gray-700 text-xs whitespace-nowrap">Mainboard</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600"
                name="ipoType"
                value="SME"
                checked={ipoTypeFilter === 'SME'}
                onChange={(e) => setIpoTypeFilter(e.target.value)}
              />
              <span className="ml-1 text-gray-700 text-xs whitespace-nowrap">SME</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Content - Adjusted padding top to account for fixed header and new bar */}
      {/* Dynamic padding-bottom based on footer state */}
      <main className={`container mx-auto p-4 flex-grow overflow-y-auto pt-[120px] sm:pt-[116px] ${isFooterExpanded ? 'pb-[180px] sm:pb-28' : 'pb-[40px] sm:pb-28'}`}>
        {/* Conditional Rendering for Layout */}
        {layoutMode === 'card' ? (
          <section id="ipo-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Display cards if there's data to show, otherwise show a message */}
            {displayedIpoData.length > 0 ? (
              displayedIpoData.map((ipo, index) => (
                <div key={index} className="card p-6 flex flex-col justify-between relative">
                  {/* IPO Name and Type */}
                  <div className="flex-grow mb-2">
                    <h2 className="text-xl font-semibold text-blue-700">{ipo.Name} ({ipo.Type})</h2>
                  </div>

                  {/* Details and IPO Image - Grouped */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-grow"> {/* Details column */}
                      <p className="text-gray-700 text-sm mb-0.5"><strong>Price:</strong> {ipo.Price || 'N/A'}</p>
                      <p className="text-gray-700 text-sm mb-0.5"><strong>Lot Size:</strong> {ipo.Lot || 'N/A'}</p>
                      <p className="text-gray-700 text-sm mb-0.5"><strong>Open Date:</strong> {ipo.Open || 'N/A'}</p>
                      <p className="text-gray-700 text-sm mb-0.5"><strong>Close Date:</strong> {ipo.Close || 'N/A'}</p>
                    </div>
                    {/* IPO Image - Now beside the details */}
                    <div className="flex-shrink-0">
                      {ipo.ImageURL ? (
                        <img
                          src={ipo.ImageURL}
                          alt={`${ipo.Name} Logo`}
                          className="w-16 h-16 object-contain rounded-lg border p-1 bg-white shadow-sm"
                          onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/80x80/e0e0e0/555555?text=No+Image"; }}
                        />
                      ) : (
                        <img
                          src="https://placehold.co/80x80/e0e0e0/555555?text=No+Image"
                          alt="No Image Available"
                          className="w-16 h-16 object-contain rounded-lg border p-1 bg-white shadow-sm"
                        />
                      )}
                    </div>
                  </div>

                  {/* Description with Show More/Read Less */}
                  {ipo.Description && (
                    <div className="mb-4">
                      <DescriptionWithToggle description={ipo.Description} />
                    </div>
                  )}
                  
                  {/* GMP/Est Listing/IPO Size - below the image/price block */}
                  <p className="text-gray-600 text-sm mb-4">
                    <strong>GMP:</strong> {ipo.GMP || 'N/A'} |
                    <strong> Est. Listing:</strong> {ipo["Est Listing"] || 'N/A'} |
                    <strong> IPO Size:</strong> {ipo["IPO Size"] || 'N/A'}
                  </p>
                  {/* Status and View Details button */}
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
              // Show appropriate message if no data or no matching data
              !isLoading && (
                <p className="text-center text-gray-600 col-span-full">
                  {ipoData.length === 0 ? "No IPO data available. Please check the Google Sheet URL." : "No IPOs found matching your criteria."}
                </p>
              )
            )}
          </section>
        ) : (
          <div>
            {/* Render categorized table sections */}
            {renderTableSection("Current IPOs", currentIpos, showCurrentSection, () => setShowCurrentSection(!showCurrentSection))}
            {renderTableSection("Upcoming IPOs", upcomingIpos, showUpcomingSection, () => setShowUpcomingSection(!showUpcomingSection))}
            {renderTableSection("Listed/Closed IPOs", listedIpos, showListedSection, () => setShowListedSection(!showListedSection))}

            {/* Message if no IPOs found in table view after filtering/categorizing */}
            {ipoData.length > 0 && currentIpos.length === 0 && upcomingIpos.length === 0 && listedIpos.length === 0 && (
              <p className="px-3 py-4 text-center text-gray-600 bg-white rounded-lg shadow-sm">No IPOs found matching your criteria across all categories.</p>
            )}
            {ipoData.length === 0 && !isLoading && layoutMode === 'table' && (
                <p className="px-3 py-4 text-center text-gray-600 bg-white rounded-lg shadow-sm">No IPO data available to display in table view. Please check the Google Sheet URL.</p>
            )}
          </div>
        )}


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
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Check allotment from the below verified links</h3>
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

      {/* About Us Modal */}
      {showAboutUsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-lg"
              onClick={() => setShowAboutUsModal(false)}
            >
              ×
            </button>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">About Track My IPO</h3>
            <p className="text-gray-700 mb-4 text-sm max-h-60 overflow-y-auto"> {/* Added max-h and overflow for scrollability */}
              Track My IPO is your go-to application for staying updated on the latest Initial Public Offerings (IPOs).
              We aim to provide a simple, intuitive, and efficient way to track IPO statuses, GMP (Grey Market Premium),
              and other crucial details. Our goal is to empower investors with timely information to make informed decisions.
            </p>
            <p className="text-gray-700 text-sm mb-4">
              We are continuously working to enhance features and provide the best user experience.
            </p>

                 <p className="text-center text-gray-800 text-xs mt-4">
                Please share your suggestions and comments us at <a href="mailto:trackmyipo@outlook.com" className="text-blue-600 hover:underline">trackmyipo@outlook.com</a>
              </p>
 <p className="text-gray-600 text-xs mt-2"> {/* Reduced font size for disclaimer */}
                Disclaimer:
                All content provided on this platform is intended solely for educational and informational purposes.
                Under no circumstances should any information published here be interpreted as investment advice, a recommendation to buy or sell any securities, or guidance for participating in IPOs. 
                We are not registered with SEBI as financial analysts or advisors. 
                Users are strongly advised to consult a qualified financial advisor before making any investment decisions based on the information presented on this platform. 
                The content shared is based on publicly available data and prevailing market views as of the date of publication.
                By using this platform, you acknowledge and agree to these terms and conditions.
                   </p>
          </div>
        </div>
      )}

      {/* Contact Us Modal */}
      {showContactUsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-lg"
              onClick={() => { setShowContactUsModal(false); setContactFormMessage(''); }}
            >
              ×
            </button>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Contact Us</h3>
            <form onSubmit={handleContactFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={contactForm.name}
                  onChange={handleContactFormChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">Contact Number <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={contactForm.contactNumber}
                  onChange={handleContactFormChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                  pattern="[0-9]{10}" // Basic pattern for 10 digits
                  title="Please enter a 10-digit phone number"
                />
              </div>
              <div>
                <label htmlFor="locality" className="block text-sm font-medium text-gray-700">Locality <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  id="locality"
                  name="locality"
                  value={contactForm.locality}
                  onChange={handleContactFormChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label> {/* Changed label */}
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={contactForm.email}
                  onChange={handleContactFormChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              {contactFormMessage && (
                <p className={`text-center text-sm ${contactFormMessage.includes('Thanks') ? 'text-green-600' : 'text-red-600'}`}>
                  {contactFormMessage}
                </p>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out"
              >
                Submit
              </button>
              <p className="text-center text-gray-500 text-xs mt-4">
                Having trouble submitting form? email us at <a href="mailto:trackmyipo@outlook.com" className="text-blue-600 hover:underline">trackmyipo@outlook.com</a>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Collapsible Footer */}
      <footer
        id="broker-section"
        className={`fixed bottom-0 left-0 w-full bg-white border-t shadow z-40 transition-all duration-[2000ms] ease-in-out
          ${isFooterExpanded ? 'h-auto py-2 sm:py-2 px-2 sm:px-4' : 'h-[40px] sm:h-[40px] py-1 px-2 sm:px-4 overflow-hidden'}`}
        onClick={() => setIsFooterExpanded(!isFooterExpanded)}
      >
        <div
          className="flex justify-center items-center h-full sm:h-auto cursor-pointer"
        >
          <div className="flex flex-col items-center">
            {/* Arrow icon for expand/collapse */}
            <svg
              className={`w-5 h-5 text-gray-600 transform transition-transform duration-300 ${isFooterExpanded ? 'rotate-180' : 'rotate-0'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
            {/* Only show "Tap to Expand" or "Tap to Collapse" on mobile when collapsed/expanded */}
            <p className="text-gray-500 text-xs mt-0.5 sm:hidden">
              {isFooterExpanded ? 'Tap to Collapse' : 'Tap for Brokers'}
            </p>
          </div>
        </div>

        {/* Content that expands/collapses */}
        <div className={`transition-opacity duration-300 ${isFooterExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-1 sm:gap-2">
            {/* WhatsApp Channel Section */}
            <div className="whatsapp-section text-center sm:text-left mb-0.5 sm:mb-1">
              <a
                href="https://www.whatsapp.com/channel/0029VbBPCHaKAwEkO9zdRl34"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-green-600 text-white px-3 py-1 rounded-full shadow-md hover:bg-green-700 hover:scale-105 transition transform text-xs"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                  alt="WhatsApp"
                  className="w-3.5 h-3.5 mr-1"
                />
                WhatsApp Updates
              </a>
            </div>
            
            <div className="flex flex-col items-center sm:items-end">
              <h2 className="text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1 text-center text-gray-800 hover:text-blue-600 transition-all">
                🛡️ Open Demat account securely with verified investment brokers.
              </h2>
              <div className="flex flex-wrap justify-center gap-1 overflow-x-auto pb-0.5">
                {renderBrokerLinks()}
              </div>
            </div>
          </div>
          <p className="text-center text-gray-500 text-xs mt-1">© {new Date().getFullYear()} Track My IPO. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

// New component for Description with Show More/Read Less
const DescriptionWithToggle = ({ description }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const textRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const MAX_LINES = 3; // Set desired max lines for truncation

  useEffect(() => {
    if (textRef.current) {
      const element = textRef.current;
      
      // Temporarily remove line-clamp styles to get the full scrollHeight
      const originalWebkitLineClamp = element.style.webkitLineClamp;
      const originalDisplay = element.style.display;
      const originalOverflow = element.style.overflow;

      element.style.webkitLineClamp = 'unset';
      element.style.display = 'block';
      element.style.overflow = 'visible';

      const fullHeight = element.scrollHeight;
      const computedLineHeight = parseFloat(window.getComputedStyle(element).lineHeight);
      const thresholdHeight = computedLineHeight * MAX_LINES + 2; // Add a small buffer for safety

      // Check if the full content height exceeds the height of MAX_LINES
      setIsTruncated(fullHeight > thresholdHeight);

      // Re-apply line-clamp if not showing full description and it's truncated
      if (!showFullDescription && fullHeight > thresholdHeight) {
        element.style.webkitBoxOrient = 'vertical';
        element.style.display = '-webkit-box';
        element.style.overflow = 'hidden';
        element.style.webkitLineClamp = `${MAX_LINES}`;
      } else {
        // Ensure no line-clamp if showing full description or not truncated
        element.style.webkitLineClamp = 'unset';
        element.style.display = 'block';
        element.style.overflow = 'visible';
      }
    }
  }, [description, showFullDescription]); // Depend on description and showFullDescription

  if (!description) {
    return <p className="text-gray-600 text-sm">N/A</p>;
  }

  return (
    <div>
      <p ref={textRef} className="text-gray-600 text-sm">
        {description}
      </p>
      {isTruncated && ( // Only show button if text is actually truncated
        <button
          onClick={() => setShowFullDescription(!showFullDescription)}
          className="text-blue-500 hover:underline text-xs mt-1"
        >
          {showFullDescription ? 'Read Less' : 'Show More'}
        </button>
      )}
    </div>
  );
};


export default App;
