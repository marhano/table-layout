var GridToolbar = (function () {
  var _activeTool = null;
  var _$layoutName = null;
  var _$layoutIcon = null;
  var _$editSection = null;
  var _nameEditing = false;
  var _$iconPicker = null;

  // ── Toolbar build ─────────────────────────────────

  function build() {
    var cfg = GridCore.getConfig();
    var $toolbar = jQuery("<div>").addClass("tl-toolbar");

    // Left: layer icon + name
    var $left = jQuery("<div>").addClass("tl-toolbar-left");

    if (cfg.layers && cfg.layers.length) {
      var activeLayer = GridCore.getActiveLayer();

      _$layoutIcon = _buildIconBadge(activeLayer);
      _$layoutIcon.on("click", function (e) {
        e.stopPropagation();
        _toggleIconPicker();
      });
      $left.append(_$layoutIcon);

      _$layoutName = jQuery("<span>")
        .addClass("tl-toolbar-layout-name")
        .text(activeLayer ? activeLayer.label : "")
        .on("click", function () { _startNameEdit(); });
      $left.append(_$layoutName);

      GridEvents.on("layer:switched", function (layer) {
        _refreshLayerDisplay(layer);
      });
    }

    $toolbar.append($left);
    $toolbar.append(jQuery("<div>").addClass("tl-toolbar-spacer"));

    // Right: edit/save/discard (only when editMode is enabled)
    if (cfg.editMode !== false) {
      _$editSection = jQuery("<div>").addClass("tl-toolbar-actions");
      _renderEditControls();
      $toolbar.append(_$editSection);
    }

    // Close icon picker on outside click
    jQuery(document).on("mousedown.tl-iconpicker", function (e) {
      if (_$iconPicker && !jQuery(e.target).closest(".tl-icon-picker, .tl-toolbar-icon-badge").length) {
        _closeIconPicker();
      }
    });

    return $toolbar;
  }

  // ── Icon badge (display) ──────────────────────────

  function _buildIconBadge(layer) {
    var $badge = jQuery("<div>").addClass("tl-toolbar-icon-badge");
    if (layer) {
      _renderIconContent($badge, layer.icon, layer.label);
    }
    return $badge;
  }

  function _renderIconContent($el, iconValue, label) {
    $el.empty();
    if (!iconValue) {
      $el.text(label ? label.charAt(0).toUpperCase() : "?");
      return;
    }
    // FA icon
    if (iconValue.indexOf("fa-") !== -1) {
      $el.append(jQuery("<i>").addClass(iconValue));
      return;
    }
    // SVG / image file path
    var lower = iconValue.toLowerCase();
    if (lower.indexOf(".svg") !== -1 || lower.indexOf(".png") !== -1 ||
        lower.indexOf(".jpg") !== -1 || lower.indexOf(".jpeg") !== -1 ||
        lower.indexOf(".gif") !== -1 || lower.indexOf(".webp") !== -1) {
      $el.append(jQuery("<img>").attr("src", iconValue).addClass("tl-toolbar-icon-img"));
      return;
    }
    // Plain text
    $el.text(iconValue);
  }

  function _refreshLayerDisplay(layer) {
    if (_$layoutName && !_nameEditing) {
      _$layoutName.text(layer ? layer.label : "");
    }
    if (_$layoutIcon) {
      _$layoutIcon.empty();
      if (layer) _renderIconContent(_$layoutIcon, layer.icon, layer.label);
    }
  }

  // ── Inline name editing (click to edit) ───────────

  function _startNameEdit() {
    var cfg = GridCore.getConfig();
    if (!cfg.layers || !cfg.layers.length) return;
    if (_nameEditing) return;
    var layer = GridCore.getActiveLayer();
    if (!layer) return;

    _nameEditing = true;
    var $input = jQuery("<input>")
      .addClass("tl-toolbar-layout-name-input")
      .attr({ type: "text", maxlength: 30, placeholder: "Layer name" })
      .val(layer.label);

    _$layoutName.replaceWith($input);
    _$layoutName = $input;
    $input.trigger("focus").trigger("select");

    function commit() {
      if (!_nameEditing) return;
      _nameEditing = false;
      var val = jQuery.trim($input.val());
      if (val && val !== layer.label) {
        GridCore.updateLayerMeta(layer.id, { label: val });
      }
      var updatedLayer = GridCore.getActiveLayer();
      var $span = jQuery("<span>")
        .addClass("tl-toolbar-layout-name")
        .text(updatedLayer ? updatedLayer.label : "")
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
          .text(layer.label)
          .on("click", function () { _startNameEdit(); });
        $input.replaceWith($span);
        _$layoutName = $span;
      }
    });
  }

  // ── Icon picker popup ─────────────────────────────

  function _toggleIconPicker() {
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
    var layer = GridCore.getActiveLayer();
    if (!layer) return;
    var pickerCfg = cfg.iconPicker || {};
    var icons = pickerCfg.icons || [];
    var maxText = pickerCfg.maxTextLength || 4;
    var allowText = pickerCfg.allowText !== false;

    _closeIconPicker();

    var $picker = jQuery("<div>").addClass("tl-icon-picker");

    // Header
    $picker.append(jQuery("<div>").addClass("tl-icon-picker-header").text("Choose Icon"));

    // Icon grid
    if (icons.length) {
      var $grid = jQuery("<div>").addClass("tl-icon-picker-grid");
      jQuery.each(icons, function (_, ico) {
        var $btn = jQuery("<button>")
          .addClass("tl-icon-picker-btn")
          .attr("title", ico.label || "")
          .on("click", function () {
            _selectIcon(layer, ico.value);
          });

        if (ico.type === "fa") {
          $btn.append(jQuery("<i>").addClass(ico.value));
        } else if (ico.type === "svg" || ico.type === "img") {
          $btn.append(jQuery("<img>").attr("src", ico.value).addClass("tl-icon-picker-img"));
        } else {
          $btn.text(ico.value);
        }

        // Mark current
        if (layer.icon === ico.value) $btn.addClass("tl-icon-picker-btn--active");

        $grid.append($btn);
      });
      $picker.append($grid);
    }

    // Text input section
    if (allowText) {
      var $textSection = jQuery("<div>").addClass("tl-icon-picker-text-section");
      $textSection.append(jQuery("<span>").addClass("tl-icon-picker-text-label").text("Or type text:"));
      var $row = jQuery("<div>").addClass("tl-icon-picker-text-row");
      var $textInput = jQuery("<input>")
        .addClass("tl-icon-picker-text-input")
        .attr({ type: "text", maxlength: maxText, placeholder: "A, 1F…" })
        .val(
          layer.icon && layer.icon.indexOf("fa-") === -1 &&
          layer.icon.indexOf(".") === -1 ? layer.icon : ""
        );
      var $applyBtn = jQuery("<button>")
        .addClass("tl-icon-picker-apply")
        .text("Apply")
        .on("click", function () {
          var v = jQuery.trim($textInput.val());
          if (v) _selectIcon(layer, v);
        });
      $textInput.on("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); $applyBtn.trigger("click"); }
      });
      $row.append($textInput, $applyBtn);
      $textSection.append($row);
      $picker.append($textSection);
    }

    // Position relative to icon badge
    _$layoutIcon.addClass("tl-toolbar-icon-badge--picker-open");
    var $left = _$layoutIcon.closest(".tl-toolbar-left");
    $left.css("position", "relative");
    $left.append($picker);
    _$iconPicker = $picker;

    // Animate in
    setTimeout(function () { $picker.addClass("tl-icon-picker--open"); }, 10);
  }

  function _selectIcon(layer, value) {
    GridCore.updateLayerMeta(layer.id, { icon: value });
    var updated = GridCore.getActiveLayer();
    _$layoutIcon.find(".tl-icon-picker").detach();
    _renderIconContent(_$layoutIcon, updated.icon, updated.label);
    _closeIconPicker();
    // Re-attach click handler since we cleared content
    _$layoutIcon.off("click").on("click", function (e) {
      e.stopPropagation();
      _toggleIconPicker();
    });
  }

  // ── Edit controls (editMode only) ─────────────────

  function _renderEditControls() {
    if (!_$editSection) return;
    _$editSection.empty();

    if (GridCore.isEditing()) {
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
    } else {
      _$editSection.append(
        jQuery("<button>")
          .addClass("tl-toolbar-btn tl-toolbar-btn--edit")
          .attr("title", "Edit layout")
          .html('<i class="fa-solid fa-pen"></i><span>Edit</span>')
          .on("click", _handleEdit)
      );
    }
  }

  function _handleEdit() {
    GridCore.enterEditMode();
    _renderEditControls();
    jQuery(".tl-root").removeClass("tl-view-mode").addClass("tl-edit-mode");
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  function _handleSave() {
    deactivate();
    GridCore.saveEdit();
    _renderEditControls();
    jQuery(".tl-root").removeClass("tl-edit-mode").addClass("tl-view-mode");
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
    var cfg = GridCore.getConfig();
    if (typeof cfg.onLayoutChange === "function") cfg.onLayoutChange(GridCore.getLayout());
  }

  function _handleDiscard() {
    deactivate();
    GridCore.discardEdit();
    _renderEditControls();
    var layer = GridCore.getActiveLayer();
    _refreshLayerDisplay(layer);
    jQuery(".tl-root").removeClass("tl-edit-mode").addClass("tl-view-mode");
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
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

  return {
    build: build,
    buildShapePanel: buildShapePanel,
    toggle: toggle,
    deactivate: deactivate,
    getActive: getActive,
  };
})();
