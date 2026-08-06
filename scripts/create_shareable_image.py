#!/usr/bin/env python3
"""
Create a simple NCLEX Priority Cheat Sheet image for social sharing
Stores metadata in Firestore
"""

from PIL import Image, ImageDraw, ImageFont
import os
import sys
from datetime import datetime

# Add venv path for firebase-admin
venv_site = '/root/.openclaw/workspace/obioma-care/venv/lib/python3.12/site-packages'
if venv_site not in sys.path:
    sys.path.insert(0, venv_site)

from firebase_admin import credentials, initialize_app, firestore

# Init Firestore
cred = credentials.Certificate('/root/.openclaw/workspace/obioma-care/firebase-service-account.json')
app = initialize_app(cred, name='shareable-image')
db = firestore.client(app)

os.makedirs('/root/.openclaw/workspace/obioma-care/public/assets/shareable', exist_ok=True)

def create_cheat_sheet():
    width, height = 1080, 1920
    
    bg_color = (10, 22, 40)
    accent_color = (255, 107, 91)
    text_color = (226, 232, 240)
    secondary_color = (148, 163, 184)
    
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 56)
        header_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 42)
        body_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 32)
        small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
    except:
        title_font = ImageFont.load_default()
        header_font = ImageFont.load_default()
        body_font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    y = 60
    
    draw.text((width//2, y), "NCLEX PRIORITY", font=title_font, fill=accent_color, anchor="mm")
    y += 80
    draw.text((width//2, y), "CHEAT SHEET", font=title_font, fill=text_color, anchor="mm")
    y += 100
    
    draw.text((width//2, y), "When everything seems urgent — what do you do FIRST?", 
              font=body_font, fill=secondary_color, anchor="mm")
    y += 80
    
    draw.line([(100, y), (width-100, y)], fill=accent_color, width=3)
    y += 60
    
    draw.text((width//2, y), "THE ABCDE METHOD", font=header_font, fill=accent_color, anchor="mm")
    y += 70
    
    abcde = [
        ("A", "AIRWAY", "Patent? Obstructed? Stridor?"),
        ("B", "BREATHING", "Rate? Depth? O2 sat?"),
        ("C", "CIRCULATION", "Pulse? BP? Bleeding?"),
        ("D", "DISABILITY", "Neuro status? Pain level?"),
        ("E", "EXPOSURE", "Temp? Skin? Wounds?"),
    ]
    
    for letter, word, desc in abcde:
        circle_x = 120
        draw.ellipse([(circle_x-35, y-35), (circle_x+35, y+35)], fill=accent_color)
        draw.text((circle_x, y), letter, font=header_font, fill=bg_color, anchor="mm")
        draw.text((circle_x+80, y-15), word, font=body_font, fill=text_color, anchor="lm")
        draw.text((circle_x+80, y+15), desc, font=small_font, fill=secondary_color, anchor="lm")
        y += 100
    
    y += 40
    
    draw.text((width//2, y), "MASOV'S HIERARCHY = NCLEX PRIORITY", font=header_font, fill=accent_color, anchor="mm")
    y += 70
    
    maslow = [
        ("🏠", "PHYSIOLOGICAL", "Oxygen → Fluids → Nutrition → Elimination"),
        ("🛡️", "SAFETY", "Infection → Falls → Environment → Med errors"),
        ("❤️", "LOVE/BELONGING", "Family → Support → Isolation"),
        ("🌟", "SELF-ESTEEM", "Body image → Role performance → Independence"),
    ]
    
    for emoji, word, desc in maslow:
        draw.text((120, y), emoji, font=header_font, fill=text_color, anchor="lm")
        draw.text((180, y-10), word, font=body_font, fill=text_color, anchor="lm")
        draw.text((180, y+25), desc, font=small_font, fill=secondary_color, anchor="lm")
        y += 90
    
    y += 40
    
    draw.text((width//2, y), "SATA STRATEGY", font=header_font, fill=accent_color, anchor="mm")
    y += 60
    
    sata_tips = [
        "1. Read EACH option independently",
        "2. Ask: Is this statement TRUE?",
        "3. Don't look for patterns",
        "4. If unsure, mark TRUE if factually correct",
    ]
    
    for tip in sata_tips:
        draw.text((120, y), "•", font=body_font, fill=accent_color, anchor="lm")
        draw.text((160, y), tip, font=body_font, fill=text_color, anchor="lm")
        y += 55
    
    y += 60
    
    draw.line([(100, y), (width-100, y)], fill=accent_color, width=3)
    y += 40
    draw.text((width//2, y), "Free complete guide at", font=small_font, fill=secondary_color, anchor="mm")
    y += 45
    draw.text((width//2, y), "OBIOMACARE.COM", font=header_font, fill=accent_color, anchor="mm")
    y += 50
    draw.text((width//2, y), "Save this post 📌 | Share with a classmate", font=small_font, fill=secondary_color, anchor="mm")
    
    output_path = '/root/.openclaw/workspace/obioma-care/public/assets/shareable/nclex-priority-cheat-sheet.png'
    img.save(output_path, quality=95)
    
    # Store metadata in Firestore
    run_id = datetime.now().isoformat().replace(":", "-").replace(".", "-")
    db.collection('generated_images').document(f'cheat_sheet_{run_id}').set({
        'runId': run_id,
        'type': 'priority_cheat_sheet',
        'filename': 'nclex-priority-cheat-sheet.png',
        'path': output_path,
        'dimensions': {'width': width, 'height': height},
        'generatedAt': datetime.now().isoformat(),
        'source': 'create_shareable_image.py'
    })
    db.collection('generated_images').document('latest').set({
        'runId': run_id,
        'type': 'priority_cheat_sheet',
        'filename': 'nclex-priority-cheat-sheet.png',
        'generatedAt': datetime.now().isoformat()
    })
    
    print(f"Created: {output_path}")
    print(f"💾 Metadata stored in Firestore")
    return output_path

if __name__ == "__main__":
    create_cheat_sheet()
