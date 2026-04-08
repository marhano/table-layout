/**
 * TableLayout.js
 * ─────────────────────────────────────────────────────────────────
 * Public API — this is the only object the user ever touches.
 *
 * Usage in .NET MVC view:
 *
 *   var layout = TableLayout.create({
 *       containerId : 'myDiv',
 *       columns     : 12,
 *       rows        : 8,
 *       tables      : [...],
 *       onLayoutChange: function(layout) { ... }
 *   });
 *
 *   layout.zoomIn();
 *   layout.getLayout();
 *   layout.destroy();
 */
var TableLayout = (function () {
  function create(userConfig) {
    // ── Guard: jQuery required ─────────────────────
    if (typeof jQuery === "undefined") {
      throw new Error("[TableLayout] jQuery is required but not loaded.");
    }

    // ── Guard: container must exist ────────────────
    var cfg = GridConfig.merge(userConfig);
    if (!jQuery("#" + cfg.containerId).length) {
      throw new Error(
        "[TableLayout] Container #" + cfg.containerId + " not found in DOM.",
      );
    }

    // ── Boot ───────────────────────────────────────
    GridEvents.reset();
    GridCore.init(cfg);
    GridZoom.init(cfg.zoom.initial || 1);

    // ── Build DOM ──────────────────────────────────
    var $container = jQuery("#" + cfg.containerId)
      .empty()
      .addClass("tl-root");
    var $wrapper = jQuery("<div>").addClass("tl-wrapper");
    var $canvas = GridRender.buildCanvas();
    var $canvasWrap = jQuery("<div>").addClass("tl-canvas-wrap");
    $canvasWrap.append($canvas);
    $canvasWrap.append(GridZoom.buildControls());
    if (cfg.trashZone) $canvasWrap.append(GridRender.buildTrashZone());

    $wrapper.append(GridToolbar.build());
    $wrapper.append($canvasWrap);
    $wrapper.append(GridRender.buildLegend());

    if (cfg.showHint) {
      $wrapper.append(
        jQuery("<p>")
          .addClass("tl-hint")
          .text(
            "Select a shape tool then drag on the grid  •  Ctrl + scroll to zoom",
          ),
      );
    }

    $container.append($wrapper);

    // ── Apply initial zoom ─────────────────────────
    GridZoom.applyZoom(cfg.zoom.initial || 1, true);

    // ── Bind modules ───────────────────────────────
    GridDrag.bind();
    GridPlace.bind();
    GridZoom.bindWheelZoom();

    // ── Wire internal events to user callbacks ─────
    GridEvents.on("zoom:changed", function (level) {
      if (typeof cfg.onZoom === "function") cfg.onZoom(level);
    });

    // ── Return instance API ────────────────────────
    return {
      // Zoom
      zoomIn: function () {
        GridZoom.applyZoom(GridZoom.getZoom() + (cfg.zoom.step || 0.1));
      },
      zoomOut: function () {
        GridZoom.applyZoom(GridZoom.getZoom() - (cfg.zoom.step || 0.1));
      },
      zoomReset: function () {
        GridZoom.applyZoom(cfg.zoom.initial || 1);
      },
      zoomTo: function (l) {
        GridZoom.applyZoom(l);
      },
      getZoom: function () {
        return GridZoom.getZoom();
      },

      // Data
      getLayout: function () {
        return GridCore.getLayout();
      },
      getTables: function () {
        return GridCore.getTables();
      },
      getConfig: function () {
        return GridCore.getConfig();
      },

      // Tools
      setTool: function (key) {
        GridToolbar.toggle(key);
      },
      clearTool: function () {
        GridToolbar.deactivate();
      },
      getActiveTool: function () {
        return GridToolbar.getActive();
      },

      // Lifecycle
      destroy: function () {
        GridDrag.unbind();
        GridPlace.unbind();
        jQuery("#" + cfg.containerId)
          .off(".tl")
          .empty()
          .removeClass("tl-root");
        GridEvents.reset();
        GridCore.reset();
      },
    };
  }

  return { create: create };
})();
