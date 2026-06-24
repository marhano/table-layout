/**
 * GridToolbar.js
 * Toolbar shell — edit controls, settings popup, shape panel.
 * Layer tabs are delegated to GridLayers.buildTabBar().
 * Room switching is delegated to GridRooms.build().
 * Per-instance state via _TL context.
 */
var GridToolbar = (function () {
  var _inst = {};

  function _c() { return _inst[_TL.cid()]; }

  function init() {
    _inst[_TL.cid()] = {
      activeTool: null,
      $layoutName: null,
      $layoutIcon: null,
      $editSection: null,
      $iconPicker: null,
      $settingsPopup: null
    };
  }

  function destroy() {
    var cid = _TL.cid();
    jQuery(document).off("mousedown.tl-iconpicker-" + cid);
    delete _inst[cid];
  }

  // ── Toolbar build ─────────────────────────────────

  function build() {
    var cfg = GridCore.getConfig();
    var ctx = _c();
    var cid = _TL.cid();
    var $toolbar = jQuery("<div>").addClass("tl-toolbar");

    // Left: layer tabs (delegated to GridLayers)
    if (cfg.layers && cfg.layers.length) {
      $toolbar.append(GridLayers.buildTabBar());
      if (cfg.mode === "edit") $toolbar.append(GridLayers.buildAddButton());

      GridEvents.on("layer:switched", function () {
        _refreshRoomDisplay(GridCore.getActiveRoom());
      });
    }

    $toolbar.append(jQuery("<div>").addClass("tl-toolbar-spacer"));

    // Right: edit controls + settings
    if (cfg.layers && cfg.layers.length) {
      var $right = jQuery("<div>").addClass("tl-toolbar-right");

      var activeRoom = GridCore.getActiveRoom();

      ctx.$layoutIcon = _buildIconBadge(activeRoom);
      ctx.$layoutIcon.on("click", function (e) {
        e.stopPropagation();
        _TL.use(cid);
        _toggleIconPicker();
      });

      ctx.$layoutName = jQuery("<span>")
        .addClass("tl-toolbar-layout-name")
        .text(activeRoom ? activeRoom.label : "");

      GridEvents.on("room:switched", function (room) {
        _refreshRoomDisplay(room);
      });

      ctx.$editSection = jQuery("<div>").addClass("tl-toolbar-actions");
      _renderEditControls();
      $right.append(ctx.$editSection);

      $toolbar.append($right);
    }

    // Close icon picker / settings popup on outside click
    jQuery(document).on("mousedown.tl-iconpicker-" + cid, function (e) {
      _TL.use(cid);
      var ctx2 = _c();
      if (ctx2.$iconPicker && !jQuery(e.target).closest(".tl-icon-picker, .tl-toolbar-icon-badge").length) {
        _closeIconPicker();
      }
      if (ctx2.$settingsPopup && !jQuery(e.target).closest(".tl-settings-popup, .tl-toolbar-btn--settings").length) {
        _closeSettingsPopup();
      }
    });

    return $toolbar;
  }

  // ── Icon badge (display for active room) ──────────

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
    var ctx = _c();
    if (ctx.$layoutName) {
      ctx.$layoutName.text(room ? room.label : "");
    }
    if (ctx.$layoutIcon) {
      ctx.$layoutIcon.empty();
      if (room) _renderIconContent(ctx.$layoutIcon, room.icon, room.label);
    }
  }

  // ── Icon picker popup (for room icon) ─────────────

  function _toggleIconPicker() {
    if (GridCore.isEditing()) return;
    if (_c().$iconPicker) {
      _closeIconPicker();
    } else {
      _openIconPicker();
    }
  }

  function _closeIconPicker() {
    var ctx = _c();
    if (ctx.$iconPicker) {
      ctx.$iconPicker.remove();
      ctx.$iconPicker = null;
    }
    if (ctx.$layoutIcon) ctx.$layoutIcon.removeClass("tl-toolbar-icon-badge--picker-open");
  }

  function _openIconPicker() {
    var cfg = GridCore.getConfig();
    var ctx = _c();
    var cid = _TL.cid();
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
            _TL.use(cid);
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
          _TL.use(cid);
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

    ctx.$layoutIcon.addClass("tl-toolbar-icon-badge--picker-open");
    var $right = ctx.$layoutIcon.closest(".tl-toolbar-right");
    $right.css("position", "relative");
    $right.append($picker);
    ctx.$iconPicker = $picker;

    setTimeout(function () { $picker.addClass("tl-icon-picker--open"); }, 10);
  }

  function _confirmDeleteRoom(room) {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();
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
        _TL.use(cid);
        var c = GridCore.getConfig();
        var activeLayer = GridCore.getActiveLayer();
        var originalIdx = activeLayer
          ? activeLayer.rooms.findIndex(function (r) { return r.id === room.id; })
          : -1;
        var wasActive = (room.id === GridCore.getActiveRoomId());
        GridCore.deleteRoom(room.id);
        if (wasActive) {
          _TL.$(".tl-zoom-area").empty().append(GridRender.buildGrid());
        }
        _refreshRoomDisplay(GridCore.getActiveRoom());
        if (typeof c.onRoomChange === "function")
          c.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
        if (typeof c.onDeleteRoom === "function") {
          var rollback = function () {
            _TL.use(cid);
            var layer = GridCore.getActiveLayer();
            if (!layer) return;
            layer.rooms.splice(originalIdx >= 0 ? originalIdx : layer.rooms.length, 0, room);
            GridEvents.emit("room:added", room);
            if (wasActive) {
              GridCore.switchRoom(room.id);
              _TL.$(".tl-zoom-area").empty().append(GridRender.buildGrid());
            }
            _refreshRoomDisplay(GridCore.getActiveRoom());
          };
          var deletedLayer = GridCore.getActiveLayer();
          var callbackRoom = jQuery.extend(true, {}, room);
          if (c.mapId !== undefined) callbackRoom.mapId = c.mapId;
          callbackRoom.floorId = deletedLayer ? deletedLayer.id : null;
          c.onDeleteRoom(callbackRoom, rollback);
        }
      });
    $actions.append($cancel, $confirm);
    $modal.append($actions);
    $overlay.append($modal);
    jQuery("#" + cid).append($overlay);
    $overlay.on("mousedown", function (e) { $overlay.data("tl-md", jQuery(e.target).is($overlay)); })
             .on("click",    function (e) { if ($overlay.data("tl-md") && jQuery(e.target).is($overlay)) $overlay.remove(); });
  }

  function _selectIcon(room, value) {
    var origIcon = room.icon;
    var cid = _TL.cid();
    GridCore.updateRoomMeta(room.id, { icon: value });
    var cfg = GridCore.getConfig();
    var ctx = _c();
    if (typeof cfg.onRoomChange === "function" && !GridCore.isEditing())
      cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
    if (typeof cfg.onUpdateRoom === "function") {
      var iconLayer = GridCore.getActiveLayer();
      var iconRoom  = GridCore.getActiveRoom();
      var rollback = function () {
        _TL.use(cid);
        GridCore.updateRoomMeta(room.id, { icon: origIcon });
        var reverted = GridCore.getActiveRoom();
        var ctx2 = _c();
        if (ctx2 && ctx2.$layoutIcon && reverted)
          _renderIconContent(ctx2.$layoutIcon, reverted.icon, reverted.label);
      };
      cfg.onUpdateRoom({
        mapId:   cfg.mapId !== undefined ? cfg.mapId : null,
        floorId: iconLayer ? iconLayer.id : null,
        id:      iconRoom  ? iconRoom.id  : room.id,
        label:   iconRoom  ? iconRoom.label : room.label,
      }, rollback);
    }
    var updated = GridCore.getActiveRoom();
    ctx.$layoutIcon.find(".tl-icon-picker").detach();
    _renderIconContent(ctx.$layoutIcon, updated.icon, updated.label);
    _closeIconPicker();
    ctx.$layoutIcon.off("click").on("click", function (e) {
      e.stopPropagation();
      _TL.use(cid);
      _toggleIconPicker();
    });
  }

  // ── Edit controls ─────────────────────────────────

  function _renderEditControls() {
    var ctx = _c();
    var cid = _TL.cid();
    if (!ctx.$editSection) return;
    ctx.$editSection.empty();

    var cfg = GridCore.getConfig();

    if (cfg.realTime === false && GridCore.isEditing()) {
      ctx.$editSection.append(
        jQuery("<button>")
          .addClass("tl-toolbar-btn tl-toolbar-btn--save")
          .attr("title", "Save changes")
          .html('<i class="fa-solid fa-check"></i><span>Save</span>')
          .on("click", function () { _TL.use(cid); _handleSave(); }),
        jQuery("<button>")
          .addClass("tl-toolbar-btn tl-toolbar-btn--discard")
          .attr("title", "Discard changes")
          .html('<i class="fa-solid fa-xmark"></i><span>Discard</span>')
          .on("click", function () { _TL.use(cid); _handleDiscard(); })
      );
    }

    // Settings gear — only for mode:'edit' instances, when not currently editing
    var hasSettingsOptions = cfg.realTime === false && cfg.mode !== "view" && !GridCore.isEditing();
    if (hasSettingsOptions) {
      var $settingsWrap = jQuery("<div>").css("position", "relative").css("display", "inline-flex");
      var $settingsBtn = jQuery("<button>")
        .addClass("tl-toolbar-btn tl-toolbar-btn--settings")
        .attr("title", "Room settings")
        .html('<i class="fa-solid fa-gear"></i>')
        .on("click", function (e) {
          e.stopPropagation();
          _TL.use(cid);
          _toggleSettingsPopup($settingsWrap);
        });
      $settingsWrap.append($settingsBtn);
      ctx.$editSection.append($settingsWrap);
    }

    // Refresh button — always visible
    var $refreshBtn = jQuery("<button>")
      .addClass("tl-toolbar-btn tl-toolbar-btn--refresh")
      .attr("title", "Refresh layout")
      .html('<i class="fa-solid fa-rotate-right"></i>')
      .on("click", function (e) {
        e.stopPropagation();
        _TL.use(cid);
        _TL.$(".tl-zoom-area").empty().append(GridRender.buildGrid());
        if (typeof cfg.onRefresh === "function") cfg.onRefresh(GridCore.getLayout());
      });
    ctx.$editSection.append($refreshBtn);

    // Help button — always visible
    var $helpBtn = jQuery("<button>")
      .addClass("tl-toolbar-btn tl-toolbar-btn--help")
      .attr("title", "Help & Tutorial")
      .html('<i class="fa-solid fa-circle-question"></i>')
      .on("click", function (e) {
        e.stopPropagation();
        _TL.use(cid);
        GridHelp.show();
      });
    ctx.$editSection.append($helpBtn);
  }

  // ── Settings popup (manages rooms) ────────────────

  function _toggleSettingsPopup($anchor) {
    if (_c().$settingsPopup) {
      _closeSettingsPopup();
    } else {
      _openSettingsPopup($anchor);
    }
  }

  function _closeSettingsPopup() {
    var ctx = _c();
    if (ctx.$settingsPopup) {
      ctx.$settingsPopup.remove();
      ctx.$settingsPopup = null;
    }
  }

  function _openSettingsPopup($anchor) {
    _closeSettingsPopup();
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();

    var $popup = jQuery("<div>").addClass("tl-settings-popup");

    // Edit table layout (enter table-grid edit mode)
    if (cfg.realTime === false && cfg.mode !== "view" && !GridCore.isEditing()) {
      var $editOpt = jQuery("<button>")
        .addClass("tl-settings-option")
        .html('<i class="fa-solid fa-pen"></i><span>Edit Layout</span>')
        .on("click", function () {
          _TL.use(cid);
          _closeSettingsPopup();
          _handleEdit();
        });
      $popup.append($editOpt);
    }

    // Edit Floor / Edit Room (only when layers are configured)
    if (cfg.layers && cfg.layers.length) {
      var activeLayer = GridCore.getActiveLayer();
      var activeRoom  = GridCore.getActiveRoom();

      if (activeLayer && cfg.autoNameFloors !== true) {
        var $editFloorOpt = jQuery("<button>")
          .addClass("tl-settings-option")
          .html('<i class="fa-solid fa-layer-group"></i><span>Edit Floor: ' + activeLayer.label + '</span>')
          .on("click", function () {
            _TL.use(cid);
            _closeSettingsPopup();
            _openEditFloorModal(activeLayer);
          });
        $popup.append($editFloorOpt);
      }

      if (activeRoom) {
        var $editRoomOpt = jQuery("<button>")
          .addClass("tl-settings-option")
          .html('<i class="fa-solid fa-door-open"></i><span>Edit Room: ' + activeRoom.label + '</span>')
          .on("click", function () {
            _TL.use(cid);
            _closeSettingsPopup();
            _openEditRoomModal(activeRoom);
          });
        $popup.append($editRoomOpt);
      }
    }

    $anchor.append($popup);
    _c().$settingsPopup = $popup;

    setTimeout(function () { $popup.addClass("tl-settings-popup--open"); }, 10);
  }

  // ── Edit Floor modal ──────────────────────────────

  function _openEditFloorModal(layer) {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();
    var showIcons = cfg.showIcons !== false;
    var pickerCfg = cfg.iconPicker || {};
    var icons = pickerCfg.icons || [];
    var maxText = pickerCfg.maxTextLength || 4;
    var allowText = pickerCfg.allowText !== false;
    var _selectedIcon = layer.icon || "";

    var $overlay = jQuery("<div>").addClass("tl-overlay");
    var $modal = jQuery("<div>").addClass("tl-modal");

    $modal.append(
      jQuery("<h2>").html('<i class="fa-solid fa-layer-group"></i> Edit Floor')
    );

    var $nameField = jQuery("<div>").addClass("tl-field");
    $nameField.append(jQuery("<label>").text("Name"));
    var $nameInput = jQuery("<input>").attr({ type: "text", placeholder: "Floor name", maxlength: 30 }).val(layer.label);
    $nameField.append($nameInput);

    var $iconField = null;
    var $textInput = null;

    if (showIcons) {
      $iconField = jQuery("<div>").addClass("tl-field");
      $iconField.append(jQuery("<label>").text("Icon"));
      var $iconPreview = jQuery("<div>").addClass("tl-modal-icon-preview");

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
      _updatePreview(_selectedIcon);
      $iconField.append($iconPreview);

      if (icons.length) {
        var $grid = jQuery("<div>").addClass("tl-modal-icon-grid");
        jQuery.each(icons, function (_, ico) {
          var $btn = jQuery("<button>")
            .addClass("tl-icon-picker-btn" + (layer.icon === ico.value ? " tl-icon-picker-btn--active" : ""))
            .attr({ title: ico.label || "", type: "button" })
            .on("click", function () {
              _selectedIcon = ico.value;
              $grid.find(".tl-icon-picker-btn").removeClass("tl-icon-picker-btn--active");
              jQuery(this).addClass("tl-icon-picker-btn--active");
              if ($textInput) $textInput.val("");
              _updatePreview(_selectedIcon);
            });
          if (ico.type === "fa") { $btn.append(jQuery("<i>").addClass(ico.value)); }
          else if (ico.type === "svg" || ico.type === "img") { $btn.append(jQuery("<img>").attr("src", ico.value).addClass("tl-icon-picker-img")); }
          else { $btn.text(ico.value); }
          $grid.append($btn);
        });
        $iconField.append($grid);
      }

      if (allowText) {
        var $textRow = jQuery("<div>").addClass("tl-icon-picker-text-row").css("margin-top", "8px");
        $textInput = jQuery("<input>")
          .addClass("tl-icon-picker-text-input")
          .attr({ type: "text", maxlength: maxText, placeholder: "Or type: A, 1F…" })
          .val(
            _selectedIcon && _selectedIcon.indexOf("fa-") === -1 && !/\.(svg|png|jpe?g|gif|webp)/i.test(_selectedIcon)
              ? _selectedIcon : ""
          )
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
    var $save = jQuery("<button>").addClass("tl-btn tl-btn-primary").text("Save")
      .on("click", function () {
        _TL.use(cid);
        var labelVal = jQuery.trim($nameInput.val());
        if (!labelVal) { $nameInput.addClass("tl-input-error").trigger("focus"); return; }
        $nameInput.removeClass("tl-input-error");
        $overlay.remove();
        var props = { label: labelVal };
        if (showIcons) props.icon = _selectedIcon || labelVal.charAt(0).toUpperCase();
        GridCore.updateLayerMeta(layer.id, props);
      });

    $nameInput.on("input", function () { jQuery(this).removeClass("tl-input-error"); });
    $nameInput.on("keydown", function (e) { if (e.key === "Enter") $save.trigger("click"); });

    $actions.append($cancel, $save);
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

  // ── Edit Room modal ───────────────────────────────

  function _openEditRoomModal(room) {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();
    var showIcons = cfg.showIcons !== false;
    var pickerCfg = cfg.iconPicker || {};
    var icons = pickerCfg.icons || [];
    var maxText = pickerCfg.maxTextLength || 4;
    var allowText = pickerCfg.allowText !== false;
    var _selectedIcon = room.icon || "";

    var $overlay = jQuery("<div>").addClass("tl-overlay");
    var $modal = jQuery("<div>").addClass("tl-modal");

    $modal.append(
      jQuery("<h2>").html('<i class="fa-solid fa-door-open"></i> Edit Room')
    );

    var $nameField = jQuery("<div>").addClass("tl-field");
    $nameField.append(jQuery("<label>").text("Name"));
    var $nameInput = jQuery("<input>").attr({ type: "text", placeholder: "Room name", maxlength: 30 }).val(room.label);
    $nameField.append($nameInput);

    var $iconField = null;
    var $textInput = null;

    if (showIcons) {
      $iconField = jQuery("<div>").addClass("tl-field");
      $iconField.append(jQuery("<label>").text("Icon"));
      var $iconPreview = jQuery("<div>").addClass("tl-modal-icon-preview");

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
      _updatePreview(_selectedIcon);
      $iconField.append($iconPreview);

      if (icons.length) {
        var $grid = jQuery("<div>").addClass("tl-modal-icon-grid");
        jQuery.each(icons, function (_, ico) {
          var $btn = jQuery("<button>")
            .addClass("tl-icon-picker-btn" + (room.icon === ico.value ? " tl-icon-picker-btn--active" : ""))
            .attr({ title: ico.label || "", type: "button" })
            .on("click", function () {
              _selectedIcon = ico.value;
              $grid.find(".tl-icon-picker-btn").removeClass("tl-icon-picker-btn--active");
              jQuery(this).addClass("tl-icon-picker-btn--active");
              if ($textInput) $textInput.val("");
              _updatePreview(_selectedIcon);
            });
          if (ico.type === "fa") { $btn.append(jQuery("<i>").addClass(ico.value)); }
          else if (ico.type === "svg" || ico.type === "img") { $btn.append(jQuery("<img>").attr("src", ico.value).addClass("tl-icon-picker-img")); }
          else { $btn.text(ico.value); }
          $grid.append($btn);
        });
        $iconField.append($grid);
      }

      if (allowText) {
        var $textRow = jQuery("<div>").addClass("tl-icon-picker-text-row").css("margin-top", "8px");
        $textInput = jQuery("<input>")
          .addClass("tl-icon-picker-text-input")
          .attr({ type: "text", maxlength: maxText, placeholder: "Or type: A, 1F…" })
          .val(
            _selectedIcon && _selectedIcon.indexOf("fa-") === -1 && !/\.(svg|png|jpe?g|gif|webp)/i.test(_selectedIcon)
              ? _selectedIcon : ""
          )
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
    var $save = jQuery("<button>").addClass("tl-btn tl-btn-primary").text("Save")
      .on("click", function () {
        _TL.use(cid);
        var labelVal = jQuery.trim($nameInput.val());
        if (!labelVal) { $nameInput.addClass("tl-input-error").trigger("focus"); return; }
        $nameInput.removeClass("tl-input-error");
        $overlay.remove();
        var origLabel = room.label;
        var origIcon  = room.icon;
        var props = { label: labelVal };
        if (showIcons) props.icon = _selectedIcon || labelVal.charAt(0).toUpperCase();
        GridCore.updateRoomMeta(room.id, props);
        _refreshRoomDisplay(GridCore.getActiveRoom());
        if (typeof cfg.onUpdateRoom === "function") {
          var editLayer = GridCore.getActiveLayer();
          var editRoom  = GridCore.getActiveRoom();
          var rollback = function () {
            _TL.use(cid);
            GridCore.updateRoomMeta(room.id, { label: origLabel, icon: origIcon });
            _refreshRoomDisplay(GridCore.getActiveRoom());
          };
          cfg.onUpdateRoom({
            mapId:   cfg.mapId !== undefined ? cfg.mapId : null,
            floorId: editLayer ? editLayer.id : null,
            id:      editRoom  ? editRoom.id  : room.id,
            label:   editRoom  ? editRoom.label : labelVal,
          }, rollback);
        }
      });

    $nameInput.on("input", function () { jQuery(this).removeClass("tl-input-error"); });
    $nameInput.on("keydown", function (e) { if (e.key === "Enter") $save.trigger("click"); });

    $actions.append($cancel, $save);
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

  function _handleEdit() {
    var cid = _TL.cid();
    GridCore.enterEditMode();
    _renderEditControls();
    GridLayers.renderTabs();
    GridRooms.renderTabs();
    _setEditableState(true);
    jQuery("#" + cid).removeClass("tl-view-mode").addClass("tl-edit-mode");
    _TL.$(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  function _handleSave() {
    deactivate();
    GridMultiSelect.deactivate();

    var cfg = GridCore.getConfig();
    var snapshotTables = GridCore.getSnapshotTables() || [];

    GridCore.saveEdit();
    _renderEditControls();
    GridLayers.renderTabs();
    GridRooms.renderTabs();
    _setEditableState(false);
    var cid = _TL.cid();
    jQuery("#" + cid).removeClass("tl-edit-mode").addClass("tl-view-mode");
    _TL.$(".tl-zoom-area").empty().append(GridRender.buildGrid());

    if (typeof cfg.onLayoutChange === "function") {
      var currentTables = GridCore.getLayout();
      var snapshotMap = {};
      snapshotTables.forEach(function (t) { snapshotMap[t.id] = t; });

      var currentMap = {};
      currentTables.forEach(function (t) { currentMap[t.id] = t; });

      var changed = currentTables.filter(function (t) {
        var orig = snapshotMap[t.id];
        if (!orig) return true;
        return t.col !== orig.col || t.row !== orig.row ||
               t.colSpan !== orig.colSpan || t.rowSpan !== orig.rowSpan ||
               t.name !== orig.name || t.seats !== orig.seats ||
               t.status !== orig.status || t.shape !== orig.shape;
      });

      var deleted = snapshotTables.filter(function (t) {
        return !currentMap[t.id];
      });

      var activeLayer = GridCore.getActiveLayer();
      var activeRoom  = GridCore.getActiveRoom();
      function _mapTable(t) {
        return {
          id:      t.id,
          name:    t.name,
          seats:   t.seats,
          status:  t.status,
          shape:   t.shape,
          col:     t.col,
          row:     t.row,
          colSpan: t.colSpan,
          rowSpan: t.rowSpan,
        };
      }

      cfg.onLayoutChange({
        mapId:   cfg.mapId   !== undefined ? cfg.mapId   : null,
        floorId: activeLayer ? activeLayer.id : null,
        roomId:  activeRoom  ? activeRoom.id  : null,
        tables: changed.map(_mapTable).concat(
          deleted.map(function (t) {
            return jQuery.extend(_mapTable(t), { deleted: true });
          })
        ),
        currentTables: snapshotTables.map(_mapTable),
      });
    }

    if (typeof cfg.onRoomChange === "function")
      cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
  }

  function _handleDiscard() {
    deactivate();
    GridMultiSelect.deactivate();
    GridCore.discardEdit();
    _renderEditControls();
    GridLayers.renderTabs();
    GridRooms.renderTabs();
    _setEditableState(false);
    var room = GridCore.getActiveRoom();
    _refreshRoomDisplay(room);
    var cid = _TL.cid();
    jQuery("#" + cid).removeClass("tl-edit-mode").addClass("tl-view-mode");
    _TL.$(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  function _setEditableState(editable) {
    var ctx = _c();
    if (ctx.$layoutIcon) ctx.$layoutIcon.toggleClass("tl-toolbar-icon-badge--editable", editable);
  }

  // ── Shape panel ───────────────────────────────────

  function buildShapePanel() {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();
    var $panel = jQuery("<div>").addClass("tl-shape-panel");

    // Multiselect tool
    var $mselBtn = jQuery("<button>")
      .addClass("tl-shape-tool-btn tl-multiselect-tool-btn")
      .attr({ title: "Multi-select" })
      .append(jQuery("<i>").addClass("fa-solid fa-arrow-pointer"))
      .on("click", function () {
        _TL.use(cid);
        if (GridMultiSelect.isActive()) {
          GridMultiSelect.deactivate();
        } else {
          deactivate();
          GridMultiSelect.activate();
        }
      });
    $panel.append($mselBtn);

    jQuery.each(cfg.shapes, function (key, shape) {
      $panel.append(_buildShapeBtn(key, shape, cid));
    });

    return $panel;
  }

  function _buildShapeBtn(key, shape, cid) {
    return jQuery("<button>")
      .addClass("tl-shape-tool-btn")
      .attr({ "data-shape-key": key, title: shape.label })
      .append(jQuery("<i>").addClass(shape.icon))
      .on("click", function () {
        _TL.use(cid);
        toggle(key);
      });
  }

  function toggle(key) {
    var cfg = GridCore.getConfig();
    if (cfg.realTime === false && !GridCore.isEditing()) return;
    GridMultiSelect.deactivate();
    var ctx = _c();
    if (ctx.activeTool === key) {
      deactivate();
    } else {
      ctx.activeTool = key;
      _TL.$(".tl-shape-tool-btn").removeClass("active");
      _TL.$('[data-shape-key="' + key + '"]').addClass("active");
      _TL.$(".tl-canvas").addClass("tl-placing-mode");
      GridEvents.emit("tool:changed", key);
    }
  }

  function deactivate() {
    var ctx = _c();
    if (!ctx) return;
    ctx.activeTool = null;
    _TL.$(".tl-shape-tool-btn").removeClass("active");
    _TL.$(".tl-canvas").removeClass("tl-placing-mode");
    GridEvents.emit("tool:changed", null);
  }

  function getActive() {
    var ctx = _c();
    return ctx ? ctx.activeTool : null;
  }

  return {
    init: init,
    destroy: destroy,
    build: build,
    buildShapePanel: buildShapePanel,
    toggle: toggle,
    deactivate: deactivate,
    getActive: getActive,
  };
})();
