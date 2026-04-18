/**
 * GridLayers.js
 * Layer switcher UI + all layer-related toolbar controls.
 *
 * Responsibilities
 *   • Floating layer-switcher panel (right side of canvas)
 *   • Toolbar layer display: icon badge, layout name
 *   • Inline name editing
 *   • Icon picker popup
 *   • Settings popup (Edit Layout / Delete Layout)
 *   • Edit-mode toolbar controls (Save / Discard)
 *
 * Room/layer creation is delegated to GridRooms.
 * GridToolbar calls GridLayers.buildToolbarLeft() and
 * GridLayers.buildToolbarActions() to embed these controls.
 */
var GridLayers = (function () {
  // ── Shared state ──────────────────────────────────
  var _$wrap = null; // floating panel wrapper
  var _$activePreview = null; // hover-preview popup
  var _hoverTimer = null;

  // Toolbar state (populated by buildToolbarLeft / buildToolbarActions)
  var _$layoutName = null;
  var _$layoutIcon = null;
  var _$editSection = null;
  var _nameEditing = false;
  var _$iconPicker = null;
  var _$settingsPopup = null;

  // ═══════════════════════════════════════════════════
  // TOOLBAR INTEGRATION
  // Called by GridToolbar to embed layer UI into the toolbar.
  // ═══════════════════════════════════════════════════

  /**
   * Build the left-side toolbar fragment: icon badge + layout name.
   * Returns a jQuery element to be appended into .tl-toolbar-left.
   */
  function buildToolbarLeft() {
    var cfg = GridCore.getConfig();
    if (!cfg.layers || !cfg.layers.length) return jQuery();

    var $frag = jQuery("<div>").addClass("tl-toolbar-left-layers");

    var activeLayer = GridCore.getActiveLayer();

    _$layoutIcon = _buildIconBadge(activeLayer);
    _$layoutIcon.on("click", function (e) {
      e.stopPropagation();
      _toggleIconPicker();
    });
    $frag.append(_$layoutIcon);

    _$layoutName = jQuery("<span>")
      .addClass("tl-toolbar-layout-name")
      .text(activeLayer ? activeLayer.label : "")
      .on("click", function () {
        _startNameEdit();
      });
    $frag.append(_$layoutName);

    // Keep toolbar display in sync with layer switches
    GridEvents.on("layer:switched", function (layer) {
      _refreshLayerDisplay(layer);
    });

    // Close icon picker / settings popup on outside click
    jQuery(document).on("mousedown.tl-layer-toolbar", function (e) {
      if (
        _$iconPicker &&
        !jQuery(e.target).closest(".tl-icon-picker, .tl-toolbar-icon-badge")
          .length
      ) {
        _closeIconPicker();
      }
      if (
        _$settingsPopup &&
        !jQuery(e.target).closest(
          ".tl-settings-popup, .tl-toolbar-btn--settings",
        ).length
      ) {
        _closeSettingsPopup();
      }
    });

    return $frag;
  }

  /**
   * Build the right-side toolbar actions fragment: settings gear + save/discard.
   * Returns a jQuery element to be appended into .tl-toolbar-actions.
   */
  function buildToolbarActions() {
    var cfg = GridCore.getConfig();
    if (!cfg.layers || !cfg.layers.length) return jQuery();

    _$editSection = jQuery("<div>").addClass("tl-toolbar-actions-layers");
    _renderEditControls();
    return _$editSection;
  }

  // ── Icon badge ────────────────────────────────────

  function _buildIconBadge(layer) {
    var $badge = jQuery("<div>").addClass("tl-toolbar-icon-badge");
    if (layer) _renderIconContent($badge, layer.icon, layer.label);
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
    if (
      lower.indexOf(".svg") !== -1 ||
      lower.indexOf(".png") !== -1 ||
      lower.indexOf(".jpg") !== -1 ||
      lower.indexOf(".jpeg") !== -1 ||
      lower.indexOf(".gif") !== -1 ||
      lower.indexOf(".webp") !== -1
    ) {
      $el.append(
        jQuery("<img>").attr("src", iconValue).addClass("tl-toolbar-icon-img"),
      );
      return;
    }
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

  // ── Inline name editing ───────────────────────────

  function _startNameEdit() {
    var cfg = GridCore.getConfig();
    if (!cfg.layers || !cfg.layers.length) return;
    if (cfg.editMode === false || !GridCore.isEditing()) return;
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
        var c = GridCore.getConfig();
        if (typeof c.onLayerChange === "function" && !GridCore.isEditing()) {
          c.onLayerChange(GridCore.getActiveLayer(), GridCore.getLayout());
        }
      }
      var updatedLayer = GridCore.getActiveLayer();
      var $span = jQuery("<span>")
        .addClass("tl-toolbar-layout-name")
        .text(updatedLayer ? updatedLayer.label : "")
        .on("click", function () {
          _startNameEdit();
        });
      $input.replaceWith($span);
      _$layoutName = $span;
    }

    $input.on("blur", commit);
    $input.on("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        $input.trigger("blur");
      }
      if (e.key === "Escape") {
        _nameEditing = false;
        var $span = jQuery("<span>")
          .addClass("tl-toolbar-layout-name")
          .text(layer.label)
          .on("click", function () {
            _startNameEdit();
          });
        $input.replaceWith($span);
        _$layoutName = $span;
      }
    });
  }

  // ── Icon picker popup ─────────────────────────────

  function _toggleIconPicker() {
    var cfg = GridCore.getConfig();
    if (cfg.editMode === false || !GridCore.isEditing()) return;
    _$iconPicker ? _closeIconPicker() : _openIconPicker();
  }

  function _closeIconPicker() {
    if (_$iconPicker) {
      _$iconPicker.remove();
      _$iconPicker = null;
    }
    if (_$layoutIcon)
      _$layoutIcon.removeClass("tl-toolbar-icon-badge--picker-open");
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
    $picker.append(
      jQuery("<div>").addClass("tl-icon-picker-header").text("Choose Icon"),
    );

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
          $btn.append(
            jQuery("<img>")
              .attr("src", ico.value)
              .addClass("tl-icon-picker-img"),
          );
        } else {
          $btn.text(ico.value);
        }
        if (layer.icon === ico.value)
          $btn.addClass("tl-icon-picker-btn--active");
        $grid.append($btn);
      });
      $picker.append($grid);
    }

    if (allowText) {
      var $textSection = jQuery("<div>").addClass(
        "tl-icon-picker-text-section",
      );
      $textSection.append(
        jQuery("<span>")
          .addClass("tl-icon-picker-text-label")
          .text("Or type text:"),
      );
      var $row = jQuery("<div>").addClass("tl-icon-picker-text-row");
      var $textInput = jQuery("<input>")
        .addClass("tl-icon-picker-text-input")
        .attr({ type: "text", maxlength: maxText, placeholder: "A, 1F\u2026" })
        .val(
          layer.icon &&
            layer.icon.indexOf("fa-") === -1 &&
            layer.icon.indexOf(".") === -1
            ? layer.icon
            : "",
        );
      var $applyBtn = jQuery("<button>")
        .addClass("tl-icon-picker-apply")
        .text("Apply")
        .on("click", function () {
          var v = jQuery.trim($textInput.val());
          if (v) _selectIcon(layer, v);
        });
      $textInput.on("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          $applyBtn.trigger("click");
        }
      });
      $row.append($textInput, $applyBtn);
      $textSection.append($row);
      $picker.append($textSection);
    }

    _$layoutIcon.addClass("tl-toolbar-icon-badge--picker-open");
    var $left = _$layoutIcon.closest(".tl-toolbar-left");
    $left.css("position", "relative");
    $left.append($picker);
    _$iconPicker = $picker;

    setTimeout(function () {
      $picker.addClass("tl-icon-picker--open");
    }, 10);
  }

  function _selectIcon(layer, value) {
    GridCore.updateLayerMeta(layer.id, { icon: value });
    var cfg = GridCore.getConfig();
    if (typeof cfg.onLayerChange === "function" && !GridCore.isEditing()) {
      cfg.onLayerChange(GridCore.getActiveLayer(), GridCore.getLayout());
    }
    var updated = GridCore.getActiveLayer();
    _$layoutIcon.find(".tl-icon-picker").detach();
    _renderIconContent(_$layoutIcon, updated.icon, updated.label);
    _closeIconPicker();
    _$layoutIcon.off("click").on("click", function (e) {
      e.stopPropagation();
      _toggleIconPicker();
    });
  }

  // ── Delete-layer confirmation modal ───────────────

  function _confirmDeleteLayer(layer) {
    var cfg = GridCore.getConfig();
    var $overlay = jQuery("<div>").addClass("tl-overlay");
    var $modal = jQuery("<div>").addClass("tl-modal");

    $modal.append(
      jQuery("<h2>").html(
        '<i class="fa-solid fa-triangle-exclamation"></i> Delete Layout',
      ),
    );
    $modal.append(
      jQuery("<p>")
        .addClass("tl-modal-text")
        .text(
          'Are you sure you want to delete "' +
            layer.label +
            '"? This action cannot be undone.',
        ),
    );

    var $actions = jQuery("<div>").addClass("tl-modal-actions");
    var $cancel = jQuery("<button>")
      .addClass("tl-btn tl-btn-cancel")
      .text("Cancel")
      .on("click", function () {
        $overlay.remove();
      });
    var $confirm = jQuery("<button>")
      .addClass("tl-btn tl-btn-danger")
      .text("Delete")
      .on("click", function () {
        $overlay.remove();
        var wasActive = layer.id === GridCore.getActiveLayerId();
        GridCore.deleteLayer(layer.id);
        if (wasActive) {
          jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
        }
        var active = GridCore.getActiveLayer();
        _refreshLayerDisplay(active);
        GridEvents.emit("layer:switched", active);
        if (typeof cfg.onLayerChange === "function") {
          cfg.onLayerChange(active, GridCore.getLayout());
        }
      });

    $actions.append($cancel, $confirm);
    $modal.append($actions);
    $overlay.append($modal);
    jQuery(".tl-root").first().append($overlay);
    $overlay.on("click", function (e) {
      if (jQuery(e.target).is($overlay)) $overlay.remove();
    });
  }

  // ── Edit controls (Save / Discard / Settings gear) ─

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
          .on("click", _handleDiscard),
      );
    }

    var $settingsWrap = jQuery("<div>").css({
      position: "relative",
      display: "inline-flex",
    });
    var $settingsBtn = jQuery("<button>")
      .addClass("tl-toolbar-btn tl-toolbar-btn--settings")
      .attr("title", "Layout settings")
      .html('<i class="fa-solid fa-gear"></i>')
      .on("click", function (e) {
        e.stopPropagation();
        _toggleSettingsPopup($settingsWrap);
      });
    $settingsWrap.append($settingsBtn);
    _$editSection.append($settingsWrap);
  }

  // ── Settings popup ────────────────────────────────

  function _toggleSettingsPopup($anchor) {
    _$settingsPopup ? _closeSettingsPopup() : _openSettingsPopup($anchor);
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
    var layer = GridCore.getActiveLayer();
    var $popup = jQuery("<div>").addClass("tl-settings-popup");

    if (cfg.editMode !== false && !GridCore.isEditing()) {
      $popup.append(
        jQuery("<button>")
          .addClass("tl-settings-option")
          .html('<i class="fa-solid fa-pen"></i><span>Edit Layout</span>')
          .on("click", function () {
            _closeSettingsPopup();
            _handleEdit();
          }),
      );
    }

    var layers = GridCore.getLayers();
    if (layers.length > 1 && layer) {
      $popup.append(
        jQuery("<button>")
          .addClass("tl-settings-option tl-settings-option--danger")
          .html(
            '<i class="fa-solid fa-trash-can"></i><span>Delete Layout</span>',
          )
          .on("click", function () {
            _closeSettingsPopup();
            _confirmDeleteLayer(layer);
          }),
      );
    }

    $anchor.append($popup);
    _$settingsPopup = $popup;
    setTimeout(function () {
      $popup.addClass("tl-settings-popup--open");
    }, 10);
  }

  // ── Edit-mode lifecycle ───────────────────────────

  function _handleEdit() {
    GridCore.enterEditMode();
    _renderEditControls();
    _setEditableState(true);
    jQuery(".tl-root").removeClass("tl-view-mode").addClass("tl-edit-mode");
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  function _handleSave() {
    GridToolbar.deactivate();
    GridCore.saveEdit();
    _renderEditControls();
    _setEditableState(false);
    jQuery(".tl-root").removeClass("tl-edit-mode").addClass("tl-view-mode");
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
    var cfg = GridCore.getConfig();
    if (typeof cfg.onLayoutChange === "function")
      cfg.onLayoutChange(GridCore.getLayout());
    if (typeof cfg.onLayerChange === "function")
      cfg.onLayerChange(GridCore.getActiveLayer(), GridCore.getLayout());
  }

  function _handleDiscard() {
    GridToolbar.deactivate();
    GridCore.discardEdit();
    _renderEditControls();
    _setEditableState(false);
    var layer = GridCore.getActiveLayer();
    _refreshLayerDisplay(layer);
    jQuery(".tl-root").removeClass("tl-edit-mode").addClass("tl-view-mode");
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  function _setEditableState(editable) {
    if (_$layoutIcon)
      _$layoutIcon.toggleClass("tl-toolbar-icon-badge--editable", editable);
    if (_$layoutName)
      _$layoutName.toggleClass("tl-toolbar-layout-name--editable", editable);
  }

  // ═══════════════════════════════════════════════════
  // FLOATING LAYER-SWITCHER PANEL  (right side of canvas)
  // ═══════════════════════════════════════════════════

  function build() {
    _$wrap = jQuery("<div>").addClass("tl-layers-wrap");

    var $btn = jQuery("<button>")
      .addClass("tl-layers-btn tl-layers-btn--active")
      .attr("title", "Switch Layout")
      .html('<i class="fa-solid fa-layer-group"></i>')
      .on("click", function (e) {
        e.stopPropagation();
        var isOpen = _$wrap
          .find(".tl-layers-panel")
          .hasClass("tl-layers-panel--open");
        isOpen ? _closePanel() : _openPanel();
      });

    var $panel = _buildPanel();
    $panel.addClass("tl-layers-panel--open");

    _$wrap.append($btn, $panel);

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
    $panel.on("click", function (e) {
      e.stopPropagation();
    });

    // Allow GridRooms to trigger a panel refresh via custom event
    $panel.on("tl:rooms:created", function () {
      _renderPanelContent($panel);
    });

    _renderPanelContent($panel);
    return $panel;
  }

  function _renderPanelContent($panel) {
    $panel.empty();

    var layers = GridCore.getLayers();
    var activeId = GridCore.getActiveLayerId();

    var $list = jQuery("<div>").addClass("tl-layers-list");
    jQuery.each(layers, function (_, layer) {
      $list.append(_buildLayerItem(layer, layer.id === activeId));
    });
    $panel.append($list);
    $panel.append(jQuery("<div>").addClass("tl-layers-separator"));
    $panel.append(_buildAddBtn($panel));
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

  function _buildLayerItem(layer, isActive) {
    var layers = GridCore.getLayers();
    var cfg = GridCore.getConfig();

    var $item = jQuery("<div>")
      .addClass("tl-layers-item" + (isActive ? " tl-layers-item--active" : ""))
      .attr({
        title: layer.label,
        "data-layer-id": layer.id,
        draggable: "true",
      })
      .on("mouseenter", function () {
        var self = this;
        clearTimeout(_hoverTimer);
        _hoverTimer = setTimeout(function () {
          _showPreview(layer, jQuery(self));
        }, 500);
      })
      .on("mouseleave", function () {
        clearTimeout(_hoverTimer);
        _hidePreview();
      })
      .on("click", function () {
        if (isActive) return;
        if (cfg.editMode !== false && GridCore.isEditing()) return;
        GridCore.switchLayer(layer.id);
        jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());
        var $panel = _$wrap.find(".tl-layers-panel");
        _renderPanelContent($panel);
        if (typeof cfg.onLayerChange === "function") {
          cfg.onLayerChange(GridCore.getActiveLayer(), GridCore.getLayout());
        }
      });

    // ── Drag-to-reorder (mouse) ───────────────────
    $item.on("dragstart", function (e) {
      if (cfg.editMode !== false && !GridCore.isEditing()) {
        e.preventDefault();
        return;
      }
      e.originalEvent.dataTransfer.effectAllowed = "move";
      e.originalEvent.dataTransfer.setData("text/plain", layer.id);
      $item.addClass("tl-layers-item--dragging");
    });
    $item.on("dragend", function () {
      $item.removeClass("tl-layers-item--dragging");
      _$wrap
        .find(".tl-layers-item--drag-over")
        .removeClass("tl-layers-item--drag-over");
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
      var currentIds = layers.map(function (l) {
        return l.id;
      });
      var fromIdx = currentIds.indexOf(draggedId);
      var toIdx = currentIds.indexOf(layer.id);
      if (fromIdx === -1 || toIdx === -1) return;
      currentIds.splice(fromIdx, 1);
      currentIds.splice(toIdx, 0, draggedId);
      GridCore.reorderLayers(currentIds);
      var $panel = _$wrap.find(".tl-layers-panel");
      _renderPanelContent($panel);
      if (cfg.editMode === false && typeof cfg.onLayoutChange === "function") {
        cfg.onLayoutChange(GridCore.getLayout());
      }
    });

    // ── Drag-to-reorder (touch / long-press) ─────
    var _touchTimer = null;
    var _touchDragging = false;
    $item.on("touchstart", function (e) {
      if (cfg.editMode !== false && !GridCore.isEditing()) return;
      if (e.originalEvent.touches.length !== 1) return;
      _touchDragging = false;
      _touchTimer = setTimeout(function () {
        _touchDragging = true;
        $item.addClass("tl-layers-item--dragging");
      }, 400);
    });
    $item.on("touchmove", function (e) {
      if (!_touchDragging) {
        clearTimeout(_touchTimer);
        return;
      }
      e.preventDefault();
      var touch = e.originalEvent.touches[0];
      var el = document.elementFromPoint(touch.clientX, touch.clientY);
      var $target = jQuery(el).closest(".tl-layers-item");
      _$wrap
        .find(".tl-layers-item--drag-over")
        .removeClass("tl-layers-item--drag-over");
      if ($target.length && $target.data("layer-id") !== layer.id) {
        $target.addClass("tl-layers-item--drag-over");
      }
    });
    $item.on("touchend touchcancel", function (e) {
      clearTimeout(_touchTimer);
      if (!_touchDragging) return;
      _touchDragging = false;
      $item.removeClass("tl-layers-item--dragging");
      _$wrap
        .find(".tl-layers-item--drag-over")
        .removeClass("tl-layers-item--drag-over");

      var touch = e.originalEvent.changedTouches[0];
      var el = document.elementFromPoint(touch.clientX, touch.clientY);
      var $target = jQuery(el).closest(".tl-layers-item");
      var targetId = $target.data("layer-id");
      if (!targetId || targetId === layer.id) return;

      var currentIds = layers.map(function (l) {
        return l.id;
      });
      var fromIdx = currentIds.indexOf(layer.id);
      var toIdx = currentIds.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1) return;
      currentIds.splice(fromIdx, 1);
      currentIds.splice(toIdx, 0, layer.id);
      GridCore.reorderLayers(currentIds);
      var $panel = _$wrap.find(".tl-layers-panel");
      _renderPanelContent($panel);
      if (cfg.editMode === false && typeof cfg.onLayoutChange === "function") {
        cfg.onLayoutChange(GridCore.getLayout());
      }
    });

    // ── Icon ──────────────────────────────────────
    var $icon = jQuery("<div>").addClass("tl-layers-icon");
    if (layer.icon && layer.icon.indexOf("fa-") !== -1) {
      $icon.append(jQuery("<i>").addClass(layer.icon));
    } else if (layer.icon && /\.(svg|png|jpe?g|gif|webp)/i.test(layer.icon)) {
      $icon.append(
        jQuery("<img>")
          .attr("src", layer.icon)
          .css({ width: "18px", height: "18px", "object-fit": "contain" }),
      );
    } else {
      $icon.text(layer.icon || "?");
    }
    $item.append($icon);

    return $item;
  }

  // ── Add-room button ───────────────────────────────

  function _buildAddBtn($panel) {
    var cfg = GridCore.getConfig();

    return jQuery("<button>")
      .addClass("tl-layers-add-submit")
      .html('<i class="fa-solid fa-plus"></i>')
      .on("click", function () {
        if (cfg.editMode !== false && GridCore.isEditing()) return;

        // Allow host app to override the create flow
        if (typeof cfg.onCreateLayer === "function") {
          cfg.onCreateLayer(function (details) {
            GridRooms.createLayer(details, $panel);
          });
          return;
        }

        // Delegate to GridRooms for the default modal
        GridRooms.openAddModal($panel);
      });
  }

  // ── Layer hover-preview ───────────────────────────

  function _showPreview(layer, $item) {
    var cfg = GridCore.getConfig();
    if (cfg.layerPreview === false) return;
    _hidePreview();
    _$activePreview = _buildLayerPreview(layer);
    _$wrap.append(_$activePreview);

    var wrapOffset = _$wrap.offset();
    var itemOffset = $item.offset();
    var topPos = itemOffset.top - wrapOffset.top + $item.outerHeight() / 2;
    _$activePreview.css({ top: topPos + "px" });

    setTimeout(function () {
      if (_$activePreview)
        _$activePreview.addClass("tl-layer-preview-popup--visible");
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
    var tables =
      layer.id === GridCore.getActiveLayerId()
        ? GridCore.getTables()
        : layer.tables || [];
    var cols = cfg.columns;
    var rows = cfg.rows;

    var minC = cols + 1,
      minR = rows + 1,
      maxC = 0,
      maxR = 0;
    jQuery.each(tables, function (_, t) {
      if (t.col < minC) minC = t.col;
      if (t.row < minR) minR = t.row;
      var endC = t.col + t.colSpan - 1;
      var endR = t.row + t.rowSpan - 1;
      if (endC > maxC) maxC = endC;
      if (endR > maxR) maxR = endR;
    });

    if (tables.length === 0) {
      minC = 1;
      minR = 1;
      maxC = cols;
      maxR = rows;
    }

    minC = Math.max(1, minC - 1);
    minR = Math.max(1, minR - 1);
    maxC = Math.min(cols, maxC + 1);
    maxR = Math.min(rows, maxR + 1);

    var cropCols = maxC - minC + 1;
    var cropRows = maxR - minR + 1;
    var gap = 1;
    var cellW = Math.floor((120 - (cropCols - 1) * gap) / cropCols);
    var cellH = Math.floor((90 - (cropRows - 1) * gap) / cropRows);
    var cellSize = Math.max(2, Math.min(cellW, cellH));
    var gridW = cropCols * cellSize + (cropCols - 1) * gap;
    var gridH = cropRows * cellSize + (cropRows - 1) * gap;

    var $popup = jQuery("<div>").addClass("tl-layer-preview-popup");
    var $iso = jQuery("<div>").addClass("tl-layer-preview-iso");
    var $grid = jQuery("<div>")
      .addClass("tl-layer-preview-grid")
      .css({
        "grid-template-columns": "repeat(" + cropCols + ", " + cellSize + "px)",
        "grid-template-rows": "repeat(" + cropRows + ", " + cellSize + "px)",
        gap: gap + "px",
        width: gridW + "px",
        height: gridH + "px",
      });

    for (var r = 0; r < cropRows; r++) {
      for (var c = 0; c < cropCols; c++) {
        $grid.append(
          jQuery("<div>")
            .addClass("tl-layer-preview-cell")
            .css({
              "grid-column": c + 1 + " / span 1",
              "grid-row": r + 1 + " / span 1",
            }),
        );
      }
    }

    var cubeH = Math.max(2, Math.round(cellSize * 0.4));
    jQuery.each(tables, function (_, t) {
      var statusColor = cfg.statusColors[t.status] || "#6b7280";
      var $tbl = jQuery("<div>")
        .addClass("tl-layer-preview-table")
        .css({
          "grid-column": t.col - minC + 1 + " / span " + t.colSpan,
          "grid-row": t.row - minR + 1 + " / span " + t.rowSpan,
        });
      $tbl[0].style.setProperty("--tl-prev-color", statusColor);
      $tbl[0].style.setProperty("--tl-prev-h", cubeH + "px");
      $grid.append($tbl);
    });

    $iso.append($grid);
    $popup.append($iso);
    return $popup;
  }

  // ── Public API ────────────────────────────────────

  return {
    // Called by GridToolbar
    buildToolbarLeft: buildToolbarLeft,
    buildToolbarActions: buildToolbarActions,
    // Called by TableLayout to mount the floating panel
    build: build,
  };
})();
