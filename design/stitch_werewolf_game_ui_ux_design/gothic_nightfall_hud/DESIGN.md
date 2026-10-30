---
name: Gothic Nightfall HUD
colors:
  surface: '#0f131d'
  surface-dim: '#0f131d'
  surface-bright: '#353944'
  surface-container-lowest: '#0a0e18'
  surface-container-low: '#171b26'
  surface-container: '#1c1f2a'
  surface-container-high: '#262a35'
  surface-container-highest: '#313540'
  on-surface: '#dfe2f1'
  on-surface-variant: '#bdc8d1'
  inverse-surface: '#dfe2f1'
  inverse-on-surface: '#2c303b'
  outline: '#87929a'
  outline-variant: '#3e484f'
  surface-tint: '#7bd0ff'
  primary: '#8ed5ff'
  on-primary: '#00354a'
  primary-container: '#38bdf8'
  on-primary-container: '#004965'
  inverse-primary: '#00668a'
  secondary: '#ddb7ff'
  on-secondary: '#490080'
  secondary-container: '#6f00be'
  on-secondary-container: '#d6a9ff'
  tertiary: '#ffbcb7'
  on-tertiary: '#68000a'
  tertiary-container: '#ff938c'
  on-tertiary-container: '#8d0012'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c4e7ff'
  primary-fixed-dim: '#7bd0ff'
  on-primary-fixed: '#001e2c'
  on-primary-fixed-variant: '#004c69'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6900b3'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#0f131d'
  on-background: '#dfe2f1'
  surface-variant: '#313540'
typography:
  headline-xl:
    fontFamily: Syne
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Syne
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Syne
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: 0em
  headline-sm:
    fontFamily: Syne
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.06em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.12em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.25rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system channels an immersive, high-stakes psychological battlefield set within a dark gothic fantasy realm. Engineered for competitive, social deception gameplay, the visual style synthesizes eerie medieval lore with a sleek, cinematic desktop HUD interface.

The aesthetic fuses **Tactile Dark Glassmorphism** with **Neo-Gothic Precision**:
- **Atmosphere:** Pitch-black midnight ambiance evoking midnight trials, mist-laden villages, and moonlit paranoia. 
- **Emotional Response:** Tense anticipation, covert alliances, visceral urgency during voting sequences, and ethereal mystery during the night phase.
- **Visual Texture:** Smoked obsidian glass panels, delicate engraved silver filigree borders, directional moonlight rim lighting, and blood-curdling crimson indicators that signal lethal werewolf actions.

## Colors

The palette is engineered specifically for deep-contrast darkness, clarity during intense game sequences, and strict thematic phase signaling (Day vs. Night vs. Elimination).

- **Primary (`#38BDF8` - Lunar Cyan):** The divine glow of moonlight, clarity, villager deductions, seer revelations, and primary interactive affordances.
- **Secondary (`#A855F7` - Eerie Violet):** The mystical arcane essence representing witchcraft, deception, occult roles, and passive magical statuses.
- **Tertiary (`#EF4444` - Blood Crimson):** Raw lethal threat, werewolf voting trails, execution countdowns, and catastrophic warnings. Sub-shaded into `#991B1B` for active kill targeting.
- **Neutral Core (`#0B0F19` & `#111827` - Obsidian Midnight):** Multi-tier surface foundation. Absorbs harsh contrasts, prevents screen fatigue during prolonged gameplay sessions, and gives luminescence to active game elements.
- **Silver Sheen (`#E2E8F0`):** Refined, crisp metallic highlights used for ornate role badges, inactive frame trims, and legible iconography.

## Typography

The type system blends medieval architectural presence with tactical gaming efficiency:

- **Display & Role Headers (`Syne`):** Boasts distinctive, sculptured contours and sharp geometric flares that invoke ancient runes, stone carvings, and modern high-fantasy titles without sacrificing digital legibility.
- **HUD Readouts & Meta Labels (`Space Grotesk`):** Provides a calculated, mechanical undertone for turn phases, player statuses, timers, vote counts, and system telemetry.
- **Narrative & Chat Text (`Geist`):** Delivers ultra-clean, neutral micro-legibility inside dynamic combat logs, player arguments, role descriptions, and whisper chats.

## Layout & Spacing

A desktop-first, cockpit-style HUD layout calibrated for 16:9 and ultrawide resolutions:

