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
      nameEditing: false,
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
        .text(activeRoom ? activeRoom.label : "")
        .on("click", function () {
          _TL.use(cid);
          _startNameEdit();
        });

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
    if (ctx.$layoutName && !ctx.nameEditing) {
      ctx.$layoutName.text(room ? room.label : "");
    }
    if (ctx.$layoutIcon) {
      ctx.$layoutIcon.empty();
      if (room) _renderIconContent(ctx.$layoutIcon, room.icon, room.label);
    }
  }

  // ── Inline name editing (click to edit room name) ──

  function _startNameEdit() {
    var cfg = GridCore.getConfig();
    var ctx = _c();
    var cid = _TL.cid();
    if (!cfg.layers || !cfg.layers.length) return;
    if (cfg.realTime !== false || !GridCore.isEditing()) return;
    if (ctx.nameEditing) return;
    var room = GridCore.getActiveRoom();
    if (!room) return;

    ctx.nameEditing = true;
    var $input = jQuery("<input>")
      .addClass("tl-toolbar-layout-name-input")
      .attr({ type: "text", maxlength: 30, placeholder: "Room name" })
      .val(room.label);

    ctx.$layoutName.replaceWith($input);
    ctx.$layoutName = $input;
    $input.trigger("focus").trigger("select");

    function commit() {
      _TL.use(cid);
      var ctx2 = _c();
      if (!ctx2.nameEditing) return;
      ctx2.nameEditing = false;
      var val = jQuery.trim($input.val());
      if (val && val !== room.label) {
        GridCore.updateRoomMeta(room.id, { label: val });
        var c = GridCore.getConfig();
        if (typeof c.onRoomChange === "function" && (c.realTime !== false || GridCore.isEditing()))
          c.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
      }
      var updatedRoom = GridCore.getActiveRoom();
      var $span = jQuery("<span>")
        .addClass("tl-toolbar-layout-name")
        .text(updatedRoom ? updatedRoom.label : "")
        .on("click", function () {
          _TL.use(cid);
          _startNameEdit();
        });
      $input.replaceWith($span);
      ctx2.$layoutName = $span;
    }

    $input.on("blur", commit);
    $input.on("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); $input.trigger("blur"); }
      if (e.key === "Escape") {
        _TL.use(cid);
        var ctx2 = _c();
        ctx2.nameEditing = false;
        var $span = jQuery("<span>")
          .addClass("tl-toolbar-layout-name")
          .text(room.label)
          .on("click", function () {
            _TL.use(cid);
            _startNameEdit();
          });
        $input.replaceWith($span);
        ctx2.$layoutName = $span;
      }
    });
  }

  // ── Icon picker popup (for room icon) ─────────────

  function _toggleIconPicker() {
    var cfg = GridCore.getConfig();
    if (cfg.realTime !== false || !GridCore.isEditing()) return;
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
        var wasActive = (room.id === GridCore.getActiveRoomId());
        GridCore.deleteRoom(room.id);
        if (wasActive) {
          _TL.$(".tl-zoom-area").empty().append(GridRender.buildGrid());
        }
        _refreshRoomDisplay(GridCore.getActiveRoom());
        var c = GridCore.getConfig();
        if (typeof c.onRoomChange === "function")
          c.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
      });
    $actions.append($cancel, $confirm);
    $modal.append($actions);
    $overlay.append($modal);
    jQuery("#" + cid).append($overlay);
    $overlay.on("click", function (e) { if (jQuery(e.target).is($overlay)) $overlay.remove(); });
  }

  function _selectIcon(room, value) {
    GridCore.updateRoomMeta(room.id, { icon: value });
    var cfg = GridCore.getConfig();
    var ctx = _c();
    if (typeof cfg.onRoomChange === "function" && !GridCore.isEditing())
      cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
    var updated = GridCore.getActiveRoom();
    ctx.$layoutIcon.find(".tl-icon-picker").detach();
    _renderIconContent(ctx.$layoutIcon, updated.icon, updated.label);
    _closeIconPicker();
    var cid = _TL.cid();
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

    // Settings gear — visible only when NOT in edit mode and has options
    var hasSettingsOptions = cfg.realTime === false && cfg.mode !== "view" && !GridCore.isEditing();
    if ((cfg.realTime !== false || !GridCore.isEditing()) && hasSettingsOptions) {
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

    // Edit option (only when realTime is false, mode is not 'view', and not currently editing)
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

    $anchor.append($popup);
    _c().$settingsPopup = $popup;

    setTimeout(function () { $popup.addClass("tl-settings-popup--open"); }, 10);
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
    GridCore.saveEdit();
    _renderEditControls();
    GridLayers.renderTabs();
    GridRooms.renderTabs();
    _setEditableState(false);
    var cid = _TL.cid();
    jQuery("#" + cid).removeClass("tl-edit-mode").addClass("tl-view-mode");
    _TL.$(".tl-zoom-area").empty().append(GridRender.buildGrid());
    var cfg = GridCore.getConfig();
    if (typeof cfg.onLayoutChange === "function") cfg.onLayoutChange(GridCore.getLayout());
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
    if (ctx.$layoutName) ctx.$layoutName.toggleClass("tl-toolbar-layout-name--editable", editable);
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
