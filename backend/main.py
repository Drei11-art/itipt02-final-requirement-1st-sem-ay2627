from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import mysql.connector
import random
import os
from typing import Optional
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Folder kung saan ise-save ang mga generated PDF certificates
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PDF_DIR = os.path.join(BASE_DIR, "generated_certificates")
os.makedirs(PDF_DIR, exist_ok=True)


def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="barangay_db"
        )
        return connection
    except mysql.connector.Error as err:
        print(f"Database connection error: {err}")
        return None


class UserRegister(BaseModel):
    username: str
    password: str
    role: str


class UserLogin(BaseModel):
    username: str
    password: str


class ProfileUpdate(BaseModel):
    name: str
    contact: Optional[str] = ""
    address: Optional[str] = ""


class CertificateRequestCreate(BaseModel):
    username: str
    resident_name: str
    purok: Optional[str] = None
    certificate_type: str
    request_date: str
    request_time: str


class StatusUpdate(BaseModel):
    status: str
    archive_reason: Optional[str] = None


class ResidentsUpdate(BaseModel):
    total_residents: str


class AnnouncementModel(BaseModel):
    title: str
    description: str
    date: str


def _ensure_user_profile_columns(cursor):
    cursor.execute("SHOW COLUMNS FROM users LIKE 'full_name'")
    if not cursor.fetchone():
        cursor.execute("ALTER TABLE users ADD COLUMN full_name VARCHAR(255) NULL")

    cursor.execute("SHOW COLUMNS FROM users LIKE 'contact'")
    if not cursor.fetchone():
        cursor.execute("ALTER TABLE users ADD COLUMN contact VARCHAR(100) NULL")

    cursor.execute("SHOW COLUMNS FROM users LIKE 'address'")
    if not cursor.fetchone():
        cursor.execute("ALTER TABLE users ADD COLUMN address VARCHAR(255) NULL")


def generate_certificate_pdf(req_data: dict) -> str:
    clean_code = req_data['request_code'].replace('#', '')
    filename = f"{clean_code}_{req_data['resident_name'].replace(' ', '_')}.pdf"
    filepath = os.path.join(PDF_DIR, filename)

    c = canvas.Canvas(filepath, pagesize=letter)
    width, height = letter

    # Header
    c.setFont("Times-Roman", 12)
    c.drawCentredString(width / 2, height - 70, "Republic of the Philippines")
    c.drawCentredString(width / 2, height - 86, "Province of Nueva Ecija")
    c.drawCentredString(width / 2, height - 102, "Municipality of San Leonardo")
    c.setFont("Times-Bold", 13)
    c.drawCentredString(width / 2, height - 118, "Barangay San Anton")

    # Line Divider
    c.setLineWidth(1.5)
    c.line(70, height - 135, width - 70, height - 135)

    # Office Title
    c.setFont("Times-Bold", 14)
    c.drawCentredString(width / 2, height - 165, "OFFICE OF THE PUNONG BARANGAY")

    # Certificate Type Title
    cert_type = req_data['certificate_type'].upper()
    c.setFont("Times-Bold", 18)
    c.drawCentredString(width / 2, height - 210, cert_type)

    # Salutation
    c.setFont("Times-Roman", 12)
    c.drawString(85, height - 260, "To whom it may concern,")

    # Body Text depende sa Certificate Type at Purok
    res_name = req_data['resident_name'].upper()
    req_date = req_data['request_date']
    purok_val = (req_data.get('purok') or '').strip()
    location_text = f"{purok_val}, Barangay San Anton, San Leonardo, Nueva Ecija" if purok_val else "Barangay San Anton, San Leonardo, Nueva Ecija"

    text_obj = c.beginText(85, height - 300)
    text_obj.setFont("Times-Roman", 12)
    text_obj.setLeading(20)

    if "Indigency" in req_data['certificate_type']:
        text_obj.textLine(f"        This is to certify that {res_name}, of legal age, is a bonafide")
        text_obj.textLine(f"resident of {location_text}.")
        text_obj.textLine("")
        text_obj.textLine("        This is to certify further that the above-named person belongs to the indigent")
        text_obj.textLine("family of this Barangay.")
    elif "Residency" in req_data['certificate_type']:
        text_obj.textLine(f"        This is to certify that {res_name}, of legal age, is a permanent")
        text_obj.textLine(f"and bonafide resident of {location_text}.")
        text_obj.textLine("")
        text_obj.textLine("        This certification is issued to attest to his/her actual residency in this")
        text_obj.textLine("Barangay for all legal intents and purposes.")
    elif "Business" in req_data['certificate_type']:
        text_obj.textLine(f"        This is to certify that {res_name}, a bonafide resident of")
        text_obj.textLine(f"{location_text}, is hereby granted clearance")
        text_obj.textLine("to operate a legitimate business within the jurisdiction of this Barangay,")
        text_obj.textLine("subject to existing ordinances and regulations.")
    else:
        # Default: Barangay Clearance
        text_obj.textLine(f"        This is to certify that {res_name}, of legal age, is a bonafide")
        text_obj.textLine(f"resident of {location_text}.")
        text_obj.textLine("")
        text_obj.textLine("        Based on the records of this office, he/she is of good moral character")
        text_obj.textLine("and has no derogatory record on file as of this date.")

    text_obj.textLine("")
    text_obj.textLine("        This certification is issued upon the request of the above-named person")
    text_obj.textLine("for whatever legal purpose it may serve his/her best and is valid for six (6)")
    text_obj.textLine("months from the date issued.")
    text_obj.textLine("")
    text_obj.textLine(f"        Issued this {req_date} at the Session Hall, Barangay San Anton,")
    text_obj.textLine("San Leonardo, Nueva Ecija.")

    c.drawText(text_obj)

    #  (Barangay Captain )
    c.setFont("Times-Roman", 11)
    c.drawString(330, 210, "Witness:")

    c.setFont("Times-Bold", 12)
    c.drawCentredString(450, 165, "JEFFREI LEE I. ABERGAS")
    c.line(365, 162, 535, 162)
    c.setFont("Times-Roman", 11)
    c.drawCentredString(450, 148, "BARANGAY CAPTAIN")

    # Footer Note
    c.setFont("Times-Italic", 9)
    c.drawString(85, 80, "*not valid without Barangay Official Seal.")
    c.drawRightString(width - 85, 80, f"Control No.: {req_data['request_code']}")

    c.save()
    return filename


