#!/usr/bin/env python3
"""
Obioma Nursing Email Nurture Sequence
Triggered by: Free checklist download or lead capture
Goal: Convert to Complete System ($67)
Duration: 7 emails over 14 days
"""

EMAILS = [
    {
        "day": 0,
        "subject": "Your NCLEX Checklist + the #1 mistake I see",
        "body": """Hey there,

Your NCLEX Clinical Judgment Checklist is attached. Print it. Use it for every practice question.

But before you dive in, let me tell you something important:

The #1 reason students fail the NGN NCLEX isn't lack of knowledge.

It's lack of clinical reasoning.

You can memorize every lab value, every drug suffix, every vital sign range.

But the NGN doesn't ask: "What is normal potassium?"

It asks: "Your post-op patient has K+ 5.8, BP 88/52, and says they feel 'weird.' What's your FIRST action?"

The answer isn't in your notes.
It's in your ability to recognize cues, analyze context, and prioritize under pressure.

That's clinical judgment. And it's NOT taught in most review courses.

I built the Clinical Judgment Mastery System after 15 years in the ER — not from theory, but from real scenarios, real mistakes, and real lessons.

30+ practice scenarios. Video walkthroughs. Decision trees.

$47. Less than one shift as a new grad RN.

→ https://obiomacare.com

Reply to this email if you have questions. I read every one.

— Nnamdi, RN
Obioma Care

P.S. Tomorrow I'll send you a real ER scenario and walk through my thinking. Watch for it."""
    },
    {
        "day": 2,
        "subject": "3 AM. 6 patients. Who do you see FIRST?",
        "body": """Hey,

3 AM. I'm the only ER nurse with 6 patients.

The charge nurse yells: "Room 4 is crashing!"

At the same time:
• Room 2: Chest pain, troponin elevated, vitals stable
• Room 5: Post-op appendectomy, fever 102.3°F
• Room 8: COPD exacerbation, O2 sat 88% on 2L

Who do I see first?

Room 4. "Crashing" means airway/breathing/circulation are failing RIGHT NOW.

But here's what textbooks don't teach you:

After I stabilize Room 4, I DON'T go to Room 2 next.

I delegate Room 8's O2 titration to the tech.
I reassess Room 5 from the doorway.
THEN I see Room 2.

Why? Because stable chest pain with elevated troponin is concerning — but not crashing. Post-op fever needs assessment — but not immediate intervention. COPD with low O2 sats needs titration — which a tech can do while I see the chest pain patient.

That's clinical judgment.

That's what the NGN tests.

That's what I teach in the Complete System.

30+ scenarios like this. With my full thinking process explained.

→ https://obiomacare.com

— Nnamdi

P.S. Tomorrow: The ABCDE method and when NOT to use it."""
    },
    {
        "day": 4,
        "subject": "Same lab. Different patient. Different action.",
        "body": """Hey,

I want to share the most important concept for the NGN:

Context changes everything.

K+ 3.2 in a stable patient?
→ Replace orally. Monitor. Not emergent.

K+ 3.2 in a patient on digoxin with frequent PVCs?
→ PRIORITY. Risk of lethal arrhythmia. IV replacement. Continuous monitoring.

Same number. Completely different action.

The NGN tests whether you can read the WHOLE picture — not just the lab value.

Most review courses teach you normal ranges.
I teach you what to DO with abnormal ones.

The Clinical Judgment Mastery System includes:
• 30+ scenarios with contextual decision-making
• Prioritization frameworks (ABCDE, Maslow, Safety First)
• Video walkthroughs of real cases
• SBAR templates for effective communication

$47. Pass the NCLEX on your first attempt.

→ https://obiomacare.com

— Nnamdi

P.S. If you've been using UWorld or Kaplan — keep using them. They're great for question practice. My framework is the thinking layer that goes UNDER the questions."""
    },
    {
        "day": 7,
        "subject": "I don't have testimonials yet. But I have this...",
        "body": """Hey,

This is a new product. I don't have a hundred testimonials yet.

But I can tell you what I've seen mentoring new grads for 15 years:

The nurses who struggle in their first year aren't the ones who didn't memorize enough.

They're the ones who can't THINK through a scenario when the answer isn't in a textbook.

The Clinical Judgment Mastery System changes that.

Here's what's inside:
✓ NGN Clinical Judgment Framework (Recognize → Analyze → Prioritize → Act → Evaluate)
✓ 30+ practice scenarios with detailed walkthroughs
✓ 5 video explanations of real ER and oncology cases
✓ Prioritization decision trees
✓ SBAR templates that get results
✓ First-year survival guide
✓ Clinical day planner

$47. 30-day guarantee.

If it doesn't help you think through scenarios more clearly, I'll refund every penny.

→ https://obiomacare.com

— Nnamdi, RN

P.S. Tomorrow: "I already bought UWorld. Why do I need this?" — I'll answer that."""
    },
    {
        "day": 10,
        "subject": "\"I already bought an NCLEX review course\"",
        "body": """Hey,

If you already bought UWorld, Kaplan, or Archer — good. Those are excellent for question practice.

But here's what they don't do:

They don't teach you the THINKING process.

They give you questions and explanations. That's like giving someone fish instead of teaching them to fish.

The Clinical Judgment Mastery System is the thinking layer.

It shows you HOW an experienced nurse approaches a scenario — not just what the right answer is.

Use BOTH:
• Practice questions on UWorld/Kaplan
• Learn the thinking framework here

One gives you reps. The other gives you reasoning.

Together, they pass the NCLEX.

→ https://obiomacare.com

— Nnamdi

P.S. Two days left on the $47 launch price. Then it goes to $67."""
    },
    {
        "day": 12,
        "subject": "Price goes up Friday — last call at $47",
        "body": """Hey,

Quick note: The launch price of $47 ends Friday.

After that, the Complete System goes to $67.

If you've been thinking about it, now's the time.

→ https://obiomacare.com

30-day guarantee. No risk.

— Nnamdi"""
    },
    {
        "day": 14,
        "subject": "Last call: Clinical Judgment Mastery System",
        "body": """Hey,

This is the last email in this sequence.

If the Complete System isn't for you right now, no worries. Keep the free checklist — it's yours.

But if you're struggling with:
• NGN scenario questions
• Prioritization decisions
• Feeling like you memorized everything but can't think through cases

This was built for you. From real experience. Not a textbook.

→ https://obiomacare.com

Either way, good luck on the NCLEX and your first year. You've got this.

— Nnamdi, RN
Obioma Care

P.S. If you ever want to chat nursing, just reply. I read every email."""
    }
]

if __name__ == "__main__":
    import json
    with open("/root/.openclaw/workspace/obioma-care/content-nursing/email-sequence.json", "w") as f:
        json.dump(EMAILS, f, indent=2)
    print(f"Generated {len(EMAILS)} emails")
    for e in EMAILS:
        print(f"Day {e['day']}: {e['subject']}")
