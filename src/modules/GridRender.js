/**
 * GridRender.js
 * All DOM builders. No state — pure input → jQuery element.
 */
var GridRender = (function () {
  var _ns = "tl-"; // CSS class namespace — prevents conflicts with user CSS

  function ns(cls) {
    return _ns + cls;
  }

  // ── Canvas + Grid ─────────────────────────────────

  function buildCanvas() {
    var cfg = GridCore.getConfig();

    var $canvas = jQuery("<div>")
      .addClass(ns("canvas"))
      .css({
        height: cfg.theme.canvasHeight || "600px",
        "--tl-cell-size": cfg.cellSize + cfg.gap + "px",
        background: cfg.theme.gridBg,
      });

    var $zoomArea = jQuery("<div>").addClass(ns("zoom-area"));
    var $grid = buildGrid();

    $zoomArea.append($grid);
    $canvas.append($zoomArea);

    return $canvas;
  }

  function buildGrid() {
    var cfg = GridCore.getConfig();
    var gridW = cfg.columns * cfg.cellSize + (cfg.columns - 1) * cfg.gap;
    var gridH = cfg.rows * cfg.cellSize + (cfg.rows - 1) * cfg.gap;

    var $grid = jQuery("<div>")
      .addClass(ns("layout-grid"))
      .css({
        "grid-template-columns":
          "repeat(" + cfg.columns + ", " + cfg.cellSize + "px)",
        "grid-template-rows":
          "repeat(" + cfg.rows + ", " + cfg.cellSize + "px)",
        gap: cfg.gap + "px",
        width: gridW + "px",
        height: gridH + "px",
        background: cfg.theme.gridBg,
      });

    for (var r = 1; r <= cfg.rows; r++) {
      for (var c = 1; c <= cfg.columns; c++) {
        $grid.append(buildBgCell(c, r));
      }
    }

    jQuery.each(GridCore.getTables(), function (_, t) {
      $grid.append(buildTableCard(t));
    });

    return $grid;
  }

  // ── Background cell ───────────────────────────────

  function buildBgCell(col, row) {
    var cfg = GridCore.getConfig();
    return jQuery("<div>")
      .addClass(ns("cell") + " " + ns("cell--empty"))
      .attr({ "data-col": col, "data-row": row })
      .css({
        "grid-column": col + " / span 1",
        "grid-row": row + " / span 1",
        background: cfg.theme.cellBg,
      });
  }

  // ── Table card ────────────────────────────────────

  function buildTableCard(t) {
    var cfg = GridCore.getConfig();
    var statusColor = cfg.statusColors[t.status] || "#6b7280";
    var shape = t.shape || "square";
    var styles = GridCore.getShapeStyles(shape);

    var $card = jQuery("<div>")
      .addClass(ns("table-card"))
      .attr({
        draggable: cfg.draggable ? "true" : "false",
        "data-table-id": t.id,
        "data-shape": shape,
      })
      .css({
        "grid-column": t.col + " / span " + t.colSpan,
        "grid-row": t.row + " / span " + t.rowSpan,
        background: statusColor,
        "box-shadow": "0 4px 12px " + GridCore.hexAlpha(statusColor, 0.4),
        "border-radius": styles.borderRadius,
        "clip-path": styles.clipPath,
      });

    $card.append(
      jQuery("<span>").addClass(ns("table-name")).text(t.name),
      jQuery("<span>")
        .addClass(ns("table-seats"))
        .text("Seats: " + t.seats),
      jQuery("<span>")
        .addClass(ns("table-status"))
        .text(t.status)
        .css("background", GridCore.hexAlpha(statusColor, 0.3)),
    );

    if (cfg.showSizeBadge) {
      $card.append(
        jQuery("<span>")
          .addClass(ns("table-size-badge"))
          .text(t.colSpan + "×" + t.rowSpan),
      );
    }

    return $card;
  }

  // ── Legend ────────────────────────────────────────

  function buildLegend() {
    var cfg = GridCore.getConfig();
    var $legend = jQuery("<div>").addClass(ns("legend"));
    jQuery.each(cfg.statusColors, function (status, color) {
      $legend.append(
        jQuery("<div>")
          .addClass(ns("legend-item"))
          .append(
            jQuery("<div>").addClass(ns("legend-dot")).css("background", color),
            jQuery("<span>").text(
              status.charAt(0).toUpperCase() + status.slice(1),
            ),
          ),
      );
    });
    return $legend;
  }

  // ── Ghost helpers ─────────────────────────────────

  function buildPlaceGhost(col, row, colSpan, rowSpan, invalid) {
    return jQuery("<div>")
      .addClass(ns("place-ghost"))
      .css({
        "grid-column": col + " / span " + colSpan,
        "grid-row": row + " / span " + rowSpan,
        "border-color": invalid ? "#dc2626" : "#f59e0b",
        background: invalid ? "rgba(220,38,38,0.08)" : "rgba(245,158,11,0.1)",
      })
      .text(colSpan + " × " + rowSpan);
  }

  function buildDragGhost(col, row, colSpan, rowSpan, invalid) {
    return jQuery("<div>")
      .addClass(
        ns("drop-ghost") + (invalid ? " " + ns("drop-ghost--invalid") : ""),
      )
      .css({
        "grid-column": col + " / span " + colSpan,
        "grid-row": row + " / span " + rowSpan,
      });
  }

  // ── Trash zone ─────────────────────────────────────

  function buildTrashZone() {
    return jQuery("<div>")
      .addClass(ns("trash-zone"))
      .attr("title", "Drop here to remove table")
      .html('<i class="fa-solid fa-trash-can"></i>');
  }

  // ── Public API ────────────────────────────────────

  return {
    buildCanvas: buildCanvas,
    buildGrid: buildGrid,
    buildBgCell: buildBgCell,
    buildTableCard: buildTableCard,
    buildLegend: buildLegend,
    buildPlaceGhost: buildPlaceGhost,
    buildDragGhost: buildDragGhost,
    buildTrashZone: buildTrashZone,
    ns: ns,
  };
})();
