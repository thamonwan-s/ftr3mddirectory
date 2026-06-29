import os
import requests
from datetime import datetime
import pytz

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
