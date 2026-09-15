# Baithak Cafe

Full-stack cafe ordering app with a customer menu, admin dashboard, Express API, and MongoDB persistence.

## Project structure

- `frontend/`: customer page, admin page, browser scripts, and styles
- `backend/`: Express server, MongoDB models, API routes, and backend environment template

## Run locally

1. Install Node.js 18+.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Set `MONGODB_URI` to a MongoDB Atlas connection string.
5. Set `ADMIN_API_KEY` to a long private value.
6. Run `npm start`.
7. Open `http://localhost:3000` and `http://localhost:3000/admin.html`.

When `MONGODB_URI` is missing or unavailable, the browser keeps a local fallback for development. Production deployments should always set MongoDB variables.

## Deploy on Render

Create a Web Service from this repository. Render can use `render.yaml`, or set:

- Build command: `npm install`
- Start command: `npm start`
- `MONGODB_URI`: MongoDB Atlas connection string
- `ADMIN_API_KEY`: private admin key
- `CLIENT_ORIGIN`: deployed app URL
- `ADMIN_PASSWORD`: private password used by the admin login page
- `ADMIN_SESSION_SECRET`: long random secret used to sign the HttpOnly admin session cookie

## Deploy on Vercel

Import the project into Vercel. `vercel.json` routes requests through the Express function in `api/index.js`. Configure `MONGODB_URI`, `ADMIN_API_KEY`, and `CLIENT_ORIGIN` in Vercel environment variables.

The server protects `/admin.html` and all `/api/admin/*` routes. Unauthenticated visitors are redirected to `/admin-login.html`. The browser never stores the admin password; successful login creates an HttpOnly, SameSite session cookie.

## API

- `GET /api/health`
- `GET /api/catalog`
- `POST /api/orders`
- `GET /api/orders` with `x-admin-key`
- `PATCH /api/orders/:id/status` with `x-admin-key`
- Admin category, menu, reorder, and store settings routes under `/api/admin/*`
