import React, { useState } from 'react';

const App = () => {
  const [input, setInput] = useState('');
  const [budgetTier, setBudgetTier] = useState('Advanced'); // default
  const [matchedServices, setMatchedServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (event) => {
    setInput(event.target.value);
  };

  const handleBudgetChange = (event) => {
    setBudgetTier(event.target.value);
  };

  const handleFindServices = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/match-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: 'Demo Company', // static or allow input
          customerNeeds: input,
          budgetTier: budgetTier,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setMatchedServices(data.recommendations || []);
    } catch (error) {
      setError('Failed to fetch services. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getBudgetLimitText = (tier) => {
    switch (tier) {
      case 'Foundational':
        return 'Max £500/day';
      case 'Advanced':
        return 'Max £750/day';
      case 'Max':
        return 'Max £1,200/day';
      default:
        return '';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Service Finder</h1>

      <label htmlFor="input">Enter your service request:</label>
      <br />
      <textarea
        id="input"
        value={input}
        onChange={handleInputChange}
        rows="4"
        style={{ width: '100%', marginTop: '8px' }}
        placeholder="e.g. Help with procurement optimization and 24/7 support"
      />

      <br /><br />

      <label htmlFor="budgetTier">Select your budget tier:</label>
      <br />
      <select
        id="budgetTier"
        value={budgetTier}
        onChange={handleBudgetChange}
        style={{ marginTop: '8px', padding: '5px' }}
      >
        <option value="Foundational">Foundational</option>
        <option value="Advanced">Advanced</option>
        <option value="Max">Max</option>
      </select>

      <br /><br />
      <button onClick={handleFindServices}>Find Services</button>

      <br /><br />

      <p>
        <strong>Filtering services for:</strong> {budgetTier} Budget Tier (
        {getBudgetLimitText(budgetTier)})
      </p>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div>
        {matchedServices.map((service, idx) => (
          <div
            key={idx}
            style={{
              border: '1px solid #ccc',
              marginBottom: '10px',
              padding: '10px',
              borderRadius: '4px',
            }}
          >
            <h2>{service.serviceName}</h2>
            <p>{service.description}</p>
            <p><strong>Category:</strong> {service.category}</p>
            <p><strong>Price:</strong> {service.gRateOrPricingEstimate}</p>
            <p><strong>Effort:</strong> {service.estimatedEffortPersonDays} person-days</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
