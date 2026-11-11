import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { OverviewPage } from './pages/OverviewPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SessionsPage } from './pages/SessionsPage';
import { SessionDetailPage } from './pages/SessionDetailPage';
import { BugsPage } from './pages/BugsPage';
import { BugDetailPage } from './pages/BugDetailPage';
import { InvestigationsPage } from './pages/InvestigationsPage';
import { ReproductionsPage } from './pages/ReproductionsPage';
import { RegressionTestsPage } from './pages/RegressionTestsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PlatformStats, Project, SessionSummary, BugReport } from './types';
import { api } from './api';

export function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [bugs, setBugs] = useState<BugReport[]>([]);

  // Deep detail selections
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshAll = async () => {
    setIsRefreshing(true);
    try {
      const [sData, pData, sessData, bData] = await Promise.all([
        api.getStats(),
        api.getProjects(),
        api.getSessions(),
        api.getBugs()
      ]);
      setStats(sData);
      setProjects(pData);
      setSessions(sessData);
      setBugs(bData);
    } catch (err) {
      console.error('Data refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 10000); // 10s live polling
    return () => clearInterval(interval);
  }, []);

  const handleSelectBug = (id: string) => {
    setSelectedBugId(id);
    setActiveTab('bug-detail');
  };

  const handleSelectSession = (id: string) => {
    setSelectedSessionId(id);
    setActiveTab('session-detail');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar
        activeTab={activeTab.startsWith('bug-detail') ? 'bugs' : activeTab.startsWith('session-detail') ? 'sessions' : activeTab}
        setActiveTab={(t) => {
          setSelectedBugId(null);
          setSelectedSessionId(null);
          setActiveTab(t);
        }}
        unresolvedCount={stats?.unresolved_bugs}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          projects={projects}
          selectedProject={projects[0]}
          onRefresh={refreshAll}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <OverviewPage
              stats={stats}
              onSelectBug={handleSelectBug}
              onNavigateTab={(t) => setActiveTab(t)}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsPage
              projects={projects}
              onRefresh={refreshAll}
            />
          )}

          {activeTab === 'sessions' && (
            <SessionsPage
              sessions={sessions}
              onSelectSession={handleSelectSession}
            />
          )}

          {activeTab === 'session-detail' && selectedSessionId && (
            <SessionDetailPage
              sessionId={selectedSessionId}
              onBack={() => setActiveTab('sessions')}
              onNavigateToBug={(bugId) => handleSelectBug(bugId)}
            />
          )}

          {activeTab === 'bugs' && (
            <BugsPage
              bugs={bugs}
              onSelectBug={handleSelectBug}
            />
          )}

          {activeTab === 'bug-detail' && selectedBugId && (
            <BugDetailPage
              bugId={selectedBugId}
              onBack={() => setActiveTab('bugs')}
              onNavigateToSession={(sessId) => handleSelectSession(sessId)}
            />
          )}

          {activeTab === 'investigations' && (
            <InvestigationsPage
              bugs={bugs}
              onSelectBug={handleSelectBug}
            />
          )}

          {activeTab === 'reproductions' && (
            <ReproductionsPage
              bugs={bugs}
              onSelectBug={handleSelectBug}
            />
          )}

          {activeTab === 'regression-tests' && (
            <RegressionTestsPage
              bugs={bugs}
              onSelectBug={handleSelectBug}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              projects={projects}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
