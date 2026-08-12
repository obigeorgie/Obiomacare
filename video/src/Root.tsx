import {Composition} from 'remotion';
import {NclexTrap} from './NclexTrap';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="trap-001-potassium"
        component={NclexTrap}
        durationInFrames={1350} // 45s at 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          scriptId: 'trap-001-potassium',
          hook: 'This lab value kills faster than any other — do you check it first?',
          scenario: 'Your patient is on digoxin. Their potassium is 3.2. They report nausea and have PVCs. What\'s your FIRST action?',
          answer: 'Check potassium BEFORE giving digoxin. Hypokalemia increases digoxin toxicity risk.',
          payoff: 'ALWAYS check K+ before digoxin. Potassium is never "just a number".',
          cta: 'Follow for tomorrow\'s trap · Free study checklist — obiomacare.com',
        }}
      />
    </>
  );
};
