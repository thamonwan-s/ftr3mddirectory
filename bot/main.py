import os
import json
import gspread
import requests
import feedparser # เพิ่มตัวนี้
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import unicodedata

# 1. เชื่อมต่อ (เหมือนเดิม)
creds_json = json.loads(os.environ['GOOGLE_CREDENTIALS'])
creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_json, ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"])
client = gspread.authorize(creds)
sheet = client.open_by_key(os.environ['SHEET_ID'])
sheet_data = sheet.worksheet("Master_Data")
fb_pages = sheet.worksheet("Facebook_Pages").get_all_records()
existing_data = [unicodedata.normalize('NFKC', str(x)).lower() for x in sheet_data.col_values(1)]

def send_line(text):
    data = {"to": os.environ['MY_USER_ID'], "messages": [{"type": "text", "text": text}]}
    headers = {'Authorization': f'Bearer {os.environ["LINE_ACCESS_TOKEN"]}', 'Content-Type': 'application/json'}
    requests.post('https://api.line.me/v2/bot/message/push', headers=headers, json=data)

print("--- เริ่มดึงข้อมูลผ่าน RSS Feed ---")

for p_info in fb_pages:
    try:
        rss_url = p_info.get('RSS_URL') # ดึงจากคอลัมน์ D (สมมติว่า Header คือ RSS_URL)
        if not rss_url:
            continue
            
        # ดึงข้อมูลผ่าน Feedparser (แทน Playwright)
        feed = feedparser.parse(rss_url)
        
        for entry in feed.entries:
            text = entry.title # หรือ entry.summary ขึ้นอยู่กับว่า Google Alerts ส่งมาอย่างไร
            norm_text = unicodedata.normalize('NFKC', text).lower()
            
            if norm_text not in existing_data:
                sheet_data.append_row([text, datetime.now().strftime("%Y-%m-%d %H:%M")])
                existing_data.append(norm_text)
                send_line(f"เจอข้อมูลใหม่: {text[:50]}...")
                print(f"บันทึกสำเร็จจาก {p_info['Page_Name']}")
                
    except Exception as e:
        print(f"Error fetching {p_info.get('Page_Name')}: {e}")

print("--- จบการทำงาน ---")
