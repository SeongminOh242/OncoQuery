import os
import sys
import csv
import argparse
import time
import re
from typing import List, Dict, Any, Iterable

try:
    from pymongo import MongoClient, UpdateOne
except ImportError:
    MongoClient = None  # type: ignore

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

DEFAULT_BATCH_SIZE = 1000
# Global toggle set from CLI to restrict integer coercion to 64-bit safe range.
INT64_ONLY = True


def infer_type(value: str) -> Any:
    """Infer a Python type for a scalar TSV field value.

    Enhancements:
    - Safely coerces integers only if they fit in signed 64-bit when INT64_ONLY is True.
    - Falls back to the original string for integers outside range (avoids MongoDB OverflowError).
    - Preserves very long numeric identifiers (e.g., >19 digits) as strings.
    """
    if value == "" or value is None:
        return None
    v = value.strip()

    # Integer detection (no leading + sign; optional leading - sign; digits only)
    if re.fullmatch(r"-?\d+", v):
        # Avoid losing leading zeros in identifiers: if leading zero and length > 1 treat as string
        if (v.startswith("0") and len(v) > 1) or (v.startswith("-0") and len(v) > 2):
            return v
        # Extremely long digit sequences likely identifiers; keep as string
        if len(v) > 19:  # 19 digits exceeds signed 64-bit positive max length (9223372036854775807)
            return v
        try:
            intval = int(v)
            if INT64_ONLY:
                # Signed 64-bit bounds
                if -2**63 <= intval <= 2**63 - 1:
                    return intval
                else:
                    return v
            return intval
        except (ValueError, OverflowError):
            return v

    # Float detection: ensure it contains a decimal point and is a valid float literal
    if "." in v:
        try:
            # Reject cases like just '.' or '-.' which float() would error on
            return float(v)
        except ValueError:
            pass

    return v


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ingest multiple TSV files into a MongoDB collection.")
    parser.add_argument("--dir", required=True, help="Directory containing TSV files")
    parser.add_argument("--db", required=True, help="Target MongoDB database name")
    parser.add_argument("--collection", required=True, help="Target MongoDB collection name")
    parser.add_argument("--mongo-uri", default=os.getenv("MONGO_URI", "mongodb://localhost:27017"), help="MongoDB connection string (env MONGO_URI if set)")
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE, help="Number of documents per bulk insert")
    parser.add_argument("--unique-field", help="Field name to use for upsert de-duplication")
    parser.add_argument("--recursive", action="store_true", help="Recursively search for .tsv files")
    parser.add_argument("--dry-run", action="store_true", help="Parse and report counts only without DB writes")
    parser.add_argument("--strict-header", action="store_true", help="Ensure all TSV files share identical header")
    parser.add_argument("--limit", type=int, help="Optional limit of total rows ingested across all files")
    parser.add_argument("--no-int64-only", action="store_true", help="Disable 64-bit range check; allow arbitrary size Python ints (may overflow MongoDB).")
    return parser.parse_args()


def find_tsv_files(root: str, recursive: bool) -> List[str]:
    files = []
    if recursive:
        for dirpath, _, filenames in os.walk(root):
            for f in filenames:
                if f.lower().endswith(".tsv"):
                    files.append(os.path.join(dirpath, f))
    else:
        for f in os.listdir(root):
            if f.lower().endswith(".tsv"):
                files.append(os.path.join(root, f))
    return sorted(files)


def stream_tsv(path: str) -> Iterable[Dict[str, Any]]:
    with open(path, "r", newline="", encoding="utf-8") as fh:
        reader = csv.reader(fh, delimiter='\t')
        try:
            header = next(reader)
        except StopIteration:
            return
        for row in reader:
            # Pad or trim row to header length
            if len(row) < len(header):
                row.extend([None] * (len(header) - len(row)))
            elif len(row) > len(header):
                row = row[:len(header)]
            doc = {}
            for k, v in zip(header, row):
                doc[k] = infer_type(v)
            yield doc


def main():
    args = parse_args()

    global INT64_ONLY
    INT64_ONLY = not args.no_int64_only

    if MongoClient is None and not args.dry_run:
        print("pymongo not installed. Install dependencies or use --dry-run.")
        sys.exit(1)

    tsv_files = find_tsv_files(args.dir, args.recursive)
    if not tsv_files:
        print(f"No TSV files found in {args.dir}")
        sys.exit(1)

    print(f"Found {len(tsv_files)} TSV file(s).")

    reference_header = None
    total_rows = 0
    start_time = time.time()

    client = None
    collection = None
    if not args.dry_run:
        client = MongoClient(args.mongo_uri)
        db = client[args.db]
        collection = db[args.collection]
        if args.unique_field:
            # Create index to speed up upserts (ignore if exists)
            collection.create_index(args.unique_field, unique=False)

    batch: List[Dict[str, Any]] = []
    operations: List[Any] = []

    for fpath in tsv_files:
        print(f"Processing: {fpath}")
        with open(fpath, 'r', newline='', encoding='utf-8') as fh:
            reader = csv.reader(fh, delimiter='\t')
            try:
                header = next(reader)
            except StopIteration:
                print(f"Skipping empty file: {fpath}")
                continue
            if reference_header is None:
                reference_header = header
            elif args.strict_header and header != reference_header:
                print(f"Header mismatch in {fpath}. Aborting due to --strict-header.")
                sys.exit(1)

            for row in reader:
                if len(row) < len(header):
                    row.extend([None] * (len(header) - len(row)))
                elif len(row) > len(header):
                    row = row[:len(header)]
                doc = {h: infer_type(v) for h, v in zip(header, row)}
                total_rows += 1

                if args.limit and total_rows > args.limit:
                    print(f"Reached row limit {args.limit}; stopping.")
                    break

                if args.dry_run:
                    continue

                if args.unique_field and args.unique_field in doc and doc[args.unique_field] is not None:
                    operations.append(UpdateOne({args.unique_field: doc[args.unique_field]}, {'$set': doc}, upsert=True))
                else:
                    batch.append(doc)

                # Flush batch for inserts
                if batch and len(batch) >= args.batch_size:
                    collection.insert_many(batch)
                    batch.clear()
                # Flush upsert operations in similar sized chunks
                if operations and len(operations) >= args.batch_size:
                    collection.bulk_write(operations, ordered=False)
                    operations.clear()

            if args.limit and total_rows >= args.limit:
                break

    # Final flush
    if not args.dry_run:
        if batch:
            collection.insert_many(batch)
        if operations:
            collection.bulk_write(operations, ordered=False)

    elapsed = time.time() - start_time
    if args.dry_run:
        print(f"Dry run complete. Parsed {total_rows} rows across {len(tsv_files)} file(s) in {elapsed:.2f}s.")
    else:
        print(f"Ingestion complete. Total rows processed: {total_rows} in {elapsed:.2f}s.")
        try:
            if collection is not None:
                coll_count = collection.count_documents({})
                print(f"Collection '{args.db}.{args.collection}' now has {coll_count} document(s).")
                sample_docs = list(collection.find().limit(3))
                if sample_docs:
                    print("Sample docs (first 3):")
                    for d in sample_docs:
                        print(d)
        except Exception as e:
            print(f"(Warning) Could not fetch verification data: {e}")


if __name__ == "__main__":
    main()
