import os
import json
import gspread
import requests
from playwright.sync_api import sync_playwright
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

print("--- เริ่มดึงข้อมูลแบบครอบจักรวาล ---")
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    
    for p_info in fb_pages:
        try:
            print(f"กำลังเช็คเพจ: {p_info['Page_Name']}")
            page.goto(p_info['Page_URL'].replace("www.", "m."), wait_until="networkidle", timeout=60000)
            page.wait_for_timeout(5000)
            
            # ดึงทุกๆ div ที่มี class หรือ role ต่างๆ ออกมา
            # เราจะหาข้อความที่ยาวพอจะเป็นโพสต์ (เกิน 50 ตัวอักษร)
            all_text_elements = page.query_selector_all('div')
            found_count = 0
            
            for el in all_text_elements:
                text = el.inner_text().strip()
                if len(text) > 100: # ถ้าข้อความยาวเกิน 100 ตัวอักษร (น่าจะเป็นโพสต์)
                    norm_text = unicodedata.normalize('NFKC', text).lower()
                    
                    if norm_text not in existing_data:
                        sheet_data.append_row([text[:200], datetime.now().strftime("%Y-%m-%d %H:%M")])
                        existing_data.append(norm_text)
                        send_line(f"เจอข้อมูลจาก {p_info['Page_Name']}:\n{text[:50]}...")
                        print(f"บันทึกแล้ว: {p_info['Page_Name']}")
                        found_count += 1
                        if found_count >= 1: break # เอาแค่โพสต์เดียวต่อเพจ เพื่อเทสต์
                        
        except Exception as e:
            print(f"Error เพจ {p_info['Page_Name']}: {e}")
    browser.close()
print("--- จบการทำงาน ---")
