from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import mysql.connector

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db_connection() -> Optional[mysql.connector.MySQLConnection]:
    try:
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="barangay_db",
        )
        return connection
    except mysql.connector.Error as err:
        print(f"Database connection error: {err}")
        return None


class UserRegister(BaseModel):
    username: str
    password: str
    role: str = "resident"


class UserLogin(BaseModel):
    username: str
    password: str


@app.post("/register")
def register_user(user: UserRegister) -> dict[str, str]:
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM users WHERE username = %s", (user.username,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username is already taken.")

        cursor.execute(
            "INSERT INTO users (username, password, role) VALUES (%s, %s, 'resident')",
            (user.username, user.password),
        )
        conn.commit()
        return {
            "message": "User registered successfully",
            "username": user.username,
            "role": "resident",
        }
    except HTTPException:
        raise
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()
        conn.close()


@app.post("/login")
def login_user(credentials: UserLogin) -> dict[str, str]:
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM users WHERE username = %s", (credentials.username,))
        user = cursor.fetchone()
        if not user or user["password"] != credentials.password:
            raise HTTPException(status_code=401, detail="Invalid username or password.")

        return {
            "message": "Login successful",
            "username": user["username"],
            "role": user["role"],
        }
    except HTTPException:
        raise
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()
        conn.close()