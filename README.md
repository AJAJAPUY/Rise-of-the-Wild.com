# 🦁 Rise of the Wild

A pixel-art open-world animal adventure game. Explore 8 unique biomes, battle and catch over 35 animals, and build your collection!

---

## 🚀 Running in VS Code

### Option 1 — Live Server (Recommended)
1. Open this folder in **VS Code**
2. Install the **Live Server** extension (Ritwick Dey)
3. Right-click `index.html` → **"Open with Live Server"**
4. Game opens at `http://127.0.0.1:5500`

### Option 2 — No Extensions
1. Open the folder in VS Code
2. Open a terminal: `Ctrl+`` ` (backtick)
3. Run: `npx serve .`
4. Open the URL shown (usually `http://localhost:3000`)

### Option 3 — Python (if installed)
```bash
python -m http.server 8080
```
Then open `http://localhost:8080`

> ⚠️ **Do NOT just double-click index.html** — browsers block local JS module loading.  
> Always use a local server (Live Server, npx serve, or Python).

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| `W A S D` or `Arrow Keys` | Move player |
| Walk near an animal | Trigger encounter |
| `I` | Toggle inventory / collection |
| `🎒 Bag` button | Open inventory |
| `✕ Quit` | Return to login |

---

## 🗺️ Biomes & Animals

| Biome | Location | Notable Animals |
|-------|----------|-----------------|
| Plains | Start | Rabbit, Fox, Wolf, Bison |
| Water Realm | Zone 2 | Duck, Otter, Crocodile, Shark |
| Tropical Forest | Zone 3 | Jaguar, Sloth, Capybara, Philippine Eagle |
| Mountain Range | Zone 4 | Grizzly Bear, Snow Leopard, Condor |
| Frozen Tundra | Zone 5 | Polar Bear, Penguin, Reindeer |
| Sunset Savanna | Zone 6 | Lion, Elephant, Giraffe |
| Deep Ocean | Zone 7 | Blue Whale, Orca, Giant Octopus |
| Volcanic Peaks | Zone 8 | Komodo Dragon, Phoenix Bird |

---

## 📁 File Structure
```
rise-of-the-wild/
├── index.html          ← Main entry point
├── css/
│   └── style.css       ← All styles
├── js/
│   ├── data.js         ← Biomes, animals, houses data
│   ├── accounts.js     ← User account management
│   ├── auth.js         ← Login / create account screen
│   ├── loading.js      ← Loading screen & dino animation
│   ├── draw.js         ← Pixel art draw functions
│   ├── world.js        ← World generation & rendering
│   ├── encounter.js    ← Battle / catch system
│   └── game.js         ← Main game loop
└── README.md
```

---

## 🔐 Default Login
- **Username:** `admin`
- **Password:** `admin123`

Accounts are saved in your browser's `localStorage`.

---

## ✨ Features
- 8 distinct biomes with unique color palettes and weather
- 35+ animals across all biomes (common → legendary)
- Breathing & idle animations for all characters
- Wandering animals with AI patrol
- Catch system with HP-based catch rate
- XP & level-up system
- HP restoration at inns and igloos
- Minimap with live animal locations
- Multi-language support (EN / ES / FR)
- Inventory / collection panel
- 8 interactive buildings
