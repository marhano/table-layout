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
    trashZone: true,
    swapAnimation: true,
    showSizeBadge: true,
    showHint: false,

    theme: {
      canvasHeight: "600px",
      gridBg: "#ffffff",
      cellBg: "#fbfbfb",
      toolbarBg: "#1e293b",
      zoomBtnBg: "#e5e7eb",
      zoomBtnColor: "#111827",
      zoomBtnHoverBg: "#6366f1",
    },

    zoom: {
      enabled: true,
      initial: 1,
      min: 0.4,
      max: 2,
      step: 0.1,
      mouseWheel: true,
      showControls: true,
      showLabel: true,
      labelZoomIn: "＋",
      labelZoomOut: "－",
      labelReset: "↺",
    },

    statusColors: {
      available: "#16a34a",
      occupied: "#e94560",
      reserved: "#d97706",
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
      hexagon: {
        label: "Hexagon",
        icon: "fa-solid fa-hexagon",
        minCols: 3,
        minRows: 2,
        preferSquare: false,
        clipPath:
          "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
        borderRadius: "0",
      },
      diamond: {
        label: "Diamond",
        icon: "fa-solid fa-diamond",
        minCols: 2,
        minRows: 2,
        preferSquare: true,
        clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
        borderRadius: "0",
      },
      triangle: {
        label: "Triangle",
        icon: "fa-solid fa-triangle",
        minCols: 2,
        minRows: 2,
        preferSquare: true,
        clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
        borderRadius: "0",
      },
    },

    newTable: {
      defaultStatus: "available",
      defaultSeats: 4,
      namePrefix: "Table",
    },

    tables: [],

    // Callbacks — user overrides these
    onSwap: null,
    onLayoutChange: null,
    onZoom: null,
    onTableCreated: null,
    onCreateTable: null,
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
