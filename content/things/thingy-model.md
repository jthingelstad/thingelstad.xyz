---
title: Thingy Model
summary: A poseable Blender character built from Thingy’s original illustration, with a shared skeleton, four outfits, a screen face with moods, and tools in hand.
collection: Art & archives
status: active
started: '2026-11-01'
topics:
  - making
  - agents
sources:
  - kind: website
    url: https://thingy.thingelstad.com/about/
    role: reference
  - kind: website
    url: https://thingelstad.xyz/interviews/jamie-october-2026/#q33
    role: reference
connections:
  - to: thingy
    label: gives a body to
    detail: The librarian’s original illustration becomes an editable character with a skeleton, clothing, and gestures.
    source: https://thingelstad.xyz/things/thingy-model/#artifacts
  - to: things-ive-built
    label: depicts the librarian of
    detail: Thingy keeps this site. The model gives its librarian poses and outfits for different settings.
    source: https://thingelstad.xyz/about/
story:
  color: '#df8541'
  introduction: The librarian, from more than one angle.
  engineering:
    - An editable Blender master holds the body, articulated hands, clothing, props, and a shared 40-bone skeleton.
    - Four outfits switch on the same rig. The concert outfit replaces the standard ear housings with over-ear headphones.
    - The bow tie’s dots and the name badge’s lettering are packed image textures on their surfaces.
    - The face is an image on the screen. One atlas holds the original expression, the four Ask Thingy moods, and their blinks; a single control picks one.
    - The antenna’s lens switches on to a heart-red glow, with a light inside it and a halo. Unlit, it stays tangerine.
    - A tool switch puts a screwdriver, hammer, drill, or laptop in hand. Each hand tool has a solved grip and its own carry, show, and work poses.
    - The coat is brushed felt and the vest worn canvas, with rolled lapels, topstitching, and folds bound to the same skeleton.
    - Pose assets and short animation studies test waving, sitting, walking, and presenting a laptop. Animator controls and motion still need refinement.
  stack:
    - Blender
    - Python
    - Image textures
  source: https://thingelstad.xyz/interviews/jamie-october-2026/#q33
  sourceLabel: Jamie on Thingy in three dimensions
  related:
    - thingy
    - things-ive-built
  started: Begun November 2026
  questions:
    - How did Thingy’s illustration become a model?
    - Which outfits share the same skeleton?
    - What still needs work before animation and printing?
bundles:
  - id: foundations
    title: From illustration to body
    caption: The reference, the first clothed prototype, and the work on proportions. These are successive checkpoints, not alternate finished characters.
  - id: surfaces-and-motion
    title: Light, fabric, and movement
    caption: Studies in lighting, surface detail, and articulation. The greeting and lit antenna retain earlier ear shapes.
  - id: wardrobe
    title: One character, four outfits
    caption: The first wardrobe studies, followed by the concert headphones. Clothing and props share the body’s rig.
  - id: ear-refinements
    title: Returning to the reference
    caption: The ear housings become smoother, then move out to sit against the head. The full librarian render is the v0.10 checkpoint.
  - id: screen-face
    title: A face on the screen
    caption: At v0.11 the face became a picture on the screen, so a new expression is a new drawing rather than new geometry.
  - id: workshop-tools
    title: Tools in hand
    caption: At v0.12 the laptop gave way to a switch of tools, each with its own grip and poses, and the beacon turned heart red.
  - id: cloth
    title: Cloth with a feel
    caption: A study of why the clothes read flat, then the v0.13 pass that answers it with light, felt, stitching, and folds.
  - id: two-sites
    title: The librarian and the builder
    caption: The v0.13 checkpoint in the two outfits meant for Jamie’s sites, the librarian for Ask Thingy and the workshop builder for this one.
