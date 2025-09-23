# Feedback App

A full-stack feedback collection application with a React frontend and Express.js backend, connected to MongoDB for data storage.

## Project Structure

```
feedback_app/
├── client/          # React frontend application
├── server/          # Express.js backend API
├── package.json     # Root package.json for Prettier
└── README.md
```

## Prerequisites

Before running this project, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 14 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [MongoDB](https://www.mongodb.com/) database (local installation or MongoDB Atlas)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd feedback_app
```

### 2. Install Dependencies

Install dependencies for both client and server:

```bash
# Install root dependencies (Prettier)
npm install

# Install client dependencies
cd client
npm install
cd ..

# Install server dependencies
cd server
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the `server` directory:

```bash
cd server
touch .env
```

Add the following environment variables to `server/.env`:

```env
MONGO_URI=mongodb://localhost:27017/UserFeedback
PORT=5000
MISSING_REF_POLICY=ignore
```

For MongoDB Atlas (cloud database), replace the MONGO_URI with your Atlas connection string:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/UserFeedback?retryWrites=true&w=majority
```

### 4. Start the Development Servers

You'll need to run both the client and server simultaneously.

**Terminal 1 - Start the Backend Server:**
```bash
cd server
npm run dev
```
The server will start on `http://localhost:5000`

**Terminal 2 - Start the Frontend Client:**
```bash
cd client
npm start
```
The client will start on `http://localhost:3000`

### 5. Access the Application

Open your browser and navigate to `http://localhost:3000` to access the feedback application.

## Available Scripts

### Root Directory
- `npm run format` - Format all files using Prettier

### Client Directory
- `npm start` - Start the development server
- `npm run build` - Build the app for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Server Directory
- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon (auto-restart)

## Deployment on Vercel

### Prerequisites for Deployment

1. Create accounts on:
   - [Vercel](https://vercel.com/)
   - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (for cloud database)

### Step 1: Prepare Your Database

1. Set up a MongoDB Atlas cluster
2. Create a database named `UserFeedback`
3. Get your connection string from Atlas

### Step 2: Configure for Vercel Deployment

Create a `vercel.json` file in the root directory:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    },
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/client/build/$1"
    }
  ]
}
```

### Step 3: Deploy to Vercel

#### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy the project:
   ```bash
   vercel
   ```

4. Follow the prompts and add your environment variables when asked.

#### Option 2: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Configure the project settings:
   - Build Command: `cd client && npm run build`
   - Output Directory: `client/build`
6. Add environment variables in the Vercel dashboard:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `MISSING_REF_POLICY`: `ignore`

### Step 4: Update Client Configuration

If your client makes API calls to the backend, update the API base URL in your client code to use relative paths or environment variables that work in both development and production.

## Environment Variables Reference

### Server Environment Variables

- `MONGO_URI` - MongoDB connection string
- `PORT` - Server port (default: 5000)
- `MISSING_REF_POLICY` - Policy for handling missing references (default: ignore)

## Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   - Ensure your MongoDB service is running locally
   - Check your connection string format
   - Verify network access for MongoDB Atlas

2. **Port Conflicts**
   - Make sure ports 3000 and 5000 are available
   - Change the PORT environment variable if needed

3. **CORS Issues**
   - The server includes CORS middleware
   - Ensure your client URL is allowed in CORS settings

4. **Build Errors**
   - Clear node_modules and reinstall dependencies
   - Check for version compatibility issues

## Technologies Used

- **Frontend**: React 18, Axios, Create React App
- **Backend**: Express.js, Node.js
- **Database**: MongoDB
- **Development**: Nodemon, Prettier
- **Deployment**: Vercel

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run format` to format code
5. Commit your changes
6. Push to your branch
7. Create a Pull Request