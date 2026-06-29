import os
import requests

# ดึงค่าจาก Secrets ที่เราตั้งไว้
token = os.environ.get('LINE_ACCESS_TOKEN')
user_id = os.environ.get('MY_USER_ID')

url = 'https://api.line.me/v2/bot/message/push'
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# ส่วนข้อมูลที่อยากส่ง (คุณสามารถเขียนฟังก์ชันดึงข้อมูลจากเว็บมาใส่ตรงนี้ได้)
data = {
    "to": user_id,
    "messages": [
        {
            "type": "text",
            "text": "ระบบแจ้งเตือน GitHub ทำงานปกติ!"
        }
    ]
}

response = requests.post(url, headers=headers, json=data)
print(f"Status Code: {response.status_code}")
