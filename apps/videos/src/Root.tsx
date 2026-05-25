import React from 'react';
import { Composition } from 'remotion';
import { PromoVideo, totalDuration } from './PromoVideo';
import { VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS } from './tokens';

/*
 * Two compositions:
 *   - PromoVideo       1920×1080 landscape — landing-page hero / GitHub
 *   - PromoVertical     1080×1920 vertical — Stories / Reels / TikTok
 *
 * Both share the same sequence components; the vertical one re-renders
 * with swapped width/height so each scene's flexbox reflows naturally.
 */
export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="PromoVideo"
        component={PromoVideo}
        durationInFrames={totalDuration}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />
      <Composition
        id="PromoVertical"
        component={PromoVideo}
        durationInFrames={totalDuration}
        fps={VIDEO_FPS}
        width={VIDEO_HEIGHT}
        height={VIDEO_WIDTH}
      />
    </>
  );
};
