var GridPlace = (function () {
  var _start = null;
  var _$ghost = null;
  var _pending = null;

  function bind() {
    var cfg = GridCore.getConfig();
    var gridSel = "#" + cfg.containerId + " .tl-layout-grid";

    jQuery(document).on("mousedown.tl", gridSel + " .tl-cell", function (e) {
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
    var nextName =
      (cfg.newTable.namePrefix || "Table") + " " + GridCore.getCounter();

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

    var $name = jQuery("<input>")
      .attr({ type: "text", placeholder: "Table name", maxlength: 30 })
      .val(nextName);
    $modal.append(_field("Name", $name));

    var $seats = jQuery("<input>")
      .attr({ type: "number", min: 1, max: 50 })
      .val(cfg.newTable.defaultSeats || 4);
    var $status = jQuery("<select>");
    jQuery.each(cfg.statusColors, function (s) {
      $status.append(
        jQuery("<option>")
          .val(s)
          .text(s.charAt(0).toUpperCase() + s.slice(1)),
      );
    });
    $status.val(cfg.newTable.defaultStatus || "available");

    $modal.append(
      jQuery("<div>")
        .addClass("tl-field-row")
        .append(_field("Seats", $seats), _field("Status", $status)),
    );

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
        var name = jQuery.trim($name.val());
        if (!name) {
          $err.show();
          return;
        }
        $err.hide();
        _commit({
          name: name,
          seats: parseInt($seats.val()) || 4,
          status: $status.val(),
        });
        $overlay.remove();
      });

    $modal.append(
      jQuery("<div>").addClass("tl-modal-actions").append($cancel, $create),
    );
    $overlay.append($modal);
    jQuery("body").append($overlay);

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
      id: "T" + Date.now(),
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
    if (typeof cfg.onLayoutChange === "function")
      cfg.onLayoutChange(GridCore.getLayout());

    _pending = null;
    GridToolbar.deactivate();
  }

  function unbind() {
    jQuery(document).off(".tl");
  }

  return { bind: bind, unbind: unbind };
})();
