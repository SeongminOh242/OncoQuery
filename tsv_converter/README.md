# TSV to MongoDB Ingestion

This workspace contains a Python script to ingest multiple TSV files with a shared (or compatible) header into a single MongoDB collection.

## Files
- `ingest_tsv_to_mongo.py` – Main ingestion script.
- `requirements.txt` – Python dependencies (`pymongo`, `python-dotenv`).
- `data/sample.tsv` – Example TSV file for testing.

## Installation
Ensure you have Python 3.9+ and a running local MongoDB (default connection string: `mongodb://localhost:27017`).

Install dependencies:
```
python -m pip install -r requirements.txt
```

(Optionally create a virtual environment first.)

## Usage
Basic ingestion of all TSV files in a directory:
```
python ingest_tsv_to_mongo.py --dir data --db mydb --collection mycollection
```

### Arguments
| Flag | Required | Description |
|------|----------|-------------|
| `--dir` | Yes | Directory containing `.tsv` files. |
| `--db` | Yes | Target MongoDB database name. |
| `--collection` | Yes | Target MongoDB collection name. |
| `--mongo-uri` | No | Connection string (default `MONGO_URI` env or `mongodb://localhost:27017`). |
| `--batch-size` | No | Insert/upsert batch size (default 1000). |
| `--unique-field` | No | Field to upsert on (de-duplicate rows). |
| `--recursive` | No | Recurse into subdirectories for `.tsv` files. |
| `--dry-run` | No | Parse and report counts only; no DB writes. |
| `--strict-header` | No | Force identical header across all files; abort on mismatch. |
| `--limit` | No | Stop after ingesting this many rows total. |
| `--big-int-mode` | No | Handling for integers exceeding 64-bit: `decimal` (Decimal128), `string`, `truncate` (clamp), `ignore` (leave; may overflow). Default `decimal`. |
| `--big-int-threshold` | No | Absolute value threshold to classify an int as "big"; default is 2^63-1. |

### Examples
Dry run to preview rows:
```
python ingest_tsv_to_mongo.py --dir data --db mydb --collection mycollection --dry-run
```

Upsert using a unique ID field:
```
python ingest_tsv_to_mongo.py --dir data --db mydb --collection mycollection --unique-field id
```

Recursive search through nested folders:
```
python ingest_tsv_to_mongo.py --dir data --db mydb --collection mycollection --recursive
```

Limit processed rows (useful for sampling):
```
python ingest_tsv_to_mongo.py --dir data --db mydb --collection mycollection --limit 500
```

### De-duplication
If `--unique-field` is provided, each row with that field performs an upsert (`UpdateOne` with `$set`). Rows missing the field are inserted normally (no de-dup guarantee).

### Type Inference
The script attempts to cast values to `int` or `float` when possible; otherwise values remain strings. Empty fields become `null` (`None` in Python).

#### Big Integers
MongoDB's native integer type supports signed 64-bit range (−2^63 to 2^63−1). If a parsed integer exceeds this range (or a custom threshold), it is handled according to `--big-int-mode`:

- `decimal` (default): stored as `Decimal128` preserving full precision.
- `string`: stored as a string (safe for very large IDs, but not numeric operations).
- `truncate`: clamped to 64-bit bounds (potential data loss; provides numeric compatibility).
- `ignore`: leaves the Python int (PyMongo will raise `OverflowError` if out of range).

Customize the detection threshold with `--big-int-threshold` (default equals 2^63−1). Statistics about conversions are printed after ingestion.

## Environment Variables
Create a `.env` file (optional):
```
MONGO_URI=mongodb://localhost:27017
```
`python-dotenv` will load this automatically.

## Sample Data
A sample TSV is included at `data/sample.tsv`. Use it with `--dry-run` to validate parsing before hitting MongoDB.

## Troubleshooting
- Install MongoDB locally if connection fails: <https://www.mongodb.com/try/download/community>
- Check that the service is running (`mongod`).
- Use `--dry-run` to isolate parsing issues from DB connectivity problems.
- Use `--strict-header` to catch inconsistent column orders.
- OverflowError: If you see `MongoDB can only handle up to 8-byte ints`, rerun with `--big-int-mode decimal` (default) or another mode to coerce large integers.

## Extending
Potential enhancements:
- Date parsing (e.g., ISO 8601 detection).
- Automatic index creation for multiple fields.
- Compression support (`.tsv.gz`).
- Parallel file processing.

## License
No license specified. Treat as internal tooling unless otherwise noted.
