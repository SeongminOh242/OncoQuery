# OncoQuery: Amazon Review Analytics Dashboard

A full-stack analytics dashboard for Amazon reviews, focused on detecting suspicious (bot/fake) reviews, trending products, and verified vs non-verified purchase analysis. Built with React (Vite + Tailwind) frontend, Node.js/Express backend, and MongoDB for data storage.

---

## 🚀 Quick Start (Local Setup)

### 1. Clone the Repository
```bash
# Clone and enter the project directory
 git clone <your-repo-url>
 cd OncoQuery
```

### 2. Set Up the Backend
```bash
cd backend
cp .env.example .env   # Or create .env manually (see below)
npm install
npm run dev            # or: node index.js
```
- Ensure MongoDB is running locally (default: mongodb://localhost:27017)
- Example .env:
  ```
  MONGO_URI=mongodb://localhost:27017
  MONGO_DB_NAME=oncoquery
  PORT=5000
  ```

### 3. Set Up the Frontend
```bash
cd ../frontend
npm install
npm run dev
```
- Open http://localhost:5173 in your browser

### 4. (Optional) Ingest Data from TSV Files
```bash
cd ../tsv_converter
python -m pip install -r requirements.txt
python ingest_tsv_to_mongo.py --dir data --db oncoquery --collection reviews
```
- See tsv_converter/README.md for advanced options (batch size, upsert, dry-run, etc.)

---

## 🗂️ Project Structure
```
OncoQuery/
├── backend/         # Express API server, MongoDB queries, scripts
├── frontend/        # React + Vite + Tailwind dashboard
├── tsv_converter/   # Python scripts for TSV → MongoDB ingestion
├── IMPLEMENTATION_GUIDE.md
├── QUICK_START.md
├── README.md        # (this file)
```

---

## 🛠️ Features
- Category, year, month, week filtering (dynamic dropdowns)
- Pagination for all analytics tabs
- Bot/fake review detection & user stats
- Trending products by time window
- Verified vs non-verified purchase analysis
- Helpful & controversial reviews
- Overview dashboard with database-wide stats
- Responsive, modern UI (Tailwind)
- Robust error handling & loading states

---

## 🔌 API Endpoints (Key)
| Method | Endpoint                | Description                       |
|--------|------------------------|-----------------------------------|
| GET    | /api/categories        | List all product categories       |
| GET    | /api/bot-data          | Suspicious reviews (paginated)    |
| GET    | /api/bot-stats         | Bot user statistics               |
| GET    | /api/trending-products | Trending products (paginated)     |
| GET    | /api/verified-analysis | Verified purchase reviews         |
| GET    | /api/verified-stats    | Verified stats summary            |
| GET    | /api/helpful-reviews   | Most helpful reviews              |
| GET    | /api/controversial-reviews | Most controversial reviews   |
| GET    | /api/overview-meta     | Database-wide metadata            |

---

## 🧑‍💻 Development & Testing
- All API config in `frontend/src/services/api.js`
- Backend tests: `cd backend && npm test` (see backend/README.md)
- Frontend: Hot reload with Vite (`npm run dev`)
- Backend: Auto-reload with nodemon (`npm run dev`)
- Performance tips: see backend/PERFORMANCE_OPTIMIZATIONS.md

---

## 🐍 Data Ingestion (TSV → MongoDB)
- Use `tsv_converter/ingest_tsv_to_mongo.py` to load review data from TSV files
- Supports batch insert, upsert, dry-run, recursive folder scan, and big integer handling
- See `tsv_converter/README.md` for full usage and troubleshooting

---

## 📝 Additional Resources
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md): Feature breakdown, architecture, and backend requirements
- [QUICK_START.md](QUICK_START.md): Step-by-step run instructions
- [backend/README.md](backend/README.md): Backend scripts and utilities
- [tsv_converter/README.md](tsv_converter/README.md): Data ingestion details
- [backend/PERFORMANCE_OPTIMIZATIONS.md](backend/PERFORMANCE_OPTIMIZATIONS.md): Query and server tuning

---

## ❓ Troubleshooting
- MongoDB connection errors: Ensure MongoDB is running and URI is correct in `.env`
- CORS issues: Both servers must run on localhost (or configure CORS in backend)
- Data not showing: Check backend logs for errors, ensure data is ingested
- For more, see the troubleshooting sections in each component's README

---

## 📣 Contributing
Pull requests and issues are welcome! Please see CONTRIBUTING.md if available.
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