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
