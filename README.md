# British Auction RFQ System

A full-stack web application for managing British Auctions in a Request for Quotation (RFQ) system.

## High-Level Design (HLD)

---

## Features
- **RFQ Creation**: Create auctions with start, close, and forced close times.
- **Auction Logic**: Automatic time extensions (British Auction) based on configurable triggers:
  - Bid received in the last X minutes.
  - Any supplier rank change.
  - Lowest bidder (L1) change.
- **Real-time Updates**: Socket.io integration for instant bid and timer updates.
- **Supplier Rankings**: Automatic L1, L2, L3 ranking based on the lowest total price.
- **Activity Log**: Detailed history of bid submissions and auction extensions.

## Tech Stack
- **Frontend**: React, Bootstrap, Axios.
- **Backend**: Node.js, Express.js.
- **Database**: MySQL.

## Prerequisites
- Node.js installed.
- MySQL Server installed and running.

## Setup Instructions

### 1. Database Setup
1. Open your MySQL client (e.g., MySQL Workbench or CLI).
2. Execute the contents of `schema.sql` found in the root directory to create the database and tables.
   ```sql
   source schema.sql;
   ```

### 2. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=your_mysql_user
   DB_PASS=your_mysql_password
   DB_NAME=british_auction
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```

## Usage
1. Access the application at `http://localhost:3000`.
2. Create an RFQ using the "Create RFQ" button.
3. Once created, click "View Details" on the listing page.
4. Use the bidding form to simulate bids from different suppliers.
5. Watch the timer extend if a bid is placed within the trigger window!
