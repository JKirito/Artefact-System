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

The backend requires an OpenAI API key. Copy the example file and add your key:

```bash
cp packages/backend/.env.example packages/backend/.env
# edit packages/backend/.env and set OPENAI_KEY=your_openai_key
# optionally update OPENAI_MODEL if you have access to different models
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
