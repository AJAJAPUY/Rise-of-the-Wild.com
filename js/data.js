// ═══════════════════════════════════════════════════
//  RISE OF THE WILD — data.js
//  All game data: biomes, animals, houses, items
// ═══════════════════════════════════════════════════

window.GAME_DATA = {

  // ── BIOMES ─────────────────────────────────────
  // World is 6000 wide × 2400 tall
  // x ranges define horizontal biome strips
  biomes: [
    { id: 'plains',   name: 'Plains',         xStart: 0,    xEnd: 700,  color: '#5a9e3a', skyTop: '#87ceeb', skyBot: '#c8efff', groundColor: '#4a8a2a', groundDark: '#3a7a1a' },
    { id: 'water',    name: 'Water Realm',     xStart: 700,  xEnd: 1300, color: '#1a6aaa', skyTop: '#1a3a6a', skyBot: '#2a5aaa', groundColor: '#0a3a6a', groundDark: '#082a50' },
    { id: 'tropical', name: 'Tropical Forest', xStart: 1300, xEnd: 2100, color: '#1a8a1a', skyTop: '#2aaa2a', skyBot: '#8ad44a', groundColor: '#0a6a0a', groundDark: '#085008' },
    { id: 'mountain', name: 'Mountain Range',  xStart: 2100, xEnd: 2900, color: '#7a6a5a', skyTop: '#c0b0a0', skyBot: '#e8e0d8', groundColor: '#5a4a3a', groundDark: '#3a2a1a' },
    { id: 'snow',     name: 'Frozen Tundra',   xStart: 2900, xEnd: 3700, color: '#c8dce8', skyTop: '#a0c8e0', skyBot: '#e8f4fc', groundColor: '#d8eaf8', groundDark: '#b0cce0' },
    { id: 'plains2',  name: 'Sunset Savanna',  xStart: 3700, xEnd: 4500, color: '#c8882a', skyTop: '#e05a00', skyBot: '#f0a840', groundColor: '#8a6010', groundDark: '#6a4a08' },
    { id: 'water2',   name: 'Deep Ocean',      xStart: 4500, xEnd: 5100, color: '#0a2a5a', skyTop: '#050f2a', skyBot: '#0a2040', groundColor: '#040c20', groundDark: '#020608' },
    { id: 'volcanic', name: 'Volcanic Peaks',  xStart: 5100, xEnd: 6000, color: '#8a1a00', skyTop: '#3a0800', skyBot: '#7a1800', groundColor: '#5a0a00', groundDark: '#3a0600' },
  ],

  // ── ANIMALS ────────────────────────────────────
  animals: [
    // PLAINS
    { id: 'rabbit',    name: 'Wild Rabbit',     emoji: '🐇', biome: 'plains',   hp: 20,  xp: 8,   score: 10, catchRate: 0.75, rarity: 'common',    desc: 'A skittish plains rabbit.' },
    { id: 'fox',       name: 'Red Fox',         emoji: '🦊', biome: 'plains',   hp: 45,  xp: 18,  score: 25, catchRate: 0.5,  rarity: 'common',    desc: 'Cunning and quick.' },
    { id: 'deer',      name: 'White-tail Deer', emoji: '🦌', biome: 'plains',   hp: 60,  xp: 25,  score: 35, catchRate: 0.45, rarity: 'uncommon',  desc: 'Graceful deer of the plains.' },
    { id: 'wolf',      name: 'Gray Wolf',       emoji: '🐺', biome: 'plains',   hp: 80,  xp: 35,  score: 50, catchRate: 0.35, rarity: 'uncommon',  desc: 'Pack hunter, dangerous alone.' },
    { id: 'bison',     name: 'Bison',           emoji: '🦬', biome: 'plains',   hp: 120, xp: 50,  score: 80, catchRate: 0.25, rarity: 'rare',      desc: 'Massive plains giant.' },
    // WATER
    { id: 'duck',      name: 'Mallard Duck',    emoji: '🦆', biome: 'water',    hp: 25,  xp: 10,  score: 12, catchRate: 0.7,  rarity: 'common',    desc: 'Paddle paddle.' },
    { id: 'frog',      name: 'Giant Frog',      emoji: '🐸', biome: 'water',    hp: 35,  xp: 14,  score: 18, catchRate: 0.6,  rarity: 'common',    desc: 'Ribbit!' },
    { id: 'otter',     name: 'River Otter',     emoji: '🦦', biome: 'water',    hp: 50,  xp: 22,  score: 30, catchRate: 0.5,  rarity: 'uncommon',  desc: 'Playful river otter.' },
    { id: 'croc',      name: 'Crocodile',       emoji: '🐊', biome: 'water',    hp: 100, xp: 45,  score: 70, catchRate: 0.25, rarity: 'rare',      desc: 'Ancient apex predator.' },
    { id: 'shark',     name: 'Bull Shark',      emoji: '🦈', biome: 'water',    hp: 130, xp: 55,  score: 90, catchRate: 0.2,  rarity: 'rare',      desc: 'Dangerous in shallow water.' },
    // TROPICAL
    { id: 'parrot',    name: 'Scarlet Macaw',   emoji: '🦜', biome: 'tropical', hp: 30,  xp: 12,  score: 15, catchRate: 0.65, rarity: 'common',    desc: 'Vivid tropical bird.' },
    { id: 'monkey',    name: 'Spider Monkey',   emoji: '🐒', biome: 'tropical', hp: 45,  xp: 20,  score: 28, catchRate: 0.55, rarity: 'common',    desc: 'Swings through the canopy.' },
    { id: 'capybara',  name: 'Capybara',        emoji: '🐾', biome: 'tropical', hp: 55,  xp: 22,  score: 30, catchRate: 0.6,  rarity: 'common',    desc: 'The chill giant rodent.' },
    { id: 'sloth',     name: 'Three-Toe Sloth', emoji: '🦥', biome: 'tropical', hp: 40,  xp: 18,  score: 25, catchRate: 0.7,  rarity: 'common',    desc: '...Slowly approaching...' },
    { id: 'toucan',    name: 'Toucan',          emoji: '🦜', biome: 'tropical', hp: 35,  xp: 14,  score: 20, catchRate: 0.6,  rarity: 'common',    desc: 'That bill though!' },
    { id: 'anaconda',  name: 'Anaconda',        emoji: '🐍', biome: 'tropical', hp: 90,  xp: 40,  score: 60, catchRate: 0.3,  rarity: 'uncommon',  desc: 'Massive jungle constrictor.' },
    { id: 'jaguar',    name: 'Jaguar',          emoji: '🐆', biome: 'tropical', hp: 110, xp: 48,  score: 75, catchRate: 0.22, rarity: 'rare',      desc: 'Apex jungle predator.' },
    { id: 'ph_eagle',  name: 'Philippine Eagle',emoji: '🦅', biome: 'tropical', hp: 95,  xp: 42,  score: 68, catchRate: 0.2,  rarity: 'legendary', desc: 'Critically endangered king of birds.' },
    // MOUNTAIN
    { id: 'goat',      name: 'Mountain Goat',   emoji: '🐐', biome: 'mountain', hp: 55,  xp: 22,  score: 30, catchRate: 0.55, rarity: 'common',    desc: 'Sure-footed cliff dweller.' },
    { id: 'eagle',     name: 'Golden Eagle',    emoji: '🦅', biome: 'mountain', hp: 70,  xp: 30,  score: 45, catchRate: 0.4,  rarity: 'uncommon',  desc: 'Soars on mountain thermals.' },
    { id: 'condor',    name: 'Andean Condor',   emoji: '🦅', biome: 'mountain', hp: 80,  xp: 36,  score: 55, catchRate: 0.35, rarity: 'uncommon',  desc: 'Massive wingspan, majestic.' },
    { id: 'bear',      name: 'Grizzly Bear',    emoji: '🐻', biome: 'mountain', hp: 150, xp: 65,  score: 100,catchRate: 0.18, rarity: 'rare',      desc: 'King of the mountains.' },
    { id: 'snow_leopard',name:'Snow Leopard',   emoji: '🐈', biome: 'mountain', hp: 120, xp: 52,  score: 85, catchRate: 0.2,  rarity: 'legendary', desc: 'Ghost of the mountains.' },
    // SNOW
    { id: 'penguin',   name: 'Emperor Penguin', emoji: '🐧', biome: 'snow',     hp: 40,  xp: 16,  score: 22, catchRate: 0.65, rarity: 'common',    desc: 'Wobble wobble.' },
    { id: 'seal',      name: 'Leopard Seal',    emoji: '🦭', biome: 'snow',     hp: 75,  xp: 32,  score: 48, catchRate: 0.4,  rarity: 'uncommon',  desc: 'Fearsome hunter on ice.' },
    { id: 'arctic_fox',name:'Arctic Fox',       emoji: '🦊', biome: 'snow',     hp: 50,  xp: 20,  score: 28, catchRate: 0.55, rarity: 'common',    desc: 'White coat for camouflage.' },
    { id: 'polar_bear',name:'Polar Bear',       emoji: '🐻‍❄️',biome: 'snow',   hp: 160, xp: 70,  score: 110,catchRate: 0.15, rarity: 'legendary', desc: 'King of the arctic.' },
    { id: 'reindeer',  name: 'Reindeer',        emoji: '🦌', biome: 'snow',     hp: 65,  xp: 28,  score: 40, catchRate: 0.5,  rarity: 'uncommon',  desc: 'Pulling sleds since forever.' },
    // SAVANNA (plains2)
    { id: 'zebra',     name: 'Plains Zebra',    emoji: '🦓', biome: 'plains2',  hp: 70,  xp: 28,  score: 40, catchRate: 0.45, rarity: 'common',    desc: 'Striped and fast.' },
    { id: 'giraffe',   name: 'Giraffe',         emoji: '🦒', biome: 'plains2',  hp: 90,  xp: 38,  score: 58, catchRate: 0.35, rarity: 'uncommon',  desc: 'Tallest land animal.' },
    { id: 'elephant',  name: 'African Elephant',emoji: '🐘', biome: 'plains2',  hp: 200, xp: 85,  score: 150,catchRate: 0.1,  rarity: 'legendary', desc: 'Largest land animal.' },
    { id: 'hyena',     name: 'Spotted Hyena',   emoji: '🐺', biome: 'plains2',  hp: 80,  xp: 34,  score: 52, catchRate: 0.38, rarity: 'uncommon',  desc: 'Laughing scavenger.' },
    { id: 'lion',      name: 'African Lion',    emoji: '🦁', biome: 'plains2',  hp: 140, xp: 60,  score: 95, catchRate: 0.2,  rarity: 'rare',      desc: 'King of the savanna.' },
    // DEEP OCEAN (water2)
    { id: 'octopus',   name: 'Giant Octopus',   emoji: '🐙', biome: 'water2',   hp: 85,  xp: 36,  score: 55, catchRate: 0.32, rarity: 'uncommon',  desc: 'Eight arms of doom.' },
    { id: 'whale',     name: 'Blue Whale',      emoji: '🐋', biome: 'water2',   hp: 250, xp: 100, score: 200,catchRate: 0.08, rarity: 'legendary', desc: 'Largest creature on Earth.' },
    { id: 'dolphin',   name: 'Orca',            emoji: '🐬', biome: 'water2',   hp: 120, xp: 50,  score: 80, catchRate: 0.25, rarity: 'rare',      desc: 'Apex predator of the seas.' },
    // VOLCANIC
    { id: 'komodo',    name: 'Komodo Dragon',   emoji: '🐉', biome: 'volcanic', hp: 130, xp: 55,  score: 90, catchRate: 0.2,  rarity: 'rare',      desc: 'Venomous giant lizard.' },
    { id: 'firebird',  name: 'Phoenix Bird',    emoji: '🔥', biome: 'volcanic', hp: 180, xp: 80,  score: 140,catchRate: 0.12, rarity: 'legendary', desc: 'Mythical fire incarnate.' },
    { id: 'vulture',   name: 'Vulture',         emoji: '🦅', biome: 'volcanic', hp: 75,  xp: 32,  score: 48, catchRate: 0.4,  rarity: 'uncommon',  desc: 'Circles on hot thermals.' },
  ],

  // ── HOUSES / BUILDINGS ─────────────────────────
  houses: [
    { id: 'village_inn',  name: 'Village Inn',   emoji: '🏠', biome: 'plains',   x: 200, y: 0, color: '#c8a060', roofColor: '#a04020', desc: 'Rest and recover HP here.' },
    { id: 'dock',         name: 'Fisherman Dock',emoji: '⚓', biome: 'water',    x: 900, y: 0, color: '#6a8aaa', roofColor: '#3a5a7a', desc: 'Buy water gear here.' },
    { id: 'temple',       name: 'Jungle Temple', emoji: '🛕', biome: 'tropical', x: 1600,y: 0, color: '#8a6a2a', roofColor: '#4a3a1a', desc: 'Ancient relics hidden inside.' },
    { id: 'ranger_post',  name: 'Ranger Post',   emoji: '🏕️', biome: 'mountain', x: 2400,y: 0, color: '#7a5a3a', roofColor: '#3a2a1a', desc: 'Mountain ranger HQ.' },
    { id: 'igloo',        name: 'Ice Igloo',     emoji: '🏔️', biome: 'snow',     x: 3200,y: 0, color: '#d8f0ff', roofColor: '#a0c8e0', desc: 'Shelter from the blizzard.' },
    { id: 'safari_camp',  name: 'Safari Camp',   emoji: '⛺', biome: 'plains2',  x: 4000,y: 0, color: '#c8a050', roofColor: '#8a6020', desc: 'Safari guide awaits.' },
    { id: 'submarine',    name: 'Research Sub',  emoji: '🔬', biome: 'water2',   x: 4700,y: 0, color: '#3a5a7a', roofColor: '#1a3a5a', desc: 'Deep sea research station.' },
    { id: 'volcano_lair', name: 'Dragon Lair',   emoji: '🌋', biome: 'volcanic', x: 5400,y: 0, color: '#5a1a00', roofColor: '#3a0a00', desc: 'Only the brave enter.' },
  ],

  // ── BIOME TIPS ─────────────────────────────────
  loadingTips: [
    'Walk near animals to encounter them!',
    'Rare animals give more XP and score.',
    'Fleeing always works, but earns nothing.',
    'Buildings let you restore HP.',
    'Legendary animals are nearly uncatchable!',
    'The Tropical Forest hides the Philippine Eagle.',
    'The Deep Ocean holds the Blue Whale — 250 HP!',
    'Snow biome: watch out for Polar Bears.',
    'Fight to weaken, then catch for bonus score.',
    'Your cat companion follows you everywhere.',
  ],
};
