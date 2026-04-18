/**
 * GridResize.js
 * Resize handles for placed table cards.
 * Supports mouse and touch dragging on east, south, and south-east handles.
 */
var GridResize = (function () {
  var _resizing = false;
  var _tableId = null;
  var _dir = null;
  var _origTable = null;
  var _$ghost = null;
  var _touchMoveHandler = null;

  function bind() {
    var cfg = GridCore.getConfig();
    var gridSel = "#" + cfg.containerId + " .tl-layout-grid";

    // ── Mouse ──────────────────────────────────────
    jQuery(document).on("mousedown.tl-resize", gridSel + " .tl-resize-handle", function (e) {
      if (cfg.realTime === false && !GridCore.isEditing()) return;
      e.preventDefault();
      e.stopPropagation();
      _startResize(jQuery(this), e.clientX, e.clientY);
      jQuery(document).on("mousemove.tl-resize", _onMouseMove);
      jQuery(document).on("mouseup.tl-resize", _onMouseUp);
    });

    // ── Touch ──────────────────────────────────────
    jQuery(document).on("touchstart.tl-resize", gridSel + " .tl-resize-handle", function (e) {
      if (cfg.realTime === false && !GridCore.isEditing()) return;
      if (e.originalEvent.touches.length !== 1) return;
      e.preventDefault();
      e.stopPropagation();
      var touch = e.originalEvent.touches[0];
      _startResize(jQuery(this), touch.clientX, touch.clientY);

      _touchMoveHandler = function (te) {
        if (te.touches.length !== 1) return;
        te.preventDefault();
        _onMove(te.touches[0].clientX, te.touches[0].clientY);
      };
      document.addEventListener("touchmove", _touchMoveHandler, { passive: false });
      jQuery(document).on("touchend.tl-resize", _onTouchEnd);
    });
  }

  function _startResize($handle, clientX, clientY) {
    _dir = $handle.attr("data-resize-dir");
    var $card = $handle.closest(".tl-table-card");
    _tableId = $card.data("table-id");
    var t = GridCore.tableById(_tableId);
    if (!t) return;
    _origTable = { col: t.col, row: t.row, colSpan: t.colSpan, rowSpan: t.rowSpan };
    _resizing = true;
    $card.addClass("tl-resizing");
  }

  function _onMouseMove(e) {
    if (!_resizing) return;
    _onMove(e.clientX, e.clientY);
  }

  function _onMove(clientX, clientY) {
    if (!_resizing || !_tableId) return;
    var cfg = GridCore.getConfig();
    var t = GridCore.tableById(_tableId);
    if (!t) return;

    var pos = GridCore.cursorToGrid(clientX, clientY);
    var newColSpan = _origTable.colSpan;
    var newRowSpan = _origTable.rowSpan;
    var shapeDef = (cfg.shapes || {})[t.shape] || {};
    var minC = shapeDef.minCols || 1;
    var minR = shapeDef.minRows || 1;

    if (_dir === "e" || _dir === "se") {
      newColSpan = Math.max(minC, pos.col - _origTable.col + 1);
    }
    if (_dir === "s" || _dir === "se") {
      newRowSpan = Math.max(minR, pos.row - _origTable.row + 1);
    }

    if (shapeDef.preferSquare) {
      var side = Math.max(newColSpan, newRowSpan);
      newColSpan = side;
      newRowSpan = side;
    }

    var bad = GridCore.hasCollision(_origTable.col, _origTable.row, newColSpan, newRowSpan, _tableId);
    _showGhost(_origTable.col, _origTable.row, newColSpan, newRowSpan, bad);
  }

  function _onMouseUp() {
    jQuery(document).off("mousemove.tl-resize mouseup.tl-resize");
    _endResize();
  }

  function _onTouchEnd() {
    if (_touchMoveHandler) {
      document.removeEventListener("touchmove", _touchMoveHandler);
      _touchMoveHandler = null;
    }
    jQuery(document).off("touchend.tl-resize");
    _endResize();
  }

  function _endResize() {
    if (!_resizing || !_tableId) { _resizing = false; return; }
    var cfg = GridCore.getConfig();

    // Read ghost span values
    var newColSpan = _origTable.colSpan;
    var newRowSpan = _origTable.rowSpan;
    if (_$ghost) {
      var gs = _$ghost.css("grid-column");
      var gr = _$ghost.css("grid-row");
      // Parse "col / span N" format
      var cm = gs && gs.match(/span\s+(\d+)/);
      var rm = gr && gr.match(/span\s+(\d+)/);
      if (cm) newColSpan = parseInt(cm[1], 10);
      if (rm) newRowSpan = parseInt(rm[1], 10);
    }

    _removeGhost();
    jQuery(".tl-resizing").removeClass("tl-resizing");

    if (!GridCore.hasCollision(_origTable.col, _origTable.row, newColSpan, newRowSpan, _tableId)) {
      GridCore.updateTable(_tableId, { colSpan: newColSpan, rowSpan: newRowSpan });
      var t = GridCore.tableById(_tableId);
      jQuery('[data-table-id="' + _tableId + '"]').replaceWith(GridRender.buildTableCard(t));

      if (typeof cfg.onLayoutChange === "function" && !(cfg.realTime === false && GridCore.isEditing()))
        cfg.onLayoutChange(GridCore.getLayout());
    }

    _resizing = false;
    _tableId = null;
    _dir = null;
    _origTable = null;
  }

  function _showGhost(col, row, colSpan, rowSpan, invalid) {
    _removeGhost();
    _$ghost = GridRender.buildPlaceGhost(col, row, colSpan, rowSpan, invalid);
    jQuery(".tl-layout-grid").append(_$ghost);
  }

  function _removeGhost() {
    if (_$ghost) { _$ghost.remove(); _$ghost = null; }
  }

  function unbind() {
    if (_touchMoveHandler) {
      document.removeEventListener("touchmove", _touchMoveHandler);
      _touchMoveHandler = null;
    }
    jQuery(document).off(".tl-resize");
    _resizing = false;
    _tableId = null;
  }

  return { bind: bind, unbind: unbind };
})();
