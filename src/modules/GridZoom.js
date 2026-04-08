var GridZoom = (function () {
  var _zoom = 1;

  function init(initial) {
    _zoom = initial || 1;
  }

  function buildControls() {
    var cfg = GridCore.getConfig();
    var zCfg = cfg.zoom || {};
    if (!zCfg.enabled || !zCfg.showControls) return jQuery();

    var $ctrl = jQuery("<div>").addClass("tl-zoom-controls");

    $ctrl.append(
      _btn(zCfg.labelZoomOut || "－", "tl-zoom-btn-out", function () {
        applyZoom(_zoom - (zCfg.step || 0.1));
      }),
      _btn(zCfg.labelReset || "↺", "tl-zoom-btn-reset", function () {
        applyZoom(zCfg.initial || 1);
      }),
      jQuery("<div>").addClass("tl-zoom-divider"),
      _btn(zCfg.labelZoomIn || "＋", "tl-zoom-btn-in", function () {
        applyZoom(_zoom + (zCfg.step || 0.1));
      }),
    );

    if (zCfg.showLabel) {
      $ctrl.append(
        jQuery("<div>").addClass("tl-zoom-divider"),
        jQuery("<span>").addClass("tl-zoom-label").text(_fmt(_zoom)),
      );
    }

    return $ctrl;
  }

  function _btn(label, cls, handler) {
    var cfg = GridCore.getConfig();
    return jQuery("<button>")
      .addClass("tl-zoom-btn " + cls)
      .html(label)
      .css({ background: cfg.theme.zoomBtnBg, color: cfg.theme.zoomBtnColor })
      .on("click", handler)
      .on("mouseenter", function () {
        jQuery(this).css({
          background: cfg.theme.zoomBtnHoverBg,
          color: "#fff",
        });
      })
      .on("mouseleave", function () {
        jQuery(this).css({
          background: cfg.theme.zoomBtnBg,
          color: cfg.theme.zoomBtnColor,
        });
      });
  }

  function applyZoom(level, silent) {
    var cfg = GridCore.getConfig();
    var zCfg = cfg.zoom || {};
    var min = zCfg.min || 0.4;
    var max = zCfg.max || 2;

    level = parseFloat(Math.min(max, Math.max(min, level)).toFixed(2));
    _zoom = level;

    var $za = jQuery(".tl-zoom-area");
    $za.css("transform", "scale(" + level + ")");

    var natW = $za[0] ? $za[0].scrollWidth : 0;
    var natH = $za[0] ? $za[0].scrollHeight : 0;
    $za.css({ width: natW * level + "px", height: natH * level + "px" });

    jQuery(".tl-zoom-label").text(_fmt(level));
    jQuery(".tl-zoom-btn-out").prop("disabled", level <= min);
    jQuery(".tl-zoom-btn-in").prop("disabled", level >= max);

    GridEvents.emit("zoom:changed", level);

    if (!silent && typeof cfg.onZoom === "function") cfg.onZoom(level);
  }

  function bindWheelZoom() {
    var cfg = GridCore.getConfig();
    var zCfg = cfg.zoom || {};
    if (!zCfg.enabled || !zCfg.mouseWheel) return;

    jQuery("#" + cfg.containerId).on("wheel.tl", function (e) {
      if (!e.originalEvent.ctrlKey) return;
      e.preventDefault();
      applyZoom(
        _zoom + (e.originalEvent.deltaY > 0 ? -1 : 1) * (zCfg.step || 0.1),
      );
    });
  }

  function _fmt(l) {
    return Math.round(l * 100) + "%";
  }
  function getZoom() {
    return _zoom;
  }

  return {
    init: init,
    buildControls: buildControls,
    applyZoom: applyZoom,
    bindWheelZoom: bindWheelZoom,
    getZoom: getZoom,
  };
})();
