import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Audio,
  staticFile,
} from 'remotion';

const COLORS = {
  navy: '#0a1628',
  navyLight: '#162544',
  coral: '#FF6B5B',
  white: '#e2e8f0',
  muted: '#94a3b8',
  green: '#22c55e',
};

// Animated background with moving orbs
const AnimatedBackground: React.FC<{variant?: 'default' | 'warm' | 'cool'}> = ({variant = 'default'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  
  const orb1X = Math.sin(t * 0.3) * 200 + 960;
  const orb1Y = Math.cos(t * 0.2) * 150 + 540;
  const orb2X = Math.cos(t * 0.25) * 250 + 960;
  const orb2Y = Math.sin(t * 0.35) * 180 + 540;
  
  const colors = {
    default: ['rgba(255,107,91,0.08)', 'rgba(10,22,40,0.5)'],
    warm: ['rgba(255,107,91,0.12)', 'rgba(255,193,7,0.05)'],
    cool: ['rgba(34,197,94,0.08)', 'rgba(10,22,40,0.5)'],
  };
  
  return (
    <>
      <div style={{
        position: 'absolute',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${colors[variant][0]} 0%, transparent 70%)`,
        left: orb1X - 300,
        top: orb1Y - 300,
        filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${colors[variant][1]} 0%, transparent 70%)`,
        left: orb2X - 200,
        top: orb2Y - 200,
        filter: 'blur(40px)',
      }} />
    </>
  );
};

// Floating particles
const Particles: React.FC = () => {
  const frame = useCurrentFrame();
  const particles = Array.from({length: 15}, (_, i) => ({
    x: ((i * 137.5) % 1920),
    y: ((i * 89.7) % 1080),
    size: 2 + (i % 4),
    speed: 0.5 + (i % 3) * 0.3,
    phase: i * 0.5,
  }));
  
  return (
    <>
      {particles.map((p, i) => {
        const y = (p.y + frame * p.speed) % 1080;
        const opacity = 0.3 + Math.sin((frame + p.phase * 30) * 0.05) * 0.2;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: p.x,
            top: y,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: COLORS.coral,
            opacity,
          }} />
        );
      })}
    </>
  );
};

