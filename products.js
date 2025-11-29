// Simple Mirlos Treasures catalog
// This must be loaded BEFORE cart.js

const products = [
  {
    id: "michael-kors-colorblock-pebbled-leather-satchel",
    title: "👜 MICHAEL KORS Colorblock Pebbled Leather Satchel",
    price: 150,
    category: "purses",
    description:
      "Sophisticated and structured, this MICHAEL KORS satchel features a timeless colorblock design in black and cream.",
    condition: "new",
    image: "images/mkpanda-1.jpg",
    images: [
      "images/mkpanda-1.jpg",
      "images/mkpanda-2.jpg",
      "images/mkpanda-3.jpg",
      "images/mkpanda-4.jpg"
    ],
    featured: true,
    inventory: 1
  },

  {
    id: "hand-painted-ceramic-sugar-skull-pair",
    title: "💀 Hand-Painted Ceramic Sugar Skull Pair",
    price: 70,
    category: "home",
    description:
      "Vibrant, detailed Day of the Dead sugar skulls – a hand-painted ceramic pair perfect for shelf décor or altar displays.",
    condition: "new",
    image: "images/spsod-1.jpg",
    images: [
      "images/spsod-1.jpg",
      "images/spsod-2.jpg",
      "images/spsod-3.jpg"
    ],
    featured: true,
    inventory: 1
  }

  // Add more products here following the same structure
];

// Expose globally so cart.js can see it
if (typeof window !== "undefined") {
  window.products = products;
}
