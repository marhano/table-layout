var GridDrag = (function () {
  var _dragId = null;
  var _$ghost = null;

  function bind() {
    var cfg = GridCore.getConfig();
    var gridSel = "#" + cfg.containerId + " .tl-layout-grid";
    var canvasSel = "#" + cfg.containerId + " .tl-canvas";

    var trashSel = "#" + cfg.containerId + " .tl-trash-zone";

    jQuery(document).on(
      "dragstart.tl",
      gridSel + " .tl-table-card",
      function (e) {
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
      if (typeof cfg.onLayoutChange === "function") cfg.onLayoutChange(GridCore.getLayout());
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
      if (typeof cfg.onLayoutChange === "function")
        cfg.onLayoutChange(GridCore.getLayout());

      _dragId = null;
    });
  }

  function unbind() {
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
