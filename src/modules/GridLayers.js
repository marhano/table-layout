/**
 * GridLayers.js
 * Layer/floor tab bar — browser-style tabs for switching between layers.
 * Only active when cfg.layers is defined.
 * Per-instance state via _TL context.
 */
var GridLayers = (function () {
  var _inst = {};

  function _c() { return _inst[_TL.cid()]; }

  function init() {
    _inst[_TL.cid()] = { $tabBar: null, $scrollArea: null };
  }

  function destroy() {
    delete _inst[_TL.cid()];
  }

  function buildTabBar() {
    var ctx = _c();
    ctx.$tabBar = jQuery("<div>").addClass("tl-tab-bar");
    ctx.$scrollArea = jQuery("<div>").addClass("tl-tab-scroll-area");
    ctx.$tabBar.append(ctx.$scrollArea);
    _renderTabs();

    GridEvents.on("layer:added", function () { _renderTabs(); });
    GridEvents.on("layer:deleted", function () { _renderTabs(); });
    GridEvents.on("layer:reordered", function () { _renderTabs(); });
    GridEvents.on("layer:updated", function () { _renderTabs(); });
    GridEvents.on("layer:switched", function () { _renderTabs(); });

    return ctx.$tabBar;
  }

  function _getNextFloorNumber() {
    var used = {};
    GridCore.getLayers().forEach(function (l) {
      var n = parseInt(l.id, 10);
      if (!isNaN(n) && n > 0) used[n] = true;
    });
    var n = 1;
    while (used[n]) n++;
    return n;
  }

  function _renderTabs() {
    var ctx = _c();
    if (!ctx || !ctx.$tabBar) return;
    ctx.$scrollArea.empty();

    var cid = _TL.cid();
    var cfg = GridCore.getConfig();
    var showIcons = cfg.showIcons !== false;
    var autoName = cfg.autoNameFloors === true;
    var layers = GridCore.getLayers();
    if (autoName) {
      layers = layers.slice().sort(function (a, b) {
        return parseInt(a.id, 10) - parseInt(b.id, 10);
      });
    }
    var activeId = GridCore.getActiveLayerId();

    jQuery.each(layers, function (_, layer) {
      var isActive = layer.id === activeId;
      var $tab = jQuery("<div>")
        .addClass("tl-tab" + (isActive ? " tl-tab--active" : ""))
        .attr({ "data-layer-id": layer.id, "draggable": autoName ? "false" : "true" });

      var $label = jQuery("<span>").addClass("tl-tab-label").text(layer.label);
      if (showIcons) $tab.append(_buildIconBadge(layer));
      $tab.append($label);

      if (layers.length > 1 && cfg.mode === "edit") {
        var $close = jQuery("<span>")
          .addClass("tl-tab-close")
          .html("&times;")
          .on("click", function (e) {
            e.stopPropagation();
            _TL.use(cid);
            if (GridCore.isEditing()) return;
            _confirmDeleteLayer(layer);
          });
        $tab.append($close);
      }

      $tab.on("click", function () {
        _TL.use(cid);
        if (isActive) return;
        if (cfg.realTime === false && GridCore.isEditing()) return;
        GridCore.switchLayer(layer.id);
        _rebuildGrid();
      });

      if (!autoName) {
        $tab.on("dragstart", function (e) {
          _TL.use(cid);
          if (GridCore.isEditing()) { e.preventDefault(); return; }
          e.originalEvent.dataTransfer.effectAllowed = "move";
          e.originalEvent.dataTransfer.setData("text/plain", layer.id);
          $tab.addClass("tl-tab--dragging");
        });
        $tab.on("dragend", function () {
          $tab.removeClass("tl-tab--dragging");
          ctx.$scrollArea.find(".tl-tab--drag-over").removeClass("tl-tab--drag-over");
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
          _TL.use(cid);
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
      }

      ctx.$scrollArea.append($tab);
    });
  }

  function buildAddButton() {
    var cid = _TL.cid();
    return jQuery("<div>")
      .addClass("tl-tab-add")
      .attr("title", "Add Floor")
      .html('<i class="fa-solid fa-plus"></i>')
      .on("click", function () {
        _TL.use(cid);
        if (GridCore.isEditing()) return;
        var cfg = GridCore.getConfig();
        if (typeof cfg.onCreateLayer === "function") {
          cfg.onCreateLayer(function (details) { _TL.use(cid); _createNewLayer(details); });
          return;
        }
        _openAddFloorModal();
      });
  }

  function renderTabs() {
    _renderTabs();
  }

  function _openAddFloorModal() {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();
    var showIcons = cfg.showIcons !== false;
    var autoName = cfg.autoNameFloors === true;
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
    var autoLabel = autoName ? ("Floor " + _getNextFloorNumber()) : null;
    var $nameInput = jQuery("<input>").attr({ type: "text", placeholder: "Floor name", maxlength: 30 });
    if (autoName) $nameInput.val(autoLabel).prop("disabled", true);
    $nameField.append($nameInput);

    var $iconField = null;
    var $textInput = null;

    if (showIcons) {
      $iconField = jQuery("<div>").addClass("tl-field");
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
    }

    var $actions = jQuery("<div>").addClass("tl-modal-actions");

    var $cancel = jQuery("<button>").addClass("tl-btn tl-btn-cancel").text("Cancel")
      .on("click", function () { $overlay.remove(); });

    var $create = jQuery("<button>").addClass("tl-btn tl-btn-primary").text("Add Floor")
      .on("click", function () {
        var details = {};
        if (!autoName) {
          var labelVal = jQuery.trim($nameInput.val());
          if (!labelVal) { $nameInput.addClass("tl-input-error").trigger("focus"); return; }
          $nameInput.removeClass("tl-input-error");
          details.label = labelVal;
          if (showIcons) details.icon = _selectedIcon || labelVal.charAt(0).toUpperCase();
        } else {
          if (showIcons) details.icon = _selectedIcon || undefined;
        }
        $overlay.remove();
        _TL.use(cid);
        _createNewLayer(details);
      });

    if (!autoName) {
      $nameInput.on("input", function () { jQuery(this).removeClass("tl-input-error"); });
      $nameInput.on("keydown", function (e) { if (e.key === "Enter") $create.trigger("click"); });
    }

    $actions.append($cancel, $create);
    if (showIcons) {
      $modal.append($nameField, $iconField, $actions);
    } else {
      $modal.append($nameField, $actions);
    }
    $overlay.append($modal);
    jQuery("#" + cid).append($overlay);

    $overlay.on("mousedown", function (e) { $overlay.data("tl-md", jQuery(e.target).is($overlay)); })
             .on("click",    function (e) { if ($overlay.data("tl-md") && jQuery(e.target).is($overlay)) $overlay.remove(); });

    setTimeout(function () { $nameInput.trigger("focus"); }, 50);
  }

  function _createNewLayer(details) {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();
    var showIcons = cfg.showIcons !== false;
    var autoName = cfg.autoNameFloors === true;

    var floorNum, layerId, label;
    if (autoName) {
      floorNum = _getNextFloorNumber();
      layerId = floorNum;
      label = "Floor " + floorNum;
    } else {
      layerId = "floor-" + Date.now();
      label = (details && details.label) || "Floor";
    }

    var layer = {
      id: layerId,
      label: label,
      icon: showIcons ? ((details && details.icon) || label.charAt(0).toUpperCase()) : undefined,
      rooms: [{
        id: autoName ? 1 : "room-" + Date.now(),
        label: "Room 1",
        icon: showIcons ? "fa-solid fa-utensils" : undefined,
        tables: [],
      }],
    };
    GridCore.addLayer(layer);
    // Only switch to new floor when not currently editing the table grid
    if (!GridCore.isEditing()) {
      GridCore.switchLayer(layer.id);
      _rebuildGrid();
    }
    if (typeof cfg.onAddFloor === "function") {
      var rollback = function () {
        _TL.use(cid);
        var wasThisActive = (GridCore.getActiveLayerId() === layer.id);
        GridCore.deleteLayer(layer.id);
        if (wasThisActive) _rebuildGrid();
      };
      var callbackLayer = jQuery.extend(true, {}, layer);
      if (cfg.mapId !== undefined) callbackLayer.mapId = cfg.mapId;
      cfg.onAddFloor(callbackLayer, rollback);
    }
  }

  function _confirmDeleteLayer(layer) {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();
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
        _TL.use(cid);
        var layers = GridCore.getLayers();
        var originalIdx = layers.findIndex(function (l) { return l.id === layer.id; });
        var wasActive = (layer.id === GridCore.getActiveLayerId());
        GridCore.deleteLayer(layer.id);
        if (wasActive) _rebuildGrid();
        if (typeof cfg.onDeleteFloor === "function") {
          var rollback = function () {
            _TL.use(cid);
            GridCore.getLayers().splice(originalIdx, 0, layer);
            if (wasActive) {
              GridCore.switchLayer(layer.id);
              _rebuildGrid();
            }
            _renderTabs();
          };
          var callbackLayer = jQuery.extend(true, {}, layer);
          if (cfg.mapId !== undefined) callbackLayer.mapId = cfg.mapId;
          cfg.onDeleteFloor(callbackLayer, rollback);
        }
      });
    $actions.append($cancel, $confirm);
    $modal.append($actions);
    $overlay.append($modal);
    jQuery("#" + cid).append($overlay);
    $overlay.on("mousedown", function (e) { $overlay.data("tl-md", jQuery(e.target).is($overlay)); })
             .on("click",    function (e) { if ($overlay.data("tl-md") && jQuery(e.target).is($overlay)) $overlay.remove(); });
  }

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

  function _rebuildGrid() {
    _TL.$(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  return {
    init: init,
    destroy: destroy,
    buildTabBar: buildTabBar,
    buildAddButton: buildAddButton,
    renderTabs: renderTabs,
  };
})();
