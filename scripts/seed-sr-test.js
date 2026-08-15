/**
 * Seed SR cards for testing
 * Run: node scripts/seed-sr-test.js
 */

async function seedTestCards() {
  const email = 'test@obiomacare.com';

  // Login first to get a session
  console.log('Requesting magic link...');
  const sendRes = await fetch('https://obiomacare.com/api/auth/send-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const sendData = await sendRes.json();
  console.log('Send link:', sendData);

  if (!sendData._token) {
    console.log('No dev token returned (Resend configured). Check your email or use the verify endpoint manually.');
    return;
  }

  // Verify to get session cookie
  console.log('Verifying token...');
  const verifyRes = await fetch(`https://obiomacare.com/api/auth/verify?token=${sendData._token}`, {
    redirect: 'manual',
  });
  console.log('Verify status:', verifyRes.status);

  // Add test cards
  const testCards = [
    {
      front: 'What is the normal range for serum potassium (K+)?',
      back: '3.5 – 5.0 mEq/L. Hypokalemia < 3.5 causes muscle weakness, arrhythmias. Hyperkalemia > 5.0 causes peaked T waves, cardiac arrest.',
      category: 'lab-values',
    },
    {
      front: 'A patient with heart failure has crackles bilaterally and SpO2 89%. What is the FIRST priority intervention?',
      back: 'Elevate head of bed and apply supplemental oxygen. Crackles + low SpO2 = pulmonary edema/fluid overload. Positioning improves ventilation.',
      category: 'medical-surgical',
    },
    {
      front: 'What are the five rights of medication administration?',
      back: 'Right patient, right drug, right dose, right route, right time. (Extended: right documentation, right reason, right response, right to refuse.)',
      category: 'fundamentals',
    },
    {
      front: 'A patient receiving heparin has an aPTT of 90 seconds (therapeutic range 60-80). What is the nurse\'s priority action?',
      back: 'Hold the next dose and notify the provider. aPTT > 80 = supratherapeutic, bleeding risk. May need protamine sulfate (antidote).',
      category: 'pharmacology',
    },
    {
      front: 'What is the APGAR score at 1 minute for a newborn with: heart rate 110, slow irregular respiratory effort, grimace with suctioning, active motion, blue extremities?',
      back: 'APGAR = 7. Appearance (blue extremities) = 1, Pulse (110) = 2, Grimace = 1, Activity = 2, Respiration (slow/irregular) = 1.',
      category: 'maternity',
    },
  ];

  console.log('Adding test cards...');
  for (const card of testCards) {
    const res = await fetch('https://obiomacare.com/api/sr/add-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(card),
    });
    const data = await res.json();
    console.log('Added:', data.success ? '✅' : '❌', card.front.substring(0, 40) + '...');
  }

  console.log('\nDone! Visit https://obiomacare.com/spaced-repetition.html to review.');
}

seedTestCards().catch(console.error);
