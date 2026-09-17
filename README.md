# Tradely — Full-Stack Stock Trading Platform

Tradely is a full-stack stock trading platform built using the **MERN stack**. It provides a trading-style dashboard where users can view holdings, positions, orders, funds, market watchlist, portfolio summaries, and place buy orders through a React-based interface.

> **Note:** Tradely is an educational and portfolio project. It does not execute real stock-market transactions and should not be used for real-money trading.

---

## 🚀 Features

- 📊 Interactive trading dashboard
- 👀 Market watchlist
- 💼 Holdings management and visualization
- 📈 Positions tracking
- 🧾 Orders management
- 💰 Funds overview
- 📉 Portfolio charts and graphical representations
- 🛒 Buy-order interface with quantity and price inputs
- 🔄 REST API communication between frontend and backend
- 🗄️ MongoDB database integration using Mongoose
- ⚡ React-based component architecture
- 🧭 Client-side routing using React Router
- 🌐 Backend deployment support with Render

---

## 🛠️ Tech Stack

### Frontend

- **React.js**
- **Vite**
- **React Router**
- **Axios**
- **Material UI**
- **Chart.js**
- **React Chart.js 2**
- **JavaScript (ES Modules)**

### Backend

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **CORS**
- **dotenv**
- **JavaScript (ES Modules)**

---

## 📂 Project Structure

```text
tradely/
│
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   │
│   │   ├── models/
│   │   │   ├── HoldingsModel.js
│   │   │   ├── OrdersModel.js
│   │   │   └── PositionsModel.js
│   │   │
│   │   └── schemas/
│   │       ├── HoldingsSchema.js
│   │       ├── OrdersSchema.js
│   │       └── PositionsSchema.js
│   │
│   ├── package.json
│   └── package-lock.json
│
├── dashboard/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── logo.png
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── Apps.jsx
│   │   │   ├── BuyActionWindow.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DoughnoutChart.jsx
│   │   │   ├── Funds.jsx
│   │   │   ├── GeneralContext.jsx
│   │   │   ├── Holdings.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Menu.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── Positions.jsx
│   │   │   ├── Summary.jsx
│   │   │   ├── TopBar.jsx
│   │   │   ├── VerticalGraph.jsx
│   │   │   └── WatchList.jsx
│   │   │
│   │   └── App.jsx
│   │
│   ├── package.json
│   └── package-lock.json
│
└── README.md
```

---

## 🔌 Backend API

The backend currently provides the following REST API endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/allHoldings` | Fetch all holdings |
| `GET` | `/allPositions` | Fetch all positions |
| `POST` | `/newOrder` | Create and save a new order |

### Create a New Order

**Endpoint:**

```http
POST /newOrder
```

**Request Body:**

```json
{
  "name": "TCS",
  "qty": 2,
  "price": 3500,
  "mode": "BUY"
}
```

The order is stored in MongoDB using the `OrdersModel`.

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/)
- npm
- MongoDB / MongoDB Atlas
- Git

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/AvishekAmin/tradely.git
cd tradely
```

---

### 2. Setup the Backend

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the `backend` directory:

```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
```

Start the backend in development mode:

```bash
npm run dev
```

For production:

```bash
npm start
```

The backend will run on:

```text
http://localhost:8000
```

---

### 3. Setup the Dashboard

Open a new terminal and navigate to the dashboard:

```bash
cd dashboard
```

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Vite will display the local development URL in your terminal.

---

## 🔐 Environment Variables

The backend requires a MongoDB connection string.

Create:

```text
backend/.env
```

Example:

```env
PORT=8000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/tradely
```

> Never commit your `.env` file or expose database credentials publicly.

---

## 🧠 Application Architecture

Tradely follows a simple full-stack architecture:

```text
                ┌─────────────────────────┐
                │     React + Vite        │
                │       Dashboard         │
                └────────────┬────────────┘
                             │
                             │ Axios / REST API
                             ▼
                ┌─────────────────────────┐
                │      Express.js         │
                │        Backend          │
                └────────────┬────────────┘
                             │
                             │ Mongoose
                             ▼
                ┌─────────────────────────┐
                │        MongoDB          │
                │        Database         │
                └─────────────────────────┘
```

The React frontend communicates with the Express backend through REST APIs. The backend uses Mongoose models and schemas to interact with MongoDB.

---

## 📊 Dashboard Sections

The dashboard contains several sections designed around a stock-trading workflow.

### Summary

Provides an overview of the user's trading portfolio.

### Orders

Displays orders submitted through the trading interface.

### Holdings

Shows stocks currently held in the portfolio along with quantities, average prices, current prices, and returns.

### Positions

Displays current trading positions and related performance information.

### Funds

Provides an overview of available trading funds.

### Watchlist

Provides a market-style watchlist for tracking selected securities.

### Buy Order

The buy-order interface allows users to enter:

- Stock name
- Quantity
- Price
- Order mode

The order is sent to the backend using an Axios POST request and stored in MongoDB.

---

## 📈 Data Visualization

Tradely uses **Chart.js** and **react-chartjs-2** to present portfolio-related information through visual charts.

These visualizations help make portfolio and financial information easier to understand.

---

## 🌐 Deployment

The backend can be deployed as a **Render Web Service**.

The frontend can be deployed separately using a static hosting platform that supports Vite applications.

When deploying the backend:

1. Connect the GitHub repository.
2. Select the `backend` directory as the root directory.
3. Install dependencies using:

```bash
npm install
```

4. Start the service using:

```bash
npm start
```

5. Configure the required environment variables in the hosting platform.

---

## 🎯 Learning Objectives

This project was developed to gain practical experience with:

- Building a full-stack MERN application
- React component architecture
- React Router
- REST API development
- Axios-based API communication
- Express.js routing
- MongoDB database integration
- Mongoose schemas and models
- Asynchronous JavaScript
- Environment variable management
- Frontend and backend deployment
- Modern JavaScript ES Modules
- Data visualization with Chart.js

---

## 🔮 Future Improvements

Possible future enhancements include:

- 🔐 User authentication and authorization
- 👤 User-specific portfolios
- 📡 Real-time stock market data
- ⚡ Real-time price updates using WebSockets
- 🔎 Stock search and filtering
- 📜 Transaction history
- 🛍️ Sell-order functionality
- ✅ Server-side request validation
- 🛡️ Improved API security
- 📱 Improved mobile responsiveness
- 🔔 Notifications and order confirmations
- 📊 More advanced portfolio analytics

---

## ⚠️ Disclaimer

Tradely is a **learning and portfolio project** inspired by the workflow of modern stock-trading platforms.

It does **not** connect to a real stock exchange, execute real trades, or provide financial advice.

All stock data and transactions represented in the application are for demonstration purposes only.

---

## 👨‍💻 Author

**Avishek Amin**

- GitHub: [@AvishekAmin](https://github.com/AvishekAmin)
- Repository: [Tradely](https://github.com/AvishekAmin/tradely)

---

## ⭐ Project

If you find this project useful or interesting, consider giving the repository a ⭐ on GitHub.
