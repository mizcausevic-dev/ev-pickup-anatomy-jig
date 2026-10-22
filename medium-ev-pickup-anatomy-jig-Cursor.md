# A 34-second anatomy jig for an electric pickup chassis

**Subtitle:** Frame-locked WebGL, five camera beats, and three colors that mean three systems: stainless skin, dual steer-by-wire motors, and a 48V zonal ethernet network.

**Byline:** Miz Causevic, Kinetic Gain LLC. Cambridge, MA. Engineering, platform architecture, and B2B systems work across IBM, CyberArk, and Alteryx. [GitHub](https://github.com/mizcausevic-dev) · [LinkedIn](https://www.linkedin.com/in/mirzacausevic/)

**Date:** 22 October 2026

**Live player:** [https://mizcausevic-dev.github.io/ev-pickup-anatomy-jig/](https://mizcausevic-dev.github.io/ev-pickup-anatomy-jig/)

**Source:** [https://github.com/mizcausevic-dev/ev-pickup-anatomy-jig](https://github.com/mizcausevic-dev/ev-pickup-anatomy-jig)

---

Open the player. Press play. Thirty-four seconds later the camera is back outside, the structural battery has seated into both castings, and three colors are still telling you which system is which.

That is the whole job of Anatomy Jig 048. It is a frame-locked study of an original electric pickup chassis. The skin is a cold-rolled stainless exoskeleton. The front axle carries two electromechanical steer-by-wire motors. A 48-volt ethernet harness runs between three zonal controllers. The rear axle steers. The pack is structural.

The geometry is built for the shot. It is an original chassis study, and the player says so on screen: not a production vehicle. There is no badge, no claimed certification, and no measured vehicle data hiding under the animation.

If you build technical films, the useful part is the clock. Every panel, angle, packet, and camera sample is a function of the frame index. Scrub to frame 680 and the rear road wheel is at the same angle every time. That is the difference between a render and a jig.

## Who this is for

The reader who needs it is a chassis engineer, a motion designer, or a writer who has to explain a zonal vehicle without a CAD seat.

The engineer wants the beats in order: skin, then the thing the skin was hiding, then the network that ties the zones together, then the actuator, then the structure that closes the loop. The designer wants a camera that can be replayed. The writer wants sentences that match a clock, so a claim about "the rear steer shot" means frames 511 to 750 and not a vibe.

The same file is the public page and the source of the timing. [timeline.mjs](https://github.com/mizcausevic-dev/ev-pickup-anatomy-jig/blob/main/timeline.mjs) has no renderer in it. A test file locks the beats. On 22 October 2026, `node --test test/timeline.test.mjs` passed 6 of 6.

## The clock is the film

Frame 0 is 0.0 seconds. Frame 1020 is 34.0 seconds. The rate is 30 frames per second.

The brief asked for 1,020 frames and also named an end frame of 1020. Those two counts disagree by one if you treat both as inclusive. The jig keeps both meanings and writes them down:

- The addressable range is frame 0 through frame 1020. That is 1,021 ticks. Scrubbing can sit on the end hold.
- An export of frames 0 through 1019 is exactly 1,020 images and exactly 34.000 seconds.
- Playback holds at frame 1020. It does not loop.

Time is `frame / 30`. Nothing in the scene reads `Date.now()` except the play button, which advances one frame each thirtieth of a second. Pause, and the world stops on an integer. Seek, and `presentation(frame)` returns the segment, the steer angles, the camera, and the light weights for that integer alone.

The easing is a smootherstep, `t * t * (3 - 2 * t)`, clamped to 0..1. Camera keys use that curve except for one span. From frame 352 to frame 510 the dolly is linear, x stays at 0, and z decreases. The test asserts that. A linear dolly is the one place a smoothstep would lie: it would slow the camera in the middle of the tunnel, which is the shot that is supposed to feel like a pass, not an arrival.

## Five beats, and what each one is allowed to do

| Frames | Time | Camera | What is allowed to change |
| --- | --- | --- | --- |
| 0 to 150 | 0.0 to 5.0s | Low front three-quarter | Stainless panels leave along their surface normals. The aluminum castings stay. |
| 151 to 300 | 5.0 to 10.0s | Top-down descent onto the front axle | Wishbones strip. Two steer-by-wire motors hold in electric ice. |
| 301 to 510 | 10.0 to 17.0s | Straight dolly down the cabin tunnel | Volt-yellow loops carry packet bursts between three zonal controllers. |
| 511 to 750 | 17.0 to 25.0s | Overhead push onto the rear rack | Linkages pivot within 10 degrees either way. Tie rods and drive nuts are performance red. |
| 751 to 1020 | 25.0 to 34.0s | Spiral out to a wide isometric, then hold | Structural links seat into both castings. Ice, yellow, and red pulse together. |

Chapters in the player jump to those start frames. Keys 1 through 5 do the same thing. Space plays and pauses. Arrow keys step one frame. Shift-arrow steps 30, one second. Home and End go to the ends.

`prefers-reduced-motion` skips autoplay and opens on the wide hold, near the end of the film, where the whole chassis is already readable. The pulse still exists in the data. The page does not start it for you.

### 0.0 to 5.0 seconds: the skin leaves on its normals

Each panel is a group with a stored base point and a stored normal. The travel distance is per panel. The amount is `smoother((frame - 16 - stagger) / 96)`. Stagger is a few frames, so the hood leads and the cabin floor follows. By about frame 134 the move is finished. The rest of the first beat is a hold, so you can see the castings before the camera dives.

The hood normal points mostly forward, `[0, 0.42, 1]`, and it travels 1.65 units. The tailgate travels 1.9 toward the rear. The bed sides travel 1.45 outward. Those distances are clearance, not styling. Later cameras fly through the volume the panels used to occupy. If a panel stops too close, the lens ends up inside a slab and the frame goes black. I learned that by looking at stills, then moving the panels out until the rear axle stayed visible.

At frame 0 the accent lights are off. Focus curves for ice, yellow, and red return 0 until their own beats. A closed skin with glowing seams gives away the next chapter. On 22 October 2026 a headless Chrome capture at 1280×720, frame 0, showed the assembled pickup, clock `0000 / 1020`, time `0.00s`, with the bay dark behind the windshield.

The panels read as `#3E424B`. Metalness sits near 0.56 and roughness near 0.3. A darker, more mirror-like setting disappeared into the studio environment and left only edge lines. Steel has to reflect something. The environment is a small set of light cards sampled through Three.js `PMREMGenerator`, on a floor of `#0D0E11`.

### 5.0 to 10.0 seconds: two motors, then the wheels

The camera climbs and looks down the front axle. Wishbones translate outward and fade. `wishboneStripAt` runs from frame 175 across 80 frames, so they are gone before frame 255. Front steer stays at 0 until frame 268. The order matters. You strip the arms, then you show the motors doing the work the arms no longer explain.

From frame 268 to 320 the road-wheel angle is a half sine with an amplitude of 8 degrees. The peak is exactly 8 degrees at frame 294. After frame 320 the front holds at 5 degrees, so the later wide shot stays posed. Both knuckles share one yaw. This jig steers them in parallel. It does not model Ackermann.

The motors are electric ice, `#00E5FF`, with an untonemapped shell so the hue survives the filmic tone map. A capture at frame 280 read `Front road wheel 5.3 deg` on the HUD, which matches `sin((280 - 268) / 52 * π) * 8`.

### 10.0 to 17.0 seconds: the 48-volt bus is a path, not a label

Three controllers sit off the centerline: front, cabin, rear. The dolly from frame 352 to frame 510 is locked to x = 0. A controller or a beam on that line, between the camera and the floor, becomes a windshield. The firewall is open in the middle. The tunnel rails sit at x = ±0.16.

Two closed curves plus a pack-backbone loop carry the harness. Each loop has five packets, and each packet has a short trail. Speed is `0.004 + busFocus * 0.03` of the curve per frame. The color is volt yellow, `#FFE600`, and the packet spheres are untonemapped so the yellow stays `#FFE600` instead of a tone-mapped cream.

There are no 3D name sprites. An earlier pass put labels in the world with depth testing off. They filled the frame and hid the motors. Names live in the HUD: zonal controllers F, C, and R. The picture has to survive a pause. A label that only works while the camera is moving is a title card, not a part.

A capture at frame 420 showed the tunnel, the yellow loops, and the clock at `14.00s`.

### 17.0 to 25.0 seconds: rear steer inside a hard limit

Rear angle is 0 before frame 511. From 511 to 750 it is one full sine with amplitude 10 degrees. The peak stays above 9.9 and at or under 10. After frame 750 it holds at 7 degrees so the pull-back is not a relaxed, straight axle.

Tie rods are rebuilt every frame. The nut and the knuckle anchor report world positions, those positions convert back into the chassis, and a unit cylinder scales to the segment. The rod cannot drift off the joint because it has no stored pose. The pose is the two points.

Actuators, tie rods, and drive nuts are performance red, `#FF1744`. The rack bar itself stays steel, so the red reads as the moving hardware.

A capture at frame 680 showed the rear casting, the red actuators, and the HUD value `Road wheel -9.6 deg`. The formula gives about −9.63 at that frame. The test scans the whole rear window and requires the extreme to stay inside plus or minus 10.

### 25.0 to 34.0 seconds: the pack becomes structure

Forty cells sit in the floor. They are one instanced mesh, and frustum culling is off, because the instance origin can leave a tight camera frustum while the cells are still in view. Four link members scale from the pack toward the front and rear castings. `linkInAt` is a smootherstep starting at frame 770 over 130 frames, so the links are fully seated before the hold. At frame 1000 the HUD read `Structural link 100 percent`.

Direction arrows for ice, yellow, red, and the links fade in from frame 860. After that frame the three systems pulse together. The wave is `sin(π * seconds)`, which is 0.5 hertz, and the brightness stays between about 0.45 and 1.0. Before frame 860 the pulse function returns 1, so the hero shots do not breathe while you are trying to read them.

The pulse changes emissive intensity and opacity. It does not move geometry. Large-area flashing and position jitter are out. Half a hertz, on the parts that are already the subject, sits well under the three-flashes-per-second threshold in WCAG 2.3.1.

The camera spirals out and holds. Frames 990 and 1020 share one pose: a high three-quarter, field of view 34. The last 30 frames are a still image of a finished argument.

## Color is a claim

Three accents, used the same way every time:

| Role | Hex | What it is allowed to paint |
| --- | --- | --- |
| Electric ice | `#00E5FF` | The two front steer-by-wire motors, their shells, and their arrows |
| Volt yellow | `#FFE600` | The 48V ethernet loops, packet bursts, controller faces |
| Performance red | `#FF1744` | Rear actuators, tie rods, drive nuts, rear arrows |

The floor is `#0D0E11`. The skin is `#3E424B`. The castings are a light aluminum, `#D5DBE3`, and they stay opaque when the skin leaves. If a fourth system appears, it does not get a fourth neon. It has to earn one of these three, or stay metal.

Light intensity is multiplied by a focus window for that system. The window is 0 outside its chapter, and it comes back during the final pull-back so the wide shot still shows all three. Point lights in Three.js r170 are physically sized. The intensities here were chosen by looking at frames, not from a lamp catalog.

## What the angles are, and what they are not

The 8 degrees and the 10 degrees are the animation contract. They are the limits the test enforces so the picture cannot quietly exceed the brief. They are not a measured steer angle from a vehicle, a proving ground, or a drawing.

The zonal controllers are three boxes and a set of curves. They show that a low-voltage network can be drawn as traffic between zones. They are not a harness drawing, a connector part number, or a latency budget.

The cells are a structural diagram: a pack in the floor, linked into the front and rear castings. Cell count, module layout, and capacity are not specified because this study does not have those numbers. Publishing a made-up kilowatt-hour figure would be worse than leaving the count as geometry.

The truck is not a reproduction of a branded pickup. Proportions exist so a low three-quarter reads as a cab, a bed, and two axles. If you need OEM surfaces, this is the wrong file.

## How the page is built

The player is static. `index.html` loads `main.js` as a module. An import map points the bare specifier `three` at `./vendor/three.module.js`. That file is Three.js r170, exactly 0.170.0, MIT, with the license in `vendor/three-LICENSE.txt`. GitHub Pages serves the folder as it sits on the `gh-pages` branch. There is no build step and no dependency install for a visitor.

The renderer is a WebGL renderer with an ACES filmic tone map, soft shadows, and `preserveDrawingBuffer` so a capture can read the canvas. `?capture=1` hides the transport and does not start playback. `window.__jig.seek(frame)` is the hook a headless browser uses. That is how the stills in this piece were taken: Chrome, SwiftShader, the local player, then a seek.

The local server binds to 127.0.0.1 and refuses a path that resolves outside the project root. The public page has no form, no account, and no analytics tag. Nothing on it is a lead form.

The repository is public. On 22 October 2026 an anonymous request to `https://mizcausevic-dev.github.io/ev-pickup-anatomy-jig/` returned HTTP 200, and the same check returned 200 for `main.js`, `timeline.mjs`, `jig.mjs`, and `vendor/three.module.js`. A private repository can still report a Pages build while an anonymous visitor gets a 404. The preview had to be public to be a preview.

## How to watch it without losing the thread

1. Start at frame 0 and let the skin leave. If the castings are already visible at 0.0s, the first beat has nothing to reveal.
2. At the front axle, find two ice motors. The wishbones should already be gone before the wheels turn.
3. Through the tunnel, follow one yellow packet from controller to controller. If you need a name, read the HUD.
4. On the rear rack, watch the red linkage reach both directions and stop inside 10 degrees.
5. On the way out, watch the four links reach the castings, then the hold. The clock should end at 34.00s on frame 1020.

If you only have a minute, press 2, then 4, then 5.

## The same clock on another machine

Keep `timeline.mjs`. Replace the meshes in `jig.mjs`. The five beats do not know they are a pickup. They know a shell comes off, a primary actuator gets a hero, a network gets a dolly, a second actuator gets a macro, and a structural element closes the shot.

A robot arm can explode covers, lock on a wrist actuator, dolly a 48-volt bus, macro a brake, and seat a battery in the base. A landing-gear bay can do the same with doors, a lock actuator, a data bus, a sidestay, and the trunnion fittings. A battery cabinet can do it with skins, contactors, a monitoring loop, a rack bus, and the structural rails.

What you must not reuse blindly is the camera. These keys were moved until they stopped intersecting panels. A new machine needs its own clearance pass, with stills at the start, the hero, the dolly, the macro, and the wide hold. A black frame usually means the camera is inside a part.

## What I would not add next

A 3D label pass. It already failed, and the HUD is the naming layer.

A fake specification block. No mass, no range, no charge time, no grade of steel beyond the color we actually set.

A tracking script. The page is a film. Measurement can wait until there is a question the frame clock cannot answer.

An export is a separate job. The player is the source of truth for timing. A movie file is a sample of frames 0 through 1019, and it should be probed before anyone quotes its duration.

## Where to go from the article

Play it: [https://mizcausevic-dev.github.io/ev-pickup-anatomy-jig/](https://mizcausevic-dev.github.io/ev-pickup-anatomy-jig/)

Read the clock: [timeline.mjs](https://github.com/mizcausevic-dev/ev-pickup-anatomy-jig/blob/main/timeline.mjs)

Read the tests: [test/timeline.test.mjs](https://github.com/mizcausevic-dev/ev-pickup-anatomy-jig/blob/main/test/timeline.test.mjs)

The decision this study is built to support is simple. If a 34-second chassis film cannot be seeked to a frame and still tell the truth, it is a render. If it can, it is a jig. This one can.
