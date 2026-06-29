import os
import json
import gspread
import requests
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import pytz
import unicodedata

# 1. เช็คเวลา (ย้ายมาไว้บนสุดเพื่อหยุดการทำงานทันทีถ้าไม่ใช่เวลา)
thai_tz = pytz.timezone('Asia/Bangkok')
now = datetime.now(thai_tz)

if 3 <= now.hour <= 6:
    print("อยู่นอกช่วงเวลาทำงาน - ปิดระบบ")
    exit()

# กรองนาที (รันทุกต้นชั่วโมง หรือ นาทีที่ 31 ในบางชั่วโมง)
is_hourly_run = (now.minute == 1)
is_special_run = (now.minute == 31 and now.hour in [12, 13, 18, 19, 20, 21])

if not (is_hourly_run or is_special_run):
    print(f"ไม่ใช่เวลาที่กำหนด (นาทีที่ {now.minute}) - ปิดระบบ")
    exit()

# 2. ตั้งค่าการเชื่อมต่อ Google Sheets
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
creds_json = json.loads(os.environ['GOOGLE_CREDENTIALS'])
creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_json, scope)
client = gspread.authorize(creds)
sheet = client.open_by_key(os.environ['SHEET_ID'])

sheet_settings = sheet.worksheet("Search_Settings")
sheet_fb = sheet.worksheet("Facebook_Pages")
sheet_data = sheet.worksheet("Master_Data")

# 3. เตรียมข้อมูล
search_settings = sheet_settings.get_all_records()
fb_pages = sheet_fb.get_all_records()
existing_data = [unicodedata.normalize('NFKC', str(x)).lower() for x in sheet_data.col_values(1)]

# 4. ฟังก์ชันส่ง LINE
def send_line(text):
    url = 'https://api.line.me/v2/bot/message/push'
    headers = {'Authorization': f'Bearer {os.environ["LINE_ACCESS_TOKEN"]}', 'Content-Type': 'application/json'}
    data = {"to": os.environ['MY_USER_ID'], "messages": [{"type": "text", "text": text}]}
    requests.post(url, headers=headers, json=data)

# 5. ลูปหลัก
found_any = False
for page in fb_pages:
    page_name = page['Page_Name']
    page_url = page['Page_URL']
    
    # --- ส่วนการดึงข้อมูลจากเพจ (ใส่ Logic Scraper ของคุณตรงนี้) ---
    # ตัวอย่าง: ทำการดึงโพสต์ล่าสุดมาเช็คกับ search_settings
    # ถ้าเจอข้อมูลใหม่ ให้:
    # 1. ตรวจสอบว่ามีใน existing_data หรือยัง
    # 2. ถ้ายัง ให้ append_row และ send_line
    
    print(f"กำลังเช็คเพจ: {page_name}")

# จบการทำงาน
print("บอททำงานรอบล่าสุดเสร็จสิ้น")