@app.post("/register")
def register_user(user: UserRegister):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM users WHERE username = %s", (user.username,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username is already taken.")
        cursor.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, 'resident')", (user.username, user.password))
        conn.commit()
        return {"message": "User registered successfully", "username": user.username, "role": "resident"}
    except HTTPException:
        raise
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()
        conn.close()


@app.post("/login")
def login_user(credentials: UserLogin):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM users WHERE username = %s", (credentials.username,))
        user = cursor.fetchone()
        if not user or user["password"] != credentials.password:
            raise HTTPException(status_code=401, detail="Invalid username or password.")
        return {"message": "Login successful", "username": user["username"], "role": user["role"]}
    except HTTPException:
        raise
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()
        conn.close()


@app.get("/profile/{username}")
def get_user_profile(username: str):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor(dictionary=True)
    try:
        _ensure_user_profile_columns(cursor)
        conn.commit()
        cursor.execute(
            "SELECT username, full_name, contact, address FROM users WHERE username = %s",
            (username,)
        )
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "username": user["username"],
            "name": user.get("full_name") or user["username"],
            "contact": user.get("contact") or "",
            "address": user.get("address") or ""
        }
    except HTTPException:
        raise
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()
        conn.close()


@app.put("/profile/{username}")
def update_user_profile(username: str, profile: ProfileUpdate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor()
    try:
        _ensure_user_profile_columns(cursor)
        cursor.execute(
            "UPDATE users SET full_name = %s, contact = %s, address = %s WHERE username = %s",
            (profile.name, profile.contact, profile.address, username)
        )
        conn.commit()
        return {
            "message": "Profile updated successfully",
            "name": profile.name,
            "contact": profile.contact,
            "address": profile.address
        }
    except HTTPException:
        raise
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()
        conn.close()


@app.post("/requests")
def create_request(req: CertificateRequestCreate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor()
    try:
        req_code = f"#CR-2026-{random.randint(100, 999)}"
        if req.purok:
            query = """
                INSERT INTO certificate_requests
                (request_code, username, resident_name, purok, certificate_type, request_date, request_time, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'Pending')
            """
            cursor.execute(query, (req_code, req.username, req.resident_name, req.purok, req.certificate_type, req.request_date, req.request_time))
        else:
            query = """
                INSERT INTO certificate_requests
                (request_code, username, resident_name, certificate_type, request_date, request_time, status)
                VALUES (%s, %s, %s, %s, %s, %s, 'Pending')
            """
            cursor.execute(query, (req_code, req.username, req.resident_name, req.certificate_type, req.request_date, req.request_time))
        conn.commit()
        return {"message": "Request submitted successfully", "request_code": req_code}
    except HTTPException:
        raise
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()
        conn.close()


@app.get("/requests")
def get_all_requests():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM certificate_requests ORDER BY id DESC")
        return cursor.fetchall()
    except HTTPException:
        raise
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()
        conn.close()


def _process_request_status_update(req_id: int, update: StatusUpdate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor(dictionary=True)
    try:
        if update.status == 'Archived':
            query = "UPDATE certificate_requests SET status = %s, archive_reason = %s WHERE id = %s"
            cursor.execute(query, (update.status, update.archive_reason, req_id))
            conn.commit()
            return {"message": "Request archived"}
        elif update.status == 'Approved':
            # Kunin muna ang details ng request para magawan ng PDF
            cursor.execute("SELECT * FROM certificate_requests WHERE id = %s", (req_id,))
            req_data = cursor.fetchone()
            if not req_data:
                raise HTTPException(status_code=404, detail="Request not found")

            pdf_file = generate_certificate_pdf(req_data)
            query = "UPDATE certificate_requests SET status = %s, pdf_filename = %s WHERE id = %s"
            cursor.execute(query, (update.status, pdf_file, req_id))
            conn.commit()
            return {"message": "Request approved and PDF generated", "pdf_filename": pdf_file}
        else:
            query = "UPDATE certificate_requests SET status = %s WHERE id = %s"
            cursor.execute(query, (update.status, req_id))
            conn.commit()
            return {"message": f"Request updated to {update.status}"}
    except HTTPException:
        raise
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()
        conn.close()


@app.put("/requests/{req_id}")
def update_request_status(req_id: int, update: StatusUpdate):
    return _process_request_status_update(req_id, update)


@app.put("/requests/{req_id}/status")
def update_request_status_with_subpath(req_id: int, update: StatusUpdate):
    return _process_request_status_update(req_id, update)


@app.delete("/requests/history/{req_id}")
def delete_single_history(req_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT pdf_filename FROM certificate_requests WHERE id = %s AND status IN ('Approved', 'Archived')",
            (req_id,)
        )
        record = cursor.fetchone()
        if not record:
            raise HTTPException(status_code=404, detail="History record not found")

        if record.get("pdf_filename"):
            pdf_path = os.path.join(PDF_DIR, record["pdf_filename"])
            if os.path.exists(pdf_path):
                os.remove(pdf_path)

        cursor.execute(
            "DELETE FROM certificate_requests WHERE id = %s AND status IN ('Approved', 'Archived')",
            (req_id,)
        )
        conn.commit()
        return {"message": "History record deleted successfully"}
    except HTTPException:
        raise
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()
        conn.close()


@app.delete("/requests/history")
def clear_all_history():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT pdf_filename FROM certificate_requests WHERE status IN ('Approved', 'Archived')"
        )
        records = cursor.fetchall()
        for rec in records:
            if rec.get("pdf_filename"):
                pdf_path = os.path.join(PDF_DIR, rec["pdf_filename"])
                if os.path.exists(pdf_path):
                    os.remove(pdf_path)

        cursor.execute("DELETE FROM certificate_requests WHERE status IN ('Approved', 'Archived')")
        conn.commit()
        return {"message": "All history records cleared successfully"}
    except HTTPException:
        raise
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()
        conn.close()


@app.get("/download-certificate/{filename}")
def download_certificate(filename: str):
    filepath = os.path.join(PDF_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Certificate PDF not found")
    return FileResponse(filepath, media_type="application/pdf", filename=filename)


@app.get("/settings/residents")
def get_total_residents():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT setting_value FROM system_settings WHERE setting_key = 'total_residents'")
        res = cursor.fetchone()
        return {"total_residents": str(res["setting_value"]) if res else "245"}
    except HTTPException:
        raise
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()
        conn.close()


@app.put("/settings/residents")
def update_total_residents(data: ResidentsUpdate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE system_settings SET setting_value = %s WHERE setting_key = 'total_residents'", (data.total_residents,))
        conn.commit()
        return {"message": "Total residents updated successfully"}
    except HTTPException:
        raise
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()
        conn.close()


@app.get("/announcements")
def get_announcements():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM announcements ORDER BY id DESC")
        return cursor.fetchall()
    except HTTPException:
        raise
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()
        conn.close()


@app.post("/announcements")
def create_announcement(ann: AnnouncementModel):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor()
    try:
        query = "INSERT INTO announcements (title, description, date) VALUES (%s, %s, %s)"
        cursor.execute(query, (ann.title, ann.description, ann.date))
        conn.commit()
        return {"message": "Announcement created successfully"}
    except HTTPException:
        raise
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()
        conn.close()


@app.put("/announcements/{ann_id}")
def update_announcement(ann_id: int, ann: AnnouncementModel):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    cursor = conn.cursor()
    try:
        query = "UPDATE announcements SET title = %s, description = %s, date = %s WHERE id = %s"
        cursor.execute(query, (ann.title, ann.description, ann.date, ann_id))
        conn.commit()
        return {"message": "Announcement updated successfully"}
    except HTTPException:
        raise
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=str(err))
    finally:
        cursor.close()
        conn.close()