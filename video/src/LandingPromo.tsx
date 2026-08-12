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
  green: '#22c55e',
};

// Scene 1: Hook (0-8s = 0-240 frames)
const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const scale = spring({ fps, frame, from: 0.8, to: 1, durationInFrames: 30 });
  
  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 60,
    }}>
      <div style={{ opacity, transform: `scale(${scale})`, textAlign: 'center' }}>
        <div style={{
          fontSize: 72,
          fontWeight: 900,
          color: COLORS.white,
          lineHeight: 1.2,
          marginBottom: 40,
          fontFamily: 'Inter, sans-serif',
          maxWidth: 900,
        }}>
          You've memorized 3,000 facts.
        </div>
        <div style={{
          fontSize: 72,
          fontWeight: 900,
          color: COLORS.coral,
          lineHeight: 1.2,
          fontFamily: 'Inter, sans-serif',
        }}>
          The NCLEX doesn't care.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Problem (8-20s = 240-600 frames)
const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  
  return (
    <AbsoluteFill style={{
      background: COLORS.navy,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 80,
    }}>
      <div style={{ opacity, maxWidth: 1000 }}>
        <div style={{
          display: 'flex',
          gap: 60,
          alignItems: 'center',
        }}>
          <div style={{
            flex: 1,
            padding: 40,
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{
              fontSize: 24,
              color: '#ef4444',
              fontWeight: 700,
              marginBottom: 16,
              fontFamily: 'Inter, sans-serif',
            }}>
              ✗ Static Rationales
            </div>
            <div style={{
              fontSize: 18,
              color: COLORS.muted,
              lineHeight: 1.6,
              fontFamily: 'Inter, sans-serif',
            }}>
              Traditional Q-bank: Question → Wall of text. No practice in thinking.
            </div>
          </div>
          
          <div style={{
            fontSize: 48,
            color: COLORS.coral,
            fontWeight: 800,
          }}>
            vs
          </div>
          
          <div style={{
            flex: 1,
            padding: 40,
            background: 'rgba(255,107,91,0.08)',
            borderRadius: 16,
            border: `1px solid ${COLORS.coral}`,
          }}>
            <div style={{
              fontSize: 24,
              color: COLORS.green,
              fontWeight: 700,
              marginBottom: 16,
              fontFamily: 'Inter, sans-serif',
            }}>
              ✓ Thinking Like a Nurse
            </div>
            <div style={{
              fontSize: 18,
              color: COLORS.white,
              lineHeight: 1.6,
              fontFamily: 'Inter, sans-serif',
            }}>
              Real patient scenarios: New cues, decisions, consequences.
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: Product (20-48s = 600-1440 frames)
const ProductScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  
  const features = [
    { icon: '📝', title: 'Unfolding NGN Cases', desc: 'Real patient scenarios' },
    { icon: '🤖', title: 'AI Explains the Why', desc: 'Conversational rationale' },
    { icon: '📊', title: 'Know Where You Stand', desc: '6-dimension readiness score' },
    { icon: '🔄', title: 'Reviews Find You', desc: 'Spaced repetition targeting' },
    { icon: '🫀', title: 'See It in 3D', desc: 'Interactive anatomy lab' },
  ];
  
  return (
    <AbsoluteFill style={{
      background: `linear-gradient(180deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 60,
    }}>
      <div style={{ opacity, maxWidth: 1100 }}>
        <div style={{
          fontSize: 48,
          fontWeight: 900,
          color: COLORS.white,
          textAlign: 'center',
          marginBottom: 48,
          fontFamily: 'Inter, sans-serif',
        }}>
          Meet <span style={{ color: COLORS.coral }}>Obioma</span>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 20,
        }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 16,
              padding: 24,
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{f.icon}</div>
              <div style={{
                fontSize: 15,
                fontWeight: 700,
                color: COLORS.white,
                marginBottom: 8,
                fontFamily: 'Inter, sans-serif',
              }}>
                {f.title}
              </div>
              <div style={{
                fontSize: 13,
                color: COLORS.muted,
                fontFamily: 'Inter, sans-serif',
              }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: Proof (48-58s = 1440-1740 frames)
const ProofScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  
  return (
    <AbsoluteFill style={{
      background: COLORS.navy,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 80,
    }}>
      <div style={{ opacity, textAlign: 'center', maxWidth: 800 }}>
        <div style={{
          fontSize: 64,
          marginBottom: 32,
        }}>
          ✅
        </div>
        <div style={{
          fontSize: 32,
          fontWeight: 700,
          color: COLORS.white,
          marginBottom: 24,
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1.4,
        }}>
          Built on the NCSBN Clinical Judgment Model
        </div>
        <div style={{
          fontSize: 20,
          color: COLORS.muted,
          fontFamily: 'Inter, sans-serif',
        }}>
          The same framework the people who write the NCLEX use.
          <br />
          Every case reviewed by registered nurses.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 5: CTA (58-75s = 1740-2250 frames)
const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const scale = spring({ fps: useVideoConfig().fps, frame, from: 0.9, to: 1, durationInFrames: 20 });
  
  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${COLORS.navyLight} 0%, ${COLORS.navy} 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 80,
    }}>
      <div style={{ opacity, transform: `scale(${scale})`, textAlign: 'center' }}>
        <div style={{
          fontSize: 56,
          fontWeight: 900,
          color: COLORS.white,
          marginBottom: 24,
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1.2,
        }}>
          Stop memorizing.
          <br />
          <span style={{ color: COLORS.coral }}>Start thinking like a nurse.</span>
        </div>
        <div style={{
          fontSize: 28,
          color: COLORS.muted,
          marginBottom: 40,
          fontFamily: 'Inter, sans-serif',
        }}>
          obiomacare.com
        </div>
        <div style={{
          display: 'inline-block',
          padding: '16px 48px',
          background: `linear-gradient(135deg, ${COLORS.coral} 0%, ${COLORS.coral} 100%)`,
          borderRadius: 12,
          fontSize: 20,
          fontWeight: 700,
          color: '#fff',
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0 8px 30px rgba(255,107,91,0.4)',
        }}>
          Start Free →
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Main composition
export const LandingPromo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={240}>
        <HookScene />
      </Sequence>
      <Sequence from={240} durationInFrames={360}>
        <ProblemScene />
      </Sequence>
      <Sequence from={600} durationInFrames={840}>
        <ProductScene />
      </Sequence>
      <Sequence from={1440} durationInFrames={300}>
        <ProofScene />
      </Sequence>
      <Sequence from={1740} durationInFrames={510}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};
