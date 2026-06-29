import os
import json
import gspread
from playwright.sync_api import sync_playwright
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import pytz

print("--- เริ่มต้นการทำงานบอท ---")

# 1. เช็คเวลา (เพิ่ม Print เพื่อดูว่าตอนนี้บอทอ่านเวลาว่าอะไร)
thai_tz = pytz.timezone('Asia/Bangkok')
now = datetime.now(thai_tz)
print(f"เวลาปัจจุบัน: {now.strftime('%H:%M')}")

# 2. เชื่อมต่อ Google Sheets
try:
    creds_dict = json.loads(os.environ['GOOGLE_CREDENTIALS'])
    creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"])
    client = gspread.authorize(creds)
    sheet = client.open_by_key(os.environ['SHEET_ID'])
    print("เชื่อมต่อ Google Sheets สำเร็จ")
except Exception as e:
    print(f"ERROR เชื่อมต่อ Sheet: {e}")
    exit()

# 3. ลองรัน Playwright (แบบเบาที่สุด)
try:
    with sync_playwright() as p:
        print("กำลังเปิด Browser...")
        browser = p.chromium.launch()
        page = browser.new_page()
        print("ไปที่ Facebook...")
        page.goto("https://m.facebook.com/", timeout=30000)
        print(f"หน้าเว็บที่โหลดมาได้คือ: {page.title()}")
        browser.close()
except Exception as e:
    print(f"ERROR Playwright: {e}")

print("--- จบการทำงาน ---")
