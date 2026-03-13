import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import ScraperPage from './pages/ScraperPage.jsx';
import ApiKeysPage from './pages/ApiKeysPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import Footer from './components/Footer.jsx';
import useSSE from './hooks/useSSE.js';

export default function App() {
  const [activePage, setActivePage] = useState('scraper');
  const [jobId, setJobId] = useState(null);
  const [keysCount, setKeysCount] = useState(0);
  const [quotaRemaining, setQuotaRemaining] = useState(0);

  const { progress } = useSSE(jobId);

  // Fetch initial keys info
  useEffect(() => {
    fetch('/api/keys')
      .then(r => r.json())
      .then(data => {
        setKeysCount(data.keys?.length || 0);
        setQuotaRemaining(data.totalRemaining || 0);
      })
      .catch(() => {});
  }, [activePage]);

  function handleKeysUpdate(count, remaining) {
    setKeysCount(count);
    setQuotaRemaining(remaining);
  }

  function handleResumeJob(id) {
    setJobId(id);
    setActivePage('scraper');
    fetch('/api/scrape/resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: id }),
    });
  }

  return (
    <>
      <Navbar
        activePage={activePage}
        onPageChange={setActivePage}
        keysCount={keysCount}
        quotaRemaining={quotaRemaining}
      />
      {activePage === 'scraper' && (
        <ScraperPage
          progress={progress}
          jobId={jobId}
          onJobId={setJobId}
        />
      )}
      {activePage === 'apikeys' && (
        <ApiKeysPage onKeysUpdate={handleKeysUpdate} />
      )}
      {activePage === 'history' && (
        <HistoryPage onResumeJob={handleResumeJob} />
      )}
      <Footer />
    </>
  );
}
