# TaskDep - Task Dependency Manager

A modern, full-stack web application for managing complex project tasks with dependency relationships. Built with React, Node.js, and MongoDB.

![TaskDep Preview](https://via.placeholder.com/800x400/4f46e5/ffffff?text=TaskDep+Dashboard)

## ✨ Features

- **Task Management**: Create, edit, delete, and organize tasks with full CRUD operations
- **Dependency Management**: Define task dependencies with automatic circular dependency detection
- **Smart Status Updates**: Tasks automatically become "Blocked" if their dependencies aren't completed
- **Visualizations**:
  - Interactive Gantt chart showing task timelines
  - Dependency graph with critical path highlighting
- **Real-time Updates**: Status changes propagate through dependent tasks
- **CSV Export**: Export all tasks to CSV format
- **Authentication**: Secure JWT-based user authentication
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Theme**: Toggle between themes for comfortable viewing
- **Input Validation**: Comprehensive client and server-side validation with Zod

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern React with hooks and context
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Chart.js** - Data visualization library
- **Axios** - HTTP client with JWT interceptors
- **Sonner** - Toast notification system
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Zod** - Schema validation
- **CORS** - Cross-origin resource sharing

## 🚀 Getting Started

### Prerequisites

- **Node.js** (version 16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn** package manager

### Quick Start (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/taskdep.git
   cd taskdep
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   ```bash
   cd server
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/task-dependency-manager
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   ```

4. **Start MongoDB**
   - **Local MongoDB**: Ensure MongoDB is running on port 27017
   - **MongoDB Atlas**: Update `MONGO_URI` with your Atlas connection string

5. **Launch the application**
   ```bash
   npm start
   ```
   This will:
   - Check prerequisites and install missing dependencies
   - Start both server and client in one terminal
   - Automatically open your browser at `http://localhost:5173`

### Manual Installation (Alternative)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/taskdep.git
   cd taskdep
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**
   ```bash
   cd ../server
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/task-dependency-manager
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   ```

5. **Start MongoDB**
   - **Local MongoDB**: Ensure MongoDB is running on port 27017
   - **MongoDB Atlas**: Update `MONGO_URI` with your Atlas connection string

6. **Start the application**

   **Terminal 1 - Backend Server:**
   ```bash
   cd server
   npm run dev
   ```

   **Terminal 2 - Frontend Client:**
   ```bash
   cd client
   npm run dev
   ```

7. **Access the application**
   - Open [http://localhost:5173](http://localhost:5173) in your browser
   - Register a new account or login

## 📖 Usage

### Basic Workflow
1. **Register/Login**: Create an account to get started
2. **Create Tasks**: Add tasks with titles, descriptions, priorities, and due dates
3. **Set Dependencies**: Link tasks together to create dependency chains
4. **Monitor Progress**: View automatic status updates and blocking relationships
5. **Visualize**: Use the Gantt chart and dependency graph to understand project flow
6. **Export Data**: Download your tasks as CSV for external analysis

### Key Concepts
- **Dependencies**: Tasks that must be completed before others can start
- **Circular Dependencies**: Automatically prevented to avoid infinite loops
- **Effective Status**: Real status considering dependency completion
- **Critical Path**: Longest chain of dependent tasks in your project

## 🏗️ Project Structure

```
taskdep/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   ├── utils/         # Utility functions
│   │   └── api/           # API client configuration
│   ├── public/            # Static assets
│   └── package.json
├── server/                 # Express backend
│   ├── routes/            # API route handlers
│   ├── models/            # Mongoose schemas
│   ├── middleware/        # Custom middleware
│   ├── utils/             # Server utilities
│   └── package.json
├── .gitignore             # Git ignore rules
├── README.md              # This file
└── package.json           # Root package file
```

## 🔧 Available Scripts

### Root (Project-wide)
- `npm start` - Launch both servers and open browser (recommended)
- `npm run stop` - Stop all running processes
- `npm run dev` - Run both servers concurrently (no browser auto-open)
- `npm run install-all` - Install dependencies for root, server, and client
- `npm run build` - Build client for production
- `npm run preview` - Preview production build
- `npm run clean` - Remove all node_modules folders

**PowerShell Scripts** (Windows):
- `.\run.ps1` - Same as `npm start` but with enhanced checks
- `.\stop.ps1` - Same as `npm run stop`

### Client
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Server
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- [MongoDB](https://www.mongodb.com/) - The application data platform
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Chart.js](https://www.chartjs.org/) - Simple yet flexible JavaScript charting

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

**Built with ❤️ using modern web technologies**