import { useEvent } from 'expo';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { View } from 'react-native';
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

  return (
    <View className="flex-1" accessible={false} importantForAccessibility="no-hide-descendants">
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
  );
}
