import type { Review } from "@/lib/types";
import { categoryImagePool } from "@/server/imageMap";

export type SeedProduct = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  priceCents: number;
  compareAtCents: number | null;
  category: string;
  emoji: string;
  image: string;
  gradient: string;
  rating: number;
  reviews: number;
  stock: number;
  featured: boolean;
  features: string[];
};

export const seedCategories = [
  "Audio",
  "Wearables",
  "Accessories",
  "Tablets",
  "Drones",
  "Home",
  "Cameras",
];

export const seedProductCount = 1000;

// ---------------------------------------------------------------------------
// Flagship products (the 12 hero items) — kept for curated look + "featured".
// ---------------------------------------------------------------------------

const flagshipProducts: SeedProduct[] = [
  {
    id: "aurora-headphones",
    name: "Aurora Wireless Headphones",
    tagline: "Immersive sound, all day comfort",
    description:
      "Over-ear headphones with adaptive noise cancelling, 40-hour battery life and spatial audio. Lightweight memory-foam cushions make long listening sessions effortless.",
    priceCents: 24900,
    compareAtCents: 29900,
    category: "Audio",
    emoji: "🎧",
    image: "",
    gradient: "from-violet-500 to-indigo-600",
    rating: 4.8,
    reviews: 214,
    stock: 24,
    featured: true,
    features: [
      "Adaptive active noise cancelling",
      "Spatial audio with dynamic head tracking",
      "40-hour battery, 10 min charge = 5 hrs playback",
      "Multipoint Bluetooth 5.3 connection",
    ],
  },
  {
    id: "pulse-smartwatch",
    name: "Pulse Smartwatch S2",
    tagline: "Your health, on your wrist",
    description:
      "Track heart rate, sleep, workouts and SpO2 with a bright always-on AMOLED display. Water resistant to 5 ATM with 10-day battery life.",
    priceCents: 19900,
    compareAtCents: 25900,
    category: "Wearables",
    emoji: "⌚",
    image: "",
    gradient: "from-sky-500 to-cyan-400",
    rating: 4.6,
    reviews: 487,
    stock: 12,
    featured: true,
    features: [
      "Always-on 1.43\" AMOLED display",
      "HR, SpO2, sleep and stress tracking",
      "120+ workout modes with auto-detect",
      "10-day battery, 5 ATM water resistance",
    ],
  },
  {
    id: "neon-mechanical-keyboard",
    name: "Neon Mechanical Keyboard",
    tagline: "Hot-swappable, low-profile typing",
    description:
      "A 75% layout keyboard with RGB backlighting, triple-mode connectivity and gasket-mounted switches. Includes both Mac and Windows keycaps.",
    priceCents: 12900,
    compareAtCents: 15900,
    category: "Accessories",
    emoji: "⌨️",
    image: "",
    gradient: "from-fuchsia-500 to-pink-500",
    rating: 4.5,
    reviews: 162,
    stock: 40,
    featured: true,
    features: [
      "75% layout, gasket-mounted plate",
      "Hot-swappable switches",
      "Bluetooth / 2.4 GHz / wired triple mode",
      "Per-key RGB with on-board profiles",
    ],
  },
  {
    id: "stellar-webcam",
    name: "Stellar 4K Webcam",
    tagline: "Studio quality calls from home",
    description:
      "Crisp 4K video with a wide-angle lens, built-in ring light and dual noise-cancelling microphones. Works plug-and-play with Mac, Windows and Linux.",
    priceCents: 8900,
    compareAtCents: null,
    category: "Accessories",
    emoji: "📷",
    image: "",
    gradient: "from-amber-500 to-orange-500",
    rating: 4.4,
    reviews: 98,
    stock: 31,
    featured: true,
    features: [
      "4K30 / 1080p60 video",
      "Wide-angle glass lens with AF",
      "Built-in ring light with 3 levels",
      "Dual beam-forming microphones",
    ],
  },
  {
    id: "volt-power-bank",
    name: "Volt 20K Fast Charger",
    tagline: "20,000 mAh of pure stamina",
    description:
      "Charge two devices at once with 65W USB-C PD. Slim aluminium body, LED power display, and enough capacity to charge a phone 5 times.",
    priceCents: 5900,
    compareAtCents: null,
    category: "Accessories",
    emoji: "🔋",
    image: "",
    gradient: "from-emerald-500 to-teal-500",
    rating: 4.7,
    reviews: 342,
    stock: 55,
    featured: true,
    features: [
      "20,000 mAh / 74 Wh capacity",
      "65W USB-C Power Delivery",
      "Charge two devices simultaneously",
      "LED power display, 430 g",
    ],
  },
  {
    id: "echo-smart-speaker",
    name: "Echo Smart Speaker",
    tagline: "Rich sound, voice-first assistant",
    description:
      "Room-filling 360° audio with your favourite voice assistant built in. Pair two for stereo and control your smart home hands-free.",
    priceCents: 14900,
    compareAtCents: null,
    category: "Audio",
    emoji: "🔊",
    image: "",
    gradient: "from-slate-500 to-slate-700",
    rating: 4.3,
    reviews: 120,
    stock: 18,
    featured: true,
    features: [
      "360° sound with deep bass",
      "Built-in voice assistant + smart home hub",
      "Pair two for wireless stereo",
      "Wi-Fi, Bluetooth and AUX support",
    ],
  },
  {
    id: "terra-gaming-mouse",
    name: "Terra Gaming Mouse",
    tagline: "26K DPI, 8K polling",
    description:
      "Ultralight 58g gaming mouse with an optical sensor reaching 26,000 DPI, optical switches and a braided paracord cable.",
    priceCents: 7900,
    compareAtCents: null,
    category: "Accessories",
    emoji: "🖱️",
    image: "",
    gradient: "from-red-500 to-rose-600",
    rating: 4.6,
    reviews: 205,
    stock: 37,
    featured: true,
    features: [
      "26,000 DPI optical sensor",
      "58 g ultralight shell",
      "Optical switches, 90M clicks",
      "8K / 1000 Hz polling modes",
    ],
  },
  {
    id: "nova-e-reader",
    name: "Nova E-Reader 7\"",
    tagline: "A library in your pocket",
    description:
      "Glare-free 7-inch e-ink display with warm front light, weeks of battery life and 16GB of storage for thousands of books.",
    priceCents: 13900,
    compareAtCents: null,
    category: "Tablets",
    emoji: "📚",
    image: "",
    gradient: "from-teal-600 to-emerald-600",
    rating: 4.7,
    reviews: 76,
    stock: 9,
    featured: true,
    features: [
      'Glare-free 7" e-ink display',
      "Adjustable warm front light",
      "16 GB storage, 64 MB soft-touch case",
      "Weeks of battery per charge",
    ],
  },
  {
    id: "orbit-drone",
    name: "Orbit Mini Drone",
    tagline: "4K cinematic shots, pocket size",
    description:
      "Fold-up drone with 4K camera, 3-axis gimbal and 30 minutes of flight time. Intelligent tracking keeps hero shots locked on you.",
    priceCents: 44900,
    compareAtCents: 49900,
    category: "Drones",
    emoji: "🚁",
    image: "",
    gradient: "from-blue-600 to-indigo-500",
    rating: 4.9,
    reviews: 54,
    stock: 6,
    featured: true,
    features: [
      "4K / 60fps camera with 3-axis gimbal",
      "30-minute flight time, 3 km range",
      "Intelligent object tracking modes",
      "Fold-up design under 249 g",
    ],
  },
  {
    id: "solstice-desk-lamp",
    name: "Solstice Desk Lamp",
    tagline: "Circadian light for deep focus",
    description:
      "A smart desk lamp with automatic color temperature that follows the sun, wireless charging pad and a fully adjustable neck.",
    priceCents: 6900,
    compareAtCents: null,
    category: "Home",
    emoji: "💡",
    image: "",
    gradient: "from-yellow-500 to-amber-600",
    rating: 4.5,
    reviews: 188,
    stock: 28,
    featured: true,
    features: [
      "Auto color temperature 2700K-6500K",
      "15W wireless charging pad",
      "Fully adjustable 3-segment neck",
      "Touch dimming + app control",
    ],
  },
  {
    id: "canyon-camera",
    name: "Canyon Mirrorless Camera",
    tagline: "Every shot, beautifully yours",
    description:
      "A 24MP mirrorless camera with in-body stabilisation, 4K60 video and a flip-out touchscreen. Kits with 28mm f/2.8 lens.",
    priceCents: 79900,
    compareAtCents: 94900,
    category: "Cameras",
    emoji: "📸",
    image: "",
    gradient: "from-slate-700 to-zinc-900",
    rating: 4.8,
    reviews: 41,
    stock: 4,
    featured: true,
    features: [
      "24 MP APS-C sensor",
      "5-axis in-body stabilisation",
      "4K60 video with 10-bit recording",
      "Flip-out touchscreen",
    ],
  },
  {
    id: "breeze-portable-speaker",
    name: "Breeze Portable Speaker",
    tagline: "Waterproof beats for anywhere",
    description:
      "IP67 waterproof rugged speaker with 360° sound, deep bass and 24 hours of playback. Floatable, dustproof and drop-proof.",
    priceCents: 7900,
    compareAtCents: null,
    category: "Audio",
    emoji: "🔈",
    image: "",
    gradient: "from-lime-500 to-green-600",
    rating: 4.6,
    reviews: 276,
    stock: 45,
    featured: true,
    features: [
      "IP67 waterproof, floatable design",
      "360° sound with passive radiators",
      "24-hour playback per charge",
      "Rugged, drop-proof body",
    ],
  },
];

