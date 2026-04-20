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
