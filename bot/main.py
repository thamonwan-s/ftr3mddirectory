import os
import json
import gspread
import requests
from playwright.sync_api import sync_playwright
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import pytz
import unicodedata

# 1. ฟังก์ชันส่ง LINE (ต้องไว้บนสุด)
def send_line(text):
    try:
        url = 'https://api.line.me/v2/bot/message/push'
        headers = {'Authorization': f'Bearer {os.environ["LINE_ACCESS_TOKEN"]}', 'Content-Type': 'application/json'}
        data = {"to": os.environ['MY_USER_ID'], "messages": [{"type": "text", "text": text}]}
        resp = requests.post(url, headers=headers, json=data)
        print(f"LINE Response: {resp.status_code}") # เช็คใน Log: ถ้าเป็น 200 คือส่งผ่าน
    except Exception as e:
        print(f"Error sending LINE: {e}")

# 2. เชื่อมต่อ Google Sheets
creds_json = json.loads(os.environ['GOOGLE_CREDENTIALS'])
creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_json, ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"])
client = gspread.authorize(creds)
sheet = client.open_by_key(os.environ['SHEET_ID'])
sheet_data = sheet.worksheet("Master_Data")
existing_data = [unicodedata.normalize('NFKC', str(x)).lower() for x in sheet_data.col_values(1)]

# 3. ลูปหลัก
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    
    # ตัวอย่าง: ดึงข้อมูลเพจที่ 1 (ลองรันแค่เพจเดียวเพื่อทดสอบก่อน)
    fb_pages = sheet.worksheet("Facebook_Pages").get_all_records()
    
    for p_info in fb_pages:
        try:
            page.goto(p_info['Page_URL'].replace("www.", "m."), wait_until="networkidle")
            page.wait_for_timeout(5000)
            
            # ดึงโพสต์ทั้งหมด
            posts = page.query_selector_all('div[data-sigil="feed-post-content"]')
            
            for post in posts[:3]: # เอาแค่ 3 อันแรกมาลองก่อน
                text = post.inner_text().strip()
                if not text: continue
                
                # ถ้าอยากให้มันแจ้งเตือนทุกอย่างที่เจอโดยไม่สนคีย์เวิร์ด ให้แก้บรรทัดข้างล่างนี้เป็น if True:
                if text.lower() not in existing_data:
                    sheet_data.append_row([text, datetime.now().strftime("%Y-%m-%d %H:%M")])
                    existing_data.append(text.lower())
                    send_line(f"เจอโพสต์ใหม่: {text[:30]}...")
                    print(f"ส่งไลน์แล้ว: {text[:30]}")
        except Exception as e:
            print(f"Error: {e}")
    browser.close()
