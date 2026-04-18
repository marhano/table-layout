/**
 * GridMultiSelect.js
 * Multi-select tool: drag a marquee rectangle on the grid to select
 * tables, then drag the group or drop onto trash zone to delete.
 * Click on empty grid space to deselect all.
 */
var GridMultiSelect = (function () {
  var _active = false;       // tool is toggled on
  var _selected = [];        // array of selected table IDs

  // ── Marquee state ──
  var _marquee = false;      // currently drawing marquee
  var _marqueeStart = null;  // { x, y } client coords
  var _$marquee = null;      // jQuery element for the marquee rectangle

  // ── Group-drag state ──
  var _dragging = false;
  var _dragAnchor = null;
  var _offsets = [];
  var _$ghosts = [];

  // ── Public: activate / deactivate ─────────────────

  function isActive() { return _active; }

  function activate() {
    var cfg = GridCore.getConfig();
    if (cfg.realTime === false && !GridCore.isEditing()) return;
    _active = true;
    _selected = [];
    GridToolbar.deactivate();
    jQuery(".tl-canvas").addClass("tl-multiselect-mode");
    jQuery(".tl-multiselect-tool-btn").addClass("active");
    // Disable native HTML5 drag so mousedown works for selection
    jQuery(".tl-table-card").attr("draggable", "false");
  }

  function deactivate() {
    _active = false;
    _clearSelection();
    _removeMarquee();
    jQuery(".tl-canvas").removeClass("tl-multiselect-mode");
    jQuery(".tl-multiselect-tool-btn").removeClass("active");
    // Restore native drag
    var cfg = GridCore.getConfig();
    if (cfg.draggable && (cfg.realTime !== false || GridCore.isEditing())) {
      jQuery(".tl-table-card").attr("draggable", "true");
    }
  }

  function _clearSelection() {
    _selected = [];
    jQuery(".tl-table-card").removeClass("tl-selected");
  }

  function _removeMarquee() {
    if (_$marquee) { _$marquee.remove(); _$marquee = null; }
    _marquee = false;
    _marqueeStart = null;
  }

  // ── Bind events ───────────────────────────────────

  function bind() {
    var cfg = GridCore.getConfig();
    var gridSel = "#" + cfg.containerId + " .tl-layout-grid";
    var trashSel = "#" + cfg.containerId + " .tl-trash-zone";

    // ── Mousedown on a SELECTED table card → start group drag ──
    jQuery(document).on("mousedown.tl-msel", gridSel + " .tl-table-card", function (e) {
      if (!_active) return;
      if (_dragging || _marquee) return;
      if (jQuery(e.target).closest(".tl-table-edit-btn, .tl-resize-handle").length) return;

      var id = jQuery(this).data("table-id");
      var isSelected = _selected.indexOf(id) !== -1;

      if (isSelected && _selected.length > 0) {
        // Start group drag
        e.preventDefault();
        e.stopPropagation();

        var pos = GridCore.cursorToGrid(e.clientX, e.clientY);
        _dragAnchor = { col: pos.col, row: pos.row };

        _offsets = [];
        _selected.forEach(function (sid) {
          var t = GridCore.tableById(sid);
          if (t) {
            _offsets.push({ id: sid, dCol: t.col - pos.col, dRow: t.row - pos.row, colSpan: t.colSpan, rowSpan: t.rowSpan });
          }
        });

        _dragging = true;
        _selected.forEach(function (sid) {
          jQuery('[data-table-id="' + sid + '"]').css("opacity", "0.25");
        });
        if (cfg.trashZone) jQuery(trashSel).addClass("tl-trash-zone--visible");

        jQuery(document).on("mousemove.tl-msel-drag", _onDragMove);
        jQuery(document).on("mouseup.tl-msel-drag", _onDragEnd);
        return;
      }
      // Not selected — let the event fall through to the grid handler for marquee
    });

    // ── Mousedown on grid (empty space or unselected card) → marquee or deselect ──
    jQuery(document).on("mousedown.tl-msel-grid", gridSel, function (e) {
      if (!_active) return;
      if (_dragging) return;
      if (jQuery(e.target).closest(".tl-table-edit-btn, .tl-resize-handle").length) return;

      // If click landed on a selected card the handler above handles it
      var $card = jQuery(e.target).closest(".tl-table-card");
      if ($card.length && _selected.indexOf($card.data("table-id")) !== -1) return;

      e.preventDefault();

      // Clear previous selection
      _clearSelection();

      // Start marquee
      _marquee = true;
      _marqueeStart = { x: e.clientX, y: e.clientY };

      // Create the visual marquee element inside the grid
      var gridEl = jQuery(gridSel)[0];
      var gridRect = gridEl.getBoundingClientRect();
      _$marquee = jQuery("<div class='tl-marquee-rect'></div>");
      _$marquee.css({
        left: (e.clientX - gridRect.left) + "px",
        top: (e.clientY - gridRect.top) + "px",
        width: "0px",
        height: "0px"
      });
      jQuery(gridSel).append(_$marquee);

      jQuery(document).on("mousemove.tl-msel-marquee", function (ev) {
        if (!_marquee) return;
        var x1 = Math.min(_marqueeStart.x, ev.clientX);
        var y1 = Math.min(_marqueeStart.y, ev.clientY);
        var x2 = Math.max(_marqueeStart.x, ev.clientX);
        var y2 = Math.max(_marqueeStart.y, ev.clientY);
        var gr = gridEl.getBoundingClientRect();
        _$marquee.css({
          left: (x1 - gr.left) + "px",
          top: (y1 - gr.top) + "px",
          width: (x2 - x1) + "px",
          height: (y2 - y1) + "px"
        });
      });

      jQuery(document).on("mouseup.tl-msel-marquee", function (ev) {
        jQuery(document).off("mousemove.tl-msel-marquee mouseup.tl-msel-marquee");
        if (!_marquee) return;

        var x1 = Math.min(_marqueeStart.x, ev.clientX);
        var y1 = Math.min(_marqueeStart.y, ev.clientY);
        var x2 = Math.max(_marqueeStart.x, ev.clientX);
        var y2 = Math.max(_marqueeStart.y, ev.clientY);

        _removeMarquee();

        // If marquee is tiny (just a click), treat as deselect
        if (Math.abs(x2 - x1) < 5 && Math.abs(y2 - y1) < 5) {
          _clearSelection();
          return;
        }

        // Find all tables whose card DOM rectangles intersect the marquee
        _selected = [];
        var tables = GridCore.getTables();
        tables.forEach(function (t) {
          var $el = jQuery('[data-table-id="' + t.id + '"]');
          if (!$el.length) return;
          var r = $el[0].getBoundingClientRect();
          // Check overlap
          if (r.right > x1 && r.left < x2 && r.bottom > y1 && r.top < y2) {
            _selected.push(t.id);
            $el.addClass("tl-selected");
          }
        });
      });
    });
  }

  // ── Group drag move ───────────────────────────────

  function _onDragMove(e) {
    if (!_dragging) return;
    var pos = GridCore.cursorToGrid(e.clientX, e.clientY);
    _removeGhosts();

    var cfg = GridCore.getConfig();
    var allIds = _selected.slice();

    _offsets.forEach(function (o) {
      var c = pos.col + o.dCol;
      var r = pos.row + o.dRow;
      var bad = GridCore.hasCollision(c, r, o.colSpan, o.rowSpan, allIds);
      var $g = GridRender.buildDragGhost(c, r, o.colSpan, o.rowSpan, bad);
      jQuery(".tl-layout-grid").append($g);
      _$ghosts.push($g);
    });

    // Trash hover
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
    jQuery(document).off("mousemove.tl-msel-drag mouseup.tl-msel-drag");
    if (!_dragging) return;
    _dragging = false;

    var cfg = GridCore.getConfig();
    var trashSel = "#" + cfg.containerId + " .tl-trash-zone";

    _removeGhosts();

    // Restore opacity
    _selected.forEach(function (sid) {
      jQuery('[data-table-id="' + sid + '"]').css("opacity", "");
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
          _selected.forEach(function (sid) {
            jQuery('[data-table-id="' + sid + '"]').remove();
            GridCore.removeTable(sid);
          });
          _selected = [];
          jQuery(".tl-table-card").removeClass("tl-selected");
          if (typeof cfg.onLayoutChange === "function" && !(cfg.realTime === false && GridCore.isEditing()))
            cfg.onLayoutChange(GridCore.getLayout());
          return;
        }
      }
    }

    // ── Validate all new positions ──
    var allIds = _selected.slice();
    var moves = [];
    var anyBad = false;

    _offsets.forEach(function (o) {
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
      jQuery('[data-table-id="' + m.id + '"]').replaceWith($new);
    });

    if (typeof cfg.onLayoutChange === "function" && !(cfg.realTime === false && GridCore.isEditing()))
      cfg.onLayoutChange(GridCore.getLayout());
  }

  function _removeGhosts() {
    _$ghosts.forEach(function ($g) { $g.remove(); });
    _$ghosts = [];
  }

  function unbind() {
    jQuery(document).off(".tl-msel").off(".tl-msel-drag").off(".tl-msel-grid").off(".tl-msel-marquee");
    _active = false;
    _selected = [];
    _dragging = false;
    _marquee = false;
    _$ghosts = [];
    _removeMarquee();
  }

  return {
    bind: bind,
    unbind: unbind,
    isActive: isActive,
    activate: activate,
    deactivate: deactivate,
  };
})();
