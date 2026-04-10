/**
 * GridLayers.js
 * Layer switcher UI — lets users create and switch between multiple table layouts.
 * Only active when cfg.layers is defined.
 */
var GridLayers = (function () {
  var _$wrap = null;
  var _$activePreview = null;
  var _hoverTimer = null;

  // ── Public: build wrapper (button + slide-down panel) ─────────

  function build() {
    _$wrap = jQuery("<div>").addClass("tl-layers-wrap");

    var $btn = jQuery("<button>")
      .addClass("tl-layers-btn tl-layers-btn--active")
      .attr("title", "Switch Layout")
      .html('<i class="fa-solid fa-layer-group"></i>')
      .on("click", function (e) {
        e.stopPropagation();
        var isOpen = _$wrap.find(".tl-layers-panel").hasClass("tl-layers-panel--open");
        if (isOpen) {
          _closePanel();
        } else {
          _openPanel();
        }
      });

    var $panel = _buildPanel();
    $panel.addClass("tl-layers-panel--open");

    _$wrap.append($btn);
    _$wrap.append($panel);

    return _$wrap;
  }

  // ── Panel ─────────────────────────────────────────

  function _buildPanel() {
    var $panel = jQuery("<div>").addClass("tl-layers-panel");
    $panel.on("click", function (e) { e.stopPropagation(); });

    _renderPanelContent($panel);

    return $panel;
  }

  function _renderPanelContent($panel) {
    $panel.empty();

    var layers = GridCore.getLayers();
    var activeId = GridCore.getActiveLayerId();

    // Layer list (scrollable, max 3 visible)
    var $list = jQuery("<div>").addClass("tl-layers-list");
    jQuery.each(layers, function (_, layer) {
      $list.append(_buildLayerItem(layer, layer.id === activeId));
    });
    $panel.append($list);

    // Separator
    $panel.append(jQuery("<div>").addClass("tl-layers-separator"));

    // Always-visible add form
    $panel.append(_buildAddForm($panel));
  }

  function _openPanel() {
    if (!_$wrap) return;
    var $panel = _$wrap.find(".tl-layers-panel");
    _renderPanelContent($panel);
    $panel.addClass("tl-layers-panel--open");
    _$wrap.find(".tl-layers-btn").addClass("tl-layers-btn--active");
  }

  function _closePanel() {
    if (!_$wrap) return;
    _$wrap.find(".tl-layers-panel").removeClass("tl-layers-panel--open");
    _$wrap.find(".tl-layers-btn").removeClass("tl-layers-btn--active");
  }

  // ── Layer item ────────────────────────────────────

  function _showPreview(layer) {
    _hidePreview();
    _$activePreview = _buildLayerPreview(layer);
    _$wrap.append(_$activePreview);
    setTimeout(function () {
      if (_$activePreview) _$activePreview.addClass("tl-layer-preview-popup--visible");
    }, 10);
  }

  function _hidePreview() {
    if (_$activePreview) {
      _$activePreview.remove();
      _$activePreview = null;
    }
  }

  function _buildLayerPreview(layer) {
    var cfg = GridCore.getConfig();
    var tables = layer.id === GridCore.getActiveLayerId()
      ? GridCore.getTables()
      : (layer.tables || []);
    var cellSize = 4;
    var gap = 1;
    var cols = cfg.columns;
    var rows = cfg.rows;

    var $popup = jQuery("<div>").addClass("tl-layer-preview-popup");
    $popup.append(
      jQuery("<div>").addClass("tl-layer-preview-label").text(layer.label)
    );

    var $isoWrap = jQuery("<div>").addClass("tl-layer-preview-iso");
    var $gridWrap = jQuery("<div>").addClass("tl-layer-preview-grid-wrap");
    var $grid = jQuery("<div>").addClass("tl-layer-preview-grid").css({
      "grid-template-columns": "repeat(" + cols + ", " + cellSize + "px)",
      "grid-template-rows":    "repeat(" + rows + ", " + cellSize + "px)",
      "gap": gap + "px",
      "width":  (cols * cellSize + (cols - 1) * gap) + "px",
      "height": (rows * cellSize + (rows - 1) * gap) + "px",
    });

    for (var r = 1; r <= rows; r++) {
      for (var c = 1; c <= cols; c++) {
        $grid.append(
          jQuery("<div>").addClass("tl-layer-preview-cell").css({
            "grid-column": c + " / span 1",
            "grid-row":    r + " / span 1",
          })
        );
      }
    }

    jQuery.each(tables, function (_, t) {
      var statusColor = cfg.statusColors[t.status] || "#6b7280";
      $grid.append(
        jQuery("<div>").addClass("tl-layer-preview-table").css({
          "grid-column": t.col + " / span " + t.colSpan,
          "grid-row":    t.row + " / span " + t.rowSpan,
          "background":  statusColor,
        })
      );
    });

    $gridWrap.append($grid);
    $isoWrap.append($gridWrap);
    $popup.append($isoWrap);

    return $popup;
  }

  function _buildLayerItem(layer, isActive) {
    var $item = jQuery("<div>")
      .addClass("tl-layers-item" + (isActive ? " tl-layers-item--active" : ""))
      .attr("title", layer.label)
      .on("mouseenter", function () {
        clearTimeout(_hoverTimer);
        _hoverTimer = setTimeout(function () { _showPreview(layer); }, 500);
      })
      .on("mouseleave", function () {
        clearTimeout(_hoverTimer);
        _hidePreview();
      })
      .on("click", function () {
        if (isActive) return;
        var cfg = GridCore.getConfig();
        if (cfg.editMode !== false && GridCore.isEditing()) return;
        GridCore.switchLayer(layer.id);
        _rebuildGrid();
        var $panel = _$wrap.find(".tl-layers-panel");
        _renderPanelContent($panel);
        var cfg = GridCore.getConfig();
        if (typeof cfg.onLayerChange === "function")
          cfg.onLayerChange(GridCore.getActiveLayer(), GridCore.getLayout());
      });

    var isFaIcon = layer.icon && layer.icon.indexOf("fa-") !== -1;
    var $icon = jQuery("<div>").addClass("tl-layers-icon");
    if (isFaIcon) {
      $icon.append(jQuery("<i>").addClass(layer.icon));
    } else if (layer.icon && /\.(svg|png|jpe?g|gif|webp)/i.test(layer.icon)) {
      $icon.append(jQuery("<img>").attr("src", layer.icon).css({ width: "18px", height: "18px", "object-fit": "contain" }));
    } else {
      $icon.text(layer.icon || "?");
    }

    $item.append($icon);

    return $item;
  }

  // ── Add layer form (shown when Add Layout is clicked) ────────

  function _buildAddForm($panel) {
    var cfg = GridCore.getConfig();

    var $addBtn = jQuery("<button>")
      .addClass("tl-layers-add-submit")
      .html('<i class="fa-solid fa-plus"></i>')
      .on("click", function () {
        if (cfg.editMode !== false && GridCore.isEditing()) return;
        if (typeof cfg.onCreateLayer === "function") {
          cfg.onCreateLayer(function (details) {
            _createLayer(details, $panel);
          });
          return;
        }
        _openAddModal($panel);
      });

    return $addBtn;
  }

  function _openAddModal($panel) {
    var $overlay = jQuery("<div>").addClass("tl-overlay");

    var $modal = jQuery("<div>").addClass("tl-modal");

    $modal.append(
      jQuery("<h2>").html('<i class="fa-solid fa-layer-group"></i> New Layout')
    );

    var $nameField = jQuery("<div>").addClass("tl-field");
    $nameField.append(jQuery("<label>").text("Name"));
    var $nameInput = jQuery("<input>").attr({ type: "text", placeholder: "Layout name", maxlength: 30 });
    $nameField.append($nameInput);

    var $iconField = jQuery("<div>").addClass("tl-field");
    $iconField.append(jQuery("<label>").text("Icon"));
    var $iconInput = jQuery("<input>").attr({ type: "text", placeholder: "fa-solid fa-… or A, 1…", maxlength: 40 });
    $iconField.append($iconInput);

    var $actions = jQuery("<div>").addClass("tl-modal-actions");

    var $cancel = jQuery("<button>").addClass("tl-btn tl-btn-cancel").text("Cancel")
      .on("click", function () { $overlay.remove(); });

    var $create = jQuery("<button>").addClass("tl-btn tl-btn-primary").text("Add Layout")
      .on("click", function () {
        var labelVal = jQuery.trim($nameInput.val());
        if (!labelVal) { $nameInput.addClass("tl-input-error").trigger("focus"); return; }
        $nameInput.removeClass("tl-input-error");
        var iconVal = jQuery.trim($iconInput.val()) || labelVal.charAt(0).toUpperCase();
        $overlay.remove();
        _createLayer({ label: labelVal, icon: iconVal }, $panel);
      });

    $nameInput.on("input", function () { jQuery(this).removeClass("tl-input-error"); });
    $nameInput.on("keydown", function (e) { if (e.key === "Enter") $create.trigger("click"); });

    $actions.append($cancel, $create);
    $modal.append($nameField, $iconField, $actions);
    $overlay.append($modal);
    jQuery(".tl-root").first().append($overlay);

    $overlay.on("click", function (e) { if (jQuery(e.target).is($overlay)) $overlay.remove(); });

    setTimeout(function () { $nameInput.trigger("focus"); }, 50);
  }

  function _createLayer(details, $panel) {
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
    if ($panel) _renderPanelContent($panel);
    var cfg = GridCore.getConfig();
    if (typeof cfg.onLayerChange === "function")
      cfg.onLayerChange(layer, []);
  }

  // ── Grid rebuild on layer switch ──────────────────

  function _rebuildGrid() {
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  return { build: build };
})();