artifacts:
  - file: original-illustration.png
    bundle: foundations
    title: The original illustration
    caption: The cream shell, dark screen, navy coat, orange bow tie, and short mechanical legs that the model follows. The back and concealed construction have to be inferred from this one view.
    source: https://thingy.thingelstad.com/
  - file: first-prototype-v01.png
    bundle: foundations
    title: The first clothed prototype · v0.1
    caption: An early render with the librarian’s coat and raised finger. The proportions, hands, and feet would all be revisited.
    date: '2026-11-01'
  - file: legs-and-feet-v03.png
    bundle: foundations
    title: Legs, ankles, and feet · v0.3
    caption: Short shafts, collars, lower ankle cuffs, and shallow foot caps, rebuilt against the original. Their construction also informed the arms.
    date: '2026-11-01'
  - file: likeness-comparison-v04.jpg
    bundle: foundations
    title: The illustration beside the model · v0.4
    caption: A comparison in the raised-finger pose after revisions to the head, screen, hands, and fitted coat. The later ear and surface corrections are still ahead.
    date: '2026-11-01'
  - file: lighting-study-v05.jpg
    bundle: surfaces-and-motion
    title: Isolating the jacket lighting · v0.5
    caption: The baseline, added jacket lights with the same material, and those lights with finer fabric relief. The study separates what the lighting changes from what the material changes.
    date: '2026-11-01'
  - file: fabric-and-printed-details-v07.jpg
    bundle: surfaces-and-motion
    title: Printed details and fitted pockets · v0.7
    caption: Bow tie dots and badge lettering are image maps rather than floating pieces. The pockets follow the coat and use the same wool texture.
    date: '2026-11-01'
  - file: antenna-lit-v06.png
    bundle: surfaces-and-motion
    title: The antenna switched on · v0.6
    caption: A close view of the glowing lens. Its light can be switched off independently of the pose; the ear housings shown here were replaced later.
    date: '2026-11-01'
  - file: hello-v05.mp4
    preview: hello-preview-v05.png
    bundle: surfaces-and-motion
    title: A four-second greeting · v0.5
    caption: A downloadable MP4 of the raised finger becoming an open-hand wave, rendered at 24 frames per second. It records an earlier model, before the printed details and ear revisions.
    date: '2026-11-01'
  - file: four-outfits-v07.jpg
    bundle: wardrobe
    title: The first four outfits · v0.7
    caption: Librarian, trail companion, workshop builder, and concert companion in the same pose and camera. This sheet predates the smooth ear housings and concert headphones.
    date: '2026-11-01'
  - file: context-poses-v07.jpg
    bundle: wardrobe
    title: Trail, workshop, and concert studies · v0.7
    caption: A hiking shell and daypack, a canvas vest with a supported laptop, and a short concert jacket with a sound-wave shirt. These pose studies still show the earlier ears.
    date: '2026-11-01'
  - file: concert-headphones-v09.png
    bundle: wardrobe
    title: Over-ear headphones for the concert · v0.9
    caption: Cushioned ear cups replace the standard ears for this outfit. A padded headband passes behind the antenna; the short jacket, orange shirt, and wristband remain.
    date: '2026-11-01'
  - file: smooth-ear-comparison-v08.jpg
    bundle: ear-refinements
    title: From stacked rings to a continuous housing · v0.8
    caption: The original illustration, the previous ear, and its replacement under matching model lighting. One tapered shell replaces the stepped construction.
    date: '2026-11-01'
  - file: ear-placement-comparison-v010.jpg
    bundle: ear-refinements
    title: Sitting against the head · v0.10
    caption: The smoother shape is preserved while the housing moves outward. Its inner mounting face follows the curved head rather than sinking into it.
    date: '2026-11-01'
  - file: librarian-v010.png
    bundle: ear-refinements
    title: The librarian at v0.10
    caption: The v0.10 modeling checkpoint, with printed bow tie and badge, fitted pockets, textured wool, and the revised ears. The original raised-finger pose remains the comparison point.
    date: '2026-11-01'
  - file: faces-on-the-screen-v011.jpg
    bundle: screen-face
    title: Every face on the screen · v0.11
    caption: The original expression, the four Ask Thingy moods (idle, thinking, found it, oops), two blinks, and the screen switched off. The original is traced from the modeled strokes of v0.10.
    date: '2026-11-03'
  - file: face-spot-check-v011.jpg
    bundle: screen-face
    title: Checked against the original · v0.11
    caption: The illustration, the v0.10 modeled strokes, and the v0.11 screen image under matching camera and lights. The face reads the same; the illustration is drawn from a slightly different angle.
    date: '2026-11-03'
  - file: moods-per-site-v011.jpg
    bundle: screen-face
    title: Poses and faces chosen per site · v0.11
    caption: A first pairing of poses and faces for four moments on each site, a welcome, a search, an answer, and an error. The librarian is for Ask Thingy and the workshop builder for this site; the pose and the face are chosen separately.
    date: '2026-11-03'
  - file: tool-switch-v012.jpg
    bundle: workshop-tools
    title: The tool switch · v0.12
    caption: Beside the original illustration, the five settings of one control, none, screwdriver, hammer, drill, and laptop. The tools follow the right hand in any outfit; the laptop keeps its left-hand pose.
    date: '2026-11-03'
  - file: tool-poses-v012.jpg
    bundle: workshop-tools
    title: Carry, show, and work · v0.12
    caption: Each hand tool in its three poses, in the workshop outfit. The face is still its own choice.
    date: '2026-11-03'
  - file: tool-grips-v012.jpg
    bundle: workshop-tools
    title: Grips, close up · v0.12
    caption: Every finger closes until it is within three millimeters of the handle, and the thumb wraps without entering the tool. The drill’s index finger rests on the trigger.
    date: '2026-11-03'
  - file: heart-red-beacon-v012.jpg
    bundle: workshop-tools
    title: A heart-red beacon · v0.12
    caption: The lit beacon at v0.11 and v0.12 on light and dark pages. A deep red core and rim, a red light inside the lens, and a red halo; unlit, the ball stays tangerine, as drawn.
    date: '2026-11-03'
  - file: cloth-study-v012.jpg
    bundle: cloth
    title: Why the jacket read flat · v0.12
    caption: More samples changed nothing. Removing three fill lights that lit only the jacket brought back the deep navy; what remained was modeling, with no folds, seams, stitching, or rolled edges.
    date: '2026-11-03'
  - file: jacket-v013.jpg
    bundle: cloth
    title: The jacket relit · v0.13
    caption: The illustration, v0.12, and v0.13 at the same view. One warm key now lights the navy cloth from the side, so the jacket has a light side and a shadow side; the tone and range are measured on each figure.
    date: '2026-11-03'
  - file: cloth-construction-v013.jpg
    bundle: cloth
    title: Rolled lapels and topstitching · v0.13
    caption: The lapels and collars are rolled felt rather than flat ribbons. Dashed navy thread follows the lapels, pockets, cuffs, front, and hem, each stitch pressed into the cloth.
    date: '2026-11-03'
  - file: cloth-folds-v013.jpg
    bundle: cloth
    title: Folds that follow the body · v0.13
    caption: Folds at the elbows, down the back, and at the sides, flattened wherever a hand brushes the coat. They move with the skeleton in every pose.
    date: '2026-11-03'
  - file: workshop-cloth-v013.jpg
    bundle: cloth
    title: Worn canvas and tan thread · v0.13
    caption: The workshop vest shows its weave and wear, with tan topstitching along its edge and pockets. The vest and sleeves fold like the coat.
    date: '2026-11-03'
  - file: librarian-thinking-v013.png
    bundle: two-sites
    title: The librarian, thinking · v0.13
    caption: The librarian outfit with the thinking face and gesture, the pairing first proposed for a search on Ask Thingy.
    date: '2026-11-03'
  - file: workshop-hammer-v013.png
    bundle: two-sites
    title: The builder with a hammer · v0.13
    caption: The workshop outfit showing the hammer, with the found-it face. This is the latest modeling checkpoint.
    date: '2026-11-03'
