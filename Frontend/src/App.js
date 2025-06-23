import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import GiftCardMarketplace from './components/GiftCardMarketplace';
import Checkout from './components/Checkout';
import OrderStatus from './components/OrderStatus';
import Footer from './components/Footer';
import './App.css';

function App() {
  const [cart, setCart] = useState([]);
  const [cryptoRates, setCryptoRates] = useState({});
  
  useEffect(() => {
    // Fetch cryptocurrency exchange rates
    const fetchRates = async () => {
      try {
        const response = await fetch('/api/crypto-rates');
        const data = await response.json();
        setCryptoRates(data);
      } catch (error) {
        console.error('Error fetching crypto rates:', error);
      }
    };
    
    fetchRates();
  }, []);

  const addToCart = (giftCard) => {
    setCart([...cart, giftCard]);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  return (
    <Router>
      <div className="app dark-theme">
        <Header cartCount={cart.length} />
        <main>
          <Routes>
            <Route 
              path="/" 
              element={
                <GiftCardMarketplace 
                  addToCart={addToCart} 
                  cryptoRates={cryptoRates}
                />
              } 
            />
            <Route 
              path="/checkout" 
              element={
                <Checkout 
                  cart={cart} 
                  removeFromCart={removeFromCart}
                  cryptoRates={cryptoRates}
                />
              } 
            />
            <Route path="/order/:orderId" element={<OrderStatus />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;