/**
 * GridPlace.js
 * Place new tables on the grid by selecting a shape tool and dragging.
 * Per-instance state via _TL context.
 */
var GridPlace = (function () {
  var _inst = {};

  function _c() { return _inst[_TL.cid()]; }

  function init() {
    _inst[_TL.cid()] = {
      start: null,
      $ghost: null,
      pending: null,
      placeTouchMoveHandler: null
    };
  }

  function destroy() {
    var cid = _TL.cid();
    var ctx = _inst[cid];
    if (ctx && ctx.placeTouchMoveHandler) {
      document.removeEventListener("touchmove", ctx.placeTouchMoveHandler);
    }
    jQuery(document).off(".tl-place-" + cid);
    delete _inst[cid];
  }

  function bind() {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();
    var gridSel = "#" + cfg.containerId + " .tl-layout-grid";

    jQuery(document).on("mousedown.tl-place-" + cid, gridSel + " .tl-cell", function (e) {
      _TL.use(cid);
      if (cfg.realTime === false && !GridCore.isEditing()) return;
      if (!GridToolbar.getActive() || e.which !== 1) return;
      e.preventDefault();
      var ctx = _c();
      ctx.start = {
        col: parseInt(jQuery(this).data("col")),
        row: parseInt(jQuery(this).data("row")),
      };
    });

    jQuery(document).on("mousemove.tl-place-" + cid, gridSel, function (e) {
      _TL.use(cid);
      var ctx = _c();
      if (!GridToolbar.getActive() || !ctx.start) return;
      var end = GridCore.cursorToGrid(e.originalEvent.clientX, e.originalEvent.clientY);
      var span = GridCore.calcSpan(ctx.start, end, GridToolbar.getActive());
      var bad = GridCore.hasCollision(span.col, span.row, span.colSpan, span.rowSpan, null);
      _showGhost(span.col, span.row, span.colSpan, span.rowSpan, bad);
    });

    jQuery(document).on("mouseup.tl-place-" + cid, gridSel, function (e) {
      _TL.use(cid);
      var ctx = _c();
      if (!GridToolbar.getActive() || !ctx.start || e.which !== 1) return;
      var end = GridCore.cursorToGrid(e.originalEvent.clientX, e.originalEvent.clientY);
      var span = GridCore.calcSpan(ctx.start, end, GridToolbar.getActive());
      _removeGhost();
      ctx.start = null;
      if (GridCore.hasCollision(span.col, span.row, span.colSpan, span.rowSpan, null)) return;
      _showModal(jQuery.extend({}, span, { shape: GridToolbar.getActive() }));
    });

    jQuery(document).on("mouseup.tl-place-" + cid, function (e) {
      _TL.use(cid);
      var ctx = _c();
      if (GridToolbar.getActive() && ctx.start && !jQuery(e.target).closest(gridSel).length) {
        ctx.start = null;
        _removeGhost();
      }
    });

    jQuery(document).on("keydown.tl-place-" + cid, function (e) {
      _TL.use(cid);
      if (e.key === "Escape" && GridToolbar.getActive()) GridToolbar.deactivate();
    });

    // ── Touch: shape drawing ───────────────────────
    jQuery(document).on("touchstart.tl-place-" + cid, gridSel + " .tl-cell", function (e) {
      _TL.use(cid);
      var ctx = _c();
      if (cfg.editMode !== false && !GridCore.isEditing()) return;
      if (!GridToolbar.getActive()) return;
      if (e.originalEvent.touches.length !== 1) return;
      e.preventDefault();
      var touch = e.originalEvent.touches[0];
      var $cell = jQuery(document.elementFromPoint(touch.clientX, touch.clientY)).closest(".tl-cell");
      if (!$cell.length) return;
      ctx.start = {
        col: parseInt($cell.data("col")),
        row: parseInt($cell.data("row")),
      };

      ctx.placeTouchMoveHandler = function (te) {
        _TL.use(cid);
        var ctx2 = _c();
        if (!ctx2.start) return;
        if (te.touches.length !== 1) return;
        te.preventDefault();
        var tc = te.touches[0];
        var end = GridCore.cursorToGrid(tc.clientX, tc.clientY);
        var span = GridCore.calcSpan(ctx2.start, end, GridToolbar.getActive());
        var bad = GridCore.hasCollision(span.col, span.row, span.colSpan, span.rowSpan, null);
        _showGhost(span.col, span.row, span.colSpan, span.rowSpan, bad);
      };
      document.addEventListener("touchmove", ctx.placeTouchMoveHandler, { passive: false });
    });

    jQuery(document).on("touchend.tl-place-" + cid, function (e) {
      _TL.use(cid);
      var ctx = _c();
      if (ctx.placeTouchMoveHandler) {
        document.removeEventListener("touchmove", ctx.placeTouchMoveHandler);
        ctx.placeTouchMoveHandler = null;
      }
      if (!GridToolbar.getActive() || !ctx.start) return;
      var touch = e.originalEvent.changedTouches[0];
      var end = GridCore.cursorToGrid(touch.clientX, touch.clientY);
      var span = GridCore.calcSpan(ctx.start, end, GridToolbar.getActive());
      _removeGhost();
      ctx.start = null;
      if (GridCore.hasCollision(span.col, span.row, span.colSpan, span.rowSpan, null)) return;
      _showModal(jQuery.extend({}, span, { shape: GridToolbar.getActive() }));
    });
  }

  function _showGhost(col, row, colSpan, rowSpan, invalid) {
    _removeGhost();
    var ctx = _c();
    ctx.$ghost = GridRender.buildPlaceGhost(col, row, colSpan, rowSpan, invalid);
    _TL.$(".tl-layout-grid").append(ctx.$ghost);
  }

  function _removeGhost() {
    var ctx = _c();
    if (ctx.$ghost) {
      ctx.$ghost.remove();
      ctx.$ghost = null;
    }
  }

  function _showModal(placement) {
    var ctx = _c();
    ctx.pending = placement;
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

    function updateTableOptions(tables) {
      $select.empty();
      var filter = $search.val() ? $search.val().toLowerCase() : '';
      tables.filter(function(t) {
        return !filter || t.TableName.toLowerCase().includes(filter);
      }).forEach(function (t, i) {
        const allLayers = GridCore.getAllLayersLayout();
        if(allLayers.some(layer => layer.rooms.some(room => room.tables.some(tbl => tbl.id === t.TableId)))) return;
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

    $modal.append(_field("Copy from existing table", $tablesWrap));

    var $name = jQuery("<input>")
      .attr({ type: "text", placeholder: "Table name", maxlength: 30 })
      .val(nextName);

    var $status = jQuery("<select>");
    jQuery.each(cfg.statusColors, function (s) {
      $status.append(
        jQuery("<option>")
          .val(s)
          .text(s.charAt(0).toUpperCase() + s.slice(1)),
      );
    });
    $status.val(cfg.newTable.defaultStatus || "available");

    $status.on("change", function () {
      var newColor = cfg.statusColors[jQuery(this).val()] || "#6b7280";
      $modal.find(".tl-modal-preview").css("background", newColor);
    });

    var $err = jQuery("<p>")
      .addClass("tl-error")
      .text("Please enter a table name.");
    $modal.append($err);

    var $cancel = jQuery("<button>")
      .addClass("tl-btn tl-btn-cancel")
      .text("Cancel")
      .on("click", function () {
        $overlay.remove();
        var ctx2 = _c();
        if (ctx2) ctx2.pending = null;
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
          seats: parseInt(table ? table.Capacity : 4) || 4,
          status: table ? table.Status.toLowerCase() : $status.val(),
        });
        $overlay.remove();
      });

    $modal.append(
      jQuery("<div>").addClass("tl-modal-actions").append($cancel, $create),
    );
    $overlay.append($modal);
    jQuery("#" + _TL.cid()).append($overlay);

    setTimeout(function () {
      $name.trigger("focus").trigger("select");
    }, 50);
    $overlay.on("click", function (e) {
      if (jQuery(e.target).is($overlay)) {
        $overlay.remove();
        var ctx2 = _c();
        if (ctx2) ctx2.pending = null;
      }
    });
  }

  function _field(label, $input) {
    return jQuery("<div>")
      .addClass("tl-field")
      .append(jQuery("<label>").text(label), $input);
  }

  function _commit(details) {
    var ctx = _c();
    if (!ctx || !ctx.pending) return;
    var cfg = GridCore.getConfig();

    var newTable = {
      id: details.id || "T" + Date.now(),
      name: details.name,
      seats: details.seats,
      status: details.status,
      shape: ctx.pending.shape,
      col: ctx.pending.col,
      row: ctx.pending.row,
      colSpan: ctx.pending.colSpan,
      rowSpan: ctx.pending.rowSpan,
    };

    GridCore.addTable(newTable);
    _TL.$(".tl-layout-grid").append(GridRender.buildTableCard(newTable));

    if (typeof cfg.onTableCreated === "function") cfg.onTableCreated(newTable);
    if (typeof cfg.onLayoutChange === "function" && !(cfg.realTime === false && GridCore.isEditing()))
      cfg.onLayoutChange(GridCore.getLayout());

    ctx.pending = null;
    GridToolbar.deactivate();
  }

  function unbind() {
    var cid = _TL.cid();
    var ctx = _inst[cid];
    if (ctx && ctx.placeTouchMoveHandler) {
      document.removeEventListener("touchmove", ctx.placeTouchMoveHandler);
      ctx.placeTouchMoveHandler = null;
    }
    jQuery(document).off(".tl-place-" + cid);
  }

  return { init: init, destroy: destroy, bind: bind, unbind: unbind };
})();