// Scene 1: Hook (0-9s)
const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const scale = spring({ fps, frame, from: 0.9, to: 1, durationInFrames: 20 });
  const heartbeatOpacity = interpolate(frame, [0, 5, 10, 15], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  const textY = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: 'clamp' });
  
  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 60,
      overflow: 'hidden',
    }}>
      <AnimatedBackground variant="warm" />
      <Particles />
      
      {/* Heartbeat visual pulse */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 300 + Math.sin(frame * 0.3) * 50,
        height: 300 + Math.sin(frame * 0.3) * 50,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${COLORS.coral}30 0%, transparent 70%)`,
        opacity: heartbeatOpacity,
      }} />
      
      <div style={{ opacity, transform: `scale(${scale}) translateY(${textY}px)`, textAlign: 'center', zIndex: 1 }}>
        <div style={{
          fontSize: 64,
          fontWeight: 900,
          color: COLORS.white,
          lineHeight: 1.2,
          marginBottom: 24,
          fontFamily: 'Inter, sans-serif',
          maxWidth: 900,
          textShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          You've memorized 3,000 facts.
        </div>
        <div style={{
          fontSize: 64,
          fontWeight: 900,
          color: COLORS.coral,
          lineHeight: 1.2,
          fontFamily: 'Inter, sans-serif',
          textShadow: '0 4px 20px rgba(255,107,91,0.3)',
        }}>
          The NCLEX doesn't care.
        </div>
        
        {/* Caption bar */}
        <div style={{
          marginTop: 40,
          padding: '12px 32px',
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 8,
          fontSize: 20,
          color: COLORS.white,
          fontFamily: 'Inter, sans-serif',
          display: 'inline-block',
          backdropFilter: 'blur(10px)',
        }}>
          It asks what you'd do.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Problem (9-33s)
const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const slideX = interpolate(frame, [0, 20], [-50, 0], { extrapolateRight: 'clamp' });
  const rotate = interpolate(frame, [0, 100], [0, 2], { extrapolateRight: 'clamp' });
  
  return (
    <AbsoluteFill style={{
      background: COLORS.navy,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 80,
      overflow: 'hidden',
    }}>
      <AnimatedBackground />
      
      {/* Diagonal accent line */}
      <div style={{
        position: 'absolute',
        width: 3,
        height: 1500,
        background: `linear-gradient(180deg, transparent, ${COLORS.coral}40, transparent)`,
        left: '50%',
        top: -200,
        transform: `rotate(${15 + rotate}deg)`,
      }} />
      
      <div style={{ opacity, transform: `translateX(${slideX}px)`, maxWidth: 1100, zIndex: 1 }}>
        <div style={{
          display: 'flex',
          gap: 40,
          alignItems: 'stretch',
        }}>
          {/* Static rationales - LEFT */}
          <div style={{
            flex: 1,
            padding: 40,
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.1)',
            opacity: interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' }),
            transform: `translateY(${interpolate(frame, [30, 50], [20, 0], { extrapolateRight: 'clamp' })}px)`,
          }}>
            <div style={{
              fontSize: 20,
              color: '#ef4444',
              fontWeight: 700,
              marginBottom: 16,
              fontFamily: 'Inter, sans-serif',
            }}>
              ✗ Static Rationales
            </div>
            <div style={{
              fontSize: 16,
              color: COLORS.muted,
              lineHeight: 1.6,
              fontFamily: 'Inter, sans-serif',
            }}>
              Question → Wall of text. Memorize → Forget.
            </div>
            <div style={{
              marginTop: 20,
              padding: 16,
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 8,
              fontSize: 13,
              color: COLORS.muted,
              fontFamily: 'monospace',
            }}>
              A. Administer medication<br/>
              B. Check vital signs<br/>
              C. Call physician<br/>
              D. Document findings<br/>
              <br/>
              Rationale: The correct answer is B because...
            </div>
          </div>
          
          {/* VS divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            color: COLORS.coral,
            fontWeight: 800,
            opacity: interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp' }),
            transform: `scale(${interpolate(frame, [40, 60], [0.5, 1], { extrapolateRight: 'clamp' })})`,
          }}>
            vs
          </div>
          
          {/* Unfolding case - RIGHT */}
          <div style={{
            flex: 1,
            padding: 40,
            background: 'rgba(255,107,91,0.08)',
            borderRadius: 16,
            border: `1px solid ${COLORS.coral}`,
            opacity: interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' }),
            transform: `translateY(${interpolate(frame, [60, 80], [20, 0], { extrapolateRight: 'clamp' })}px)`,
          }}>
            <div style={{
              fontSize: 20,
              color: COLORS.green,
              fontWeight: 700,
              marginBottom: 16,
              fontFamily: 'Inter, sans-serif',
            }}>
              ✓ Real Patient Scenarios
            </div>
            <div style={{
              fontSize: 16,
              color: COLORS.white,
              lineHeight: 1.6,
              fontFamily: 'Inter, sans-serif',
            }}>
              New cues → Decisions → Consequences.
            </div>
            <div style={{
              marginTop: 20,
              padding: 16,
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 8,
              fontSize: 13,
              color: COLORS.white,
              fontFamily: 'monospace',
            }}>
              <span style={{color: COLORS.coral}}>▶</span> BP dropping...<br/>
              <span style={{color: COLORS.coral}}>▶</span> New lab results...<br/>
              <span style={{color: COLORS.coral}}>▶</span> Patient status changed...<br/>
              <br/>
              <span style={{color: COLORS.green}}>What do you do FIRST?</span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: Solution - HONEST, only shipped features (33-49s)
const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const floatY = Math.sin(frame * 0.05) * 5;
  
  const features = [
    { icon: '📚', title: '74 Study Guides', desc: 'NGN-aligned content' },
    { icon: '📝', title: 'Interactive Quizzes', desc: 'Test your judgment' },
    { icon: '🎯', title: 'NCSBN Framework', desc: 'The 6-step model' },
    { icon: '✅', title: 'Free Checklist', desc: 'Proven study system' },
  ];
  
  return (
    <AbsoluteFill style={{
      background: `linear-gradient(180deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 60,
      overflow: 'hidden',
    }}>
      <AnimatedBackground variant="cool" />
      <Particles />
      
      <div style={{ opacity, maxWidth: 1000, textAlign: 'center', zIndex: 1 }}>
        <div style={{
          fontSize: 42,
          fontWeight: 900,
          color: COLORS.white,
          marginBottom: 16,
          fontFamily: 'Inter, sans-serif',
          transform: `translateY(${floatY}px)`,
        }}>
          Meet <span style={{ color: COLORS.coral }}>Obioma</span>
        </div>
        <div style={{
          fontSize: 18,
          color: COLORS.muted,
          marginBottom: 40,
          fontFamily: 'Inter, sans-serif',
        }}>
          Clinical judgment training that actually exists
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 20,
          maxWidth: 700,
          margin: '0 auto',
        }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 16,
              padding: 28,
              textAlign: 'left',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              opacity: interpolate(frame, [20 + i * 10, 35 + i * 10], [0, 1], { extrapolateRight: 'clamp' }),
              transform: `translateY(${interpolate(frame, [20 + i * 10, 35 + i * 10], [20, 0], { extrapolateRight: 'clamp' })}px) rotate(${interpolate(frame, [20 + i * 10, 35 + i * 10], [-2, 0], { extrapolateRight: 'clamp' })}deg)`,
            }}>
              <div style={{ fontSize: 36 }}>{f.icon}</div>
              <div>
                <div style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: COLORS.white,
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
            </div>
          ))}
        </div>
        
        <div style={{
          marginTop: 32,
          padding: '12px 24px',
          background: 'rgba(255,193,7,0.1)',
          border: '1px solid rgba(255,193,7,0.3)',
          borderRadius: 8,
          display: 'inline-block',
          opacity: interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' }),
          transform: `translateY(${Math.sin(frame * 0.03) * 3}px)`,
        }}>
          <span style={{ color: '#ffc107', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
            🚧 NGN Case Engine, AI Tutor, 3D Anatomy Lab — Coming Soon
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: Proof (49-60s)
const ProofScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const scale = spring({ fps: useVideoConfig().fps, frame, from: 0.8, to: 1, durationInFrames: 20 });
  const rotate = interpolate(frame, [0, 60], [0, 5], { extrapolateRight: 'clamp' });
  
  return (
    <AbsoluteFill style={{
      background: COLORS.navy,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 80,
      overflow: 'hidden',
    }}>
      <AnimatedBackground variant="cool" />
      
      {/* Rotating ring */}
      <div style={{
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: '50%',
        border: `2px solid rgba(34,197,94,0.1)`,
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
      }} />
      <div style={{
        position: 'absolute',
        width: 350,
        height: 350,
        borderRadius: '50%',
        border: `1px solid rgba(34,197,94,0.08)`,
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) rotate(${-rotate * 1.5}deg)`,
      }} />
      
      <div style={{ opacity, transform: `scale(${scale})`, textAlign: 'center', maxWidth: 800, zIndex: 1 }}>
        <div style={{
          fontSize: 72,
          marginBottom: 24,
          transform: `scale(${1 + Math.sin(frame * 0.1) * 0.05})`,
        }}>
          ✅
        </div>
        <div style={{
          fontSize: 28,
          fontWeight: 700,
          color: COLORS.white,
          marginBottom: 16,
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1.4,
        }}>
          Built on the NCSBN Clinical Judgment Model
        </div>
        <div style={{
          fontSize: 18,
          color: COLORS.muted,
          fontFamily: 'Inter, sans-serif',
          marginBottom: 32,
        }}>
          The same framework the people who write the NCLEX use
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 24px',
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: 100,
          transform: `translateY(${Math.sin(frame * 0.04) * 2}px)`,
        }}>
          <span style={{ color: COLORS.green, fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
            ✓ Reviewed by Registered Nurses
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 5: CTA (60-73s)
const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const scale = spring({ fps, frame, from: 0.9, to: 1, durationInFrames: 20 });
  
  // Heartbeat resolves to steady rhythm - visual pulse
  const pulseOpacity = interpolate(frame, [0, 10, 20, 30], [0.5, 1, 0.5, 1], { extrapolateRight: 'clamp' });
  const pulseScale = 1 + Math.sin(frame * 0.15) * 0.05;
  
  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${COLORS.navyLight} 0%, ${COLORS.navy} 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 80,
      overflow: 'hidden',
    }}>
      <AnimatedBackground variant="warm" />
      
      {/* Steady heartbeat glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${pulseScale})`,
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${COLORS.coral}15 0%, transparent 70%)`,
        opacity: pulseOpacity,
      }} />
      
      <div style={{ opacity, transform: `scale(${scale})`, textAlign: 'center', zIndex: 1 }}>
        <div style={{
          fontSize: 48,
          fontWeight: 900,
          color: COLORS.white,
          marginBottom: 16,
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1.2,
          textShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          Stop memorizing.
          <br />
          <span style={{ color: COLORS.coral }}>Start thinking like a nurse.</span>
        </div>
        <div style={{
          fontSize: 22,
          color: COLORS.muted,
          marginBottom: 32,
          fontFamily: 'Inter, sans-serif',
        }}>
          Get the free NCLEX Study Checklist
        </div>
        <div style={{
          display: 'inline-block',
          padding: '14px 40px',
          background: `linear-gradient(135deg, ${COLORS.coral} 0%, ${COLORS.coral} 100%)`,
          borderRadius: 12,
          fontSize: 18,
          fontWeight: 700,
          color: '#fff',
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0 8px 30px rgba(255,107,91,0.4)',
          transform: `scale(${1 + Math.sin(frame * 0.08) * 0.02})`,
        }}>
          obiomacare.com
        </div>
        <div style={{
          marginTop: 24,
          fontSize: 14,
          color: COLORS.muted,
          fontFamily: 'Inter, sans-serif',
        }}>
          Your patients are counting on the nurse you're becoming.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Main composition
export const LandingPromoV2: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={270}>
        <HookScene />
      </Sequence>
      <Sequence from={270} durationInFrames={720}>
        <ProblemScene />
      </Sequence>
      <Sequence from={990} durationInFrames={480}>
        <SolutionScene />
      </Sequence>
      <Sequence from={1470} durationInFrames={330}>
        <ProofScene />
      </Sequence>
      <Sequence from={1800} durationInFrames={450}>
        <CTAScene />
      </Sequence>
      
      {/* Single pre-mixed audio track */}
      <Audio src={staticFile('audio/audio-mixed.mp3')} />
    </AbsoluteFill>
  );
};
