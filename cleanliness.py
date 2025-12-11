from pymongo import MongoClient

MONGO_URI = "mongodb://34.69.196.89:27017/oncoquery"
DB_NAME = "amazon"
COLLECTION_NAME = "YOUR_COLLECTION"

client = MongoClient(MONGO_URI)
coll = client[DB_NAME][COLLECTION_NAME]

print("\n=== TOTAL DOCUMENTS ===")
print(coll.estimated_document_count())

print("\n=== NULL / MISSING FIELD COUNTS ===")
missing_counts = coll.aggregate([
    {"$group": {
        "_id": None,
        **{f"{field}_missing": {
            "$sum": {
                "$cond": [{"$or": [
                    {"$eq": [f"${field}", None]},
                    {"$eq": [f"${field}", ""]},
                ]}, 1, 0]
            }
        } for field in [
            "marketplace", "customer_id", "review_id", "product_id",
            "product_parent", "product_title", "product_category",
            "star_rating", "helpful_votes", "total_votes", "vine",
            "verified_purchase", "review_headline", "review_body",
            "review_date"
        ]}
    }},
])

for doc in missing_counts:
    for k, v in doc.items():
        if k != "_id":
            print(f"{k}: {v}")

print("\n=== DUPLICATE review_id COUNT ===")
dup_pipeline = [
    {"$group": {"_id": "$review_id", "count": {"$sum": 1}}},
    {"$match": {"count": {"$gt": 1}}},
    {"$count": "duplicates"}
]
dups = list(coll.aggregate(dup_pipeline))
print(dups[0]["duplicates"] if dups else 0)

print("\n=== INVALID DATE COUNT ===")
invalid_dates = coll.count_documents({
    "$expr": {"$eq": [{"$toDate": "$review_date"}, None]}
})
print("Invalid dates:", invalid_dates)

print("\n=== NON-NUMERIC VALUES IN NUMERIC FIELDS ===")
for field in ["star_rating", "helpful_votes", "total_votes"]:
    count = coll.count_documents({
        field: {"$not": {"$regex": "^[0-9]+$"}}
    })
    print(f"{field}: {count}")

print("\n=== LOGICAL CHECK: helpful_votes > total_votes ===")
invalid_votes = coll.count_documents({
    "$expr": {"$gt": [
        {"$toInt": "$helpful_votes"},
        {"$toInt": "$total_votes"}
    ]}
})
print("Rows where helpful > total:", invalid_votes)

print("\n=== CLEANLINESS CHECK COMPLETE ===")
