#!/usr/bin/env python3
"""
Create a shareable NCLEX Lab Values infographic
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
app = initialize_app(cred, name='lab-values-image')
db = firestore.client(app)

os.makedirs('/root/.openclaw/workspace/obioma-care/public/assets/shareable', exist_ok=True)

def create_lab_values_image():
    width, height = 1080, 1920
    
    bg_color = (10, 22, 40)
    accent_color = (255, 107, 91)
    text_color = (226, 232, 240)
    secondary_color = (148, 163, 184)
    warning_color = (239, 68, 68)
    
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 52)
        header_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 38)
        body_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
        small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
    except:
        title_font = ImageFont.load_default()
        header_font = ImageFont.load_default()
        body_font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    y = 50
    
    draw.text((width//2, y), "NCLEX LAB VALUES", font=title_font, fill=accent_color, anchor="mm")
    y += 70
    draw.text((width//2, y), "Every Value You MUST Memorize", font=body_font, fill=secondary_color, anchor="mm")
    y += 60
    
    draw.line([(80, y), (width-80, y)], fill=accent_color, width=2)
    y += 40
    
    labs = [
        ("SODIUM", "136-145", "<120", ">160", "mEq/L"),
        ("POTASSIUM", "3.5-5.0", "<2.5", ">6.5", "mEq/L"),
        ("GLUCOSE (fasting)", "70-100", "<50", ">400", "mg/dL"),
        ("BUN", "7-20", "—", ">100", "mg/dL"),
        ("CREATININE", "0.6-1.2", "—", ">4.0", "mg/dL"),
        ("HEMOGLOBIN", "12-18", "<7", ">20", "g/dL"),
        ("HEMATOCRIT", "36-54", "<21", ">65", "%"),
        ("WBC", "4,500-11,000", "<1,000", ">30,000", "mm³"),
        ("PLATELETS", "150,000-400,000", "<50,000", ">1M", "mm³"),
        ("pH (ABG)", "7.35-7.45", "<7.25", ">7.55", ""),
        ("PaCO₂", "35-45", "<20", ">60", "mmHg"),
        ("PaO₂", "80-100", "<60", "—", "mmHg"),
        ("HCO₃", "22-26", "<18", ">30", "mEq/L"),
        ("O₂ SAT", "95-100", "<90", "—", "%"),
    ]
    
    for name, normal, crit_low, crit_high, unit in labs:
        draw.rounded_rectangle([(60, y-5), (width-60, y+55)], radius=8, fill=(15, 29, 50))
        draw.text((80, y+25), name, font=body_font, fill=text_color, anchor="lm")
        normal_text = f"Normal: {normal} {unit}".strip()
        draw.text((400, y+25), normal_text, font=small_font, fill=secondary_color, anchor="lm")
        if crit_low != "—" or crit_high != "—":
            crit_text = f"⚠️ {crit_low} / {crit_high}".replace("— / ", "").replace(" / —", "")
            draw.text((750, y+25), crit_text, font=small_font, fill=warning_color, anchor="lm")
        y += 70
    
    y += 30
    
    draw.text((width//2, y), "MEMORY TIPS", font=header_font, fill=accent_color, anchor="mm")
    y += 60
    
    tips = [
        "• Na⁺ & K⁺ are ELECTROLYTES → cardiac & neuro effects",
        "• BUN/Creatinine = KIDNEY function",
        "• pH < 7.35 = ACIDOSIS, > 7.45 = ALKALOSIS",
        "• PaCO₂ is the RESPIRATORY component",
        "• HCO₃ is the METABOLIC component",
        "• Platelets < 50K = bleeding risk → priority",
    ]
    
    for tip in tips:
        draw.text((80, y), tip, font=small_font, fill=secondary_color, anchor="lm")
        y += 40
    
    y += 40
    
    draw.line([(80, y), (width-80, y)], fill=accent_color, width=2)
    y += 30
    draw.text((width//2, y), "Full printable version at", font=small_font, fill=secondary_color, anchor="mm")
    y += 40
    draw.text((width//2, y), "OBIOMACARE.COM", font=header_font, fill=accent_color, anchor="mm")
    y += 40
    draw.text((width//2, y), "Save this post 📌 | Tag a classmate", font=small_font, fill=secondary_color, anchor="mm")
    
    output_path = '/root/.openclaw/workspace/obioma-care/public/assets/shareable/nclex-lab-values-infographic.png'
    img.save(output_path, quality=95)
    
    # Store metadata in Firestore
    run_id = datetime.now().isoformat().replace(":", "-").replace(".", "-")
    db.collection('generated_images').document(f'lab_values_{run_id}').set({
        'runId': run_id,
        'type': 'lab_values_infographic',
        'filename': 'nclex-lab-values-infographic.png',
        'path': output_path,
        'dimensions': {'width': width, 'height': height},
        'generatedAt': datetime.now().isoformat(),
        'source': 'create_lab_values_image.py'
    })
    db.collection('generated_images').document('latest').set({
        'runId': run_id,
        'type': 'lab_values_infographic',
        'filename': 'nclex-lab-values-infographic.png',
        'generatedAt': datetime.now().isoformat()
    })
    
    print(f"Created: {output_path}")
    print(f"💾 Metadata stored in Firestore")
    return output_path

if __name__ == "__main__":
    create_lab_values_image()
