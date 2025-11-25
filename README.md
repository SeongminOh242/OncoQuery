# OncoQuery

Amazon review analytics dashboard focused on detecting suspicious (bot/fake) reviews, showing trending products, and comparing verified vs non‑verified purchase ratings. Current implementation uses a React + Vite + Tailwind frontend and an Express backend serving mock JSON data. A database layer will replace mocks as the project evolves.

## Tech Stack
Frontend: React 19, Vite, Tailwind CSS, Recharts (charts), Lucide React (icons)
Backend: Node.js (Express 4), CORS, dotenv
Build/Dev: ES Modules, nodemon (dev backend)

## Directory Structure (Key Parts)
```
OncoQuery/
	frontend/
		src/
			App.jsx                Root layout & tab navigation
			pages/                 Page components (Overview, Bot Detection, Trending Products, Verified Analysis)
			components/            Reusable UI (StatCard, constants.js)
			assets/mockData.js     Local mock datasets (to be removed after API integration)
		tailwind.config.js       Tailwind config
		vite.config.js           Vite build config
	backend/
		index.js                 Express server + mock API routes
		mockData.js              Backend source of mock datasets
		package.json             Backend service dependencies
	react-front-end/           Legacy scaffold (to retire)
	README.md                  Project overview (this file)
```

## Backend Mock API Endpoints
| Method | Endpoint                | Returns                |
| ------ | ----------------------- | ---------------------- |
| GET    | `/api/bot-data`         | Category bot % list    |
| GET    | `/api/trending-products`| Trending products      |
| GET    | `/api/verified-analysis`| Verified vs non‑verified stats |

## Setup & Run
### Frontend
```cmd
cd frontend
npm install
npm run dev
```
Dev server defaults to `http://localhost:5173` (Vite standard) unless configured otherwise.

### Backend
```cmd
cd backend
npm install
npm run dev
```
Runs on `http://localhost:5000` (or `PORT` from `.env`).

### Backend API Testing
To run backend API tests (using `__tests__/api.test.js`):

1. Ensure your `.env` file in `backend/` contains the following variables:
	```
	MONGO_URI=mongodb://localhost:27017
	MONGO_DB_NAME=oncoquery
	```
	(Adjust values for your MongoDB setup as needed.)

2. Run tests from the `backend` directory:
	```cmd
	set NODE_ENV=test && npm test
	```
	This will:
	- Use your `.env` for MongoDB connection
	- Run all Vitest tests in `__tests__` (including `api.test.js`)
	- Print API responses to the terminal for inspection

If you want to always set `NODE_ENV=test` for tests, update the `test` script in `backend/package.json` to:
```
"test": "set NODE_ENV=test && vitest run"
```

Test output will show counts and sample data for each API route.

### Connecting Frontend to API (Next Step)
Replace direct mock imports with fetches (e.g., in page components):
```javascript
useEffect(() => {
	fetch('http://localhost:5000/api/bot-data')
		.then(r => r.json())
		.then(setBotData);
}, []);
```

## Development Conventions
- Keep UI colors in `components/constants.js` (not mixed with data).
- Mock data lives in backend until real data sources are wired.
- Use tab state in `App.jsx` for simple navigation (consider React Router later).
- Avoid coupling chart components directly to raw fetch; normalize data via a small adapter if data shape changes.

## Current TODO (Focused)
1. Connect frontend to backend API (remove direct mock imports in React pages and make it receive from backend).
2. Create local MongoDB database and collections for reviews/products/verification.
3. Host MongoDB remotely on GCP (e.g., Atlas alternative or VM deployment) for persistence.
4. Implement backend query endpoints against MongoDB for each dashboard case (bot stats, trending, verified analysis).
5. Deployment (Docker + simple hosting) can follow after tasks 1–4.

## Environment Variables (Planned)
`PORT` – backend port override
`MONGO_URI` – MongoDB connection string (required for backend tests)
`MONGO_DB_NAME` – MongoDB database name (required for backend tests)

## Future Enhancements
- Real-time updates via WebSockets for live trending movement.
- Anomaly detection service (worker) updating bot flags asynchronously.
- Export reports (CSV/PDF) for category summaries.

## License
Internal / Not yet licensed. Add a license file before public release.

---
For questions or next implementation steps, see Roadmap item 1.