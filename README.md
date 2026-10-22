# Anatomy Jig 048

Frame-locked 34-second WebGL study of an original electric pickup chassis. Skin panels leave along surface normals. The camera then locks three systems: dual redundant steer-by-wire motors, a 48V zonal ethernet harness, and rear-wheel steering. The structural battery links into the front and rear castings on the way out.

This is not a production vehicle and not a reproduction of one. The geometry is built for the shot.

Preview: https://mizcausevic-dev.github.io/ev-pickup-anatomy-jig/

## Clock

30 fps. Frame 0 is 0.0s. Frame 1020 is 34.0s. An export of frames 0 through 1019 is 1,020 images. Scrubbing can sit on frame 1020, the end hold.

| Frames | Time | Camera | What changes |
| --- | --- | --- | --- |
| 0 to 150 | 0.0 to 5.0s | Low front three-quarter | Stainless skin moves out along surface normals. Aluminum castings stay. |
| 151 to 300 | 5.0 to 10.0s | Top-down descent onto the front axle | Wishbones strip. Two steer-by-wire motors hold in electric ice. |
| 301 to 510 | 10.0 to 17.0s | Linear dolly through the cabin tunnel | Volt-yellow ethernet loops carry packet bursts between three zonal controllers. |
| 511 to 750 | 17.0 to 25.0s | Overhead push onto the rear rack | Linkages pivot through plus or minus 10 degrees. Tie rods and drive nuts are performance red. |
| 751 to 1020 | 25.0 to 34.0s | Spiral out to a wide isometric, then hold | Structural links seat into both castings. Ice, yellow, and red vectors pulse together at 0.5 Hz. |

Accent colors are electric ice `#00E5FF`, volt yellow `#FFE600`, and performance red `#FF1744`. The stage floor is `#0D0E11`. The monocoque is `#3E424B`.

## Run

The page loads Three.js r170 from `vendor/three.module.js`. No install is required to open the preview. Locally:

```bash
npm test
npm start
```

Open `http://127.0.0.1:4173`. Space plays and pauses. Arrow keys step one frame, shift-arrow steps 30. Keys 1 through 5 jump chapters. `prefers-reduced-motion` skips autoplay and opens on the wide hold.

## Repurpose

Keep `timeline.mjs`. Replace the geometry in `jig.mjs`. The same five-beat clock can carry a robot arm, a landing-gear bay, or a battery cabinet.

Three.js r170 is MIT. See `vendor/three-LICENSE.txt`.
