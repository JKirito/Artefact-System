# Monorepo

This is a monorepo for backend and frontend applications built with Lerna and pnpm.

## Tech Stack

### Backend

- Node.js
- TypeScript
- Vite
- Express
- pnpm

### Frontend

- React
- TypeScript
- Vite
- pnpm

## Project Structure

```
monorepo/
├── packages/
│   ├── backend/         # Node.js backend service
│   └── frontend/        # React frontend application
├── lerna.json           # Lerna configuration
├── package.json         # Root package.json with workspace configuration
└── pnpm-workspace.yaml  # pnpm workspace configuration
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- pnpm (v7 or higher)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

This will install all dependencies for both packages.

### Environment Variables

The backend supports both LMStudio (local AI) and OpenAI API. Copy the example file and configure your preferred provider:

```bash
cp packages/backend/.env.example packages/backend/.env
# edit packages/backend/.env to configure your AI provider
```

#### Using LMStudio (Default)

The project is configured to use LMStudio with the gemma3:1b model by default. To use LMStudio:

1. **Install and run [LMStudio](https://lmstudio.ai/)**
2. **Download a model** (e.g., gemma3:1b or any other model you prefer)
3. **Load the model** in LMStudio (click the model to load it)
4. **Start the local server**:
   - Go to the "Developer" tab in LMStudio
   - Click "Start Server"
   - The server will run on http://localhost:1234/v1 by default
5. **Start the backend** - it's already configured to use LMStudio!

##### Troubleshooting LMStudio

- **"Unexpected endpoint" errors**: Make sure the server is running in LMStudio's Developer tab
- **Model not found**: The backend will show available models on startup. Update `LMSTUDIO_MODEL` in your `.env` file to match the exact model identifier shown in LMStudio
- **Connection failed**: Ensure LMStudio server is running on the correct port (default: 1234)

#### Using OpenAI API

To use OpenAI instead of LMStudio, update your `.env` file:

```bash
# Change AI_PROVIDER to openai
AI_PROVIDER=openai
OPENAI_KEY=your_openai_key_here
OPENAI_MODEL=gpt-3.5-turbo
```

Restart the backend after updating the file.

### Development

To start both frontend and backend in development mode:

```bash
pnpm dev
```

Or start them individually:

```bash
# Start backend only
pnpm --filter @monorepo/backend dev

# Start frontend only
pnpm --filter @monorepo/frontend dev
```

### Building

Build all packages:

```bash
pnpm build
```

Or build them individually:

```bash
# Build backend only
pnpm --filter @monorepo/backend build

# Build frontend only
pnpm --filter @monorepo/frontend build
```

## Adding New Packages

To add a new package to the monorepo:

1. Create a new directory in the `packages/` folder
2. Initialize a new package with `pnpm init`
3. Make sure to set the name in package.json with the `@monorepo/` prefix

## Adding Dependencies

To add dependencies to a specific package:

```bash
pnpm --filter @monorepo/backend add express
pnpm --filter @monorepo/frontend add react
```

To add dev dependencies:

```bash
pnpm --filter @monorepo/backend add -D typescript
```

To add a dependency to all packages:

```bash
pnpm add -w -D typescript
```
