import os
import json
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import pytz

# 1. ตั้งค่าการเชื่อมต่อ Google Sheets
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
creds_json = json.loads(os.environ['GOOGLE_CREDENTIALS'])
creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_json, scope)
client = gspread.authorize(creds)
sheet = client.open_by_key(os.environ['SHEET_ID'])

sheet_settings = sheet.worksheet("Sheet1") # หน้าที่เก็บคำค้นหา
sheet_data = sheet.worksheet("Sheet2")     # หน้าที่เก็บข้อมูลที่เจอ

# 2. ฟังก์ชัน Normalize Text
import unicodedata
def normalize_text(text):
    return unicodedata.normalize('NFKC', text).lower()

# 3. ดึงคำค้นหาจาก Sheet1
rows = sheet_settings.get_all_records()
# สมมติหัวตารางคือ: Alias, Standard_Name, Keyword
search_queries = []
for row in rows:
    search_queries.append({
        "query": f"{row['Alias']} {row['Keyword']}",
        "standard": row['Standard_Name']
    })

# 4. ลูปค้นหาข้อมูล (ตัวอย่างการดึงข้อมูล)
new_data_found = []
existing_data = [normalize_text(x) for x in sheet_data.col_values(1)] # สมมติคอลัมน์ A คือชื่อข้อมูล

for item in search_queries:
    # --- ตรงนี้คือจุดที่คุณไปเขียน logic ดึงข้อมูลจากเว็บจริง ---
    # ตัวอย่าง: response = requests.get(f"https://www.google.com/search?q={item['query']}")
    # ถ้าเจอข้อมูลใหม่ และชื่อ standard ของมันยังไม่มีใน existing_data:
    
    found_info = "ข้อมูลที่เจอจากเว็บ" # สมมติว่าได้มา
    normalized_info = normalize_text(found_info)
    
    if normalized_info not in existing_data:
        sheet_data.append_row([found_info, datetime.now().strftime("%Y-%m-%d %H:%M")])
        new_data_found.append(found_info)
        existing_data.append(normalized_info)

# ตั้งค่า Timezone เป็นเวลาไทย
thai_tz = pytz.timezone('Asia/Bangkok')
now = datetime.now(thai_tz)

# --- 1. กรองช่วงเวลาห้ามรัน (03:00 - 06:59) ---
if 3 <= now.hour <= 6:
    print(f"อยู่นอกช่วงเวลาทำงาน ({now.hour}:{now.minute}) - ปิดระบบ")
    exit()

# --- 2. กรองนาทีที่ต้องการรัน ---
# นาทีที่ 1 ของทุกชั่วโมง (ที่ไม่อยู่ในเงื่อนไขห้าม)
# หรือ นาทีที่ 31 เฉพาะชั่วโมงที่กำหนด (12, 13, 18, 19, 20, 21)
is_hourly_run = (now.minute == 1)
is_special_run = (now.minute == 31 and now.hour in [12, 13, 18, 19, 20, 21])

if not (is_hourly_run or is_special_run):
    print(f"ไม่ใช่เวลาที่กำหนด (นาทีที่ {now.minute}) - ปิดระบบ")
    exit()

# ดึงค่าจาก Secrets ที่เราตั้งไว้
token = os.environ.get('LINE_ACCESS_TOKEN')
user_id = os.environ.get('MY_USER_ID')

url = 'https://api.line.me/v2/bot/message/push'
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# ส่วนข้อมูลที่อยากส่ง (คุณสามารถเขียนฟังก์ชันดึงข้อมูลจากเว็บมาใส่ตรงนี้ได้)
data = {
    "to": user_id,
    "messages": [
        {
            "type": "text",
            "text": "ระบบแจ้งเตือน GitHub ทำงานปกติ!"
        }
    ]
}

response = requests.post(url, headers=headers, json=data)
print(f"Status Code: {response.status_code}")
