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

// Count set below after building the catalog.

// ---------------------------------------------------------------------------
// Flipkart-style curated catalog (real-world brands and models)
// ---------------------------------------------------------------------------

const categoryArt: Record<string, { emoji: string; gradient: string }> = {
  Audio: { emoji: "🎧", gradient: "from-violet-500 to-indigo-600" },
  Wearables: { emoji: "⌚", gradient: "from-sky-500 to-cyan-400" },
  Accessories: { emoji: "🔌", gradient: "from-fuchsia-500 to-pink-500" },
  Tablets: { emoji: "📱", gradient: "from-teal-600 to-emerald-600" },
  Drones: { emoji: "🚁", gradient: "from-blue-600 to-indigo-500" },
  Home: { emoji: "🏠", gradient: "from-yellow-500 to-amber-600" },
  Cameras: { emoji: "📸", gradient: "from-slate-700 to-zinc-900" },
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hashCode(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function pickImage(category: string, productId: string): string {
  const pool = categoryImagePool[category];
  if (pool && pool.length > 0) {
    return pool[hashCode(productId + category) % pool.length];
  }
  return `/products/fallback-${slugify(category)}.svg`;
}

type CatalogItem = Omit<SeedProduct, "image" | "gradient" | "emoji">;

const catalog: CatalogItem[] = [
  // Audio - Headphones & Earbuds
  {
    id: "sony-wh-1000xm5",
    name: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    tagline: "Industry-leading ANC with 30-hour battery",
    description:
      "Sony's flagship over-ear headphones deliver best-in-class noise cancellation, crystal-clear calls, and exceptional comfort for all-day listening. Dual processors power precise sound with rich bass and detailed highs.",
    priceCents: 34899,
    compareAtCents: 39999,
    category: "Audio",
    rating: 4.8,
    reviews: 2847,
    stock: 32,
    featured: true,
    features: ["Industry-leading active noise cancellation", "30-hour battery life with quick charge", "Multipoint Bluetooth 5.2", "Speak-to-chat and wear detection", "Lightweight ergonomic design"],
  },
  {
    id: "boAt-rockerz-550",
    name: "boAt Rockerz 550 Bluetooth Wireless Headphones",
    tagline: "50H playback, punchy bass",
    description:
      "Enjoy immersive audio with powerful 50mm drivers. The soft padded earcups and foldable design make them perfect for travel, workouts, and everyday use.",
    priceCents: 1999,
    compareAtCents: 4999,
    category: "Audio",
    rating: 4.3,
    reviews: 12842,
    stock: 87,
    featured: true,
    features: ["50H non-stop playback", "Dual mode (Bluetooth + AUX)", "ENx technology for clear calls", "Soft cushioned earcups", "Foldable and lightweight"],
  },
  {
    id: "jbl-tune-760nc",
    name: "JBL Tune 760NC Wireless Over-Ear Headphones",
    tagline: "Pure Bass Sound with Active Noise Cancelling",
    description:
      "JBL Pure Bass Sound meets active noise cancelling. With 35 hours of battery life and a foldable design, these headphones are built for music on the go.",
    priceCents: 6999,
    compareAtCents: 9499,
    category: "Audio",
    rating: 4.4,
    reviews: 5623,
    stock: 64,
    featured: false,
    features: ["JBL Pure Bass Sound", "Active Noise Cancelling", "35H battery (ANC off) / 35H with ANC", "Hands-free calls with Voice Aware", "Foldable flat design"],
  },
  {
    id: "boat-airdopes-141",
    name: "boAt Airdopes 141 True Wireless Earbuds",
    tagline: "42H playtime, ENx tech",
    description:
      "True wireless earbuds with ASAP Charge, ENx noise cancellation for calls, and BEAST mode for low latency gaming. Compact case fits easily in your pocket.",
    priceCents: 1299,
    compareAtCents: 4490,
    category: "Audio",
    rating: 4.2,
    reviews: 24561,
    stock: 156,
    featured: true,
    features: ["42H total playback", "ASAP Charge (5 min = 75 min)", "ENx Tech for clear calls", "BEAST Mode - 50ms low latency", "IPX4 water & sweat resistant"],
  },
  {
    id: "noise-buds-vs104",
    name: "Noise Buds VS104 Truly Wireless Earbuds",
    tagline: "45H playtime with Quad Mic ENC",
    description:
      "Feature-packed true wireless earbuds with Quad Mic Environmental Noise Cancellation, Instacharge, and hyper sync for seamless connectivity.",
    priceCents: 1099,
    compareAtCents: 3499,
    category: "Audio",
    rating: 4.1,
    reviews: 18234,
    stock: 142,
    featured: false,
    features: ["45H total playtime", "Quad Mic with ENC", "Instacharge 10 min = 200 min", "Hyper Sync for instant pairing", "IPX5 rating"],
  },
  {
    id: "jbl-flip-6",
    name: "JBL Flip 6 Portable Bluetooth Speaker",
    tagline: "Bold sound, IP67 waterproof",
    description:
      "Take your tunes anywhere with the JBL Flip 6. Powerful JBL Original Pro Sound, IP67 waterproof and dustproof, and up to 12 hours of playtime.",
    priceCents: 9999,
    compareAtCents: 11999,
    category: "Audio",
    rating: 4.7,
    reviews: 8942,
    stock: 48,
    featured: false,
    features: ["JBL Original Pro Sound", "IP67 waterproof & dustproof", "12 hours playtime", "PartyBoost for stereo pairing", "Bold, portable design"],
  },
  {
    id: "boat-stone-650",
    name: "boAt Stone 650 Bluetooth Speaker",
    tagline: "Rugged, powerful & waterproof",
    description:
      "A portable speaker built for adventure with boAt Signature Sound, RGB lights, TWS mode, and IPX5 splash resistance.",
    priceCents: 2499,
    compareAtCents: 6990,
    category: "Audio",
    rating: 4.3,
    reviews: 7654,
    stock: 92,
    featured: false,
    features: ["boAt Signature Sound", "10W RMS audio", "IPX5 water resistant", "TWS function", "Up to 7 hours playback"],
  },

  // Wearables - Smartwatches & Bands
  {
    id: "apple-watch-se-2",
    name: "Apple Watch SE (2nd Gen) GPS 40mm",
    tagline: "Essential features at a great value",
    description:
      "A powerful yet affordable smartwatch with Crash Detection, advanced fitness tracking, sleep tracking, and seamless integration with your Apple devices.",
    priceCents: 24999,
    compareAtCents: 29999,
    category: "Wearables",
    rating: 4.8,
    reviews: 3421,
    stock: 28,
    featured: true,
    features: ["Crash Detection & Fall Detection", "Heart rate & sleep tracking", "Water resistant 50m", "Up to 18 hours battery", "Retina display"],
  },
  {
    id: "samsung-galaxy-watch-6",
    name: "Samsung Galaxy Watch 6 44mm Bluetooth",
    tagline: "Advanced health insights on your wrist",
    description:
      "Track your fitness goals with Samsung BioActive Sensor, get detailed sleep analysis, and stay connected with Bluetooth calling. Sleek and durable design.",
    priceCents: 24999,
    compareAtCents: 32999,
    category: "Wearables",
    rating: 4.6,
    reviews: 2156,
    stock: 36,
    featured: true,
    features: ["BioActive Sensor for health tracking", "Bluetooth calling", "Sleep coaching & snore detection", "Exynos W930 processor", "Sapphire Crystal display"],
  },
  {
    id: "noise-colorfit-pro-5",
    name: "Noise ColorFit Pro 5 Smart Watch",
    tagline: "1.85\" AMOLED, BT Calling",
    description:
      "Stunning 1.85-inch AMOLED display with Always On Display, Bluetooth calling, AI voice assistant, and over 100 sports modes.",
    priceCents: 4499,
    compareAtCents: 7999,
    category: "Wearables",
    rating: 4.3,
    reviews: 15678,
    stock: 134,
    featured: false,
    features: ["1.85\" AMOLED with AOD", "Bluetooth calling with mic", "100+ sports modes", "SpO2 & heart rate tracking", "7-day battery life"],
  },
  {
    id: "fire-boltt-ninja-call-pro",
    name: "Fire-Boltt Ninja Call Pro Plus Smartwatch",
    tagline: "1.83\" Display, AI Voice Assistant",
    description:
      "Feature-rich smartwatch with large display, Bluetooth calling, built-in games, and comprehensive health monitoring at an affordable price.",
    priceCents: 1699,
    compareAtCents: 19999,
    category: "Wearables",
    rating: 4.2,
    reviews: 22341,
    stock: 178,
    featured: false,
    features: ["1.83\" HD display", "Bluetooth calling", "AI voice assistant", "100+ sports modes", "IP67 water resistant"],
  },
  {
    id: "mi-smart-band-8",
    name: "Xiaomi Smart Band 8",
    tagline: "150+ sport modes, 16-day battery",
    description:
      "Slim and lightweight fitness band with a vibrant AMOLED display, accurate health tracking, and an impressive 16-day battery life.",
    priceCents: 2499,
    compareAtCents: 3999,
    category: "Wearables",
    rating: 4.5,
    reviews: 9876,
    stock: 112,
    featured: false,
    features: ["1.62\" AMOLED display", "150+ workout modes", "24x7 heart rate & SpO2", "16-day battery life", "5ATM water resistant"],
  },

  // Accessories - Keyboards, Mice, Chargers, Cables
  {
    id: "logitech-mx-master-3s",
    name: "Logitech MX Master 3S Wireless Mouse",
    tagline: "Ergonomic precision for power users",
    description:
      "The ultimate productivity mouse with 8K DPI sensor, quiet clicks, MagSpeed scrolling, and app-specific customization. Charges via USB-C.",
    priceCents: 9499,
    compareAtCents: 10995,
    category: "Accessories",
    rating: 4.8,
    reviews: 4532,
    stock: 64,
    featured: true,
    features: ["8000 DPI Darkfield sensor", "MagSpeed electromagnetic scrolling", "Quiet Clicks technology", "USB-C quick charging", "Multi-device connectivity"],
  },
  {
    id: "logitech-k380",
    name: "Logitech K380 Multi-Device Bluetooth Keyboard",
    tagline: "Slim, quiet & connects to 3 devices",
    description:
      "Compact wireless keyboard that seamlessly switches between up to 3 devices. Perfect for laptop, tablet, and phone. Long-lasting battery life.",
    priceCents: 2999,
    compareAtCents: 3995,
    category: "Accessories",
    rating: 4.6,
    reviews: 8721,
    stock: 98,
    featured: false,
    features: ["Multi-device pairing (up to 3)", "2-year battery life", "Compact and portable", "Quiet, comfortable typing", "Works with Windows, Mac, ChromeOS, Android, iOS"],
  },
  {
    id: "redragon-k617",
    name: "Redragon K617 Fizz 60% Wired Mechanical Keyboard",
    tagline: "Compact gaming keyboard with hot-swappable",
    description:
      "Ultra-compact 60% layout mechanical keyboard with hot-swappable red switches, RGB backlighting, and durable build quality.",
    priceCents: 2999,
    compareAtCents: 4499,
    category: "Accessories",
    rating: 4.5,
    reviews: 6234,
    stock: 76,
    featured: false,
    features: ["60% compact layout", "Hot-swappable Outemu Red switches", "16.8M RGB customization", "N-key rollover", "Detachable USB-C cable"],
  },
  {
    id: "anker-powercore-20000",
    name: "Anker PowerCore 20000mAh Power Bank",
    tagline: "High-capacity portable charger",
    description:
      "20,000mAh capacity charges your phone up to 4 times. Anker's PowerIQ technology delivers optimal charging speed for your devices.",
    priceCents: 3499,
    compareAtCents: 4999,
    category: "Accessories",
    rating: 4.7,
    reviews: 12456,
    stock: 142,
    featured: false,
    features: ["20000mAh capacity", "PowerIQ & VoltageBoost", "Dual USB-A output", "18W fast charging", "Ultra-compact design"],
  },
  {
    id: "mi-67w-charger",
    name: "Xiaomi 67W Turbo Charging Adapter with Cable",
    tagline: "Blazing fast charging",
    description:
      "67W fast charger with USB-C cable. Compatible with a wide range of devices supporting PD and QC charging protocols.",
    priceCents: 1999,
    compareAtCents: 2999,
    category: "Accessories",
    rating: 4.6,
    reviews: 8976,
    stock: 186,
    featured: false,
    features: ["67W Turbo Charging", "USB-C to USB-C cable included", "Multi-protocol support", "Compact design", "Built-in safeguards"],
  },
  {
    id: "amazon-basics-usb-c-hub",
    name: "Amazon Basics 7-in-1 USB-C Hub",
    tagline: "Expand your connectivity",
    description:
      "All-in-one USB-C hub with HDMI, USB 3.0 ports, SD/microSD card reader, and PD charging. Perfect for laptops and ultrabooks.",
    priceCents: 2999,
    compareAtCents: 4499,
    category: "Accessories",
    rating: 4.4,
    reviews: 5432,
    stock: 94,
    featured: false,
    features: ["7 ports in 1", "4K HDMI output", "3x USB 3.0 ports", "SD & microSD card slots", "100W Power Delivery"],
  },
  {
    id: "zebronics-webcam",
    name: "Zebronics Zeb-Crystal Pro 1080p Webcam",
    tagline: "Full HD webcam for meetings",
    description:
      "1080p Full HD webcam with built-in mic, auto-focus, and plug-and-play setup. Ideal for video calls, streaming, and online classes.",
    priceCents: 1299,
    compareAtCents: 2499,
    category: "Accessories",
    rating: 4.2,
    reviews: 6789,
    stock: 128,
    featured: false,
    features: ["1080p Full HD resolution", "Built-in dual microphone", "Auto-focus", "Wide angle lens", "USB plug & play"],
  },

  // Tablets
  {
    id: "apple-ipad-10th-gen",
    name: "Apple iPad (10th Generation) 64GB Wi-Fi",
    tagline: "Colorful, capable, incredibly fun",
    description:
      "The redesigned iPad with a 10.9-inch Liquid Retina display, A14 Bionic chip, and support for Apple Pencil (1st gen) and Magic Keyboard Folio.",
    priceCents: 34999,
    compareAtCents: 39999,
    category: "Tablets",
    rating: 4.8,
    reviews: 2134,
    stock: 24,
    featured: true,
    features: ["10.9\" Liquid Retina display", "A14 Bionic chip", "12MP front & back cameras", "All-day battery life", "Touch ID in top button"],
  },
  {
    id: "samsung-galaxy-tab-a9",
    name: "Samsung Galaxy Tab A9+ 64GB Wi-Fi",
    tagline: "Big screen, family-friendly",
    description:
      "11-inch display perfect for streaming, gaming, and learning. Quad speakers with Dolby Atmos deliver immersive sound. Great for the whole family.",
    priceCents: 21999,
    compareAtCents: 27999,
    category: "Tablets",
    rating: 4.5,
    reviews: 1876,
    stock: 42,
    featured: false,
    features: ["11\" TFT LCD display", "Snapdragon 695 processor", "Quad speakers with Dolby Atmos", "Up to 8GB RAM expandable", "Long-lasting battery"],
  },
  {
    id: "lenovo-tab-m11",
    name: "Lenovo Tab M11 128GB Wi-Fi+LTE",
    tagline: "Entertainment on the go",
    description:
      "Portable 11-inch tablet with MediaTek Helio G88 processor, dual JBL speakers, and up to 10 hours of video playback. Ideal for students and families.",
    priceCents: 15999,
    compareAtCents: 19999,
    category: "Tablets",
    rating: 4.4,
    reviews: 1543,
    stock: 56,
    featured: false,
    features: ["11\" 2K display", "MediaTek Helio G88", "Dual JBL speakers", "10-hour battery life", "Pen support (sold separately)"],
  },
  {
    id: "xiaomi-pad-6",
    name: "Xiaomi Pad 6 128GB Wi-Fi",
    tagline: "Powerful performance, stunning display",
    description:
      "2.8K 11-inch display with 144Hz refresh rate, Snapdragon 870 processor, and quad speakers with Dolby Atmos. Exceptional value for money.",
    priceCents: 26999,
    compareAtCents: 29999,
    category: "Tablets",
    rating: 4.7,
    reviews: 2341,
    stock: 38,
    featured: false,
    features: ["11\" 2.8K 144Hz display", "Snapdragon 870 processor", "Quad speakers Dolby Atmos", "8840mAh battery with 33W charging", "MIUI Pad optimized UI"],
  },
  {
    id: "amazon-fire-hd-10",
    name: "Amazon Fire HD 10 (2023) 64GB",
    tagline: "Affordable entertainment tablet",
    description:
      "Bright 10.1-inch Full HD display with faster performance, longer battery life, and seamless access to streaming apps. Great value for entertainment.",
    priceCents: 13999,
    compareAtCents: 14999,
    category: "Tablets",
    rating: 4.5,
    reviews: 4521,
    stock: 72,
    featured: false,
    features: ["10.1\" Full HD 1080p display", "Octa-core processor", "Up to 13 hours battery", "Expandable storage up to 1TB", "Alexa hands-free"],
  },

  // Drones
  {
    id: "dji-mini-4-pro",
    name: "DJI Mini 4 Pro Fly More Combo",
    tagline: "Mini drone, pro performance",
    description:
      "Under 249g drone with 4K HDR video, omnidirectional obstacle sensing, and 34-minute flight time. Perfect for travel and capturing stunning aerial shots.",
    priceCents: 95999,
    compareAtCents: 109999,
    category: "Drones",
    rating: 4.9,
    reviews: 876,
    stock: 12,
    featured: true,
    features: ["Under 249g - no registration needed", "4K HDR video 60fps", "Omnidirectional obstacle avoidance", "34 min max flight time", "O4 video transmission"],
  },
  {
    id: "dji-air-3",
    name: "DJI Air 3 Fly More Combo",
    tagline: "Dual cameras, endless possibilities",
    description:
      "Dual-camera drone with wide-angle and medium telephoto lenses, 46-minute flight time, and omnidirectional obstacle sensing for safer flights.",
    priceCents: 154999,
    compareAtCents: 169999,
    category: "Drones",
    rating: 4.9,
    reviews: 543,
    stock: 8,
    featured: false,
    features: ["Dual primary cameras", "46 min max flight time", "Omnidirectional obstacle sensing", "O4 HD video transmission", "Advanced intelligent shooting"],
  },
  {
    id: "holy-stone-hs175d",
    name: "Holy Stone HS175D Foldable GPS Drone",
    tagline: "Beginner-friendly with 4K camera",
    description:
      "GPS-assisted drone with 4K camera, follow me mode, auto-return, and up to 46 minutes total flight time with two batteries. Great for beginners.",
    priceCents: 15999,
    compareAtCents: 24999,
    category: "Drones",
    rating: 4.3,
    reviews: 2341,
    stock: 46,
    featured: false,
    features: ["4K camera with adjustable angle", "GPS auto return", "Follow Me & Circle Fly", "46 min total flight time (2 batteries)", "Foldable design"],
  },
  {
    id: "ryze-tello",
    name: "Ryze Tello Mini Drone",
    tagline: "Perfect first drone for kids & beginners",
    description:
      "Ultra-lightweight drone powered by DJI technology. Easy to fly, programmable with Scratch, and perfect for learning the basics of drone flight.",
    priceCents: 8999,
    compareAtCents: 10999,
    category: "Drones",
    rating: 4.5,
    reviews: 3421,
    stock: 68,
    featured: false,
    features: ["13 min flight time", "720p HD camera", "EZ Shots for easy filming", "Scratch programming compatible", "Throw & Go takeoff"],
  },

  // Home - Lighting, Smart Home, Organization
  {
    id: "philips-hue-white-ambiance",
    name: "Philips Hue White & Color Ambiance Starter Kit",
    tagline: "Smart lighting for every mood",
    description:
      "Transform your space with 16 million colors and shades of white. Control with app, voice assistants, or set schedules. Includes 3 bulbs and Hue Bridge.",
    priceCents: 7999,
    compareAtCents: 9999,
    category: "Home",
    rating: 4.7,
    reviews: 2876,
    stock: 42,
    featured: true,
    features: ["16M colors + warm to cool white", "Voice control with Alexa/Google Home", "Entertainment sync", "Schedules & routines", "Works with Apple HomeKit"],
  },
  {
    id: "wipro-garnet-smart-bulb",
    name: "Wipro Garnet 9W Smart LED Bulb",
    tagline: "16M colors, music sync",
    description:
      "Affordable smart bulb with 16 million colors, tunable white, music sync, and voice control. No hub required - connects directly to WiFi.",
    priceCents: 599,
    compareAtCents: 1299,
    category: "Home",
    rating: 4.3,
    reviews: 9876,
    stock: 234,
    featured: false,
    features: ["9W = 60W equivalent", "16M colors", "Music sync mode", "Schedule & timer", "Works with Alexa & Google Assistant"],
  },
  {
    id: "syska-smart-plug",
    name: "Syska Smart Plug 16A",
    tagline: "Make any appliance smart",
    description:
      "Control your home appliances remotely with this WiFi smart plug. Set schedules, timers, and use voice commands with Alexa or Google Home.",
    priceCents: 699,
    compareAtCents: 1499,
    category: "Home",
    rating: 4.2,
    reviews: 7654,
    stock: 198,
    featured: false,
    features: ["16A high power rating", "Remote control via app", "Voice control compatible", "Timer & schedule", "No hub required"],
  },
  {
    id: "philips-audio-desk-lamp",
    name: "Philips LED Desk Lamp with EyeCare",
    tagline: "Flicker-free, adjustable lighting",
    description:
      "EyeCare technology reduces eye strain with flicker-free light. Multiple brightness levels and color temperatures to suit any task.",
    priceCents: 2499,
    compareAtCents: 3999,
    category: "Home",
    rating: 4.6,
    reviews: 4321,
    stock: 84,
    featured: false,
    features: ["EyeCare flicker-free technology", "4 brightness levels", "Adjustable color temperature", "Touch control", "Energy efficient LED"],
  },
  {
    id: "atomberg-renesa-fan",
    name: "Atomberg Renesa 1200mm BLDC Ceiling Fan",
    tagline: "Energy saving, silent operation",
    description:
      "Revolutionary BLDC motor consumes 65% less power than conventional fans. Remote control, timer function, and boost mode for instant cooling.",
    priceCents: 3499,
    compareAtCents: 4999,
    category: "Home",
    rating: 4.7,
    reviews: 6543,
    stock: 62,
    featured: false,
    features: ["1200mm sweep", "BLDC motor - 65% energy saving", "Remote control included", "Boost mode & timer", "3-year warranty"],
  },

  // Cameras
  {
    id: "canon-eos-r50",
    name: "Canon EOS R50 Mirrorless Camera with RF-S 18-45mm",
    tagline: "Perfect for content creators",
    description:
      "Compact mirrorless camera with 24.2MP APS-C sensor, 4K video recording, and advanced autofocus. Ideal for photography and vlogging.",
    priceCents: 67999,
    compareAtCents: 74999,
    category: "Cameras",
    rating: 4.8,
    reviews: 1234,
    stock: 18,
    featured: true,
    features: ["24.2MP APS-C CMOS sensor", "4K 30p video recording", "Dual Pixel CMOS AF II", "Vari-angle touchscreen", "Compact & lightweight"],
  },
  {
    id: "sony-alpha-zv-e10",
    name: "Sony Alpha ZV-E10 Mirrorless Vlog Camera",
    tagline: "Designed for content creation",
    description:
      "Vlog-focused mirrorless camera with large APS-C sensor, interchangeable lenses, flip-out screen, and excellent audio capabilities.",
    priceCents: 59999,
    compareAtCents: 64999,
    category: "Cameras",
    rating: 4.7,
    reviews: 987,
    stock: 22,
    featured: false,
    features: ["24.2MP APS-C Exmor CMOS", "4K 30p video", "Product Showcase Setting", "Flip-out vari-angle screen", "Directional 3-capsule mic"],
  },
  {
    id: "gopro-hero-12-black",
    name: "GoPro HERO12 Black Action Camera",
    tagline: "Rugged, waterproof, cinematic",
    description:
      "Next-level action camera with 5.3K video, HyperSmooth 6.0 stabilization, HDR photos and video, and up to 2x longer runtime.",
    priceCents: 44999,
    compareAtCents: 49999,
    category: "Cameras",
    rating: 4.7,
    reviews: 2156,
    stock: 34,
    featured: false,
    features: ["5.3K60 + 4K120 video", "HyperSmooth 6.0 stabilization", "Waterproof to 33ft", "HDR photos & video", "2x longer runtime"],
  },
  {
    id: "insta360-x3",
    name: "Insta360 X3 360 Action Camera",
    tagline: "Capture everything in 360°",
    description:
      "360-degree action camera with 5.7K 360 video, dual 1/2\" sensors, FlowState stabilization, and invisible selfie stick effect.",
    priceCents: 44999,
    compareAtCents: 49999,
    category: "Cameras",
    rating: 4.6,
    reviews: 1543,
    stock: 28,
    featured: false,
    features: ["5.7K 360 video", "Dual 1/2\" sensors", "FlowState stabilization", "4K single-lens mode", "IPX8 waterproof with dive case"],
  },
  {
    id: "nikon-coolpix-b500",
    name: "Nikon Coolpix B500 Digital Camera",
    tagline: "Super zoom, easy to use",
    description:
      "Bridge camera with 40x optical zoom, 16MP CMOS sensor, and built-in Wi-Fi/NFC. Perfect for travel and family photography.",
    priceCents: 19999,
    compareAtCents: 24999,
    category: "Cameras",
    rating: 4.4,
    reviews: 2876,
    stock: 46,
    featured: false,
    features: ["40x optical zoom (80x Dynamic Fine Zoom)", "16MP BSI CMOS sensor", "Full HD 1080p video", "Tilting LCD screen", "SnapBridge connectivity"],
  },
];

const artByCategory = categoryArt;

export const seedProducts: SeedProduct[] = catalog.map((p) => {
  const art = artByCategory[p.category] ?? { emoji: "🛒", gradient: "from-zinc-500 to-slate-600" };
  return {
    ...p,
    emoji: art.emoji,
    gradient: art.gradient,
    image: pickImage(p.category, p.id),
  };
});

export const seedProductCount = seedProducts.length;

// ---------------------------------------------------------------------------
// Seed reviews (deterministic)
// ---------------------------------------------------------------------------

const reviewerNames = [
  "Rahul S.", "Priya M.", "Amit K.", "Sneha R.", "Vikram P.", "Anjali D.",
  "Rohit T.", "Neha G.", "Karan B.", "Pooja J.", "Arjun V.", "Divya N.",
];

const reviewTitles = [
  "Excellent product, highly recommended",
  "Great value for money",
  "Worth every rupee",
  "Exactly as described",
  "Amazing quality and performance",
  "Very happy with this purchase",
  "Good product, fast delivery",
  "Exceeded my expectations",
];

const reviewBodies = [
  "Build quality is excellent. Using it daily and it's been flawless so far. Definitely worth the price.",
  "Great product overall. Delivery was quick and packaging was secure. Would buy again.",
  "Works exactly as advertised. The features are impressive and it's very user-friendly. Highly recommended.",
  "Very good value for money. Performance is great and it looks premium. Happy with my purchase.",
  "Impressed with the quality. Better than expected. Using it for a while now with no issues at all.",
  "Fantastic product! Exceeded all my expectations. Great build quality and amazing features.",
];

export function seedReviewsFor(productId: string): Review[] {
  const seed = hashCode(productId);
  const count = 3 + (seed % 3);
  const reviews: Review[] = [];
  for (let i = 0; i < count; i++) {
    const offset = seed + i * 7;
    const date = new Date(
      Date.UTC(2026, (seed + i) % 12, 1 + (seed % 28) + i),
    )
      .toISOString()
      .slice(0, 10);
    reviews.push({
      author: reviewerNames[offset % reviewerNames.length],
      rating: Math.min(5, 4 + ((seed + i) % 2)),
      title: reviewTitles[(offset + i) % reviewTitles.length],
      body: reviewBodies[(offset * 3 + i) % reviewBodies.length],
      date,
      verified: true,
    });
  }
  return reviews;
}
