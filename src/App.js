import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSplashScreen from './components/LoadingSplashScreen';
import MessageBox from './components/MessageBox';
import IPOCard from './components/IPOCard';
import IPOTable from './components/IPOTable';
import AboutUsModal from './components/AboutUsModal';
import AllotmentPopup from './components/AllotmentPopup';
import BrokerPopup from './components/BrokerPopup';
import IPODetailPage from './components/IPODetailPage';
import PushNotificationPrompt from './components/PushNotificationPrompt';
import useIpoData from './hooks/useIpoData';
import { getStatusContent, getIpoStatusClass, getSortDirection, parseDateForSort } from './utils/utils';

// --- Firestore Imports ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// --- Main App component ---
const App = () => {
  // Global Firebase variables provided by the Canvas environment
  const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

  // State for the main application
  const [searchTerm, setSearchTerm] = useState('');
  const [ipoTypeFilter, setIpoTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [layoutMode, setLayoutMode] = useState('table');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAboutUsModal, setShowAboutUsModal] = useState(false);
  const [showAllotmentPopup, setShowAllotmentPopup] = useState(false);
  const [allotmentLinks, setAllotmentLinks] = useState([]);
  const [showBrokerPopup, setShowBrokerPopup] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Custom hook for data fetching and state management
  const {
    ipoData,
    isLoading,
    loadingProgress,
    loadingText,
    message,
    showMessageBox,
    showMessage,
    setShowMessageBox,
    refreshData,
    upcomingIpos,
    currentIpos,
    listedIpos,
    totalIposCount,
    currentMainboardCount,
    currentSmeCount,
    displayedIpoData,
    handleApplyClick,
    handleAllotmentClick,
    handleViewDetailsClick,
  } = useIpoData({
    searchTerm,
    ipoTypeFilter,
    statusFilter,
    layoutMode,
    sortConfig,
    setAllotmentLinks,
    setShowAllotmentPopup,
    setShowBrokerPopup,
  });

  const [contactFormMessage, setContactFormMessage] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    contactNumber: '',
    locality: '',
    email: ''
  });

  // State for IPODetailPage
  const [selectedIpoName, setSelectedIpoName] = useState(null);

  // New state for push notification prompt visibility
  const [showPushNotificationPrompt, setShowPushNotificationPrompt] = useState(false);

  // Firestore state variables
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);

  // --- Firebase Initialization ---
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const authInstance = getAuth(app);

        // Sign in using the provided token or anonymously
        if (initialAuthToken) {
          await signInWithCustomToken(authInstance, initialAuthToken);
        } else {
          await signInAnonymously(authInstance);
        }

        const currentUser = authInstance.currentUser;
        if (currentUser) {
          setUserId(currentUser.uid);
        } else {
          setUserId(crypto.randomUUID()); // Fallback for unauthenticated users
        }

        setDb(firestore);
        setAuth(authInstance);
      } catch (error) {
        console.error("Error initializing Firebase:", error);
      }
    };

    if (Object.keys(firebaseConfig).length > 0) {
      initializeFirebase();
    }
  }, [firebaseConfig, initialAuthToken]);


  // --- Push Notification Logic ---
  const setupNotifications = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('This browser does not support notifications or service workers.');
      return;
    }
    try {
      await navigator.serviceWorker.register('/service-worker.js');
      const subscription = await navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription());
      if (subscription) {
        localStorage.setItem('push-notification-status', 'subscribed');
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  useEffect(() => {
    // Register service worker and check for notification status on initial load
    setupNotifications();

    const notificationStatus = localStorage.getItem('push-notification-status');
    const hasClosedIpo = ipoData.some(ipo => {
      const status = ipo.Status ? String(ipo.Status).toLowerCase() : '';
      return status.includes('listed') || status.includes('closed');
    });

    if (hasClosedIpo && notificationStatus !== 'subscribed' && notificationStatus !== 'denied') {
      setShowPushNotificationPrompt(true);
    }
  }, [ipoData]);

  // --- Routing Logic ---
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1); // Remove the '#'
      const parts = hash.split('/');
      if (parts[0] === 'ipo' && parts[1]) {
        setSelectedIpoName(decodeURIComponent(parts[1]));
      } else {
        setSelectedIpoName(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run once on initial load

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const selectedIpo = ipoData.find(ipo => ipo.Name.replace(/\s/g, '-') === selectedIpoName);

  const handleContactFormChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prevState => ({ ...prevState, [name]: value }));
  };

  // --- Updated Contact Form Submission with Firestore ---
  const handleContactFormSubmit = async (e) => {
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

    setContactFormMessage('Submitting...');

    try {
      if (db && userId) {
        // Save the form data to a private collection in Firestore
        const contactSubmissionsRef = collection(db, 'artifacts', appId, 'users', userId, 'contactSubmissions');
        await addDoc(contactSubmissionsRef, {
          ...contactForm,
          timestamp: new Date(),
        });
        setContactFormMessage('Thank you for your message! We will get back to you shortly.');
        setTimeout(() => {
          setContactForm({ name: '', contactNumber: '', locality: '', email: '' });
          setContactFormMessage('');
          setShowAboutUsModal(false); // Close modal on success
        }, 3000);
      } else {
        setContactFormMessage('Database not ready. Please try again later.');
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      setContactFormMessage('We are experiencing technical difficulties. Please try again later.');
    }
  };

  if (isLoading) {
    return <LoadingSplashScreen progress={loadingProgress} text={loadingText} />;
  }

  // --- Refactored sortBy function to avoid redundancy ---
  const handleSortBy = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };


  // Render the selected IPO detail page if a hash is set
  if (selectedIpo && selectedIpoName) {
    return (
      <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
        <Header
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          layoutMode={layoutMode}
          setLayoutMode={setLayoutMode}
          setShowAboutUsModal={setShowAboutUsModal}
          setShowContactUsModal={setShowAboutUsModal} // Using the same modal state for simplicity
          setIsSidebarOpen={setIsSidebarOpen}
          isSidebarOpen={isSidebarOpen}
          totalIposCount={totalIposCount}
          currentMainboardCount={currentMainboardCount}
          currentSmeCount={currentSmeCount}
          refreshData={refreshData}
          sortConfig={sortConfig}
          sortBy={handleSortBy} // Passing the single function
          ipoTypeFilter={ipoTypeFilter}
          setIpoTypeFilter={setIpoTypeFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
        <main className="container mx-auto p-4 flex-grow overflow-y-auto pt-[130px] sm:pt-[128px] pb-[180px] sm:pb-28">
          <IPODetailPage ipo={selectedIpo} />
        </main>
        <Footer />
        <MessageBox message={message} showMessageBox={showMessageBox} setShowMessageBox={setShowMessageBox} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        layoutMode={layoutMode}
        setLayoutMode={setLayoutMode}
        setShowAboutUsModal={setShowAboutUsModal}
        setShowContactUsModal={setShowAboutUsModal}
        setIsSidebarOpen={setIsSidebarOpen}
        isSidebarOpen={isSidebarOpen}
        totalIposCount={totalIposCount}
        currentMainboardCount={currentMainboardCount}
        currentSmeCount={currentSmeCount}
        refreshData={refreshData}
        sortConfig={sortConfig}
        sortBy={handleSortBy} // Passing the single function
        ipoTypeFilter={ipoTypeFilter}
        setIpoTypeFilter={setIpoTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
      <main className="container mx-auto p-4 flex-grow overflow-y-auto pt-[130px] sm:pt-[128px] pb-[180px] sm:pb-28">
        {layoutMode === 'card' ? (
          <section id="ipo-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedIpoData.length > 0 ? (
              displayedIpoData.map((ipo, index) => (
                <IPOCard
                  key={index}
                  ipo={ipo}
                  onApplyClick={handleApplyClick}
                  onAllotmentClick={handleAllotmentClick}
                  onViewDetailsClick={handleViewDetailsClick}
                />
              ))
            ) : (
              <p className="text-center text-gray-600 col-span-full">
                No IPOs found matching your criteria.
              </p>
            )}
          </section>
        ) : (
          <div>
            <IPOTable title="Current IPOs" ipoList={currentIpos} sortConfig={sortConfig} sortBy={handleSortBy} />
            <IPOTable title="Upcoming IPOs" ipoList={upcomingIpos} sortConfig={sortConfig} sortBy={handleSortBy} />
            <IPOTable title="Listed/Closed IPOs" ipoList={listedIpos} sortConfig={sortConfig} sortBy={handleSortBy} />
            {ipoData.length > 0 && currentIpos.length === 0 && upcomingIpos.length === 0 && listedIpos.length === 0 && (
              <p className="px-3 py-4 text-center text-gray-600 bg-white rounded-lg shadow-sm">No IPOs found matching your criteria across all categories.</p>
            )}
            {ipoData.length === 0 && !isLoading && (
              <p className="px-3 py-4 text-center text-gray-600 bg-white rounded-lg shadow-sm">No IPO data available to display in table view. Please check the Google Sheet URL.</p>
            )}
          </div>
        )}
      </main>
      <Footer />
      <AboutUsModal
        isOpen={showAboutUsModal}
        onClose={() => setShowAboutUsModal(false)}
        contactForm={contactForm}
        onContactFormChange={handleContactFormChange}
        onContactFormSubmit={handleContactFormSubmit}
        contactFormMessage={contactFormMessage}
      />
      <AllotmentPopup
        isOpen={showAllotmentPopup}
        onClose={() => setShowAllotmentPopup(false)}
        allotmentLinks={allotmentLinks}
      />
      <BrokerPopup
        isOpen={showBrokerPopup}
        onClose={() => setShowBrokerPopup(false)}
      />
      <MessageBox message={message} showMessageBox={showMessageBox} setShowMessageBox={setShowMessageBox} />
      <PushNotificationPrompt
        isOpen={showPushNotificationPrompt}
        onSubscribe={() => {
          // You'd have to implement this part, but for now we'll just simulate it
          setShowPushNotificationPrompt(false);
          localStorage.setItem('push-notification-status', 'subscribed');
          showMessage('You will now receive IPO updates!');
          // Here's where you would call the real subscription logic
        }}
        onDismiss={() => {
          setShowPushNotificationPrompt(false);
          localStorage.setItem('push-notification-status', 'denied');
          showMessage('Notifications disabled.');
        }}
      />
    </div>
  );
};

export default App;

