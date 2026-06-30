import os
import json
import gspread
import requests
from bs4 import BeautifulSoup
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import unicodedata

# 1. เชื่อมต่อ Google Sheets
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

def get_posts_from_mbasic(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36'
    }
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    posts = []
    # ใน mbasic โพสต์มักอยู่ใน div ที่มี data-ft ซึ่งระบุว่าเป็นส่วนของโพสต์
    # คุณอาจต้องลองปรับ tag นี้หากเว็บเพจนั้นใช้โครงสร้างต่างออกไป
    articles = soup.find_all('div', {'data-ft': True})
    for article in articles:
        text = article.get_text().strip()
        if len(text) > 20: # กรองข้อความสั้นๆ ออก
            posts.append(text)
    return posts

print("--- เริ่มดึงข้อมูลผ่าน mbasic ---")

for p_info in fb_pages:
    try:
        # ใช้คอลัมน์เดิมคือ RSS_URL แต่ใส่ลิงก์ mbasic เข้าไปแทน
        mbasic_url = p_info.get('RSS_URL') 
        if not mbasic_url: continue
            
        posts = get_posts_from_mbasic(mbasic_url)
        
        for text in posts:
            norm_text = unicodedata.normalize('NFKC', text).lower()
            if norm_text not in existing_data:
                sheet_data.append_row([text[:200], datetime.now().strftime("%Y-%m-%d %H:%M")])
                existing_data.append(norm_text)
                send_line(f"ใหม่: {text[:40]}...")
                print(f"บันทึกสำเร็จ")
                
    except Exception as e:
        print(f"Error fetching {p_info.get('Page_Name')}: {e}")

print("--- จบการทำงาน ---")
