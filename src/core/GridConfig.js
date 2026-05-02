/**
 * GridConfig.js
 * Default configuration + deep merge utility.
 * Users override only what they need.
 */
var GridConfig = (function () {
  var defaults = {
    containerId: "tableGrid",
    columns: 12,
    rows: 8,
    gap: 8,
    cellSize: 70,
    draggable: true,
    // realTime: false means editMode: true
    realTime: false,
    trashZone: true,
    swapAnimation: true,
    showSizeBadge: true,
    showHint: false,
    showGridLines: true, // false hides grid lines even in edit mode
    mode: 'edit', // 'edit' or 'view' — determines whether the 'Edit Layout' option appears in the settings popup

    theme: {
      // Primary accent — buttons, active states, focus rings, layer switcher
      primary: "#6366f1",
      primaryDark: "#4f46e5",
      primaryLight: "#818cf8",
      // Surface — toolbar, layer panel background (light by default)
      surface: "#f8fafc",
      surfaceAlt: "#334155", // secondary: separators, icon backgrounds
      surfaceHover: "#475569", // hover on surface elements
      surfaceMuted: "#64748b", // labels, secondary text
      surfaceSubtle: "#94a3b8", // icon color on dark elements
      surfaceBright: "#f1f5f9", // cancel button bg, highlights
      // Semantic
      danger: "#dc2626", // errors, trash zone
      border: "#e5e7eb", // canvas border, input borders
      // Zoom controls
      zoomBg: "rgba(255,255,255,0.92)",
      zoomBtnBg: "#f1f5f9",
      zoomBtnColor: "#334155",
      zoomBtnHover: "#e2e8f0",
      // Canvas
      canvasHeight: "600px",
      gridBg: "#ffffff",
      cellBg: "#fbfbfb",
    },

    zoom: {
      enabled: true,
      initial: 1,
      min: 0.4,
      max: 2,
      step: 0.1,
      mouseWheel: true,
      showControls: true,
      labelReset: "↺",
      fullscreen: true,
    },

    statusColors: {
      ordering: "#3b82f6",
      forpayment: "#e94560",
      paid: "#16a34a",
      unoccupied: "#6b7280",
    },

    // Each shape defines its own CSS rules — no code changes needed to add one
    shapes: {
      square: {
        label: "Square",
        icon: "fa-regular fa-square",
        minCols: 1,
        minRows: 1,
        preferSquare: false,
        clipPath: null,
        borderRadius: "8px",
      },
      circle: {
        label: "Circle",
        icon: "fa-regular fa-circle",
        minCols: 2,
        minRows: 2,
        preferSquare: true,
        clipPath: null,
        borderRadius: "50%",
      },
    },

    newTable: {
      defaultStatus: "available",
      defaultSeats: 4,
      namePrefix: "Table",
    },

    // Layers → Rooms → Tables hierarchy
    // layers: [{ id, label, rooms: [{ id, label, icon, tables: [] }] }]
    // Each layer is a tab in the toolbar; each room is an entry in the room switcher panel
    layers: null,
    roomPreview: true,
    // Room switcher style: 'genshin' (floating side panel) or 'simple' (browser tab bar)
    roomStyle: "genshin",

    // Icon picker for layer icons
    // icon types: "fa" (FontAwesome class), "svg" (URL/path to SVG), "img" (URL/path to PNG/JPG/etc.)
    iconPicker: {
      maxTextLength: 4, // max chars when using text as icon
      allowText: true, // allow plain-text icons
      icons: [
        // FontAwesome icons
        { type: "fa", value: "fa-solid fa-utensils", label: "Utensils" },
        { type: "fa", value: "fa-solid fa-mug-saucer", label: "Coffee" },
        { type: "fa", value: "fa-solid fa-champagne-glasses", label: "Bar" },
        { type: "fa", value: "fa-solid fa-couch", label: "Lounge" },
        { type: "fa", value: "fa-solid fa-umbrella-beach", label: "Patio" },
        { type: "fa", value: "fa-solid fa-music", label: "Music" },
        { type: "fa", value: "fa-solid fa-star", label: "Star" },
        { type: "fa", value: "fa-solid fa-heart", label: "Heart" },
        { type: "fa", value: "fa-solid fa-fire", label: "Fire" },
        { type: "fa", value: "fa-solid fa-bolt", label: "Bolt" },
        { type: "fa", value: "fa-solid fa-leaf", label: "Leaf" },
        { type: "fa", value: "fa-solid fa-cake-candles", label: "Party" },
        { type: "fa", value: "fa-solid fa-bell-concierge", label: "Service" },
        { type: "fa", value: "fa-solid fa-wine-glass", label: "Wine" },
        { type: "fa", value: "fa-solid fa-burger", label: "Burger" },
        { type: "fa", value: "fa-solid fa-pizza-slice", label: "Pizza" },
        // SVG example (user provides path):
        // { type: "svg", value: "/icons/custom.svg", label: "Custom" },
        // Image example (user provides path):
        // { type: "img", value: "/icons/logo.png", label: "Logo" },
      ],
    },

    // Callbacks — user overrides these
    onSwap: null,
    onLayoutChange: null,
    onZoom: null,
    onTableCreated: null,
    onCreateTable: null,
    onLayerChange: null, // fn(layer) — fired when active layer changes (tab switch)
    onLayerDelete: null, // fn(removedLayer) — fired when a layer tab is deleted
    onLayerReorder: null, // fn(layers) — fired when layer tabs are reordered
    onCreateLayer: null, // fn(commit) — override the default add-layer form; call commit({label})
    onRoomChange: null, // fn(room, tables) — fired when active room changes
    onRoomDelete: null, // fn(removedRoom) — fired when a room is deleted
    onRoomReorder: null, // fn(rooms) — fired when rooms are reordered
    onCreateRoom: null, // fn(commit) — override the default add-room form; call commit({label, icon})
    onTableClick: null, // fn(table) — fired when a table card is clicked (view mode only, not during edit)
  };

  /**
   * Deep merge: user config wins over defaults.
   * Only goes two levels deep (sufficient for this config shape).
   */
  function merge(userConfig) {
    var result = {};

    // Copy all defaults
    for (var key in defaults) {
      if (!defaults.hasOwnProperty(key)) continue;

      if (
        typeof defaults[key] === "object" &&
        defaults[key] !== null &&
        !Array.isArray(defaults[key]) &&
        typeof defaults[key] !== "function"
      ) {
        // Deep merge one level
        result[key] = {};
        for (var dk in defaults[key]) {
          if (defaults[key].hasOwnProperty(dk)) {
            result[key][dk] = defaults[key][dk];
          }
        }
        // User values overwrite
        if (userConfig && userConfig[key]) {
          for (var uk in userConfig[key]) {
            if (userConfig[key].hasOwnProperty(uk)) {
              result[key][uk] = userConfig[key][uk];
            }
          }
        }
      } else {
        result[key] = defaults[key];
      }
    }

    // Top-level user overrides (non-object or missing from defaults)
    if (userConfig) {
      for (var ukey in userConfig) {
        if (!userConfig.hasOwnProperty(ukey)) continue;
        if (result[ukey] === undefined) {
          result[ukey] = userConfig[ukey];
        } else if (Array.isArray(userConfig[ukey])) {
          // Arrays (e.g. tables) are always replaced wholesale
          result[ukey] = userConfig[ukey];
        } else if (
          typeof userConfig[ukey] !== "object" ||
          userConfig[ukey] === null
        ) {
          result[ukey] = userConfig[ukey];
        }
      }
    }

    return result;
  }

  return { defaults: defaults, merge: merge };
})();
