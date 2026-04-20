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