// ---------------------------------------------------------------------------
// Deterministic catalog generator for the remaining ~988 products.
// ---------------------------------------------------------------------------

type Subfamily = {
  type: string;
  taglines: string[];
  basePrice: number;
  features: string[];
  count: number;
};

const catalogByCategory: Record<string, Subfamily[]> = {
  Audio: [
    { type: "Wireless Headphones", taglines: ["Immersive wireless sound", "Studio sound, zero cables", "Wireless freedom, big sound"], basePrice: 15900, features: ["40-hour battery life", "Bluetooth 5.3 multipoint pairing", "Foldable, travel-friendly design", "Built-in mic for calls", "Deep, punchy bass response", "Lightweight memory-foam cushions", "Quick-charge 10 min = 5 hrs playback", "3.5 mm wired backup cable"], count: 34 },
    { type: "Over-Ear Headphones", taglines: ["Comfort that lasts all day", "Premium over-ear comfort", "Isolate yourself from the noise"], basePrice: 21900, features: ["Plush leatherette ear cushions", "Closed-back acoustic isolation", "Detachable audio cable", "Collapsible headband", "40 mm dynamic drivers", "Passive noise isolation", "Soft-touch finish", "Wide frequency response 20 Hz - 40 kHz"], count: 28 },
    { type: "ANC Headphones", taglines: ["Silence the world around you", "Your quiet place, anywhere", "Active cancelling, total focus"], basePrice: 28900, features: ["Multi-mode active noise cancelling", "Transparency mode for awareness", "Adaptive sound adjustment", "30-hour ANC battery", "USB-C fast charging", "Wear detection auto-pause", "Low-latency gaming mode", "Carrying hard case included"], count: 24 },
    { type: "True Wireless Earbuds", taglines: ["True wireless, true freedom", "Pocketable sound with a case", "In your ear, not in your way"], basePrice: 7900, features: ["Hybrid active noise cancelling", "Wireless charging case", "IPX5 sweat resistance", "Touch controls with voice assistant", "6 mm dynamic drivers", "28-hour total battery", "Quick pair with companion app", "Find-my-earbuds support"], count: 28 },
    { type: "Wireless Earbuds", taglines: ["Comfortable all-day earbuds", "Lightweight, secure fit", "Big sound, tiny buds"], basePrice: 4900, features: ["Bluetooth 5.2 stable connection", "Ergonomic ear-tip fit", "20-hour total battery", "Built-in mic for calls", "USB-C charging case", "IPX4 splash proof", "One-tap media controls", "Voice assistant support"], count: 12 },
    { type: "Bluetooth Speaker", taglines: ["Room-filling portable sound", "Take the party anywhere", "Big bass in a small body"], basePrice: 5900, features: ["360° sound projection", "IPX6 water resistant", "12-hour playback", "TWS pairing for stereo", "Passive bass radiator", "Lightweight carry loop", "Hands-free speakerphone", "AUX + USB input"], count: 18 },
    { type: "Portable Speaker", taglines: ["Rugged sound for adventures", "Built for the outdoors", "Waterproof by design"], basePrice: 8900, features: ["IP67 waterproof and dustproof", "Floatable design", "24-hour playback", "Pair two for stereo", "Shock-proof silicone body", "Bluetooth 5.0 with range 30 m", "Carabiner clip included", "USB-C quick charge"], count: 14 },
    { type: "Smart Speaker", taglines: ["Voice-first smart assistant", "Your home, at the sound of your voice", "Smart sound for every room"], basePrice: 12900, features: ["360° room-filling audio", "Built-in voice assistant", "Smart home hub support", "Privacy mic off switch", "Pair two for stereo", "Music streaming built in", "Multi-room audio sync", "Touch plus voice controls"], count: 12 },
    { type: "USB Gaming Headset", taglines: ["Game audio with chat clarity", "Team chat, loud and clear", "Immerse, communicate, win"], basePrice: 6900, features: ["Lightweight 45 mm drivers", "Detachable noise-cancelling mic", "7.1 virtual surround sound", "Memory-foam ear cushions", "In-line volume + mute controls", "USB plug-and-play", "Breathable sport mesh", "3.5 mm jack compatibility"], count: 6 },
  ],
  Wearables: [
    { type: "Smartwatch", taglines: ["Your health on your wrist", "The all-day smart companion", "Stay connected, stay moving"], basePrice: 19900, features: ["1.43\" AMOLED always-on display", "HR, SpO2, sleep and stress tracking", "120+ workout modes", "10-day battery life", "Bluetooth calls from the wrist", "5 ATM water resistance", "Built-in GPS", "Custom watch faces"], count: 34 },
    { type: "Fitness Band", taglines: ["Every step counts", "Track it, beat it", "Budget-friendly health tracking"], basePrice: 3900, features: ["1.1\" color touch display", "24/7 heart rate monitoring", "Sleep and stress tracking", "14-day battery life", "5 ATM water resistance", "Smartphone notifications", "10+ sport modes", "Female health tracking"], count: 24 },
    { type: "Sport Watch", taglines: ["Train smarter, not harder", "Built for serious athletes", "Put your training on autopilot"], basePrice: 15900, features: ["Multi-band GPS positioning", "Barometric altimeter", "70+ sport profiles", "VO2 max and recovery insights", "18-day battery life", "Titanium bezel", "Sapphire glass display", "Advanced training analytics"], count: 18 },
    { type: "Smart Ring", taglines: ["Health data, minus the screen", "Wearable insight, discreet & slim", "Sleep recovery reimagined"], basePrice: 17900, features: ["Titanium, hypoallergenic design", "Sleep and recovery scoring", "HR and temperature sensing", "7-day battery with charging dock", "App-driven insights", "Skin-safe sensor window", "Water resistant to 100 m", "Includes app subscription (1 yr)"], count: 16 },
    { type: "Kids Smartwatch", taglines: ["Safety for little explorers", "Stay close, browse freely", "Family locator on the wrist"], basePrice: 6900, features: ["GPS + Wi-Fi location tracking", "Two-way voice calls", "SOS button for emergencies", "Safe-zone geofencing", "Kid-proof IPX7 build", "Parent app controls", "Step and activity games", "10-day battery life"], count: 12 },
    { type: "Sleep Tracker", taglines: ["Sleep deeper, wake sharper", "Understand your nights", "Your sleep, decoded"], basePrice: 11900, features: ["Non-intrusive mat design", "Sleep stages and breathing insights", "HRV and resting heart rate", "Smart alarm in REM window", "Syncs with fitness apps", "Washable fabric cover", "Bluetooth + Wi-Fi sync", "Monthly sleep reports"], count: 10 },
  ],
  Accessories: [
    { type: "Mechanical Keyboard", taglines: ["Tactile typing, every key", "Desk-worthy mechanical feel", "RGB that pops on a budget"], basePrice: 7900, features: ["Hot-swappable switches", "Per-key RGB backlighting", "Gasket-mounted plate", "Aluminium top frame", "Bluetooth / 2.4 GHz / USB-C", "Doubleshot PBT keycaps", "Wired, low-latency mode", "Mac and Windows layouts"], count: 30 },
    { type: "Compact Mechanical Keyboard", taglines: ["Small footprint, big feel", "60% keys, 100% style", "Minimal desk, maximal typing"], basePrice: 9900, features: ["65% layout with arrow keys", "Hot-swappable switches", "South-facing RGB", "Gasket mount for soft feel", "Wireless triple-mode", "Pre-lubed stabilizers", "Carrying case included", "Firmware remapping"], count: 20 },
    { type: "Wireless Keyboard", taglines: ["Clean desk, zero cables", "Quiet keys for any space", "Slim and silent daily driver"], basePrice: 4900, features: ["Scissor-switch quiet keys", "Multi-device Bluetooth", "Rechargeable 120-day battery", "2.4 GHz + BT dual mode", "ISO/ANSI layouts", "Charging cable included", "Low-profile design", "Cross-device pairing"], count: 18 },
    { type: "Gaming Mouse", taglines: ["Precision under your thumb", "Zero lag, maximum control", "Aim true, every time"], basePrice: 6900, features: ["26,000 DPI optical sensor", "Optical switches, 90M clicks", "58 g ultralight shell", "8K / 1000 Hz polling", "Triple-mode connectivity", "DPI cycle button", "Braided paracord cable", "On-board profile memory"], count: 20 },
    { type: "Ergonomic Mouse", taglines: ["Comfort for long hours", "Friendly on your wrist", "Ergonomics that pay off"], basePrice: 4900, features: ["Vertical grip design", "Adjustable DPI 800-2400", "Silent click switches", "Rechargeable battery", "2.4 GHz silent wireless", "Auto-sleep power saving", "USB-C charging", "Compatible with all OS"], count: 12 },
    { type: "4K Webcam", taglines: ["Crisp video for hybrid work", "Look sharp in every meeting", "Broadcast-quality calls"], basePrice: 8900, features: ["4K30 / 1080p60 video", "Auto-focus glass lens", "Built-in dual mics", "Wide 90° field of view", "Privacy shutter", "USB-C plug-and-play", "Tripod mount included", "Low-light enhancement"], count: 14 },

    { type: "Power Bank", taglines: ["Backup power for the road", "Never watch the battery bar", "Pocket-size emergency juice"], basePrice: 4900, features: ["20,000 mAh capacity", "65W USB-C Power Delivery", "Fast charge two devices", "LED power display", "Slim aluminium body", "Airline-approved capacity", "Overcharge protection", "USB-A + USB-C outputs"], count: 16 },
    { type: "USB-C Hub", taglines: ["One hub, every port", "Expand your laptop", "Warehouse your dongles"], basePrice: 5900, features: ["7-in-1 port expansion", "HDMI 4K60 output", "SD + microSD card reader", "100W USB-C pass-through", "Gigabit Ethernet", "Aluminium heat-dissipation", "Plug-and-play driverless", "1.5 m braided cable"], count: 12 },
    { type: "Charging Dock", taglines: ["Charge three, clutter zero", "One dock, tidy desk", "Magnetic multi-device charging"], basePrice: 6900, features: ["Charges 3 devices at once", "Magnetic alignment", "Watches + earbuds + phone", "Smart overheat protection", "LED charging indicators", "Non-slip silicone base", "USB-C input cable", "18W total output"], count: 12 },
    { type: "SSD Drive", taglines: ["Move massive files in seconds", "Pocket storage, huge speed", "Reliable backup that fits anywhere"], basePrice: 11900, features: ["1 TB NVMe storage", "Up to 1050 MB/s reads", "USB-C 3.2 Gen 2", "Military-shock durability", "Encryption support", "Works PC, Mac, console", "LED status light", "Lanyard loop included"], count: 12 },
    { type: "Mouse Pad XL", taglines: ["Roll on extra space", "Desk-to-desk coverage", "Big pad, steady aim"], basePrice: 2900, features: ["900 x 400 mm surface", "Low-friction cloth top", "Anti-slip rubber base", "Stitched edges", "Washable and quick-dry", "3 mm thick cushion", "Water-repellent coating", "Full-desk coverage"], count: 10 },
  ],
  Tablets: [
    { type: "E-Reader", taglines: ["A whole library, light as air", "Read anywhere, glare-free", "Pages without pixels"], basePrice: 13900, features: ["Glare-free e-ink display", "Adjustable warm front light", "16 GB storage", "Weeks of battery life", "Water-resistant design", "Built-in dictionary + vocab", "Comfortable one-hand grip", "Over 2 million titles supported"], count: 22 },
    { type: "E-Reader Pro", taglines: ["The premium reading experience", "Waterproof, warm-lit reading", "Reading, perfected"], basePrice: 19900, features: ["300 ppi e-ink display", "Auto-adjusting warm light", "32 GB storage", "Two-week battery", "IPX8 waterproof", "Page-turn buttons", "Audiobook + Bluetooth support", "Physical page-turn buttons"], count: 10 },
    { type: "Android Tablet", taglines: ["Your big-screen entertainment", "Work and play on one slate", "A tablet for everything"], basePrice: 22900, features: ["10.4\" 2K display", "Octa-core processor", "4 GB RAM / 64 GB storage", "8-hour battery", "Dual speakers with Dolby", "Freeform multi-window", "Kids mode included", "USB-C fast charging"], count: 26 },
    { type: "Drawing Tablet", taglines: ["Sketch, ink, create digitally", "The artist&apos;s shortcut", "Draw straight into your laptop"], basePrice: 8900, features: ["8\" x 5\" active area", "4096 pressure levels", "Battery-free pen included", "Shortcut keys + wheel", "Works Windows / Mac / Chrome", "Anti-glare film surface", "Pen tilt sensing", "Driverless basic mode"], count: 12 },
    { type: "Kids Tablet", taglines: ["Safe screen time, happy kids", "Learn and play, parent-backed", "Built tough for tiny hands"], basePrice: 14900, features: ["Shockproof kid case", "Parental control dashboard", "Curated learning apps", "Blue-light filter", "10-hour battery", "Dual cameras for creativity", "Headphone jack + Bluetooth", "Warranty for accidental damage"], count: 10 },
  ],
  Drones: [
    { type: "Mini Drone", taglines: ["Cinematic shots, palm-sized", "Fly light, capture big", "Pocket rocket in the sky"], basePrice: 44900, features: ["4K / 60fps camera", "3-axis mechanical gimbal", "30-minute flight time", "3 km transmission range", "Under 249 g takeoff weight", "Intelligent tracking modes", "Quick return-to-home", "Foldable propeller arms"], count: 26 },
    { type: "Camera Drone", taglines: ["A pro studio in the sky", "4K aerial cinema, on tap", "Elevate every adventure"], basePrice: 69900, features: ["4K60 HDR camera", "1\" 20 MP sensor", "Omnidirectional obstacle sensing", "45-minute flight time", "8 km video transmission", "MasterShots automation", "10-bit D-LogM colour profiling", "Includes carry case"], count: 18 },
    { type: "Action Camera", taglines: ["POV footage that pops", "Adventure-proof video", "Your eyes everywhere"], basePrice: 29900, features: ["4K120 HyperSmooth stabilisation", "10 m waterproof bare", "Dual screens", "Voice control", "Time-lapse and looping modes", "FOV 155° Ultra superview", "24+ capture modes", "Smartphone app editing"], count: 16 },
    { type: "Gimbal Stabilizer", taglines: ["Buttery-smooth handheld film", "Silky footage in your pocket", "Steady hands, pro shots"], basePrice: 12900, features: ["3-axis magnetic stabilisation", "Foldable for travel", "Follow and time-lapse modes", "Up to 300 g payload", "8-hour runtime", "Quick-release phone clamp", "Gesture control", "USB-C charging"], count: 8 },
    { type: "Drone Battery", taglines: ["Fly longer, explore farther", "Juice for extra flights", "Spare power for the sky"], basePrice: 8900, features: ["4500 mAh smart battery", "30 min typical flight", "LED power indicator", "Overcharge protection", "Intelligent heat management", "Compatible quick-charge dock", "450 g lightweight", "12-month warranty"], count: 6 },
  ],
  Home: [
    { type: "Desk Lamp", taglines: ["Focused light for deep work", "Warm light, cool focus", "A lamp that adapts to your day"], basePrice: 6900, features: ["Auto color temperature 2700K-6500K", "15W wireless charging pad", "Adjustable 3-segment neck", "Touch dimming", "App and voice control", "USB-A charging port", "Clamp-free weighted base", "Memory brightness recall"], count: 24 },
    { type: "Smart Light Bulb", taglines: ["Light that follows commands", "Mood, on demand", "Whole-home ambience from one bulb"], basePrice: 2900, features: ["16 million colors", "2700K-6500K white range", "No hub needed", "Voice assistant support", "Schedules and scenes", "Energy-saving LED", "App control anywhere", "4-pack dimming modes"], count: 18 },
    { type: "Smart Plug", taglines: ["Any appliance, made smart", "Remote control for the boring stuff", "Power, scheduled"], basePrice: 1900, features: ["Wi-Fi 2.4 GHz no hub", "Energy monitoring", "Schedules and timers", "Voice assistant support", "Away mode randomization", "10 A 2300 W capacity", "Compact single outlet", "App group control"], count: 14 },
    { type: "Wi-Fi Router", taglines: ["Whole-home coverage, zero dead zones", "Lag-free everywhere", "Signal that reaches every corner"], basePrice: 15900, features: ["Wi-Fi 6 dual band", "Up to 1800 Mbps", "Parental controls", "Guest network", "MU-MIMO + OFDMA", "Mesh expandable", "4 gigabit LAN ports", "App-based setup"], count: 16 },
    { type: "Wi-Fi Extender", taglines: ["Extend the reach, drop the dead zones", "Fill the gaps in your signal", "More bars in every room"], basePrice: 4900, features: ["Dual band 1200 Mbps", "Intelligent signal LEDs", "Works with any router", "One-tap WPS setup", "Ethernet port for consoles", "Wall-plug compact design", "2-year warranty", "App diagnostics"], count: 8 },
    { type: "Wireless Charger Pad", taglines: ["Drop it on, walk away", "Cable-free power", "The clutter-free charge"], basePrice: 3900, features: ["15W fast wireless charging", "Qi certified", "Slim aluminium body", "Foreign-object detection", "LED charging indicator", "Works with all Qi phones", "Protective silicone ring", "1 m USB-C cable included"], count: 12 },
    { type: "Monitor Stand", taglines: ["Eye level, analog", "Desk space, reclaimed", "Set your screen up right"], basePrice: 6900, features: ["Holds up to 40 kg", "Gas-spring height adjust", "VESA 75/100 mm", "Cable management channel", "Swivel wrists + tilt", "Clamp and grommet mount", "Aluminium arm", "5-year warranty"], count: 6 },
  ],
  Cameras: [
    { type: "Mirrorless Camera", taglines: ["Compact power, pro output", "The all-round creative tool", "Ditch the DSLR, keep the quality"], basePrice: 79900, features: ["24 MP APS-C sensor", "5-axis in-body stabilisation", "4K60 10-bit video", "Flip-out touchscreen", "800-shot battery life", "Weather-sealed body", "Dual card slots", "Fast hybrid autofocus"], count: 20 },
    { type: "DSLR Camera", taglines: ["The reliable workhorse", "Optical viewfinder, classic feel", "Pro gear without the guesswork"], basePrice: 69900, features: ["26 MP APS-C sensor", "Optical 0.80x viewfinder", "4K30 UHD video", "45-point AF system", "6.5-stop shake reduction", "Dual SD slots", "1280-shot battery", "Screw-drive + STM AF"], count: 14 },
    { type: "Compact Camera", taglines: ["Point, shoot, wow", "Pocket-friendly big quality", "The everyday travel shooter"], basePrice: 34900, features: ["20 MP 1\" sensor", "4K video", "Fast f/1.8-2.8 lens", "Tiltable LCD", "Wi-Fi + Bluetooth sharing", "Raw shooting support", "USB-C charging", "Pocket-size body"], count: 12 },
    { type: "4K Security Cam", taglines: ["See everything at home", "Peace of mind, day and night", "Guard your place remotely"], basePrice: 9900, features: ["4K ultra-HD video", "Colour night vision", "Person + pet detection", "Two-way audio", "Local + cloud storage", "Pan and tilt 360°", "IP66 weatherproof", "Siren and alarm alerts"], count: 10 },
    { type: "Camera Lens Kit", taglines: ["Every focal length, one kit", "Zoom the world in", "One zoom to rule them all"], basePrice: 24900, features: ["18-140 mm range", "f/3.5-5.6 aperture", "VR image stabilisation", "Fast, silent AF motor", "40 cm close focusing", "Weather-sealed mount", "72 mm filter thread", "Compact 560 g build"], count: 8 },
  ],
};

