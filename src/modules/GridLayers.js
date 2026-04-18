/**
 * GridLayers.js
 * Layer/floor tab bar — browser-style tabs for switching between layers.
 * Only active when cfg.layers is defined.
 *
 * Public API (called by GridToolbar):
 *   GridLayers.buildTabBar()   — returns the tab bar jQuery element
 *   GridLayers.renderTabs()    — re-renders tabs (called after edit mode changes)
 */
var GridLayers = (function () {
  var _$tabBar = null;

  function buildTabBar() {
    _$tabBar = jQuery("<div>").addClass("tl-tab-bar");
    _renderTabs();

    GridEvents.on("layer:added", function () { _renderTabs(); });
    GridEvents.on("layer:deleted", function () { _renderTabs(); });
    GridEvents.on("layer:reordered", function () { _renderTabs(); });
    GridEvents.on("layer:updated", function () { _renderTabs(); });
    GridEvents.on("layer:switched", function () { _renderTabs(); });

    return _$tabBar;
  }

  function _renderTabs() {
    if (!_$tabBar) return;
    _$tabBar.empty();

    var cfg = GridCore.getConfig();
    var layers = GridCore.getLayers();
    var activeId = GridCore.getActiveLayerId();

    jQuery.each(layers, function (_, layer) {
      var isActive = layer.id === activeId;
      var $tab = jQuery("<div>")
        .addClass("tl-tab" + (isActive ? " tl-tab--active" : ""))
        .attr({ "data-layer-id": layer.id, "draggable": "true" });

      var $icon = _buildIconBadge(layer);
      var $label = jQuery("<span>").addClass("tl-tab-label").text(layer.label);
      $tab.append($icon, $label);

      // Close button (only if more than 1 layer, in edit mode)
      if (layers.length > 1 && cfg.realTime === false && GridCore.isEditing()) {
        var $close = jQuery("<span>")
          .addClass("tl-tab-close")
          .html("&times;")
          .on("click", function (e) {
            e.stopPropagation();
            if (cfg.realTime === false && !GridCore.isEditing()) return;
            _confirmDeleteLayer(layer);
          });
        $tab.append($close);
      }

      // Click to switch layer
      $tab.on("click", function () {
        if (isActive) return;
        if (cfg.realTime === false && GridCore.isEditing()) return;
        GridCore.switchLayer(layer.id);
        _rebuildGrid();
      });

      // Drag-to-reorder
      $tab.on("dragstart", function (e) {
        if (cfg.realTime === false && !GridCore.isEditing()) { e.preventDefault(); return; }
        e.originalEvent.dataTransfer.effectAllowed = "move";
        e.originalEvent.dataTransfer.setData("text/plain", layer.id);
        $tab.addClass("tl-tab--dragging");
      });
      $tab.on("dragend", function () {
        $tab.removeClass("tl-tab--dragging");
        _$tabBar.find(".tl-tab--drag-over").removeClass("tl-tab--drag-over");
      });
      $tab.on("dragover", function (e) {
        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = "move";
        $tab.addClass("tl-tab--drag-over");
      });
      $tab.on("dragleave", function () {
        $tab.removeClass("tl-tab--drag-over");
      });
      $tab.on("drop", function (e) {
        e.preventDefault();
        $tab.removeClass("tl-tab--drag-over");
        var draggedId = e.originalEvent.dataTransfer.getData("text/plain");
        if (draggedId === layer.id) return;
        var currentIds = layers.map(function (l) { return l.id; });
        var fromIdx = currentIds.indexOf(draggedId);
        var toIdx = currentIds.indexOf(layer.id);
        if (fromIdx === -1 || toIdx === -1) return;
        currentIds.splice(fromIdx, 1);
        currentIds.splice(toIdx, 0, draggedId);
        GridCore.reorderLayers(currentIds);
      });

      // Double-click to rename
      $tab.on("dblclick", function (e) {
        e.stopPropagation();
        if (cfg.realTime !== false || !GridCore.isEditing()) return;
        _startTabRename($tab, layer);
      });

      _$tabBar.append($tab);
    });

    // Add-tab button
    var $addTab = jQuery("<div>")
      .addClass("tl-tab-add")
      .attr("title", "Add Floor")
      .html('<i class="fa-solid fa-plus"></i>')
      .on("click", function () {
        if (cfg.realTime === false && !GridCore.isEditing()) return;
        if (typeof cfg.onCreateLayer === "function") {
          cfg.onCreateLayer(function (details) {
            _createNewLayer(details);
          });
          return;
        }
        _openAddFloorModal();
      });
    _$tabBar.append($addTab);
  }

  function renderTabs() {
    _renderTabs();
  }

  // ── Tab rename ────────────────────────────────────

  function _startTabRename($tab, layer) {
    var $label = $tab.find(".tl-tab-label");
    var $input = jQuery("<input>")
      .addClass("tl-tab-rename-input")
      .attr({ type: "text", maxlength: 30 })
      .val(layer.label);
    $label.replaceWith($input);
    $input.trigger("focus").trigger("select");

    function commit() {
      var val = jQuery.trim($input.val());
      if (val && val !== layer.label) {
        GridCore.updateLayerMeta(layer.id, { label: val });
      }
      _renderTabs();
    }

    $input.on("blur", commit);
    $input.on("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); $input.trigger("blur"); }
      if (e.key === "Escape") { _renderTabs(); }
    });
    $input.on("click", function (e) { e.stopPropagation(); });
  }

  // ── Create / delete layer ─────────────────────────

  function _openAddFloorModal() {
    var cfg = GridCore.getConfig();
    var pickerCfg = cfg.iconPicker || {};
    var icons = pickerCfg.icons || [];
    var maxText = pickerCfg.maxTextLength || 4;
    var allowText = pickerCfg.allowText !== false;
    var _selectedIcon = "";

    var $overlay = jQuery("<div>").addClass("tl-overlay");
    var $modal = jQuery("<div>").addClass("tl-modal");

    $modal.append(
      jQuery("<h2>").html('<i class="fa-solid fa-layer-group"></i> New Floor')
    );

    var $nameField = jQuery("<div>").addClass("tl-field");
    $nameField.append(jQuery("<label>").text("Name"));
    var $nameInput = jQuery("<input>").attr({ type: "text", placeholder: "Floor name", maxlength: 30 });
    $nameField.append($nameInput);

    var $iconField = jQuery("<div>").addClass("tl-field");
    $iconField.append(jQuery("<label>").text("Icon"));

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

    var $create = jQuery("<button>").addClass("tl-btn tl-btn-primary").text("Add Floor")
      .on("click", function () {
        var labelVal = jQuery.trim($nameInput.val());
        if (!labelVal) { $nameInput.addClass("tl-input-error").trigger("focus"); return; }
        $nameInput.removeClass("tl-input-error");
        var iconVal = _selectedIcon || labelVal.charAt(0).toUpperCase();
        $overlay.remove();
        _createNewLayer({ label: labelVal, icon: iconVal });
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

  function _createNewLayer(details) {
    var label = (details && details.label) || "Floor";
    var icon = (details && details.icon) || label.charAt(0).toUpperCase();
    var layer = {
      id: "floor-" + Date.now(),
      label: label,
      icon: icon,
      rooms: [{
        id: "room-" + Date.now(),
        label: "Room 1",
        icon: "fa-solid fa-utensils",
        tables: [],
      }],
    };
    GridCore.addLayer(layer);
    GridCore.switchLayer(layer.id);
    _rebuildGrid();
  }

  function _confirmDeleteLayer(layer) {
    var cfg = GridCore.getConfig();
    var $overlay = jQuery("<div>").addClass("tl-overlay");
    var $modal = jQuery("<div>").addClass("tl-modal");
    $modal.append(
      jQuery("<h2>").html('<i class="fa-solid fa-triangle-exclamation"></i> Delete Floor')
    );
    $modal.append(
      jQuery("<p>").addClass("tl-modal-text").text(
        'Are you sure you want to delete "' + layer.label + '"? This action cannot be undone.'
      )
    );
    var $actions = jQuery("<div>").addClass("tl-modal-actions");
    var $cancel = jQuery("<button>").addClass("tl-btn tl-btn-cancel").text("Cancel")
      .on("click", function () { $overlay.remove(); });
    var $confirm = jQuery("<button>").addClass("tl-btn tl-btn-danger").text("Delete")
      .on("click", function () {
        $overlay.remove();
        var wasActive = (layer.id === GridCore.getActiveLayerId());
        GridCore.deleteLayer(layer.id);
        if (wasActive) _rebuildGrid();
      });
    $actions.append($cancel, $confirm);
    $modal.append($actions);
    $overlay.append($modal);
    jQuery(".tl-root").first().append($overlay);
    $overlay.on("click", function (e) { if (jQuery(e.target).is($overlay)) $overlay.remove(); });
  }

  // ── Icon badge ────────────────────────────────────

  function _buildIconBadge(layer) {
    var $badge = jQuery("<div>").addClass("tl-toolbar-icon-badge");
    if (layer) _renderIconContent($badge, layer.icon, layer.label);
    return $badge;
  }

  function _renderIconContent($el, iconValue, label) {
    $el.empty();
    if (!iconValue) { $el.text(label ? label.charAt(0).toUpperCase() : "?"); return; }
    if (iconValue.indexOf("fa-") !== -1) { $el.append(jQuery("<i>").addClass(iconValue)); return; }
    var lower = iconValue.toLowerCase();
    if (lower.indexOf(".svg") !== -1 || lower.indexOf(".png") !== -1 ||
        lower.indexOf(".jpg") !== -1 || lower.indexOf(".jpeg") !== -1 ||
        lower.indexOf(".gif") !== -1 || lower.indexOf(".webp") !== -1) {
      $el.append(jQuery("<img>").attr("src", iconValue).addClass("tl-toolbar-icon-img"));
      return;
    }
    $el.text(iconValue);
  }

  // ── Helpers ───────────────────────────────────────

  function _rebuildGrid() {
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  return {
    buildTabBar: buildTabBar,
    renderTabs: renderTabs,
  };
})();
