import os
import json
import gspread
import requests
from playwright.sync_api import sync_playwright
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import pytz
import unicodedata

# 1. เช็คเวลา
thai_tz = pytz.timezone('Asia/Bangkok')
now = datetime.now(thai_tz)
if 3 <= now.hour <= 6: exit()
if not ((now.minute == 1) or (now.minute == 31 and now.hour in [12, 13, 18, 19, 20, 21])): exit()

# 2. เชื่อมต่อ Google Sheets
creds_json = json.loads(os.environ['GOOGLE_CREDENTIALS'])
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_json, scope)
client = gspread.authorize(creds)
sheet = client.open_by_key(os.environ['SHEET_ID'])
sheet_settings = sheet.worksheet("Search_Settings")
sheet_fb = sheet.worksheet("Facebook_Pages")
sheet_data = sheet.worksheet("Master_Data")

search_settings = sheet_settings.get_all_records()
fb_pages = sheet_fb.get_all_records()
existing_data = [unicodedata.normalize('NFKC', str(x)).lower() for x in sheet_data.col_values(1)]

def send_line(text):
    url = 'https://api.line.me/v2/bot/message/push'
    headers = {'Authorization': f'Bearer {os.environ["LINE_ACCESS_TOKEN"]}', 'Content-Type': 'application/json'}
    data = {"to": os.environ['MY_USER_ID'], "messages": [{"type": "text", "text": text}]}
    requests.post(url, headers=headers, json=data)

# 3. ลูปหลัก
print("เริ่มทำงาน...")
with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1")
    page_browser = context.new_page()
    
    for page in fb_pages:
        try:
            url = page['Page_URL'].replace("www.facebook.com", "m.facebook.com")
            page_browser.goto(url, wait_until="networkidle", timeout=60000)
            page_browser.wait_for_timeout(5000)
            
            # ดึง 5 โพสต์ล่าสุด
            elements = page_browser.query_selector_all('div[data-sigil="feed-post-content"]')
            
            for el in elements[:5]:
                text = el.inner_text().strip()
                if not text: continue
                
                norm_text = unicodedata.normalize('NFKC', text).lower()
                
                # เช็ค Keyword
                for setting in search_settings:
                    if setting['Keyword'].lower() in norm_text and norm_text not in existing_data:
                        sheet_data.append_row([text, datetime.now().strftime("%Y-%m-%d %H:%M")])
                        existing_data.append(norm_text)
                        send_line(f"📢 พบข้อมูล: {text[:50]}...")
                        print(f"บันทึกข้อมูล: {text[:20]}")
                        
        except Exception as e:
            print(f"Error: {e}")
    browser.close()
