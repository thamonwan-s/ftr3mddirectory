import os
import json
import gspread
import requests
from playwright.sync_api import sync_playwright
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import pytz
import unicodedata

# 1. เช็คเวลา (คงเดิม)
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
sheet_fb = sheet.worksheet("Facebook_Pages")
sheet_data = sheet.worksheet("Master_Data")

# โหลดข้อมูล Facebook Pages และข้อมูลเก่าใน Sheet
fb_pages = sheet_fb.get_all_records()
existing_data = [unicodedata.normalize('NFKC', str(x)).lower() for x in sheet_data.col_values(1)]

# 3. ลูปหลักด้วย Playwright (เวอร์ชัน Mobile)
print("เริ่มดึงข้อมูล 5 โพสต์ล่าสุด...")
with sync_playwright() as p:
    # ใช้ User Agent ของ iPhone เพื่อลดการบล็อก
    browser = p.chromium.launch()
    context = browser.new_context(
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
    )
    page_browser = context.new_page()
    
    for page in fb_pages:
        page_name = page['Page_Name']
        # เปลี่ยน URL ให้เป็นเวอร์ชันมือถือ
        page_url = page['Page_URL'].replace("www.facebook.com", "m.facebook.com")
        
        try:
            print(f"กำลังเช็ค: {page_name}")
            page_browser.goto(page_url, wait_until="networkidle", timeout=60000)
            page_browser.wait_for_timeout(5000)
            
            # ดึง div ที่เก็บเนื้อหาโพสต์ของเวอร์ชันมือถือ
            elements = page_browser.query_selector_all('div[data-sigil="feed-post-content"]')
            
            # เอาแค่ 5 โพสต์แรกที่เจอ
            count = 0
            for el in elements:
                if count >= 5: break
                
                text = el.inner_text().strip()
                if not text: continue
                
                norm_text = unicodedata.normalize('NFKC', text).lower()
                
                # เช็คว่ามีในชีทหรือยัง ถ้ายังให้เพิ่ม
                if norm_text not in existing_data:
                    sheet_data.append_row([text, datetime.now().strftime("%Y-%m-%d %H:%M")])
                    existing_data.append(norm_text)
                    print(f"บันทึกโพสต์ใหม่ของ {page_name}")
                    count += 1
                        
        except Exception as e:
            print(f"Error scraping {page_name}: {e}")
            
    browser.close()
print("บอททำงานเสร็จสิ้น")

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
