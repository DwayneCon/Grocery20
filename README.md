# AI Grocery Planner

A production-ready AI-powered grocery planning web application that revolutionizes meal planning through natural conversation with AI, creating personalized meal plans that consider household preferences, budgets, and local grocery deals.

## 🎯 Features

- **AI-Powered Meal Planning**: Natural language conversation to generate personalized meal plans
- **Household Management**: Manage multiple household members with individual dietary preferences
- **Smart Shopping Lists**: Automatically generated, optimized shopping lists
- **Budget Tracking**: Monitor grocery spending and find the best deals
- **Dietary Restrictions**: Support for allergies, intolerances, and preferences
- **Recipe Management**: Browse, save, and modify recipes
- **Mobile Responsive**: Works seamlessly on all devices

## 🏗️ Tech Stack

### Frontend
- React 18+ with TypeScript
- Redux Toolkit + RTK Query
- Material-UI v5
- Vite (Build Tool)
- Axios for API calls
- Framer Motion for animations

### Backend
- Node.js 20 LTS
- Express.js with TypeScript
- MySQL 8.0
- OpenAI GPT-4 API
- JWT Authentication
- Helmet.js for security

## 📋 Prerequisites

- Node.js 20.x or higher
- MySQL 8.0 or higher
- npm or yarn
- OpenAI API key (for AI features)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Grocery20
```

### 2. Install Dependencies

```bash
npm run install:all
```

### 3. Set Up Environment Variables

#### Client (.env)
```bash
cd client
cp .env.example .env
```

Edit `client/.env`:
```env
VITE_API_URL=http://localhost:3001/api
VITE_ENV=development
```

#### Server (.env)
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=grocery_planner
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# OpenAI
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4-turbo-preview

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 4. Set Up Database

```bash
# Create database and tables
mysql -u root -p < scripts/schema.sql

# Optional: Seed with sample data
mysql -u root -p grocery_planner < scripts/seed.sql
```

### 5. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start individually:
npm run dev:client  # Frontend only (http://localhost:5173)
npm run dev:server  # Backend only (http://localhost:3001)
```

## 🛠️ Available Scripts

### Root Directory

- `npm run install:all` - Install all dependencies
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend for production
- `npm start` - Start production server
- `npm run db:setup` - Set up database schema
- `npm run clean` - Remove all node_modules and build files
- `npm run type-check` - Run TypeScript type checking

### Client Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Server Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

## 📁 Project Structure

```
Grocery20/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── features/      # Redux slices
│   │   ├── hooks/         # Custom hooks
│   │   ├── layouts/       # Page layouts
│   │   ├── pages/         # Route pages
│   │   ├── services/      # API services
│   │   ├── styles/        # Global styles
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Helper functions
│   └── vite.config.ts
│
├── server/                # Node.js backend
│   ├── src/
│   │   ├── api/          # API routes
│   │   ├── config/       # Configuration
│   │   ├── middleware/   # Express middleware
│   │   ├── models/       # Database models
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utilities
│   └── tsconfig.json
│
├── scripts/              # Deployment scripts
│   ├── schema.sql        # Database schema
│   └── deploy.sh         # Deployment script
│
├── docs/                 # Documentation
│   └── API.md           # API documentation
│
└── package.json         # Root package config
```

## 🔐 Security

This application implements multiple security measures:

- JWT-based authentication with refresh tokens
- Bcrypt password hashing (12 salt rounds)
- Helmet.js for security headers
- CORS configuration
- Rate limiting on API endpoints
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### AI Chat
- `POST /api/ai/chat` - Chat with AI assistant
- `POST /api/ai/meal-plan` - Generate meal plan

See [API.md](docs/API.md) for detailed documentation.

## 🚀 Deployment

### GoDaddy Hosting

1. Build the application:
```bash
npm run build
```

2. Set up database on GoDaddy cPanel

3. Upload files via FTP or SSH:
```bash
bash scripts/deploy.sh
```

4. Configure environment variables on the server

5. Start the server with PM2:
```bash
pm2 start server/dist/index.js --name grocery-api
pm2 save
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## 📝 Environment Variables

### Required
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT secret key
- `OPENAI_API_KEY` - OpenAI API key

### Optional
- `KROGER_CLIENT_ID` - Kroger API client ID
- `WALMART_API_KEY` - Walmart API key
- `SENTRY_DSN` - Sentry error tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

ISC License - See LICENSE file for details

## 👨‍💻 Author

**Dwayne Concepcion**
- Website: https://dwaynecon.me
- Domain: https://grocery.dwaynecon.com

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Material-UI for the component library
- All open-source contributors

## 📞 Support

For issues and questions:
- GitHub Issues: [Create an issue]
- Email: [Your email]

---

Built with ❤️ by Dwayne Concepcion
