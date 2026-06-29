import os
import json
import gspread
import requests
from playwright.sync_api import sync_playwright
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import pytz
import unicodedata

# 1. เชื่อมต่อ Google Sheets
creds_json = json.loads(os.environ['GOOGLE_CREDENTIALS'])
creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_json, ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"])
client = gspread.authorize(creds)
sheet = client.open_by_key(os.environ['SHEET_ID'])
sheet_data = sheet.worksheet("Master_Data")
fb_pages = sheet.worksheet("Facebook_Pages").get_all_records()
existing_data = [unicodedata.normalize('NFKC', str(x)).lower() for x in sheet_data.col_values(1)]

# 2. ฟังก์ชันส่ง LINE
def send_line(text):
    url = 'https://api.line.me/v2/bot/message/push'
    headers = {'Authorization': f'Bearer {os.environ["LINE_ACCESS_TOKEN"]}', 'Content-Type': 'application/json'}
    data = {"to": os.environ['MY_USER_ID'], "messages": [{"type": "text", "text": text}]}
    requests.post(url, headers=headers, json=data)

# 3. เริ่มลูปดึงข้อมูล
print("--- เริ่มดึงข้อมูลจริง ---")
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    
    for p_info in fb_pages:
        try:
            print(f"กำลังเช็คเพจ: {p_info['Page_Name']}")
            page.goto(p_info['Page_URL'].replace("www.", "m."), wait_until="networkidle", timeout=60000)
            page.wait_for_timeout(5000)
            
            # ดึง div ที่เก็บเนื้อหา
            posts = page.query_selector_all('div[data-sigil="feed-post-content"]')
            
            for post in posts[:5]:
                text = post.inner_text().strip()
                if not text: continue
                
                norm_text = unicodedata.normalize('NFKC', text).lower()
                if norm_text not in existing_data:
                    sheet_data.append_row([text, datetime.now().strftime("%Y-%m-%d %H:%M")])
                    existing_data.append(norm_text)
                    send_line(f"เจอโพสต์ใหม่จาก {p_info['Page_Name']}:\n{text[:50]}...")
                    print(f"บันทึกแล้ว: {text[:20]}")
        except Exception as e:
            print(f"Error เพจ {p_info['Page_Name']}: {e}")
    browser.close()
print("--- จบการทำงาน ---")
