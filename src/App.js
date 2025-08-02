import React from "react";
import useIpoData from "./hooks/useIpoData";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LayoutSwitcher from "./components/LayoutSwitcher";
import SearchBar from "./components/SearchBar";
import TableView from "./components/TableView";
import CardView from "./components/CardView";
import SplashScreen from "./components/SplashScreen";
import MessageBox from "./components/MessageBox";
import BrokerPopup from "./components/BrokerPopup";
import AllotmentPopup from "./components/AllotmentPopup";
import DetailsModal from "./components/DetailsModal";
import ContactUsModal from "./components/ContactUsModal";
import AboutUsModal from "./components/AboutUsModal";

const App = () => {
  const {
    isLoading,
    loadingProgress,
    loadingText,
    ipoData,
    currentIpos,
    upcomingIpos,
    listedIpos,
    sortConfig,
    layoutMode,
    displayedIpoData,
    state,
    actions,
  } = useIpoData();

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <style>{state.bounceAnimationCss}</style>

      {isLoading && (
        <SplashScreen
          loadingProgress={loadingProgress}
          loadingText={loadingText}
        />
      )}

      <Header
        layoutMode={layoutMode}
        searchTerm={state.searchTerm}
        setSearchTerm={actions.setSearchTerm}
        setLayoutMode={actions.setLayoutMode}
        setShowAboutUsModal={actions.setShowAboutUsModal}
        setShowContactUsModal={actions.setShowContactUsModal}
        setIsSidebarOpen={actions.setIsSidebarOpen}
        isSidebarOpen={state.isSidebarOpen}
      />

      <LayoutSwitcher
        ipoCounts={{
          total: ipoData.length,
          current: currentIpos.length,
          mainboard: state.currentMainboardCount,
          sme: state.currentSmeCount,
        }}
        sortConfig={sortConfig}
        sortBy={actions.sortBy}
        ipoTypeFilter={state.ipoTypeFilter}
        setIpoTypeFilter={actions.setIpoTypeFilter}
        statusFilter={state.statusFilter}
        setStatusFilter={actions.setStatusFilter}
        setRefreshTrigger={actions.setRefreshTrigger}
        showMessage={actions.showMessage}
      />

      <main className="container mx-auto p-4 flex-grow overflow-y-auto pt-[130px] sm:pt-[128px]">
        {layoutMode === "card" ? (
          <CardView
            displayedIpoData={displayedIpoData}
            onViewDetails={actions.handleViewDetailsClick}
            onApply={actions.handleApplyClick}
          />
        ) : (
          <TableView
            currentIpos={currentIpos}
            upcomingIpos={upcomingIpos}
            listedIpos={listedIpos}
            sortBy={actions.sortBy}
            sortConfig={sortConfig}
            getStatusContent={actions.getStatusContent}
            tableHeaders={state.tableHeaders}
          />
        )}
        {state.showMessageBox && <MessageBox message={state.message} onClose={actions.hideMessage} />}
      </main>

      {state.showBrokerPopup && <BrokerPopup onClose={actions.setShowBrokerPopup} showMessage={actions.showMessage} />}
      {state.showAllotmentPopup && <AllotmentPopup links={state.allotmentLinks} onClose={actions.setShowAllotmentPopup} />}
      {state.showDetailsModal && <DetailsModal ipo={state.selectedIpoDetails} onClose={actions.closeDetailsModal} getStatusContent={actions.getStatusContent} />}
      {state.showContactUsModal && <ContactUsModal state={state.contactForm} onChange={actions.handleContactFormChange} onSubmit={actions.handleContactFormSubmit} message={state.contactFormMessage} />}
      {state.showAboutUsModal && <AboutUsModal onClose={actions.setShowAboutUsModal} />}
      <Footer
        isFooterExpanded={state.isFooterExpanded}
        onToggle={() => actions.setIsFooterExpanded(!state.isFooterExpanded)}
        renderBrokerLinks={actions.renderBrokerLinks}
      />
    </div>
  );
};

export default App;
