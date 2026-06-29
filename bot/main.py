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

print("--- เริ่มดึงข้อมูลผ่าน Embed Page ---")
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    
    for p_info in fb_pages:
        try:
            # ใช้ URL รูปแบบ Embed ของ Facebook ที่เปิดเผยข้อมูลสาธารณะ
            # ปรับ URL จากเพจปกติ เป็น URL รูปแบบที่ดึงข้อมูลได้
            embed_url = f"https://www.facebook.com/plugins/page.php?href={p_info['Page_URL']}&tabs=timeline&width=500&height=500"
            page.goto(embed_url, wait_until="networkidle", timeout=60000)
            page.wait_for_timeout(8000)
            
            # ดึงเฉพาะข้อความใน Timeline (Selector นี้แม่นยำสำหรับ Facebook Embed)
            posts = page.query_selector_all('div._1dwg, div.userContent')
            
            for post in posts:
                text = post.inner_text().strip()
                if len(text) > 50 and text not in ["Log into Facebook", "Create new account"]:
                    norm_text = unicodedata.normalize('NFKC', text).lower()
                    
                    if norm_text not in existing_data:
                        sheet_data.append_row([text, datetime.now().strftime("%Y-%m-%d %H:%M")])
                        existing_data.append(norm_text)
                        send_line(f"เจอข้อมูลใหม่: {text[:50]}...")
                        print(f"บันทึกสำเร็จ: {p_info['Page_Name']}")
                        break 
        except Exception as e:
            print(f"Error: {e}")
    browser.close()
print("--- จบการทำงาน ---")
