import React, { useState } from 'react';

const App = () => {
    const [input, setInput] = useState('');
    const [matchedServices, setMatchedServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (event) => {
        setInput(event.target.value);
    };

    const handleFindServices = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('https://your-cloud-url.com/api/services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            setMatchedServices(data.matchedServices);
        } catch (error) {
            setError('Failed to fetch services. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Service Finder</h1>
            <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Enter your service request"
            />
            <button onClick={handleFindServices}>Find Services</button>

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div>
                {matchedServices.map((service) => (
                    <div key={service.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
                        <h2>{service.serviceName}</h2>
                        <p>{service.description}</p>
                        <p>Category: {service.category}</p>
                        <p>Price: ${service.gRateOrPricingEstimate}</p>
                        <p>Effort: {service.estimatedEffortPersonDays} person-days</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default App;