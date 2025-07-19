# SecureMail Analyzer Frontend

A React-based web interface for the SecureMail Analyzer tool.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Build for Production
```bash
npm run build
```

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
├── views/         # Page components
│   ├── Dashboard.tsx
│   └── EmailDetail.tsx
├── App.tsx        # Main app component
├── main.tsx       # Entry point
└── index.css      # Global styles
```

## 🔧 Configuration

- **Vite Config**: `vite.config.ts` - Development server and build configuration
- **TypeScript**: `tsconfig.json` - TypeScript compiler options
- **Proxy**: API requests to `/api/*` are proxied to `http://localhost:8000`

## 🎯 Current Status

- ✅ Basic React + TypeScript setup
- ✅ Vite development server
- ✅ React Router for navigation
- ✅ API proxy configuration
- 🔄 Dashboard component (placeholder)
- 🔄 Email detail component (placeholder)

## 📋 Next Steps

1. Create API service layer
2. Build email list component
3. Implement email detail view
4. Add styling and UI components
5. Connect to backend API endpoints 