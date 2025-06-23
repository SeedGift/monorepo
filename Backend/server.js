require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// Order Schema
const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  items: { type: Array, required: true },
  total: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  cryptoAmount: { type: Number, required: true },
  walletAddress: { type: String, required: true },
  email: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  giftCardCode: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// CoinGate API configuration
const COINGATE_API_URL = 'https://api.coingate.com/v2/orders';
const COINGATE_AUTH_TOKEN = process.env.COINGATE_AUTH_TOKEN;

// Tango Card API configuration
const TANGO_API_URL = 'https://sandbox.tangocard.com/raas/v2/orders';
const TANGO_API_KEY = process.env.TANGO_API_KEY;
const TANGO_ACCOUNT_ID = process.env.TANGO_ACCOUNT_ID;
const TANGO_CUSTOMER_ID = process.env.TANGO_CUSTOMER_ID;

// Crypto exchange rates endpoint
app.get('/api/crypto-rates', async (req, res) => {
  try {
    // In production, we'd fetch real-time rates from CoinGate or CoinMarketCap
    const mockRates = {
      bitcoin: 45000,
      ethereum: 3000,
      litecoin: 120
    };
    
    res.json(mockRates);
  } catch (error) {
    console.error('Error fetching crypto rates:', error);
    res.status(500).json({ error: 'Failed to fetch crypto rates' });
  }
});

// Create new order endpoint
app.post('/api/create-order', async (req, res) => {
  try {
    const { items, paymentMethod, email } = req.body;
    const total = items.reduce((sum, item) => sum + item.value, 0);
    
    // Get crypto amount (mock for demo)
    const cryptoRates = {
      bitcoin: 45000,
      ethereum: 3000,
      litecoin: 120
    };
    const cryptoAmount = total / cryptoRates[paymentMethod];
    
    // Create CoinGate order
    const coingateResponse = await axios.post(
      COINGATE_API_URL,
      {
        price_amount: total,
        price_currency: 'USD',
        receive_currency: paymentMethod.toUpperCase(),
        callback_url: `${process.env.BASE_URL}/api/webhook/coingate`,
        cancel_url: `${process.env.BASE_URL}/cancel`,
        success_url: `${process.env.BASE_URL}/success`,
        title: `Gift Card Purchase - $${total}`,
        description: items.map(item => `${item.brand} $${item.value}`).join(', ')
      },
      {
        headers: {
          Authorization: `Bearer ${COINGATE_AUTH_TOKEN}`
        }
      }
    );
    
    const { id: coingateOrderId, payment_url, wallet_address } = coingateResponse.data;
    
    // Create order in our database
    const order = new Order({
      orderId: `ORD-${Date.now()}`,
      items,
      total,
      paymentMethod,
      cryptoAmount,
      walletAddress: wallet_address,
      email,
      coingateOrderId
    });
    
    await order.save();
    
    res.json({
      orderId: order.orderId,
      paymentUrl: payment_url,
      walletAddress: wallet_address,
      cryptoAmount: cryptoAmount.toFixed(6)
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// CoinGate webhook
app.post('/api/webhook/coingate', async (req, res) => {
  try {
    const { id, status } = req.body;
    
    // Verify the webhook signature in production
    
    // Find the order
    const order = await Order.findOne({ coingateOrderId: id });
    if (!order) {
      return res.status(404).send('Order not found');
    }
    
    // Update order status based on CoinGate status
    if (status === 'paid') {
      order.status = 'paid';
      await order.save();
      
      // Fulfill gift card order
      await fulfillGiftCardOrder(order);
    } else if (status === 'invalid') {
      order.status = 'failed';
      await order.save();
    }
    
    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal server error');
  }
});

// Fulfill gift card order with Tango Card API
async function fulfillGiftCardOrder(order) {
  try {
    // Create Tango Card order for each item
    for (const item of order.items) {
      const tangoResponse = await axios.post(
        TANGO_API_URL,
        {
          accountIdentifier: TANGO_ACCOUNT_ID,
          customerIdentifier: TANGO_CUSTOMER_ID,
          sendEmail: false,
          recipient: {
            email: order.email
          },
          sku: getTangoSku(item.brand, item.value),
          amount: item.value,
          campaign: "GiftCardCampaign",
          emailSubject: `Your ${item.brand} Gift Card`,
          externalRefID: order.orderId
        },
        {
          headers: {
            Authorization: `Basic ${TANGO_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const { cardNumber, cardPin } = tangoResponse.data;
      
      // Store gift card details (encrypt in production)
      item.giftCardCode = cardNumber;
      item.giftCardPin = cardPin;
    }
    
    // Update order with gift card details
    order.items = order.items.map(item => ({
      ...item,
      giftCardCode: item.giftCardCode,
      giftCardPin: item.giftCardPin
    }));
    
    order.status = 'completed';
    await order.save();
    
    // Send email to customer
    await sendGiftCardEmail(order);
  } catch (error) {
    console.error('Error fulfilling gift card order:', error);
    order.status = 'failed';
    await order.save();
  }
}

// Helper function to map brands to Tango Card SKUs
function getTangoSku(brand, value) {
  // This would be a mapping based on Tango Card's catalog
  const skuMap = {
    'Amazon': `AMZN-${value}`,
    'Steam': `STEAM-${value}`,
    'Apple': `APPL-${value}`,
    'Xbox': `XBOX-${value}`,
    'PlayStation': `PSN-${value}`,
    'Google Play': `GPLAY-${value}`,
    'Spotify': `SPOT-${value}`,
    'Netflix': `NF-${value}`
  };
  
  return skuMap[brand] || `GIFT-${value}`;
}

// Send gift card email
async function sendGiftCardEmail(order) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  const mailOptions = {
    from: `Gift Card Marketplace <${process.env.EMAIL_USER}>`,
    to: order.email,
    subject: 'Your Gift Cards Are Here!',
    html: `
      <h1>Your Gift Card Purchase</h1>
      <p>Thank you for your order (${order.orderId}). Here are your gift cards:</p>
      
      ${order.items.map(item => `
        <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <h2>${item.brand} $${item.value} Gift Card</h2>
          <p><strong>Code:</strong> ${item.giftCardCode}</p>
          ${item.giftCardPin ? `<p><strong>PIN:</strong> ${item.giftCardPin}</p>` : ''}
          <p>Redeem at: ${getRedemptionUrl(item.brand)}</p>
        </div>
      `).join('')}
      
      <p>If you have any issues, please contact support.</p>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${order.email}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

function getRedemptionUrl(brand) {
  const urls = {
    'Amazon': 'https://www.amazon.com/gc/redeem',
    'Steam': 'https://store.steampowered.com/account/redeemwalletcode',
    'Apple': 'https://apple.com/redeem',
    'Xbox': 'https://account.microsoft.com/billing/redeem',
    'PlayStation': 'https://store.playstation.com/redeem',
    'Google Play': 'https://play.google.com/redeem',
    'Spotify': 'https://spotify.com/redeem',
    'Netflix': 'https://netflix.com/redeem'
  };
  
  return urls[brand] || '#';
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});