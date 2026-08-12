import {Composition} from 'remotion';
import {NclexTrap} from './NclexTrap';
import {LandingPromo} from './LandingPromo';

export const RemotionRoot: React.FC = () => {
  const scripts = [
    {
      id: 'trap-001-potassium',
      hook: 'This lab value kills faster than any other — do you check it first?',
      scenario: 'Your patient is on digoxin. Their potassium is 3.2. They report nausea and have PVCs. What\'s your FIRST action?',
      answer: 'Check potassium BEFORE giving digoxin. Hypokalemia increases digoxin toxicity risk.',
      payoff: 'ALWAYS check K+ before digoxin. Potassium is never just a number.',
      cta: 'Follow for tomorrow\'s trap · Free study checklist — obiomacare.com',
    },
    {
      id: 'trap-002-abcs',
      hook: 'The NCLEX gives you 5 urgent tasks. 95% pick the wrong one first.',
      scenario: 'Post-op patient: BP 88/52, RR 28, wound dressing saturated, family demanding pain meds, IV infiltrated. What do you address FIRST?',
      answer: 'Airway and Breathing first — RR 28 indicates respiratory distress. Circulation next. Pain and family are NOT priority over ABCs.',
      payoff: 'The ABC Rule: Airway → Breathing → Circulation. Everything else comes after.',
      cta: 'Follow for tomorrow\'s trap · Free study checklist — obiomacare.com',
    },
    {
      id: 'trap-003-delegation',
      hook: 'The NCLEX doesn\'t ask you to LIST the 5 rights. It gives you a scenario.',
      scenario: 'You have 4 patients. Patient A needs a bed bath. Patient B needs wound dressing change (sterile). Patient C needs VS taken. Patient D needs ambulation. Who do you delegate the bed bath to?',
      answer: 'Delegate bed bath to UAP. Bed bath is within UAP scope. RN keeps assessment, teaching, medication, sterile procedures.',
      payoff: 'Delegation Rule: RN keeps assessment, teaching, meds, sterile. Delegate ADLs and routine tasks to UAP.',
      cta: 'Follow for tomorrow\'s trap · Free study checklist — obiomacare.com',
    },
    {
      id: 'trap-004-sata',
      hook: 'SATA questions terrify nursing students. Here\'s the method that makes them easy.',
      scenario: 'Select all that apply: Heart failure patient with decreased cardiac output. Which interventions are appropriate? (A) Elevate HOB (B) Give digoxin (C) Restrict sodium (D) Vigorous exercise (E) Daily weights',
      answer: 'Treat EACH option as true/false. A=True, B=True, C=True, D=False, E=True. Answer: A, B, C, E.',
      payoff: 'SATA Method: Read each option as standalone true/false. No partial credit — all correct or nothing.',
      cta: 'Follow for tomorrow\'s trap · Free study checklist — obiomacare.com',
    },
    {
      id: 'trap-005-isolation',
      hook: 'Contact? Droplet? Airborne? One trick tells you instantly.',
      scenario: 'Patient has suspected tuberculosis. What PPE do you need BEFORE entering the room?',
      answer: 'N95 respirator + standard precautions. TB is AIRBORNE. Key: airborne=N95, droplet=surgical mask, contact=gown+gloves.',
      payoff: 'Isolation Memory: AIRBORNE=N95 (TB, measles). DROPLET=surgical mask (flu, COVID). CONTACT=gown+gloves (MRSA, C. diff).',
      cta: 'Follow for tomorrow\'s trap · Free study checklist — obiomacare.com',
    },
  ];

  return (
    <>
      {scripts.map((script) => (
        <Composition
          key={script.id}
          id={script.id}
          component={NclexTrap}
          durationInFrames={1350}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={script}
        />
      ))}
      <Composition
        id="promo-landing-v1"
        component={LandingPromo}
        durationInFrames={2250}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
