# Particle Animation Placeholders

## Naming Convention
`frame_XX_WxH.png` where XX is frame number (01-08)

## Animation Specifications

### explosion_small/ (6 frames, 32x32)
- frame_01_32x32.png through frame_06_32x32.png
- Duration: 0.3 seconds
- Colors: #ff4444, #ff8844, #ffcc44, #ffffff

### explosion_medium/ (8 frames, 64x64)
- frame_01_64x64.png through frame_08_64x64.png
- Duration: 0.4 seconds
- Same color palette as small

### explosion_large/ (8 frames, 128x128)
- frame_01_128x128.png through frame_08_128x128.png
- Duration: 0.6 seconds
- Boss/elite deaths

### thrust_flame/ (6 frames, 24x48)
- frame_01_24x48.png through frame_06_24x48.png
- Duration: looping
- Colors: #ff8800, #ffaa00, #ffffff core

### muzzle_flash/ (4 frames, 32x32)
- frame_01_32x32.png through frame_04_32x32.png
- Duration: 0.1 seconds
- Bright white/yellow flash

### shield_hit/ (6 frames, 64x64)
- frame_01_64x64.png through frame_06_64x64.png
- Duration: 0.4 seconds
- Colors: #4488ff ripple effect

### loot_glow/ (per rarity, 6 frames each, 48x48)
- common_frame_01_48x48.png through common_frame_06_48x48.png
- uncommon_frame_01_48x48.png through uncommon_frame_06_48x48.png
- rare_frame_01_48x48.png through rare_frame_06_48x48.png
- epic_frame_01_48x48.png through epic_frame_06_48x48.png
- legendary_frame_01_48x48.png through legendary_frame_06_48x48.png
- mythic_frame_01_48x48.png through mythic_frame_06_48x48.png

## JSON Metadata Format
Each folder can include an optional `animation.json`:
```json
{
  "frameCount": 6,
  "frameDuration": 0.05,
  "loop": false,
  "size": [32, 32]
}
```

## Notes
- Use transparent PNG format
- Keep animations smooth (ease in/out)
- Mythic glow should be most impressive
