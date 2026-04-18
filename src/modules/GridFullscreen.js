var GridFullscreen = (function () {
  var _isFullscreen = false;

  function buildButton() {
    var cfg = GridCore.getConfig();
    var zCfg = cfg.zoom || {};
    if (!zCfg.fullscreen) return jQuery();

    var $btn = jQuery("<button>")
      .addClass("tl-zoom-btn tl-zoom-btn-fullscreen")
      .attr("title", "Toggle fullscreen")
      .html('<i class="fa-solid fa-expand"></i>')
      .on("click", function () { toggle(); });

    return $btn;
  }

  function toggle() {
    if (_isFullscreen) {
      exit();
    } else {
      enter();
    }
  }

  function enter() {
    var $root = jQuery(".tl-root").first();
    if (!$root.length) return;

    $root.addClass("tl-fullscreen");
    _isFullscreen = true;

    // Update button icon
    $root.find(".tl-zoom-btn-fullscreen i")
      .removeClass("fa-expand")
      .addClass("fa-compress");

    // Recalculate zoom area
    GridZoom.applyZoom(GridZoom.getZoom(), true);
    GridEvents.emit("fullscreen:changed", true);
  }

  function exit() {
    var $root = jQuery(".tl-root").first();
    if (!$root.length) return;

    $root.removeClass("tl-fullscreen");
    _isFullscreen = false;

    // Update button icon
    $root.find(".tl-zoom-btn-fullscreen i")
      .removeClass("fa-compress")
      .addClass("fa-expand");

    // Recalculate zoom area
    GridZoom.applyZoom(GridZoom.getZoom(), true);
    GridEvents.emit("fullscreen:changed", false);
  }

  function bind() {
    // Exit fullscreen on Escape key
    jQuery(document).on("keydown.tl-fullscreen", function (e) {
      if (e.key === "Escape" && _isFullscreen) {
        exit();
      }
    });
  }

  function isFullscreen() {
    return _isFullscreen;
  }

  return {
    buildButton: buildButton,
    bind: bind,
    toggle: toggle,
    enter: enter,
    exit: exit,
    isFullscreen: isFullscreen,
  };
})();
