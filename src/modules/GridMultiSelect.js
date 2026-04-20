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
