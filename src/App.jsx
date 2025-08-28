import React, { useState } from 'react';

const App = () => {
  const [input, setInput] = useState('');
  const [matchedServices, setMatchedServices] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [scopeSummary, setScopeSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setMatchedServices([]);
    setAddOns([]);
    setScopeSummary([]);
    try {
      const response = await fetch('http://localhost:3001/match-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerNeeds: input,
          budgetTier: 'Advanced', // or let user select
          companyName: 'Demo Company'
        }),
      });
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      setMatchedServices(data.recommendations || []);
      setAddOns(data.addOns || []);
      setScopeSummary(data.scopeSummary || []);
    } catch (err) {
      setError('Failed to fetch services.');
    } finally {
      setLoading(false);
    }
  };

  // Export PDF
  const handleExportPdf = async () => {
    try {
      const response = await fetch('http://localhost:3001/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerNeeds: input,
          budgetTier: 'Advanced',
          companyName: 'Demo Company'
        }),
      });
      if (!response.ok) throw new Error('PDF export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ServiceProposal.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export PDF.');
    }
  };

  // Export PowerPoint
  const handleExportPptx = async () => {
    try {
      const response = await fetch('http://localhost:3001/export/pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerNeeds: input,
          budgetTier: 'Advanced',
          companyName: 'Demo Company'
        }),
      });
      if (!response.ok) throw new Error('PowerPoint export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ServiceProposal.pptx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export PowerPoint.');
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: 'auto', padding: 20 }}>
      <h2>Service Finder</h2>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Describe your service needs"
        style={{ width: '80%', padding: 8 }}
      />
      <button onClick={handleSearch} style={{ marginLeft: 10, padding: 8 }}>
        Find Services
      </button>
      <button onClick={handleExportPdf} style={{ marginLeft: 10, padding: 8 }}>
        Export as PDF
      </button>
      <button onClick={handleExportPptx} style={{ marginLeft: 10, padding: 8 }}>
        Export as PowerPoint
      </button>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      <h3>Matched Services</h3>
      <div>
        {matchedServices.map(svc => (
          <div key={svc.serviceName} style={{ border: '1px solid #ccc', borderRadius: 8, margin: 8, padding: 12 }}>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>{svc.serviceName}</div>
            <div>{svc.description}</div>
            <div>Category: {svc.category}</div>
            <div>Price: {svc.gRateOrPricingEstimate}</div>
            <div>Effort: {svc.estimatedEffortPersonDays} person-days</div>
            <div>ROM Estimate: {svc.romEstimate}</div>
            {svc.entitlements && (
              <ul>
                {svc.entitlements.map((ent, idx) => (
                  <li key={idx}>{ent}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {addOns.length > 0 && (
        <>
          <h3>Recommended Add-ons</h3>
          <ul>
            {addOns.map((addon, idx) => (
              <li key={idx}>
                <strong>{addon.name}</strong>: {addon.description} <br />
                <em>Roles:</em> {addon.roles} <br />
                <em>Effort:</em> {addon.estimatedEffort}
              </li>
            ))}
          </ul>
        </>
      )}

      {scopeSummary.length > 0 && (
        <>
          <h3>Statement of Work Summary</h3>
          <ul>
            {scopeSummary.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default App;