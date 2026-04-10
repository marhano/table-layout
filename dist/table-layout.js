/*!
 * table-layout.js v0.0.1
 * Restaurant Table Layout Grid Library
 * Built: 2026-04-10T05:12:57.909Z
 * Requires: jQuery 3+
 * License: MIT
 */

/* src/core/GridConfig.js */
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
    editMode: true,
    trashZone: true,
    swapAnimation: true,
    showSizeBadge: true,
    showHint: false,

    theme: {
      // Primary accent — buttons, active states, focus rings, layer switcher
      primary:        "#6366f1",
      primaryDark:    "#4f46e5",
      primaryLight:   "#818cf8",
      // Surface — toolbar, layer panel background (light by default)
      surface:        "#f8fafc",
      surfaceAlt:     "#334155",   // secondary: separators, icon backgrounds
      surfaceHover:   "#475569",   // hover on surface elements
      surfaceMuted:   "#64748b",   // labels, secondary text
      surfaceSubtle:  "#94a3b8",   // icon color on dark elements
      surfaceBright:  "#f1f5f9",   // cancel button bg, highlights
      // Semantic
      danger:         "#dc2626",   // errors, trash zone
      border:         "#e5e7eb",   // canvas border, input borders
      // Zoom controls
      zoomBg:         "rgba(255,255,255,0.92)",
      zoomBtnBg:      "#f1f5f9",
      zoomBtnColor:   "#334155",
      zoomBtnHover:   "#e2e8f0",
      // Canvas
      canvasHeight:   "600px",
      gridBg:         "#ffffff",
      cellBg:         "#fbfbfb",
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
        icon: "fa-regular fa-gem",
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

    // Layer switcher — set to an array of {id, label, icon, tables} to enable
    // icon can be an FA class string (e.g. "fa-solid fa-utensils") or short text/emoji ("A", "1F")
    layers: null,

    // Icon picker for layer icons
    // icon types: "fa" (FontAwesome class), "svg" (URL/path to SVG), "img" (URL/path to PNG/JPG/etc.)
    iconPicker: {
      maxTextLength: 4,         // max chars when using text as icon
      allowText: true,          // allow plain-text icons
      icons: [
        // FontAwesome icons
        { type: "fa", value: "fa-solid fa-utensils",      label: "Utensils" },
        { type: "fa", value: "fa-solid fa-mug-saucer",    label: "Coffee" },
        { type: "fa", value: "fa-solid fa-champagne-glasses", label: "Bar" },
        { type: "fa", value: "fa-solid fa-couch",         label: "Lounge" },
        { type: "fa", value: "fa-solid fa-umbrella-beach", label: "Patio" },
        { type: "fa", value: "fa-solid fa-music",         label: "Music" },
        { type: "fa", value: "fa-solid fa-star",          label: "Star" },
        { type: "fa", value: "fa-solid fa-heart",         label: "Heart" },
        { type: "fa", value: "fa-solid fa-fire",          label: "Fire" },
        { type: "fa", value: "fa-solid fa-bolt",          label: "Bolt" },
        { type: "fa", value: "fa-solid fa-leaf",          label: "Leaf" },
        { type: "fa", value: "fa-solid fa-cake-candles",  label: "Party" },
        { type: "fa", value: "fa-solid fa-bell-concierge", label: "Service" },
        { type: "fa", value: "fa-solid fa-wine-glass",    label: "Wine" },
        { type: "fa", value: "fa-solid fa-burger",        label: "Burger" },
        { type: "fa", value: "fa-solid fa-pizza-slice",   label: "Pizza" },
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
    onLayerChange: null,  // fn(layer, tables) — fired when active layer changes
    onLayerDelete: null,  // fn(removedLayer) — fired when a layer is deleted
    onLayerReorder: null, // fn(layers) — fired when layers are reordered
    onCreateLayer: null,     // fn(commit) — override the default add-layer form; call commit({label, icon})
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


/* src/core/GridEvents.js */
/**
 * GridEvents.js
 * Internal pub/sub event bus.
 * Modules communicate through events — not direct calls.
 * This keeps modules decoupled and makes it easy to add
 * new modules without touching existing ones.
 *
 * Usage:
 *   GridEvents.on('table:created', function(table) { ... });
 *   GridEvents.emit('table:created', newTable);
 */
var GridEvents = (function () {
  var _listeners = {};

  function on(event, callback) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(callback);
  }

  function off(event, callback) {
    if (!_listeners[event]) return;
    if (!callback) {
      _listeners[event] = [];
    } else {
      _listeners[event] = _listeners[event].filter(function (cb) {
        return cb !== callback;
      });
    }
  }

  function emit(event, data) {
    if (!_listeners[event]) return;
    _listeners[event].forEach(function (cb) {
      cb(data);
    });
  }

  function reset() {
    _listeners = {};
  }

  return { on: on, off: off, emit: emit, reset: reset };
})();


/* src/core/GridCore.js */
/**
 * GridCore.js
 * Pure state and logic — zero DOM, zero jQuery.
 * All other modules read/write state through this API.
 */
var GridCore = (function () {
  var _cfg = null;
  var _tables = [];
  var _counter = 1;
  var _layers = null;
  var _activeLayerId = null;
  var _editMode = false;
  var _snapshot = null;

  // ── Setup ─────────────────────────────────────────

  function init(cfg) {
    _cfg = cfg;
    if (cfg.layers && cfg.layers.length) {
      _layers = jQuery.extend(true, [], cfg.layers);
      _layers.forEach(function (l) { if (!Array.isArray(l.tables)) l.tables = []; });
      _activeLayerId = _layers[0].id;
      _tables = jQuery.extend(true, [], _layers[0].tables);
    } else {
      _layers = null;
      _activeLayerId = null;
      _tables = [];
    }
    _counter = _tables.length + 1;
  }

  function reset() {
    _cfg = null;
    _tables = [];
    _counter = 1;
    _layers = null;
    _activeLayerId = null;
    _editMode = false;
    _snapshot = null;
  }

  // ── Config ────────────────────────────────────────

  function getConfig() {
    return _cfg;
  }

  // ── Tables ────────────────────────────────────────

  function getTables() {
    return _tables;
  }
  function getCounter() {
    return _counter;
  }
  function bumpCounter() {
    _counter++;
  }

  function tableById(id) {
    return (
      _tables.find(function (t) {
        return t.id === id;
      }) || null
    );
  }

  function addTable(table) {
    _tables.push(table);
    bumpCounter();
    GridEvents.emit("table:added", table);
  }

  function removeTable(id) {
    var idx = _tables.findIndex(function (t) {
      return t.id === id;
    });
    if (idx === -1) return false;
    var removed = _tables.splice(idx, 1)[0];
    GridEvents.emit("table:removed", removed);
    return true;
  }

  function updateTable(id, props) {
    var t = tableById(id);
    if (!t) return false;
    jQuery.extend(t, props);
    GridEvents.emit("table:updated", t);
    return true;
  }

  function moveTable(id, col, row) {
    return updateTable(id, { col: col, row: row });
  }

  // ── Layer management ──────────────────────────────

  function getLayers() {
    return _layers || [];
  }

  function getActiveLayerId() {
    return _activeLayerId;
  }

  function getActiveLayer() {
    if (!_layers) return null;
    return _layers.find(function (l) { return l.id === _activeLayerId; }) || null;
  }

  function switchLayer(id) {
    if (!_layers) return false;
    if (_editMode) return false;
    // Save current tables into the active layer
    var current = getActiveLayer();
    if (current) current.tables = jQuery.extend(true, [], _tables);
    // Load the target layer
    var target = _layers.find(function (l) { return l.id === id; });
    if (!target) return false;
    _activeLayerId = id;
    _tables = jQuery.extend(true, [], target.tables);
    _counter = _tables.length + 1;
    GridEvents.emit("layer:switched", target);
    return true;
  }

  function addLayer(layer) {
    if (!_layers) _layers = [];
    if (!Array.isArray(layer.tables)) layer.tables = [];
    _layers.push(layer);
    GridEvents.emit("layer:added", layer);
  }

  function deleteLayer(id) {
    if (!_layers || _layers.length <= 1) return false;
    var idx = _layers.findIndex(function (l) { return l.id === id; });
    if (idx === -1) return false;
    var removed = _layers.splice(idx, 1)[0];
    // If we deleted the active layer, switch to the first remaining one
    if (_activeLayerId === id) {
      var next = _layers[Math.min(idx, _layers.length - 1)];
      _activeLayerId = next.id;
      _tables = jQuery.extend(true, [], next.tables);
      _counter = _tables.length + 1;
      GridEvents.emit("layer:switched", next);
    }
    GridEvents.emit("layer:deleted", removed);
    return true;
  }

  function reorderLayers(orderedIds) {
    if (!_layers || !orderedIds) return false;
    var map = {};
    _layers.forEach(function (l) { map[l.id] = l; });
    var reordered = [];
    orderedIds.forEach(function (id) {
      if (map[id]) reordered.push(map[id]);
    });
    // Append any layers not mentioned (safety)
    _layers.forEach(function (l) {
      if (reordered.indexOf(l) === -1) reordered.push(l);
    });
    _layers = reordered;
    GridEvents.emit("layer:reordered", _layers);
    return true;
  }

  function getAllLayersLayout() {
    if (!_layers) return null;
    // Save current tables first so the snapshot is up-to-date
    var current = getActiveLayer();
    if (current) current.tables = jQuery.extend(true, [], _tables);
    return _layers.map(function (l) { return jQuery.extend(true, {}, l); });
  }

  // ── Edit mode ─────────────────────────────────────

  function isEditing() { return _editMode; }

  function enterEditMode() {
    if (_editMode) return;
    var layerMeta = null;
    var layer = getActiveLayer();
    if (layer) layerMeta = { label: layer.label, icon: layer.icon };
    _snapshot = {
      tables: jQuery.extend(true, [], _tables),
      layerMeta: layerMeta,
    };
    _editMode = true;
    GridEvents.emit("edit:enter");
  }

  function saveEdit() {
    if (!_editMode) return;
    _snapshot = null;
    _editMode = false;
    GridEvents.emit("edit:saved");
    GridEvents.emit("edit:exit");
  }

  function discardEdit() {
    if (!_editMode) return;
    _tables = jQuery.extend(true, [], _snapshot.tables);
    _counter = _tables.length + 1;
    if (_snapshot.layerMeta) {
      var layer = getActiveLayer();
      if (layer) {
        layer.label = _snapshot.layerMeta.label;
        layer.icon = _snapshot.layerMeta.icon;
      }
    }
    _snapshot = null;
    _editMode = false;
    var restoredLayer = getActiveLayer();
    if (restoredLayer) GridEvents.emit("layer:updated", restoredLayer);
    GridEvents.emit("edit:discarded");
    GridEvents.emit("edit:exit");
  }

  function updateLayerMeta(id, props) {
    if (!_layers) return false;
    var layer = _layers.find(function (l) { return l.id === id; });
    if (!layer) return false;
    if (props.label !== undefined) layer.label = props.label;
    if (props.icon !== undefined) layer.icon = props.icon;
    GridEvents.emit("layer:updated", layer);
    return true;
  }

  // ── Layout snapshot ───────────────────────────────

  function getLayout() {
    return _tables.map(function (t) {
      return jQuery.extend({}, t);
    });
  }

  // ── Collision ─────────────────────────────────────

  function hasCollision(col, row, colSpan, rowSpan, excludeId) {
    if (col < 1 || row < 1) return true;
    if (col + colSpan - 1 > _cfg.columns) return true;
    if (row + rowSpan - 1 > _cfg.rows) return true;

    return _tables.some(function (t) {
      if (t.id === excludeId) return false;
      return !(
        col + colSpan <= t.col ||
        col >= t.col + t.colSpan ||
        row + rowSpan <= t.row ||
        row >= t.row + t.rowSpan
      );
    });
  }

  // ── Span calculation ──────────────────────────────

  function calcSpan(start, end, shapeKey) {
    var shapeDef = (_cfg.shapes || {})[shapeKey] || {};
    var minC = shapeDef.minCols || 1;
    var minR = shapeDef.minRows || 1;
    var square = shapeDef.preferSquare || false;

    var colSpan = Math.max(minC, Math.abs(end.col - start.col) + 1);
    var rowSpan = Math.max(minR, Math.abs(end.row - start.row) + 1);
    var col = Math.min(start.col, end.col);
    var row = Math.min(start.row, end.row);

    if (square) {
      var side = Math.max(colSpan, rowSpan);
      colSpan = side;
      rowSpan = side;
    }

    return { col: col, row: row, colSpan: colSpan, rowSpan: rowSpan };
  }

  // ── Shape helpers ─────────────────────────────────

  function getShapeStyles(shapeKey) {
    var shapeDef = (_cfg.shapes || {})[shapeKey] || {};
    return {
      clipPath: shapeDef.clipPath || "none",
      borderRadius: shapeDef.borderRadius || "8px",
    };
  }

  // ── Coordinate helpers ────────────────────────────

  function pxToGrid(offsetX, offsetY) {
    var unit = _cfg.cellSize + _cfg.gap;
    return {
      col: Math.max(1, Math.min(_cfg.columns, Math.floor(offsetX / unit) + 1)),
      row: Math.max(1, Math.min(_cfg.rows, Math.floor(offsetY / unit) + 1)),
    };
  }

  function cursorToGrid(clientX, clientY) {
    var gridEl = jQuery(".tl-layout-grid")[0];
    if (!gridEl) return { col: 1, row: 1 };
    var rect = gridEl.getBoundingClientRect();
    var scaleX = rect.width / (gridEl.offsetWidth || 1);
    var scaleY = rect.height / (gridEl.offsetHeight || 1);
    return pxToGrid(
      (clientX - rect.left) / scaleX,
      (clientY - rect.top) / scaleY,
    );
  }

  // ── Utilities ─────────────────────────────────────

  function hexAlpha(hex, alpha) {
    if (!hex || hex.length < 7) return "rgba(0,0,0," + alpha + ")";
    return (
      "rgba(" +
      parseInt(hex.slice(1, 3), 16) +
      "," +
      parseInt(hex.slice(3, 5), 16) +
      "," +
      parseInt(hex.slice(5, 7), 16) +
      "," +
      alpha +
      ")"
    );
  }

  // ── Public API ────────────────────────────────────

  return {
    init: init,
    reset: reset,
    getConfig: getConfig,
    getTables: getTables,
    getLayout: getLayout,
    getCounter: getCounter,
    bumpCounter: bumpCounter,
    tableById: tableById,
    addTable: addTable,
    removeTable: removeTable,
    updateTable: updateTable,
    moveTable: moveTable,
    hasCollision: hasCollision,
    calcSpan: calcSpan,
    getShapeStyles: getShapeStyles,
    pxToGrid: pxToGrid,
    cursorToGrid: cursorToGrid,
    hexAlpha: hexAlpha,
    getLayers: getLayers,
    getActiveLayerId: getActiveLayerId,
    getActiveLayer: getActiveLayer,
    switchLayer: switchLayer,
    addLayer: addLayer,
    deleteLayer: deleteLayer,
    reorderLayers: reorderLayers,
    getAllLayersLayout: getAllLayersLayout,
    isEditing: isEditing,
    enterEditMode: enterEditMode,
    saveEdit: saveEdit,
    discardEdit: discardEdit,
    updateLayerMeta: updateLayerMeta,
  };
})();


/* src/modules/GridRender.js */
/**
 * GridRender.js
 * All DOM builders. No state — pure input → jQuery element.
 */
var GridRender = (function () {
  var _ns = "tl-"; // CSS class namespace — prevents conflicts with user CSS

  function ns(cls) {
    return _ns + cls;
  }

  // ── Canvas + Grid ─────────────────────────────────

  function buildCanvas() {
    var cfg = GridCore.getConfig();

    var $canvas = jQuery("<div>")
      .addClass(ns("canvas"))
      .css({
        height: cfg.theme.canvasHeight || "600px",
        "--tl-cell-size": cfg.cellSize + cfg.gap + "px",
        background: cfg.theme.gridBg,
      });

    var $zoomArea = jQuery("<div>").addClass(ns("zoom-area"));
    var $grid = buildGrid();

    $zoomArea.append($grid);
    $canvas.append($zoomArea);

    return $canvas;
  }

  function buildGrid() {
    var cfg = GridCore.getConfig();
    var gridW = cfg.columns * cfg.cellSize + (cfg.columns - 1) * cfg.gap;
    var gridH = cfg.rows * cfg.cellSize + (cfg.rows - 1) * cfg.gap;

    var $grid = jQuery("<div>")
      .addClass(ns("layout-grid"))
      .css({
        "grid-template-columns":
          "repeat(" + cfg.columns + ", " + cfg.cellSize + "px)",
        "grid-template-rows":
          "repeat(" + cfg.rows + ", " + cfg.cellSize + "px)",
        gap: cfg.gap + "px",
        width: gridW + "px",
        height: gridH + "px",
        background: cfg.theme.gridBg,
      });

    for (var r = 1; r <= cfg.rows; r++) {
      for (var c = 1; c <= cfg.columns; c++) {
        $grid.append(buildBgCell(c, r));
      }
    }

    jQuery.each(GridCore.getTables(), function (_, t) {
      $grid.append(buildTableCard(t));
    });

    return $grid;
  }

  // ── Background cell ───────────────────────────────

  function buildBgCell(col, row) {
    var cfg = GridCore.getConfig();
    return jQuery("<div>")
      .addClass(ns("cell") + " " + ns("cell--empty"))
      .attr({ "data-col": col, "data-row": row })
      .css({
        "grid-column": col + " / span 1",
        "grid-row": row + " / span 1",
        background: cfg.theme.cellBg,
      });
  }

  // ── Table card ────────────────────────────────────

  function buildTableCard(t) {
    var cfg = GridCore.getConfig();
    var statusColor = cfg.statusColors[t.status] || "#6b7280";
    var shape = t.shape || "square";
    var styles = GridCore.getShapeStyles(shape);

    var $card = jQuery("<div>")
      .addClass(ns("table-card"))
      .attr({
        draggable: (cfg.draggable && (cfg.editMode === false || GridCore.isEditing())) ? "true" : "false",
        "data-table-id": t.id,
        "data-shape": shape,
      })
      .css({
        "grid-column": t.col + " / span " + t.colSpan,
        "grid-row": t.row + " / span " + t.rowSpan,
        background: statusColor,
        "box-shadow": "0 4px 12px " + GridCore.hexAlpha(statusColor, 0.4),
        "border-radius": styles.borderRadius,
        "clip-path": styles.clipPath,
      });

    $card.append(
      jQuery("<span>").addClass(ns("table-name")).text(t.name),
      jQuery("<span>")
        .addClass(ns("table-seats"))
        .text("Seats: " + t.seats),
      jQuery("<span>")
        .addClass(ns("table-status"))
        .text(t.status)
        .css("background", GridCore.hexAlpha(statusColor, 0.3)),
    );

    if (cfg.showSizeBadge) {
      $card.append(
        jQuery("<span>")
          .addClass(ns("table-size-badge"))
          .text(t.colSpan + "×" + t.rowSpan),
      );
    }

    return $card;
  }

  // ── Legend ────────────────────────────────────────

  function buildLegend() {
    var cfg = GridCore.getConfig();
    var $legend = jQuery("<div>").addClass(ns("legend"));
    jQuery.each(cfg.statusColors, function (status, color) {
      $legend.append(
        jQuery("<div>")
          .addClass(ns("legend-item"))
          .append(
            jQuery("<div>").addClass(ns("legend-dot")).css("background", color),
            jQuery("<span>").text(
              status.charAt(0).toUpperCase() + status.slice(1),
            ),
          ),
      );
    });
    return $legend;
  }

  // ── Ghost helpers ─────────────────────────────────

  function buildPlaceGhost(col, row, colSpan, rowSpan, invalid) {
    return jQuery("<div>")
      .addClass(ns("place-ghost"))
      .css({
        "grid-column": col + " / span " + colSpan,
        "grid-row": row + " / span " + rowSpan,
        "border-color": invalid ? "#dc2626" : "#f59e0b",
        background: invalid ? "rgba(220,38,38,0.08)" : "rgba(245,158,11,0.1)",
      })
      .text(colSpan + " × " + rowSpan);
  }

  function buildDragGhost(col, row, colSpan, rowSpan, invalid) {
    return jQuery("<div>")
      .addClass(
        ns("drop-ghost") + (invalid ? " " + ns("drop-ghost--invalid") : ""),
      )
      .css({
        "grid-column": col + " / span " + colSpan,
        "grid-row": row + " / span " + rowSpan,
      });
  }

  // ── Trash zone ─────────────────────────────────────

  function buildTrashZone() {
    return jQuery("<div>")
      .addClass(ns("trash-zone"))
      .attr("title", "Drop here to remove table")
      .html('<i class="fa-solid fa-trash-can"></i>');
  }

  // ── Public API ────────────────────────────────────

  return {
    buildCanvas: buildCanvas,
    buildGrid: buildGrid,
    buildBgCell: buildBgCell,
    buildTableCard: buildTableCard,
    buildLegend: buildLegend,
    buildPlaceGhost: buildPlaceGhost,
    buildDragGhost: buildDragGhost,
    buildTrashZone: buildTrashZone,
    ns: ns,
  };
})();


/* src/modules/GridToolbar.js */
var GridToolbar = (function () {
  var _activeTool = null;
  var _$layoutName = null;
  var _$layoutIcon = null;
  var _$editSection = null;
  var _nameEditing = false;
  var _$iconPicker = null;
  var _$settingsPopup = null;

  // ── Toolbar build ─────────────────────────────────

  function build() {
    var cfg = GridCore.getConfig();
    var $toolbar = jQuery("<div>").addClass("tl-toolbar");

    // Left: layer icon + name
    var $left = jQuery("<div>").addClass("tl-toolbar-left");

    if (cfg.layers && cfg.layers.length) {
      var activeLayer = GridCore.getActiveLayer();

      _$layoutIcon = _buildIconBadge(activeLayer);
      _$layoutIcon.on("click", function (e) {
        e.stopPropagation();
        _toggleIconPicker();
      });
      $left.append(_$layoutIcon);

      _$layoutName = jQuery("<span>")
        .addClass("tl-toolbar-layout-name")
        .text(activeLayer ? activeLayer.label : "")
        .on("click", function () { _startNameEdit(); });
      $left.append(_$layoutName);

      GridEvents.on("layer:switched", function (layer) {
        _refreshLayerDisplay(layer);
      });
    }

    $toolbar.append($left);
    $toolbar.append(jQuery("<div>").addClass("tl-toolbar-spacer"));

    // Right: settings + save/discard
    if (cfg.layers && cfg.layers.length) {
      _$editSection = jQuery("<div>").addClass("tl-toolbar-actions");
      _renderEditControls();
      $toolbar.append(_$editSection);
    }

    // Close icon picker / settings popup on outside click
    jQuery(document).on("mousedown.tl-iconpicker", function (e) {
      if (_$iconPicker && !jQuery(e.target).closest(".tl-icon-picker, .tl-toolbar-icon-badge").length) {
        _closeIconPicker();
      }
      if (_$settingsPopup && !jQuery(e.target).closest(".tl-settings-popup, .tl-toolbar-btn--settings").length) {
        _closeSettingsPopup();
      }
    });

    return $toolbar;
  }

  // ── Icon badge (display) ──────────────────────────

  function _buildIconBadge(layer) {
    var $badge = jQuery("<div>").addClass("tl-toolbar-icon-badge");
    if (layer) {
      _renderIconContent($badge, layer.icon, layer.label);
    }
    return $badge;
  }

  function _renderIconContent($el, iconValue, label) {
    $el.empty();
    if (!iconValue) {
      $el.text(label ? label.charAt(0).toUpperCase() : "?");
      return;
    }
    // FA icon
    if (iconValue.indexOf("fa-") !== -1) {
      $el.append(jQuery("<i>").addClass(iconValue));
      return;
    }
    // SVG / image file path
    var lower = iconValue.toLowerCase();
    if (lower.indexOf(".svg") !== -1 || lower.indexOf(".png") !== -1 ||
        lower.indexOf(".jpg") !== -1 || lower.indexOf(".jpeg") !== -1 ||
        lower.indexOf(".gif") !== -1 || lower.indexOf(".webp") !== -1) {
      $el.append(jQuery("<img>").attr("src", iconValue).addClass("tl-toolbar-icon-img"));
      return;
    }
    // Plain text
    $el.text(iconValue);
  }

  function _refreshLayerDisplay(layer) {
    if (_$layoutName && !_nameEditing) {
      _$layoutName.text(layer ? layer.label : "");
    }
    if (_$layoutIcon) {
      _$layoutIcon.empty();
      if (layer) _renderIconContent(_$layoutIcon, layer.icon, layer.label);
    }
  }

  // ── Inline name editing (click to edit) ───────────

  function _startNameEdit() {
    var cfg = GridCore.getConfig();
    if (!cfg.layers || !cfg.layers.length) return;
    if (cfg.editMode === false || !GridCore.isEditing()) return;
    if (_nameEditing) return;
    var layer = GridCore.getActiveLayer();
    if (!layer) return;

    _nameEditing = true;
    var $input = jQuery("<input>")
      .addClass("tl-toolbar-layout-name-input")
      .attr({ type: "text", maxlength: 30, placeholder: "Layer name" })
      .val(layer.label);

    _$layoutName.replaceWith($input);
    _$layoutName = $input;
    $input.trigger("focus").trigger("select");

    function commit() {
      if (!_nameEditing) return;
      _nameEditing = false;
      var val = jQuery.trim($input.val());
      if (val && val !== layer.label) {
        GridCore.updateLayerMeta(layer.id, { label: val });
        var c = GridCore.getConfig();
        if (typeof c.onLayerChange === "function" && !GridCore.isEditing())
          c.onLayerChange(GridCore.getActiveLayer(), GridCore.getLayout());
      }
      var updatedLayer = GridCore.getActiveLayer();
      var $span = jQuery("<span>")
        .addClass("tl-toolbar-layout-name")
        .text(updatedLayer ? updatedLayer.label : "")
        .on("click", function () { _startNameEdit(); });
      $input.replaceWith($span);
      _$layoutName = $span;
    }

    $input.on("blur", commit);
    $input.on("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); $input.trigger("blur"); }
      if (e.key === "Escape") {
        _nameEditing = false;
        var $span = jQuery("<span>")
          .addClass("tl-toolbar-layout-name")
          .text(layer.label)
          .on("click", function () { _startNameEdit(); });
        $input.replaceWith($span);
        _$layoutName = $span;
      }
    });
  }

  // ── Icon picker popup ─────────────────────────────

  function _toggleIconPicker() {
    var cfg = GridCore.getConfig();
    if (cfg.editMode === false || !GridCore.isEditing()) return;
    if (_$iconPicker) {
      _closeIconPicker();
    } else {
      _openIconPicker();
    }
  }

  function _closeIconPicker() {
    if (_$iconPicker) {
      _$iconPicker.remove();
      _$iconPicker = null;
    }
    if (_$layoutIcon) _$layoutIcon.removeClass("tl-toolbar-icon-badge--picker-open");
  }

  function _openIconPicker() {
    var cfg = GridCore.getConfig();
    if (!cfg.layers || !cfg.layers.length) return;
    var layer = GridCore.getActiveLayer();
    if (!layer) return;
    var pickerCfg = cfg.iconPicker || {};
    var icons = pickerCfg.icons || [];
    var maxText = pickerCfg.maxTextLength || 4;
    var allowText = pickerCfg.allowText !== false;

    _closeIconPicker();

    var $picker = jQuery("<div>").addClass("tl-icon-picker");

    // Header
    $picker.append(jQuery("<div>").addClass("tl-icon-picker-header").text("Choose Icon"));

    // Icon grid
    if (icons.length) {
      var $grid = jQuery("<div>").addClass("tl-icon-picker-grid");
      jQuery.each(icons, function (_, ico) {
        var $btn = jQuery("<button>")
          .addClass("tl-icon-picker-btn")
          .attr("title", ico.label || "")
          .on("click", function () {
            _selectIcon(layer, ico.value);
          });

        if (ico.type === "fa") {
          $btn.append(jQuery("<i>").addClass(ico.value));
        } else if (ico.type === "svg" || ico.type === "img") {
          $btn.append(jQuery("<img>").attr("src", ico.value).addClass("tl-icon-picker-img"));
        } else {
          $btn.text(ico.value);
        }

        // Mark current
        if (layer.icon === ico.value) $btn.addClass("tl-icon-picker-btn--active");

        $grid.append($btn);
      });
      $picker.append($grid);
    }

    // Text input section
    if (allowText) {
      var $textSection = jQuery("<div>").addClass("tl-icon-picker-text-section");
      $textSection.append(jQuery("<span>").addClass("tl-icon-picker-text-label").text("Or type text:"));
      var $row = jQuery("<div>").addClass("tl-icon-picker-text-row");
      var $textInput = jQuery("<input>")
        .addClass("tl-icon-picker-text-input")
        .attr({ type: "text", maxlength: maxText, placeholder: "A, 1F…" })
        .val(
          layer.icon && layer.icon.indexOf("fa-") === -1 &&
          layer.icon.indexOf(".") === -1 ? layer.icon : ""
        );
      var $applyBtn = jQuery("<button>")
        .addClass("tl-icon-picker-apply")
        .text("Apply")
        .on("click", function () {
          var v = jQuery.trim($textInput.val());
          if (v) _selectIcon(layer, v);
        });
      $textInput.on("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); $applyBtn.trigger("click"); }
      });
      $row.append($textInput, $applyBtn);
      $textSection.append($row);
      $picker.append($textSection);
    }

    // Position relative to icon badge
    _$layoutIcon.addClass("tl-toolbar-icon-badge--picker-open");
    var $left = _$layoutIcon.closest(".tl-toolbar-left");
    $left.css("position", "relative");
    $left.append($picker);
    _$iconPicker = $picker;

    // Animate in
    setTimeout(function () { $picker.addClass("tl-icon-picker--open"); }, 10);
  }

  function _confirmDeleteLayer(layer) {
    var cfg = GridCore.getConfig();
    var $overlay = jQuery("<div>").addClass("tl-overlay");
    var $modal = jQuery("<div>").addClass("tl-modal");
    $modal.append(
      jQuery("<h2>").html('<i class="fa-solid fa-triangle-exclamation"></i> Delete Layout')
    );
    $modal.append(
      jQuery("<p>").addClass("tl-modal-text").text(
        'Are you sure you want to delete "' + layer.label + '"? This action cannot be undone.'
      )
    );
    var $actions = jQuery("<div>").addClass("tl-modal-actions");
    var $cancel = jQuery("<button>").addClass("tl-btn tl-btn-cancel").text("Cancel")
      .on("click", function () { $overlay.remove(); });
    var $confirm = jQuery("<button>").addClass("tl-btn tl-btn-danger").text("Delete")
      .on("click", function () {
        $overlay.remove();
        var wasActive = (layer.id === GridCore.getActiveLayerId());
        GridCore.deleteLayer(layer.id);
        if (wasActive) {
          jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
        }
        // Refresh toolbar display
        var active = GridCore.getActiveLayer();
        _refreshLayerDisplay(active);
        GridEvents.emit("layer:switched", active);
        if (typeof cfg.onLayerChange === "function")
          cfg.onLayerChange(active, GridCore.getLayout());
      });
    $actions.append($cancel, $confirm);
    $modal.append($actions);
    $overlay.append($modal);
    jQuery(".tl-root").first().append($overlay);
    $overlay.on("click", function (e) { if (jQuery(e.target).is($overlay)) $overlay.remove(); });
  }

  function _selectIcon(layer, value) {
    GridCore.updateLayerMeta(layer.id, { icon: value });
    var cfg = GridCore.getConfig();
    if (typeof cfg.onLayerChange === "function" && !GridCore.isEditing())
      cfg.onLayerChange(GridCore.getActiveLayer(), GridCore.getLayout());
    var updated = GridCore.getActiveLayer();
    _$layoutIcon.find(".tl-icon-picker").detach();
    _renderIconContent(_$layoutIcon, updated.icon, updated.label);
    _closeIconPicker();
    // Re-attach click handler since we cleared content
    _$layoutIcon.off("click").on("click", function (e) {
      e.stopPropagation();
      _toggleIconPicker();
    });
  }

  // ── Edit controls ─────────────────────────────────

  function _renderEditControls() {
    if (!_$editSection) return;
    _$editSection.empty();

    var cfg = GridCore.getConfig();

    if (cfg.editMode !== false && GridCore.isEditing()) {
      _$editSection.append(
        jQuery("<button>")
          .addClass("tl-toolbar-btn tl-toolbar-btn--save")
          .attr("title", "Save changes")
          .html('<i class="fa-solid fa-check"></i><span>Save</span>')
          .on("click", _handleSave),
        jQuery("<button>")
          .addClass("tl-toolbar-btn tl-toolbar-btn--discard")
          .attr("title", "Discard changes")
          .html('<i class="fa-solid fa-xmark"></i><span>Discard</span>')
          .on("click", _handleDiscard)
      );
    }

    // Settings gear — always visible when layers exist
    var $settingsWrap = jQuery("<div>").css("position", "relative").css("display", "inline-flex");
    var $settingsBtn = jQuery("<button>")
      .addClass("tl-toolbar-btn tl-toolbar-btn--settings")
      .attr("title", "Layout settings")
      .html('<i class="fa-solid fa-gear"></i>')
      .on("click", function (e) {
        e.stopPropagation();
        _toggleSettingsPopup($settingsWrap);
      });
    $settingsWrap.append($settingsBtn);
    _$editSection.append($settingsWrap);
  }

  // ── Settings popup ────────────────────────────────

  function _toggleSettingsPopup($anchor) {
    if (_$settingsPopup) {
      _closeSettingsPopup();
    } else {
      _openSettingsPopup($anchor);
    }
  }

  function _closeSettingsPopup() {
    if (_$settingsPopup) {
      _$settingsPopup.remove();
      _$settingsPopup = null;
    }
  }

  function _openSettingsPopup($anchor) {
    _closeSettingsPopup();
    var cfg = GridCore.getConfig();
    var layer = GridCore.getActiveLayer();

    var $popup = jQuery("<div>").addClass("tl-settings-popup");

    // Edit option (only when editMode is enabled and not currently editing)
    if (cfg.editMode !== false && !GridCore.isEditing()) {
      var $editOpt = jQuery("<button>")
        .addClass("tl-settings-option")
        .html('<i class="fa-solid fa-pen"></i><span>Edit Layout</span>')
        .on("click", function () {
          _closeSettingsPopup();
          _handleEdit();
        });
      $popup.append($editOpt);
    }

    // Delete option (only if more than 1 layer)
    var layers = GridCore.getLayers();
    if (layers.length > 1 && layer) {
      var $deleteOpt = jQuery("<button>")
        .addClass("tl-settings-option tl-settings-option--danger")
        .html('<i class="fa-solid fa-trash-can"></i><span>Delete Layout</span>')
        .on("click", function () {
          _closeSettingsPopup();
          _confirmDeleteLayer(layer);
        });
      $popup.append($deleteOpt);
    }

    $anchor.append($popup);
    _$settingsPopup = $popup;

    // Animate in
    setTimeout(function () { $popup.addClass("tl-settings-popup--open"); }, 10);
  }

  function _handleEdit() {
    GridCore.enterEditMode();
    _renderEditControls();
    _setEditableState(true);
    jQuery(".tl-root").removeClass("tl-view-mode").addClass("tl-edit-mode");
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  function _handleSave() {
    deactivate();
    GridCore.saveEdit();
    _renderEditControls();
    _setEditableState(false);
    jQuery(".tl-root").removeClass("tl-edit-mode").addClass("tl-view-mode");
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
    var cfg = GridCore.getConfig();
    if (typeof cfg.onLayoutChange === "function") cfg.onLayoutChange(GridCore.getLayout());
    if (typeof cfg.onLayerChange === "function")
      cfg.onLayerChange(GridCore.getActiveLayer(), GridCore.getLayout());
  }

  function _handleDiscard() {
    deactivate();
    GridCore.discardEdit();
    _renderEditControls();
    _setEditableState(false);
    var layer = GridCore.getActiveLayer();
    _refreshLayerDisplay(layer);
    jQuery(".tl-root").removeClass("tl-edit-mode").addClass("tl-view-mode");
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  function _setEditableState(editable) {
    if (_$layoutIcon) _$layoutIcon.toggleClass("tl-toolbar-icon-badge--editable", editable);
    if (_$layoutName) _$layoutName.toggleClass("tl-toolbar-layout-name--editable", editable);
  }

  // ── Shape panel ───────────────────────────────────

  function buildShapePanel() {
    var cfg = GridCore.getConfig();
    var $panel = jQuery("<div>").addClass("tl-shape-panel");

    jQuery.each(cfg.shapes, function (key, shape) {
      if (shape === false) return;
      $panel.append(_buildShapeBtn(key, shape));
    });

    return $panel;
  }

  function _buildShapeBtn(key, shape) {
    return jQuery("<button>")
      .addClass("tl-shape-tool-btn")
      .attr({ "data-shape-key": key, title: shape.label })
      .append(jQuery("<i>").addClass(shape.icon))
      .on("click", function () {
        toggle(key);
      });
  }

  function toggle(key) {
    var cfg = GridCore.getConfig();
    if (cfg.editMode !== false && !GridCore.isEditing()) return;
    if (_activeTool === key) {
      deactivate();
    } else {
      _activeTool = key;
      jQuery(".tl-shape-tool-btn").removeClass("active");
      jQuery('[data-shape-key="' + key + '"]').addClass("active");
      jQuery(".tl-canvas").addClass("tl-placing-mode");
      GridEvents.emit("tool:changed", key);
    }
  }

  function deactivate() {
    _activeTool = null;
    jQuery(".tl-shape-tool-btn").removeClass("active");
    jQuery(".tl-canvas").removeClass("tl-placing-mode");
    GridEvents.emit("tool:changed", null);
  }

  function getActive() {
    return _activeTool;
  }

  return {
    build: build,
    buildShapePanel: buildShapePanel,
    toggle: toggle,
    deactivate: deactivate,
    getActive: getActive,
  };
})();


/* src/modules/GridZoom.js */
var GridZoom = (function () {
  var _zoom = 1;

  function init(initial) {
    _zoom = initial || 1;
  }

  function buildControls() {
    var cfg = GridCore.getConfig();
    var zCfg = cfg.zoom || {};
    if (!zCfg.enabled || !zCfg.showControls) return jQuery();

    var min  = zCfg.min  || 0.4;
    var max  = zCfg.max  || 2;
    var step = zCfg.step || 0.1;

    var $reset = jQuery("<button>")
      .addClass("tl-zoom-btn tl-zoom-btn-reset")
      .attr("title", "Reset zoom")
      .html(zCfg.labelReset || "↺")
      .on("click", function () { applyZoom(zCfg.initial || 1); });

    var $slider = jQuery("<input>")
      .attr({ type: "range", min: min, max: max, step: step, value: _zoom })
      .addClass("tl-zoom-slider")
      .on("input", function () { applyZoom(parseFloat(this.value)); });

    var $label = jQuery("<span>").addClass("tl-zoom-label").text(_fmt(_zoom));

    return jQuery("<div>")
      .addClass("tl-zoom-controls")
      .append($reset, $slider, $label);
  }

  function applyZoom(level, silent) {
    var cfg = GridCore.getConfig();
    var zCfg = cfg.zoom || {};
    var min = zCfg.min || 0.4;
    var max = zCfg.max || 2;

    level = parseFloat(Math.min(max, Math.max(min, level)).toFixed(2));
    _zoom = level;

    var $za = jQuery(".tl-zoom-area");
    $za.css("transform", "scale(" + level + ")");

    var natW = $za[0] ? $za[0].scrollWidth : 0;
    var natH = $za[0] ? $za[0].scrollHeight : 0;
    $za.css({ width: natW * level + "px", height: natH * level + "px" });

    jQuery(".tl-zoom-label").text(_fmt(level));
    jQuery(".tl-zoom-slider").val(level);

    GridEvents.emit("zoom:changed", level);

    if (!silent && typeof cfg.onZoom === "function") cfg.onZoom(level);
  }

  function bindWheelZoom() {
    var cfg = GridCore.getConfig();
    var zCfg = cfg.zoom || {};
    if (!zCfg.enabled || !zCfg.mouseWheel) return;

    jQuery("#" + cfg.containerId).on("wheel.tl", function (e) {
      if (!e.originalEvent.ctrlKey) return;
      e.preventDefault();
      applyZoom(
        _zoom + (e.originalEvent.deltaY > 0 ? -1 : 1) * (zCfg.step || 0.1),
      );
    });
  }

  function _fmt(l) {
    return Math.round(l * 100) + "%";
  }
  function getZoom() {
    return _zoom;
  }

  return {
    init: init,
    buildControls: buildControls,
    applyZoom: applyZoom,
    bindWheelZoom: bindWheelZoom,
    getZoom: getZoom,
  };
})();


/* src/modules/GridDrag.js */
var GridDrag = (function () {
  var _dragId = null;
  var _$ghost = null;

  function bind() {
    var cfg = GridCore.getConfig();
    var gridSel = "#" + cfg.containerId + " .tl-layout-grid";
    var canvasSel = "#" + cfg.containerId + " .tl-canvas";

    var trashSel = "#" + cfg.containerId + " .tl-trash-zone";

    jQuery(document).on(
      "dragstart.tl",
      gridSel + " .tl-table-card",
      function (e) {
        var cfg = GridCore.getConfig();
        if (cfg.editMode !== false && !GridCore.isEditing()) return;
        if (GridToolbar.getActive()) return;
        _dragId = jQuery(this).data("table-id");
        e.originalEvent.dataTransfer.effectAllowed = "move";
        e.originalEvent.dataTransfer.setData("text/plain", String(_dragId));

        var empty = new Image();
        empty.src =
          "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";
        e.originalEvent.dataTransfer.setDragImage(empty, 0, 0);

        jQuery(this).css("opacity", "0.25");
        if (cfg.trashZone) jQuery(trashSel).addClass("tl-trash-zone--visible");
      },
    );

    jQuery(document).on("dragend.tl", function () {
      if (_dragId) {
        jQuery('[data-table-id="' + _dragId + '"]').css("opacity", "");
        _dragId = null;
      }
      _removeGhost();
      if (cfg.trashZone) jQuery(trashSel).removeClass("tl-trash-zone--visible tl-trash-zone--active");
    });

    if (!cfg.trashZone) return;

    jQuery(document).on("dragover.tl", trashSel, function (e) {
      e.preventDefault();
      if (!_dragId) return;
      jQuery(this).addClass("tl-trash-zone--active");
      e.originalEvent.dataTransfer.dropEffect = "move";
    });

    jQuery(document).on("dragleave.tl", trashSel, function () {
      jQuery(this).removeClass("tl-trash-zone--active");
    });

    jQuery(document).on("drop.tl", trashSel, function (e) {
      e.preventDefault();
      jQuery(this).removeClass("tl-trash-zone--visible tl-trash-zone--active");
      if (!_dragId) return;
      var id = _dragId;
      _dragId = null;
      _removeGhost();
      jQuery('[data-table-id="' + id + '"]').remove();
      GridCore.removeTable(id);
      if (typeof cfg.onLayoutChange === "function" && !(cfg.editMode !== false && GridCore.isEditing())) cfg.onLayoutChange(GridCore.getLayout());
    });

    jQuery(document).on("dragover.tl", gridSel, function (e) {
      e.preventDefault();
      if (!_dragId) return;
      var t = GridCore.tableById(_dragId);
      if (!t) return;
      var pos = GridCore.cursorToGrid(
        e.originalEvent.clientX,
        e.originalEvent.clientY,
      );
      var bad = GridCore.hasCollision(
        pos.col,
        pos.row,
        t.colSpan,
        t.rowSpan,
        t.id,
      );
      _showGhost(pos.col, pos.row, t.colSpan, t.rowSpan, bad);
      e.originalEvent.dataTransfer.dropEffect = bad ? "none" : "move";
    });

    jQuery(document).on("dragleave.tl", canvasSel, function (e) {
      if (!jQuery(e.originalEvent.relatedTarget).closest(".tl-canvas").length) {
        _removeGhost();
      }
    });

    jQuery(document).on("drop.tl", gridSel, function (e) {
      e.preventDefault();
      _removeGhost();
      if (cfg.trashZone) jQuery(trashSel).removeClass("tl-trash-zone--visible tl-trash-zone--active");
      if (!_dragId) return;

      var t = GridCore.tableById(_dragId);
      if (!t) return;

      var pos = GridCore.cursorToGrid(
        e.originalEvent.clientX,
        e.originalEvent.clientY,
      );
      if (GridCore.hasCollision(pos.col, pos.row, t.colSpan, t.rowSpan, t.id)) {
        _dragId = null;
        return;
      }

      var from = { col: t.col, row: t.row };
      GridCore.moveTable(t.id, pos.col, pos.row);

      jQuery('[data-table-id="' + t.id + '"]').replaceWith(
        GridRender.buildTableCard(t),
      );

      if (cfg.swapAnimation) {
        jQuery('[data-table-id="' + t.id + '"]').addClass("tl-swap-animate");
        setTimeout(function () {
          jQuery('[data-table-id="' + t.id + '"]').removeClass(
            "tl-swap-animate",
          );
        }, 280);
      }

      GridEvents.emit("table:moved", {
        from: from,
        to: { col: pos.col, row: pos.row },
      });

      if (typeof cfg.onSwap === "function")
        cfg.onSwap(from, { col: pos.col, row: pos.row }, GridCore.getLayout());
      if (typeof cfg.onLayoutChange === "function" && !(cfg.editMode !== false && GridCore.isEditing()))
        cfg.onLayoutChange(GridCore.getLayout());

      _dragId = null;
    });
  }

  function unbind() {
    jQuery(document).off(".tl");
  }

  function _showGhost(col, row, colSpan, rowSpan, invalid) {
    _removeGhost();
    _$ghost = GridRender.buildDragGhost(col, row, colSpan, rowSpan, invalid);
    jQuery(".tl-layout-grid").append(_$ghost);
  }

  function _removeGhost() {
    if (_$ghost) {
      _$ghost.remove();
      _$ghost = null;
    }
  }

  return { bind: bind, unbind: unbind };
})();


/* src/modules/GridPlace.js */
var GridPlace = (function () {
  var _start = null;
  var _$ghost = null;
  var _pending = null;

  function bind() {
    var cfg = GridCore.getConfig();
    var gridSel = "#" + cfg.containerId + " .tl-layout-grid";

    jQuery(document).on("mousedown.tl", gridSel + " .tl-cell", function (e) {
      if (cfg.editMode !== false && !GridCore.isEditing()) return;
      if (!GridToolbar.getActive() || e.which !== 1) return;
      e.preventDefault();
      _start = {
        col: parseInt(jQuery(this).data("col")),
        row: parseInt(jQuery(this).data("row")),
      };
    });

    jQuery(document).on("mousemove.tl", gridSel, function (e) {
      if (!GridToolbar.getActive() || !_start) return;
      var end = GridCore.cursorToGrid(
        e.originalEvent.clientX,
        e.originalEvent.clientY,
      );
      var span = GridCore.calcSpan(_start, end, GridToolbar.getActive());
      var bad = GridCore.hasCollision(
        span.col,
        span.row,
        span.colSpan,
        span.rowSpan,
        null,
      );
      _showGhost(span.col, span.row, span.colSpan, span.rowSpan, bad);
    });

    jQuery(document).on("mouseup.tl", gridSel, function (e) {
      if (!GridToolbar.getActive() || !_start || e.which !== 1) return;
      var end = GridCore.cursorToGrid(
        e.originalEvent.clientX,
        e.originalEvent.clientY,
      );
      var span = GridCore.calcSpan(_start, end, GridToolbar.getActive());
      _removeGhost();
      _start = null;
      if (
        GridCore.hasCollision(
          span.col,
          span.row,
          span.colSpan,
          span.rowSpan,
          null,
        )
      )
        return;
      _showModal(jQuery.extend({}, span, { shape: GridToolbar.getActive() }));
    });

    jQuery(document).on("mouseup.tl", function (e) {
      if (
        GridToolbar.getActive() &&
        _start &&
        !jQuery(e.target).closest(gridSel).length
      ) {
        _start = null;
        _removeGhost();
      }
    });

    jQuery(document).on("keydown.tl", function (e) {
      if (e.key === "Escape" && GridToolbar.getActive())
        GridToolbar.deactivate();
    });
  }

  function _showGhost(col, row, colSpan, rowSpan, invalid) {
    _removeGhost();
    _$ghost = GridRender.buildPlaceGhost(col, row, colSpan, rowSpan, invalid);
    jQuery(".tl-layout-grid").append(_$ghost);
  }

  function _removeGhost() {
    if (_$ghost) {
      _$ghost.remove();
      _$ghost = null;
    }
  }

  function _showModal(placement) {
    _pending = placement;
    var cfg = GridCore.getConfig();
    var shapeDef = (cfg.shapes || {})[placement.shape] || {};
    var nextName =
      (cfg.newTable.namePrefix || "Table") + " " + GridCore.getCounter();

    // ── Custom modal hook ─────────────────────────
    if (typeof cfg.onCreateTable === "function") {
      var tableDefaults = {
        name: nextName,
        seats: cfg.newTable.defaultSeats || 4,
        status: cfg.newTable.defaultStatus || "available",
      };
      cfg.onCreateTable(
        jQuery.extend({}, placement),
        tableDefaults,
        function (details) {
          _commit(details);
        }
      );
      return;
    }

    var color = cfg.statusColors[cfg.newTable.defaultStatus] || "#16a34a";
    var styles = GridCore.getShapeStyles(placement.shape);

    var $overlay = jQuery("<div>").addClass("tl-overlay");
    var $modal = jQuery("<div>").addClass("tl-modal");

    $modal.append(
      jQuery("<h2>").append(
        jQuery("<span>").addClass("tl-modal-preview").css({
          background: color,
          "clip-path": styles.clipPath,
          "border-radius": styles.borderRadius,
        }),
        jQuery("<span>").text(
          "New " + (shapeDef.label || placement.shape) + " Table",
        ),
      ),
    );

    $modal.append(
      _field(
        "Size",
        jQuery("<input>")
          .attr({ type: "text", readonly: true })
          .val(placement.colSpan + " × " + placement.rowSpan + " cells")
          .css({ background: "#f8fafc", color: "#64748b" }),
      ),
    );

    var $name = jQuery("<input>")
      .attr({ type: "text", placeholder: "Table name", maxlength: 30 })
      .val(nextName);
    $modal.append(_field("Name", $name));

    var $seats = jQuery("<input>")
      .attr({ type: "number", min: 1, max: 50 })
      .val(cfg.newTable.defaultSeats || 4);
    var $status = jQuery("<select>");
    jQuery.each(cfg.statusColors, function (s) {
      $status.append(
        jQuery("<option>")
          .val(s)
          .text(s.charAt(0).toUpperCase() + s.slice(1)),
      );
    });
    $status.val(cfg.newTable.defaultStatus || "available");

    $modal.append(
      jQuery("<div>")
        .addClass("tl-field-row")
        .append(_field("Seats", $seats), _field("Status", $status)),
    );

    var $err = jQuery("<p>")
      .addClass("tl-error")
      .text("Please enter a table name.");
    $modal.append($err);

    var $cancel = jQuery("<button>")
      .addClass("tl-btn tl-btn-cancel")
      .text("Cancel")
      .on("click", function () {
        $overlay.remove();
        _pending = null;
      });

    var $create = jQuery("<button>")
      .addClass("tl-btn tl-btn-primary")
      .text("Create Table")
      .on("click", function () {
        var name = jQuery.trim($name.val());
        if (!name) {
          $err.show();
          return;
        }
        $err.hide();
        _commit({
          name: name,
          seats: parseInt($seats.val()) || 4,
          status: $status.val(),
        });
        $overlay.remove();
      });

    $modal.append(
      jQuery("<div>").addClass("tl-modal-actions").append($cancel, $create),
    );
    $overlay.append($modal);
    jQuery(".tl-root").first().append($overlay);

    setTimeout(function () {
      $name.trigger("focus").trigger("select");
    }, 50);
    $overlay.on("click", function (e) {
      if (jQuery(e.target).is($overlay)) {
        $overlay.remove();
        _pending = null;
      }
    });
  }

  function _field(label, $input) {
    return jQuery("<div>")
      .addClass("tl-field")
      .append(jQuery("<label>").text(label), $input);
  }

  function _commit(details) {
    if (!_pending) return;
    var cfg = GridCore.getConfig();

    var newTable = {
      id: "T" + Date.now(),
      name: details.name,
      seats: details.seats,
      status: details.status,
      shape: _pending.shape,
      col: _pending.col,
      row: _pending.row,
      colSpan: _pending.colSpan,
      rowSpan: _pending.rowSpan,
    };

    GridCore.addTable(newTable);
    jQuery(".tl-layout-grid").append(GridRender.buildTableCard(newTable));

    if (typeof cfg.onTableCreated === "function") cfg.onTableCreated(newTable);
    if (typeof cfg.onLayoutChange === "function" && !(cfg.editMode !== false && GridCore.isEditing()))
      cfg.onLayoutChange(GridCore.getLayout());

    _pending = null;
    GridToolbar.deactivate();
  }

  function unbind() {
    jQuery(document).off(".tl");
  }

  return { bind: bind, unbind: unbind };
})();


/* src/modules/GridLayers.js */
/**
 * GridLayers.js
 * Layer switcher UI — lets users create and switch between multiple table layouts.
 * Only active when cfg.layers is defined.
 */
var GridLayers = (function () {
  var _$wrap = null;
  var _$activePreview = null;
  var _hoverTimer = null;

  // ── Public: build wrapper (button + slide-down panel) ─────────

  function build() {
    _$wrap = jQuery("<div>").addClass("tl-layers-wrap");

    var $btn = jQuery("<button>")
      .addClass("tl-layers-btn tl-layers-btn--active")
      .attr("title", "Switch Layout")
      .html('<i class="fa-solid fa-layer-group"></i>')
      .on("click", function (e) {
        e.stopPropagation();
        var isOpen = _$wrap.find(".tl-layers-panel").hasClass("tl-layers-panel--open");
        if (isOpen) {
          _closePanel();
        } else {
          _openPanel();
        }
      });

    var $panel = _buildPanel();
    $panel.addClass("tl-layers-panel--open");

    _$wrap.append($btn);
    _$wrap.append($panel);

    // Re-render panel when layers change
    var _refreshPanel = function () {
      var $p = _$wrap.find(".tl-layers-panel");
      if ($p.length) _renderPanelContent($p);
    };
    GridEvents.on("layer:updated", _refreshPanel);
    GridEvents.on("layer:deleted", _refreshPanel);
    GridEvents.on("layer:reordered", _refreshPanel);
    GridEvents.on("layer:switched", _refreshPanel);

    return _$wrap;
  }

  // ── Panel ─────────────────────────────────────────

  function _buildPanel() {
    var $panel = jQuery("<div>").addClass("tl-layers-panel");
    $panel.on("click", function (e) { e.stopPropagation(); });

    _renderPanelContent($panel);

    return $panel;
  }

  function _renderPanelContent($panel) {
    $panel.empty();

    var layers = GridCore.getLayers();
    var activeId = GridCore.getActiveLayerId();

    // Layer list (scrollable, max 3 visible)
    var $list = jQuery("<div>").addClass("tl-layers-list");
    jQuery.each(layers, function (_, layer) {
      $list.append(_buildLayerItem(layer, layer.id === activeId));
    });
    $panel.append($list);

    // Separator
    $panel.append(jQuery("<div>").addClass("tl-layers-separator"));

    // Always-visible add form
    $panel.append(_buildAddForm($panel));
  }

  function _openPanel() {
    if (!_$wrap) return;
    var $panel = _$wrap.find(".tl-layers-panel");
    _renderPanelContent($panel);
    $panel.addClass("tl-layers-panel--open");
    _$wrap.find(".tl-layers-btn").addClass("tl-layers-btn--active");
  }

  function _closePanel() {
    if (!_$wrap) return;
    _$wrap.find(".tl-layers-panel").removeClass("tl-layers-panel--open");
    _$wrap.find(".tl-layers-btn").removeClass("tl-layers-btn--active");
  }

  // ── Layer item ────────────────────────────────────

  function _showPreview(layer) {
    _hidePreview();
    _$activePreview = _buildLayerPreview(layer);
    _$wrap.append(_$activePreview);
    setTimeout(function () {
      if (_$activePreview) _$activePreview.addClass("tl-layer-preview-popup--visible");
    }, 10);
  }

  function _hidePreview() {
    if (_$activePreview) {
      _$activePreview.remove();
      _$activePreview = null;
    }
  }

  function _buildLayerPreview(layer) {
    var cfg = GridCore.getConfig();
    var tables = layer.id === GridCore.getActiveLayerId()
      ? GridCore.getTables()
      : (layer.tables || []);
    var cellSize = 4;
    var gap = 1;
    var cols = cfg.columns;
    var rows = cfg.rows;

    var $popup = jQuery("<div>").addClass("tl-layer-preview-popup");
    $popup.append(
      jQuery("<div>").addClass("tl-layer-preview-label").text(layer.label)
    );

    var $isoWrap = jQuery("<div>").addClass("tl-layer-preview-iso");
    var $gridWrap = jQuery("<div>").addClass("tl-layer-preview-grid-wrap");
    var $grid = jQuery("<div>").addClass("tl-layer-preview-grid").css({
      "grid-template-columns": "repeat(" + cols + ", " + cellSize + "px)",
      "grid-template-rows":    "repeat(" + rows + ", " + cellSize + "px)",
      "gap": gap + "px",
      "width":  (cols * cellSize + (cols - 1) * gap) + "px",
      "height": (rows * cellSize + (rows - 1) * gap) + "px",
    });

    for (var r = 1; r <= rows; r++) {
      for (var c = 1; c <= cols; c++) {
        $grid.append(
          jQuery("<div>").addClass("tl-layer-preview-cell").css({
            "grid-column": c + " / span 1",
            "grid-row":    r + " / span 1",
          })
        );
      }
    }

    jQuery.each(tables, function (_, t) {
      var statusColor = cfg.statusColors[t.status] || "#6b7280";
      $grid.append(
        jQuery("<div>").addClass("tl-layer-preview-table").css({
          "grid-column": t.col + " / span " + t.colSpan,
          "grid-row":    t.row + " / span " + t.rowSpan,
          "background":  statusColor,
        })
      );
    });

    $gridWrap.append($grid);
    $isoWrap.append($gridWrap);
    $popup.append($isoWrap);

    return $popup;
  }

  function _buildLayerItem(layer, isActive) {
    var layers = GridCore.getLayers();
    var cfg = GridCore.getConfig();

    var $item = jQuery("<div>")
      .addClass("tl-layers-item" + (isActive ? " tl-layers-item--active" : ""))
      .attr({ "title": layer.label, "data-layer-id": layer.id, "draggable": "true" })
      .on("mouseenter", function () {
        clearTimeout(_hoverTimer);
        _hoverTimer = setTimeout(function () { _showPreview(layer); }, 500);
      })
      .on("mouseleave", function () {
        clearTimeout(_hoverTimer);
        _hidePreview();
      })
      .on("click", function (e) {
        if (isActive) return;
        if (cfg.editMode !== false && GridCore.isEditing()) return;
        GridCore.switchLayer(layer.id);
        _rebuildGrid();
        var $panel = _$wrap.find(".tl-layers-panel");
        _renderPanelContent($panel);
        if (typeof cfg.onLayerChange === "function")
          cfg.onLayerChange(GridCore.getActiveLayer(), GridCore.getLayout());
      });

    // Drag-to-reorder events
    $item.on("dragstart", function (e) {
      if (cfg.editMode !== false && GridCore.isEditing()) { e.preventDefault(); return; }
      e.originalEvent.dataTransfer.effectAllowed = "move";
      e.originalEvent.dataTransfer.setData("text/plain", layer.id);
      $item.addClass("tl-layers-item--dragging");
    });
    $item.on("dragend", function () {
      $item.removeClass("tl-layers-item--dragging");
      _$wrap.find(".tl-layers-item--drag-over").removeClass("tl-layers-item--drag-over");
    });
    $item.on("dragover", function (e) {
      e.preventDefault();
      e.originalEvent.dataTransfer.dropEffect = "move";
      $item.addClass("tl-layers-item--drag-over");
    });
    $item.on("dragleave", function () {
      $item.removeClass("tl-layers-item--drag-over");
    });
    $item.on("drop", function (e) {
      e.preventDefault();
      $item.removeClass("tl-layers-item--drag-over");
      var draggedId = e.originalEvent.dataTransfer.getData("text/plain");
      if (draggedId === layer.id) return;
      // Build new order
      var currentIds = layers.map(function (l) { return l.id; });
      var fromIdx = currentIds.indexOf(draggedId);
      var toIdx = currentIds.indexOf(layer.id);
      if (fromIdx === -1 || toIdx === -1) return;
      currentIds.splice(fromIdx, 1);
      currentIds.splice(toIdx, 0, draggedId);
      GridCore.reorderLayers(currentIds);
      var $panel = _$wrap.find(".tl-layers-panel");
      _renderPanelContent($panel);
      if (typeof cfg.onLayerChange === "function")
        cfg.onLayerChange(GridCore.getActiveLayer(), GridCore.getLayout());
    });

    var isFaIcon = layer.icon && layer.icon.indexOf("fa-") !== -1;
    var $icon = jQuery("<div>").addClass("tl-layers-icon");
    if (isFaIcon) {
      $icon.append(jQuery("<i>").addClass(layer.icon));
    } else if (layer.icon && /\.(svg|png|jpe?g|gif|webp)/i.test(layer.icon)) {
      $icon.append(jQuery("<img>").attr("src", layer.icon).css({ width: "18px", height: "18px", "object-fit": "contain" }));
    } else {
      $icon.text(layer.icon || "?");
    }

    $item.append($icon);

    return $item;
  }

  // ── Add layer form (shown when Add Layout is clicked) ────────

  function _buildAddForm($panel) {
    var cfg = GridCore.getConfig();

    var $addBtn = jQuery("<button>")
      .addClass("tl-layers-add-submit")
      .html('<i class="fa-solid fa-plus"></i>')
      .on("click", function () {
        if (cfg.editMode !== false && GridCore.isEditing()) return;
        if (typeof cfg.onCreateLayer === "function") {
          cfg.onCreateLayer(function (details) {
            _createLayer(details, $panel);
          });
          return;
        }
        _openAddModal($panel);
      });

    return $addBtn;
  }

  function _openAddModal($panel) {
    var cfg = GridCore.getConfig();
    var pickerCfg = cfg.iconPicker || {};
    var icons = pickerCfg.icons || [];
    var maxText = pickerCfg.maxTextLength || 4;
    var allowText = pickerCfg.allowText !== false;
    var _selectedIcon = "";

    var $overlay = jQuery("<div>").addClass("tl-overlay");

    var $modal = jQuery("<div>").addClass("tl-modal");

    $modal.append(
      jQuery("<h2>").html('<i class="fa-solid fa-layer-group"></i> New Layout')
    );

    var $nameField = jQuery("<div>").addClass("tl-field");
    $nameField.append(jQuery("<label>").text("Name"));
    var $nameInput = jQuery("<input>").attr({ type: "text", placeholder: "Layout name", maxlength: 30 });
    $nameField.append($nameInput);

    // Icon field with picker grid
    var $iconField = jQuery("<div>").addClass("tl-field");
    $iconField.append(jQuery("<label>").text("Icon"));

    // Preview of selected icon
    var $iconPreview = jQuery("<div>").addClass("tl-modal-icon-preview");
    $iconPreview.text("?");
    $iconField.append($iconPreview);

    function _updatePreview(val) {
      $iconPreview.empty();
      if (!val) { $iconPreview.text("?"); return; }
      if (val.indexOf("fa-") !== -1) {
        $iconPreview.append(jQuery("<i>").addClass(val));
      } else if (/\.(svg|png|jpe?g|gif|webp)/i.test(val)) {
        $iconPreview.append(jQuery("<img>").attr("src", val).css({ width: "22px", height: "22px", "object-fit": "contain" }));
      } else {
        $iconPreview.text(val);
      }
    }

    // Icon grid
    if (icons.length) {
      var $grid = jQuery("<div>").addClass("tl-modal-icon-grid");
      jQuery.each(icons, function (_, ico) {
        var $btn = jQuery("<button>")
          .addClass("tl-icon-picker-btn")
          .attr({ "title": ico.label || "", "type": "button" })
          .on("click", function () {
            _selectedIcon = ico.value;
            $grid.find(".tl-icon-picker-btn").removeClass("tl-icon-picker-btn--active");
            jQuery(this).addClass("tl-icon-picker-btn--active");
            if ($textInput) $textInput.val("");
            _updatePreview(_selectedIcon);
          });

        if (ico.type === "fa") {
          $btn.append(jQuery("<i>").addClass(ico.value));
        } else if (ico.type === "svg" || ico.type === "img") {
          $btn.append(jQuery("<img>").attr("src", ico.value).addClass("tl-icon-picker-img"));
        } else {
          $btn.text(ico.value);
        }
        $grid.append($btn);
      });
      $iconField.append($grid);
    }

    // Text input fallback
    var $textInput = null;
    if (allowText) {
      var $textRow = jQuery("<div>").addClass("tl-icon-picker-text-row").css("margin-top", "8px");
      $textInput = jQuery("<input>")
        .addClass("tl-icon-picker-text-input")
        .attr({ type: "text", maxlength: maxText, placeholder: "Or type: A, 1F…" })
        .on("input", function () {
          var v = jQuery.trim(jQuery(this).val());
          if (v) {
            _selectedIcon = v;
            $iconField.find(".tl-icon-picker-btn").removeClass("tl-icon-picker-btn--active");
            _updatePreview(v);
          }
        });
      $textRow.append($textInput);
      $iconField.append($textRow);
    }

    var $actions = jQuery("<div>").addClass("tl-modal-actions");

    var $cancel = jQuery("<button>").addClass("tl-btn tl-btn-cancel").text("Cancel")
      .on("click", function () { $overlay.remove(); });

    var $create = jQuery("<button>").addClass("tl-btn tl-btn-primary").text("Add Layout")
      .on("click", function () {
        var labelVal = jQuery.trim($nameInput.val());
        if (!labelVal) { $nameInput.addClass("tl-input-error").trigger("focus"); return; }
        $nameInput.removeClass("tl-input-error");
        var iconVal = _selectedIcon || labelVal.charAt(0).toUpperCase();
        $overlay.remove();
        _createLayer({ label: labelVal, icon: iconVal }, $panel);
      });

    $nameInput.on("input", function () { jQuery(this).removeClass("tl-input-error"); });
    $nameInput.on("keydown", function (e) { if (e.key === "Enter") $create.trigger("click"); });

    $actions.append($cancel, $create);
    $modal.append($nameField, $iconField, $actions);
    $overlay.append($modal);
    jQuery(".tl-root").first().append($overlay);

    $overlay.on("click", function (e) { if (jQuery(e.target).is($overlay)) $overlay.remove(); });

    setTimeout(function () { $nameInput.trigger("focus"); }, 50);
  }

  function _createLayer(details, $panel) {
    var label = details.label || "Layout";
    var layer = {
      id: "layer-" + Date.now(),
      label: label,
      icon: details.icon || label.charAt(0).toUpperCase(),
      tables: [],
    };
    GridCore.addLayer(layer);
    GridCore.switchLayer(layer.id);
    _rebuildGrid();
    if ($panel) _renderPanelContent($panel);
    var cfg = GridCore.getConfig();
    if (typeof cfg.onLayerChange === "function")
      cfg.onLayerChange(layer, []);
  }

  // ── Grid rebuild on layer switch ──────────────────

  function _rebuildGrid() {
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  return { build: build };
})();


/* src/TableLayout.js */
/**
 * TableLayout.js
 * ─────────────────────────────────────────────────────────────────
 * Public API — this is the only object the user ever touches.
 *
 * Usage in .NET MVC view:
 *
 *   var layout = TableLayout.create({
 *       containerId : 'myDiv',
 *       columns     : 12,
 *       rows        : 8,
 *       tables      : [...],
 *       onLayoutChange: function(layout) { ... }
 *   });
 *
 *   layout.zoomIn();
 *   layout.getLayout();
 *   layout.destroy();
 */
var TableLayout = (function () {
  function create(userConfig) {
    // ── Guard: jQuery required ─────────────────────
    if (typeof jQuery === "undefined") {
      throw new Error("[TableLayout] jQuery is required but not loaded.");
    }

    // ── Guard: container must exist ────────────────
    var cfg = GridConfig.merge(userConfig);
    if (!jQuery("#" + cfg.containerId).length) {
      throw new Error(
        "[TableLayout] Container #" + cfg.containerId + " not found in DOM.",
      );
    }

    // ── Boot ───────────────────────────────────────
    GridEvents.reset();
    GridCore.init(cfg);
    GridZoom.init(cfg.zoom.initial || 1);

    // ── Build DOM ──────────────────────────────────
    var $container = jQuery("#" + cfg.containerId)
      .empty()
      .addClass("tl-root");

    // Apply theme CSS variables
    var camelToKebab = function (s) {
      return s.replace(/([A-Z])/g, function (m) { return "-" + m.toLowerCase(); });
    };
    jQuery.each(cfg.theme, function (key, val) {
      $container[0].style.setProperty("--tl-" + camelToKebab(key), val);
    });
    var $wrapper = jQuery("<div>").addClass("tl-wrapper");
    var $canvas = GridRender.buildCanvas();
    var $canvasWrap = jQuery("<div>").addClass("tl-canvas-wrap");
    $canvasWrap.append($canvas);
    $canvasWrap.append(GridZoom.buildControls());
    $canvasWrap.append(GridToolbar.buildShapePanel());
    if (cfg.trashZone) $canvasWrap.append(GridRender.buildTrashZone());
    if (cfg.layers && cfg.layers.length) $canvasWrap.append(GridLayers.build());

    $wrapper.append(GridToolbar.build());
    $wrapper.append($canvasWrap);
    $wrapper.append(GridRender.buildLegend());

    if (cfg.showHint) {
      $wrapper.append(
        jQuery("<p>")
          .addClass("tl-hint")
          .text(
            "Select a shape tool then drag on the grid  •  Ctrl + scroll to zoom",
          ),
      );
    }

    $container.append($wrapper);
    if (cfg.editMode !== false) $container.addClass("tl-view-mode");

    // ── Apply initial zoom ─────────────────────────
    GridZoom.applyZoom(cfg.zoom.initial || 1, true);

    // ── Bind modules ───────────────────────────────
    GridDrag.bind();
    GridPlace.bind();
    GridZoom.bindWheelZoom();

    // ── Wire internal events to user callbacks ─────
    GridEvents.on("zoom:changed", function (level) {
      if (typeof cfg.onZoom === "function") cfg.onZoom(level);
    });
    GridEvents.on("layer:switched", function (layer) {
      if (typeof cfg.onLayerChange === "function")
        cfg.onLayerChange(layer, GridCore.getLayout());
    });
    GridEvents.on("layer:updated", function (layer) {
      if (typeof cfg.onLayerChange === "function" && !(cfg.editMode !== false && GridCore.isEditing()))
        cfg.onLayerChange(layer, GridCore.getLayout());
    });
    GridEvents.on("layer:deleted", function (removed) {
      if (typeof cfg.onLayerDelete === "function")
        cfg.onLayerDelete(removed);
      if (typeof cfg.onLayerChange === "function")
        cfg.onLayerChange(GridCore.getActiveLayer(), GridCore.getLayout());
    });
    GridEvents.on("layer:reordered", function (layers) {
      if (typeof cfg.onLayerReorder === "function")
        cfg.onLayerReorder(layers);
    });

    // ── Return instance API ────────────────────────
    return {
      // Zoom
      zoomIn: function () {
        GridZoom.applyZoom(GridZoom.getZoom() + (cfg.zoom.step || 0.1));
      },
      zoomOut: function () {
        GridZoom.applyZoom(GridZoom.getZoom() - (cfg.zoom.step || 0.1));
      },
      zoomReset: function () {
        GridZoom.applyZoom(cfg.zoom.initial || 1);
      },
      zoomTo: function (l) {
        GridZoom.applyZoom(l);
      },
      getZoom: function () {
        return GridZoom.getZoom();
      },

      // Data
      getLayout: function () {
        return GridCore.getLayout();
      },
      getTables: function () {
        return GridCore.getTables();
      },
      getConfig: function () {
        return GridCore.getConfig();
      },

      // Layers
      getLayers: function () {
        return GridCore.getLayers();
      },
      getActiveLayer: function () {
        return GridCore.getActiveLayer();
      },
      switchLayer: function (id) {
        if (GridCore.switchLayer(id)) {
          jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
        }
      },
      addLayer: function (details) {
        var label = (details && details.label) || "Layout";
        var layer = {
          id: "layer-" + Date.now(),
          label: label,
          icon: (details && details.icon) || label.charAt(0).toUpperCase(),
          tables: (details && details.tables) || [],
        };
        GridCore.addLayer(layer);
        return layer;
      },
      deleteLayer: function (id) {
        return GridCore.deleteLayer(id);
      },
      reorderLayers: function (orderedIds) {
        return GridCore.reorderLayers(orderedIds);
      },
      getAllLayersLayout: function () {
        return GridCore.getAllLayersLayout();
      },

      // Edit mode
      isEditing: function () {
        return GridCore.isEditing();
      },

      // Tools
      setTool: function (key) {
        GridToolbar.toggle(key);
      },
      clearTool: function () {
        GridToolbar.deactivate();
      },
      getActiveTool: function () {
        return GridToolbar.getActive();
      },

      // Lifecycle
      destroy: function () {
        GridDrag.unbind();
        GridPlace.unbind();
        jQuery("#" + cfg.containerId)
          .off(".tl")
          .empty()
          .removeClass("tl-root");
        GridEvents.reset();
        GridCore.reset();
      },
    };
  }

  return { create: create };
})();
