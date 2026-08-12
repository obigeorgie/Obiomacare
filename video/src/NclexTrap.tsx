import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

const COLORS = {
  navy: '#0a1628',
  navyLight: '#162544',
  coral: '#FF6B5B',
  white: '#e2e8f0',
  muted: '#94a3b8',
};

interface TrapProps {
  scriptId: string;
  hook: string;
  scenario: string;
  answer: string;
  payoff: string;
  cta: string;
}

// Scene 1: Hook Card (0-3s = 0-90 frames)
const HookScene: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });
  
  const scale = interpolate(frame, [0, 30], [0.8, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 60,
    }}>
      <div style={{
        opacity,
        transform: `scale(${scale})`,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 80,
          fontWeight: 800,
          color: COLORS.coral,
          marginBottom: 40,
          fontFamily: 'Inter, sans-serif',
        }}>
          🚨 NCLEX TRAP
        </div>
        <div style={{
          fontSize: 56,
          fontWeight: 700,
          color: COLORS.white,
          lineHeight: 1.3,
          fontFamily: 'Inter, sans-serif',
        }}>
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Scenario (3-18s = 90-540 frames)
const ScenarioScene: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{
      background: COLORS.navy,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 80,
    }}>
      <div style={{opacity}}>
        <div style={{
          fontSize: 36,
          color: COLORS.coral,
          fontWeight: 700,
          marginBottom: 30,
          fontFamily: 'Inter, sans-serif',
        }}>
          SCENARIO
        </div>
        <div style={{
          fontSize: 48,
          fontWeight: 600,
          color: COLORS.white,
          lineHeight: 1.4,
          fontFamily: 'Inter, sans-serif',
        }}>
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: Answer (18-35s = 540-1050 frames)
const AnswerScene: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(180deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 80,
    }}>
      <div style={{opacity}}>
        <div style={{
          fontSize: 36,
          color: '#4ade80',
          fontWeight: 700,
          marginBottom: 30,
          fontFamily: 'Inter, sans-serif',
        }}>
          ✅ CORRECT ACTION
        </div>
        <div style={{
          fontSize: 48,
          fontWeight: 600,
          color: COLORS.white,
          lineHeight: 1.4,
          fontFamily: 'Inter, sans-serif',
        }}>
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: Payoff Card (35-42s = 1050-1260 frames)
const PayoffScene: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const scale = interpolate(frame, [0, 20], [0.9, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{
      background: COLORS.navy,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 80,
    }}>
      <div style={{
        opacity,
        transform: `scale(${scale})`,
        background: 'rgba(255, 107, 91, 0.15)',
        border: `3px solid ${COLORS.coral}`,
        borderRadius: 32,
        padding: 60,
        maxWidth: 900,
      }}>
        <div style={{
          fontSize: 36,
          color: COLORS.coral,
          fontWeight: 700,
          marginBottom: 20,
          fontFamily: 'Inter, sans-serif',
        }}>
          💡 REMEMBER THIS
        </div>
        <div style={{
          fontSize: 44,
          fontWeight: 700,
          color: COLORS.white,
          lineHeight: 1.4,
          fontFamily: 'Inter, sans-serif',
        }}>
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 5: CTA (42-45s = 1260-1350 frames)
const CTAScene: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${COLORS.navyLight} 0%, ${COLORS.navy} 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 80,
    }}>
      <div style={{opacity, textAlign: 'center'}}>
        <div style={{
          fontSize: 120,
          marginBottom: 40,
        }}>
          🎯
        </div>
        <div style={{
          fontSize: 48,
          fontWeight: 700,
          color: COLORS.white,
          lineHeight: 1.4,
          fontFamily: 'Inter, sans-serif',
          marginBottom: 40,
        }}>
          {text}
        </div>
        <div style={{
          fontSize: 36,
          color: COLORS.coral,
          fontWeight: 800,
          fontFamily: 'Inter, sans-serif',
        }}>
          obiomacare.com
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Main component
export const NclexTrap: React.FC<TrapProps> = ({
  hook,
  scenario,
  answer,
  payoff,
  cta,
}) => {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={90}>
        <HookScene text={hook} />
      </Sequence>
      <Sequence from={90} durationInFrames={450}>
        <ScenarioScene text={scenario} />
      </Sequence>
      <Sequence from={540} durationInFrames={510}>
        <AnswerScene text={answer} />
      </Sequence>
      <Sequence from={1050} durationInFrames={210}>
        <PayoffScene text={payoff} />
      </Sequence>
      <Sequence from={1260} durationInFrames={90}>
        <CTAScene text={cta} />
      </Sequence>
    </AbsoluteFill>
  );
};
