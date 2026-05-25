import React from 'react';
import { AbsoluteFill, Series } from 'remotion';
import { VIDEO_FPS } from './tokens';

import { Intro } from './sequences/Intro';
import { Install } from './sequences/Install';
import { Components } from './sequences/Components';
import { AgentRecipe } from './sequences/AgentRecipe';
import { Outro } from './sequences/Outro';

// Sequence durations in seconds → converted to frames at FPS time.
// Keep total under ~55s so it fits comfortably in social-feed loops.
const s = (seconds: number) => Math.round(seconds * VIDEO_FPS);

const scenes: { component: React.FC<{ totalFrames: number }>; duration: number }[] = [
  { component: Intro,        duration: s(6)  },  // 0:00 – 0:06   value prop
  { component: Install,      duration: s(7)  },  // 0:06 – 0:13   <link> install
  { component: Components,   duration: s(10) },  // 0:13 – 0:23   component grid
  { component: AgentRecipe,  duration: s(8)  },  // 0:23 – 0:31   AGENTS.md flow
  { component: Outro,        duration: s(9)  },  // 0:31 – 0:40   star CTA + tagline
];

export const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);

export const PromoVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Series>
        {scenes.map(({ component: Scene, duration }, i) => (
          <Series.Sequence key={i} durationInFrames={duration}>
            <Scene totalFrames={duration} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};
