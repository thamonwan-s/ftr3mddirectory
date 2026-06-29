import os
import json
import gspread
import requests
from playwright.sync_api import sync_playwright
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime, timedelta
import pytz
import unicodedata

# 1. เช็คเวลา (ป้องกันการรันนอกช่วงเวลาที่กำหนด)
thai_tz = pytz.timezone('Asia/Bangkok')
now = datetime.now(thai_tz)

if 3 <= now.hour <= 6:
    print("อยู่นอกช่วงเวลาทำงาน - ปิดระบบ")
    exit()

is_hourly_run = (now.minute == 1)
is_special_run = (now.minute == 31 and now.hour in [12, 13, 18, 19, 20, 21])

if not (is_hourly_run or is_special_run):
    print(f"ไม่ใช่เวลาที่กำหนด (นาทีที่ {now.minute}) - ปิดระบบ")
    exit()

# 2. เชื่อมต่อ Google Sheets
creds_json = json.loads(os.environ['GOOGLE_CREDENTIALS'])
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_json, scope)
client = gspread.authorize(creds)
sheet = client.open_by_key(os.environ['SHEET_ID'])

sheet_settings = sheet.worksheet("Search_Settings")
sheet_fb = sheet.worksheet("Facebook_Pages")
sheet_data = sheet.worksheet("Master_Data")

# 3. เตรียมข้อมูล
search_settings = sheet_settings.get_all_records()
fb_pages = sheet_fb.get_all_records()
# นำข้อมูลเก่ามาเทียบ (เฉพาะคอลัมน์ A)
existing_data = [unicodedata.normalize('NFKC', str(x)).lower() for x in sheet_data.col_values(1)]

# 4. ฟังก์ชันส่ง LINE
def send_line(text):
    url = 'https://api.line.me/v2/bot/message/push'
    headers = {'Authorization': f'Bearer {os.environ["LINE_ACCESS_TOKEN"]}', 'Content-Type': 'application/json'}
    data = {"to": os.environ['MY_USER_ID'], "messages": [{"type": "text", "text": text}]}
    requests.post(url, headers=headers, json=data)

# 5. ลูปหลักด้วย Playwright
print("เริ่มดึงข้อมูลเพจ...")
with sync_playwright() as p:
    browser = p.chromium.launch() # headless=True คือทำงานเบื้องหลัง
    page_browser = browser.new_page()
    
    for page in fb_pages:
        page_name = page['Page_Name']
        page_url = page['Page_URL']
        print(f"กำลังเช็ค: {page_name}")
        
        try:
            page_browser.goto(page_url)
            # เพิ่มบรรทัดนี้ไว้หลังบรรทัด page_browser.goto(page_url)
            print(f"หน้าเว็บที่ดึงมาได้มีเนื้อหา: {page_browser.title()}")
            page_browser.wait_for_timeout(3000) # รอให้โหลดเนื้อหา
            # เพิ่มคำสั่งนี้เพื่อเซฟรูปสิ่งที่บอทเห็น
            page_browser.screenshot(path="debug_screenshot.png")
            
            # ดึง div ที่เป็นบทความ (role="article")
            posts = page_browser.query_selector_all('[role="article"]')
            
            for post in posts:
                post_text = post.inner_text()
                norm_text = unicodedata.normalize('NFKC', post_text).lower()
                
                # ตรวจสอบ Keyword จาก Settings
                for setting in search_settings:
                    keyword = setting['Keyword'].lower()
                    if keyword in norm_text and norm_text not in existing_data:
                        # บันทึกลง Sheet
                        sheet_data.append_row([post_text, datetime.now().strftime("%Y-%m-%d %H:%M")])
                        existing_data.append(norm_text)
                        # ส่ง LINE
                        send_line(f"📢 แจ้งเตือนจาก {page_name}:\n{post_text[:100]}...")
                        print(f"พบข้อมูลใหม่: {page_name}")
                        
        except Exception as e:
            print(f"Error scraping {page_name}: {e}")
            
    browser.close()

print("บอททำงานรอบล่าสุดเสร็จสิ้น")
