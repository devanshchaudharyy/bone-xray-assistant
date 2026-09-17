import motor.motor_asyncio

# Use 127.0.0.1 to avoid Windows IPv6 resolution stalls.
MONGO_DETAILS = "mongodb://127.0.0.1:27017"

client = motor.motor_asyncio.AsyncIOMotorClient(
    MONGO_DETAILS,
    serverSelectionTimeoutMS=5000,
)

database = client.radvision_db
user_collection = database.get_collection("users")