/*!
 * table-layout.js v0.0.1
 * Restaurant Table Layout Grid Library
 * Built: 2026-04-23T01:46:22.463Z
 * Requires: jQuery 3+
 * License: MIT
 */

/* src/core/_TL.js */
/**
 * _TL.js
 * Instance context manager for multi-instance support.
 * Tracks which TableLayout instance is currently active.
 * All modules use _TL.cid() to look up per-instance state.
 */
var _TL = (function () {
  var _cid = null;

  return {
    /** Set the current active instance */
    use: function (id) { _cid = id; },

    /** Get the current active instance containerId */
    cid: function () { return _cid; },

    /** Resolve containerId from a DOM element (walks up to .tl-root) */
    resolve: function (el) {
      var $r = jQuery(el).closest(".tl-root");
      if ($r.length) _cid = $r.attr("id");
      return _cid;
    },

    /** Container-scoped jQuery find */
    $: function (sel) {
      return jQuery("#" + _cid).find(sel);
    }
  };
})();


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
    // realTime: false means editMode: true
    realTime: false,
    trashZone: true,
    swapAnimation: true,
    showSizeBadge: true,
    showHint: false,
    mode: 'edit', // 'edit' or 'view' — determines whether the 'Edit Layout' option appears in the settings popup
    realTime: false,

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


/* src/core/GridEvents.js */
/**
 * GridEvents.js
 * Internal pub/sub event bus — per-instance.
 * Modules communicate through events — not direct calls.
 *
 * Usage:
 *   GridEvents.on('table:created', function(table) { ... });
 *   GridEvents.emit('table:created', newTable);
 */
var GridEvents = (function () {
  var _inst = {};

  function _ctx() {
    var id = _TL.cid();
    if (!_inst[id]) _inst[id] = {};
    return _inst[id];
  }

  function on(event, callback) {
    var L = _ctx();
    if (!L[event]) L[event] = [];
    L[event].push(callback);
  }

  function off(event, callback) {
    var L = _ctx();
    if (!L[event]) return;
    if (!callback) {
      L[event] = [];
    } else {
      L[event] = L[event].filter(function (cb) {
        return cb !== callback;
      });
    }
  }

  function emit(event, data) {
    var L = _ctx();
    if (!L[event]) return;
    L[event].forEach(function (cb) {
      cb(data);
    });
  }

  function reset() {
    _inst[_TL.cid()] = {};
  }

  function destroy() {
    delete _inst[_TL.cid()];
  }

  return { on: on, off: off, emit: emit, reset: reset, destroy: destroy };
})();


/* src/core/GridCore.js */
/**
 * GridCore.js
 * Pure state and logic — zero DOM, zero jQuery (except deep-clone).
 * Two-tier hierarchy: layers → rooms → tables.
 * All other modules read/write state through this API.
 * Per-instance state via _TL context.
 */
