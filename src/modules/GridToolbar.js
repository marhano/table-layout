var GridToolbar = (function () {
  var _activeTool = null;

  function build() {
    var cfg = GridCore.getConfig();
    var $toolbar = jQuery("<div>")
      .addClass("tl-toolbar")
      .css("background", cfg.theme.toolbarBg);

    $toolbar.append(
      jQuery("<span>").addClass("tl-toolbar-label").text("Tables"),
    );

    jQuery.each(cfg.shapes, function (key, shape) {
      $toolbar.append(_buildShapeBtn(key, shape));
    });

    $toolbar.append(jQuery("<div>").addClass("tl-toolbar-separator"));

    return $toolbar;
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

  function toggle(key) {
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

  return {
    build: build,
    toggle: toggle,
    deactivate: deactivate,
    getActive: getActive,
  };
})();
