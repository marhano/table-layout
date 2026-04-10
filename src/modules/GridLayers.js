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

    // Re-render panel when layers change
    var _refreshPanel = function () {
      var $p = _$wrap.find(".tl-layers-panel");
      if ($p.length) _renderPanelContent($p);
    };
    GridEvents.on("layer:updated", _refreshPanel);
    GridEvents.on("layer:deleted", _refreshPanel);
    GridEvents.on("layer:reordered", _refreshPanel);
    GridEvents.on("layer:switched", _refreshPanel);

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

  function _showPreview(layer, $item) {
    var cfg = GridCore.getConfig();
    if (cfg.layerPreview === false) return;
    _hidePreview();
    _$activePreview = _buildLayerPreview(layer);
    _$wrap.append(_$activePreview);

    // Position relative to the hovered item within _$wrap
    var wrapOffset = _$wrap.offset();
    var itemOffset = $item.offset();
    var itemH = $item.outerHeight();
    var topPos = itemOffset.top - wrapOffset.top + itemH / 2;
    _$activePreview.css({ top: topPos + "px" });

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
    var cols = cfg.columns;
    var rows = cfg.rows;

    // Compute bounding box of all tables
    var minC = cols + 1, minR = rows + 1, maxC = 0, maxR = 0;
    jQuery.each(tables, function (_, t) {
      if (t.col < minC) minC = t.col;
      if (t.row < minR) minR = t.row;
      var endC = t.col + t.colSpan - 1;
      var endR = t.row + t.rowSpan - 1;
      if (endC > maxC) maxC = endC;
      if (endR > maxR) maxR = endR;
    });

    // If no tables, show full grid
    if (tables.length === 0) {
      minC = 1; minR = 1; maxC = cols; maxR = rows;
    }

    // Add 1-cell padding around content, clamped to grid bounds
    minC = Math.max(1, minC - 1);
    minR = Math.max(1, minR - 1);
    maxC = Math.min(cols, maxC + 1);
    maxR = Math.min(rows, maxR + 1);

    var cropCols = maxC - minC + 1;
    var cropRows = maxR - minR + 1;

    // Target size: fit within a max preview box
    var maxPreviewW = 120;
    var maxPreviewH = 90;
    var gap = 1;

    // Compute cell size to fit
    var cellW = Math.floor((maxPreviewW - (cropCols - 1) * gap) / cropCols);
    var cellH = Math.floor((maxPreviewH - (cropRows - 1) * gap) / cropRows);
    var cellSize = Math.max(2, Math.min(cellW, cellH));

    var gridW = cropCols * cellSize + (cropCols - 1) * gap;
    var gridH = cropRows * cellSize + (cropRows - 1) * gap;

    var $popup = jQuery("<div>").addClass("tl-layer-preview-popup");

    var $grid = jQuery("<div>").addClass("tl-layer-preview-grid").css({
      "grid-template-columns": "repeat(" + cropCols + ", " + cellSize + "px)",
      "grid-template-rows":    "repeat(" + cropRows + ", " + cellSize + "px)",
      "gap": gap + "px",
      "width":  gridW + "px",
      "height": gridH + "px",
    });

    // Background cells
    for (var r = 0; r < cropRows; r++) {
      for (var c = 0; c < cropCols; c++) {
        $grid.append(
          jQuery("<div>").addClass("tl-layer-preview-cell").css({
            "grid-column": (c + 1) + " / span 1",
            "grid-row":    (r + 1) + " / span 1",
          })
        );
      }
    }

    // Table blocks — offset to cropped coordinates
    jQuery.each(tables, function (_, t) {
      var statusColor = cfg.statusColors[t.status] || "#6b7280";
      $grid.append(
        jQuery("<div>").addClass("tl-layer-preview-table").css({
          "grid-column": (t.col - minC + 1) + " / span " + t.colSpan,
          "grid-row":    (t.row - minR + 1) + " / span " + t.rowSpan,
          "background":  statusColor,
        })
      );
    });

    $popup.append($grid);
    return $popup;
  }

  function _buildLayerItem(layer, isActive) {
    var layers = GridCore.getLayers();
    var cfg = GridCore.getConfig();

    var $item = jQuery("<div>")
      .addClass("tl-layers-item" + (isActive ? " tl-layers-item--active" : ""))
      .attr({ "title": layer.label, "data-layer-id": layer.id, "draggable": "true" })
      .on("mouseenter", function () {
        var self = this;
        clearTimeout(_hoverTimer);
        _hoverTimer = setTimeout(function () { _showPreview(layer, jQuery(self)); }, 500);
      })
      .on("mouseleave", function () {
        clearTimeout(_hoverTimer);
        _hidePreview();
      })
      .on("click", function (e) {
        if (isActive) return;
        if (cfg.editMode !== false && GridCore.isEditing()) return;
        GridCore.switchLayer(layer.id);
        _rebuildGrid();
        var $panel = _$wrap.find(".tl-layers-panel");
        _renderPanelContent($panel);
        if (typeof cfg.onLayerChange === "function")
          cfg.onLayerChange(GridCore.getActiveLayer(), GridCore.getLayout());
      });

    // Drag-to-reorder events
    $item.on("dragstart", function (e) {
      if (cfg.editMode !== false && GridCore.isEditing()) { e.preventDefault(); return; }
      e.originalEvent.dataTransfer.effectAllowed = "move";
      e.originalEvent.dataTransfer.setData("text/plain", layer.id);
      $item.addClass("tl-layers-item--dragging");
    });
    $item.on("dragend", function () {
      $item.removeClass("tl-layers-item--dragging");
      _$wrap.find(".tl-layers-item--drag-over").removeClass("tl-layers-item--drag-over");
    });
    $item.on("dragover", function (e) {
      e.preventDefault();
      e.originalEvent.dataTransfer.dropEffect = "move";
      $item.addClass("tl-layers-item--drag-over");
    });
    $item.on("dragleave", function () {
      $item.removeClass("tl-layers-item--drag-over");
    });
    $item.on("drop", function (e) {
      e.preventDefault();
      $item.removeClass("tl-layers-item--drag-over");
      var draggedId = e.originalEvent.dataTransfer.getData("text/plain");
      if (draggedId === layer.id) return;
      // Build new order
      var currentIds = layers.map(function (l) { return l.id; });
      var fromIdx = currentIds.indexOf(draggedId);
      var toIdx = currentIds.indexOf(layer.id);
      if (fromIdx === -1 || toIdx === -1) return;
      currentIds.splice(fromIdx, 1);
      currentIds.splice(toIdx, 0, draggedId);
      GridCore.reorderLayers(currentIds);
      var $panel = _$wrap.find(".tl-layers-panel");
      _renderPanelContent($panel);
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
    var cfg = GridCore.getConfig();
    var pickerCfg = cfg.iconPicker || {};
    var icons = pickerCfg.icons || [];
    var maxText = pickerCfg.maxTextLength || 4;
    var allowText = pickerCfg.allowText !== false;
    var _selectedIcon = "";

    var $overlay = jQuery("<div>").addClass("tl-overlay");

    var $modal = jQuery("<div>").addClass("tl-modal");

    $modal.append(
      jQuery("<h2>").html('<i class="fa-solid fa-layer-group"></i> New Layout')
    );

    var $nameField = jQuery("<div>").addClass("tl-field");
    $nameField.append(jQuery("<label>").text("Name"));
    var $nameInput = jQuery("<input>").attr({ type: "text", placeholder: "Layout name", maxlength: 30 });
    $nameField.append($nameInput);

    // Icon field with picker grid
    var $iconField = jQuery("<div>").addClass("tl-field");
    $iconField.append(jQuery("<label>").text("Icon"));

    // Preview of selected icon
    var $iconPreview = jQuery("<div>").addClass("tl-modal-icon-preview");
    $iconPreview.text("?");
    $iconField.append($iconPreview);

    function _updatePreview(val) {
      $iconPreview.empty();
      if (!val) { $iconPreview.text("?"); return; }
      if (val.indexOf("fa-") !== -1) {
        $iconPreview.append(jQuery("<i>").addClass(val));
      } else if (/\.(svg|png|jpe?g|gif|webp)/i.test(val)) {
        $iconPreview.append(jQuery("<img>").attr("src", val).css({ width: "22px", height: "22px", "object-fit": "contain" }));
      } else {
        $iconPreview.text(val);
      }
    }

    // Icon grid
    if (icons.length) {
      var $grid = jQuery("<div>").addClass("tl-modal-icon-grid");
      jQuery.each(icons, function (_, ico) {
        var $btn = jQuery("<button>")
          .addClass("tl-icon-picker-btn")
          .attr({ "title": ico.label || "", "type": "button" })
          .on("click", function () {
            _selectedIcon = ico.value;
            $grid.find(".tl-icon-picker-btn").removeClass("tl-icon-picker-btn--active");
            jQuery(this).addClass("tl-icon-picker-btn--active");
            if ($textInput) $textInput.val("");
            _updatePreview(_selectedIcon);
          });

        if (ico.type === "fa") {
          $btn.append(jQuery("<i>").addClass(ico.value));
        } else if (ico.type === "svg" || ico.type === "img") {
          $btn.append(jQuery("<img>").attr("src", ico.value).addClass("tl-icon-picker-img"));
        } else {
          $btn.text(ico.value);
        }
        $grid.append($btn);
      });
      $iconField.append($grid);
    }

    // Text input fallback
    var $textInput = null;
    if (allowText) {
      var $textRow = jQuery("<div>").addClass("tl-icon-picker-text-row").css("margin-top", "8px");
      $textInput = jQuery("<input>")
        .addClass("tl-icon-picker-text-input")
        .attr({ type: "text", maxlength: maxText, placeholder: "Or type: A, 1F…" })
        .on("input", function () {
          var v = jQuery.trim(jQuery(this).val());
          if (v) {
            _selectedIcon = v;
            $iconField.find(".tl-icon-picker-btn").removeClass("tl-icon-picker-btn--active");
            _updatePreview(v);
          }
        });
      $textRow.append($textInput);
      $iconField.append($textRow);
    }

    var $actions = jQuery("<div>").addClass("tl-modal-actions");

    var $cancel = jQuery("<button>").addClass("tl-btn tl-btn-cancel").text("Cancel")
      .on("click", function () { $overlay.remove(); });

    var $create = jQuery("<button>").addClass("tl-btn tl-btn-primary").text("Add Layout")
      .on("click", function () {
        var labelVal = jQuery.trim($nameInput.val());
        if (!labelVal) { $nameInput.addClass("tl-input-error").trigger("focus"); return; }
        $nameInput.removeClass("tl-input-error");
        var iconVal = _selectedIcon || labelVal.charAt(0).toUpperCase();
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
