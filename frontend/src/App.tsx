import React, { useState, useEffect } from 'react';
import { DamlLedger, useParty, useLedger, useStreamQueries } from '@c7/react';
import { OrderBlotter } from './OrderBlotter';
import { LimitOrder } from '@canton-dark-pool/daml-types/lib/DarkPool/Order';
import './App.css';

// In a real application, this would be configured via environment variables.
const DAML_LEDGER_URL = 'http://localhost:7575/';
const DARK_POOL_OPERATOR = 'DarkPoolOperator::12202638848f573b3815d045873917a23f1101968478465717658c14d9b4f4c8025c'; // Example party ID

type Credentials = {
  party: string;
  token: string;
};

// Main application component
const App: React.FC = () => {
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  // Attempt to load credentials from localStorage on initial render
  useEffect(() => {
    const savedCreds = localStorage.getItem('darkPoolCredentials');
    if (savedCreds) {
      try {
        const parsedCreds = JSON.parse(savedCreds);
        if (parsedCreds.party && parsedCreds.token) {
          setCredentials(parsedCreds);
        }
      } catch (error) {
        console.error("Failed to parse credentials from localStorage", error);
        localStorage.removeItem('darkPoolCredentials');
      }
    }
  }, []);

  const handleLogin = (creds: Credentials) => {
    setCredentials(creds);
    localStorage.setItem('darkPoolCredentials', JSON.stringify(creds));
  };

  const handleLogout = () => {
    setCredentials(null);
    localStorage.removeItem('darkPoolCredentials');
  };

  if (!credentials) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <DamlLedger token={credentials.token} party={credentials.party} httpBaseUrl={DAML_LEDGER_URL}>
      <MainScreen onLogout={handleLogout} />
    </DamlLedger>
  );
};

// Login form component
const LoginForm: React.FC<{ onLogin: (creds: Credentials) => void }> = ({ onLogin }) => {
  const [party, setParty] = useState('');
  const [token, setToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (party && token) {
      onLogin({ party, token });
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1>Canton Dark Pool</h1>
        <p>Institutional Block Trading</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="partyId">Party ID</label>
            <input
              id="partyId"
              type="text"
              value={party}
              onChange={(e) => setParty(e.target.value)}
              placeholder="Enter your Party ID"
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label htmlFor="token">JWT Token</label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your JWT Token"
              autoComplete="off"
            />
          </div>
          <button type="submit" className="button-primary">Login</button>
        </form>
         <div className="login-instructions">
          <p>
            Generate a token using DPM: <br />
            <code>dpm canton participant jwt --all-parties --ledger-api '{`"actAs": ["your-party-id"]`}'</code>
          </p>
        </div>
      </div>
    </div>
  );
};

// Main application screen, rendered after login
const MainScreen: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const party = useParty();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <h1>Canton Dark Pool</h1>
        </div>
        <div className="header-right">
          <div className="user-info">
            Logged in as: <strong>{party}</strong>
          </div>
          <button onClick={onLogout} className="button-secondary">Logout</button>
        </div>
      </header>
      <main className="app-main">
        <OrderEntry />
        <OrderBlotter />
      </main>
      <footer className="app-footer">
        <p>Canton Network | Privacy-Native Financial Infrastructure</p>
      </footer>
    </div>
  );
};

// Order entry form component
const OrderEntry: React.FC = () => {
  const [symbol, setSymbol] = useState('CIBN');
  const [side, setSide] = useState('Buy');
  const [quantity, setQuantity] = useState('10000');
  const [price, setPrice] = useState('150.25');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ledger = useLedger();
  const party = useParty();

  // Fetch submitted orders to show a running count
  const { contracts: submittedOrders } = useStreamQueries(LimitOrder);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const orderPayload = {
      owner: party,
      operator: DARK_POOL_OPERATOR,
      symbol,
      side,
      quantity,
      price,
    };

    try {
      await ledger.create(LimitOrder, orderPayload);
      // Reset form on success
      setQuantity('10000');
      setPrice('150.25');
    } catch (err: any) {
      console.error("Order submission failed:", err);
      setError(err.message || 'An unknown error occurred during order submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="order-entry-panel">
      <div className="panel-header">
        <h2>New Limit Order</h2>
        <span>{submittedOrders.length} Active Orders</span>
      </div>
      <form onSubmit={handleSubmitOrder} className="order-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="symbol">Symbol</label>
            <input
              id="symbol"
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="side">Side</label>
            <select id="side" value={side} onChange={(e) => setSide(e.target.value)}>
              <option value="Buy">Buy</option>
              <option value="Sell">Sell</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quantity">Quantity</label>
            <input
              id="quantity"
              type="number"
              step="1"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="price">Limit Price</label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`button-primary ${side.toLowerCase()}`}
        >
          {isSubmitting ? 'Submitting...' : `Submit ${side} Order`}
        </button>
        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  );
};

export default App;