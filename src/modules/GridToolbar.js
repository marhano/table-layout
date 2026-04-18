/**
 * GridToolbar.js
 * Toolbar shell + shape tool panel.
 *
 * Layer-related toolbar UI (icon badge, layout name, icon picker,
 * settings popup, save/discard buttons) is now owned by GridLayers
 * and injected here via GridLayers.buildToolbarLeft() and
 * GridLayers.buildToolbarActions().
 */
var GridToolbar = (function () {
  var _activeTool = null;

  // ── Toolbar build ─────────────────────────────────

  function build() {
    var cfg = GridCore.getConfig();
    var $toolbar = jQuery("<div>").addClass("tl-toolbar");

    // Left: layer icon + name (owned by GridLayers)
    var $left = jQuery("<div>").addClass("tl-toolbar-left");
    if (cfg.layers && cfg.layers.length) {
      $left.append(GridLayers.buildToolbarLeft());
    }
    $toolbar.append($left);

    $toolbar.append(jQuery("<div>").addClass("tl-toolbar-spacer"));

    // Right: settings gear + save/discard (owned by GridLayers)
    if (cfg.layers && cfg.layers.length) {
      $toolbar.append(GridLayers.buildToolbarActions());
    }

    return $toolbar;
  }

  // ── Shape panel ───────────────────────────────────

  function buildShapePanel() {
    var cfg = GridCore.getConfig();
    var $panel = jQuery("<div>").addClass("tl-shape-panel");

    jQuery.each(cfg.shapes, function (key, shape) {
      if (shape === false) return;
      $panel.append(_buildShapeBtn(key, shape));
    });

    return $panel;
  }

  function _buildShapeBtn(key, shape) {
    return jQuery("<button>")
      .addClass("tl-shape-tool-btn")
      .attr({ "data-shape-key": key, title: shape.label })
      .append(jQuery("<i>").addClass(shape.icon))
      .on("click", function () {
        toggle(key);
      });
  }

  // ── Tool state ────────────────────────────────────

  function toggle(key) {
    var cfg = GridCore.getConfig();
    if (cfg.editMode !== false && !GridCore.isEditing()) return;
    if (_activeTool === key) {
      deactivate();
    } else {
      _activeTool = key;
      jQuery(".tl-shape-tool-btn").removeClass("active");
      jQuery('[data-shape-key="' + key + '"]').addClass("active");
      jQuery(".tl-canvas").addClass("tl-placing-mode");
      GridEvents.emit("tool:changed", key);
    }
  }

  function deactivate() {
    _activeTool = null;
    jQuery(".tl-shape-tool-btn").removeClass("active");
    jQuery(".tl-canvas").removeClass("tl-placing-mode");
    GridEvents.emit("tool:changed", null);
  }

  function getActive() {
    return _activeTool;
  }

  // ── Public API ────────────────────────────────────

  return {
    build: build,
    buildShapePanel: buildShapePanel,
    toggle: toggle,
    deactivate: deactivate,
    getActive: getActive,
  };
})();
