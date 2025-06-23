# Crypto Gift Card Marketplace - Readme

A full-stack cryptocurrency gift card marketplace that allows users to purchase digital gift cards using SAND( Sandbox Token ), Bitcoin, Ethereum, and other cryptocurrencies. This project integrates with CoinGate for payment processing and Tango Card for gift card fulfillment.

## Features

- 💳 Browse various gift cards from top brands (Amazon, Steam, Apple, etc.)
- 🪙 Pay with multiple cryptocurrencies (Bitcoin, Ethereum, Litecoin)
- ⚡️ Instant gift card delivery via email
- 📊 Order tracking and history
- 🔒 Secure payment processing with CoinGate
- 📧 Automated gift card delivery system
- 🌙 Dark mode UI

## Tech Stack

### Frontend
- **React.js** - JavaScript library for building user interfaces
- **React Router** - Navigation and routing
- **Axios** - HTTP client for API requests
- **CSS Modules** - Component-scoped styling

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database for storing orders
- **Mongoose** - MongoDB object modeling

### APIs & Services
- **CoinGate API** - Cryptocurrency payment processing
- **Tango Card API** - Gift card fulfillment
- **Nodemailer** - Email delivery service

## Installation

### Prerequisites
- Node.js (v14+)
- MongoDB
- CoinGate API key
- Tango Card API key

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your credentials:
```env
MONGODB_URI=mongodb://localhost:27017/giftcardmarket
COINGATE_AUTH_TOKEN=your_coingate_api_token
TANGO_API_KEY=your_tango_api_key
TANGO_ACCOUNT_ID=your_tango_account_id
TANGO_CUSTOMER_ID=your_tango_customer_id
BASE_URL=http://localhost:3000
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

4. Start the backend server:
```bash
npm start
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## Configuration

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `COINGATE_AUTH_TOKEN` | CoinGate API authentication token | Yes |
| `TANGO_API_KEY` | Tango Card API key | Yes |
| `TANGO_ACCOUNT_ID` | Tango Card account identifier | Yes |
| `TANGO_CUSTOMER_ID` | Tango Card customer identifier | Yes |
| `BASE_URL` | Base URL of your application | Yes |
| `EMAIL_USER` | Email account for sending gift cards | Yes |
| `EMAIL_PASS` | Email account password | Yes |

### API Keys
1. **CoinGate**: Sign up at [CoinGate](https://coingate.com) and create a merchant account to get your API key
2. **Tango Card**: Sign up at [Tango Card](https://www.tangocard.com) and create a developer account for API access

## Workflow

1. **User selects a gift card**  
   - Chooses brand and value
   - Adds to cart

2. **Checkout process**  
   - User enters email address
   - Selects cryptocurrency payment method
   - System calculates crypto amount based on current rates

3. **Payment initiation**  
   - Backend creates CoinGate order
   - Returns payment address and amount to user
   - Order stored in database with "pending" status

4. **Payment confirmation**  
   - User sends crypto to provided address
   - CoinGate detects payment after 2-6 confirmations
   - CoinGate sends webhook to backend

5. **Gift card fulfillment**  
   - Backend receives webhook, verifies payment
   - Creates gift card order via Tango Card API
   - Stores gift card codes securely
   - Sends email with gift card details to user

6. **Order completion**  
   - Order status updated to "completed"
   - User can view order status in their account

## API Endpoints

### Backend API
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/crypto-rates` | GET | Get current cryptocurrency exchange rates |
| `/api/create-order` | POST | Create a new gift card order |
| `/api/webhook/coingate` | POST | CoinGate payment webhook handler |
| `/api/orders/:orderId` | GET | Get order details |

## Deployment

### Heroku Deployment
1. Create a new Heroku app:
```bash
heroku create your-app-name
```

2. Set environment variables:
```bash
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set COINGATE_AUTH_TOKEN=your_coingate_token
# Set other environment variables similarly
```

3. Deploy your application:
```bash
git push heroku main
```

### Docker Deployment
1. Build the Docker image:
```bash
docker build -t giftcard-marketplace .
```

2. Run the container:
```bash
docker run -d -p 5000:5000 \
  -e MONGODB_URI=your_mongodb_uri \
  -e COINGATE_AUTH_TOKEN=your_coingate_token \
  # Add other environment variables
  giftcard-marketplace
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Create a new Pull Request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue on GitHub or contact the project maintainers.

---

**Happy shopping with crypto!** 🚀
