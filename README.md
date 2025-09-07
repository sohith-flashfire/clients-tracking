# Dashboard Tracking

A comprehensive job application tracking system with client management capabilities.

## Features

- **Job Application Tracking**: Monitor job applications with status updates
- **Client Management**: Manage multiple clients with detailed information
- **Real-time Data**: Live updates from MongoDB database
- **Responsive UI**: Modern, clean interface built with React and Tailwind CSS
- **Date Filtering**: Filter jobs by application date
- **Status Management**: Track application status (Applied, Interviewing, Deleted, Saved, etc.)

## Tech Stack

### Frontend
- React 19
- Vite
- Tailwind CSS
- Modern ES6+ JavaScript

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- CORS enabled

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB instance

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/support1122/dashboard-tracking.git
   cd dashboard-tracking
   ```

2. **Backend Setup**
   ```bash
   cd applications-monitor-backend-main
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB connection string
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../applications-monitor-frontend-main
   npm install
   cp .env.example .env
   # Edit .env with your backend URL
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8086

## Deployment

For production deployment to Render, see [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Environment Variables

#### Backend
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (auto-set by Render)
- `NODE_ENV`: Environment (production/development)

#### Frontend
- `VITE_API_URL`: Backend API URL

## Project Structure

```
dashboard-tracking/
├── applications-monitor-backend-main/
│   ├── index.js              # Main server file
│   ├── JobModel.js           # Job data model
│   ├── ClientModel.js        # Client data model
│   ├── package.json
│   └── .env.example
├── applications-monitor-frontend-main/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Monitor.jsx   # Main dashboard component
│   │   │   └── ClientDetails.jsx # Client management modal
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
├── README.md
└── DEPLOYMENT.md
```

## API Endpoints

### Jobs
- `POST /` - Get all jobs

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/:email` - Get client by email
- `POST /api/clients` - Create or update client

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
