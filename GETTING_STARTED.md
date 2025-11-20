# Getting Started with AI Grocery Planner

This guide will help you get the application up and running on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20.x or higher ([Download](https://nodejs.org/))
- **MySQL**: Version 8.0 or higher ([Download](https://dev.mysql.com/downloads/))
- **npm**: Comes with Node.js
- **Git**: For version control ([Download](https://git-scm.com/))

## Step 1: Install Dependencies

From the root directory, install all dependencies for both client and server:

```bash
npm run install:all
```

This command will:
1. Install root dependencies
2. Install client (frontend) dependencies
3. Install server (backend) dependencies

## Step 2: Set Up MySQL Database

### Create the Database

1. Open MySQL command line:
```bash
mysql -u root -p
```

2. Create the database:
```sql
CREATE DATABASE grocery_planner;
EXIT;
```

### Run the Schema

From the project root, run:
```bash
mysql -u root -p grocery_planner < scripts/schema.sql
```

This will create all necessary tables and indexes.

## Step 3: Configure Environment Variables

### Client Environment Variables

1. Navigate to the client directory:
```bash
cd client
```

2. Copy the example file:
```bash
cp .env.example .env
```

3. Edit `.env` with your settings:
```env
VITE_API_URL=http://localhost:3001/api
VITE_ENV=development
```

### Server Environment Variables

1. Navigate to the server directory:
```bash
cd ../server
```

2. Copy the example file:
```bash
cp .env.example .env
```

3. Edit `.env` with your settings:
```env
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=grocery_planner
DB_USER=root
DB_PASSWORD=your_mysql_password

# JWT Configuration (generate secure random strings)
JWT_SECRET=your-secure-secret-key-minimum-32-characters
JWT_REFRESH_SECRET=your-secure-refresh-secret-minimum-32-characters
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# OpenAI API (get from https://platform.openai.com/)
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_FALLBACK_MODEL=gpt-3.5-turbo

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Generate Secure Keys

For JWT secrets, use:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Step 4: Start the Development Servers

### Option 1: Start Both Servers Together (Recommended)

From the root directory:
```bash
npm run dev
```

This will start:
- **Frontend**: http://localhost:5173 (or 3000)
- **Backend API**: http://localhost:3001

### Option 2: Start Servers Separately

**Terminal 1 - Backend:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
npm run dev:client
```

## Step 5: Verify Installation

1. **Check Backend Health**:
   - Open browser to: http://localhost:3001/health
   - You should see: `{"status":"healthy",...}`

2. **Check Frontend**:
   - Open browser to: http://localhost:5173
   - You should see the application homepage

3. **Test Database Connection**:
   - The server logs should show: `✅ Database connected successfully`

## Step 6: Create Your First Account

1. Navigate to: http://localhost:5173
2. Click "Get Started" or "Sign Up"
3. Fill in your details:
   - Name
   - Email
   - Password (minimum 8 characters)
4. Click "Sign Up"
5. You'll be redirected to the dashboard

## Next Steps

### Explore the Features

1. **AI Chat**: Navigate to the AI Chat page and start a conversation
   - Example: "Plan meals for 4 people with a $150 budget"

2. **Meal Plans**: View and manage your weekly meal plans

3. **Shopping Lists**: See automatically generated shopping lists

### Configure OpenAI (Optional)

If you don't have an OpenAI API key yet:

1. Sign up at: https://platform.openai.com/
2. Go to API Keys section
3. Create a new API key
4. Add it to `server/.env` as `OPENAI_API_KEY`
5. Restart the server

**Note**: Without an OpenAI key, AI features won't work, but you can still use the basic app features.

### Use Free AI Alternative (Optional)

If you want to avoid OpenAI costs, you can use:

1. **Ollama** (Local):
   - Install from: https://ollama.ai/
   - Modify `server/src/api/ai/ai.controller.ts` to use Ollama

2. **Groq** (Free Tier):
   - Sign up at: https://groq.com/
   - Get API key
   - Update configuration

## Common Issues

### Port Already in Use

If you see "Port 3001 already in use":
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9

# Or use a different port in server/.env
PORT=3002
```

### Database Connection Failed

1. Verify MySQL is running:
```bash
mysql.server status
# or
sudo systemctl status mysql
```

2. Check credentials in `server/.env`
3. Verify database exists:
```bash
mysql -u root -p -e "SHOW DATABASES;"
```

### Build Errors

Clear cache and reinstall:
```bash
npm run clean
npm run install:all
```

### TypeScript Errors

Run type checking:
```bash
npm run type-check
```

## Development Workflow

### Making Changes

1. **Frontend changes**: Vite will hot-reload automatically
2. **Backend changes**: Nodemon will restart the server automatically
3. **Database changes**: Update `scripts/schema.sql` and re-run

### Running Type Checks

```bash
npm run type-check
```

### Linting and Formatting

```bash
# Client
cd client
npm run lint
npm run format

# Server
cd server
# Add linting scripts as needed
```

## Building for Production

```bash
# Build both client and server
npm run build

# Or individually
npm run build:client
npm run build:server
```

## Need Help?

- Check the [README.md](README.md) for more information
- Review [API Documentation](docs/API.md)
- Check the [claude.md](claude.md) for project guidelines
- Create an issue on GitHub

## Quick Reference

### Useful Commands

```bash
# Install all dependencies
npm run install:all

# Start development servers
npm run dev

# Build for production
npm run build

# Set up database
npm run db:setup

# Clean everything
npm run clean

# Type checking
npm run type-check
```

### Default URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

### Default Credentials (After Setup)

Create your own account - no default credentials are provided for security.

---

**Happy Coding! 🚀**