var GridCore = (function () {
  var _inst = {};

  function _c() { return _inst[_TL.cid()]; }

  // ── Setup ─────────────────────────────────────────

  function init(cfg) {
    var id = cfg.containerId;
    _inst[id] = {
      cfg: cfg,
      tables: [],
      counter: 1,
      layers: null,
      activeLayerId: null,
      activeRoomId: null,
      editMode: false,
      snapshot: null
    };
    var c = _inst[id];

    if (cfg.layers && cfg.layers.length) {
      c.layers = jQuery.extend(true, [], cfg.layers);
      c.layers.forEach(function (l) {
        if (!Array.isArray(l.rooms)) l.rooms = [];
        l.rooms.forEach(function (r) { if (!Array.isArray(r.tables)) r.tables = []; });
      });
      c.activeLayerId = c.layers[0].id;
      var firstRoom = c.layers[0].rooms[0];
      c.activeRoomId = firstRoom ? firstRoom.id : null;
      c.tables = firstRoom ? jQuery.extend(true, [], firstRoom.tables) : [];
    }
    c.counter = c.tables.length + 1;
  }

  function reset() {
    var c = _c();
    if (!c) return;
    c.cfg = null;
    c.tables = [];
    c.counter = 1;
    c.layers = null;
    c.activeLayerId = null;
    c.activeRoomId = null;
    c.editMode = false;
    c.snapshot = null;
  }

  function destroy() {
    delete _inst[_TL.cid()];
  }

  // ── Config ────────────────────────────────────────

  function getConfig() {
    return _c().cfg;
  }

  // ── Tables ────────────────────────────────────────

  function getTables() {
    return _c().tables;
  }
  function getCounter() {
    return _c().counter;
  }
  function bumpCounter() {
    _c().counter++;
  }

  function tableById(id) {
    return (
      _c().tables.find(function (t) {
        return t.id === id;
      }) || null
    );
  }

  function addTable(table) {
    _c().tables.push(table);
    bumpCounter();
    GridEvents.emit("table:added", table);
  }

  function removeTable(id) {
    var tables = _c().tables;
    var idx = tables.findIndex(function (t) {
      return t.id === id;
    });
    if (idx === -1) return false;
    var removed = tables.splice(idx, 1)[0];
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

  // ── Layer management (top-tier tabs) ───────────────

  function getLayers() {
    return _c().layers || [];
  }

  function getActiveLayerId() {
    return _c().activeLayerId;
  }

  function getActiveLayer() {
    var c = _c();
    if (!c.layers) return null;
    return c.layers.find(function (l) { return l.id === c.activeLayerId; }) || null;
  }

  function switchLayer(id) {
    var c = _c();
    if (!c.layers) return false;
    if (c.editMode) return false;
    _saveCurrentTables();
    var target = c.layers.find(function (l) { return l.id === id; });
    if (!target) return false;
    c.activeLayerId = id;
    var firstRoom = target.rooms[0];
    c.activeRoomId = firstRoom ? firstRoom.id : null;
    c.tables = firstRoom ? jQuery.extend(true, [], firstRoom.tables) : [];
    c.counter = c.tables.length + 1;
    GridEvents.emit("layer:switched", target);
    GridEvents.emit("room:switched", firstRoom || null);
    return true;
  }

  function addLayer(layer) {
    var c = _c();
    if (!c.layers) c.layers = [];
    if (!Array.isArray(layer.rooms)) layer.rooms = [];
    c.layers.push(layer);
    GridEvents.emit("layer:added", layer);
  }

  function deleteLayer(id) {
    var c = _c();
    if (!c.layers || c.layers.length <= 1) return false;
    var idx = c.layers.findIndex(function (l) { return l.id === id; });
    if (idx === -1) return false;
    var removed = c.layers.splice(idx, 1)[0];
    if (c.activeLayerId === id) {
      var next = c.layers[Math.min(idx, c.layers.length - 1)];
      c.activeLayerId = next.id;
      var firstRoom = next.rooms[0];
      c.activeRoomId = firstRoom ? firstRoom.id : null;
      c.tables = firstRoom ? jQuery.extend(true, [], firstRoom.tables) : [];
      c.counter = c.tables.length + 1;
      GridEvents.emit("layer:switched", next);
      GridEvents.emit("room:switched", firstRoom || null);
    }
    GridEvents.emit("layer:deleted", removed);
    return true;
  }

  function reorderLayers(orderedIds) {
    var c = _c();
    if (!c.layers || !orderedIds) return false;
    var map = {};
    c.layers.forEach(function (l) { map[l.id] = l; });
    var reordered = [];
    orderedIds.forEach(function (id) {
      if (map[id]) reordered.push(map[id]);
    });
    c.layers.forEach(function (l) {
      if (reordered.indexOf(l) === -1) reordered.push(l);
    });
    c.layers = reordered;
    GridEvents.emit("layer:reordered", c.layers);
    return true;
  }

  function updateLayerMeta(id, props) {
    var c = _c();
    if (!c.layers) return false;
    var layer = c.layers.find(function (l) { return l.id === id; });
    if (!layer) return false;
    if (props.label !== undefined) layer.label = props.label;
    GridEvents.emit("layer:updated", layer);
    return true;
  }

  // ── Room management (within active layer) ─────────

  function getRooms() {
    var layer = getActiveLayer();
    return layer ? layer.rooms : [];
  }

  function getActiveRoomId() {
    return _c().activeRoomId;
  }

  function getActiveRoom() {
    var layer = getActiveLayer();
    _saveCurrentTables();
    if (!layer) return null;
    return layer.rooms.find(function (r) { return r.id === _c().activeRoomId; }) || null;
  }

  function switchRoom(id) {
    var c = _c();
    if (!c.layers) return false;
    if (c.editMode) return false;
    var layer = getActiveLayer();
    if (!layer) return false;
    _saveCurrentTables();
    var target = layer.rooms.find(function (r) { return r.id === id; });
    if (!target) return false;
    c.activeRoomId = id;
    c.tables = jQuery.extend(true, [], target.tables);
    c.counter = c.tables.length + 1;
    GridEvents.emit("room:switched", target);
    return true;
  }

  function addRoom(room) {
    var layer = getActiveLayer();
    if (!layer) return;
    if (!Array.isArray(room.tables)) room.tables = [];
    layer.rooms.push(room);
    GridEvents.emit("room:added", room);
  }

  function deleteRoom(id) {
    var c = _c();
    var layer = getActiveLayer();
    if (!layer || layer.rooms.length <= 1) return false;
    var idx = layer.rooms.findIndex(function (r) { return r.id === id; });
    if (idx === -1) return false;
    var removed = layer.rooms.splice(idx, 1)[0];
    if (c.activeRoomId === id) {
      var next = layer.rooms[Math.min(idx, layer.rooms.length - 1)];
      c.activeRoomId = next.id;
      c.tables = jQuery.extend(true, [], next.tables);
      c.counter = c.tables.length + 1;
      GridEvents.emit("room:switched", next);
    }
    GridEvents.emit("room:deleted", removed);
    return true;
  }

  function reorderRooms(orderedIds) {
    var layer = getActiveLayer();
    if (!layer || !orderedIds) return false;
    var map = {};
    layer.rooms.forEach(function (r) { map[r.id] = r; });
    var reordered = [];
    orderedIds.forEach(function (id) {
      if (map[id]) reordered.push(map[id]);
    });
    layer.rooms.forEach(function (r) {
      if (reordered.indexOf(r) === -1) reordered.push(r);
    });
    layer.rooms = reordered;
    GridEvents.emit("room:reordered", layer.rooms);
    return true;
  }

  function updateRoomMeta(id, props) {
    var layer = getActiveLayer();
    if (!layer) return false;
    var room = layer.rooms.find(function (r) { return r.id === id; });
    if (!room) return false;
    if (props.label !== undefined) room.label = props.label;
    if (props.icon !== undefined) room.icon = props.icon;
    GridEvents.emit("room:updated", room);
    return true;
  }

  // ── Helper: save current tables into active room ──

  function _saveCurrentTables() {
    var c = _c();
    var layer = getActiveLayer();
    if (!layer) return;
    var room = layer.rooms.find(function (r) { return r.id === c.activeRoomId; });
    if (room) room.tables = jQuery.extend(true, [], c.tables);
  }

  function getAllLayersLayout() {
    var c = _c();
    if (!c.layers) return null;
    _saveCurrentTables();
    return c.layers.map(function (l) { return jQuery.extend(true, {}, l); });
  }

  // ── Edit mode ─────────────────────────────────────

  function isEditing() {
    return _c().editMode;
  }

  function enterEditMode() {
    var c = _c();
    if (c.editMode) return;
    _saveCurrentTables();
    c.snapshot = {
      tables: jQuery.extend(true, [], c.tables),
      layers: c.layers ? jQuery.extend(true, [], c.layers) : null,
      activeLayerId: c.activeLayerId,
      activeRoomId: c.activeRoomId,
    };
    c.editMode = true;
    GridEvents.emit("edit:enter");
  }

  function saveEdit() {
    var c = _c();
    if (!c.editMode) return;
    c.snapshot = null;
    c.editMode = false;
    GridEvents.emit("edit:saved");
    GridEvents.emit("edit:exit");
  }

  function discardEdit() {
    var c = _c();
    if (!c.editMode) return;
    c.layers = c.snapshot.layers ? jQuery.extend(true, [], c.snapshot.layers) : null;
    c.activeLayerId = c.snapshot.activeLayerId;
    c.activeRoomId = c.snapshot.activeRoomId;
    c.tables = jQuery.extend(true, [], c.snapshot.tables);
    c.counter = c.tables.length + 1;
    c.snapshot = null;
    c.editMode = false;
    var restoredRoom = getActiveRoom();
    if (restoredRoom) GridEvents.emit("room:updated", restoredRoom);
    var restoredLayer = getActiveLayer();
    if (restoredLayer) GridEvents.emit("layer:updated", restoredLayer);
    GridEvents.emit("edit:discarded");
    GridEvents.emit("edit:exit");
  }

  // ── Layout snapshot ───────────────────────────────

  function getLayout() {
    return _c().tables.map(function (t) {
      return jQuery.extend({}, t);
    });
  }

  // ── Collision ─────────────────────────────────────

  function hasCollision(col, row, colSpan, rowSpan, excludeId) {
    var c = _c();
    if (col < 1 || row < 1) return true;
    if (col + colSpan - 1 > c.cfg.columns) return true;
    if (row + rowSpan - 1 > c.cfg.rows) return true;

    var excludeIds = Array.isArray(excludeId) ? excludeId : (excludeId ? [excludeId] : []);

    return c.tables.some(function (t) {
      if (excludeIds.indexOf(t.id) !== -1) return false;
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
    var cfg = _c().cfg;
    var shapeDef = (cfg.shapes || {})[shapeKey] || {};
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
    var cfg = _c().cfg;
    var shapeDef = (cfg.shapes || {})[shapeKey] || {};
    return {
      clipPath: shapeDef.clipPath || "none",
      borderRadius: shapeDef.borderRadius || "8px",
    };
  }

  // ── Coordinate helpers ────────────────────────────

  function pxToGrid(offsetX, offsetY) {
    var cfg = _c().cfg;
    var unit = cfg.cellSize + cfg.gap;
    return {
      col: Math.max(1, Math.min(cfg.columns, Math.floor(offsetX / unit) + 1)),
      row: Math.max(1, Math.min(cfg.rows, Math.floor(offsetY / unit) + 1)),
    };
  }

  function cursorToGrid(clientX, clientY) {
    var gridEl = _TL.$(".tl-layout-grid")[0];
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
    destroy: destroy,
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
    // Layers (top-tier tabs)
    getLayers: getLayers,
    getActiveLayerId: getActiveLayerId,
    getActiveLayer: getActiveLayer,
    switchLayer: switchLayer,
    addLayer: addLayer,
    deleteLayer: deleteLayer,
    reorderLayers: reorderLayers,
    updateLayerMeta: updateLayerMeta,
    getAllLayersLayout: getAllLayersLayout,
    // Rooms (within active layer)
    getRooms: getRooms,
    getActiveRoomId: getActiveRoomId,
    getActiveRoom: getActiveRoom,
    switchRoom: switchRoom,
    addRoom: addRoom,
    deleteRoom: deleteRoom,
    reorderRooms: reorderRooms,
    updateRoomMeta: updateRoomMeta,
    // Edit mode
    isEditing: isEditing,
    enterEditMode: enterEditMode,
    saveEdit: saveEdit,
    discardEdit: discardEdit,
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
        draggable: (cfg.draggable && (cfg.realTime !== false || GridCore.isEditing())) ? "true" : "false",
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

    // ── Click event (view mode only — not when editing) ──
    (function (tableId) {
      $card.on('click', function (e) {
        if (GridCore.isEditing() || cfg.realTime !== false) return;
        if (typeof cfg.onTableClick === 'function') {
          var tbl = GridCore.tableById(tableId);
          if (tbl) cfg.onTableClick(tbl);
        }
      });
    })(t.id);

    // ── Edit button (visible in edit mode) ──
    if (cfg.realTime !== false || GridCore.isEditing()) {
      var tableId = t.id;
      var $editBtn = jQuery("<button>")
        .addClass(ns("table-edit-btn"))
        .attr({ title: "Edit table", draggable: "false", type: "button" })
        .html('<i class="fa-solid fa-pen"></i>')
        .on("click", function (e) {
          e.stopPropagation();
          e.preventDefault();
          if (cfg.realTime === false && !GridCore.isEditing()) return;
          var tbl = GridCore.tableById(tableId);
          if (tbl) GridEdit.showEditModal(tbl);
        });
      $card.append($editBtn);
    }

    // ── Resize handles (visible in edit mode) ──
    if (cfg.realTime !== false || GridCore.isEditing()) {
      var handles = ["e", "s", "se"];
      handles.forEach(function (dir) {
        $card.append(
          jQuery("<div>")
            .addClass(ns("resize-handle") + " " + ns("resize-" + dir))
            .attr({ "data-resize-dir": dir, draggable: "false" })
        );
      });
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


/* src/modules/GridLayers.js */
/**
 * GridLayers.js
 * Layer/floor tab bar — browser-style tabs for switching between layers.
 * Only active when cfg.layers is defined.
 * Per-instance state via _TL context.
 */
var GridLayers = (function () {
  var _inst = {};

  function _c() { return _inst[_TL.cid()]; }

  function init() {
    _inst[_TL.cid()] = { $tabBar: null };
  }

  function destroy() {
    delete _inst[_TL.cid()];
  }

  function buildTabBar() {
    var ctx = _c();
    ctx.$tabBar = jQuery("<div>").addClass("tl-tab-bar");
    _renderTabs();

    GridEvents.on("layer:added", function () { _renderTabs(); });
    GridEvents.on("layer:deleted", function () { _renderTabs(); });
    GridEvents.on("layer:reordered", function () { _renderTabs(); });
    GridEvents.on("layer:updated", function () { _renderTabs(); });
    GridEvents.on("layer:switched", function () { _renderTabs(); });

    return ctx.$tabBar;
  }

  function _renderTabs() {
    var ctx = _c();
    if (!ctx || !ctx.$tabBar) return;
    ctx.$tabBar.empty();

    var cid = _TL.cid();
    var cfg = GridCore.getConfig();
    var layers = GridCore.getLayers();
    var activeId = GridCore.getActiveLayerId();

    jQuery.each(layers, function (_, layer) {
      var isActive = layer.id === activeId;
      var $tab = jQuery("<div>")
        .addClass("tl-tab" + (isActive ? " tl-tab--active" : ""))
        .attr({ "data-layer-id": layer.id, "draggable": "true" });

      var $icon = _buildIconBadge(layer);
      var $label = jQuery("<span>").addClass("tl-tab-label").text(layer.label);
      $tab.append($icon, $label);

      if (layers.length > 1 && cfg.realTime === false && GridCore.isEditing()) {
        var $close = jQuery("<span>")
          .addClass("tl-tab-close")
          .html("&times;")
          .on("click", function (e) {
            e.stopPropagation();
            _TL.use(cid);
            if (cfg.realTime === false && !GridCore.isEditing()) return;
            _confirmDeleteLayer(layer);
          });
        $tab.append($close);
      }

      $tab.on("click", function () {
        _TL.use(cid);
        if (isActive) return;
        if (cfg.realTime === false && GridCore.isEditing()) return;
        GridCore.switchLayer(layer.id);
        _rebuildGrid();
      });

      $tab.on("dragstart", function (e) {
        _TL.use(cid);
        if (cfg.realTime === false && !GridCore.isEditing()) { e.preventDefault(); return; }
        e.originalEvent.dataTransfer.effectAllowed = "move";
        e.originalEvent.dataTransfer.setData("text/plain", layer.id);
        $tab.addClass("tl-tab--dragging");
      });
      $tab.on("dragend", function () {
        $tab.removeClass("tl-tab--dragging");
        ctx.$tabBar.find(".tl-tab--drag-over").removeClass("tl-tab--drag-over");
      });
      $tab.on("dragover", function (e) {
        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = "move";
        $tab.addClass("tl-tab--drag-over");
      });
      $tab.on("dragleave", function () {
        $tab.removeClass("tl-tab--drag-over");
      });
      $tab.on("drop", function (e) {
        e.preventDefault();
        _TL.use(cid);
        $tab.removeClass("tl-tab--drag-over");
        var draggedId = e.originalEvent.dataTransfer.getData("text/plain");
        if (draggedId === layer.id) return;
        var currentIds = layers.map(function (l) { return l.id; });
        var fromIdx = currentIds.indexOf(draggedId);
        var toIdx = currentIds.indexOf(layer.id);
        if (fromIdx === -1 || toIdx === -1) return;
        currentIds.splice(fromIdx, 1);
        currentIds.splice(toIdx, 0, draggedId);
        GridCore.reorderLayers(currentIds);
      });

      $tab.on("dblclick", function (e) {
        e.stopPropagation();
        _TL.use(cid);
        if (cfg.realTime !== false || !GridCore.isEditing()) return;
        _startTabRename($tab, layer);
      });

      ctx.$tabBar.append($tab);
    });

    var $addTab = jQuery("<div>")
      .addClass("tl-tab-add")
      .attr("title", "Add Floor")
      .html('<i class="fa-solid fa-plus"></i>')
      .on("click", function () {
        _TL.use(cid);
        if (cfg.realTime === false && !GridCore.isEditing()) return;
        if (typeof cfg.onCreateLayer === "function") {
          cfg.onCreateLayer(function (details) {
            _TL.use(cid);
            _createNewLayer(details);
          });
          return;
        }
        _openAddFloorModal();
      });
    ctx.$tabBar.append($addTab);
  }

  function renderTabs() {
    _renderTabs();
  }

  function _startTabRename($tab, layer) {
    var $label = $tab.find(".tl-tab-label");
    var $input = jQuery("<input>")
      .addClass("tl-tab-rename-input")
      .attr({ type: "text", maxlength: 30 })
      .val(layer.label);
    $label.replaceWith($input);
    $input.trigger("focus").trigger("select");

    function commit() {
      var val = jQuery.trim($input.val());
      if (val && val !== layer.label) {
        GridCore.updateLayerMeta(layer.id, { label: val });
      }
      _renderTabs();
    }

    $input.on("blur", commit);
    $input.on("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); $input.trigger("blur"); }
      if (e.key === "Escape") { _renderTabs(); }
    });
    $input.on("click", function (e) { e.stopPropagation(); });
  }

  function _openAddFloorModal() {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();
    var pickerCfg = cfg.iconPicker || {};
    var icons = pickerCfg.icons || [];
    var maxText = pickerCfg.maxTextLength || 4;
    var allowText = pickerCfg.allowText !== false;
    var _selectedIcon = "";

    var $overlay = jQuery("<div>").addClass("tl-overlay");
    var $modal = jQuery("<div>").addClass("tl-modal");

    $modal.append(
      jQuery("<h2>").html('<i class="fa-solid fa-layer-group"></i> New Floor')
    );

    var $nameField = jQuery("<div>").addClass("tl-field");
    $nameField.append(jQuery("<label>").text("Name"));
    var $nameInput = jQuery("<input>").attr({ type: "text", placeholder: "Floor name", maxlength: 30 });
    $nameField.append($nameInput);

    var $iconField = jQuery("<div>").addClass("tl-field");
    $iconField.append(jQuery("<label>").text("Icon"));

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

    var $create = jQuery("<button>").addClass("tl-btn tl-btn-primary").text("Add Floor")
      .on("click", function () {
        var labelVal = jQuery.trim($nameInput.val());
        if (!labelVal) { $nameInput.addClass("tl-input-error").trigger("focus"); return; }
        $nameInput.removeClass("tl-input-error");
        var iconVal = _selectedIcon || labelVal.charAt(0).toUpperCase();
        $overlay.remove();
        _TL.use(cid);
        _createNewLayer({ label: labelVal, icon: iconVal });
      });

    $nameInput.on("input", function () { jQuery(this).removeClass("tl-input-error"); });
    $nameInput.on("keydown", function (e) { if (e.key === "Enter") $create.trigger("click"); });

    $actions.append($cancel, $create);
    $modal.append($nameField, $iconField, $actions);
    $overlay.append($modal);
    jQuery("#" + cid).append($overlay);

    $overlay.on("click", function (e) { if (jQuery(e.target).is($overlay)) $overlay.remove(); });

    setTimeout(function () { $nameInput.trigger("focus"); }, 50);
  }

  function _createNewLayer(details) {
    var label = (details && details.label) || "Floor";
    var icon = (details && details.icon) || label.charAt(0).toUpperCase();
    var layer = {
      id: "floor-" + Date.now(),
      label: label,
      icon: icon,
      rooms: [{
        id: "room-" + Date.now(),
        label: "Room 1",
        icon: "fa-solid fa-utensils",
        tables: [],
      }],
    };
    GridCore.addLayer(layer);
    GridCore.switchLayer(layer.id);
    _rebuildGrid();
  }

  function _confirmDeleteLayer(layer) {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();
    var $overlay = jQuery("<div>").addClass("tl-overlay");
    var $modal = jQuery("<div>").addClass("tl-modal");
    $modal.append(
      jQuery("<h2>").html('<i class="fa-solid fa-triangle-exclamation"></i> Delete Floor')
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
        _TL.use(cid);
        var wasActive = (layer.id === GridCore.getActiveLayerId());
        GridCore.deleteLayer(layer.id);
        if (wasActive) _rebuildGrid();
      });
    $actions.append($cancel, $confirm);
    $modal.append($actions);
    $overlay.append($modal);
    jQuery("#" + cid).append($overlay);
    $overlay.on("click", function (e) { if (jQuery(e.target).is($overlay)) $overlay.remove(); });
  }

  function _buildIconBadge(layer) {
    var $badge = jQuery("<div>").addClass("tl-toolbar-icon-badge");
    if (layer) _renderIconContent($badge, layer.icon, layer.label);
    return $badge;
  }

  function _renderIconContent($el, iconValue, label) {
    $el.empty();
    if (!iconValue) { $el.text(label ? label.charAt(0).toUpperCase() : "?"); return; }
    if (iconValue.indexOf("fa-") !== -1) { $el.append(jQuery("<i>").addClass(iconValue)); return; }
    var lower = iconValue.toLowerCase();
    if (lower.indexOf(".svg") !== -1 || lower.indexOf(".png") !== -1 ||
        lower.indexOf(".jpg") !== -1 || lower.indexOf(".jpeg") !== -1 ||
        lower.indexOf(".gif") !== -1 || lower.indexOf(".webp") !== -1) {
      $el.append(jQuery("<img>").attr("src", iconValue).addClass("tl-toolbar-icon-img"));
      return;
    }
    $el.text(iconValue);
  }

  function _rebuildGrid() {
    _TL.$(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  return {
    init: init,
    destroy: destroy,
    buildTabBar: buildTabBar,
    renderTabs: renderTabs,
  };
})();


/* src/modules/GridToolbar.js */
/**
 * GridToolbar.js
 * Toolbar shell — edit controls, settings popup, shape panel.
 * Layer tabs are delegated to GridLayers.buildTabBar().
 * Room switching is delegated to GridRooms.build().
 * Per-instance state via _TL context.
 */
var GridToolbar = (function () {
  var _inst = {};

  function _c() { return _inst[_TL.cid()]; }

  function init() {
    _inst[_TL.cid()] = {
      activeTool: null,
      $layoutName: null,
      $layoutIcon: null,
      $editSection: null,
      nameEditing: false,
      $iconPicker: null,
      $settingsPopup: null
    };
  }

  function destroy() {
    var cid = _TL.cid();
    jQuery(document).off("mousedown.tl-iconpicker-" + cid);
    delete _inst[cid];
  }

  // ── Toolbar build ─────────────────────────────────

  function build() {
    var cfg = GridCore.getConfig();
    var ctx = _c();
    var cid = _TL.cid();
    var $toolbar = jQuery("<div>").addClass("tl-toolbar");

    // Left: layer tabs (delegated to GridLayers)
    if (cfg.layers && cfg.layers.length) {
      $toolbar.append(GridLayers.buildTabBar());

      GridEvents.on("layer:switched", function () {
        _refreshRoomDisplay(GridCore.getActiveRoom());
      });
    }

    $toolbar.append(jQuery("<div>").addClass("tl-toolbar-spacer"));

    // Right: edit controls + settings
    if (cfg.layers && cfg.layers.length) {
      var $right = jQuery("<div>").addClass("tl-toolbar-right");

      var activeRoom = GridCore.getActiveRoom();

      ctx.$layoutIcon = _buildIconBadge(activeRoom);
      ctx.$layoutIcon.on("click", function (e) {
        e.stopPropagation();
        _TL.use(cid);
        _toggleIconPicker();
      });

      ctx.$layoutName = jQuery("<span>")
        .addClass("tl-toolbar-layout-name")
        .text(activeRoom ? activeRoom.label : "")
        .on("click", function () {
          _TL.use(cid);
          _startNameEdit();
        });

      GridEvents.on("room:switched", function (room) {
        _refreshRoomDisplay(room);
      });

      ctx.$editSection = jQuery("<div>").addClass("tl-toolbar-actions");
      _renderEditControls();
      $right.append(ctx.$editSection);

      $toolbar.append($right);
    }

    // Close icon picker / settings popup on outside click
    jQuery(document).on("mousedown.tl-iconpicker-" + cid, function (e) {
      _TL.use(cid);
      var ctx2 = _c();
      if (ctx2.$iconPicker && !jQuery(e.target).closest(".tl-icon-picker, .tl-toolbar-icon-badge").length) {
        _closeIconPicker();
      }
      if (ctx2.$settingsPopup && !jQuery(e.target).closest(".tl-settings-popup, .tl-toolbar-btn--settings").length) {
        _closeSettingsPopup();
      }
    });

    return $toolbar;
  }

  // ── Icon badge (display for active room) ──────────

  function _buildIconBadge(room) {
    var $badge = jQuery("<div>").addClass("tl-toolbar-icon-badge");
    if (room) {
      _renderIconContent($badge, room.icon, room.label);
    }
    return $badge;
  }

  function _renderIconContent($el, iconValue, label) {
    $el.empty();
    if (!iconValue) {
      $el.text(label ? label.charAt(0).toUpperCase() : "?");
      return;
    }
    if (iconValue.indexOf("fa-") !== -1) {
      $el.append(jQuery("<i>").addClass(iconValue));
      return;
    }
    var lower = iconValue.toLowerCase();
    if (lower.indexOf(".svg") !== -1 || lower.indexOf(".png") !== -1 ||
        lower.indexOf(".jpg") !== -1 || lower.indexOf(".jpeg") !== -1 ||
        lower.indexOf(".gif") !== -1 || lower.indexOf(".webp") !== -1) {
      $el.append(jQuery("<img>").attr("src", iconValue).addClass("tl-toolbar-icon-img"));
      return;
    }
    $el.text(iconValue);
  }

  function _refreshRoomDisplay(room) {
    var ctx = _c();
    if (ctx.$layoutName && !ctx.nameEditing) {
      ctx.$layoutName.text(room ? room.label : "");
    }
    if (ctx.$layoutIcon) {
      ctx.$layoutIcon.empty();
      if (room) _renderIconContent(ctx.$layoutIcon, room.icon, room.label);
    }
  }

  // ── Inline name editing (click to edit room name) ──

  function _startNameEdit() {
    var cfg = GridCore.getConfig();
    var ctx = _c();
    var cid = _TL.cid();
    if (!cfg.layers || !cfg.layers.length) return;
    if (cfg.realTime !== false || !GridCore.isEditing()) return;
    if (ctx.nameEditing) return;
    var room = GridCore.getActiveRoom();
    if (!room) return;

    ctx.nameEditing = true;
    var $input = jQuery("<input>")
      .addClass("tl-toolbar-layout-name-input")
      .attr({ type: "text", maxlength: 30, placeholder: "Room name" })
      .val(room.label);

    ctx.$layoutName.replaceWith($input);
    ctx.$layoutName = $input;
    $input.trigger("focus").trigger("select");

    function commit() {
      _TL.use(cid);
      var ctx2 = _c();
      if (!ctx2.nameEditing) return;
      ctx2.nameEditing = false;
      var val = jQuery.trim($input.val());
      if (val && val !== room.label) {
        GridCore.updateRoomMeta(room.id, { label: val });
        var c = GridCore.getConfig();
        if (typeof c.onRoomChange === "function" && (c.realTime !== false || GridCore.isEditing()))
          c.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
      }
      var updatedRoom = GridCore.getActiveRoom();
      var $span = jQuery("<span>")
        .addClass("tl-toolbar-layout-name")
        .text(updatedRoom ? updatedRoom.label : "")
        .on("click", function () {
          _TL.use(cid);
          _startNameEdit();
        });
      $input.replaceWith($span);
      ctx2.$layoutName = $span;
    }

    $input.on("blur", commit);
    $input.on("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); $input.trigger("blur"); }
      if (e.key === "Escape") {
        _TL.use(cid);
        var ctx2 = _c();
        ctx2.nameEditing = false;
        var $span = jQuery("<span>")
          .addClass("tl-toolbar-layout-name")
          .text(room.label)
          .on("click", function () {
            _TL.use(cid);
            _startNameEdit();
          });
        $input.replaceWith($span);
        ctx2.$layoutName = $span;
      }
    });
  }

  // ── Icon picker popup (for room icon) ─────────────

  function _toggleIconPicker() {
    var cfg = GridCore.getConfig();
    if (cfg.realTime !== false || !GridCore.isEditing()) return;
    if (_c().$iconPicker) {
      _closeIconPicker();
    } else {
      _openIconPicker();
    }
  }

  function _closeIconPicker() {
    var ctx = _c();
    if (ctx.$iconPicker) {
      ctx.$iconPicker.remove();
      ctx.$iconPicker = null;
    }
    if (ctx.$layoutIcon) ctx.$layoutIcon.removeClass("tl-toolbar-icon-badge--picker-open");
  }

  function _openIconPicker() {
    var cfg = GridCore.getConfig();
    var ctx = _c();
    var cid = _TL.cid();
    if (!cfg.layers || !cfg.layers.length) return;
    var room = GridCore.getActiveRoom();
    if (!room) return;
    var pickerCfg = cfg.iconPicker || {};
    var icons = pickerCfg.icons || [];
    var maxText = pickerCfg.maxTextLength || 4;
    var allowText = pickerCfg.allowText !== false;

    _closeIconPicker();

    var $picker = jQuery("<div>").addClass("tl-icon-picker");

    $picker.append(jQuery("<div>").addClass("tl-icon-picker-header").text("Choose Icon"));

    if (icons.length) {
      var $grid = jQuery("<div>").addClass("tl-icon-picker-grid");
      jQuery.each(icons, function (_, ico) {
        var $btn = jQuery("<button>")
          .addClass("tl-icon-picker-btn")
          .attr("title", ico.label || "")
          .on("click", function () {
            _TL.use(cid);
            _selectIcon(room, ico.value);
          });

        if (ico.type === "fa") {
          $btn.append(jQuery("<i>").addClass(ico.value));
        } else if (ico.type === "svg" || ico.type === "img") {
          $btn.append(jQuery("<img>").attr("src", ico.value).addClass("tl-icon-picker-img"));
        } else {
          $btn.text(ico.value);
        }

        if (room.icon === ico.value) $btn.addClass("tl-icon-picker-btn--active");
        $grid.append($btn);
      });
      $picker.append($grid);
    }

    if (allowText) {
      var $textSection = jQuery("<div>").addClass("tl-icon-picker-text-section");
      $textSection.append(jQuery("<span>").addClass("tl-icon-picker-text-label").text("Or type text:"));
      var $row = jQuery("<div>").addClass("tl-icon-picker-text-row");
      var $textInput = jQuery("<input>")
        .addClass("tl-icon-picker-text-input")
        .attr({ type: "text", maxlength: maxText, placeholder: "A, 1F…" })
        .val(
          room.icon && room.icon.indexOf("fa-") === -1 &&
          room.icon.indexOf(".") === -1 ? room.icon : ""
        );
      var $applyBtn = jQuery("<button>")
        .addClass("tl-icon-picker-apply")
        .text("Apply")
        .on("click", function () {
          _TL.use(cid);
          var v = jQuery.trim($textInput.val());
          if (v) _selectIcon(room, v);
        });
      $textInput.on("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); $applyBtn.trigger("click"); }
      });
      $row.append($textInput, $applyBtn);
      $textSection.append($row);
      $picker.append($textSection);
    }

    ctx.$layoutIcon.addClass("tl-toolbar-icon-badge--picker-open");
    var $right = ctx.$layoutIcon.closest(".tl-toolbar-right");
    $right.css("position", "relative");
    $right.append($picker);
    ctx.$iconPicker = $picker;

    setTimeout(function () { $picker.addClass("tl-icon-picker--open"); }, 10);
  }

  function _confirmDeleteRoom(room) {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();
    var $overlay = jQuery("<div>").addClass("tl-overlay");
    var $modal = jQuery("<div>").addClass("tl-modal");
    $modal.append(
      jQuery("<h2>").html('<i class="fa-solid fa-triangle-exclamation"></i> Delete Room')
    );
    $modal.append(
      jQuery("<p>").addClass("tl-modal-text").text(
        'Are you sure you want to delete "' + room.label + '"? This action cannot be undone.'
      )
    );
    var $actions = jQuery("<div>").addClass("tl-modal-actions");
    var $cancel = jQuery("<button>").addClass("tl-btn tl-btn-cancel").text("Cancel")
      .on("click", function () { $overlay.remove(); });
    var $confirm = jQuery("<button>").addClass("tl-btn tl-btn-danger").text("Delete")
      .on("click", function () {
        $overlay.remove();
        _TL.use(cid);
        var wasActive = (room.id === GridCore.getActiveRoomId());
        GridCore.deleteRoom(room.id);
        if (wasActive) {
          _TL.$(".tl-zoom-area").empty().append(GridRender.buildGrid());
        }
        _refreshRoomDisplay(GridCore.getActiveRoom());
        var c = GridCore.getConfig();
        if (typeof c.onRoomChange === "function")
          c.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
      });
    $actions.append($cancel, $confirm);
    $modal.append($actions);
    $overlay.append($modal);
    jQuery("#" + cid).append($overlay);
    $overlay.on("click", function (e) { if (jQuery(e.target).is($overlay)) $overlay.remove(); });
  }

  function _selectIcon(room, value) {
    GridCore.updateRoomMeta(room.id, { icon: value });
    var cfg = GridCore.getConfig();
    var ctx = _c();
    if (typeof cfg.onRoomChange === "function" && !GridCore.isEditing())
      cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
    var updated = GridCore.getActiveRoom();
    ctx.$layoutIcon.find(".tl-icon-picker").detach();
    _renderIconContent(ctx.$layoutIcon, updated.icon, updated.label);
    _closeIconPicker();
    var cid = _TL.cid();
    ctx.$layoutIcon.off("click").on("click", function (e) {
      e.stopPropagation();
      _TL.use(cid);
      _toggleIconPicker();
    });
  }

  // ── Edit controls ─────────────────────────────────

  function _renderEditControls() {
    var ctx = _c();
    var cid = _TL.cid();
    if (!ctx.$editSection) return;
    ctx.$editSection.empty();

    var cfg = GridCore.getConfig();

    if (cfg.realTime === false && GridCore.isEditing()) {
      ctx.$editSection.append(
        jQuery("<button>")
          .addClass("tl-toolbar-btn tl-toolbar-btn--save")
          .attr("title", "Save changes")
          .html('<i class="fa-solid fa-check"></i><span>Save</span>')
          .on("click", function () { _TL.use(cid); _handleSave(); }),
        jQuery("<button>")
          .addClass("tl-toolbar-btn tl-toolbar-btn--discard")
          .attr("title", "Discard changes")
          .html('<i class="fa-solid fa-xmark"></i><span>Discard</span>')
          .on("click", function () { _TL.use(cid); _handleDiscard(); })
      );
    }

    // Settings gear — visible only when NOT in edit mode and has options
    var hasSettingsOptions = cfg.realTime === false && cfg.mode !== "view" && !GridCore.isEditing();
    if ((cfg.realTime !== false || !GridCore.isEditing()) && hasSettingsOptions) {
      var $settingsWrap = jQuery("<div>").css("position", "relative").css("display", "inline-flex");
      var $settingsBtn = jQuery("<button>")
        .addClass("tl-toolbar-btn tl-toolbar-btn--settings")
        .attr("title", "Room settings")
        .html('<i class="fa-solid fa-gear"></i>')
        .on("click", function (e) {
          e.stopPropagation();
          _TL.use(cid);
          _toggleSettingsPopup($settingsWrap);
        });
      $settingsWrap.append($settingsBtn);
      ctx.$editSection.append($settingsWrap);
    }

    // Help button — always visible
    var $helpBtn = jQuery("<button>")
      .addClass("tl-toolbar-btn tl-toolbar-btn--help")
      .attr("title", "Help & Tutorial")
      .html('<i class="fa-solid fa-circle-question"></i>')
      .on("click", function (e) {
        e.stopPropagation();
        _TL.use(cid);
        GridHelp.show();
      });
    ctx.$editSection.append($helpBtn);
  }

  // ── Settings popup (manages rooms) ────────────────

  function _toggleSettingsPopup($anchor) {
    if (_c().$settingsPopup) {
      _closeSettingsPopup();
    } else {
      _openSettingsPopup($anchor);
    }
  }

  function _closeSettingsPopup() {
    var ctx = _c();
    if (ctx.$settingsPopup) {
      ctx.$settingsPopup.remove();
      ctx.$settingsPopup = null;
    }
  }

  function _openSettingsPopup($anchor) {
    _closeSettingsPopup();
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();

    var $popup = jQuery("<div>").addClass("tl-settings-popup");

    // Edit option (only when realTime is false, mode is not 'view', and not currently editing)
    if (cfg.realTime === false && cfg.mode !== "view" && !GridCore.isEditing()) {
      var $editOpt = jQuery("<button>")
        .addClass("tl-settings-option")
        .html('<i class="fa-solid fa-pen"></i><span>Edit Layout</span>')
        .on("click", function () {
          _TL.use(cid);
          _closeSettingsPopup();
          _handleEdit();
        });
      $popup.append($editOpt);
    }

    $anchor.append($popup);
    _c().$settingsPopup = $popup;

    setTimeout(function () { $popup.addClass("tl-settings-popup--open"); }, 10);
  }

  function _handleEdit() {
    var cid = _TL.cid();
    GridCore.enterEditMode();
    _renderEditControls();
    GridLayers.renderTabs();
    GridRooms.renderTabs();
    _setEditableState(true);
    jQuery("#" + cid).removeClass("tl-view-mode").addClass("tl-edit-mode");
    _TL.$(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  function _handleSave() {
    deactivate();
    GridMultiSelect.deactivate();
    GridCore.saveEdit();
    _renderEditControls();
    GridLayers.renderTabs();
    GridRooms.renderTabs();
    _setEditableState(false);
    var cid = _TL.cid();
    jQuery("#" + cid).removeClass("tl-edit-mode").addClass("tl-view-mode");
    _TL.$(".tl-zoom-area").empty().append(GridRender.buildGrid());
    var cfg = GridCore.getConfig();
    if (typeof cfg.onLayoutChange === "function") cfg.onLayoutChange(GridCore.getLayout());
    if (typeof cfg.onRoomChange === "function")
      cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
  }

  function _handleDiscard() {
    deactivate();
    GridMultiSelect.deactivate();
    GridCore.discardEdit();
    _renderEditControls();
    GridLayers.renderTabs();
    GridRooms.renderTabs();
    _setEditableState(false);
    var room = GridCore.getActiveRoom();
    _refreshRoomDisplay(room);
    var cid = _TL.cid();
    jQuery("#" + cid).removeClass("tl-edit-mode").addClass("tl-view-mode");
    _TL.$(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  function _setEditableState(editable) {
    var ctx = _c();
    if (ctx.$layoutIcon) ctx.$layoutIcon.toggleClass("tl-toolbar-icon-badge--editable", editable);
    if (ctx.$layoutName) ctx.$layoutName.toggleClass("tl-toolbar-layout-name--editable", editable);
  }

  // ── Shape panel ───────────────────────────────────

  function buildShapePanel() {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();
    var $panel = jQuery("<div>").addClass("tl-shape-panel");

    // Multiselect tool
    var $mselBtn = jQuery("<button>")
      .addClass("tl-shape-tool-btn tl-multiselect-tool-btn")
      .attr({ title: "Multi-select" })
      .append(jQuery("<i>").addClass("fa-solid fa-arrow-pointer"))
      .on("click", function () {
        _TL.use(cid);
        if (GridMultiSelect.isActive()) {
          GridMultiSelect.deactivate();
        } else {
          deactivate();
          GridMultiSelect.activate();
        }
      });
    $panel.append($mselBtn);

    jQuery.each(cfg.shapes, function (key, shape) {
      $panel.append(_buildShapeBtn(key, shape, cid));
    });

    return $panel;
  }

  function _buildShapeBtn(key, shape, cid) {
    return jQuery("<button>")
      .addClass("tl-shape-tool-btn")
      .attr({ "data-shape-key": key, title: shape.label })
      .append(jQuery("<i>").addClass(shape.icon))
      .on("click", function () {
        _TL.use(cid);
        toggle(key);
      });
  }

  function toggle(key) {
    var cfg = GridCore.getConfig();
    if (cfg.realTime === false && !GridCore.isEditing()) return;
    GridMultiSelect.deactivate();
    var ctx = _c();
    if (ctx.activeTool === key) {
      deactivate();
    } else {
      ctx.activeTool = key;
      _TL.$(".tl-shape-tool-btn").removeClass("active");
      _TL.$('[data-shape-key="' + key + '"]').addClass("active");
      _TL.$(".tl-canvas").addClass("tl-placing-mode");
      GridEvents.emit("tool:changed", key);
    }
  }

  function deactivate() {
    var ctx = _c();
    if (!ctx) return;
    ctx.activeTool = null;
    _TL.$(".tl-shape-tool-btn").removeClass("active");
    _TL.$(".tl-canvas").removeClass("tl-placing-mode");
    GridEvents.emit("tool:changed", null);
  }

  function getActive() {
    var ctx = _c();
    return ctx ? ctx.activeTool : null;
  }

  return {
    init: init,
    destroy: destroy,
    build: build,
    buildShapePanel: buildShapePanel,
    toggle: toggle,
    deactivate: deactivate,
    getActive: getActive,
  };
})();


/* src/modules/GridZoom.js */
var GridZoom = (function () {
  var _inst = {};

  function _c() { return _inst[_TL.cid()]; }

  function init(initial) {
    _inst[_TL.cid()] = { zoom: initial || 1 };
  }

  function destroy() {
    delete _inst[_TL.cid()];
  }

  function buildControls() {
    var cfg = GridCore.getConfig();
    var zCfg = cfg.zoom || {};
    if (!zCfg.enabled || !zCfg.showControls) return jQuery();

    var cid = _TL.cid();
    var min  = zCfg.min  || 0.4;
    var max  = zCfg.max  || 2;
    var step = zCfg.step || 0.1;

    var $reset = jQuery("<button>")
      .addClass("tl-zoom-btn tl-zoom-btn-reset")
      .attr("title", "Reset zoom")
      .html(zCfg.labelReset || "↺")
      .on("click", function () { _TL.use(cid); applyZoom(zCfg.initial || 1); });

    var $slider = jQuery("<input>")
      .attr({ type: "range", min: min, max: max, step: step, value: _c().zoom })
      .addClass("tl-zoom-slider")
      .on("input", function () { _TL.use(cid); applyZoom(parseFloat(this.value)); });

    var $label = jQuery("<span>").addClass("tl-zoom-label").text(_fmt(_c().zoom));

    var $fullscreen = GridFullscreen.buildButton();

    return jQuery("<div>")
      .addClass("tl-zoom-controls")
      .append($reset, $fullscreen, $slider, $label);
  }

  function applyZoom(level, silent) {
    var cfg = GridCore.getConfig();
    var zCfg = cfg.zoom || {};
    var min = zCfg.min || 0.4;
    var max = zCfg.max || 2;

    level = parseFloat(Math.min(max, Math.max(min, level)).toFixed(2));
    _c().zoom = level;

    var $za = _TL.$(".tl-zoom-area");
    $za.css("transform", "scale(" + level + ")");

    var natW = $za[0] ? $za[0].scrollWidth : 0;
    var natH = $za[0] ? $za[0].scrollHeight : 0;
    $za.css({ width: natW * level + "px", height: natH * level + "px" });

    _TL.$(".tl-zoom-label").text(_fmt(level));
    _TL.$(".tl-zoom-slider").val(level);

    GridEvents.emit("zoom:changed", level);

    if (!silent && typeof cfg.onZoom === "function") cfg.onZoom(level);
  }

  function bindWheelZoom() {
    var cfg = GridCore.getConfig();
    var zCfg = cfg.zoom || {};
    if (!zCfg.enabled || !zCfg.mouseWheel) return;

    var cid = _TL.cid();

    jQuery("#" + cid).on("wheel.tl-" + cid, function (e) {
      if (!e.originalEvent.ctrlKey) return;
      e.preventDefault();
      _TL.use(cid);
      applyZoom(
        _c().zoom + (e.originalEvent.deltaY > 0 ? -1 : 1) * (zCfg.step || 0.1),
      );
    });

    // ── Pinch-to-zoom (touch) ──────────────────────
    var _pinchStartDist = null;
    var _pinchStartZoom = null;

    jQuery("#" + cid).on("touchstart.tl-zoom-" + cid, function (e) {
      if (e.originalEvent.touches.length === 2) {
        _TL.use(cid);
        var t1 = e.originalEvent.touches[0];
        var t2 = e.originalEvent.touches[1];
        _pinchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        _pinchStartZoom = _c().zoom;
      }
    });

    jQuery("#" + cid).on("touchmove.tl-zoom-" + cid, function (e) {
      if (e.originalEvent.touches.length === 2 && _pinchStartDist) {
        e.preventDefault();
        _TL.use(cid);
        var t1 = e.originalEvent.touches[0];
        var t2 = e.originalEvent.touches[1];
        var dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        var scale = dist / _pinchStartDist;
        applyZoom(_pinchStartZoom * scale);
      }
    });

    jQuery("#" + cid).on("touchend.tl-zoom-" + cid + " touchcancel.tl-zoom-" + cid, function (e) {
      if (e.originalEvent.touches.length < 2) {
        _pinchStartDist = null;
        _pinchStartZoom = null;
      }
    });
  }

  function _fmt(l) {
    return Math.round(l * 100) + "%";
  }
  function getZoom() {
    return _c().zoom;
  }

  return {
    init: init,
    destroy: destroy,
    buildControls: buildControls,
    applyZoom: applyZoom,
    bindWheelZoom: bindWheelZoom,
    getZoom: getZoom,
  };
})();


/* src/modules/GridFullscreen.js */
var GridFullscreen = (function () {
  var _inst = {};

  function _c() { return _inst[_TL.cid()]; }

  function init() {
    _inst[_TL.cid()] = { isFullscreen: false };
  }

  function destroy() {
    var cid = _TL.cid();
    jQuery(document).off("keydown.tl-fullscreen-" + cid);
    delete _inst[cid];
  }

  function buildButton() {
    var cfg = GridCore.getConfig();
    var zCfg = cfg.zoom || {};
    if (!zCfg.fullscreen) return jQuery();

    var cid = _TL.cid();
    var $btn = jQuery("<button>")
      .addClass("tl-zoom-btn tl-zoom-btn-fullscreen")
      .attr("title", "Toggle fullscreen")
      .html('<i class="fa-solid fa-expand"></i>')
      .on("click", function () { _TL.use(cid); toggle(); });

    return $btn;
  }

  function toggle() {
    if (_c().isFullscreen) {
      exit();
    } else {
      enter();
    }
  }

  function enter() {
    var $root = jQuery("#" + _TL.cid());
    if (!$root.length) return;

    $root.addClass("tl-fullscreen");
    _c().isFullscreen = true;

    $root.find(".tl-zoom-btn-fullscreen i")
      .removeClass("fa-expand")
      .addClass("fa-compress");

    GridZoom.applyZoom(GridZoom.getZoom(), true);
    GridEvents.emit("fullscreen:changed", true);
  }

  function exit() {
    var $root = jQuery("#" + _TL.cid());
    if (!$root.length) return;

    $root.removeClass("tl-fullscreen");
    _c().isFullscreen = false;

    $root.find(".tl-zoom-btn-fullscreen i")
      .removeClass("fa-compress")
      .addClass("fa-expand");

    GridZoom.applyZoom(GridZoom.getZoom(), true);
    GridEvents.emit("fullscreen:changed", false);
  }

  function bind() {
    var cid = _TL.cid();
    jQuery(document).on("keydown.tl-fullscreen-" + cid, function (e) {
      if (e.key === "Escape" && _inst[cid] && _inst[cid].isFullscreen) {
        _TL.use(cid);
        exit();
      }
    });
  }

  function isFullscreen() {
    return _c().isFullscreen;
  }

  return {
    init: init,
    destroy: destroy,
    buildButton: buildButton,
    bind: bind,
    toggle: toggle,
    enter: enter,
    exit: exit,
    isFullscreen: isFullscreen,
  };
})();


/* src/modules/GridDrag.js */
var GridDrag = (function () {
  var _inst = {};

  function _c() { return _inst[_TL.cid()]; }

  function init() {
    _inst[_TL.cid()] = {
      dragId: null,
      $ghost: null,
      touchDragId: null,
      touchStartPos: null,
      touchMoved: false,
      touchTimer: null,
      touchReady: false,
      dragTouchMoveHandler: null
    };
  }

  function destroy() {
    var cid = _TL.cid();
    var ctx = _inst[cid];
    if (ctx) {
      clearTimeout(ctx.touchTimer);
      if (ctx.dragTouchMoveHandler) {
        document.removeEventListener("touchmove", ctx.dragTouchMoveHandler);
      }
    }
    jQuery(document).off(".tl-drag-" + cid);
    delete _inst[cid];
  }

  function bind() {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();
    var gridSel = "#" + cfg.containerId + " .tl-layout-grid";
    var canvasSel = "#" + cfg.containerId + " .tl-canvas";
    var trashSel = "#" + cfg.containerId + " .tl-trash-zone";

    jQuery(document).on(
      "dragstart.tl-drag-" + cid,
      gridSel + " .tl-table-card",
      function (e) {
        _TL.use(cid);
        var ctx = _c();
        var cfg = GridCore.getConfig();
        if (cfg.realTime === false && !GridCore.isEditing()) return;
        if (GridToolbar.getActive()) return;
        if (GridMultiSelect.isActive()) return;
        ctx.dragId = jQuery(this).data("table-id");
        e.originalEvent.dataTransfer.effectAllowed = "move";
        e.originalEvent.dataTransfer.setData("text/plain", String(ctx.dragId));

        var empty = new Image();
        empty.src =
          "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";
        e.originalEvent.dataTransfer.setDragImage(empty, 0, 0);

        jQuery(this).css("opacity", "0.25");
        if (cfg.trashZone) jQuery(trashSel).addClass("tl-trash-zone--visible");
      },
    );

    jQuery(document).on("dragend.tl-drag-" + cid, function () {
      _TL.use(cid);
      var ctx = _c();
      if (ctx.dragId) {
        _TL.$('[data-table-id="' + ctx.dragId + '"]').css("opacity", "");
        ctx.dragId = null;
      }
      _removeGhost();
      var cfg = GridCore.getConfig();
      if (cfg.trashZone) jQuery(trashSel).removeClass("tl-trash-zone--visible tl-trash-zone--active");
    });

    // ── Touch: table drag (long-press to initiate) ─
    jQuery(document).on("touchstart.tl-drag-" + cid, gridSel + " .tl-table-card", function (e) {
      _TL.use(cid);
      var ctx = _c();
      var cfg = GridCore.getConfig();
      if (cfg.editMode !== false && !GridCore.isEditing()) return;
      if (GridToolbar.getActive()) return;
      if (GridMultiSelect.isActive()) return;
      if (e.originalEvent.touches.length !== 1) return;
      var touch = e.originalEvent.touches[0];
      ctx.touchDragId = jQuery(this).data("table-id");
      ctx.touchStartPos = { x: touch.clientX, y: touch.clientY };
      ctx.touchMoved = false;
      ctx.touchReady = false;

      clearTimeout(ctx.touchTimer);
      ctx.touchTimer = setTimeout(function () {
        _TL.use(cid);
        var ctx2 = _c();
        if (!ctx2.touchDragId) return;
        ctx2.touchReady = true;
        _TL.$('[data-table-id="' + ctx2.touchDragId + '"]').css("opacity", "0.25");
        var cfg2 = GridCore.getConfig();
        if (cfg2.trashZone) jQuery(trashSel).addClass("tl-trash-zone--visible");
      }, 300);

      ctx.dragTouchMoveHandler = function (te) {
        _TL.use(cid);
        var ctx2 = _c();
        if (!ctx2.touchDragId) return;
        if (te.touches.length !== 1) return;
        var tc = te.touches[0];

        if (!ctx2.touchReady) {
          var dx = tc.clientX - ctx2.touchStartPos.x;
          var dy = tc.clientY - ctx2.touchStartPos.y;
          if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
            clearTimeout(ctx2.touchTimer);
            ctx2.touchDragId = null;
            document.removeEventListener("touchmove", ctx2.dragTouchMoveHandler);
            ctx2.dragTouchMoveHandler = null;
          }
          return;
        }

        te.preventDefault();
        ctx2.touchMoved = true;
        var t = GridCore.tableById(ctx2.touchDragId);
        if (!t) return;
        var pos = GridCore.cursorToGrid(tc.clientX, tc.clientY);
        var bad = GridCore.hasCollision(pos.col, pos.row, t.colSpan, t.rowSpan, t.id);
        _showGhost(pos.col, pos.row, t.colSpan, t.rowSpan, bad);

        var cfg2 = GridCore.getConfig();
        if (cfg2.trashZone) {
          var trashEl = jQuery(trashSel)[0];
          if (trashEl) {
            var trashRect = trashEl.getBoundingClientRect();
            var overTrash = tc.clientX >= trashRect.left && tc.clientX <= trashRect.right &&
                            tc.clientY >= trashRect.top && tc.clientY <= trashRect.bottom;
            jQuery(trashSel).toggleClass("tl-trash-zone--active", overTrash);
          }
        }
      };
      document.addEventListener("touchmove", ctx.dragTouchMoveHandler, { passive: false });
    });

    jQuery(document).on("touchend.tl-drag-" + cid, function (e) {
      _TL.use(cid);
      var ctx = _c();
      clearTimeout(ctx.touchTimer);
      if (ctx.dragTouchMoveHandler) {
        document.removeEventListener("touchmove", ctx.dragTouchMoveHandler);
        ctx.dragTouchMoveHandler = null;
      }
      if (!ctx.touchDragId) return;
      var id = ctx.touchDragId;
      ctx.touchDragId = null;

      _TL.$('[data-table-id="' + id + '"]').css("opacity", "");
      _removeGhost();
      var cfg = GridCore.getConfig();
      if (cfg.trashZone) jQuery(trashSel).removeClass("tl-trash-zone--visible tl-trash-zone--active");

      if (!ctx.touchMoved) return;

      var touch = e.originalEvent.changedTouches[0];
      var t = GridCore.tableById(id);
      if (!t) return;

      // Check if dropped on trash zone
      if (cfg.trashZone) {
        var trashEl = jQuery(trashSel)[0];
        if (trashEl) {
          var trashRect = trashEl.getBoundingClientRect();
          var overTrash = touch.clientX >= trashRect.left && touch.clientX <= trashRect.right &&
                          touch.clientY >= trashRect.top && touch.clientY <= trashRect.bottom;
          if (overTrash) {
            _TL.$('[data-table-id="' + id + '"]').remove();
            GridCore.removeTable(id);
            if (typeof cfg.onLayoutChange === "function" && !(cfg.editMode !== false && GridCore.isEditing()))
              cfg.onLayoutChange(GridCore.getLayout());
            return;
          }
        }
      }

      var pos = GridCore.cursorToGrid(touch.clientX, touch.clientY);
      if (GridCore.hasCollision(pos.col, pos.row, t.colSpan, t.rowSpan, t.id)) return;

      var from = { col: t.col, row: t.row };
      GridCore.moveTable(t.id, pos.col, pos.row);
      _TL.$('[data-table-id="' + t.id + '"]').replaceWith(GridRender.buildTableCard(t));

      if (cfg.swapAnimation) {
        _TL.$('[data-table-id="' + t.id + '"]').addClass("tl-swap-animate");
        setTimeout(function () {
          _TL.use(cid);
          _TL.$('[data-table-id="' + t.id + '"]').removeClass("tl-swap-animate");
        }, 280);
      }

      GridEvents.emit("table:moved", { from: from, to: { col: pos.col, row: pos.row } });
      if (typeof cfg.onSwap === "function")
        cfg.onSwap(from, { col: pos.col, row: pos.row }, GridCore.getLayout());
      if (typeof cfg.onLayoutChange === "function" && !(cfg.editMode !== false && GridCore.isEditing()))
        cfg.onLayoutChange(GridCore.getLayout());
    });

    if (!cfg.trashZone) return;

    jQuery(document).on("dragover.tl-drag-" + cid, trashSel, function (e) {
      e.preventDefault();
      _TL.use(cid);
      if (!_c().dragId) return;
      jQuery(this).addClass("tl-trash-zone--active");
      e.originalEvent.dataTransfer.dropEffect = "move";
    });

    jQuery(document).on("dragleave.tl-drag-" + cid, trashSel, function () {
      jQuery(this).removeClass("tl-trash-zone--active");
    });

    jQuery(document).on("drop.tl-drag-" + cid, trashSel, function (e) {
      e.preventDefault();
      _TL.use(cid);
      var ctx = _c();
      jQuery(this).removeClass("tl-trash-zone--visible tl-trash-zone--active");
      if (!ctx.dragId) return;
      var id = ctx.dragId;
      ctx.dragId = null;
      _removeGhost();
      _TL.$('[data-table-id="' + id + '"]').remove();
      GridCore.removeTable(id);
      var cfg = GridCore.getConfig();
      if (typeof cfg.onLayoutChange === "function" && !(cfg.realTime === false && GridCore.isEditing())) cfg.onLayoutChange(GridCore.getLayout());
    });

    jQuery(document).on("dragover.tl-drag-" + cid, gridSel, function (e) {
      e.preventDefault();
      _TL.use(cid);
      var ctx = _c();
      if (!ctx.dragId) return;
      var t = GridCore.tableById(ctx.dragId);
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

    jQuery(document).on("dragleave.tl-drag-" + cid, canvasSel, function (e) {
      if (!jQuery(e.originalEvent.relatedTarget).closest(".tl-canvas").length) {
        _TL.use(cid);
        _removeGhost();
      }
    });

    jQuery(document).on("drop.tl-drag-" + cid, gridSel, function (e) {
      e.preventDefault();
      _TL.use(cid);
      var ctx = _c();
      _removeGhost();
      var cfg = GridCore.getConfig();
      if (cfg.trashZone) jQuery(trashSel).removeClass("tl-trash-zone--visible tl-trash-zone--active");
      if (!ctx.dragId) return;

      var t = GridCore.tableById(ctx.dragId);
      if (!t) return;

      var pos = GridCore.cursorToGrid(
        e.originalEvent.clientX,
        e.originalEvent.clientY,
      );
      if (GridCore.hasCollision(pos.col, pos.row, t.colSpan, t.rowSpan, t.id)) {
        ctx.dragId = null;
        return;
      }

      var from = { col: t.col, row: t.row };
      GridCore.moveTable(t.id, pos.col, pos.row);

      _TL.$('[data-table-id="' + t.id + '"]').replaceWith(
        GridRender.buildTableCard(t),
      );

      if (cfg.swapAnimation) {
        _TL.$('[data-table-id="' + t.id + '"]').addClass("tl-swap-animate");
        setTimeout(function () {
          _TL.use(cid);
          _TL.$('[data-table-id="' + t.id + '"]').removeClass("tl-swap-animate");
        }, 280);
      }

      GridEvents.emit("table:moved", {
        from: from,
        to: { col: pos.col, row: pos.row },
      });

      if (typeof cfg.onSwap === "function")
        cfg.onSwap(from, { col: pos.col, row: pos.row }, GridCore.getLayout());
      if (typeof cfg.onLayoutChange === "function" && !(cfg.realTime === false && GridCore.isEditing()))
        cfg.onLayoutChange(GridCore.getLayout());

      ctx.dragId = null;
    });
  }

  function unbind() {
    var cid = _TL.cid();
    var ctx = _c();
    if (ctx) {
      clearTimeout(ctx.touchTimer);
      if (ctx.dragTouchMoveHandler) {
        document.removeEventListener("touchmove", ctx.dragTouchMoveHandler);
        ctx.dragTouchMoveHandler = null;
      }
    }
    jQuery(document).off(".tl-drag-" + cid);
  }

  function _showGhost(col, row, colSpan, rowSpan, invalid) {
    _removeGhost();
    var ctx = _c();
    ctx.$ghost = GridRender.buildDragGhost(col, row, colSpan, rowSpan, invalid);
    _TL.$(".tl-layout-grid").append(ctx.$ghost);
  }

  function _removeGhost() {
    var ctx = _c();
    if (ctx && ctx.$ghost) {
      ctx.$ghost.remove();
      ctx.$ghost = null;
    }
  }

  return { init: init, destroy: destroy, bind: bind, unbind: unbind };
})();


/* src/modules/GridResize.js */
/**
 * GridResize.js
 * Resize handles for placed table cards.
 * Supports mouse and touch dragging on east, south, and south-east handles.
 * Per-instance state via _TL context.
 */
var GridResize = (function () {
  var _inst = {};

  function _c() { return _inst[_TL.cid()]; }

  function init() {
    _inst[_TL.cid()] = {
      resizing: false,
      tableId: null,
      dir: null,
      origTable: null,
      $ghost: null,
      touchMoveHandler: null
    };
  }

  function destroy() {
    var cid = _TL.cid();
    var ctx = _inst[cid];
    if (ctx && ctx.touchMoveHandler) {
      document.removeEventListener("touchmove", ctx.touchMoveHandler);
    }
    jQuery(document).off(".tl-resize-" + cid);
    delete _inst[cid];
  }

  function bind() {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();
    var gridSel = "#" + cfg.containerId + " .tl-layout-grid";

    // ── Mouse ──────────────────────────────────────
    jQuery(document).on("mousedown.tl-resize-" + cid, gridSel + " .tl-resize-handle", function (e) {
      _TL.use(cid);
      var cfg = GridCore.getConfig();
      if (cfg.realTime === false && !GridCore.isEditing()) return;
      e.preventDefault();
      e.stopPropagation();
      _startResize(jQuery(this), e.clientX, e.clientY);
      jQuery(document).on("mousemove.tl-resize-" + cid, function (ev) {
        _TL.use(cid);
        _onMouseMove(ev);
      });
      jQuery(document).on("mouseup.tl-resize-" + cid, function () {
        _TL.use(cid);
        _onMouseUp();
      });
    });

    // ── Touch ──────────────────────────────────────
    jQuery(document).on("touchstart.tl-resize-" + cid, gridSel + " .tl-resize-handle", function (e) {
      _TL.use(cid);
      var cfg = GridCore.getConfig();
      if (cfg.realTime === false && !GridCore.isEditing()) return;
      if (e.originalEvent.touches.length !== 1) return;
      e.preventDefault();
      e.stopPropagation();
      var touch = e.originalEvent.touches[0];
      _startResize(jQuery(this), touch.clientX, touch.clientY);

      var ctx = _c();
      ctx.touchMoveHandler = function (te) {
        _TL.use(cid);
        if (te.touches.length !== 1) return;
        te.preventDefault();
        _onMove(te.touches[0].clientX, te.touches[0].clientY);
      };
      document.addEventListener("touchmove", ctx.touchMoveHandler, { passive: false });
      jQuery(document).on("touchend.tl-resize-" + cid, function () {
        _TL.use(cid);
        _onTouchEnd();
      });
    });
  }

  function _startResize($handle, clientX, clientY) {
    var ctx = _c();
    ctx.dir = $handle.attr("data-resize-dir");
    var $card = $handle.closest(".tl-table-card");
    ctx.tableId = $card.data("table-id");
    var t = GridCore.tableById(ctx.tableId);
    if (!t) return;
    ctx.origTable = { col: t.col, row: t.row, colSpan: t.colSpan, rowSpan: t.rowSpan };
    ctx.resizing = true;
    $card.addClass("tl-resizing");
  }

  function _onMouseMove(e) {
    if (!_c().resizing) return;
    _onMove(e.clientX, e.clientY);
  }

  function _onMove(clientX, clientY) {
    var ctx = _c();
    if (!ctx.resizing || !ctx.tableId) return;
    var cfg = GridCore.getConfig();
    var t = GridCore.tableById(ctx.tableId);
    if (!t) return;

    var pos = GridCore.cursorToGrid(clientX, clientY);
    var newColSpan = ctx.origTable.colSpan;
    var newRowSpan = ctx.origTable.rowSpan;
    var shapeDef = (cfg.shapes || {})[t.shape] || {};
    var minC = shapeDef.minCols || 1;
    var minR = shapeDef.minRows || 1;

    if (ctx.dir === "e" || ctx.dir === "se") {
      newColSpan = Math.max(minC, pos.col - ctx.origTable.col + 1);
    }
    if (ctx.dir === "s" || ctx.dir === "se") {
      newRowSpan = Math.max(minR, pos.row - ctx.origTable.row + 1);
    }

    if (shapeDef.preferSquare) {
      var side = Math.max(newColSpan, newRowSpan);
      newColSpan = side;
      newRowSpan = side;
    }

    var bad = GridCore.hasCollision(ctx.origTable.col, ctx.origTable.row, newColSpan, newRowSpan, ctx.tableId);
    _showGhost(ctx.origTable.col, ctx.origTable.row, newColSpan, newRowSpan, bad);
  }

  function _onMouseUp() {
    var cid = _TL.cid();
    jQuery(document).off("mousemove.tl-resize-" + cid + " mouseup.tl-resize-" + cid);
    _endResize();
  }

  function _onTouchEnd() {
    var cid = _TL.cid();
    var ctx = _c();
    if (ctx.touchMoveHandler) {
      document.removeEventListener("touchmove", ctx.touchMoveHandler);
      ctx.touchMoveHandler = null;
    }
    jQuery(document).off("touchend.tl-resize-" + cid);
    _endResize();
  }

  function _endResize() {
    var ctx = _c();
    if (!ctx.resizing || !ctx.tableId) { ctx.resizing = false; return; }
    var cfg = GridCore.getConfig();

    // Read ghost span values
    var newColSpan = ctx.origTable.colSpan;
    var newRowSpan = ctx.origTable.rowSpan;
    if (ctx.$ghost) {
      var gs = ctx.$ghost.css("grid-column");
      var gr = ctx.$ghost.css("grid-row");
      var cm = gs && gs.match(/span\s+(\d+)/);
      var rm = gr && gr.match(/span\s+(\d+)/);
      if (cm) newColSpan = parseInt(cm[1], 10);
      if (rm) newRowSpan = parseInt(rm[1], 10);
    }

    _removeGhost();
    _TL.$(".tl-resizing").removeClass("tl-resizing");

    if (!GridCore.hasCollision(ctx.origTable.col, ctx.origTable.row, newColSpan, newRowSpan, ctx.tableId)) {
      GridCore.updateTable(ctx.tableId, { colSpan: newColSpan, rowSpan: newRowSpan });
      var t = GridCore.tableById(ctx.tableId);
      _TL.$('[data-table-id="' + ctx.tableId + '"]').replaceWith(GridRender.buildTableCard(t));

      if (typeof cfg.onLayoutChange === "function" && !(cfg.realTime === false && GridCore.isEditing()))
        cfg.onLayoutChange(GridCore.getLayout());
    }

    ctx.resizing = false;
    ctx.tableId = null;
    ctx.dir = null;
    ctx.origTable = null;
  }

  function _showGhost(col, row, colSpan, rowSpan, invalid) {
    _removeGhost();
    var ctx = _c();
    ctx.$ghost = GridRender.buildPlaceGhost(col, row, colSpan, rowSpan, invalid);
    _TL.$(".tl-layout-grid").append(ctx.$ghost);
  }

  function _removeGhost() {
    var ctx = _c();
    if (ctx && ctx.$ghost) { ctx.$ghost.remove(); ctx.$ghost = null; }
  }

  function unbind() {
    var cid = _TL.cid();
    var ctx = _c();
    if (ctx) {
      if (ctx.touchMoveHandler) {
        document.removeEventListener("touchmove", ctx.touchMoveHandler);
        ctx.touchMoveHandler = null;
      }
      ctx.resizing = false;
      ctx.tableId = null;
    }
    jQuery(document).off(".tl-resize-" + cid);
  }

  return { init: init, destroy: destroy, bind: bind, unbind: unbind };
})();


/* src/modules/GridMultiSelect.js */
/**
 * GridMultiSelect.js
 * Multi-select tool: drag a marquee rectangle on the grid to select
 * tables, then drag the group or drop onto trash zone to delete.
 * Click on empty grid space to deselect all.
 * Per-instance state via _TL context.
 */
var GridMultiSelect = (function () {
  var _inst = {};

  function _c() { return _inst[_TL.cid()]; }

  function init() {
    _inst[_TL.cid()] = {
      active: false,
      selected: [],
      marquee: false,
      marqueeStart: null,
      $marquee: null,
      dragging: false,
      dragAnchor: null,
      offsets: [],
      $ghosts: []
    };
  }

  function destroy() {
    var cid = _TL.cid();
    jQuery(document).off(".tl-msel-" + cid);
    delete _inst[cid];
  }

  // ── Public: activate / deactivate ─────────────────

  function isActive() {
    var ctx = _c();
    return ctx ? ctx.active : false;
  }

  function activate() {
    var cfg = GridCore.getConfig();
    if (cfg.realTime === false && !GridCore.isEditing()) return;
    var ctx = _c();
    ctx.active = true;
    ctx.selected = [];
    GridToolbar.deactivate();
    _TL.$(".tl-canvas").addClass("tl-multiselect-mode");
    _TL.$(".tl-multiselect-tool-btn").addClass("active");
    // Disable native HTML5 drag so mousedown works for selection
    _TL.$(".tl-table-card").attr("draggable", "false");
  }

  function deactivate() {
    var ctx = _c();
    if (!ctx) return;
    ctx.active = false;
    _clearSelection();
    _removeMarquee();
    _TL.$(".tl-canvas").removeClass("tl-multiselect-mode");
    _TL.$(".tl-multiselect-tool-btn").removeClass("active");
    // Restore native drag
    var cfg = GridCore.getConfig();
    if (cfg.draggable && (cfg.realTime !== false || GridCore.isEditing())) {
      _TL.$(".tl-table-card").attr("draggable", "true");
    }
  }

  function _clearSelection() {
    var ctx = _c();
    ctx.selected = [];
    _TL.$(".tl-table-card").removeClass("tl-selected");
  }

  function _removeMarquee() {
    var ctx = _c();
    if (ctx.$marquee) { ctx.$marquee.remove(); ctx.$marquee = null; }
    ctx.marquee = false;
    ctx.marqueeStart = null;
  }

  // ── Bind events ───────────────────────────────────

  function bind() {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();
    var gridSel = "#" + cfg.containerId + " .tl-layout-grid";
    var trashSel = "#" + cfg.containerId + " .tl-trash-zone";

    // ── Mousedown on a SELECTED table card → start group drag ──
    jQuery(document).on("mousedown.tl-msel-" + cid, gridSel + " .tl-table-card", function (e) {
      _TL.use(cid);
      var ctx = _c();
      if (!ctx.active) return;
      if (ctx.dragging || ctx.marquee) return;
      if (jQuery(e.target).closest(".tl-table-edit-btn, .tl-resize-handle").length) return;

      var id = jQuery(this).data("table-id");
      var isSelected = ctx.selected.indexOf(id) !== -1;

      if (isSelected && ctx.selected.length > 0) {
        // Start group drag
        e.preventDefault();
        e.stopPropagation();

        var pos = GridCore.cursorToGrid(e.clientX, e.clientY);
        ctx.dragAnchor = { col: pos.col, row: pos.row };

        ctx.offsets = [];
        ctx.selected.forEach(function (sid) {
          var t = GridCore.tableById(sid);
          if (t) {
            ctx.offsets.push({ id: sid, dCol: t.col - pos.col, dRow: t.row - pos.row, colSpan: t.colSpan, rowSpan: t.rowSpan });
          }
        });

        ctx.dragging = true;
        ctx.selected.forEach(function (sid) {
          _TL.$('[data-table-id="' + sid + '"]').css("opacity", "0.25");
        });
        var cfg2 = GridCore.getConfig();
        if (cfg2.trashZone) jQuery(trashSel).addClass("tl-trash-zone--visible");

        jQuery(document).on("mousemove.tl-msel-drag-" + cid, function (ev) {
          _TL.use(cid);
          _onDragMove(ev);
        });
        jQuery(document).on("mouseup.tl-msel-drag-" + cid, function (ev) {
          _TL.use(cid);
          _onDragEnd(ev);
        });
        return;
      }
      // Not selected — let the event fall through to the grid handler for marquee
    });

    // ── Mousedown on grid (empty space or unselected card) → marquee or deselect ──
    jQuery(document).on("mousedown.tl-msel-grid-" + cid, gridSel, function (e) {
      _TL.use(cid);
      var ctx = _c();
      if (!ctx.active) return;
      if (ctx.dragging) return;
      if (jQuery(e.target).closest(".tl-table-edit-btn, .tl-resize-handle").length) return;

      // If click landed on a selected card the handler above handles it
      var $card = jQuery(e.target).closest(".tl-table-card");
      if ($card.length && ctx.selected.indexOf($card.data("table-id")) !== -1) return;

      e.preventDefault();

      // Clear previous selection and any stale marquee
      _clearSelection();
      _removeMarquee();

      // Start marquee
      ctx.marquee = true;
      ctx.marqueeStart = { x: e.clientX, y: e.clientY };

      // Create the visual marquee element inside the grid (hidden until drag)
      var gridEl = jQuery(gridSel)[0];
      var gridRect = gridEl.getBoundingClientRect();
      ctx.$marquee = jQuery("<div class='tl-marquee-rect'></div>");
      ctx.$marquee.css({
        left: (e.clientX - gridRect.left) + "px",
        top: (e.clientY - gridRect.top) + "px",
        width: "0px",
        height: "0px",
        display: "none"
      });
      jQuery(gridSel).append(ctx.$marquee);

      jQuery(document).on("mousemove.tl-msel-marquee-" + cid, function (ev) {
        _TL.use(cid);
        var ctx2 = _c();
        if (!ctx2.marquee || !ctx2.$marquee) return;
        var x1 = Math.min(ctx2.marqueeStart.x, ev.clientX);
        var y1 = Math.min(ctx2.marqueeStart.y, ev.clientY);
        var x2 = Math.max(ctx2.marqueeStart.x, ev.clientX);
        var y2 = Math.max(ctx2.marqueeStart.y, ev.clientY);
        // Show marquee only once drag exceeds a small threshold
        if (x2 - x1 > 3 || y2 - y1 > 3) {
          ctx2.$marquee.css("display", "");
        }
        var gr = gridEl.getBoundingClientRect();
        ctx2.$marquee.css({
          left: (x1 - gr.left) + "px",
          top: (y1 - gr.top) + "px",
          width: (x2 - x1) + "px",
          height: (y2 - y1) + "px"
        });
      });

      jQuery(document).on("mouseup.tl-msel-marquee-" + cid, function (ev) {
        _TL.use(cid);
        jQuery(document).off("mousemove.tl-msel-marquee-" + cid + " mouseup.tl-msel-marquee-" + cid);
        var ctx2 = _c();
        if (!ctx2.marquee) return;

        var x1 = Math.min(ctx2.marqueeStart.x, ev.clientX);
        var y1 = Math.min(ctx2.marqueeStart.y, ev.clientY);
        var x2 = Math.max(ctx2.marqueeStart.x, ev.clientX);
        var y2 = Math.max(ctx2.marqueeStart.y, ev.clientY);

        _removeMarquee();

        // If marquee is tiny (just a click), treat as deselect
        if (Math.abs(x2 - x1) < 5 && Math.abs(y2 - y1) < 5) {
          _clearSelection();
          return;
        }

        // Find all tables whose card DOM rectangles intersect the marquee
        ctx2.selected = [];
        var tables = GridCore.getTables();
        tables.forEach(function (t) {
          var $el = _TL.$('[data-table-id="' + t.id + '"]');
          if (!$el.length) return;
          var r = $el[0].getBoundingClientRect();
          // Check overlap
          if (r.right > x1 && r.left < x2 && r.bottom > y1 && r.top < y2) {
            ctx2.selected.push(t.id);
            $el.addClass("tl-selected");
          }
        });
      });
    });
  }

  // ── Group drag move ───────────────────────────────

  function _onDragMove(e) {
    var ctx = _c();
    if (!ctx.dragging) return;
    var pos = GridCore.cursorToGrid(e.clientX, e.clientY);
    _removeGhosts();

    var allIds = ctx.selected.slice();

    ctx.offsets.forEach(function (o) {
      var c = pos.col + o.dCol;
      var r = pos.row + o.dRow;
      var bad = GridCore.hasCollision(c, r, o.colSpan, o.rowSpan, allIds);
      var $g = GridRender.buildDragGhost(c, r, o.colSpan, o.rowSpan, bad);
      _TL.$(".tl-layout-grid").append($g);
      ctx.$ghosts.push($g);
    });

    // Trash hover
    var cfg = GridCore.getConfig();
    if (cfg.trashZone) {
      var trSel = "#" + cfg.containerId + " .tl-trash-zone";
      var trashEl = jQuery(trSel)[0];
      if (trashEl) {
        var rect = trashEl.getBoundingClientRect();
        var over = e.clientX >= rect.left && e.clientX <= rect.right &&
                   e.clientY >= rect.top && e.clientY <= rect.bottom;
        jQuery(trSel).toggleClass("tl-trash-zone--active", over);
      }
    }
  }

  // ── Group drag end ────────────────────────────────

  function _onDragEnd(e) {
    var cid = _TL.cid();
    jQuery(document).off("mousemove.tl-msel-drag-" + cid + " mouseup.tl-msel-drag-" + cid);
    var ctx = _c();
    if (!ctx.dragging) return;
    ctx.dragging = false;

    var cfg = GridCore.getConfig();
    var trashSel = "#" + cfg.containerId + " .tl-trash-zone";

    _removeGhosts();

    // Restore opacity
    ctx.selected.forEach(function (sid) {
      _TL.$('[data-table-id="' + sid + '"]').css("opacity", "");
    });

    if (cfg.trashZone) jQuery(trashSel).removeClass("tl-trash-zone--visible tl-trash-zone--active");

    var pos = GridCore.cursorToGrid(e.clientX, e.clientY);

    // ── Check trash zone drop ──
    if (cfg.trashZone) {
      var trashEl = jQuery(trashSel)[0];
      if (trashEl) {
        var rect = trashEl.getBoundingClientRect();
        var over = e.clientX >= rect.left && e.clientX <= rect.right &&
                   e.clientY >= rect.top && e.clientY <= rect.bottom;
        if (over) {
          ctx.selected.forEach(function (sid) {
            _TL.$('[data-table-id="' + sid + '"]').remove();
            GridCore.removeTable(sid);
          });
          ctx.selected = [];
          _TL.$(".tl-table-card").removeClass("tl-selected");
          if (typeof cfg.onLayoutChange === "function" && !(cfg.realTime === false && GridCore.isEditing()))
            cfg.onLayoutChange(GridCore.getLayout());
          return;
        }
      }
    }

    // ── Validate all new positions ──
    var allIds = ctx.selected.slice();
    var moves = [];
    var anyBad = false;

    ctx.offsets.forEach(function (o) {
      var c = pos.col + o.dCol;
      var r = pos.row + o.dRow;
      if (GridCore.hasCollision(c, r, o.colSpan, o.rowSpan, allIds)) {
        anyBad = true;
      }
      moves.push({ id: o.id, col: c, row: r });
    });

    if (anyBad) return;

    // ── Apply moves ──
    moves.forEach(function (m) {
      GridCore.moveTable(m.id, m.col, m.row);
      var t = GridCore.tableById(m.id);
      var $new = GridRender.buildTableCard(t);
      $new.addClass("tl-selected");
      $new.attr("draggable", "false");
      _TL.$('[data-table-id="' + m.id + '"]').replaceWith($new);
    });

    if (typeof cfg.onLayoutChange === "function" && !(cfg.realTime === false && GridCore.isEditing()))
      cfg.onLayoutChange(GridCore.getLayout());
  }

  function _removeGhosts() {
    var ctx = _c();
    ctx.$ghosts.forEach(function ($g) { $g.remove(); });
    ctx.$ghosts = [];
  }

  function unbind() {
    var cid = _TL.cid();
    jQuery(document).off(".tl-msel-" + cid).off(".tl-msel-drag-" + cid).off(".tl-msel-grid-" + cid).off(".tl-msel-marquee-" + cid);
    var ctx = _c();
    if (ctx) {
      ctx.active = false;
      ctx.selected = [];
      ctx.dragging = false;
      ctx.marquee = false;
      ctx.$ghosts = [];
      _removeMarquee();
    }
  }

  return {
    init: init,
    destroy: destroy,
    bind: bind,
    unbind: unbind,
    isActive: isActive,
    activate: activate,
    deactivate: deactivate,
  };
})();


/* src/modules/GridHelp.js */
/**
 * GridHelp.js
 * Help modal with a complete tutorial on all table-layout features.
 */
var GridHelp = (function () {

  function show() {
    // Remove any existing help modal
    jQuery("#" + _TL.cid()).find(".tl-help-overlay").remove();

    var $overlay = jQuery("<div>").addClass("tl-overlay tl-help-overlay");
    var $modal = jQuery("<div>").addClass("tl-modal tl-help-modal");

    // ── Header ──
    var $header = jQuery("<div>").addClass("tl-help-header");
    $header.append(
      jQuery("<div>").addClass("tl-help-title-row").append(
        jQuery("<i>").addClass("fa-solid fa-circle-question").css({ fontSize: "1.4rem", color: "var(--tl-primary)" }),
        jQuery("<h2>").text("How to Use Table Layout")
      ),
      jQuery("<button>").addClass("tl-help-close-btn").attr("title", "Close")
        .html('<i class="fa-solid fa-xmark"></i>')
        .on("click", function () { $overlay.remove(); })
    );
    $modal.append($header);

    // ── Scrollable content ──
    var $body = jQuery("<div>").addClass("tl-help-body");

    var sections = _buildSections();
    sections.forEach(function (sec, idx) {
      var $sec = jQuery("<div>").addClass("tl-help-section");

      // Section number + title
      var $titleRow = jQuery("<div>").addClass("tl-help-section-title");
      $titleRow.append(
        jQuery("<span>").addClass("tl-help-section-num").text(idx + 1),
        jQuery("<span>").text(sec.title)
      );
      if (sec.icon) {
        $titleRow.prepend(jQuery("<i>").addClass(sec.icon).css({ marginRight: "8px", color: "var(--tl-primary)" }));
      }
      $sec.append($titleRow);

      // Description text
      if (sec.description) {
        $sec.append(jQuery("<p>").addClass("tl-help-section-desc").html(sec.description));
      }

      // Steps / tips list
      if (sec.steps && sec.steps.length) {
        var $list = jQuery("<ul>").addClass("tl-help-steps");
        sec.steps.forEach(function (step) {
          $list.append(jQuery("<li>").html(step));
        });
        $sec.append($list);
      }

      // GIF placeholder
      // GIF image or placeholder
      if (sec.gifSrc) {
        var $gifBox = jQuery("<div>").addClass("tl-help-gif-box");
        $gifBox.append(
          jQuery("<img>").addClass("tl-help-gif-img").attr("src", sec.gifSrc).attr("alt", sec.title + " demo")
        );
        $sec.append($gifBox);
      } else if (sec.gifHint) {
        var $gifBox = jQuery("<div>").addClass("tl-help-gif-placeholder");
        $gifBox.append(
          jQuery("<div>").addClass("tl-help-gif-icon").html('<i class="fa-solid fa-film"></i>'),
          jQuery("<div>").addClass("tl-help-gif-text").html(
            '<strong>Demo GIF:</strong> ' + sec.gifHint
          )
        );
        $sec.append($gifBox);
      }

      $body.append($sec);
    });

    $modal.append($body);

    // ── Footer ──
    var $footer = jQuery("<div>").addClass("tl-help-footer");
    $footer.append(
      jQuery("<button>").addClass("tl-btn tl-btn-primary").text("Got it!")
        .on("click", function () { $overlay.remove(); })
    );
    $modal.append($footer);

    $overlay.append($modal);
    jQuery("#" + _TL.cid()).append($overlay);

    // Close on overlay click
    $overlay.on("click", function (e) {
      if (jQuery(e.target).is($overlay)) $overlay.remove();
    });
  }

  // ── Section data ──────────────────────────────────

  function _buildSections() {
    return [
      // 1 — Overview
      {
        title: "Getting Started",
        icon: "fa-solid fa-rocket",
        description:
          "Table Layout is a visual grid editor for designing restaurant floor plans. " +
          "You can create, position, resize, and manage tables across multiple floors and rooms.",
        steps: [
          "The <strong>toolbar</strong> at the top gives you access to all controls — floors, rooms, edit mode, and settings.",
          "The <strong>grid canvas</strong> is your working area where tables are placed and arranged.",
          "The <strong>shape panel</strong> on the right (visible in edit mode) lets you pick table shapes and tools.",
          "Use the <strong>zoom controls</strong> at the bottom to zoom in, out, reset, or go fullscreen.",
        ],
        gifSrc: "/wwwroot/libs/table-layout/gifs/gettings_started.gif",
        gifHint:
          "Show the full interface overview — toolbar at top, grid canvas in center, shape panel on the right, and zoom controls at the bottom.",
      },

      // 2 — Edit Mode
      {
        title: "Edit Mode",
        icon: "fa-solid fa-pen-to-square",
        description:
          "Table Layout has two modes: <strong>View Mode</strong> (read-only presentation) and <strong>Edit Mode</strong> (full editing). " +
          "You must enter Edit Mode to make changes.",
        steps: [
          "Click the <strong>Settings gear</strong> <i class='fa-solid fa-gear'></i> in the toolbar, then select <strong>\"Edit Layout\"</strong> to enter edit mode.",
          "In edit mode, the <strong>Save</strong> <i class='fa-solid fa-check'></i> and <strong>Discard</strong> <i class='fa-solid fa-xmark'></i> buttons appear in the toolbar.",
          "Click <strong>Save</strong> to keep all your changes, or <strong>Discard</strong> to revert everything back to the last saved state.",
          "The shape panel and all editing tools are only available while in edit mode.",
        ],
        gifSrc: "/wwwroot/libs/table-layout/gifs/edit_mode.gif",
        gifHint:
          "Show clicking the settings gear, selecting 'Edit Layout', making a change, then clicking Save. Also show the Discard flow reverting changes.",
      },

      // 3 — Placing Tables
      {
        title: "Placing New Tables",
        icon: "fa-solid fa-plus",
        description:
          "Add tables to your floor plan by selecting a shape and dragging on the grid.",
        steps: [
          "In edit mode, the <strong>shape panel</strong> appears on the right side of the canvas.",
          "Click a shape tool: <strong>Square</strong>, <strong>Circle</strong>, <strong>Hexagon</strong>, <strong>Diamond</strong>, or <strong>Triangle</strong>.",
          "Click and drag on the grid to place the table — the drag area determines the table size.",
          "A ghost preview shows where the table will be placed. <span style='color:var(--tl-danger)'>Red</span> means the area is occupied.",
          "Each shape has a minimum size (e.g., Circle requires at least 2&times;2 cells).",
          "You can copy properties from existing tables using the dropdown in the create modal.",
        ],
        gifSrc: "/wwwroot/libs/table-layout/gifs/placing_new_tables.gif",
        gifHint:
          "Show selecting the square shape tool, then click-dragging on an empty grid area to place a new table. Show the ghost preview turning green for valid and red for occupied.",
      },

      // 4 — Moving Tables
      {
        title: "Moving Tables",
        icon: "fa-solid fa-arrows-up-down-left-right",
        description: "Drag any table to reposition it on the grid.",
        steps: [
          "Click and drag a table card to move it to a new position.",
          "A <strong>ghost preview</strong> follows your cursor showing where the table will land.",
          "If the target area is occupied or out of bounds, the ghost turns <span style='color:var(--tl-danger)'>red</span> — release to cancel.",
          "On touch devices, <strong>long-press</strong> (hold for 300ms) a table to start dragging.",
        ],
        gifSrc: "/wwwroot/libs/table-layout/gifs/moving_tables.gif",
        gifHint:
          "Show dragging a table from one grid position to another with the ghost preview visible. Show both a successful move and an invalid (red ghost) attempt.",
      },

      // 5 — Resizing Tables
      {
        title: "Resizing Tables",
        icon: "fa-solid fa-up-right-and-down-left-from-center",
        description: "Resize tables by dragging the handles on their edges.",
        steps: [
          "Hover over a placed table to see the <strong>resize handles</strong> on the right edge, bottom edge, and bottom-right corner.",
          "Drag a handle to resize — the <strong>right handle</strong> changes width, <strong>bottom handle</strong> changes height, <strong>corner handle</strong> changes both.",
          "Shape constraints are enforced: for example, circles and diamonds always stay square.",
          "A <strong>size badge</strong> appears while resizing showing the new dimensions (e.g., 3&times;2).",
          "The resize is blocked if it would overlap another table.",
        ],
        gifSrc: "/wwwroot/libs/table-layout/gifs/resizing_tables.gif",
        gifHint:
          "Show hovering over a table to reveal resize handles, then dragging the corner handle to make it bigger. Show the size badge updating in real time.",
      },

      // 6 — Editing Tables
      {
        title: "Editing a Table",
        icon: "fa-solid fa-pen",
        description:
          "Modify a table's shape or swap it with a different table.",
        steps: [
          "Click the <strong>pencil icon</strong> <i class='fa-solid fa-pen'></i> on any placed table to open the edit modal.",
          "Use the <strong>Shape</strong> selector to change the table's shape (Square, Circle, Hexagon, etc.).",
          "Use the <strong>Change Table</strong> dropdown to swap to a different table from your list.",
          "The dropdown is searchable — type to filter tables by name.",
          "A live preview shows the shape and status color before you confirm.",
          "Click <strong>Save</strong> to apply changes or <strong>Cancel</strong> to close without changes.",
        ],
        gifHint:
          "Show clicking the edit pencil on a table, changing the shape from square to circle, using the search dropdown to pick a different table, then saving.",
      },

      // 7 — Multi-Select
      {
        title: "Multi-Select Tool",
        icon: "fa-solid fa-object-group",
        description:
          "Select and manage multiple tables at once using the marquee selection tool.",
        steps: [
          "In edit mode, click the <strong>Multi-Select tool</strong> <i class='fa-solid fa-object-group'></i> at the top of the shape panel.",
          "Click and <strong>drag a rectangle</strong> (marquee) across the grid — all tables inside the rectangle will be selected.",
          "Selected tables are highlighted with a <strong>colored outline</strong>.",
          "Click on <strong>empty grid space</strong> to deselect all tables.",
          "Click and drag any <strong>selected table</strong> to move the entire group together.",
          "Drag the selected group onto the <strong>trash zone</strong> to delete all selected tables at once.",
        ],
        gifHint:
          "Show activating the multi-select tool, dragging a marquee rectangle over several tables to select them, then dragging the group to a new position. Also show dragging to the trash zone to bulk-delete.",
      },

      // 8 — Trash Zone
      {
        title: "Deleting Tables",
        icon: "fa-solid fa-trash-can",
        description: "Remove tables by dragging them to the trash zone.",
        steps: [
          "When you start dragging a table (or a multi-selected group), the <strong>trash zone</strong> appears at the bottom-left of the canvas.",
          "Drag the table over the trash zone — it will <strong>highlight red</strong> when active.",
          "Release the table over the trash zone to permanently delete it.",
          "This works for both <strong>single tables</strong> and <strong>multi-selected groups</strong>.",
        ],
        gifHint:
          "Show dragging a single table to the trash zone (showing the red highlight on hover) and releasing to delete it. Then show doing the same with a multi-selected group.",
      },

      // 9 — Shapes
      {
        title: "Table Shapes",
        icon: "fa-solid fa-shapes",
        description:
          "Five distinct shapes are available for your tables, each with unique visual styling.",
        steps: [
          "<i class='fa-regular fa-square'></i> <strong>Square</strong> — Standard rectangular table. Minimum 1&times;1. Most flexible sizing.",
          "<i class='fa-regular fa-circle'></i> <strong>Circle</strong> — Round table. Minimum 2&times;2. Always keeps a square aspect ratio.",
          "<i class='fa-solid fa-hexagon'></i> <strong>Hexagon</strong> — Six-sided table. Minimum 3&times;2. Great for unique layouts.",
          "<i class='fa-regular fa-gem'></i> <strong>Diamond</strong> — Diamond-shaped table. Minimum 2&times;2. Keeps square aspect ratio.",
          "<i class='fa-solid fa-triangle'></i> <strong>Triangle</strong> — Triangular table. Minimum 2&times;2. Keeps square aspect ratio.",
        ],
        gifHint:
          "Show all five shapes placed on the grid side by side — square, circle, hexagon, diamond, and triangle — in different sizes to demonstrate variety.",
      },

      // 10 — Floors / Layers
      {
        title: "Floors (Layers)",
        icon: "fa-solid fa-layer-group",
        description:
          "Organize your restaurant across multiple floors. Each floor has its own set of rooms and tables.",
        steps: [
          "Floor tabs appear at the <strong>top-left of the toolbar</strong>. Click a tab to switch floors.",
          "Click the <strong>+ button</strong> to add a new floor — enter a name and pick an icon.",
          "<strong>Double-click</strong> a floor tab label to rename it.",
          "<strong>Drag</strong> floor tabs to reorder them.",
          "Click the <strong>&times;</strong> on a tab to delete a floor (only available in edit mode, requires 2+ floors).",
          "Each floor maintains its own independent set of rooms and table layouts.",
        ],
        gifHint:
          "Show clicking between floor tabs to switch views, adding a new floor with the + button, double-clicking to rename a tab, and dragging tabs to reorder.",
      },

      // 11 — Rooms
      {
        title: "Rooms",
        icon: "fa-solid fa-door-open",
        description:
          "Each floor can have multiple rooms. Rooms help you organize different dining areas within a floor.",
        steps: [
          "Click the <strong>door icon</strong> <i class='fa-solid fa-door-open'></i> on the left side of the canvas to open the <strong>room switcher panel</strong>.",
          "Click a room in the list to switch to it (view mode only).",
          "Hover over a room to see a <strong>miniature preview</strong> of its table layout.",
          "Click the <strong>+ button</strong> at the bottom of the panel to add a new room.",
          "<strong>Drag rooms</strong> in the list to reorder them.",
          "In edit mode, click the <strong>room name</strong> in the toolbar to rename it. Click the <strong>room icon</strong> to change it.",
        ],
        gifHint:
          "Show opening the room panel, hovering to preview rooms, switching between rooms, adding a new room, and dragging to reorder.",
      },

      // 12 — Zoom
      {
        title: "Zoom Controls",
        icon: "fa-solid fa-magnifying-glass-plus",
        description:
          "Zoom in and out of the grid canvas for precision editing or a bird's-eye overview.",
        steps: [
          "Use the <strong>zoom slider</strong> at the bottom of the canvas to adjust zoom (40% to 200%).",
          "Hold <strong>Ctrl</strong> and scroll the <strong>mouse wheel</strong> to zoom in/out.",
          "On touch devices, use <strong>pinch-to-zoom</strong> with two fingers.",
          "Click the <strong>reset button</strong> <i class='fa-solid fa-arrows-rotate'></i> to return to 100% zoom.",
          "Click the <strong>fullscreen button</strong> <i class='fa-solid fa-expand'></i> to maximize the canvas. Press <strong>Esc</strong> or click the button again to exit.",
        ],
        gifHint:
          "Show using the zoom slider to zoom in/out, using Ctrl+scroll wheel, clicking the reset button, and toggling fullscreen mode.",
      },

      // 13 — Status Colors
      {
        title: "Table Status Colors",
        icon: "fa-solid fa-palette",
        description:
          "Tables display different colors based on their current status, making it easy to see the state of your floor at a glance.",
        steps: [
          "<span style='color:#3b82f6'><i class='fa-solid fa-circle'></i></span> <strong>Ordering</strong> — Blue. The table is currently ordering.",
          "<span style='color:#e94560'><i class='fa-solid fa-circle'></i></span> <strong>For Payment</strong> — Red. The table is waiting for payment.",
          "<span style='color:#16a34a'><i class='fa-solid fa-circle'></i></span> <strong>Paid</strong> — Green. The table has paid.",
          "<span style='color:#6b7280'><i class='fa-solid fa-circle'></i></span> <strong>Unoccupied</strong> — Gray. The table is available.",
          "Status colors are displayed on table cards, in edit modals, and in room previews.",
        ],
        gifHint:
          "Show a grid with tables in different statuses side by side, highlighting how each color represents a different state.",
      },

      // 14 — Tips
      {
        title: "Tips & Shortcuts",
        icon: "fa-solid fa-lightbulb",
        description: "Quick tips to speed up your workflow.",
        steps: [
          "Always <strong>Save</strong> your changes before switching floors or rooms to avoid losing work.",
          "Use the <strong>multi-select tool</strong> to quickly rearrange groups of tables.",
          "The <strong>room preview</strong> on hover helps you find the right room without switching.",
          "Use <strong>zoom out</strong> for a bird's-eye view of large layouts, then zoom in for fine-tuning.",
          "Shape constraints prevent invalid sizes — if a resize is blocked, the shape may require a minimum dimension.",
          "You can <strong>search tables</strong> by name in the edit modal dropdown for quick swaps.",
        ],
        gifHint:
          "Show a quick workflow: enter edit mode, place a few tables, use multi-select to rearrange, zoom out to verify layout, then save.",
      },
    ];
  }

  return {
    show: show
  };
})();


/* src/modules/GridEdit.js */
/**
 * GridEdit.js
 * Edit modal for placed table cards.
 * Opens when the edit button on a table card is clicked.
 * Allows changing shape and reassigning to a different table.
 */
var GridEdit = (function () {

  function bind() {
    // Click handlers are bound directly on edit buttons in GridRender.buildTableCard
  }

  function showEditModal(t) {
    _showEditModal(t);
  }

  function _showEditModal(table) {
    var cfg = GridCore.getConfig();
    var currentShape = table.shape || "square";
    var statusColor = cfg.statusColors[table.status] || "#6b7280";
    var styles = GridCore.getShapeStyles(currentShape);

    // ── Table source (same pattern as GridPlace._showModal) ──
    var defaultTables = [];
    var tablesLoading = false;
    var $tablesWrap = jQuery('<div>').css({ position: 'relative', display: 'block', width: '100%' });
    var $search = jQuery('<input type="text" placeholder="Search tables...">').css({ width: '100%', marginBottom: '4px', boxSizing: 'border-box' });
    var $select = jQuery('<select>').css({ width: '100%' });
    var $spinner = jQuery('<span class="tl-spinner"></span>').css({
      display: 'none', position: 'absolute', right: '10px', top: '8px',
      width: '18px', height: '18px', 'z-index': 2
    });
    $tablesWrap.append($search, $select, $spinner);

    function updateTableOptions(tables) {
      $select.empty();
      var filter = $search.val() ? $search.val().toLowerCase() : '';
      // Add current table as first option
      $select.append(
        jQuery('<option>').val('__current__')
          .text(table.name + " (" + table.seats + " seats) — current")
      );
      tables.filter(function (t) {
        return !filter || t.TableName.toLowerCase().includes(filter);
      }).forEach(function (t, i) {
        // Skip tables already in any room (except current table)
        if (t.TableId === table.id) return;
        var allLayers = GridCore.getAllLayersLayout();
        if (allLayers.some(function (layer) {
          return layer.rooms.some(function (room) {
            return room.tables.some(function (tbl) { return tbl.id === t.TableId; });
          });
        })) return;
        $select.append(
          jQuery('<option>').val(i).text(t.TableName + " (" + t.Capacity + " seats)")
        );
      });
      if (tablesLoading) { $spinner.show(); } else { $spinner.hide(); }
    }

    $search.on('input', function () { updateTableOptions(defaultTables); });

    if (typeof cfg.newTable.tables === 'function') {
      tablesLoading = true;
      updateTableOptions([]);
      $spinner.show();
      Promise.resolve(cfg.newTable.tables()).then(function (result) {
        tablesLoading = false;
        defaultTables = result || [];
        updateTableOptions(defaultTables);
      });
    } else if (Array.isArray(cfg.newTable.tables)) {
      defaultTables = cfg.newTable.tables;
      updateTableOptions(defaultTables);
    }

    // ── Shape selector ──
    var $shapeWrap = jQuery('<div>').addClass('tl-edit-shapes');
    jQuery.each(cfg.shapes, function (key, shapeDef) {
      var $btn = jQuery('<button>')
        .addClass('tl-edit-shape-btn')
        .toggleClass('tl-edit-shape-btn--active', key === currentShape)
        .attr({ 'data-shape': key, title: shapeDef.label, type: 'button' })
        .html('<i class="' + shapeDef.icon + '"></i>')
        .on('click', function () {
          $shapeWrap.find('.tl-edit-shape-btn--active').removeClass('tl-edit-shape-btn--active');
          jQuery(this).addClass('tl-edit-shape-btn--active');
          currentShape = key;
          // Update preview
          var newStyles = GridCore.getShapeStyles(key);
          $modal.find('.tl-modal-preview').css({
            'clip-path': newStyles.clipPath,
            'border-radius': newStyles.borderRadius
          });
        });
      $shapeWrap.append($btn);
    });

    // ── Build modal ──
    var $overlay = jQuery('<div>').addClass('tl-overlay');
    var $modal = jQuery('<div>').addClass('tl-modal');

    $modal.append(
      jQuery('<h2>').append(
        jQuery('<span>').addClass('tl-modal-preview').css({
          background: statusColor,
          'clip-path': styles.clipPath,
          'border-radius': styles.borderRadius
        }),
        jQuery('<span>').text('Edit Table')
      )
    );

    // Shape field
    $modal.append(_field('Shape', $shapeWrap));

    // Table select field
    $modal.append(_field('Change table', $tablesWrap));

    var $err = jQuery('<p>').addClass('tl-error').text('Error saving changes.');
    $modal.append($err);

    var $cancel = jQuery('<button>')
      .addClass('tl-btn tl-btn-cancel')
      .text('Cancel')
      .on('click', function () { $overlay.remove(); });

    var $save = jQuery('<button>')
      .addClass('tl-btn tl-btn-primary')
      .text('Save')
      .on('click', function () {
        $err.hide();
        var selectedVal = $select.val();
        var props = { shape: currentShape };

        if (selectedVal !== '__current__') {
          var selTable = defaultTables[parseInt(selectedVal, 10)];
          if (selTable) {
            props.id = selTable.TableId;
            props.name = selTable.TableName;
            props.seats = parseInt(selTable.Capacity, 10) || table.seats;
            props.status = selTable.Status ? selTable.Status.toLowerCase() : table.status;
          }
        }

        // Enforce shape min dimensions
        var shapeDef = (cfg.shapes || {})[currentShape] || {};
        var minC = shapeDef.minCols || 1;
        var minR = shapeDef.minRows || 1;
        var newColSpan = Math.max(minC, table.colSpan);
        var newRowSpan = Math.max(minR, table.rowSpan);
        if (shapeDef.preferSquare) {
          var side = Math.max(newColSpan, newRowSpan);
          newColSpan = side;
          newRowSpan = side;
        }
        props.colSpan = newColSpan;
        props.rowSpan = newRowSpan;

        if (GridCore.hasCollision(table.col, table.row, newColSpan, newRowSpan, table.id)) {
          $err.text('Not enough space for this shape.').show();
          return;
        }

        var origId = table.id;
        GridCore.updateTable(origId, props);
        var updated = GridCore.tableById(props.id || origId);
        _TL.$('[data-table-id="' + origId + '"]').replaceWith(GridRender.buildTableCard(updated));

        if (typeof cfg.onLayoutChange === "function" && !(cfg.realTime === false && GridCore.isEditing()))
          cfg.onLayoutChange(GridCore.getLayout());

        $overlay.remove();
      });

    $modal.append(
      jQuery('<div>').addClass('tl-modal-actions').append($cancel, $save)
    );
    $overlay.append($modal);
    jQuery('#' + _TL.cid()).append($overlay);

    $overlay.on('click', function (e) {
      if (jQuery(e.target).is($overlay)) $overlay.remove();
    });
  }

  function _field(label, $input) {
    return jQuery('<div>').addClass('tl-field')
      .append(jQuery('<label>').text(label), $input);
  }

  function unbind() {
    jQuery(document).off(".tl-edit");
  }

  return { bind: bind, unbind: unbind, showEditModal: showEditModal };
})();


/* src/modules/GridPlace.js */
/**
 * GridPlace.js
 * Place new tables on the grid by selecting a shape tool and dragging.
 * Per-instance state via _TL context.
 */
var GridPlace = (function () {
  var _inst = {};

  function _c() { return _inst[_TL.cid()]; }

  function init() {
    _inst[_TL.cid()] = {
      start: null,
      $ghost: null,
      pending: null,
      placeTouchMoveHandler: null
    };
  }

  function destroy() {
    var cid = _TL.cid();
    var ctx = _inst[cid];
    if (ctx && ctx.placeTouchMoveHandler) {
      document.removeEventListener("touchmove", ctx.placeTouchMoveHandler);
    }
    jQuery(document).off(".tl-place-" + cid);
    delete _inst[cid];
  }

  function bind() {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();
    var gridSel = "#" + cfg.containerId + " .tl-layout-grid";

    jQuery(document).on("mousedown.tl-place-" + cid, gridSel + " .tl-cell", function (e) {
      _TL.use(cid);
      if (cfg.realTime === false && !GridCore.isEditing()) return;
      if (!GridToolbar.getActive() || e.which !== 1) return;
      e.preventDefault();
      var ctx = _c();
      ctx.start = {
        col: parseInt(jQuery(this).data("col")),
        row: parseInt(jQuery(this).data("row")),
      };
    });

    jQuery(document).on("mousemove.tl-place-" + cid, gridSel, function (e) {
      _TL.use(cid);
      var ctx = _c();
      if (!GridToolbar.getActive() || !ctx.start) return;
      var end = GridCore.cursorToGrid(e.originalEvent.clientX, e.originalEvent.clientY);
      var span = GridCore.calcSpan(ctx.start, end, GridToolbar.getActive());
      var bad = GridCore.hasCollision(span.col, span.row, span.colSpan, span.rowSpan, null);
      _showGhost(span.col, span.row, span.colSpan, span.rowSpan, bad);
    });

    jQuery(document).on("mouseup.tl-place-" + cid, gridSel, function (e) {
      _TL.use(cid);
      var ctx = _c();
      if (!GridToolbar.getActive() || !ctx.start || e.which !== 1) return;
      var end = GridCore.cursorToGrid(e.originalEvent.clientX, e.originalEvent.clientY);
      var span = GridCore.calcSpan(ctx.start, end, GridToolbar.getActive());
      _removeGhost();
      ctx.start = null;
      if (GridCore.hasCollision(span.col, span.row, span.colSpan, span.rowSpan, null)) return;
      _showModal(jQuery.extend({}, span, { shape: GridToolbar.getActive() }));
    });

    jQuery(document).on("mouseup.tl-place-" + cid, function (e) {
      _TL.use(cid);
      var ctx = _c();
      if (GridToolbar.getActive() && ctx.start && !jQuery(e.target).closest(gridSel).length) {
        ctx.start = null;
        _removeGhost();
      }
    });

    jQuery(document).on("keydown.tl-place-" + cid, function (e) {
      _TL.use(cid);
      if (e.key === "Escape" && GridToolbar.getActive()) GridToolbar.deactivate();
    });

    // ── Touch: shape drawing ───────────────────────
    jQuery(document).on("touchstart.tl-place-" + cid, gridSel + " .tl-cell", function (e) {
      _TL.use(cid);
      var ctx = _c();
      if (cfg.editMode !== false && !GridCore.isEditing()) return;
      if (!GridToolbar.getActive()) return;
      if (e.originalEvent.touches.length !== 1) return;
      e.preventDefault();
      var touch = e.originalEvent.touches[0];
      var $cell = jQuery(document.elementFromPoint(touch.clientX, touch.clientY)).closest(".tl-cell");
      if (!$cell.length) return;
      ctx.start = {
        col: parseInt($cell.data("col")),
        row: parseInt($cell.data("row")),
      };

      ctx.placeTouchMoveHandler = function (te) {
        _TL.use(cid);
        var ctx2 = _c();
        if (!ctx2.start) return;
        if (te.touches.length !== 1) return;
        te.preventDefault();
        var tc = te.touches[0];
        var end = GridCore.cursorToGrid(tc.clientX, tc.clientY);
        var span = GridCore.calcSpan(ctx2.start, end, GridToolbar.getActive());
        var bad = GridCore.hasCollision(span.col, span.row, span.colSpan, span.rowSpan, null);
        _showGhost(span.col, span.row, span.colSpan, span.rowSpan, bad);
      };
      document.addEventListener("touchmove", ctx.placeTouchMoveHandler, { passive: false });
    });

    jQuery(document).on("touchend.tl-place-" + cid, function (e) {
      _TL.use(cid);
      var ctx = _c();
      if (ctx.placeTouchMoveHandler) {
        document.removeEventListener("touchmove", ctx.placeTouchMoveHandler);
        ctx.placeTouchMoveHandler = null;
      }
      if (!GridToolbar.getActive() || !ctx.start) return;
      var touch = e.originalEvent.changedTouches[0];
      var end = GridCore.cursorToGrid(touch.clientX, touch.clientY);
      var span = GridCore.calcSpan(ctx.start, end, GridToolbar.getActive());
      _removeGhost();
      ctx.start = null;
      if (GridCore.hasCollision(span.col, span.row, span.colSpan, span.rowSpan, null)) return;
      _showModal(jQuery.extend({}, span, { shape: GridToolbar.getActive() }));
    });
  }

  function _showGhost(col, row, colSpan, rowSpan, invalid) {
    _removeGhost();
    var ctx = _c();
    ctx.$ghost = GridRender.buildPlaceGhost(col, row, colSpan, rowSpan, invalid);
    _TL.$(".tl-layout-grid").append(ctx.$ghost);
  }

  function _removeGhost() {
    var ctx = _c();
    if (ctx.$ghost) {
      ctx.$ghost.remove();
      ctx.$ghost = null;
    }
  }

  function _showModal(placement) {
    var cid = _TL.cid();
    var ctx = _c();
    ctx.pending = placement;
    var cfg = GridCore.getConfig();
    var shapeDef = (cfg.shapes || {})[placement.shape] || {};
    var nextName = (cfg.newTable.namePrefix || "Table") + " " + GridCore.getCounter();
    var defaultTables = [];
    var tablesLoading = false;
    var tablesPromise = null;
    var $tablesWrap = jQuery('<div>').css({position:'relative',display:'block',width:'100%'});
    var $search = jQuery('<input type="text" placeholder="Search tables...">').css({width:'100%',marginBottom:'4px',boxSizing:'border-box'});
    var $select = jQuery('<select>').css({width:'100%'});
    var $spinner = jQuery('<span class="tl-spinner"></span>').css({
      display: 'none',
      position: 'absolute',
      right: '10px',
      top: '8px',
      width: '18px',
      height: '18px',
      'z-index': 2
    });
    $tablesWrap.append($search, $select, $spinner);

    function updateTableOptions(tables) {
      _TL.use(cid);
      $select.empty();
      var filter = $search.val() ? $search.val().toLowerCase() : '';
      var allLayers = GridCore.getAllLayersLayout();
      for (var i = 0; i < tables.length; i++) {
        var t = tables[i];
        if (filter && t.TableName.toLowerCase().indexOf(filter) === -1) continue;
        if (allLayers && allLayers.some(function (layer) {
          return layer.rooms.some(function (room) {
            return room.tables.some(function (tbl) { return tbl.id === t.TableId; });
          });
        })) continue;
        $select.append(
          jQuery('<option>')
            .val(i)
            .text(t.TableName + " (" + t.Capacity + " seats)")
        );
      }
      if (tablesLoading) {
        $spinner.show();
      } else {
        $spinner.hide();
      }
    }

    $search.on('input', function() {
      _TL.use(cid);
      updateTableOptions(defaultTables);
    });

    if (typeof cfg.newTable.tables === 'function') {
      tablesLoading = true;
      updateTableOptions([]);
      $spinner.show();
      tablesPromise = Promise.resolve(cfg.newTable.tables());
      tablesPromise.then(function (result) {
        _TL.use(cid);
        tablesLoading = false;
        defaultTables = result || [];
        updateTableOptions(defaultTables);
      });
    } else if (Array.isArray(cfg.newTable.tables)) {
      defaultTables = cfg.newTable.tables;
      updateTableOptions(defaultTables);
    }

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
          _TL.use(cid);
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

    $modal.append(_field("Copy from existing table", $tablesWrap));

    var $name = jQuery("<input>")
      .attr({ type: "text", placeholder: "Table name", maxlength: 30 })
      .val(nextName);

    var $status = jQuery("<select>");
    jQuery.each(cfg.statusColors, function (s) {
      $status.append(
        jQuery("<option>")
          .val(s)
          .text(s.charAt(0).toUpperCase() + s.slice(1)),
      );
    });
    $status.val(cfg.newTable.defaultStatus || "available");

    $status.on("change", function () {
      var newColor = cfg.statusColors[jQuery(this).val()] || "#6b7280";
      $modal.find(".tl-modal-preview").css("background", newColor);
    });

    var $err = jQuery("<p>")
      .addClass("tl-error")
      .text("Please enter a table name.");
    $modal.append($err);

    var $cancel = jQuery("<button>")
      .addClass("tl-btn tl-btn-cancel")
      .text("Cancel")
      .on("click", function () {
        $overlay.remove();
        _TL.use(cid);
        var ctx2 = _c();
        if (ctx2) ctx2.pending = null;
      });

    var $create = jQuery("<button>")
      .addClass("tl-btn tl-btn-primary")
      .text("Create Table")
      .on("click", function () {
        _TL.use(cid);
        $err.hide();
        var table = defaultTables[$select.val()];
        _commit({
          id: table ? table.TableId : null,
          name: table ? table.TableName : $name.val() || nextName,
          seats: parseInt(table ? table.Capacity : 4) || 4,
          status: table ? table.Status.toLowerCase() : $status.val(),
        });
        $overlay.remove();
      });

    $modal.append(
      jQuery("<div>").addClass("tl-modal-actions").append($cancel, $create),
    );
    $overlay.append($modal);
    jQuery("#" + cid).append($overlay);

    setTimeout(function () {
      $name.trigger("focus").trigger("select");
    }, 50);
    $overlay.on("click", function (e) {
      if (jQuery(e.target).is($overlay)) {
        $overlay.remove();
        _TL.use(cid);
        var ctx2 = _c();
        if (ctx2) ctx2.pending = null;
      }
    });
  }

  function _field(label, $input) {
    return jQuery("<div>")
      .addClass("tl-field")
      .append(jQuery("<label>").text(label), $input);
  }

  function _commit(details) {
    var ctx = _c();
    if (!ctx || !ctx.pending) return;
    var cfg = GridCore.getConfig();

    var newTable = {
      id: details.id || "T" + Date.now(),
      name: details.name,
      seats: details.seats,
      status: details.status,
      shape: ctx.pending.shape,
      col: ctx.pending.col,
      row: ctx.pending.row,
      colSpan: ctx.pending.colSpan,
      rowSpan: ctx.pending.rowSpan,
    };

    GridCore.addTable(newTable);
    _TL.$(".tl-layout-grid").append(GridRender.buildTableCard(newTable));

    if (typeof cfg.onTableCreated === "function") cfg.onTableCreated(newTable);
    if (typeof cfg.onLayoutChange === "function" && !(cfg.realTime === false && GridCore.isEditing()))
      cfg.onLayoutChange(GridCore.getLayout());

    ctx.pending = null;
    GridToolbar.deactivate();
  }

  function unbind() {
    var cid = _TL.cid();
    var ctx = _inst[cid];
    if (ctx && ctx.placeTouchMoveHandler) {
      document.removeEventListener("touchmove", ctx.placeTouchMoveHandler);
      ctx.placeTouchMoveHandler = null;
    }
    jQuery(document).off(".tl-place-" + cid);
  }

  return { init: init, destroy: destroy, bind: bind, unbind: unbind };
})();


/* src/modules/GridRooms.js */
/**
 * GridRooms.js
 * Room switcher UI — floating side panel that lets users create and switch
 * between rooms within the active layer.
 * Only active when cfg.layers is defined.
 * Per-instance state via _TL context.
 *
 * Public API (called by TableLayout):
 *   GridRooms.build()      — returns the floating panel jQuery element
 *   GridRooms.buildTabBar() — returns the simple tab bar jQuery element
 *   GridRooms.renderTabs()  — re-render tab bar tabs
 *   GridRooms.init()        — initialise per-instance state
 *   GridRooms.destroy()     — tear down per-instance state
 */
var GridRooms = (function () {
  var _inst = {};

  function _c() { return _inst[_TL.cid()]; }

  function init() {
    _inst[_TL.cid()] = {
      $wrap: null,
      $activePreview: null,
      hoverTimer: null,
      $roomTabBar: null
    };
  }

  function destroy() {
    var cid = _TL.cid();
    var ctx = _inst[cid];
    if (ctx) {
      clearTimeout(ctx.hoverTimer);
      if (ctx.$activePreview) ctx.$activePreview.remove();
    }
    delete _inst[cid];
  }

  // ── Public: build wrapper (button + slide-down panel) ─────────

  function build() {
    var cfg = GridCore.getConfig();
    if (cfg.roomStyle === "simple") return null;
    return _buildGenshinPanel();
  }

  function _buildGenshinPanel() {
    var cid = _TL.cid();
    var ctx = _c();
    ctx.$wrap = jQuery("<div>").addClass("tl-rooms-wrap");

    var $btn = jQuery("<button>")
      .addClass("tl-rooms-btn tl-rooms-btn--active")
      .attr("title", "Switch Room")
      .html('<i class="fa-solid fa-door-open"></i>')
      .on("click", function (e) {
        _TL.use(cid);
        e.stopPropagation();
        var c = _c();
        var isOpen = c.$wrap.find(".tl-rooms-panel").hasClass("tl-rooms-panel--open");
        if (isOpen) {
          _closePanel();
        } else {
          _openPanel();
        }
      });

    var $panel = _buildPanel();
    $panel.addClass("tl-rooms-panel--open");

    ctx.$wrap.append($btn);
    ctx.$wrap.append($panel);

    // Re-render panel when rooms change
    var _refreshPanel = function () {
      _TL.use(cid);
      var c = _c();
      var $p = c.$wrap.find(".tl-rooms-panel");
      if ($p.length) _renderPanelContent($p);
    };
    GridEvents.on("room:updated", _refreshPanel);
    GridEvents.on("room:deleted", _refreshPanel);
    GridEvents.on("room:reordered", _refreshPanel);
    GridEvents.on("room:switched", _refreshPanel);
    GridEvents.on("layer:switched", _refreshPanel);

    return ctx.$wrap;
  }

  // ── Panel ─────────────────────────────────────────

  function _buildPanel() {
    var $panel = jQuery("<div>").addClass("tl-rooms-panel");
    $panel.on("click", function (e) { e.stopPropagation(); });
    _renderPanelContent($panel);
    return $panel;
  }

  function _renderPanelContent($panel) {
    $panel.empty();

    var rooms = GridCore.getRooms();
    var activeId = GridCore.getActiveRoomId();

    var $list = jQuery("<div>").addClass("tl-rooms-list");
    jQuery.each(rooms, function (_, room) {
      $list.append(_buildRoomItem(room, room.id === activeId));
    });
    $panel.append($list);

    $panel.append(jQuery("<div>").addClass("tl-rooms-separator"));

    $panel.append(_buildAddForm($panel));
  }

  function _openPanel() {
    var ctx = _c();
    if (!ctx.$wrap) return;
    var $panel = ctx.$wrap.find(".tl-rooms-panel");
    _renderPanelContent($panel);
    $panel.addClass("tl-rooms-panel--open");
    ctx.$wrap.find(".tl-rooms-btn").addClass("tl-rooms-btn--active");
  }

  function _closePanel() {
    var ctx = _c();
    if (!ctx.$wrap) return;
    ctx.$wrap.find(".tl-rooms-panel").removeClass("tl-rooms-panel--open");
    ctx.$wrap.find(".tl-rooms-btn").removeClass("tl-rooms-btn--active");
  }

  // ── Room item ─────────────────────────────────────

  function _showPreview(room, $item) {
    var cfg = GridCore.getConfig();
    if (cfg.roomPreview === false) return;
    _hidePreview();
    var ctx = _c();
    ctx.$activePreview = _buildRoomPreview(room);
    ctx.$wrap.append(ctx.$activePreview);

    var wrapOffset = ctx.$wrap.offset();
    var itemOffset = $item.offset();
    var itemH = $item.outerHeight();
    var topPos = itemOffset.top - wrapOffset.top + itemH / 2;
    ctx.$activePreview.css({ top: topPos + "px" });

    setTimeout(function () {
      var c2 = _c();
      if (c2 && c2.$activePreview) c2.$activePreview.addClass("tl-room-preview-popup--visible");
    }, 10);
  }

  function _hidePreview() {
    var ctx = _c();
    if (ctx && ctx.$activePreview) {
      ctx.$activePreview.remove();
      ctx.$activePreview = null;
    }
  }

  function _buildRoomPreview(room) {
    var cfg = GridCore.getConfig();
    var tables = room.id === GridCore.getActiveRoomId()
      ? GridCore.getTables()
      : (room.tables || []);
    var cols = cfg.columns;
    var rows = cfg.rows;

    var minC = cols + 1, minR = rows + 1, maxC = 0, maxR = 0;
    jQuery.each(tables, function (_, t) {
      if (t.col < minC) minC = t.col;
      if (t.row < minR) minR = t.row;
      var endC = t.col + t.colSpan - 1;
      var endR = t.row + t.rowSpan - 1;
      if (endC > maxC) maxC = endC;
      if (endR > maxR) maxR = endR;
    });

    if (tables.length === 0) {
      minC = 1; minR = 1; maxC = cols; maxR = rows;
    }

    minC = Math.max(1, minC - 1);
    minR = Math.max(1, minR - 1);
    maxC = Math.min(cols, maxC + 1);
    maxR = Math.min(rows, maxR + 1);

    var cropCols = maxC - minC + 1;
    var cropRows = maxR - minR + 1;

    var maxPreviewW = 120;
    var maxPreviewH = 90;
    var gap = 1;

    var cellW = Math.floor((maxPreviewW - (cropCols - 1) * gap) / cropCols);
    var cellH = Math.floor((maxPreviewH - (cropRows - 1) * gap) / cropRows);
    var cellSize = Math.max(2, Math.min(cellW, cellH));

    var gridW = cropCols * cellSize + (cropCols - 1) * gap;
    var gridH = cropRows * cellSize + (cropRows - 1) * gap;

    var $popup = jQuery("<div>").addClass("tl-room-preview-popup");

    var $iso = jQuery("<div>").addClass("tl-room-preview-iso");
    var $grid = jQuery("<div>").addClass("tl-room-preview-grid").css({
      "grid-template-columns": "repeat(" + cropCols + ", " + cellSize + "px)",
      "grid-template-rows":    "repeat(" + cropRows + ", " + cellSize + "px)",
      "gap": gap + "px",
      "width":  gridW + "px",
      "height": gridH + "px",
    });

    for (var r = 0; r < cropRows; r++) {
      for (var c = 0; c < cropCols; c++) {
        $grid.append(
          jQuery("<div>").addClass("tl-room-preview-cell").css({
            "grid-column": (c + 1) + " / span 1",
            "grid-row":    (r + 1) + " / span 1",
          })
        );
      }
    }

    var cubeH = Math.max(2, Math.round(cellSize * 0.4));
    jQuery.each(tables, function (_, t) {
      var statusColor = cfg.statusColors[t.status] || "#6b7280";
      var $tbl = jQuery("<div>").addClass("tl-room-preview-table").css({
        "grid-column": (t.col - minC + 1) + " / span " + t.colSpan,
        "grid-row":    (t.row - minR + 1) + " / span " + t.rowSpan,
      });
      $tbl[0].style.setProperty("--tl-prev-color", statusColor);
      $tbl[0].style.setProperty("--tl-prev-h", cubeH + "px");
      $grid.append($tbl);
    });

    $iso.append($grid);
    $popup.append($iso);
    return $popup;
  }

  function _buildRoomItem(room, isActive) {
    var rooms = GridCore.getRooms();
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();

    var $item = jQuery("<div>")
      .addClass("tl-rooms-item" + (isActive ? " tl-rooms-item--active" : ""))
      .attr({ "title": room.label, "data-room-id": room.id, "draggable": "true" })
      .on("mouseenter", function () {
        _TL.use(cid);
        var ctx = _c();
        var self = this;
        clearTimeout(ctx.hoverTimer);
        ctx.hoverTimer = setTimeout(function () { _showPreview(room, jQuery(self)); }, 500);
      })
      .on("mouseleave", function () {
        _TL.use(cid);
        var ctx = _c();
        clearTimeout(ctx.hoverTimer);
        _hidePreview();
      })
      .on("click", function () {
        _TL.use(cid);
        if (isActive) return;
        if (cfg.editMode !== false && GridCore.isEditing()) return;
        GridCore.switchRoom(room.id);
        _rebuildGrid();
        var ctx = _c();
        var $panel = ctx.$wrap.find(".tl-rooms-panel");
        _renderPanelContent($panel);
        if (typeof cfg.onRoomChange === "function")
          cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
      });

    // Drag-to-reorder events
    $item.on("dragstart", function (e) {
      _TL.use(cid);
      if (cfg.editMode !== false && !GridCore.isEditing()) { e.preventDefault(); return; }
      e.originalEvent.dataTransfer.effectAllowed = "move";
      e.originalEvent.dataTransfer.setData("text/plain", room.id);
      $item.addClass("tl-rooms-item--dragging");
    });
    $item.on("dragend", function () {
      _TL.use(cid);
      $item.removeClass("tl-rooms-item--dragging");
      var ctx = _c();
      ctx.$wrap.find(".tl-rooms-item--drag-over").removeClass("tl-rooms-item--drag-over");
    });
    $item.on("dragover", function (e) {
      e.preventDefault();
      e.originalEvent.dataTransfer.dropEffect = "move";
      $item.addClass("tl-rooms-item--drag-over");
    });
    $item.on("dragleave", function () {
      $item.removeClass("tl-rooms-item--drag-over");
    });
    $item.on("drop", function (e) {
      _TL.use(cid);
      e.preventDefault();
      $item.removeClass("tl-rooms-item--drag-over");
      var draggedId = e.originalEvent.dataTransfer.getData("text/plain");
      if (draggedId === room.id) return;
      var currentIds = rooms.map(function (r) { return r.id; });
      var fromIdx = currentIds.indexOf(draggedId);
      var toIdx = currentIds.indexOf(room.id);
      if (fromIdx === -1 || toIdx === -1) return;
      currentIds.splice(fromIdx, 1);
      currentIds.splice(toIdx, 0, draggedId);
      GridCore.reorderRooms(currentIds);
      var ctx = _c();
      var $panel = ctx.$wrap.find(".tl-rooms-panel");
      _renderPanelContent($panel);
      if (cfg.editMode === false && typeof cfg.onLayoutChange === "function")
        cfg.onLayoutChange(GridCore.getLayout());
    });

    // Touch-to-reorder events (long press)
    var _touchTimer = null;
    var _touchDragging = false;
    $item.on("touchstart", function (e) {
      _TL.use(cid);
      if (cfg.editMode !== false && !GridCore.isEditing()) return;
      if (e.originalEvent.touches.length !== 1) return;
      _touchDragging = false;
      _touchTimer = setTimeout(function () {
        _touchDragging = true;
        $item.addClass("tl-rooms-item--dragging");
      }, 400);
    });
    $item.on("touchmove", function (e) {
      _TL.use(cid);
      if (!_touchDragging) { clearTimeout(_touchTimer); return; }
      e.preventDefault();
      var touch = e.originalEvent.touches[0];
      var el = document.elementFromPoint(touch.clientX, touch.clientY);
      var $target = jQuery(el).closest(".tl-rooms-item");
      var ctx = _c();
      ctx.$wrap.find(".tl-rooms-item--drag-over").removeClass("tl-rooms-item--drag-over");
      if ($target.length && $target.data("room-id") !== room.id) {
        $target.addClass("tl-rooms-item--drag-over");
      }
    });
    $item.on("touchend touchcancel", function (e) {
      _TL.use(cid);
      clearTimeout(_touchTimer);
      if (!_touchDragging) return;
      _touchDragging = false;
      $item.removeClass("tl-rooms-item--dragging");
      var ctx = _c();
      ctx.$wrap.find(".tl-rooms-item--drag-over").removeClass("tl-rooms-item--drag-over");

      var touch = e.originalEvent.changedTouches[0];
      var el = document.elementFromPoint(touch.clientX, touch.clientY);
      var $target = jQuery(el).closest(".tl-rooms-item");
      var targetId = $target.data("room-id");
      if (!targetId || targetId === room.id) return;

      var currentIds = rooms.map(function (r) { return r.id; });
      var fromIdx = currentIds.indexOf(room.id);
      var toIdx = currentIds.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1) return;
      currentIds.splice(fromIdx, 1);
      currentIds.splice(toIdx, 0, room.id);
      GridCore.reorderRooms(currentIds);
      var $panel = ctx.$wrap.find(".tl-rooms-panel");
      _renderPanelContent($panel);
      if (cfg.editMode === false && typeof cfg.onLayoutChange === "function")
        cfg.onLayoutChange(GridCore.getLayout());
    });

    var isFaIcon = room.icon && room.icon.indexOf("fa-") !== -1;
    var $icon = jQuery("<div>").addClass("tl-rooms-icon");
    if (isFaIcon) {
      $icon.append(jQuery("<i>").addClass(room.icon));
    } else if (room.icon && /\.(svg|png|jpe?g|gif|webp)/i.test(room.icon)) {
      $icon.append(jQuery("<img>").attr("src", room.icon).css({ width: "18px", height: "18px", "object-fit": "contain" }));
    } else {
      $icon.text(room.icon || "?");
    }

    $item.append($icon);

    return $item;
  }

  // ── Add room form ─────────────────────────────────

  function _buildAddForm($panel) {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();

    var $addBtn = jQuery("<button>")
      .addClass("tl-rooms-add-submit")
      .html('<i class="fa-solid fa-plus"></i>')
      .on("click", function () {
        _TL.use(cid);
        if (cfg.editMode !== false && !GridCore.isEditing()) return;
        if (typeof cfg.onCreateRoom === "function") {
          cfg.onCreateRoom(function (details) {
            _createRoom(details, $panel);
          });
          return;
        }
        _openAddModal($panel);
      });

    return $addBtn;
  }

  function _openAddModal($panel) {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();
    var pickerCfg = cfg.iconPicker || {};
    var icons = pickerCfg.icons || [];
    var maxText = pickerCfg.maxTextLength || 4;
    var allowText = pickerCfg.allowText !== false;
    var _selectedIcon = "";

    var $overlay = jQuery("<div>").addClass("tl-overlay");
    var $modal = jQuery("<div>").addClass("tl-modal");

    $modal.append(
      jQuery("<h2>").html('<i class="fa-solid fa-door-open"></i> New Room')
    );

    var $nameField = jQuery("<div>").addClass("tl-field");
    $nameField.append(jQuery("<label>").text("Name"));
    var $nameInput = jQuery("<input>").attr({ type: "text", placeholder: "Room name", maxlength: 30 });
    $nameField.append($nameInput);

    var $iconField = jQuery("<div>").addClass("tl-field");
    $iconField.append(jQuery("<label>").text("Icon"));

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

    var $create = jQuery("<button>").addClass("tl-btn tl-btn-primary").text("Add Room")
      .on("click", function () {
        _TL.use(cid);
        var labelVal = jQuery.trim($nameInput.val());
        if (!labelVal) { $nameInput.addClass("tl-input-error").trigger("focus"); return; }
        $nameInput.removeClass("tl-input-error");
        var iconVal = _selectedIcon || labelVal.charAt(0).toUpperCase();
        $overlay.remove();
        _createRoom({ label: labelVal, icon: iconVal }, $panel);
      });

    $nameInput.on("input", function () { jQuery(this).removeClass("tl-input-error"); });
    $nameInput.on("keydown", function (e) { if (e.key === "Enter") $create.trigger("click"); });

    $actions.append($cancel, $create);
    $modal.append($nameField, $iconField, $actions);
    $overlay.append($modal);
    jQuery("#" + _TL.cid()).append($overlay);

    $overlay.on("click", function (e) { if (jQuery(e.target).is($overlay)) $overlay.remove(); });

    setTimeout(function () { $nameInput.trigger("focus"); }, 50);
  }

  function _createRoom(details, $panel) {
    var label = details.label || "Room";
    var room = {
      id: "room-" + Date.now(),
      label: label,
      icon: details.icon || label.charAt(0).toUpperCase(),
      tables: [],
    };
    GridCore.addRoom(room);
    GridCore.switchRoom(room.id);
    _rebuildGrid();
    if ($panel) _renderPanelContent($panel);
    var cfg = GridCore.getConfig();
    if (typeof cfg.onRoomChange === "function")
      cfg.onRoomChange(room, []);
  }

  // ── Grid rebuild on room switch ───────────────────

  function _rebuildGrid() {
    _TL.$(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  // ═══════════════════════════════════════════════════
  // ── Simple tab bar mode ────────────────────────────
  // ═══════════════════════════════════════════════════

  function buildTabBar() {
    var cid = _TL.cid();
    var ctx = _c();
    ctx.$roomTabBar = jQuery("<div>").addClass("tl-room-tab-bar");

    var $scrollLeft = jQuery("<button>")
      .addClass("tl-room-tab-scroll tl-room-tab-scroll--left")
      .attr("title", "Scroll left")
      .html('<i class="fa-solid fa-chevron-left"></i>')
      .on("click", function () {
        _TL.use(cid);
        var c = _c();
        var $area = c.$roomTabBar.find(".tl-room-tab-scroll-area");
        $area.scrollLeft($area.scrollLeft() - 120);
      });

    var $scrollArea = jQuery("<div>").addClass("tl-room-tab-scroll-area");

    var $scrollRight = jQuery("<button>")
      .addClass("tl-room-tab-scroll tl-room-tab-scroll--right")
      .attr("title", "Scroll right")
      .html('<i class="fa-solid fa-chevron-right"></i>')
      .on("click", function () {
        _TL.use(cid);
        var c = _c();
        var $area = c.$roomTabBar.find(".tl-room-tab-scroll-area");
        $area.scrollLeft($area.scrollLeft() + 120);
      });

    var $addTab = jQuery("<div>")
      .addClass("tl-room-tab-add")
      .attr("title", "Add Room")
      .html('<i class="fa-solid fa-plus"></i>')
      .on("click", function () {
        _TL.use(cid);
        var cfg = GridCore.getConfig();
        if (cfg.realTime === false && !GridCore.isEditing()) return;
        if (typeof cfg.onCreateRoom === "function") {
          cfg.onCreateRoom(function (details) {
            _createRoom(details);
          });
          return;
        }
        _openAddModal();
      });

    ctx.$roomTabBar.append($scrollLeft, $scrollArea, $scrollRight, $addTab);
    _renderRoomTabs();
    _updateScrollButtons();

    $scrollArea.on("scroll", function () {
      _TL.use(cid);
      _updateScrollButtons();
    });

    GridEvents.on("room:added", function () { _TL.use(cid); _renderRoomTabs(); });
    GridEvents.on("room:deleted", function () { _TL.use(cid); _renderRoomTabs(); });
    GridEvents.on("room:reordered", function () { _TL.use(cid); _renderRoomTabs(); });
    GridEvents.on("room:updated", function () { _TL.use(cid); _renderRoomTabs(); });
    GridEvents.on("room:switched", function () { _TL.use(cid); _renderRoomTabs(); });
    GridEvents.on("layer:switched", function () { _TL.use(cid); _renderRoomTabs(); });

    return ctx.$roomTabBar;
  }

  function _updateScrollButtons() {
    var ctx = _c();
    if (!ctx || !ctx.$roomTabBar) return;
    var $area = ctx.$roomTabBar.find(".tl-room-tab-scroll-area");
    if (!$area.length) return;
    var el = $area[0];
    var canScrollLeft = el.scrollLeft > 1;
    var canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    ctx.$roomTabBar.find(".tl-room-tab-scroll--left").toggleClass("tl-room-tab-scroll--visible", canScrollLeft);
    ctx.$roomTabBar.find(".tl-room-tab-scroll--right").toggleClass("tl-room-tab-scroll--visible", canScrollRight);
  }

  function _renderRoomTabs() {
    var ctx = _c();
    if (!ctx || !ctx.$roomTabBar) return;
    var $scrollArea = ctx.$roomTabBar.find(".tl-room-tab-scroll-area");
    if (!$scrollArea.length) return;
    $scrollArea.empty();

    var cfg = GridCore.getConfig();
    var rooms = GridCore.getRooms();
    var activeId = GridCore.getActiveRoomId();
    var cid = _TL.cid();

    jQuery.each(rooms, function (_, room) {
      var isActive = room.id === activeId;
      var $tab = jQuery("<div>")
        .addClass("tl-room-tab" + (isActive ? " tl-room-tab--active" : ""))
        .attr({ "data-room-id": room.id, "draggable": "true" });

      var $icon = _buildRoomTabIcon(room);
      var $label = jQuery("<span>").addClass("tl-room-tab-label").text(room.label);
      $tab.append($icon, $label);

      if (rooms.length > 1 && cfg.realTime === false && GridCore.isEditing()) {
        var $close = jQuery("<span>")
          .addClass("tl-room-tab-close")
          .html("&times;")
          .on("click", function (e) {
            _TL.use(cid);
            e.stopPropagation();
            if (cfg.realTime === false && !GridCore.isEditing()) return;
            _confirmDeleteRoomTab(room);
          });
        $tab.append($close);
      }

      $tab.on("click", function () {
        _TL.use(cid);
        if (isActive) return;
        if (cfg.realTime === false && GridCore.isEditing()) return;
        GridCore.switchRoom(room.id);
        _rebuildGrid();
        if (typeof cfg.onRoomChange === "function")
          cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
      });

      // Drag-to-reorder
      $tab.on("dragstart", function (e) {
        _TL.use(cid);
        if (cfg.realTime === false && !GridCore.isEditing()) { e.preventDefault(); return; }
        e.originalEvent.dataTransfer.effectAllowed = "move";
        e.originalEvent.dataTransfer.setData("text/plain", room.id);
        $tab.addClass("tl-room-tab--dragging");
      });
      $tab.on("dragend", function () {
        _TL.use(cid);
        $tab.removeClass("tl-room-tab--dragging");
        var c = _c();
        c.$roomTabBar.find(".tl-room-tab--drag-over").removeClass("tl-room-tab--drag-over");
      });
      $tab.on("dragover", function (e) {
        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = "move";
        $tab.addClass("tl-room-tab--drag-over");
      });
      $tab.on("dragleave", function () {
        $tab.removeClass("tl-room-tab--drag-over");
      });
      $tab.on("drop", function (e) {
        _TL.use(cid);
        e.preventDefault();
        $tab.removeClass("tl-room-tab--drag-over");
        var draggedId = e.originalEvent.dataTransfer.getData("text/plain");
        if (draggedId === room.id) return;
        var currentIds = rooms.map(function (r) { return r.id; });
        var fromIdx = currentIds.indexOf(draggedId);
        var toIdx = currentIds.indexOf(room.id);
        if (fromIdx === -1 || toIdx === -1) return;
        currentIds.splice(fromIdx, 1);
        currentIds.splice(toIdx, 0, draggedId);
        GridCore.reorderRooms(currentIds);
      });

      // Double-click to rename
      $tab.on("dblclick", function (e) {
        _TL.use(cid);
        e.stopPropagation();
        if (cfg.realTime !== false || !GridCore.isEditing()) return;
        _startRoomTabRename($tab, room);
      });

      $scrollArea.append($tab);
    });

    _updateScrollButtons();
  }

  function renderTabs() {
    _renderRoomTabs();
  }

  function _buildRoomTabIcon(room) {
    var $icon = jQuery("<div>").addClass("tl-room-tab-icon");
    if (room.icon && room.icon.indexOf("fa-") !== -1) {
      $icon.append(jQuery("<i>").addClass(room.icon));
    } else if (room.icon && /\.(svg|png|jpe?g|gif|webp)/i.test(room.icon)) {
      $icon.append(jQuery("<img>").attr("src", room.icon).css({ width: "14px", height: "14px", "object-fit": "contain" }));
    } else {
      $icon.text(room.icon || "?");
    }
    return $icon;
  }

  function _startRoomTabRename($tab, room) {
    var cid = _TL.cid();
    var $label = $tab.find(".tl-room-tab-label");
    var $input = jQuery("<input>")
      .addClass("tl-room-tab-rename-input")
      .attr({ type: "text", maxlength: 30 })
      .val(room.label);
    $label.replaceWith($input);
    $input.trigger("focus").trigger("select");

    function commit() {
      _TL.use(cid);
      var val = jQuery.trim($input.val());
      if (val && val !== room.label) {
        GridCore.updateRoomMeta(room.id, { label: val });
      }
      _renderRoomTabs();
    }

    $input.on("blur", commit);
    $input.on("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); $input.trigger("blur"); }
      if (e.key === "Escape") { _TL.use(cid); _renderRoomTabs(); }
    });
    $input.on("click", function (e) { e.stopPropagation(); });
  }

  function _confirmDeleteRoomTab(room) {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();
    var $overlay = jQuery("<div>").addClass("tl-overlay");
    var $modal = jQuery("<div>").addClass("tl-modal");
    $modal.append(
      jQuery("<h2>").html('<i class="fa-solid fa-triangle-exclamation"></i> Delete Room')
    );
    $modal.append(
      jQuery("<p>").addClass("tl-modal-text").text(
        'Are you sure you want to delete "' + room.label + '"? This action cannot be undone.'
      )
    );
    var $actions = jQuery("<div>").addClass("tl-modal-actions");
    var $cancel = jQuery("<button>").addClass("tl-btn tl-btn-cancel").text("Cancel")
      .on("click", function () { $overlay.remove(); });
    var $confirm = jQuery("<button>").addClass("tl-btn tl-btn-danger").text("Delete")
      .on("click", function () {
        _TL.use(cid);
        $overlay.remove();
        var wasActive = (room.id === GridCore.getActiveRoomId());
        GridCore.deleteRoom(room.id);
        if (wasActive) _rebuildGrid();
        if (typeof cfg.onRoomChange === "function")
          cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
      });
    $actions.append($cancel, $confirm);
    $modal.append($actions);
    $overlay.append($modal);
    jQuery("#" + _TL.cid()).append($overlay);
    $overlay.on("click", function (e) { if (jQuery(e.target).is($overlay)) $overlay.remove(); });
  }

  return {
    init: init,
    destroy: destroy,
    build: build,
    buildTabBar: buildTabBar,
    renderTabs: renderTabs
  };
})();


/* src/TableLayout.js */
/**
 * TableLayout.js
 * ─────────────────────────────────────────────────────────────────
 * Public API — this is the only object the user ever touches.
 * Supports multiple independent instances on the same page.
 *
 * Usage:
 *
 *   var layout1 = TableLayout.create({ containerId: 'div1', ... });
 *   var layout2 = TableLayout.create({ containerId: 'div2', ... });
 *
 *   layout1.zoomIn();
 *   layout2.getLayout();
 *   layout1.destroy();
 */
var TableLayout = (function () {
  function create(userConfig) {
    // ── Guard: jQuery required ─────────────────────
    if (typeof jQuery === "undefined") {
      throw new Error("[TableLayout] jQuery is required but not loaded.");
    }

    // ── Guard: container must exist ────────────────
    var cfg = GridConfig.merge(userConfig);
    var cid = cfg.containerId;
    if (!jQuery("#" + cid).length) {
      throw new Error(
        "[TableLayout] Container #" + cid + " not found in DOM.",
      );
    }

    // ── Set context to this instance ───────────────
    _TL.use(cid);

    // ── Boot core modules ──────────────────────────
    GridEvents.reset();
    GridCore.init(cfg);
    GridZoom.init(cfg.zoom.initial || 1);
    GridFullscreen.init();
    GridLayers.init();
    GridToolbar.init();
    GridDrag.init();
    GridResize.init();
    GridMultiSelect.init();
    GridPlace.init();
    GridRooms.init();

    // ── Build DOM ──────────────────────────────────
    var $container = jQuery("#" + cid)
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
    if (cfg.layers && cfg.layers.length) {
      var $rooms = GridRooms.build();
      if ($rooms) $canvasWrap.append($rooms);
      if (cfg.roomStyle === "simple") {
        $canvasWrap.append(GridRooms.buildTabBar());
      }
    }

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
    if (cfg.realTime === false) $container.addClass("tl-view-mode");

    // ── Apply initial zoom ─────────────────────────
    GridZoom.applyZoom(cfg.zoom.initial || 1, true);

    // ── Bind modules ───────────────────────────────
    GridDrag.bind();
    GridResize.bind();
    GridEdit.bind();
    GridMultiSelect.bind();
    GridPlace.bind();
    GridZoom.bindWheelZoom();
    GridFullscreen.bind();

    // ── Wire internal events to user callbacks ─────
    GridEvents.on("zoom:changed", function (level) {
      if (typeof cfg.onZoom === "function") cfg.onZoom(level);
    });
    // Layer events
    GridEvents.on("layer:switched", function (layer) {
      _TL.use(cid);
      if (typeof cfg.onLayerChange === "function")
        cfg.onLayerChange(layer, GridCore.getAllLayersLayout());
    });
    GridEvents.on("layer:updated", function (layer) {
      _TL.use(cid);
      if (typeof cfg.onLayerChange === "function" && !(cfg.realTime === false && GridCore.isEditing()))
        cfg.onLayerChange(layer, GridCore.getAllLayersLayout());
    });
    GridEvents.on("layer:deleted", function (removed) {
      _TL.use(cid);
      if (typeof cfg.onLayerDelete === "function")
        cfg.onLayerDelete(removed);
      if (typeof cfg.onLayerChange === "function")
        cfg.onLayerChange(GridCore.getActiveLayer(), GridCore.getAllLayersLayout());
    });
    GridEvents.on("layer:reordered", function (layers) {
      if (typeof cfg.onLayerReorder === "function")
        cfg.onLayerReorder(layers);
    });
    // Room events
    GridEvents.on("room:switched", function (room) {
      _TL.use(cid);
      if (typeof cfg.onRoomChange === "function")
        cfg.onRoomChange(room, GridCore.getLayout());
    });
    GridEvents.on("room:updated", function (room) {
      _TL.use(cid);
      if (typeof cfg.onRoomChange === "function" && !(cfg.realTime === false && GridCore.isEditing()))
        cfg.onRoomChange(room, GridCore.getLayout());
    });
    GridEvents.on("room:deleted", function (removed) {
      _TL.use(cid);
      if (typeof cfg.onRoomDelete === "function")
        cfg.onRoomDelete(removed);
      if (typeof cfg.onRoomChange === "function")
        cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
    });
    GridEvents.on("room:reordered", function (rooms) {
      if (typeof cfg.onRoomReorder === "function")
        cfg.onRoomReorder(rooms);
    });

    // ── Return instance API ────────────────────────
    return {
      // Zoom
      zoomIn: function () {
        _TL.use(cid);
        GridZoom.applyZoom(GridZoom.getZoom() + (cfg.zoom.step || 0.1));
      },
      zoomOut: function () {
        _TL.use(cid);
        GridZoom.applyZoom(GridZoom.getZoom() - (cfg.zoom.step || 0.1));
      },
      zoomReset: function () {
        _TL.use(cid);
        GridZoom.applyZoom(cfg.zoom.initial || 1);
      },
      zoomTo: function (l) {
        _TL.use(cid);
        GridZoom.applyZoom(l);
      },
      getZoom: function () {
        _TL.use(cid);
        return GridZoom.getZoom();
      },

      // Data
      getLayout: function () {
        _TL.use(cid);
        return GridCore.getLayout();
      },
      getTables: function () {
        _TL.use(cid);
        return GridCore.getTables();
      },
      getConfig: function () {
        _TL.use(cid);
        return GridCore.getConfig();
      },

      // Layers
      getLayers: function () {
        _TL.use(cid);
        return GridCore.getLayers();
      },
      getActiveLayer: function () {
        _TL.use(cid);
        return GridCore.getActiveLayer();
      },
      switchLayer: function (id) {
        _TL.use(cid);
        if (GridCore.switchLayer(id)) {
          _TL.$(".tl-zoom-area").empty().append(GridRender.buildGrid());
        }
      },
      addLayer: function (details) {
        _TL.use(cid);
        var label = (details && details.label) || "Layout";
        var firstRoom = {
          id: "room-" + Date.now(),
          label: (details && details.roomLabel) || "Room 1",
          icon: (details && details.roomIcon) || "fa-solid fa-utensils",
          tables: [],
        };
        var layer = {
          id: "layer-" + Date.now(),
          label: label,
          rooms: (details && details.rooms) || [firstRoom],
        };
        GridCore.addLayer(layer);
        return layer;
      },
      deleteLayer: function (id) {
        _TL.use(cid);
        return GridCore.deleteLayer(id);
      },
      reorderLayers: function (orderedIds) {
        _TL.use(cid);
        return GridCore.reorderLayers(orderedIds);
      },
      getAllLayersLayout: function () {
        _TL.use(cid);
        return GridCore.getAllLayersLayout();
      },

      // Rooms
      getRooms: function () {
        _TL.use(cid);
        return GridCore.getRooms();
      },
      getActiveRoom: function () {
        _TL.use(cid);
        return GridCore.getActiveRoom();
      },
      switchRoom: function (id) {
        _TL.use(cid);
        if (GridCore.switchRoom(id)) {
          _TL.$(".tl-zoom-area").empty().append(GridRender.buildGrid());
        }
      },
      addRoom: function (details) {
        _TL.use(cid);
        var label = (details && details.label) || "Room";
        var room = {
          id: "room-" + Date.now(),
          label: label,
          icon: (details && details.icon) || label.charAt(0).toUpperCase(),
          tables: (details && details.tables) || [],
        };
        GridCore.addRoom(room);
        return room;
      },
      deleteRoom: function (id) {
        _TL.use(cid);
        return GridCore.deleteRoom(id);
      },
      reorderRooms: function (orderedIds) {
        _TL.use(cid);
        return GridCore.reorderRooms(orderedIds);
      },

      // Edit mode
      isEditing: function () {
        _TL.use(cid);
        return GridCore.isEditing();
      },

      // Tools
      setTool: function (key) {
        _TL.use(cid);
        GridToolbar.toggle(key);
      },
      clearTool: function () {
        _TL.use(cid);
        GridToolbar.deactivate();
      },
      getActiveTool: function () {
        _TL.use(cid);
        return GridToolbar.getActive();
      },

      // Lifecycle
      destroy: function () {
        _TL.use(cid);
        GridDrag.unbind();
        GridResize.unbind();
        GridMultiSelect.unbind();
        GridPlace.unbind();
        GridZoom.destroy();
        GridFullscreen.destroy();
        GridLayers.destroy();
        GridToolbar.destroy();
        GridRooms.destroy();
        GridDrag.destroy();
        GridResize.destroy();
        GridMultiSelect.destroy();
        GridPlace.destroy();
        jQuery("#" + cid)
          .empty()
          .removeClass("tl-root tl-view-mode");
        GridEvents.destroy();
        GridCore.destroy();
      },
    };
  }

  return { create: create };
})();
