/**
 * GridLayers.js
 * Layer switcher UI — lets users create and switch between multiple table layouts.
 * Only active when cfg.layers is defined.
 */
var GridLayers = (function () {
  var _$panel = null;

  // ── Public: toggle button ─────────────────────────

  function buildToggleBtn() {
    return jQuery("<button>")
      .addClass("tl-layers-btn")
      .attr("title", "Switch Layout")
      .html('<i class="fa-solid fa-layer-group"></i>')
      .on("click", function (e) {
        e.stopPropagation();
        _$panel ? _closePanel() : _openPanel();
      });
  }

  // ── Panel ─────────────────────────────────────────

  function _openPanel() {
    _closePanel();

    var cfg = GridCore.getConfig();
    var layers = GridCore.getLayers();
    var activeId = GridCore.getActiveLayerId();

    _$panel = jQuery("<div>").addClass("tl-layers-panel");

    // Layer list (scrollable, max 3 visible)
    var $list = jQuery("<div>").addClass("tl-layers-list");
    jQuery.each(layers, function (_, layer) {
      $list.append(_buildLayerItem(layer, layer.id === activeId));
    });
    _$panel.append($list);

    // Separator
    _$panel.append(jQuery("<div>").addClass("tl-layers-separator"));

    // Add layout button
    var $addBtn = jQuery("<button>")
      .addClass("tl-layers-add-btn")
      .html('<i class="fa-solid fa-plus"></i> Add Layout')
      .on("click", function (e) {
        e.stopPropagation();
        _showAddForm();
      });
    _$panel.append($addBtn);

    jQuery(".tl-canvas-wrap").append(_$panel);

    // Close when clicking outside
    setTimeout(function () {
      jQuery(document).one("click.tl-layers-outside", function () {
        _closePanel();
      });
    }, 0);
  }

  function _closePanel() {
    if (_$panel) {
      _$panel.remove();
      _$panel = null;
    }
    jQuery(document).off("click.tl-layers-outside");
  }

  // ── Layer item ────────────────────────────────────

  function _buildLayerItem(layer, isActive) {
    var $item = jQuery("<div>")
      .addClass("tl-layers-item" + (isActive ? " tl-layers-item--active" : ""))
      .on("click", function (e) {
        e.stopPropagation();
        if (isActive) return;
        GridCore.switchLayer(layer.id);
        _rebuildGrid();
        _closePanel();
        var cfg = GridCore.getConfig();
        if (typeof cfg.onLayerChange === "function")
          cfg.onLayerChange(GridCore.getActiveLayer(), GridCore.getLayout());
      });

    // Icon: FA class string or plain text/emoji
    var isFaIcon = layer.icon && layer.icon.indexOf("fa-") !== -1;
    var $icon = jQuery("<div>").addClass("tl-layers-icon");
    if (isFaIcon) {
      $icon.append(jQuery("<i>").addClass(layer.icon));
    } else {
      $icon.text(layer.icon || "?");
    }

    $item.append($icon);
    $item.append(
      jQuery("<span>").addClass("tl-layers-label").text(layer.label)
    );

    if (isActive) {
      $item.append(
        jQuery("<i>").addClass("fa-solid fa-check tl-layers-active-mark")
      );
    }

    return $item;
  }

  // ── Add layer form ────────────────────────────────

  function _showAddForm() {
    if (!_$panel) return;
    _$panel.find(".tl-layers-add-form").remove();

    var cfg = GridCore.getConfig();

    // Custom hook
    if (typeof cfg.onLayerAdd === "function") {
      cfg.onLayerAdd(function (details) {
        _createLayer(details);
      });
      return;
    }

    // Default inline form
    var $form = jQuery("<div>")
      .addClass("tl-layers-add-form")
      .on("click", function (e) { e.stopPropagation(); });

    var $label = jQuery("<input>")
      .attr({ type: "text", placeholder: "Layout name", maxlength: 30 });

    var $icon = jQuery("<input>")
      .attr({ type: "text", placeholder: 'Icon (fa-solid fa-… or A, 1…)', maxlength: 40 });

    var $actions = jQuery("<div>").addClass("tl-layers-add-actions");

    var $cancel = jQuery("<button>")
      .addClass("tl-btn tl-btn-cancel")
      .text("Cancel")
      .on("click", function (e) {
        e.stopPropagation();
        $form.remove();
      });

    var $create = jQuery("<button>")
      .addClass("tl-btn tl-btn-primary")
      .text("Add")
      .on("click", function (e) {
        e.stopPropagation();
        var label = jQuery.trim($label.val());
        if (!label) { $label.addClass("tl-input-error").trigger("focus"); return; }
        $label.removeClass("tl-input-error");
        var icon = jQuery.trim($icon.val()) || label.charAt(0).toUpperCase();
        _createLayer({ label: label, icon: icon });
      });

    $label.on("input", function () { jQuery(this).removeClass("tl-input-error"); });

    $actions.append($cancel, $create);
    $form.append($label, $icon, $actions);
    _$panel.append($form);

    setTimeout(function () { $label.trigger("focus"); }, 50);
  }

  function _createLayer(details) {
    var label = details.label || "Layout";
    var layer = {
      id: "layer-" + Date.now(),
      label: label,
      icon: details.icon || label.charAt(0).toUpperCase(),
      tables: [],
    };
    GridCore.addLayer(layer);
    GridCore.switchLayer(layer.id);
    _rebuildGrid();
    _closePanel();
    var cfg = GridCore.getConfig();
    if (typeof cfg.onLayerChange === "function")
      cfg.onLayerChange(layer, []);
  }

  // ── Grid rebuild on layer switch ──────────────────

  function _rebuildGrid() {
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  return { buildToggleBtn: buildToggleBtn };
})();
