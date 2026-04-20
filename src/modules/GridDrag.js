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