- **Screen Architecture:** A fixed 3-column command layout comprising:
  - **Left Rail (280px–320px):** Action logs, role compendium, active graveyard, and game history.
  - **Center Stage (Fluid):** The Village Square / Gathering Table. Circular or grid-oriented participant cards, active trial podium, and central phase/night wheel.
  - **Right Rail (340px–380px):** Audio frequency bars, text chat with whisper channels, and the personal secret role compartment.
- **Rhythm & Grid:** Anchored to an 8px spatial grid. Component inner padding scales with `space-sm` (8px) and `space-md` (16px), while outer game dashboard panels sit apart via `gutter` (20px).
- **Responsive Handling:** When constrained below 1280px desktop viewports, side panels collapse into slide-out glass drawers, ensuring the central player circle maintains uncompromised visibility.

## Elevation & Depth

Depth mimics layered dark obsidian slabs suspended over moonlit mist:

- **Base Layer (Canvas):** Dark void (`#0B0F19`) accented by localized radial mesh gradients—ethereal cyan at the top apex during Day, shifting to eerie violet and blood crimson under Night or Blood Moon events.
- **HUD Panels (Frosted Glass):** `#111827` at 65% opacity combined with `backdrop-filter: blur(16px)` and a precise `1px` translucent border (`rgba(226, 232, 240, 0.08)`).
- **Glow & Rim Lighting:** Rather than conventional drop shadows, hierarchy is established via colored luminescent halos:
  - Villager/Investigative Focus: `0 0 20px rgba(56, 189, 248, 0.25)`
  - Werewolf Target / Kill Intent: `0 0 24px rgba(239, 68, 68, 0.35)`
  - Occult / Witchcraft Status: `0 0 20px rgba(168, 85, 247, 0.3)`
- **Hover & Active Depths:** Floating elements step forward using an elevated inner rim (`inset 0 1px 0 rgba(255, 255, 255, 0.15)`).

## Shapes

The design system adopts **Soft Angularity** (Level 1):
- Elements feature restrained corner radii (4px to 8px max), evoking hand-cut obsidian stones and gothic parchment plaques.
- High-level containers feature subtle 45-degree chamfered corners (`clip-path: polygon(...)`) on top-left and bottom-right edges to impart an authentic fantasy HUD relic feel.
- Avatar frames and voting reticles leverage concentric circles enclosed in sharp hexagonal or octagonal filigree rings.

## Components

### Role Cards & Player Podiums
- **Base:** Vertical obsidian cards with frosted glass backing, 4px corner radius, and subtle outer silver rim.
- **State Indicators:**
  - *Alive:* Full opacity with player avatar and real-time audio wave border.
  - *Targeted/Accused:* Pulsing red perimeter with voting pins stacked at the bottom-right.
  - *Slain/Exiled:* Desaturated grayscale overlay, 40% opacity, overlaid with a bloody gothic slash badge.

### Buttons & Phase Actions
- **Primary (Nightfall Action / Vote Confirm):** Glowing cyan or crimson fill, black bold `Space Grotesk` uppercase text, framed with sharp corner trims. Hover triggers an expanding atmospheric bloom.
- **Ghost/Tertiary:** Smoked glass button with silver border (`#E2E8F0` at 20%), transitioning to white-silver glow on hover.

### Timer Progress Bars
- High-tension countdown elements positioned prominently across the central viewport.
- A slim 4px metallic track housing a molten energy fill that changes dynamically: starts Moon Cyan (`#38BDF8`), shifts to Arcane Violet (`#A855F7`) at 50%, and flashes frantic Werewolf Blood Red (`#EF4444`) with strobe effects during the final 10 seconds.

### Voice Chat & Audio HUD
- Integrated into player podiums via radial frequency rings.
- Dynamic decibel amplitude translates into expanding cyan waves. If a player is silenced or dead, a crimson skull icon locks the voice node with a jagged slashed border.

### Voting Badges & Reticles
- Small octagonal tokens bearing the voter’s personal seal.
- Drag-and-drop targeting displays a tethered lunar-laser particle trace from the voter to the accused player's podium.

### Input Fields & Chat Channels
- Inset smoky backgrounds (`#0B0F19` at 80% opacity) with bottom-heavy active borders.
- Dedicated tab chips to alternate between *All Village*, *Werewolf Lair (Night Only)*, *Dead Spectators*, and *Whisper*.