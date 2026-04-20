var GridFullscreen = (function () {
  var _inst = {};

  function _c() { return _inst[_TL.cid()]; }

  function init() {
    _inst[_TL.cid()] = { isFullscreen: false };
  }

  function destroy() {
    var cid = _TL.cid();
    jQuery(document).off("keydown.tl-fullscreen-" + cid);
    delete _inst[cid];
  }

  function buildButton() {
    var cfg = GridCore.getConfig();
    var zCfg = cfg.zoom || {};
    if (!zCfg.fullscreen) return jQuery();

    var cid = _TL.cid();
    var $btn = jQuery("<button>")
      .addClass("tl-zoom-btn tl-zoom-btn-fullscreen")
      .attr("title", "Toggle fullscreen")
      .html('<i class="fa-solid fa-expand"></i>')
      .on("click", function () { _TL.use(cid); toggle(); });

    return $btn;
  }

  function toggle() {
    if (_c().isFullscreen) {
      exit();
    } else {
      enter();
    }
  }

  function enter() {
    var $root = jQuery("#" + _TL.cid());
    if (!$root.length) return;

    $root.addClass("tl-fullscreen");
    _c().isFullscreen = true;

    $root.find(".tl-zoom-btn-fullscreen i")
      .removeClass("fa-expand")
      .addClass("fa-compress");

    GridZoom.applyZoom(GridZoom.getZoom(), true);
    GridEvents.emit("fullscreen:changed", true);
  }

  function exit() {
    var $root = jQuery("#" + _TL.cid());
    if (!$root.length) return;

    $root.removeClass("tl-fullscreen");
    _c().isFullscreen = false;

    $root.find(".tl-zoom-btn-fullscreen i")
      .removeClass("fa-compress")
      .addClass("fa-expand");

    GridZoom.applyZoom(GridZoom.getZoom(), true);
    GridEvents.emit("fullscreen:changed", false);
  }

  function bind() {
    var cid = _TL.cid();
    jQuery(document).on("keydown.tl-fullscreen-" + cid, function (e) {
      if (e.key === "Escape" && _inst[cid] && _inst[cid].isFullscreen) {
        _TL.use(cid);
        exit();
      }
    });
  }

  function isFullscreen() {
    return _c().isFullscreen;
  }

  return {
    init: init,
    destroy: destroy,
    buildButton: buildButton,
    bind: bind,
    toggle: toggle,
    enter: enter,
    exit: exit,
    isFullscreen: isFullscreen,
  };
})();
