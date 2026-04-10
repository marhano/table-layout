var GridToolbar = (function () {
  var _activeTool = null;
  var _$layoutName = null;
  var _$layoutIcon = null;
  var _$editSection = null;

  // ── Toolbar build ─────────────────────────────────

  function build() {
    var cfg = GridCore.getConfig();
    var $toolbar = jQuery("<div>").addClass("tl-toolbar");

    // Left: layer icon + name
    var $left = jQuery("<div>").addClass("tl-toolbar-left");

    if (cfg.layers && cfg.layers.length) {
      var activeLayer = GridCore.getActiveLayer();

      _$layoutIcon = _buildIconBadge(activeLayer);
      $left.append(_$layoutIcon);

      _$layoutName = jQuery("<span>")
        .addClass("tl-toolbar-layout-name")
        .text(activeLayer ? activeLayer.label : "");
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

    return $toolbar;
  }

  // ── Icon badge (display) ──────────────────────────

  function _buildIconBadge(layer) {
    var $badge = jQuery("<div>").addClass("tl-toolbar-icon-badge");
    if (layer) {
      var isFaIcon = layer.icon && layer.icon.indexOf("fa-") !== -1;
      if (isFaIcon) {
        $badge.append(jQuery("<i>").addClass(layer.icon));
      } else {
        $badge.text(layer.icon || (layer.label ? layer.label.charAt(0).toUpperCase() : "?"));
      }
    }
    return $badge;
  }

  function _refreshLayerDisplay(layer) {
    if (_$layoutName && !_$layoutName.is("input")) {
      _$layoutName.text(layer ? layer.label : "");
    }
    if (_$layoutIcon && !_$layoutIcon.is("input")) {
      var $new = _buildIconBadge(layer);
      _$layoutIcon.replaceWith($new);
      _$layoutIcon = $new;
    }
  }

  // ── Edit controls ─────────────────────────────────

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
    _enableEditableLayerInfo();
    jQuery(".tl-root").removeClass("tl-view-mode").addClass("tl-edit-mode");
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  function _handleSave() {
    deactivate();
    _commitEditableLayerInfo();
    GridCore.saveEdit();
    _renderEditControls();
    _disableEditableLayerInfo();
    jQuery(".tl-root").removeClass("tl-edit-mode").addClass("tl-view-mode");
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
    var cfg = GridCore.getConfig();
    if (typeof cfg.onLayoutChange === "function") cfg.onLayoutChange(GridCore.getLayout());
  }

  function _handleDiscard() {
    deactivate();
    GridCore.discardEdit();
    _renderEditControls();
    _disableEditableLayerInfo();
    var layer = GridCore.getActiveLayer();
    _refreshLayerDisplay(layer);
    jQuery(".tl-root").removeClass("tl-edit-mode").addClass("tl-view-mode");
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  // ── Editable layer info ───────────────────────────

  function _enableEditableLayerInfo() {
    var cfg = GridCore.getConfig();
    if (!cfg.layers || !cfg.layers.length) return;
    var layer = GridCore.getActiveLayer();
    if (!layer) return;

    if (_$layoutName) {
      var $nameInput = jQuery("<input>")
        .addClass("tl-toolbar-layout-name-input")
        .attr({ type: "text", maxlength: 30, placeholder: "Layer name" })
        .val(layer.label);
      _$layoutName.replaceWith($nameInput);
      _$layoutName = $nameInput;
    }

    if (_$layoutIcon) {
      var $iconInput = jQuery("<input>")
        .addClass("tl-toolbar-icon-input")
        .attr({ type: "text", maxlength: 40, placeholder: "Icon class or emoji" })
        .val(layer.icon || "");
      _$layoutIcon.replaceWith($iconInput);
      _$layoutIcon = $iconInput;
    }
  }

  function _disableEditableLayerInfo() {
    var cfg = GridCore.getConfig();
    if (!cfg.layers || !cfg.layers.length) return;
    var layer = GridCore.getActiveLayer();

    if (_$layoutName && _$layoutName.is("input")) {
      var $name = jQuery("<span>")
        .addClass("tl-toolbar-layout-name")
        .text(layer ? layer.label : "");
      _$layoutName.replaceWith($name);
      _$layoutName = $name;
    }

    if (_$layoutIcon && _$layoutIcon.is("input")) {
      var $badge = _buildIconBadge(layer);
      _$layoutIcon.replaceWith($badge);
      _$layoutIcon = $badge;
    }
  }

  function _commitEditableLayerInfo() {
    var cfg = GridCore.getConfig();
    if (!cfg.layers || !cfg.layers.length) return;
    var layer = GridCore.getActiveLayer();
    if (!layer) return;

    var props = {};
    if (_$layoutName && _$layoutName.is("input")) {
      var lv = jQuery.trim(_$layoutName.val());
      if (lv) props.label = lv;
    }
    if (_$layoutIcon && _$layoutIcon.is("input")) {
      var iv = jQuery.trim(_$layoutIcon.val());
      if (iv) props.icon = iv;
    }
    if (props.label || props.icon) {
      GridCore.updateLayerMeta(layer.id, props);
    }
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
