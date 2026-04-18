/*!
 * table-layout.js v0.0.1
 * Restaurant Table Layout Grid Library
 * Built: 2026-04-18T15:55:29.493Z
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
    // realTime: false means editMode: true
    realTime: false,
    trashZone: true,
    swapAnimation: true,
    showSizeBadge: true,
    showHint: false,
    mode: 'edit', // 'edit' or 'view' — view mode hides all controls and drag handles, for a clean presentation layer
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
 * Two-tier hierarchy: layers → rooms → tables.
 * All other modules read/write state through this API.
 */
var GridCore = (function () {
  var _cfg = null;
  var _tables = [];
  var _counter = 1;
  var _layers = null;
  var _activeLayerId = null;
  var _activeRoomId = null;
  var _editMode = false;
  var _snapshot = null;

  // ── Setup ─────────────────────────────────────────

  function init(cfg) {
    _cfg = cfg;
    if (cfg.layers && cfg.layers.length) {
      _layers = jQuery.extend(true, [], cfg.layers);
      _layers.forEach(function (l) {
        if (!Array.isArray(l.rooms)) l.rooms = [];
        l.rooms.forEach(function (r) { if (!Array.isArray(r.tables)) r.tables = []; });
      });
      _activeLayerId = _layers[0].id;
      var firstRoom = _layers[0].rooms[0];
      _activeRoomId = firstRoom ? firstRoom.id : null;
      _tables = firstRoom ? jQuery.extend(true, [], firstRoom.tables) : [];
    } else {
      _layers = null;
      _activeLayerId = null;
      _activeRoomId = null;
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
    _activeRoomId = null;
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

  // ── Layer management (top-tier tabs) ───────────────

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
    // Save current tables into active room
    _saveCurrentTables();
    var target = _layers.find(function (l) { return l.id === id; });
    if (!target) return false;
    _activeLayerId = id;
    // Load first room of the new layer
    var firstRoom = target.rooms[0];
    _activeRoomId = firstRoom ? firstRoom.id : null;
    _tables = firstRoom ? jQuery.extend(true, [], firstRoom.tables) : [];
    _counter = _tables.length + 1;
    GridEvents.emit("layer:switched", target);
    GridEvents.emit("room:switched", firstRoom || null);
    return true;
  }

  function addLayer(layer) {
    if (!_layers) _layers = [];
    if (!Array.isArray(layer.rooms)) layer.rooms = [];
    _layers.push(layer);
    GridEvents.emit("layer:added", layer);
  }

  function deleteLayer(id) {
    if (!_layers || _layers.length <= 1) return false;
    var idx = _layers.findIndex(function (l) { return l.id === id; });
    if (idx === -1) return false;
    var removed = _layers.splice(idx, 1)[0];
    if (_activeLayerId === id) {
      var next = _layers[Math.min(idx, _layers.length - 1)];
      _activeLayerId = next.id;
      var firstRoom = next.rooms[0];
      _activeRoomId = firstRoom ? firstRoom.id : null;
      _tables = firstRoom ? jQuery.extend(true, [], firstRoom.tables) : [];
      _counter = _tables.length + 1;
      GridEvents.emit("layer:switched", next);
      GridEvents.emit("room:switched", firstRoom || null);
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
    _layers.forEach(function (l) {
      if (reordered.indexOf(l) === -1) reordered.push(l);
    });
    _layers = reordered;
    GridEvents.emit("layer:reordered", _layers);
    return true;
  }

  function updateLayerMeta(id, props) {
    if (!_layers) return false;
    var layer = _layers.find(function (l) { return l.id === id; });
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
    return _activeRoomId;
  }

  function getActiveRoom() {
    var layer = getActiveLayer();
    _saveCurrentTables();
    if (!layer) return null;
    return layer.rooms.find(function (r) { return r.id === _activeRoomId; }) || null;
  }

  function switchRoom(id) {
    if (!_layers) return false;
    if (_editMode) return false;
    var layer = getActiveLayer();
    if (!layer) return false;
    _saveCurrentTables();
    var target = layer.rooms.find(function (r) { return r.id === id; });
    if (!target) return false;
    _activeRoomId = id;
    _tables = jQuery.extend(true, [], target.tables);
    _counter = _tables.length + 1;
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
    var layer = getActiveLayer();
    if (!layer || layer.rooms.length <= 1) return false;
    var idx = layer.rooms.findIndex(function (r) { return r.id === id; });
    if (idx === -1) return false;
    var removed = layer.rooms.splice(idx, 1)[0];
    if (_activeRoomId === id) {
      var next = layer.rooms[Math.min(idx, layer.rooms.length - 1)];
      _activeRoomId = next.id;
      _tables = jQuery.extend(true, [], next.tables);
      _counter = _tables.length + 1;
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
    var layer = getActiveLayer();
    if (!layer) return;
    var room = layer.rooms.find(function (r) { return r.id === _activeRoomId; });
    if (room) room.tables = jQuery.extend(true, [], _tables);
  }

  function getAllLayersLayout() {
    if (!_layers) return null;
    _saveCurrentTables();
    return _layers.map(function (l) { return jQuery.extend(true, {}, l); });
  }

  // ── Edit mode ─────────────────────────────────────

  function isEditing() {
    if (_cfg && _cfg.mode === 'edit') return true;
    return _editMode;
  }

  function enterEditMode() {
    if (_editMode) return;
    var roomMeta = null;
    var room = getActiveRoom();
    if (room) roomMeta = { label: room.label, icon: room.icon };
    _snapshot = {
      tables: jQuery.extend(true, [], _tables),
      roomMeta: roomMeta,
      roomOrder: getRooms().map(function (r) { return r.id; }),
      layerLabel: getActiveLayer() ? getActiveLayer().label : null,
      layerOrder: _layers ? _layers.map(function (l) { return l.id; }) : null,
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
    if (_snapshot.roomMeta) {
      var room = getActiveRoom();
      if (room) {
        room.label = _snapshot.roomMeta.label;
        room.icon = _snapshot.roomMeta.icon;
      }
    }
    if (_snapshot.layerLabel) {
      var layer = getActiveLayer();
      if (layer) layer.label = _snapshot.layerLabel;
    }
    if (_snapshot.roomOrder) {
      reorderRooms(_snapshot.roomOrder);
    }
    if (_snapshot.layerOrder && _layers) {
      reorderLayers(_snapshot.layerOrder);
    }
    _snapshot = null;
    _editMode = false;
    var restoredRoom = getActiveRoom();
    if (restoredRoom) GridEvents.emit("room:updated", restoredRoom);
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
 *
 * Public API (called by GridToolbar):
 *   GridLayers.buildTabBar()   — returns the tab bar jQuery element
 *   GridLayers.renderTabs()    — re-renders tabs (called after edit mode changes)
 */
var GridLayers = (function () {
  var _$tabBar = null;

  function buildTabBar() {
    _$tabBar = jQuery("<div>").addClass("tl-tab-bar");
    _renderTabs();

    GridEvents.on("layer:added", function () { _renderTabs(); });
    GridEvents.on("layer:deleted", function () { _renderTabs(); });
    GridEvents.on("layer:reordered", function () { _renderTabs(); });
    GridEvents.on("layer:updated", function () { _renderTabs(); });
    GridEvents.on("layer:switched", function () { _renderTabs(); });

    return _$tabBar;
  }

  function _renderTabs() {
    if (!_$tabBar) return;
    _$tabBar.empty();

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

      // Close button (only if more than 1 layer, in edit mode)
      if (layers.length > 1 && cfg.realTime === false && GridCore.isEditing()) {
        var $close = jQuery("<span>")
          .addClass("tl-tab-close")
          .html("&times;")
          .on("click", function (e) {
            e.stopPropagation();
            if (cfg.realTime === false && !GridCore.isEditing()) return;
            _confirmDeleteLayer(layer);
          });
        $tab.append($close);
      }

      // Click to switch layer
      $tab.on("click", function () {
        if (isActive) return;
        if (cfg.realTime === false && GridCore.isEditing()) return;
        GridCore.switchLayer(layer.id);
        _rebuildGrid();
      });

      // Drag-to-reorder
      $tab.on("dragstart", function (e) {
        if (cfg.realTime === false && !GridCore.isEditing()) { e.preventDefault(); return; }
        e.originalEvent.dataTransfer.effectAllowed = "move";
        e.originalEvent.dataTransfer.setData("text/plain", layer.id);
        $tab.addClass("tl-tab--dragging");
      });
      $tab.on("dragend", function () {
        $tab.removeClass("tl-tab--dragging");
        _$tabBar.find(".tl-tab--drag-over").removeClass("tl-tab--drag-over");
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

      // Double-click to rename
      $tab.on("dblclick", function (e) {
        e.stopPropagation();
        if (cfg.realTime !== false || !GridCore.isEditing()) return;
        _startTabRename($tab, layer);
      });

      _$tabBar.append($tab);
    });

    // Add-tab button
    var $addTab = jQuery("<div>")
      .addClass("tl-tab-add")
      .attr("title", "Add Floor")
      .html('<i class="fa-solid fa-plus"></i>')
      .on("click", function () {
        if (cfg.realTime === false && !GridCore.isEditing()) return;
        if (typeof cfg.onCreateLayer === "function") {
          cfg.onCreateLayer(function (details) {
            _createNewLayer(details);
          });
          return;
        }
        _openAddFloorModal();
      });
    _$tabBar.append($addTab);
  }

  function renderTabs() {
    _renderTabs();
  }

  // ── Tab rename ────────────────────────────────────

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

  // ── Create / delete layer ─────────────────────────

  function _openAddFloorModal() {
    var cfg = GridCore.getConfig();
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
        _createNewLayer({ label: labelVal, icon: iconVal });
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
        var wasActive = (layer.id === GridCore.getActiveLayerId());
        GridCore.deleteLayer(layer.id);
        if (wasActive) _rebuildGrid();
      });
    $actions.append($cancel, $confirm);
    $modal.append($actions);
    $overlay.append($modal);
    jQuery(".tl-root").first().append($overlay);
    $overlay.on("click", function (e) { if (jQuery(e.target).is($overlay)) $overlay.remove(); });
  }

  // ── Icon badge ────────────────────────────────────

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

  // ── Helpers ───────────────────────────────────────

  function _rebuildGrid() {
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  return {
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
 */
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

      _$layoutIcon = _buildIconBadge(activeRoom);
      _$layoutIcon.on("click", function (e) {
        e.stopPropagation();
        _toggleIconPicker();
      });

      _$layoutName = jQuery("<span>")
        .addClass("tl-toolbar-layout-name")
        .text(activeRoom ? activeRoom.label : "")
        .on("click", function () { _startNameEdit(); });

      GridEvents.on("room:switched", function (room) {
        _refreshRoomDisplay(room);
      });

      _$editSection = jQuery("<div>").addClass("tl-toolbar-actions");
      _renderEditControls();
      $right.append(_$editSection);

      $toolbar.append($right);
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

  // ── Icon badge (display for active room) ───────────

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
    if (_$layoutName && !_nameEditing) {
      _$layoutName.text(room ? room.label : "");
    }
    if (_$layoutIcon) {
      _$layoutIcon.empty();
      if (room) _renderIconContent(_$layoutIcon, room.icon, room.label);
    }
  }

  // ── Inline name editing (click to edit room name) ──

  function _startNameEdit() {
    var cfg = GridCore.getConfig();
    if (!cfg.layers || !cfg.layers.length) return;
    if (cfg.realTime !== false || !GridCore.isEditing()) return;
    if (_nameEditing) return;
    var room = GridCore.getActiveRoom();
    if (!room) return;

    _nameEditing = true;
    var $input = jQuery("<input>")
      .addClass("tl-toolbar-layout-name-input")
      .attr({ type: "text", maxlength: 30, placeholder: "Room name" })
      .val(room.label);

    _$layoutName.replaceWith($input);
    _$layoutName = $input;
    $input.trigger("focus").trigger("select");

    function commit() {
      if (!_nameEditing) return;
      _nameEditing = false;
      var val = jQuery.trim($input.val());
      if (val && val !== room.label) {
        GridCore.updateRoomMeta(room.id, { label: val });
        var c = GridCore.getConfig();
        if (cfg.realTime !== false || !GridCore.isEditing()) return;
          c.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
      }
      var updatedRoom = GridCore.getActiveRoom();
      var $span = jQuery("<span>")
        .addClass("tl-toolbar-layout-name")
        .text(updatedRoom ? updatedRoom.label : "")
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
          .text(room.label)
          .on("click", function () { _startNameEdit(); });
        $input.replaceWith($span);
        _$layoutName = $span;
      }
    });
  }

  // ── Icon picker popup (for room icon) ──────────────

  function _toggleIconPicker() {
    var cfg = GridCore.getConfig();
    if (cfg.realTime !== false || !GridCore.isEditing()) return;
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

    _$layoutIcon.addClass("tl-toolbar-icon-badge--picker-open");
    var $right = _$layoutIcon.closest(".tl-toolbar-right");
    $right.css("position", "relative");
    $right.append($picker);
    _$iconPicker = $picker;

    setTimeout(function () { $picker.addClass("tl-icon-picker--open"); }, 10);
  }

  function _confirmDeleteRoom(room) {
    var cfg = GridCore.getConfig();
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
        var wasActive = (room.id === GridCore.getActiveRoomId());
        GridCore.deleteRoom(room.id);
        if (wasActive) {
          jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
        }
        _refreshRoomDisplay(GridCore.getActiveRoom());
        if (typeof cfg.onRoomChange === "function")
          cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
      });
    $actions.append($cancel, $confirm);
    $modal.append($actions);
    $overlay.append($modal);
    jQuery(".tl-root").first().append($overlay);
    $overlay.on("click", function (e) { if (jQuery(e.target).is($overlay)) $overlay.remove(); });
  }

  function _selectIcon(room, value) {
    GridCore.updateRoomMeta(room.id, { icon: value });
    var cfg = GridCore.getConfig();
    if (typeof cfg.onRoomChange === "function" && !GridCore.isEditing())
      cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
    var updated = GridCore.getActiveRoom();
    _$layoutIcon.find(".tl-icon-picker").detach();
    _renderIconContent(_$layoutIcon, updated.icon, updated.label);
    _closeIconPicker();
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

    if (cfg.realTime === false && GridCore.isEditing()) {
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
      .attr("title", "Room settings")
      .html('<i class="fa-solid fa-gear"></i>')
      .on("click", function (e) {
        e.stopPropagation();
        _toggleSettingsPopup($settingsWrap);
      });
    $settingsWrap.append($settingsBtn);
    _$editSection.append($settingsWrap);
  }

  // ── Settings popup (manages rooms) ────────────────

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
    var room = GridCore.getActiveRoom();

    var $popup = jQuery("<div>").addClass("tl-settings-popup");

    // Edit option (only when realTime is false and not currently editing)
    if (cfg.realTime === false && !GridCore.isEditing()) {
      var $editOpt = jQuery("<button>")
        .addClass("tl-settings-option")
        .html('<i class="fa-solid fa-pen"></i><span>Edit Layout</span>')
        .on("click", function () {
          _closeSettingsPopup();
          _handleEdit();
        });
      $popup.append($editOpt);
    }

    // Delete room option (only if more than 1 room in active layer)
    var rooms = GridCore.getRooms();
    if (rooms.length > 1 && room) {
      var $deleteOpt = jQuery("<button>")
        .addClass("tl-settings-option tl-settings-option--danger")
        .html('<i class="fa-solid fa-trash-can"></i><span>Delete Room</span>')
        .on("click", function () {
          _closeSettingsPopup();
          _confirmDeleteRoom(room);
        });
      $popup.append($deleteOpt);
    }

    $anchor.append($popup);
    _$settingsPopup = $popup;

    setTimeout(function () { $popup.addClass("tl-settings-popup--open"); }, 10);
  }

  function _handleEdit() {
    GridCore.enterEditMode();
    _renderEditControls();
    GridLayers.renderTabs();
    GridRooms.renderTabs();
    _setEditableState(true);
    jQuery(".tl-root").removeClass("tl-view-mode").addClass("tl-edit-mode");
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  function _handleSave() {
    deactivate();
    GridCore.saveEdit();
    _renderEditControls();
    GridLayers.renderTabs();
    GridRooms.renderTabs();
    _setEditableState(false);
    jQuery(".tl-root").removeClass("tl-edit-mode").addClass("tl-view-mode");
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
    var cfg = GridCore.getConfig();
    if (typeof cfg.onLayoutChange === "function") cfg.onLayoutChange(GridCore.getLayout());
    if (typeof cfg.onRoomChange === "function")
      cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
  }

  function _handleDiscard() {
    deactivate();
    GridCore.discardEdit();
    _renderEditControls();
    GridLayers.renderTabs();
    GridRooms.renderTabs();
    _setEditableState(false);
    var room = GridCore.getActiveRoom();
    _refreshRoomDisplay(room);
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
    if (cfg.realTime === false && !GridCore.isEditing()) return;
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

    // ── Pinch-to-zoom (touch) ──────────────────────
    var _pinchStartDist = null;
    var _pinchStartZoom = null;

    jQuery("#" + cfg.containerId).on("touchstart.tl-zoom", function (e) {
      if (e.originalEvent.touches.length === 2) {
        var t1 = e.originalEvent.touches[0];
        var t2 = e.originalEvent.touches[1];
        _pinchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        _pinchStartZoom = _zoom;
      }
    });

    jQuery("#" + cfg.containerId).on("touchmove.tl-zoom", function (e) {
      if (e.originalEvent.touches.length === 2 && _pinchStartDist) {
        e.preventDefault();
        var t1 = e.originalEvent.touches[0];
        var t2 = e.originalEvent.touches[1];
        var dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        var scale = dist / _pinchStartDist;
        applyZoom(_pinchStartZoom * scale);
      }
    });

    jQuery("#" + cfg.containerId).on("touchend.tl-zoom touchcancel.tl-zoom", function (e) {
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
  var _touchDragId = null;
  var _touchStartPos = null;
  var _touchMoved = false;
  var _touchTimer = null;
  var _touchReady = false;
  var _dragTouchMoveHandler = null;

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
        if (cfg.realTime === false && !GridCore.isEditing()) return;
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

    // ── Touch: table drag (long-press to initiate) ─
    jQuery(document).on("touchstart.tl", gridSel + " .tl-table-card", function (e) {
      if (cfg.editMode !== false && !GridCore.isEditing()) return;
      if (GridToolbar.getActive()) return;
      if (e.originalEvent.touches.length !== 1) return;
      var touch = e.originalEvent.touches[0];
      _touchDragId = jQuery(this).data("table-id");
      _touchStartPos = { x: touch.clientX, y: touch.clientY };
      _touchMoved = false;
      _touchReady = false;

      clearTimeout(_touchTimer);
      _touchTimer = setTimeout(function () {
        if (!_touchDragId) return;
        _touchReady = true;
        jQuery('[data-table-id="' + _touchDragId + '"]').css("opacity", "0.25");
        if (cfg.trashZone) jQuery(trashSel).addClass("tl-trash-zone--visible");
      }, 300);

      _dragTouchMoveHandler = function (te) {
        if (!_touchDragId) return;
        if (te.touches.length !== 1) return;
        var tc = te.touches[0];

        if (!_touchReady) {
          var dx = tc.clientX - _touchStartPos.x;
          var dy = tc.clientY - _touchStartPos.y;
          if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
            clearTimeout(_touchTimer);
            _touchDragId = null;
            document.removeEventListener("touchmove", _dragTouchMoveHandler);
            _dragTouchMoveHandler = null;
          }
          return;
        }

        te.preventDefault();
        _touchMoved = true;
        var t = GridCore.tableById(_touchDragId);
        if (!t) return;
        var pos = GridCore.cursorToGrid(tc.clientX, tc.clientY);
        var bad = GridCore.hasCollision(pos.col, pos.row, t.colSpan, t.rowSpan, t.id);
        _showGhost(pos.col, pos.row, t.colSpan, t.rowSpan, bad);

        if (cfg.trashZone) {
          var trashEl = jQuery(trashSel)[0];
          if (trashEl) {
            var trashRect = trashEl.getBoundingClientRect();
            var overTrash = tc.clientX >= trashRect.left && tc.clientX <= trashRect.right &&
                            tc.clientY >= trashRect.top && tc.clientY <= trashRect.bottom;
            jQuery(trashSel).toggleClass("tl-trash-zone--active", overTrash);
          }
        }
      };
      document.addEventListener("touchmove", _dragTouchMoveHandler, { passive: false });
    });

    jQuery(document).on("touchend.tl", function (e) {
      clearTimeout(_touchTimer);
      if (_dragTouchMoveHandler) {
        document.removeEventListener("touchmove", _dragTouchMoveHandler);
        _dragTouchMoveHandler = null;
      }
      if (!_touchDragId) return;
      var id = _touchDragId;
      _touchDragId = null;

      jQuery('[data-table-id="' + id + '"]').css("opacity", "");
      _removeGhost();
      if (cfg.trashZone) jQuery(trashSel).removeClass("tl-trash-zone--visible tl-trash-zone--active");

      if (!_touchMoved) return;

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
            jQuery('[data-table-id="' + id + '"]').remove();
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
      jQuery('[data-table-id="' + t.id + '"]').replaceWith(GridRender.buildTableCard(t));

      if (cfg.swapAnimation) {
        jQuery('[data-table-id="' + t.id + '"]').addClass("tl-swap-animate");
        setTimeout(function () {
          jQuery('[data-table-id="' + t.id + '"]').removeClass("tl-swap-animate");
        }, 280);
      }

      GridEvents.emit("table:moved", { from: from, to: { col: pos.col, row: pos.row } });
      if (typeof cfg.onSwap === "function")
        cfg.onSwap(from, { col: pos.col, row: pos.row }, GridCore.getLayout());
      if (typeof cfg.onLayoutChange === "function" && !(cfg.editMode !== false && GridCore.isEditing()))
        cfg.onLayoutChange(GridCore.getLayout());
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
      if (typeof cfg.onLayoutChange === "function" && !(cfg.realTime === false && GridCore.isEditing())) cfg.onLayoutChange(GridCore.getLayout());
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
      if (typeof cfg.onLayoutChange === "function" && !(cfg.realTime === false && GridCore.isEditing()))
        cfg.onLayoutChange(GridCore.getLayout());

      _dragId = null;
    });
  }

  function unbind() {
    clearTimeout(_touchTimer);
    if (_dragTouchMoveHandler) {
      document.removeEventListener("touchmove", _dragTouchMoveHandler);
      _dragTouchMoveHandler = null;
    }
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
  var _placeTouchMoveHandler = null;

  function bind() {
    var cfg = GridCore.getConfig();
    var gridSel = "#" + cfg.containerId + " .tl-layout-grid";

    jQuery(document).on("mousedown.tl", gridSel + " .tl-cell", function (e) {
      if (cfg.realTime === false && !GridCore.isEditing()) return;
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

    // ── Touch: shape drawing ───────────────────────
    jQuery(document).on("touchstart.tl", gridSel + " .tl-cell", function (e) {
      if (cfg.editMode !== false && !GridCore.isEditing()) return;
      if (!GridToolbar.getActive()) return;
      if (e.originalEvent.touches.length !== 1) return;
      e.preventDefault();
      var touch = e.originalEvent.touches[0];
      var $cell = jQuery(document.elementFromPoint(touch.clientX, touch.clientY)).closest(".tl-cell");
      if (!$cell.length) return;
      _start = {
        col: parseInt($cell.data("col")),
        row: parseInt($cell.data("row")),
      };

      _placeTouchMoveHandler = function (te) {
        if (!_start) return;
        if (te.touches.length !== 1) return;
        te.preventDefault();
        var tc = te.touches[0];
        var end = GridCore.cursorToGrid(tc.clientX, tc.clientY);
        var span = GridCore.calcSpan(_start, end, GridToolbar.getActive());
        var bad = GridCore.hasCollision(span.col, span.row, span.colSpan, span.rowSpan, null);
        _showGhost(span.col, span.row, span.colSpan, span.rowSpan, bad);
      };
      document.addEventListener("touchmove", _placeTouchMoveHandler, { passive: false });
    });

    jQuery(document).on("touchend.tl", function (e) {
      if (_placeTouchMoveHandler) {
        document.removeEventListener("touchmove", _placeTouchMoveHandler);
        _placeTouchMoveHandler = null;
      }
      if (!GridToolbar.getActive() || !_start) return;
      var touch = e.originalEvent.changedTouches[0];
      var end = GridCore.cursorToGrid(touch.clientX, touch.clientY);
      var span = GridCore.calcSpan(_start, end, GridToolbar.getActive());
      _removeGhost();
      _start = null;
      if (GridCore.hasCollision(span.col, span.row, span.colSpan, span.rowSpan, null)) return;
      _showModal(jQuery.extend({}, span, { shape: GridToolbar.getActive() }));
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
    // Helper to update select options
    function updateTableOptions(tables) {
      $select.empty();
      var filter = $search.val() ? $search.val().toLowerCase() : '';
      tables.filter(function(t) {
        return !filter || t.TableName.toLowerCase().includes(filter);
      }).forEach(function (t, i) {
        const allLayers = GridCore.getAllLayersLayout();
        if(allLayers.some(layer => layer.rooms.some(room => room.tables.some(tbl => tbl.id === t.TableId)))) return; // Skip tables already in any room
        $select.append(
          jQuery('<option>')
            .val(i)
            .text(t.TableName + " (" + t.Capacity + " seats)")
        );
      });
      if (tablesLoading) {
        $spinner.show();
      } else {
        $spinner.hide();
      }
    }

    $search.on('input', function() {
      updateTableOptions(defaultTables);
    });

    if (typeof cfg.newTable.tables === 'function') {
      tablesLoading = true;
      updateTableOptions([]);
      $spinner.show();
      tablesPromise = Promise.resolve(cfg.newTable.tables());
      tablesPromise.then(function (result) {
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

    // Add select field for tables (always show, may be loading)
    $modal.append(_field("Copy from existing table", $tablesWrap));

    // $modal.append(jQuery("<hr>"));

    var $name = jQuery("<input>")
      .attr({ type: "text", placeholder: "Table name", maxlength: 30 })
      .val(nextName);
    // $modal.append(_field("Name", $name));

    // var $seats = jQuery("<input>")
    //   .attr({ type: "number", min: 1, max: 50 })
    //   .val(cfg.newTable.defaultSeats || 4);
    var $status = jQuery("<select>");
    jQuery.each(cfg.statusColors, function (s) {
      $status.append(
        jQuery("<option>")
          .val(s)
          .text(s.charAt(0).toUpperCase() + s.slice(1)),
      );
    });
    $status.val(cfg.newTable.defaultStatus || "available");

    // Update header shape color when status changes
    $status.on("change", function () {
      var newColor = cfg.statusColors[jQuery(this).val()] || "#6b7280";
      $modal.find(".tl-modal-preview").css("background", newColor);
    });

    // $modal.append(
    //   jQuery("<div>")
    //     .addClass("tl-field-row")
    //     .append(_field("Seats", $seats), _field("Status", $status)),
    // );

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

        $err.hide();
        var table = defaultTables[$select.val()];

        _commit({
          id: table ? table.TableId : null,
          name: table ? table.TableName : $name.val() || nextName,
          seats: parseInt(table ? table.Capacity : $seats.val()) || 4,
          status: table ? table.Status.toLowerCase() : $status.val(),
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
      id: details.id || "T" + Date.now(),
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
    if (typeof cfg.onLayoutChange === "function" && !(cfg.realTime === false && GridCore.isEditing()))
      cfg.onLayoutChange(GridCore.getLayout());

    _pending = null;
    GridToolbar.deactivate();
  }

  function unbind() {
    if (_placeTouchMoveHandler) {
      document.removeEventListener("touchmove", _placeTouchMoveHandler);
      _placeTouchMoveHandler = null;
    }
    jQuery(document).off(".tl");
  }

  return { bind: bind, unbind: unbind };
})();


/* src/modules/GridRooms.js */
/**
 * GridRooms.js
 * Room switcher UI — floating side panel that lets users create and switch
 * between rooms within the active layer.
 * Only active when cfg.layers is defined.
 *
 * Public API (called by TableLayout):
 *   GridRooms.build()  — returns the floating panel jQuery element
 */
var GridRooms = (function () {
  var _$wrap = null;
  var _$activePreview = null;
  var _hoverTimer = null;
  var _$roomTabBar = null;

  // ── Public: build wrapper (button + slide-down panel) ─────────

  function build() {
    var cfg = GridCore.getConfig();
    if (cfg.roomStyle === "simple") return null;
    return _buildGenshinPanel();
  }
  function _buildGenshinPanel() {
    _$wrap = jQuery("<div>").addClass("tl-rooms-wrap");

    var $btn = jQuery("<button>")
      .addClass("tl-rooms-btn tl-rooms-btn--active")
      .attr("title", "Switch Room")
      .html('<i class="fa-solid fa-door-open"></i>')
      .on("click", function (e) {
        e.stopPropagation();
        var isOpen = _$wrap.find(".tl-rooms-panel").hasClass("tl-rooms-panel--open");
        if (isOpen) {
          _closePanel();
        } else {
          _openPanel();
        }
      });

    var $panel = _buildPanel();
    $panel.addClass("tl-rooms-panel--open");

    _$wrap.append($btn);
    _$wrap.append($panel);

    // Re-render panel when rooms change
    var _refreshPanel = function () {
      var $p = _$wrap.find(".tl-rooms-panel");
      if ($p.length) _renderPanelContent($p);
    };
    GridEvents.on("room:updated", _refreshPanel);
    GridEvents.on("room:deleted", _refreshPanel);
    GridEvents.on("room:reordered", _refreshPanel);
    GridEvents.on("room:switched", _refreshPanel);
    // Also refresh when layer switches (new set of rooms)
    GridEvents.on("layer:switched", _refreshPanel);

    return _$wrap;
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
    if (!_$wrap) return;
    var $panel = _$wrap.find(".tl-rooms-panel");
    _renderPanelContent($panel);
    $panel.addClass("tl-rooms-panel--open");
    _$wrap.find(".tl-rooms-btn").addClass("tl-rooms-btn--active");
  }

  function _closePanel() {
    if (!_$wrap) return;
    _$wrap.find(".tl-rooms-panel").removeClass("tl-rooms-panel--open");
    _$wrap.find(".tl-rooms-btn").removeClass("tl-rooms-btn--active");
  }

  // ── Room item ─────────────────────────────────────

  function _showPreview(room, $item) {
    var cfg = GridCore.getConfig();
    if (cfg.roomPreview === false) return;
    _hidePreview();
    _$activePreview = _buildRoomPreview(room);
    _$wrap.append(_$activePreview);

    var wrapOffset = _$wrap.offset();
    var itemOffset = $item.offset();
    var itemH = $item.outerHeight();
    var topPos = itemOffset.top - wrapOffset.top + itemH / 2;
    _$activePreview.css({ top: topPos + "px" });

    setTimeout(function () {
      if (_$activePreview) _$activePreview.addClass("tl-room-preview-popup--visible");
    }, 10);
  }

  function _hidePreview() {
    if (_$activePreview) {
      _$activePreview.remove();
      _$activePreview = null;
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

    var $item = jQuery("<div>")
      .addClass("tl-rooms-item" + (isActive ? " tl-rooms-item--active" : ""))
      .attr({ "title": room.label, "data-room-id": room.id, "draggable": "true" })
      .on("mouseenter", function () {
        var self = this;
        clearTimeout(_hoverTimer);
        _hoverTimer = setTimeout(function () { _showPreview(room, jQuery(self)); }, 500);
      })
      .on("mouseleave", function () {
        clearTimeout(_hoverTimer);
        _hidePreview();
      })
      .on("click", function () {
        if (isActive) return;
        if (cfg.editMode !== false && GridCore.isEditing()) return;
        GridCore.switchRoom(room.id);
        _rebuildGrid();
        var $panel = _$wrap.find(".tl-rooms-panel");
        _renderPanelContent($panel);
        if (typeof cfg.onRoomChange === "function")
          cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
      });

    // Drag-to-reorder events
    $item.on("dragstart", function (e) {
      if (cfg.editMode !== false && !GridCore.isEditing()) { e.preventDefault(); return; }
      e.originalEvent.dataTransfer.effectAllowed = "move";
      e.originalEvent.dataTransfer.setData("text/plain", room.id);
      $item.addClass("tl-rooms-item--dragging");
    });
    $item.on("dragend", function () {
      $item.removeClass("tl-rooms-item--dragging");
      _$wrap.find(".tl-rooms-item--drag-over").removeClass("tl-rooms-item--drag-over");
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
      var $panel = _$wrap.find(".tl-rooms-panel");
      _renderPanelContent($panel);
      if (cfg.editMode === false && typeof cfg.onLayoutChange === "function")
        cfg.onLayoutChange(GridCore.getLayout());
    });

    // Touch-to-reorder events (long press)
    var _touchTimer = null;
    var _touchDragging = false;
    $item.on("touchstart", function (e) {
      if (cfg.editMode !== false && !GridCore.isEditing()) return;
      if (e.originalEvent.touches.length !== 1) return;
      _touchDragging = false;
      _touchTimer = setTimeout(function () {
        _touchDragging = true;
        $item.addClass("tl-rooms-item--dragging");
      }, 400);
    });
    $item.on("touchmove", function (e) {
      if (!_touchDragging) { clearTimeout(_touchTimer); return; }
      e.preventDefault();
      var touch = e.originalEvent.touches[0];
      var el = document.elementFromPoint(touch.clientX, touch.clientY);
      var $target = jQuery(el).closest(".tl-rooms-item");
      _$wrap.find(".tl-rooms-item--drag-over").removeClass("tl-rooms-item--drag-over");
      if ($target.length && $target.data("room-id") !== room.id) {
        $target.addClass("tl-rooms-item--drag-over");
      }
    });
    $item.on("touchend touchcancel", function (e) {
      clearTimeout(_touchTimer);
      if (!_touchDragging) return;
      _touchDragging = false;
      $item.removeClass("tl-rooms-item--dragging");
      _$wrap.find(".tl-rooms-item--drag-over").removeClass("tl-rooms-item--drag-over");

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
      var $panel = _$wrap.find(".tl-rooms-panel");
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

    var $addBtn = jQuery("<button>")
      .addClass("tl-rooms-add-submit")
      .html('<i class="fa-solid fa-plus"></i>')
      .on("click", function () {
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
    jQuery(".tl-root").first().append($overlay);

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
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  // ═══════════════════════════════════════════════════
  // ── Simple tab bar mode ────────────────────────────
  // ═══════════════════════════════════════════════════

  function buildTabBar() {
    _$roomTabBar = jQuery("<div>").addClass("tl-room-tab-bar");

    var $scrollLeft = jQuery("<button>")
      .addClass("tl-room-tab-scroll tl-room-tab-scroll--left")
      .attr("title", "Scroll left")
      .html('<i class="fa-solid fa-chevron-left"></i>')
      .on("click", function () {
        var $area = _$roomTabBar.find(".tl-room-tab-scroll-area");
        $area.scrollLeft($area.scrollLeft() - 120);
      });

    var $scrollArea = jQuery("<div>").addClass("tl-room-tab-scroll-area");

    var $scrollRight = jQuery("<button>")
      .addClass("tl-room-tab-scroll tl-room-tab-scroll--right")
      .attr("title", "Scroll right")
      .html('<i class="fa-solid fa-chevron-right"></i>')
      .on("click", function () {
        var $area = _$roomTabBar.find(".tl-room-tab-scroll-area");
        $area.scrollLeft($area.scrollLeft() + 120);
      });

    // Add-tab button (always visible, outside scroll area)
    var $addTab = jQuery("<div>")
      .addClass("tl-room-tab-add")
      .attr("title", "Add Room")
      .html('<i class="fa-solid fa-plus"></i>')
      .on("click", function () {
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

    _$roomTabBar.append($scrollLeft, $scrollArea, $scrollRight, $addTab);
    _renderRoomTabs();
    _updateScrollButtons();

    // Update scroll button visibility on scroll
    $scrollArea.on("scroll", function () { _updateScrollButtons(); });

    GridEvents.on("room:added", function () { _renderRoomTabs(); });
    GridEvents.on("room:deleted", function () { _renderRoomTabs(); });
    GridEvents.on("room:reordered", function () { _renderRoomTabs(); });
    GridEvents.on("room:updated", function () { _renderRoomTabs(); });
    GridEvents.on("room:switched", function () { _renderRoomTabs(); });
    GridEvents.on("layer:switched", function () { _renderRoomTabs(); });

    return _$roomTabBar;
  }

  function _updateScrollButtons() {
    if (!_$roomTabBar) return;
    var $area = _$roomTabBar.find(".tl-room-tab-scroll-area");
    if (!$area.length) return;
    var el = $area[0];
    var canScrollLeft = el.scrollLeft > 1;
    var canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    _$roomTabBar.find(".tl-room-tab-scroll--left").toggleClass("tl-room-tab-scroll--visible", canScrollLeft);
    _$roomTabBar.find(".tl-room-tab-scroll--right").toggleClass("tl-room-tab-scroll--visible", canScrollRight);
  }

  function _renderRoomTabs() {
    if (!_$roomTabBar) return;
    var $scrollArea = _$roomTabBar.find(".tl-room-tab-scroll-area");
    if (!$scrollArea.length) return;
    $scrollArea.empty();

    var cfg = GridCore.getConfig();
    var rooms = GridCore.getRooms();
    var activeId = GridCore.getActiveRoomId();

    jQuery.each(rooms, function (_, room) {
      var isActive = room.id === activeId;
      var $tab = jQuery("<div>")
        .addClass("tl-room-tab" + (isActive ? " tl-room-tab--active" : ""))
        .attr({ "data-room-id": room.id, "draggable": "true" });

      var $icon = _buildRoomTabIcon(room);
      var $label = jQuery("<span>").addClass("tl-room-tab-label").text(room.label);
      $tab.append($icon, $label);

      // Close button (only if more than 1 room, in edit mode)
      if (rooms.length > 1 && cfg.realTime === false && GridCore.isEditing()) {
        var $close = jQuery("<span>")
          .addClass("tl-room-tab-close")
          .html("&times;")
          .on("click", function (e) {
            e.stopPropagation();
            if (cfg.realTime === false && !GridCore.isEditing()) return;
            _confirmDeleteRoomTab(room);
          });
        $tab.append($close);
      }

      // Click to switch room
      $tab.on("click", function () {
        if (isActive) return;
        if (cfg.realTime === false && GridCore.isEditing()) return;
        GridCore.switchRoom(room.id);
        _rebuildGrid();
        if (typeof cfg.onRoomChange === "function")
          cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
      });

      // Drag-to-reorder
      $tab.on("dragstart", function (e) {
        if (cfg.realTime === false && !GridCore.isEditing()) { e.preventDefault(); return; }
        e.originalEvent.dataTransfer.effectAllowed = "move";
        e.originalEvent.dataTransfer.setData("text/plain", room.id);
        $tab.addClass("tl-room-tab--dragging");
      });
      $tab.on("dragend", function () {
        $tab.removeClass("tl-room-tab--dragging");
        _$roomTabBar.find(".tl-room-tab--drag-over").removeClass("tl-room-tab--drag-over");
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
    var $label = $tab.find(".tl-room-tab-label");
    var $input = jQuery("<input>")
      .addClass("tl-room-tab-rename-input")
      .attr({ type: "text", maxlength: 30 })
      .val(room.label);
    $label.replaceWith($input);
    $input.trigger("focus").trigger("select");

    function commit() {
      var val = jQuery.trim($input.val());
      if (val && val !== room.label) {
        GridCore.updateRoomMeta(room.id, { label: val });
      }
      _renderRoomTabs();
    }

    $input.on("blur", commit);
    $input.on("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); $input.trigger("blur"); }
      if (e.key === "Escape") { _renderRoomTabs(); }
    });
    $input.on("click", function (e) { e.stopPropagation(); });
  }

  function _confirmDeleteRoomTab(room) {
    var cfg = GridCore.getConfig();
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
        var wasActive = (room.id === GridCore.getActiveRoomId());
        GridCore.deleteRoom(room.id);
        if (wasActive) _rebuildGrid();
        if (typeof cfg.onRoomChange === "function")
          cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
      });
    $actions.append($cancel, $confirm);
    $modal.append($actions);
    $overlay.append($modal);
    jQuery(".tl-root").first().append($overlay);
    $overlay.on("click", function (e) { if (jQuery(e.target).is($overlay)) $overlay.remove(); });
  }

  return { build: build, buildTabBar: buildTabBar, renderTabs: renderTabs };
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
    GridPlace.bind();
    GridZoom.bindWheelZoom();

    // ── Wire internal events to user callbacks ─────
    GridEvents.on("zoom:changed", function (level) {
      if (typeof cfg.onZoom === "function") cfg.onZoom(level);
    });
    // Layer events
    GridEvents.on("layer:switched", function (layer) {
      if (typeof cfg.onLayerChange === "function")
        cfg.onLayerChange(layer, GridCore.getAllLayersLayout());
    });
    GridEvents.on("layer:updated", function (layer) {
      if (typeof cfg.onLayerChange === "function" && !(cfg.realTime === false && GridCore.isEditing()))
        cfg.onLayerChange(layer, GridCore.getAllLayersLayout());
    });
    GridEvents.on("layer:deleted", function (removed) {
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
      if (typeof cfg.onRoomChange === "function")
        cfg.onRoomChange(room, GridCore.getLayout());
    });
    GridEvents.on("room:updated", function (room) {
      if (typeof cfg.onRoomChange === "function" && !(cfg.realTime === false && GridCore.isEditing()))
        cfg.onRoomChange(room, GridCore.getLayout());
    });
    GridEvents.on("room:deleted", function (removed) {
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
        return GridCore.deleteLayer(id);
      },
      reorderLayers: function (orderedIds) {
        return GridCore.reorderLayers(orderedIds);
      },
      getAllLayersLayout: function () {
        return GridCore.getAllLayersLayout();
      },

      // Rooms
      getRooms: function () {
        return GridCore.getRooms();
      },
      getActiveRoom: function () {
        return GridCore.getActiveRoom();
      },
      switchRoom: function (id) {
        if (GridCore.switchRoom(id)) {
          jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
        }
      },
      addRoom: function (details) {
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
        return GridCore.deleteRoom(id);
      },
      reorderRooms: function (orderedIds) {
        return GridCore.reorderRooms(orderedIds);
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