---

Thingy Model is an editable three-dimensional version of [Jamie’s librarian](https://thingelstad.xyz/things/thingy/). The cream robot, navy coat, orange bow tie, and raised finger come from the original illustration. A body beneath the clothes gives the character joints that can be posed and animated.

Jamie described the idea in his interview: [“Thingy should actually be a 3D model and be able to move around and engage with people”](https://thingelstad.xyz/interviews/jamie-october-2026/#q33). He began building the model with Codex in November 2026, reviewing renders and the character live in Blender. From v0.11, on the third of November, Claude Code carried the work forward in Blender 5.2. The original image stayed beside the work. The artifacts below keep the intermediate models as well as the corrections.

The first prototype established the clothed character. Then the work went underneath the jacket: shorter mechanical legs, ankle collars, shallower feet, and arms built from the same vocabulary. Later passes returned to the head and hands, separated the shirt from the lapels, lowered the bow tie, and fitted the pockets to the coat. Lighting studies made the navy fabric easier to read. The bow tie’s dots and the badge’s letters became images wrapped onto their surfaces.

Four outfits now share one skeleton. The librarian wears the navy wool coat. The trail companion has a forest-green shell, orange daypack, and folded map. The workshop builder wears an indigo canvas vest and holds a tool: a screwdriver, hammer, drill, or laptop. The concert companion has a charcoal jacket, orange sound-wave shirt, wristband, and over-ear headphones in place of the usual ears. The antenna light can be switched on or off.

At v0.10 the standard ears took a continuous tapered shape and moved out to sit against the head’s surface. At v0.11 the face became a picture on the screen. Beside the original expression are the four moods Ask Thingy uses, and the pose and the face are chosen separately: the librarian for Ask Thingy, the workshop builder for this site. At v0.12 the laptop gave way to a switch of tools, each with a grip solved so every finger closes on the handle, and the lit antenna turned heart red.

A study then showed why the clothes read flat. Lights meant to brighten the navy washed it out, and the cloth had no folds, seams, or stitching. The v0.13 pass relit the jacket, gave the coat brushed felt and the vest worn canvas, rolled the lapels, and added topstitching and folds that follow every pose.

The latest checkpoint is v0.13. The rig and short performance studies are working prototypes. More animation controls, facial acting, and clothing adjustments remain, as does preparing and testing a physical print for Jamie’s Bambu P2S. The page keeps the building process; it does not offer a finished print file.
