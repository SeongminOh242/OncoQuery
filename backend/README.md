# Backend Scripts Organization

## 📁 Directory Structure

```
backend/
├── index.js                          # Main Express server
├── package.json                      # Dependencies
├── .env                              # Environment configuration
├── PERFORMANCE_OPTIMIZATIONS.md      # Performance documentation
│
├── scripts/
│   ├── index-management/            # Index verification & management
│   │   ├── check_indices.js         # Check localhost indices
│   │   ├── check_index_status.js    # Check index status
│   │   ├── verify_gcp_indices.js    # ✅ Verify GCP indices (USE THIS)
│   │   └── verify_indices.js        # Verify localhost indices
│   │
│   ├── testing/                     # Performance & connection testing
│   │   ├── test_query_performance.js # ✅ Test all endpoints (USE THIS)
│   │   ├── test_connection.js       # Test MongoDB connection
│   │   ├── check_databases.js       # Check database info
│   │   ├── quick_test.js            # Quick test
│   │   ├── quick_test_query.js      # Quick query test
│   │   └── quick_check.js           # Quick check
│   │
│   └── archive/                     # Old/unused scripts
│       ├── create_*.js              # Old index creation scripts
│       ├── mockData.js              # Old mock data
│       ├── *.txt                    # Output logs
│       └── *.log                    # Creation logs
│
├── __tests__/                       # Unit tests
│   └── api.test.js
│
└── node_modules/                    # Dependencies
```

## 🎯 Quick Reference

### Common Tasks

**Verify Indices on GCP:**
```bash
node scripts/index-management/verify_gcp_indices.js
```

**Test Query Performance:**
```bash
node scripts/testing/test_query_performance.js
```

**Start Server:**
```bash
node index.js
```

**Run Tests:**
```bash
npm test
```

## 📝 Notes

- **Indices are auto-created** on first connection in `index.js`
- Old manual index creation scripts moved to `scripts/archive/`
- Server logs moved to `scripts/testing/` for debugging
- All utility scripts organized by purpose
