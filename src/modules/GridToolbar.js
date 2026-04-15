var GridToolbar = (function () {
  var _activeTool = null;
  var _$layoutName = null;
  var _$layoutIcon = null;
  var _$editSection = null;
  var _nameEditing = false;
  var _$iconPicker = null;
  var _$settingsPopup = null;
  var _$tabBar = null;

  // ── Toolbar build ─────────────────────────────────

  function build() {
    var cfg = GridCore.getConfig();
    var $toolbar = jQuery("<div>").addClass("tl-toolbar");

    // Left: browser-style layer tabs
    if (cfg.layers && cfg.layers.length) {
      _$tabBar = jQuery("<div>").addClass("tl-tab-bar");
      _renderTabs();
      $toolbar.append(_$tabBar);

      // Listen for layer events to refresh tabs
      GridEvents.on("layer:added", function () { _renderTabs(); });
      GridEvents.on("layer:deleted", function () { _renderTabs(); });
      GridEvents.on("layer:reordered", function () { _renderTabs(); });
      GridEvents.on("layer:updated", function () { _renderTabs(); });
      GridEvents.on("layer:switched", function () { _renderTabs(); _refreshRoomDisplay(GridCore.getActiveRoom()); });
    }

    $toolbar.append(jQuery("<div>").addClass("tl-toolbar-spacer"));

    // Right: room icon + name + settings + save/discard
    if (cfg.layers && cfg.layers.length) {
      var $right = jQuery("<div>").addClass("tl-toolbar-right");

      var activeRoom = GridCore.getActiveRoom();

      _$layoutIcon = _buildIconBadge(activeRoom);
      _$layoutIcon.on("click", function (e) {
        e.stopPropagation();
        _toggleIconPicker();
      });
      // $right.append(_$layoutIcon);

      _$layoutName = jQuery("<span>")
        .addClass("tl-toolbar-layout-name")
        .text(activeRoom ? activeRoom.label : "")
        .on("click", function () { _startNameEdit(); });
      // $right.append(_$layoutName);

      GridEvents.on("room:switched", function (room) {
        _refreshRoomDisplay(room);
      });

      _$editSection = jQuery("<div>").addClass("tl-toolbar-actions");
      _renderEditControls();
      $right.append(_$editSection);

      $toolbar.append($right);
    }

    // Close icon picker / settings popup on outside click
    jQuery(document).on("mousedown.tl-iconpicker", function (e) {
      if (_$iconPicker && !jQuery(e.target).closest(".tl-icon-picker, .tl-toolbar-icon-badge").length) {
        _closeIconPicker();
      }
      if (_$settingsPopup && !jQuery(e.target).closest(".tl-settings-popup, .tl-toolbar-btn--settings").length) {
        _closeSettingsPopup();
      }
    });

    return $toolbar;
  }

  // ── Browser-style layer tabs ──────────────────────

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

      var $label = jQuery("<span>").addClass("tl-tab-label").text(layer.label);
      var $icon = _buildIconBadge(layer);
      $tab.append($icon);
      $tab.append($label);

      // Close button (only if more than 1 layer)
      if (layers.length > 1) {
        var $close = jQuery("<span>")
          .addClass("tl-tab-close")
          .html("&times;")
          .on("click", function (e) {
            e.stopPropagation();
            if (cfg.editMode !== false && !GridCore.isEditing()) return;
            _confirmDeleteLayer(layer);
          });
        $tab.append($close);
      }

      // Click to switch
      $tab.on("click", function () {
        if (isActive) return;
        if (cfg.editMode !== false && GridCore.isEditing()) return;
        GridCore.switchLayer(layer.id);
        _rebuildGrid();
      });

      // Drag-to-reorder
      $tab.on("dragstart", function (e) {
        if (cfg.editMode !== false && !GridCore.isEditing()) { e.preventDefault(); return; }
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

      // Double-click to rename (only in edit mode)
      $tab.on("dblclick", function (e) {
        e.stopPropagation();
        if (cfg.editMode === false || !GridCore.isEditing()) return;
        _startTabRename($tab, layer);
      });

      _$tabBar.append($tab);
    });

    // Add tab button
    var $addTab = jQuery("<div>")
      .addClass("tl-tab-add")
      .attr("title", "Add Layer")
      .html('<i class="fa-solid fa-plus"></i>')
      .on("click", function () {
        if (cfg.editMode !== false && !GridCore.isEditing()) return;
        if (typeof cfg.onCreateLayer === "function") {
          cfg.onCreateLayer(function (details) {
            _createNewLayer(details);
          });
          return;
        }
        _createNewLayer({ label: "Layer " + (layers.length + 1) });
      });
    _$tabBar.append($addTab);
  }

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

  function _createNewLayer(details) {
    var label = (details && details.label) || "Layer";
    var layer = {
      id: "layer-" + Date.now(),
      label: label,
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

  // ── Icon badge (display for active room) ───────────

  function _buildIconBadge(room) {
    var $badge = jQuery("<div>").addClass("tl-toolbar-icon-badge");
    if (room) {
      _renderIconContent($badge, room.icon, room.label);
    }
    return $badge;
  }

  function _renderIconContent($el, iconValue, label) {
    $el.empty();
    if (!iconValue) {
      $el.text(label ? label.charAt(0).toUpperCase() : "?");
      return;
    }
    if (iconValue.indexOf("fa-") !== -1) {
      $el.append(jQuery("<i>").addClass(iconValue));
      return;
    }
    var lower = iconValue.toLowerCase();
    if (lower.indexOf(".svg") !== -1 || lower.indexOf(".png") !== -1 ||
        lower.indexOf(".jpg") !== -1 || lower.indexOf(".jpeg") !== -1 ||
        lower.indexOf(".gif") !== -1 || lower.indexOf(".webp") !== -1) {
      $el.append(jQuery("<img>").attr("src", iconValue).addClass("tl-toolbar-icon-img"));
      return;
    }
    $el.text(iconValue);
  }

  function _refreshRoomDisplay(room) {
    if (_$layoutName && !_nameEditing) {
      _$layoutName.text(room ? room.label : "");
    }
    if (_$layoutIcon) {
      _$layoutIcon.empty();
      if (room) _renderIconContent(_$layoutIcon, room.icon, room.label);
    }
  }

  // ── Inline name editing (click to edit room name) ──

  function _startNameEdit() {
    var cfg = GridCore.getConfig();
    if (!cfg.layers || !cfg.layers.length) return;
    if (cfg.editMode === false || !GridCore.isEditing()) return;
    if (_nameEditing) return;
    var room = GridCore.getActiveRoom();
    if (!room) return;

    _nameEditing = true;
    var $input = jQuery("<input>")
      .addClass("tl-toolbar-layout-name-input")
      .attr({ type: "text", maxlength: 30, placeholder: "Room name" })
      .val(room.label);

    _$layoutName.replaceWith($input);
    _$layoutName = $input;
    $input.trigger("focus").trigger("select");

    function commit() {
      if (!_nameEditing) return;
      _nameEditing = false;
      var val = jQuery.trim($input.val());
      if (val && val !== room.label) {
        GridCore.updateRoomMeta(room.id, { label: val });
        var c = GridCore.getConfig();
        if (typeof c.onRoomChange === "function" && !GridCore.isEditing())
          c.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
      }
      var updatedRoom = GridCore.getActiveRoom();
      var $span = jQuery("<span>")
        .addClass("tl-toolbar-layout-name")
        .text(updatedRoom ? updatedRoom.label : "")
        .on("click", function () { _startNameEdit(); });
      $input.replaceWith($span);
      _$layoutName = $span;
    }

    $input.on("blur", commit);
    $input.on("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); $input.trigger("blur"); }
      if (e.key === "Escape") {
        _nameEditing = false;
        var $span = jQuery("<span>")
          .addClass("tl-toolbar-layout-name")
          .text(room.label)
          .on("click", function () { _startNameEdit(); });
        $input.replaceWith($span);
        _$layoutName = $span;
      }
    });
  }

  // ── Icon picker popup (for room icon) ──────────────

  function _toggleIconPicker() {
    var cfg = GridCore.getConfig();
    if (cfg.editMode === false || !GridCore.isEditing()) return;
    if (_$iconPicker) {
      _closeIconPicker();
    } else {
      _openIconPicker();
    }
  }

  function _closeIconPicker() {
    if (_$iconPicker) {
      _$iconPicker.remove();
      _$iconPicker = null;
    }
    if (_$layoutIcon) _$layoutIcon.removeClass("tl-toolbar-icon-badge--picker-open");
  }

  function _openIconPicker() {
    var cfg = GridCore.getConfig();
    if (!cfg.layers || !cfg.layers.length) return;
    var room = GridCore.getActiveRoom();
    if (!room) return;
    var pickerCfg = cfg.iconPicker || {};
    var icons = pickerCfg.icons || [];
    var maxText = pickerCfg.maxTextLength || 4;
    var allowText = pickerCfg.allowText !== false;

    _closeIconPicker();

    var $picker = jQuery("<div>").addClass("tl-icon-picker");

    $picker.append(jQuery("<div>").addClass("tl-icon-picker-header").text("Choose Icon"));

    if (icons.length) {
      var $grid = jQuery("<div>").addClass("tl-icon-picker-grid");
      jQuery.each(icons, function (_, ico) {
        var $btn = jQuery("<button>")
          .addClass("tl-icon-picker-btn")
          .attr("title", ico.label || "")
          .on("click", function () {
            _selectIcon(room, ico.value);
          });

        if (ico.type === "fa") {
          $btn.append(jQuery("<i>").addClass(ico.value));
        } else if (ico.type === "svg" || ico.type === "img") {
          $btn.append(jQuery("<img>").attr("src", ico.value).addClass("tl-icon-picker-img"));
        } else {
          $btn.text(ico.value);
        }

        if (room.icon === ico.value) $btn.addClass("tl-icon-picker-btn--active");

        $grid.append($btn);
      });
      $picker.append($grid);
    }

    if (allowText) {
      var $textSection = jQuery("<div>").addClass("tl-icon-picker-text-section");
      $textSection.append(jQuery("<span>").addClass("tl-icon-picker-text-label").text("Or type text:"));
      var $row = jQuery("<div>").addClass("tl-icon-picker-text-row");
      var $textInput = jQuery("<input>")
        .addClass("tl-icon-picker-text-input")
        .attr({ type: "text", maxlength: maxText, placeholder: "A, 1F…" })
        .val(
          room.icon && room.icon.indexOf("fa-") === -1 &&
          room.icon.indexOf(".") === -1 ? room.icon : ""
        );
      var $applyBtn = jQuery("<button>")
        .addClass("tl-icon-picker-apply")
        .text("Apply")
        .on("click", function () {
          var v = jQuery.trim($textInput.val());
          if (v) _selectIcon(room, v);
        });
      $textInput.on("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); $applyBtn.trigger("click"); }
      });
      $row.append($textInput, $applyBtn);
      $textSection.append($row);
      $picker.append($textSection);
    }

    _$layoutIcon.addClass("tl-toolbar-icon-badge--picker-open");
    var $right = _$layoutIcon.closest(".tl-toolbar-right");
    $right.css("position", "relative");
    $right.append($picker);
    _$iconPicker = $picker;

    setTimeout(function () { $picker.addClass("tl-icon-picker--open"); }, 10);
  }

  function _confirmDeleteLayer(layer) {
    var cfg = GridCore.getConfig();
    var $overlay = jQuery("<div>").addClass("tl-overlay");
    var $modal = jQuery("<div>").addClass("tl-modal");
    $modal.append(
      jQuery("<h2>").html('<i class="fa-solid fa-triangle-exclamation"></i> Delete Layer')
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
        if (wasActive) {
          jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
        }
        _refreshRoomDisplay(GridCore.getActiveRoom());
      });
    $actions.append($cancel, $confirm);
    $modal.append($actions);
    $overlay.append($modal);
    jQuery(".tl-root").first().append($overlay);
    $overlay.on("click", function (e) { if (jQuery(e.target).is($overlay)) $overlay.remove(); });
  }

  function _confirmDeleteRoom(room) {
    var cfg = GridCore.getConfig();
    var $overlay = jQuery("<div>").addClass("tl-overlay");
    var $modal = jQuery("<div>").addClass("tl-modal");
    $modal.append(
      jQuery("<h2>").html('<i class="fa-solid fa-triangle-exclamation"></i> Delete Room')
    );
    $modal.append(
      jQuery("<p>").addClass("tl-modal-text").text(
        'Are you sure you want to delete "' + room.label + '"? This action cannot be undone.'
      )
    );
    var $actions = jQuery("<div>").addClass("tl-modal-actions");
    var $cancel = jQuery("<button>").addClass("tl-btn tl-btn-cancel").text("Cancel")
      .on("click", function () { $overlay.remove(); });
    var $confirm = jQuery("<button>").addClass("tl-btn tl-btn-danger").text("Delete")
      .on("click", function () {
        $overlay.remove();
        var wasActive = (room.id === GridCore.getActiveRoomId());
        GridCore.deleteRoom(room.id);
        if (wasActive) {
          jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
        }
        _refreshRoomDisplay(GridCore.getActiveRoom());
        if (typeof cfg.onRoomChange === "function")
          cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
      });
    $actions.append($cancel, $confirm);
    $modal.append($actions);
    $overlay.append($modal);
    jQuery(".tl-root").first().append($overlay);
    $overlay.on("click", function (e) { if (jQuery(e.target).is($overlay)) $overlay.remove(); });
  }

  function _selectIcon(room, value) {
    GridCore.updateRoomMeta(room.id, { icon: value });
    var cfg = GridCore.getConfig();
    if (typeof cfg.onRoomChange === "function" && !GridCore.isEditing())
      cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
    var updated = GridCore.getActiveRoom();
    _$layoutIcon.find(".tl-icon-picker").detach();
    _renderIconContent(_$layoutIcon, updated.icon, updated.label);
    _closeIconPicker();
    _$layoutIcon.off("click").on("click", function (e) {
      e.stopPropagation();
      _toggleIconPicker();
    });
  }

  // ── Edit controls ─────────────────────────────────

  function _renderEditControls() {
    if (!_$editSection) return;
    _$editSection.empty();

    var cfg = GridCore.getConfig();

    if (cfg.editMode !== false && GridCore.isEditing()) {
      _$editSection.append(
        jQuery("<button>")
          .addClass("tl-toolbar-btn tl-toolbar-btn--save")
          .attr("title", "Save changes")
          .html('<i class="fa-solid fa-check"></i><span>Save</span>')
          .on("click", _handleSave),
        jQuery("<button>")
          .addClass("tl-toolbar-btn tl-toolbar-btn--discard")
          .attr("title", "Discard changes")
          .html('<i class="fa-solid fa-xmark"></i><span>Discard</span>')
          .on("click", _handleDiscard)
      );
    }

    // Settings gear — always visible when layers exist
    var $settingsWrap = jQuery("<div>").css("position", "relative").css("display", "inline-flex");
    var $settingsBtn = jQuery("<button>")
      .addClass("tl-toolbar-btn tl-toolbar-btn--settings")
      .attr("title", "Room settings")
      .html('<i class="fa-solid fa-gear"></i>')
      .on("click", function (e) {
        e.stopPropagation();
        _toggleSettingsPopup($settingsWrap);
      });
    $settingsWrap.append($settingsBtn);
    _$editSection.append($settingsWrap);
  }

  // ── Settings popup (manages rooms) ────────────────

  function _toggleSettingsPopup($anchor) {
    if (_$settingsPopup) {
      _closeSettingsPopup();
    } else {
      _openSettingsPopup($anchor);
    }
  }

  function _closeSettingsPopup() {
    if (_$settingsPopup) {
      _$settingsPopup.remove();
      _$settingsPopup = null;
    }
  }

  function _openSettingsPopup($anchor) {
    _closeSettingsPopup();
    var cfg = GridCore.getConfig();
    var room = GridCore.getActiveRoom();

    var $popup = jQuery("<div>").addClass("tl-settings-popup");

    // Edit option (only when editMode is enabled and not currently editing)
    if (cfg.editMode !== false && !GridCore.isEditing()) {
      var $editOpt = jQuery("<button>")
        .addClass("tl-settings-option")
        .html('<i class="fa-solid fa-pen"></i><span>Edit Layout</span>')
        .on("click", function () {
          _closeSettingsPopup();
          _handleEdit();
        });
      $popup.append($editOpt);
    }

    // Delete room option (only if more than 1 room in active layer)
    var rooms = GridCore.getRooms();
    if (rooms.length > 1 && room) {
      var $deleteOpt = jQuery("<button>")
        .addClass("tl-settings-option tl-settings-option--danger")
        .html('<i class="fa-solid fa-trash-can"></i><span>Delete Room</span>')
        .on("click", function () {
          _closeSettingsPopup();
          _confirmDeleteRoom(room);
        });
      $popup.append($deleteOpt);
    }

    $anchor.append($popup);
    _$settingsPopup = $popup;

    setTimeout(function () { $popup.addClass("tl-settings-popup--open"); }, 10);
  }

  function _handleEdit() {
    GridCore.enterEditMode();
    _renderEditControls();
    _renderTabs();
    _setEditableState(true);
    jQuery(".tl-root").removeClass("tl-view-mode").addClass("tl-edit-mode");
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  function _handleSave() {
    deactivate();
    GridCore.saveEdit();
    _renderEditControls();
    _renderTabs();
    _setEditableState(false);
    jQuery(".tl-root").removeClass("tl-edit-mode").addClass("tl-view-mode");
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
    var cfg = GridCore.getConfig();
    if (typeof cfg.onLayoutChange === "function") cfg.onLayoutChange(GridCore.getLayout());
    if (typeof cfg.onRoomChange === "function")
      cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
  }

  function _handleDiscard() {
    deactivate();
    GridCore.discardEdit();
    _renderEditControls();
    _renderTabs();
    _setEditableState(false);
    var room = GridCore.getActiveRoom();
    _refreshRoomDisplay(room);
    jQuery(".tl-root").removeClass("tl-edit-mode").addClass("tl-view-mode");
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  function _setEditableState(editable) {
    if (_$layoutIcon) _$layoutIcon.toggleClass("tl-toolbar-icon-badge--editable", editable);
    if (_$layoutName) _$layoutName.toggleClass("tl-toolbar-layout-name--editable", editable);
  }

  // ── Shape panel ───────────────────────────────────

  function buildShapePanel() {
    var cfg = GridCore.getConfig();
    var $panel = jQuery("<div>").addClass("tl-shape-panel");

    jQuery.each(cfg.shapes, function (key, shape) {
      if (shape === false) return;
      $panel.append(_buildShapeBtn(key, shape));
    });

    return $panel;
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
    var cfg = GridCore.getConfig();
    if (cfg.editMode !== false && !GridCore.isEditing()) return;
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

  // ── Grid rebuild helper ───────────────────────────

  function _rebuildGrid() {
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  return {
    build: build,
    buildShapePanel: buildShapePanel,
    toggle: toggle,
    deactivate: deactivate,
    getActive: getActive,
  };
})();
