import '@fontsource-variable/plus-jakarta-sans';
import { Composition } from 'remotion';
import { HeroStory } from './HeroStory';
import { sceneFrames, theme } from './theme';
import { guideTimeline, Tutorial } from './Tutorial';

export function RemotionRoot() {
  const { fps, width, height } = theme.comp;
  return (
    <>
      <Composition id="HeroStory" component={HeroStory} durationInFrames={sceneFrames(fps).total} fps={fps} width={width} height={height} />
      <Composition id="PanduanPenjual" component={Tutorial} defaultProps={{ guide: 'seller' as const }}
        durationInFrames={guideTimeline('seller', fps).total} fps={fps} width={width} height={height} />
      <Composition id="PanduanPembeli" component={Tutorial} defaultProps={{ guide: 'buyer' as const }}
        durationInFrames={guideTimeline('buyer', fps).total} fps={fps} width={width} height={height} />
    </>
  );
}
