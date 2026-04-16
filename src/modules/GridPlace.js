var GridPlace = (function () {
  var _start = null;
  var _$ghost = null;
  var _pending = null;
  var _placeTouchMoveHandler = null;

  function bind() {
    var cfg = GridCore.getConfig();
    var gridSel = "#" + cfg.containerId + " .tl-layout-grid";

    jQuery(document).on("mousedown.tl", gridSel + " .tl-cell", function (e) {
      if (cfg.realTime === false && !GridCore.isEditing()) return;
      if (!GridToolbar.getActive() || e.which !== 1) return;
      e.preventDefault();
      _start = {
        col: parseInt(jQuery(this).data("col")),
        row: parseInt(jQuery(this).data("row")),
      };
    });

    jQuery(document).on("mousemove.tl", gridSel, function (e) {
      if (!GridToolbar.getActive() || !_start) return;
      var end = GridCore.cursorToGrid(
        e.originalEvent.clientX,
        e.originalEvent.clientY,
      );
      var span = GridCore.calcSpan(_start, end, GridToolbar.getActive());
      var bad = GridCore.hasCollision(
        span.col,
        span.row,
        span.colSpan,
        span.rowSpan,
        null,
      );
      _showGhost(span.col, span.row, span.colSpan, span.rowSpan, bad);
    });

    jQuery(document).on("mouseup.tl", gridSel, function (e) {
      if (!GridToolbar.getActive() || !_start || e.which !== 1) return;
      var end = GridCore.cursorToGrid(
        e.originalEvent.clientX,
        e.originalEvent.clientY,
      );
      var span = GridCore.calcSpan(_start, end, GridToolbar.getActive());
      _removeGhost();
      _start = null;
      if (
        GridCore.hasCollision(
          span.col,
          span.row,
          span.colSpan,
          span.rowSpan,
          null,
        )
      )
        return;
      _showModal(jQuery.extend({}, span, { shape: GridToolbar.getActive() }));
    });

    jQuery(document).on("mouseup.tl", function (e) {
      if (
        GridToolbar.getActive() &&
        _start &&
        !jQuery(e.target).closest(gridSel).length
      ) {
        _start = null;
        _removeGhost();
      }
    });

    jQuery(document).on("keydown.tl", function (e) {
      if (e.key === "Escape" && GridToolbar.getActive())
        GridToolbar.deactivate();
    });

    // ── Touch: shape drawing ───────────────────────
    jQuery(document).on("touchstart.tl", gridSel + " .tl-cell", function (e) {
      if (cfg.editMode !== false && !GridCore.isEditing()) return;
      if (!GridToolbar.getActive()) return;
      if (e.originalEvent.touches.length !== 1) return;
      e.preventDefault();
      var touch = e.originalEvent.touches[0];
      var $cell = jQuery(document.elementFromPoint(touch.clientX, touch.clientY)).closest(".tl-cell");
      if (!$cell.length) return;
      _start = {
        col: parseInt($cell.data("col")),
        row: parseInt($cell.data("row")),
      };

      _placeTouchMoveHandler = function (te) {
        if (!_start) return;
        if (te.touches.length !== 1) return;
        te.preventDefault();
        var tc = te.touches[0];
        var end = GridCore.cursorToGrid(tc.clientX, tc.clientY);
        var span = GridCore.calcSpan(_start, end, GridToolbar.getActive());
        var bad = GridCore.hasCollision(span.col, span.row, span.colSpan, span.rowSpan, null);
        _showGhost(span.col, span.row, span.colSpan, span.rowSpan, bad);
      };
      document.addEventListener("touchmove", _placeTouchMoveHandler, { passive: false });
    });

    jQuery(document).on("touchend.tl", function (e) {
      if (_placeTouchMoveHandler) {
        document.removeEventListener("touchmove", _placeTouchMoveHandler);
        _placeTouchMoveHandler = null;
      }
      if (!GridToolbar.getActive() || !_start) return;
      var touch = e.originalEvent.changedTouches[0];
      var end = GridCore.cursorToGrid(touch.clientX, touch.clientY);
      var span = GridCore.calcSpan(_start, end, GridToolbar.getActive());
      _removeGhost();
      _start = null;
      if (GridCore.hasCollision(span.col, span.row, span.colSpan, span.rowSpan, null)) return;
      _showModal(jQuery.extend({}, span, { shape: GridToolbar.getActive() }));
    });
  }

  function _showGhost(col, row, colSpan, rowSpan, invalid) {
    _removeGhost();
    _$ghost = GridRender.buildPlaceGhost(col, row, colSpan, rowSpan, invalid);
    jQuery(".tl-layout-grid").append(_$ghost);
  }

  function _removeGhost() {
    if (_$ghost) {
      _$ghost.remove();
      _$ghost = null;
    }
  }

  function _showModal(placement) {
    _pending = placement;
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
    // Helper to update select options
    function updateTableOptions(tables) {
      $select.empty();
      var filter = $search.val() ? $search.val().toLowerCase() : '';
      tables.filter(function(t) {
        return !filter || t.TableName.toLowerCase().includes(filter);
      }).forEach(function (t, i) {
        const allLayers = GridCore.getAllLayersLayout();
        if(allLayers.some(layer => layer.rooms.some(room => room.tables.some(tbl => tbl.id === t.TableId)))) return; // Skip tables already in any room
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

    // Add select field for tables (always show, may be loading)
    $modal.append(_field("Copy from existing table", $tablesWrap));

    // $modal.append(jQuery("<hr>"));

    var $name = jQuery("<input>")
      .attr({ type: "text", placeholder: "Table name", maxlength: 30 })
      .val(nextName);
    // $modal.append(_field("Name", $name));

    // var $seats = jQuery("<input>")
    //   .attr({ type: "number", min: 1, max: 50 })
    //   .val(cfg.newTable.defaultSeats || 4);
    var $status = jQuery("<select>");
    jQuery.each(cfg.statusColors, function (s) {
      $status.append(
        jQuery("<option>")
          .val(s)
          .text(s.charAt(0).toUpperCase() + s.slice(1)),
      );
    });
    $status.val(cfg.newTable.defaultStatus || "available");

    // Update header shape color when status changes
    $status.on("change", function () {
      var newColor = cfg.statusColors[jQuery(this).val()] || "#6b7280";
      $modal.find(".tl-modal-preview").css("background", newColor);
    });

    // $modal.append(
    //   jQuery("<div>")
    //     .addClass("tl-field-row")
    //     .append(_field("Seats", $seats), _field("Status", $status)),
    // );

    var $err = jQuery("<p>")
      .addClass("tl-error")
      .text("Please enter a table name.");
    $modal.append($err);

    var $cancel = jQuery("<button>")
      .addClass("tl-btn tl-btn-cancel")
      .text("Cancel")
      .on("click", function () {
        $overlay.remove();
        _pending = null;
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
          seats: parseInt(table ? table.Capacity : $seats.val()) || 4,
          status: table ? table.Status.toLowerCase() : $status.val(),
        });
        $overlay.remove();
      });

    $modal.append(
      jQuery("<div>").addClass("tl-modal-actions").append($cancel, $create),
    );
    $overlay.append($modal);
    jQuery(".tl-root").first().append($overlay);

    setTimeout(function () {
      $name.trigger("focus").trigger("select");
    }, 50);
    $overlay.on("click", function (e) {
      if (jQuery(e.target).is($overlay)) {
        $overlay.remove();
        _pending = null;
      }
    });
  }

  function _field(label, $input) {
    return jQuery("<div>")
      .addClass("tl-field")
      .append(jQuery("<label>").text(label), $input);
  }

  function _commit(details) {
    if (!_pending) return;
    var cfg = GridCore.getConfig();

    var newTable = {
      id: details.id || "T" + Date.now(),
      name: details.name,
      seats: details.seats,
      status: details.status,
      shape: _pending.shape,
      col: _pending.col,
      row: _pending.row,
      colSpan: _pending.colSpan,
      rowSpan: _pending.rowSpan,
    };

    GridCore.addTable(newTable);
    jQuery(".tl-layout-grid").append(GridRender.buildTableCard(newTable));

    if (typeof cfg.onTableCreated === "function") cfg.onTableCreated(newTable);
    if (typeof cfg.onLayoutChange === "function" && !(cfg.realTime === false && GridCore.isEditing()))
      cfg.onLayoutChange(GridCore.getLayout());

    _pending = null;
    GridToolbar.deactivate();
  }

  function unbind() {
    if (_placeTouchMoveHandler) {
      document.removeEventListener("touchmove", _placeTouchMoveHandler);
      _placeTouchMoveHandler = null;
    }
    jQuery(document).off(".tl");
  }

  return { bind: bind, unbind: unbind };
})();
