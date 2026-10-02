import { useEvent } from 'expo';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useWindowDimensions, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { animations } from '@/components/illustrations';

/**
 * A4 art: the isometric city clip on a silent loop. The still image sits underneath until the first
 * frame is ready (no black flash), and is all that shows when the user asks for reduced motion.
 */
export function CityAnimation() {
  const reduceMotion = useReducedMotion();
  const player = useVideoPlayer(reduceMotion ? null : animations.locationCity, (p) => {
    p.loop = true;
    p.muted = true;
    p.audioMixingMode = 'mixWithOthers'; // never pause the user's music
    p.play();
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  // A fixed 3:4 box from the window size, not "whatever space is left": on Android the status bar
  // hides while the permission dialog is up, and a flex box then grew and shrank — the city zoomed.
  const { width, height } = useWindowDimensions();
  const boxWidth = Math.min(width - 32, height * 0.5 * 0.75);

  return (
    <View
      className="flex-1 items-center justify-center"
      accessible={false}
      importantForAccessibility="no-hide-descendants">
      <View style={{ width: boxWidth, aspectRatio: 3 / 4 }}>
        {/* The clip's own first frame, so swapping between still and video never changes the framing. */}
        <Image
          source={animations.locationCityPoster}
          style={{ position: 'absolute', inset: 0 }}
          contentFit="contain"
        />
        {!reduceMotion && (
          <VideoView
            player={player}
            nativeControls={false}
            contentFit="contain"
            surfaceType="textureView"
            style={{ flex: 1, opacity: status === 'readyToPlay' ? 1 : 0 }}
          />
        )}
      </View>
    </View>
  );
}
