#!/usr/bin/env python3
"""
Obioma Nursing Content Engine — Generates NCLEX/clinical judgment content
"""
import json
from datetime import datetime, timedelta

CONTENT_BANK = {
    "x_threads": [
        {
            "day": 0,
            "time": "09:00",
            "content": """🧵 Every nursing student who's ever failed the NCLEX needs to read this.

1/ The new NCLEX doesn't test what you memorized.

It tests whether you can THINK like a nurse.

2/ Old NCLEX: "What is the normal potassium range?"
NGN NCLEX: "Your post-op patient has K+ 5.8, BP 88/52, and says they feel 'weird.' What's your FIRST action?"

3/ The answer isn't in your notes.
It's in your clinical judgment.

Recognize cues → Analyze → Prioritize → Act → Evaluate

4/ I built the Clinical Judgment Mastery System after 15 years in the ER.

Not theory. Real scenarios. Real decision trees. Real frameworks.

$47. Pass the NGN on your first attempt.

https://obiomacare.com"""
        },
        {
            "day": 3,
            "time": "09:00",
            "content": """🧵 "I studied for 6 months and still failed the NCLEX."

I hear this too often. Here's why:

1/ You're memorizing content.
The NGN tests clinical reasoning.

2/ Example: A patient has chest pain, troponin elevated, and stable vitals.

Wrong answer: "Call the doctor immediately."
Right answer: "Continue monitoring, prepare for ECG, document."

Why? Because stable vitals + elevated troponin = monitor, not panic.

3/ That's clinical judgment. And it's NOT taught in most review courses.

4/ My framework: Recognize → Analyze → Prioritize → Act → Evaluate

5/ 30+ practice scenarios. Video walkthroughs. Decision trees.

Built by a nurse who's been in your shoes.

https://obiomacare.com"""
        },
        {
            "day": 7,
            "time": "09:00",
            "content": """🧵 The #1 mistake I see on the clinical floor (and the NCLEX):

Treating every abnormal lab as equally urgent.

1/ K+ 3.2 in a stable patient?
→ Replace. Monitor. Not emergent.

2/ K+ 3.2 in a patient on digoxin with PVCs?
→ PRIORITY. Risk of lethal arrhythmia.

3/ Same number. Completely different action.

The difference? CONTEXT.

4/ The NCLEX NGN tests exactly this.
Can you read the whole picture? Or just the number?

5/ My Clinical Judgment Framework trains this.
30+ scenarios. Real decision trees. $47.

https://obiomacare.com"""
        },
        {
            "day": 10,
            "time": "09:00",
            "content": """🧵 3 AM. I'm the only ER nurse with 6 patients.

Charge yells: "Room 4 is crashing!"

At the same time:
• Room 2: Chest pain, troponin elevated
• Room 5: Post-op appy, fever 102.3
• Room 8: COPD, O2 sat 88% on 2L

Who do I see FIRST?

Room 4. "Crashing" = airway/breathing/circulation failing NOW.

After stabilizing Room 4, who NEXT?

NOT Room 2 (stable chest pain).
NOT Room 5 (fever is concerning but not crashing).

Delegate Room 8's O2 to the tech.
Reassess Room 5 from the doorway.
THEN see Room 2.

That's clinical judgment. That's the NGN. That's what I teach.

https://obiomacare.com"""
        }
    ],
    "x_posts": [
        {"day": 1, "time": "14:00", "content": "The NCLEX Next Gen doesn't care how many flashcards you memorized.\n\nIt cares if you can recognize a deteriorating patient and act in the right order.\n\nThat's clinical judgment. That's what we teach.\n\nhttps://obiomacare.com"},
        {"day": 2, "time": "11:00", "content": "80% of NCLEX failures aren't from lack of knowledge.\n\nThey're from lack of clinical reasoning.\n\nYou know the lab values. But do you know what to DO with them?\n\nhttps://obiomacare.com"},
        {"day": 4, "time": "16:00", "content": '"I finally understand prioritization" — the #1 thing new grads tell me after using the Clinical Judgment Framework.\n\nNot more content. Better thinking.\n\nhttps://obiomacare.com'},
        {"day": 5, "time": "10:00", "content": "UWorld gives you questions and explanations.\n\nWe give you the THINKING process behind the answer.\n\nUse BOTH. Questions for practice. Framework for reasoning.\n\nhttps://obiomacare.com"},
        {"day": 6, "time": "13:00", "content": "Your first year as a nurse will test you more than the NCLEX.\n\nThe nurses who thrive? They learned clinical judgment BEFORE they started.\n\nhttps://obiomacare.com"},
        {"day": 8, "time": "15:00", "content": "ABCDE isn't just for the NCLEX.\n\nIt's how experienced nurses think in every emergency.\n\nAirway → Breathing → Circulation → Disability → Exposure\n\nTrain it until it's automatic.\n\nhttps://obiomacare.com"},
        {"day": 9, "time": "12:00", "content": "The difference between a good nurse and a great nurse?\n\nThe great nurse asks 'What could go wrong next?' BEFORE it happens.\n\nThat's clinical judgment. That's what the NGN tests.\n\nhttps://obiomacare.com"},
        {"day": 11, "time": "11:00", "content": "Stop studying harder. Start thinking differently.\n\nThe NCLEX Next Gen rewards nurses who can reason, not recall.\n\n$47. 30+ scenarios. Video walkthroughs.\n\nhttps://obiomacare.com"},
        {"day": 12, "time": "14:00", "content": "I made $47/hour as a new grad RN in Florida.\n\nThe Clinical Judgment Mastery System costs $47.\n\nOne hour of your future salary. To pass the NCLEX on your first try.\n\nhttps://obiomacare.com"},
        {"day": 13, "time": "10:00", "content": "Free NCLEX Clinical Judgment Checklist → https://obiomacare.com/free-nclex-checklist.html\n\n5 steps to approach any NGN scenario. Print it. Use it. Pass."}
    ],
    "instagram_posts": [
        {"day": 1, "time": "12:00", "content": "The new NCLEX tests THINKING, not memorizing. 🧠\n\nOld: 'What is normal potassium?'\nNew: 'Your patient has K+ 5.8 and says they feel weird. What's your FIRST action?'\n\nThe answer? Context. Clinical judgment. Experience.\n\nThat's exactly what I teach in the Clinical Judgment Mastery System.\n\nLink in bio. $47.\n\n#nclex #nclexnextgen #nursingstudent #clinicaljudgment #ngn #nursingschool #rn #futurenurse"},
        {"day": 3, "time": "18:00", "content": "3 patients. 1 nurse. Who do you see FIRST? 🏥\n\nRoom 1: Post-op appy, fever 102.3\nRoom 2: Chest pain, troponin elevated, vitals stable\nRoom 3: COPD, O2 sat 88% on 2L\n\nThe answer isn't in your notes. It's in your clinical judgment.\n\nLearn the framework → Link in bio\n\n#nclex #nursingstudent #clinicaljudgment #prioritization #nursingschool #rnlife"},
        {"day": 5, "time": "15:00", "content": "I failed my first practice NCLEX.\n\nNot because I didn't know enough.\nBecause I didn't know HOW to think through scenarios.\n\n15 years later, I built the framework I wish I had.\n\n30+ real scenarios. Video walkthroughs. Decision trees.\n\n$47. Pass on your first attempt.\n\nLink in bio 💙\n\n#nclex #nclexprep #nursingstudent #clinicaljudgment #nurse #rn #nursingschool"},
        {"day": 7, "time": "11:00", "content": "The ABCDE method isn't just for exams.\n\nIt's how experienced nurses think in EVERY emergency.\n\nA - Airway\nB - Breathing\nC - Circulation\nD - Disability\nE - Exposure\n\nTrain it until it's automatic.\n\nFree checklist + full framework → Link in bio\n\n#nclex #nursingstudent #abcde #emergencynursing #clinicaljudgment #rn"},
        {"day": 9, "time": "19:00", "content": '"I studied for 6 months and still failed."\n\nSound familiar?\n\nYou don\'t need more content.\nYou need better clinical reasoning.\n\nThe Clinical Judgment Mastery System teaches you HOW to think — not just WHAT to know.\n\nLink in bio. $47.\n\n#nclex #nursingstudent #clinicaljudgment #nclexprep #nurse #rn #nursingschool'},
        {"day": 11, "time": "14:00", "content": "Same lab. Different patient. Different action. 🧪\n\nK+ 3.2 in stable patient → Replace, monitor\nK+ 3.2 on digoxin with PVCs → PRIORITY\n\nContext changes everything.\n\nThat's what the NGN tests. That's what I teach.\n\nLink in bio →\n\n#nclex #nursingstudent #labvalues #clinicaljudgment #nurse #rn #nursingschool"},
        {"day": 13, "time": "12:00", "content": "Free NCLEX Clinical Judgment Checklist ✓\n\n5 steps to approach any NGN scenario:\n1️⃣ Recognize Cues\n2️⃣ Analyze Cues\n3️⃣ Prioritize Hypotheses\n4️⃣ Generate Solutions\n5️⃣ Take Action → Evaluate\n\nPrint it. Use it. Pass.\n\nLink in bio 💙\n\n#nclex #nclexnextgen #nursingstudent #freebie #nclexprep #rn"}
    ],
    "tiktok_scripts": [
        {"day": 2, "time": "10:00", "content": "POV: You're in your first code and the attending asks 'What's your role?'\n\nIf you freeze, you need the Clinical Judgment Framework.\n\n15 years of ER experience distilled into 30+ scenarios.\n\nLink in bio. $47."},
        {"day": 4, "time": "16:00", "content": "The NCLEX Next Gen in 60 seconds:\n\nOld NCLEX: Memorize → Recall → Pass\nNew NCLEX: Recognize → Analyze → Prioritize → Act → Evaluate\n\nOne tests knowledge.\nThe other tests whether you can THINK like a nurse.\n\nWhich one are you preparing for?\n\nLink in bio →"},
        {"day": 6, "time": "20:00", "content": "3 AM. 6 patients. Who do you see FIRST?\n\nThis is the exact scenario the NGN tests.\n\nAnd it's the exact scenario I walk through in the Complete System.\n\n$67. Video walkthroughs included.\n\nLink in bio."},
        {"day": 8, "time": "14:00", "content": "I failed my first practice NCLEX because I memorized everything...\n\nBut I didn't learn how to THINK.\n\nThe Clinical Judgment Mastery System fixes that.\n\n30+ scenarios. Real decision trees. $47.\n\nLink in bio 💙"},
        {"day": 10, "time": "11:00", "content": "Stop buying more NCLEX review books.\n\nYou don't need more CONTENT.\nYou need a framework for CLINICAL REASONING.\n\nThat's exactly what I built.\n\nLink in bio. $47."}
    ]
}

def generate_schedule(start_date=None):
    if start_date is None:
        start_date = datetime.now().date()
    
    schedule = []
    
    for content_type, posts in CONTENT_BANK.items():
        for post in posts:
            post_date = start_date + timedelta(days=post["day"])
            schedule.append({
                "platform": content_type,
                "date": post_date.isoformat(),
                "time": post["time"],
                "content": post["content"]
            })
    
    return sorted(schedule, key=lambda x: (x["date"], x["time"]))

if __name__ == "__main__":
    schedule = generate_schedule()
    with open("/root/.openclaw/workspace/obioma-care/content-nursing/social-schedule.json", "w") as f:
        json.dump(schedule, f, indent=2)
    print(f"Generated {len(schedule)} posts")
    for post in schedule[:5]:
        print(f"{post['date']} {post['time']} | {post['platform']}")
