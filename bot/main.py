import os
import json
import gspread
import requests
from bs4 import BeautifulSoup # เพิ่มสิ่งนี้
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import unicodedata

# (ส่วนการเชื่อมต่อ Google Sheets เหมือนเดิม)
# ...

def get_mbasic_posts(url):
    # mbasic จำเป็นต้องมี User-Agent เหมือนคนใช้มือถือ
    headers = {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36'
    }
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    posts = []
    # ใน mbasic โพสต์มักอยู่ใน tag ที่มี class คล้ายๆ กัน (ต้องลอง inspect ดูใน Chrome อีกที)
    # ส่วนใหญ่อยู่ใน div ที่เป็นบทความ
    articles = soup.find_all('div', {'data-ft': True}) 
    
    for article in articles:
        text = article.get_text()
        if text:
            posts.append(text)
    return posts

print("--- เริ่มดึงข้อมูลผ่าน mbasic ---")

for p_info in fb_pages:
    try:
        page_url = p_info.get('PAGE_URL') # เปลี่ยนจาก RSS_URL เป็น URL หน้าเพจ mbasic
        if not page_url: continue
            
        posts = get_mbasic_posts(page_url)
        
        for text in posts:
            norm_text = unicodedata.normalize('NFKC', text).lower()
            
            if norm_text not in existing_data:
                sheet_data.append_row([text[:200], datetime.now().strftime("%Y-%m-%d %H:%M")])
                existing_data.append(norm_text)
                send_line(f"เจอข้อมูลใหม่: {text[:50]}...")
                print(f"บันทึกสำเร็จ")
                
    except Exception as e:
        print(f"Error: {e}")

print("--- จบการทำงาน ---")
