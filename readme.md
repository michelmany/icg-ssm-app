# ICG School Services Manager

## Overview

This project is divided into two main parts: the frontend and the backend. The frontend is built using Next.js, while the backend is built using Express and Prisma.

## Folder Structure

### Frontend

The frontend is located in the `frontend` folder. It is a Next.js application with the following structure:

- `.next/`: Contains the build output and cache for the Next.js application.
- `src/`: Contains the source code for the frontend application.
  - `app/`: Contains the main application components and pages.
- `public/`: Contains static assets like images and fonts.
- `package.json`: Contains the dependencies and scripts for the frontend application.
- `tsconfig.json`: TypeScript configuration for the frontend.
- `next.config.ts`: Configuration file for Next.js.
- `tailwind.config.ts`: Configuration file for Tailwind CSS.
- `postcss.config.mjs`: Configuration file for PostCSS.
- `eslint.config.mjs`: Configuration file for ESLint.

### Backend

The backend is located in the `backend` folder. It is an Express application with Prisma for database management. The structure is as follows:

- `prisma/`: Contains the Prisma schema and migrations.
  - `schema.prisma`: The Prisma schema file.
- `src/`: Contains the source code for the backend application.
  - `api/`: Contains the API routes and controllers.
  - `index.ts`: The entry point for the backend application.
- `.env`: Environment variables for the backend application.
- `package.json`: Contains the dependencies and scripts for the backend application.
- `tsconfig.json`: TypeScript configuration for the backend.

## Running the Project

To run the project, you need to have Node.js and npm installed. Follow these steps:

1. Create the docker container with the provided .yml file. 

```sh
docker compose up -d
```

2. Install the dependencies for both the frontend and backend:

```sh
cd frontend
npm install
cd ../backend
npm install
npx prisma migrate dev --name init
npx prisma generate 
```

3. Start the development servers for both the frontend and backend:

```sh
npm run dev
```

This will concurrently run the frontend on port 8888 and the backend on the default port.

4. Open your browser and navigate to http://localhost:8888 to see the frontend application.

### Running security scan

1. Install semgrep:

```sh
python3 -m pip install semgrep
```

2. Run the security scan:

```sh
semgrep scan --config .github/workflows/semgrep-rules
```
