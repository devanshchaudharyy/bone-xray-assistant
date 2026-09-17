import os
import uuid
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import bcrypt

from ai_agent import XRayAnalysisAgent, MEDICAL_DISCLAIMER
from database import user_collection

app = FastAPI(title="RadVision AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = XRayAnalysisAgent(model_name="llava")

# Data Models
class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    user_message: str
    chat_history: List[ChatMessage] = []
    image_analysis: Optional[Dict[str, Any]] = None

# Native Bcrypt Hashing Helpers
def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

# Authentication Endpoints
@app.post("/api/auth/register")
async def register(user: UserRegister):
    print(f"--> Registration attempt for: {user.email}")
    existing_user = await user_collection.find_one({"email": user.email})
    if existing_user:
        print("Registration failed: Email exists")
        raise HTTPException(
            status_code=400, 
            detail="This email is already registered. Switch to 'Sign In' to log in."
        )

    user_dict = {
        "full_name": user.full_name,
        "email": user.email,
        "password": hash_password(user.password)
    }
    await user_collection.insert_one(user_dict)
    print("--> Registration successful!")
    return {"message": "User registered successfully"}

@app.post("/api/auth/login")
async def login(credentials: UserLogin):
    print(f"--> Login attempt for: {credentials.email}")
    try:
        user = await user_collection.find_one({"email": credentials.email})
        if not user:
            print("Login failed: User not found in MongoDB")
            raise HTTPException(
                status_code=401, 
                detail="Email not found. Please click 'Register here' to create an account."
            )
        
        is_valid = verify_password(credentials.password, user["password"])
        if not is_valid:
            print("Login failed: Password mismatch")
            raise HTTPException(
                status_code=401, 
                detail="Incorrect password. Please check your credentials."
            )

        print("--> Login successful!")
        return {
            "message": "Login successful",
            "user": {"full_name": user.get("full_name", "User"), "email": user["email"]}
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Database error during login: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

# Core Service Endpoints
@app.get("/api/health")
def health_check():
    return {"status": "online", "ollama_active": agent._is_ollama_available()}

@app.post("/api/analyze")
async def analyze_xray(file: UploadFile = File(...)):
    saved_path = os.path.join("uploads", f"{uuid.uuid4().hex}{os.path.splitext(file.filename)[1]}")
    with open(saved_path, "wb") as buffer:
        buffer.write(await file.read())
    return agent.analyze_xray(saved_path)

@app.post("/api/chat")
async def chat_followup(request: ChatRequest):
    reply = agent.chat_followup(
        user_message=request.user_message,
        chat_history=[msg.dict() for msg in request.chat_history],
        image_analysis=request.image_analysis
    )
    return {"reply": reply}