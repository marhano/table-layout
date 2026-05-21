var GridZoom = (function () {
  var _inst = {};

  function _c() { return _inst[_TL.cid()]; }

  function init(initial) {
    _inst[_TL.cid()] = { zoom: initial || 1 };
  }

  function destroy() {
    delete _inst[_TL.cid()];
  }

  function buildControls() {
    var cfg = GridCore.getConfig();
    var zCfg = cfg.zoom || {};
    if (!zCfg.enabled || !zCfg.showControls) return jQuery();

    var cid = _TL.cid();
    var min  = zCfg.min  || 0.4;
    var max  = zCfg.max  || 2;
    var step = zCfg.step || 0.1;

    var $reset = jQuery("<button>")
      .addClass("tl-zoom-btn tl-zoom-btn-reset")
      .attr("title", "Reset zoom")
      .html(zCfg.labelReset || "↺")
      .on("click", function () { _TL.use(cid); applyZoom(zCfg.initial || 1); });

    var $slider = jQuery("<input>")
      .attr({ type: "range", min: min, max: max, step: step, value: _c().zoom })
      .addClass("tl-zoom-slider")
      .on("input", function () { _TL.use(cid); applyZoom(parseFloat(this.value)); });

    var $label = jQuery("<span>").addClass("tl-zoom-label").text(_fmt(_c().zoom));

    var $fullscreen = GridFullscreen.buildButton();

    return jQuery("<div>")
      .addClass("tl-zoom-controls")
      .append($reset, $fullscreen, $slider, $label);
  }

  function applyZoom(level, silent) {
    var cfg = GridCore.getConfig();
    var zCfg = cfg.zoom || {};
    var min = zCfg.min || 0.4;
    var max = zCfg.max || 2;

    level = parseFloat(Math.min(max, Math.max(min, level)).toFixed(2));
    _c().zoom = level;

    var $za = _TL.$(".tl-zoom-area");
    $za.css("transform", "scale(" + level + ")");

    // Expand grid cells to fill canvas at this zoom level
    _expandToFill(level);

    // Sync zoom-area layout dimensions (called separately to avoid recursion)
    syncZoomArea();

    _TL.$(".tl-zoom-label").text(_fmt(level));
    _TL.$(".tl-zoom-slider").val(level);

    GridEvents.emit("zoom:changed", level);

    if (!silent && typeof cfg.onZoom === "function") cfg.onZoom(level);
  }

  // Update zoom-area layout size without triggering another expansion
  function syncZoomArea() {
    var $za = _TL.$(".tl-zoom-area");
    if (!$za[0]) return;
    var level = _c() ? _c().zoom : 1;
    var natW = $za[0].scrollWidth;
    var natH = $za[0].scrollHeight;
    $za.css({ width: natW * level + "px", height: natH * level + "px" });
  }

  // Expand grid so it always fills the visible canvas at the given zoom level
  function _expandToFill(zoom) {
    var cfg = GridCore.getConfig();
    if (!cfg.infiniteGrid) return;
    var canvasEl = _TL.$(".tl-canvas")[0];
    if (!canvasEl) return;
    var canvasW = canvasEl.clientWidth;
    var canvasH = canvasEl.clientHeight;
    if (!canvasW || !canvasH) return;
    var unit = cfg.cellSize + cfg.gap;
    var neededCols = Math.ceil(canvasW / (zoom * unit)) + 1;
    var neededRows = Math.ceil(canvasH / (zoom * unit)) + 1;
    if (neededCols > cfg.columns || neededRows > cfg.rows) {
      GridRender.expandGridDOM(
        Math.max(cfg.columns, neededCols),
        Math.max(cfg.rows, neededRows)
      );
    }
  }

  function bindWheelZoom() {
    var cfg = GridCore.getConfig();
    var zCfg = cfg.zoom || {};
    if (!zCfg.enabled || !zCfg.mouseWheel) return;

    var cid = _TL.cid();

    jQuery("#" + cid).on("wheel.tl-" + cid, function (e) {
      if (!e.originalEvent.ctrlKey) return;
      e.preventDefault();
      _TL.use(cid);
      applyZoom(
        _c().zoom + (e.originalEvent.deltaY > 0 ? -1 : 1) * (zCfg.step || 0.1),
      );
    });

    // ── Pinch-to-zoom (touch) ──────────────────────
    var _pinchStartDist = null;
    var _pinchStartZoom = null;

    jQuery("#" + cid).on("touchstart.tl-zoom-" + cid, function (e) {
      if (e.originalEvent.touches.length === 2) {
        _TL.use(cid);
        var t1 = e.originalEvent.touches[0];
        var t2 = e.originalEvent.touches[1];
        _pinchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        _pinchStartZoom = _c().zoom;
      }
    });

    jQuery("#" + cid).on("touchmove.tl-zoom-" + cid, function (e) {
      if (e.originalEvent.touches.length === 2 && _pinchStartDist) {
        e.preventDefault();
        _TL.use(cid);
        var t1 = e.originalEvent.touches[0];
        var t2 = e.originalEvent.touches[1];
        var dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        var scale = dist / _pinchStartDist;
        applyZoom(_pinchStartZoom * scale);
      }
    });

    jQuery("#" + cid).on("touchend.tl-zoom-" + cid + " touchcancel.tl-zoom-" + cid, function (e) {
      if (e.originalEvent.touches.length < 2) {
        _pinchStartDist = null;
        _pinchStartZoom = null;
      }
    });
  }

  function _fmt(l) {
    return Math.round(l * 100) + "%";
  }
  function getZoom() {
    return _c().zoom;
  }

  return {
    init: init,
    destroy: destroy,
    buildControls: buildControls,
    applyZoom: applyZoom,
    syncZoomArea: syncZoomArea,
    bindWheelZoom: bindWheelZoom,
    getZoom: getZoom,
  };
})();