const brands = [
  "Nova", "Pulse", "Aurora", "Volt", "Orbit", "Solstice", "Canyon", "Breeze",
  "Terra", "Stellar", "Nebula", "Quantix", "Helios", "Drift", "Zenvo", "Luma",
  "Vertex", "Ember", "Axis", "Meridian", "Kestrel", "Onyx", "Rio", "Sable", "Indigo",
];

const series = [
  "Strato", "Cobalt", "Nimbus", "Solar", "Peak", "Lunar", "Atlas", "Comet",
  "Eclipse", "Forte", "Halo", "Ion", "Jade", "Karma", "Lumen", "Nova", "Orbit",
  "Quartz", "Ridge", "Sapphire", "Titan", "Umbra", "Vega", "Zephyr", "Aria",
  "Brio", "Crest", "Dune", "Flux", "Gale", "Haven", "Ivan", "Jasper", "Kite",
  "Larch", "Mira", "Nile", "Prism", "Quill", "Reef", "Summit", "Twist", "Unity",
  "Vale", "Willow", "Xeno", "Yonder", "Zion", "Aster", "Beryl",
];

const suffixes = ["", " Pro", " Max", " Lite", " Air", " X"];

const categoryArt: Record<string, { emoji: string; gradient: string }> = {
  Audio: { emoji: "🎧", gradient: "from-violet-500 to-indigo-600" },
  Wearables: { emoji: "⌚", gradient: "from-sky-500 to-cyan-400" },
  Accessories: { emoji: "⌨️", gradient: "from-fuchsia-500 to-pink-500" },
  Tablets: { emoji: "📚", gradient: "from-teal-600 to-emerald-600" },
  Drones: { emoji: "🚁", gradient: "from-blue-600 to-indigo-500" },
  Home: { emoji: "💡", gradient: "from-yellow-500 to-amber-600" },
  Cameras: { emoji: "📸", gradient: "from-slate-700 to-zinc-900" },
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCode(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function pick<T>(rnd: () => number, list: T[]): T {
  return list[Math.floor(rnd() * list.length)];
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function nicePrice(baseCents: number, rnd: () => number): number {
  const dollars = (baseCents / 100) * (0.92 + rnd() * 0.36);
  const raw = Math.max(199, Math.round(dollars * 100));
  const roll = rnd();
  if (roll < 0.6) return raw - 1; // .99
  if (roll < 0.8) return Math.round(raw / 100) * 100 - 51; // .49
  return Math.round(raw / 100) * 100; // .00
}

function sampleFeatures(list: string[], rnd: () => number): string[] {
  const count = 3 + Math.floor(rnd() * 3); // 3-5
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

function pickImage(category: string, productId: string): string {
  const pool = categoryImagePool[category];
  if (pool && pool.length > 0) {
    return pool[hashCode(productId + category) % pool.length];
  }
  return `/products/fallback-${slugify(category)}.svg`;
}

const categoryTargets: Record<string, number> = {
  Audio: 150,
  Wearables: 140,
  Accessories: 258,
  Tablets: 130,
  Drones: 90,
  Home: 120,
  Cameras: 100,
};

function generateCatalog(count: number): SeedProduct[] {
  const output: SeedProduct[] = [];
  const expectedCategoryTotal = Object.values(categoryTargets).reduce(
    (a, b) => a + b,
    0,
  );

  for (const category of seedCategories) {
    const subfamilies = catalogByCategory[category];
    const art = categoryArt[category];
    const target = categoryTargets[category];
    const weightTotal = subfamilies.reduce((sum, sub) => sum + sub.count, 0);
    // Scale quotas proportionally so the sum matches count exactly.
    const scale = count / expectedCategoryTotal;
    const categoryQuota = Math.round(target * scale);
    let assignedInCategory = 0;

    for (let fi = 0; fi < subfamilies.length; fi++) {
      const sub = subfamilies[fi];
      const portion =
        fi === subfamilies.length - 1
          ? Math.max(0, categoryQuota - assignedInCategory)
          : Math.round((sub.count / weightTotal) * categoryQuota);

      for (let n = 0; n < portion; n++) {
        if (output.length >= count) break;
        const productIndex = output.length;
        const rnd = mulberry32(hashCode(`${category}:${fi}:${n}`));
        assignedInCategory++;

        const brand = pick(rnd, brands);
        const seriesToken = pick(rnd, series);
        const suffix = pick(rnd, suffixes);
        const name = `${brand} ${seriesToken} ${sub.type}${suffix}`.trim();
        const id = `${slugify(category)}-${String(productIndex).padStart(4, "0")}`;

        const tagline = pick(rnd, sub.taglines);
        const taglineEnding = pick(rnd, [
          ".",
          " — refined and dependable.",
          " for the modern everyday.",
          ", reviewed and loved.",
          " — a Nova Store favourite.",
        ]);

        const descClauses = pick(rnd, [
          `Engineered for real-world use, the ${name} blends a durable, premium finish with thoughtful details in every corner.`,
          `Compact, reliable and ready out of the box, the ${name} is designed around how you actually use your gear every single day.`,
          `With generous battery life and an effortless setup, the ${name} slots straight into your routine and stays there.`,
          `Backed by a 2-year warranty and free 30-day returns, the ${name} is built to sit comfortably in a setup you can rely on.`,
        ]);
        const description = `${name}: ${tagline.toLowerCase()}${taglineEnding} ${descClauses}`;

        const price = nicePrice(sub.basePrice, rnd);
        const hasCompareAt = rnd() < 0.22;
        const compareAt = hasCompareAt
          ? Math.round((price * 1.15) / 100) * 100 - 1
          : null;

        const rating = Math.round((3.8 + rnd() * 1.15) * 10) / 10;
        const reviews = 3 + Math.floor(Math.pow(rnd(), 2) * 900);
        const stockRoll = rnd();
        const stock =
          stockRoll < 0.1
            ? 0
            : stockRoll < 0.3
              ? 1 + Math.floor(rnd() * 9)
              : stockRoll < 0.5
                ? 10 + Math.floor(rnd() * 30)
                : 40 + Math.floor(rnd() * 260);

        output.push({
          id,
          name,
          tagline,
          description,
          priceCents: price,
          compareAtCents: compareAt,
          category,
          emoji: art.emoji,
          image: pickImage(category, id),
          gradient: art.gradient,
          rating,
          reviews,
          stock,
          featured: false,
          features: sampleFeatures(sub.features, rnd),
        });
      }
    }
  }

  return output;
}

const generated = generateCatalog(seedProductCount - flagshipProducts.length);

export const seedProducts: SeedProduct[] = [...flagshipProducts, ...generated].map(
  (p) => (p.image === "" ? { ...p, image: pickImage(p.category, p.id) } : p),
);

// ---------------------------------------------------------------------------
// Deterministic reviews.
// ---------------------------------------------------------------------------

const reviewerNames = [
  "Alex R.", "Jordan M.", "Sam K.", "Taylor W.", "Casey L.", "Morgan P.",
  "Riley S.", "Quinn B.", "Drew C.", "Jesse N.",
];

const reviewTitles = [
  "Exceeded expectations",
  "Great value for money",
  "Daily driver for months",
  "Worth every penny",
  "Better than I hoped",
  "Sleek and reliable",
];

const reviewBodies = [
  "Setup took two minutes and everything just works. Build quality feels premium and it has become part of my daily routine. Would happily recommend.",
  "I compared a few alternatives before choosing this one and it wins on both price and performance. Battery life is as advertised, if not better.",
  "Used it every day for the past few weeks. No issues so far — fast, comfortable and easy to clean. Customer support answered all my questions quickly.",
  "Solid choice. The attention to detail shows in the packaging and the product itself. Slightly heavier than expected but not a deal-breaker.",
  "Exactly what I needed. Works flawlessly out of the box and the experience is smooth. A clear upgrade over my old setup.",
  "Arrived earlier than expected and looks stunning in person. Has held up well under daily use. I would buy again in a heartbeat.",
];

export function seedReviewsFor(productId: string): Review[] {
  const seed = hashCode(productId);
  const count = 3;
  const reviews: Review[] = [];
  for (let i = 0; i < count; i++) {
    const offset = seed + i * 3;
    const date = new Date(
      Date.UTC(2026, (seed + i) % 6, 10 + (seed % 14) + i * 2),
    )
      .toISOString()
      .slice(0, 10);
    reviews.push({
      author: reviewerNames[offset % reviewerNames.length],
      rating: 4 + ((seed + i) % 2),
      title: reviewTitles[(offset + i) % reviewTitles.length],
      body: reviewBodies[(offset * 2 + i) % reviewBodies.length],
      date,
      verified: i === 0,
    });
  }
  return reviews;
}