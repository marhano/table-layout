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

  function isEditing() { return _editMode; }

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
