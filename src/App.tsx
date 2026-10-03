import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { QRScannerModal } from './components/QRScannerModal';
import { DigitalIdModal } from './components/DigitalIdModal';

// Screens
import { HomeScreen } from './screens/HomeScreen';
import { MeetingsScreen } from './screens/MeetingsScreen';
import { MembersScreen } from './screens/MembersScreen';
import { ProjectsScreen } from './screens/ProjectsScreen';
import { FinanceScreen } from './screens/FinanceScreen';
import { AnnouncementsScreen } from './screens/AnnouncementsScreen';
import { DocumentsScreen } from './screens/DocumentsScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { ConstitutionScreen } from './screens/ConstitutionScreen';
import { AuditScreen } from './screens/AuditScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'meetings':
        return <MeetingsScreen />;
      case 'members':
        return <MembersScreen />;
      case 'services':
        return <ProjectsScreen />;
      case 'finance':
        return <FinanceScreen />;
      case 'announcements':
        return <AnnouncementsScreen />;
      case 'documents':
        return <DocumentsScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'constitution':
        return <ConstitutionScreen />;
      case 'audit':
        return <AuditScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <Header />
      <main className="flex-1">
        {renderScreen()}
      </main>
      <BottomNav />

      {/* Global Interactive Modals */}
      <RoleSwitcherModal />
      <QRScannerModal />
      <DigitalIdModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
