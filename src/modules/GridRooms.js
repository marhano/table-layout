/**
 * GridRooms.js
 * Room switcher UI — floating side panel that lets users create and switch
 * between rooms within the active layer.
 * Only active when cfg.layers is defined.
 * Per-instance state via _TL context.
 *
 * Public API (called by TableLayout):
 *   GridRooms.build()      — returns the floating panel jQuery element
 *   GridRooms.buildTabBar() — returns the simple tab bar jQuery element
 *   GridRooms.renderTabs()  — re-render tab bar tabs
 *   GridRooms.init()        — initialise per-instance state
 *   GridRooms.destroy()     — tear down per-instance state
 */
var GridRooms = (function () {
  var _inst = {};

  function _c() { return _inst[_TL.cid()]; }

  function init() {
    _inst[_TL.cid()] = {
      $wrap: null,
      $activePreview: null,
      hoverTimer: null,
      $roomTabBar: null
    };
  }

  function destroy() {
    var cid = _TL.cid();
    var ctx = _inst[cid];
    if (ctx) {
      clearTimeout(ctx.hoverTimer);
      if (ctx.$activePreview) ctx.$activePreview.remove();
    }
    delete _inst[cid];
  }

  // ── Public: build wrapper (button + slide-down panel) ─────────

  function build() {
    var cfg = GridCore.getConfig();
    if (cfg.roomStyle === "simple") return null;
    return _buildGenshinPanel();
  }

  function _buildGenshinPanel() {
    var cid = _TL.cid();
    var ctx = _c();
    ctx.$wrap = jQuery("<div>").addClass("tl-rooms-wrap");

    var $btn = jQuery("<button>")
      .addClass("tl-rooms-btn tl-rooms-btn--active")
      .attr("title", "Switch Room")
      .html('<i class="fa-solid fa-door-open"></i>')
      .on("click", function (e) {
        _TL.use(cid);
        e.stopPropagation();
        var c = _c();
        var isOpen = c.$wrap.find(".tl-rooms-panel").hasClass("tl-rooms-panel--open");
        if (isOpen) {
          _closePanel();
        } else {
          _openPanel();
        }
      });

    var $panel = _buildPanel();
    $panel.addClass("tl-rooms-panel--open");

    ctx.$wrap.append($btn);
    ctx.$wrap.append($panel);

    // Re-render panel when rooms change
    var _refreshPanel = function () {
      _TL.use(cid);
      var c = _c();
      var $p = c.$wrap.find(".tl-rooms-panel");
      if ($p.length) _renderPanelContent($p);
    };
    GridEvents.on("room:updated", _refreshPanel);
    GridEvents.on("room:deleted", _refreshPanel);
    GridEvents.on("room:reordered", _refreshPanel);
    GridEvents.on("room:switched", _refreshPanel);
    GridEvents.on("layer:switched", _refreshPanel);

    return ctx.$wrap;
  }

  // ── Panel ─────────────────────────────────────────

  function _buildPanel() {
    var $panel = jQuery("<div>").addClass("tl-rooms-panel");
    $panel.on("click", function (e) { e.stopPropagation(); });
    _renderPanelContent($panel);
    return $panel;
  }

  function _renderPanelContent($panel) {
    $panel.empty();

    var rooms = GridCore.getRooms();
    var activeId = GridCore.getActiveRoomId();

    var $list = jQuery("<div>").addClass("tl-rooms-list");
    jQuery.each(rooms, function (_, room) {
      $list.append(_buildRoomItem(room, room.id === activeId));
    });
    $panel.append($list);

    $panel.append(jQuery("<div>").addClass("tl-rooms-separator"));

    $panel.append(_buildAddForm($panel));
  }

  function _openPanel() {
    var ctx = _c();
    if (!ctx.$wrap) return;
    var $panel = ctx.$wrap.find(".tl-rooms-panel");
    _renderPanelContent($panel);
    $panel.addClass("tl-rooms-panel--open");
    ctx.$wrap.find(".tl-rooms-btn").addClass("tl-rooms-btn--active");
  }

  function _closePanel() {
    var ctx = _c();
    if (!ctx.$wrap) return;
    ctx.$wrap.find(".tl-rooms-panel").removeClass("tl-rooms-panel--open");
    ctx.$wrap.find(".tl-rooms-btn").removeClass("tl-rooms-btn--active");
  }

  // ── Room item ─────────────────────────────────────

  function _showPreview(room, $item) {
    var cfg = GridCore.getConfig();
    if (cfg.roomPreview === false) return;
    _hidePreview();
    var ctx = _c();
    ctx.$activePreview = _buildRoomPreview(room);
    ctx.$wrap.append(ctx.$activePreview);

    var wrapOffset = ctx.$wrap.offset();
    var itemOffset = $item.offset();
    var itemH = $item.outerHeight();
    var topPos = itemOffset.top - wrapOffset.top + itemH / 2;
    ctx.$activePreview.css({ top: topPos + "px" });

    setTimeout(function () {
      var c2 = _c();
      if (c2 && c2.$activePreview) c2.$activePreview.addClass("tl-room-preview-popup--visible");
    }, 10);
  }

  function _hidePreview() {
    var ctx = _c();
    if (ctx && ctx.$activePreview) {
      ctx.$activePreview.remove();
      ctx.$activePreview = null;
    }
  }

  function _buildRoomPreview(room) {
    var cfg = GridCore.getConfig();
    var tables = room.id === GridCore.getActiveRoomId()
      ? GridCore.getTables()
      : (room.tables || []);
    var cols = cfg.columns;
    var rows = cfg.rows;

    var minC = cols + 1, minR = rows + 1, maxC = 0, maxR = 0;
    jQuery.each(tables, function (_, t) {
      if (t.col < minC) minC = t.col;
      if (t.row < minR) minR = t.row;
      var endC = t.col + t.colSpan - 1;
      var endR = t.row + t.rowSpan - 1;
      if (endC > maxC) maxC = endC;
      if (endR > maxR) maxR = endR;
    });

    if (tables.length === 0) {
      minC = 1; minR = 1; maxC = cols; maxR = rows;
    }

    minC = Math.max(1, minC - 1);
    minR = Math.max(1, minR - 1);
    maxC = Math.min(cols, maxC + 1);
    maxR = Math.min(rows, maxR + 1);

    var cropCols = maxC - minC + 1;
    var cropRows = maxR - minR + 1;

    var maxPreviewW = 120;
    var maxPreviewH = 90;
    var gap = 1;

    var cellW = Math.floor((maxPreviewW - (cropCols - 1) * gap) / cropCols);
    var cellH = Math.floor((maxPreviewH - (cropRows - 1) * gap) / cropRows);
    var cellSize = Math.max(2, Math.min(cellW, cellH));

    var gridW = cropCols * cellSize + (cropCols - 1) * gap;
    var gridH = cropRows * cellSize + (cropRows - 1) * gap;

    var $popup = jQuery("<div>").addClass("tl-room-preview-popup");

    var $iso = jQuery("<div>").addClass("tl-room-preview-iso");
    var $grid = jQuery("<div>").addClass("tl-room-preview-grid").css({
      "grid-template-columns": "repeat(" + cropCols + ", " + cellSize + "px)",
      "grid-template-rows":    "repeat(" + cropRows + ", " + cellSize + "px)",
      "gap": gap + "px",
      "width":  gridW + "px",
      "height": gridH + "px",
    });

    for (var r = 0; r < cropRows; r++) {
      for (var c = 0; c < cropCols; c++) {
        $grid.append(
          jQuery("<div>").addClass("tl-room-preview-cell").css({
            "grid-column": (c + 1) + " / span 1",
            "grid-row":    (r + 1) + " / span 1",
          })
        );
      }
    }

    var cubeH = Math.max(2, Math.round(cellSize * 0.4));
    jQuery.each(tables, function (_, t) {
      var statusColor = cfg.statusColors[t.status] || "#6b7280";
      var $tbl = jQuery("<div>").addClass("tl-room-preview-table").css({
        "grid-column": (t.col - minC + 1) + " / span " + t.colSpan,
        "grid-row":    (t.row - minR + 1) + " / span " + t.rowSpan,
      });
      $tbl[0].style.setProperty("--tl-prev-color", statusColor);
      $tbl[0].style.setProperty("--tl-prev-h", cubeH + "px");
      $grid.append($tbl);
    });

    $iso.append($grid);
    $popup.append($iso);
    return $popup;
  }

  function _buildRoomItem(room, isActive) {
    var rooms = GridCore.getRooms();
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();

    var $item = jQuery("<div>")
      .addClass("tl-rooms-item" + (isActive ? " tl-rooms-item--active" : ""))
      .attr({ "title": room.label, "data-room-id": room.id, "draggable": "true" })
      .on("mouseenter", function () {
        _TL.use(cid);
        var ctx = _c();
        var self = this;
        clearTimeout(ctx.hoverTimer);
        ctx.hoverTimer = setTimeout(function () { _showPreview(room, jQuery(self)); }, 500);
      })
      .on("mouseleave", function () {
        _TL.use(cid);
        var ctx = _c();
        clearTimeout(ctx.hoverTimer);
        _hidePreview();
      })
      .on("click", function () {
        _TL.use(cid);
        if (isActive) return;
        if (cfg.editMode !== false && GridCore.isEditing()) return;
        GridCore.switchRoom(room.id);
        _rebuildGrid();
        var ctx = _c();
        var $panel = ctx.$wrap.find(".tl-rooms-panel");
        _renderPanelContent($panel);
        if (typeof cfg.onRoomChange === "function")
          cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
      });

    // Drag-to-reorder events
    $item.on("dragstart", function (e) {
      _TL.use(cid);
      if (cfg.editMode !== false && !GridCore.isEditing()) { e.preventDefault(); return; }
      e.originalEvent.dataTransfer.effectAllowed = "move";
      e.originalEvent.dataTransfer.setData("text/plain", room.id);
      $item.addClass("tl-rooms-item--dragging");
    });
    $item.on("dragend", function () {
      _TL.use(cid);
      $item.removeClass("tl-rooms-item--dragging");
      var ctx = _c();
      ctx.$wrap.find(".tl-rooms-item--drag-over").removeClass("tl-rooms-item--drag-over");
    });
    $item.on("dragover", function (e) {
      e.preventDefault();
      e.originalEvent.dataTransfer.dropEffect = "move";
      $item.addClass("tl-rooms-item--drag-over");
    });
    $item.on("dragleave", function () {
      $item.removeClass("tl-rooms-item--drag-over");
    });
    $item.on("drop", function (e) {
      _TL.use(cid);
      e.preventDefault();
      $item.removeClass("tl-rooms-item--drag-over");
      var draggedId = e.originalEvent.dataTransfer.getData("text/plain");
      if (draggedId === room.id) return;
      var currentIds = rooms.map(function (r) { return r.id; });
      var fromIdx = currentIds.indexOf(draggedId);
      var toIdx = currentIds.indexOf(room.id);
      if (fromIdx === -1 || toIdx === -1) return;
      currentIds.splice(fromIdx, 1);
      currentIds.splice(toIdx, 0, draggedId);
      GridCore.reorderRooms(currentIds);
      var ctx = _c();
      var $panel = ctx.$wrap.find(".tl-rooms-panel");
      _renderPanelContent($panel);
      if (cfg.editMode === false && typeof cfg.onLayoutChange === "function")
        cfg.onLayoutChange(GridCore.getLayout());
    });

    // Touch-to-reorder events (long press)
    var _touchTimer = null;
    var _touchDragging = false;
    $item.on("touchstart", function (e) {
      _TL.use(cid);
      if (cfg.editMode !== false && !GridCore.isEditing()) return;
      if (e.originalEvent.touches.length !== 1) return;
      _touchDragging = false;
      _touchTimer = setTimeout(function () {
        _touchDragging = true;
        $item.addClass("tl-rooms-item--dragging");
      }, 400);
    });
    $item.on("touchmove", function (e) {
      _TL.use(cid);
      if (!_touchDragging) { clearTimeout(_touchTimer); return; }
      e.preventDefault();
      var touch = e.originalEvent.touches[0];
      var el = document.elementFromPoint(touch.clientX, touch.clientY);
      var $target = jQuery(el).closest(".tl-rooms-item");
      var ctx = _c();
      ctx.$wrap.find(".tl-rooms-item--drag-over").removeClass("tl-rooms-item--drag-over");
      if ($target.length && $target.data("room-id") !== room.id) {
        $target.addClass("tl-rooms-item--drag-over");
      }
    });
    $item.on("touchend touchcancel", function (e) {
      _TL.use(cid);
      clearTimeout(_touchTimer);
      if (!_touchDragging) return;
      _touchDragging = false;
      $item.removeClass("tl-rooms-item--dragging");
      var ctx = _c();
      ctx.$wrap.find(".tl-rooms-item--drag-over").removeClass("tl-rooms-item--drag-over");

      var touch = e.originalEvent.changedTouches[0];
      var el = document.elementFromPoint(touch.clientX, touch.clientY);
      var $target = jQuery(el).closest(".tl-rooms-item");
      var targetId = $target.data("room-id");
      if (!targetId || targetId === room.id) return;

      var currentIds = rooms.map(function (r) { return r.id; });
      var fromIdx = currentIds.indexOf(room.id);
      var toIdx = currentIds.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1) return;
      currentIds.splice(fromIdx, 1);
      currentIds.splice(toIdx, 0, room.id);
      GridCore.reorderRooms(currentIds);
      var $panel = ctx.$wrap.find(".tl-rooms-panel");
      _renderPanelContent($panel);
      if (cfg.editMode === false && typeof cfg.onLayoutChange === "function")
        cfg.onLayoutChange(GridCore.getLayout());
    });

    var isFaIcon = room.icon && room.icon.indexOf("fa-") !== -1;
    var $icon = jQuery("<div>").addClass("tl-rooms-icon");
    if (isFaIcon) {
      $icon.append(jQuery("<i>").addClass(room.icon));
    } else if (room.icon && /\.(svg|png|jpe?g|gif|webp)/i.test(room.icon)) {
      $icon.append(jQuery("<img>").attr("src", room.icon).css({ width: "18px", height: "18px", "object-fit": "contain" }));
    } else {
      $icon.text(room.icon || "?");
    }

    $item.append($icon);

    return $item;
  }

  // ── Add room form ─────────────────────────────────

  function _buildAddForm($panel) {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();

    var $addBtn = jQuery("<button>")
      .addClass("tl-rooms-add-submit")
      .html('<i class="fa-solid fa-plus"></i>')
      .on("click", function () {
        _TL.use(cid);
        if (cfg.editMode !== false && !GridCore.isEditing()) return;
        if (typeof cfg.onCreateRoom === "function") {
          cfg.onCreateRoom(function (details) {
            _createRoom(details, $panel);
          });
          return;
        }
        _openAddModal($panel);
      });

    return $addBtn;
  }

  function _openAddModal($panel) {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();
    var pickerCfg = cfg.iconPicker || {};
    var icons = pickerCfg.icons || [];
    var maxText = pickerCfg.maxTextLength || 4;
    var allowText = pickerCfg.allowText !== false;
    var _selectedIcon = "";

    var $overlay = jQuery("<div>").addClass("tl-overlay");
    var $modal = jQuery("<div>").addClass("tl-modal");

    $modal.append(
      jQuery("<h2>").html('<i class="fa-solid fa-door-open"></i> New Room')
    );

    var $nameField = jQuery("<div>").addClass("tl-field");
    $nameField.append(jQuery("<label>").text("Name"));
    var $nameInput = jQuery("<input>").attr({ type: "text", placeholder: "Room name", maxlength: 30 });
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

    var $create = jQuery("<button>").addClass("tl-btn tl-btn-primary").text("Add Room")
      .on("click", function () {
        _TL.use(cid);
        var labelVal = jQuery.trim($nameInput.val());
        if (!labelVal) { $nameInput.addClass("tl-input-error").trigger("focus"); return; }
        $nameInput.removeClass("tl-input-error");
        var iconVal = _selectedIcon || labelVal.charAt(0).toUpperCase();
        $overlay.remove();
        _createRoom({ label: labelVal, icon: iconVal }, $panel);
      });

    $nameInput.on("input", function () { jQuery(this).removeClass("tl-input-error"); });
    $nameInput.on("keydown", function (e) { if (e.key === "Enter") $create.trigger("click"); });

    $actions.append($cancel, $create);
    $modal.append($nameField, $iconField, $actions);
    $overlay.append($modal);
    jQuery("#" + _TL.cid()).append($overlay);

    $overlay.on("click", function (e) { if (jQuery(e.target).is($overlay)) $overlay.remove(); });

    setTimeout(function () { $nameInput.trigger("focus"); }, 50);
  }

  function _createRoom(details, $panel) {
    var label = details.label || "Room";
    var room = {
      id: "room-" + Date.now(),
      label: label,
      icon: details.icon || label.charAt(0).toUpperCase(),
      tables: [],
    };
    GridCore.addRoom(room);
    GridCore.switchRoom(room.id);
    _rebuildGrid();
    if ($panel) _renderPanelContent($panel);
    var cfg = GridCore.getConfig();
    if (typeof cfg.onRoomChange === "function")
      cfg.onRoomChange(room, []);
  }

  // ── Grid rebuild on room switch ───────────────────

  function _rebuildGrid() {
    _TL.$(".tl-zoom-area").empty().append(GridRender.buildGrid());
  }

  // ═══════════════════════════════════════════════════
  // ── Simple tab bar mode ────────────────────────────
  // ═══════════════════════════════════════════════════

  function buildTabBar() {
    var cid = _TL.cid();
    var ctx = _c();
    ctx.$roomTabBar = jQuery("<div>").addClass("tl-room-tab-bar");

    var $scrollLeft = jQuery("<button>")
      .addClass("tl-room-tab-scroll tl-room-tab-scroll--left")
      .attr("title", "Scroll left")
      .html('<i class="fa-solid fa-chevron-left"></i>')
      .on("click", function () {
        _TL.use(cid);
        var c = _c();
        var $area = c.$roomTabBar.find(".tl-room-tab-scroll-area");
        $area.scrollLeft($area.scrollLeft() - 120);
      });

    var $scrollArea = jQuery("<div>").addClass("tl-room-tab-scroll-area");

    var $scrollRight = jQuery("<button>")
      .addClass("tl-room-tab-scroll tl-room-tab-scroll--right")
      .attr("title", "Scroll right")
      .html('<i class="fa-solid fa-chevron-right"></i>')
      .on("click", function () {
        _TL.use(cid);
        var c = _c();
        var $area = c.$roomTabBar.find(".tl-room-tab-scroll-area");
        $area.scrollLeft($area.scrollLeft() + 120);
      });

    var $addTab = jQuery("<div>")
      .addClass("tl-room-tab-add")
      .attr("title", "Add Room")
      .html('<i class="fa-solid fa-plus"></i>')
      .on("click", function () {
        _TL.use(cid);
        var cfg = GridCore.getConfig();
        if (cfg.realTime === false && !GridCore.isEditing()) return;
        if (typeof cfg.onCreateRoom === "function") {
          cfg.onCreateRoom(function (details) {
            _createRoom(details);
          });
          return;
        }
        _openAddModal();
      });

    ctx.$roomTabBar.append($scrollLeft, $scrollArea, $scrollRight, $addTab);
    _renderRoomTabs();
    _updateScrollButtons();

    $scrollArea.on("scroll", function () {
      _TL.use(cid);
      _updateScrollButtons();
    });

    GridEvents.on("room:added", function () { _TL.use(cid); _renderRoomTabs(); });
    GridEvents.on("room:deleted", function () { _TL.use(cid); _renderRoomTabs(); });
    GridEvents.on("room:reordered", function () { _TL.use(cid); _renderRoomTabs(); });
    GridEvents.on("room:updated", function () { _TL.use(cid); _renderRoomTabs(); });
    GridEvents.on("room:switched", function () { _TL.use(cid); _renderRoomTabs(); });
    GridEvents.on("layer:switched", function () { _TL.use(cid); _renderRoomTabs(); });

    return ctx.$roomTabBar;
  }

  function _updateScrollButtons() {
    var ctx = _c();
    if (!ctx || !ctx.$roomTabBar) return;
    var $area = ctx.$roomTabBar.find(".tl-room-tab-scroll-area");
    if (!$area.length) return;
    var el = $area[0];
    var canScrollLeft = el.scrollLeft > 1;
    var canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    ctx.$roomTabBar.find(".tl-room-tab-scroll--left").toggleClass("tl-room-tab-scroll--visible", canScrollLeft);
    ctx.$roomTabBar.find(".tl-room-tab-scroll--right").toggleClass("tl-room-tab-scroll--visible", canScrollRight);
  }

  function _renderRoomTabs() {
    var ctx = _c();
    if (!ctx || !ctx.$roomTabBar) return;
    var $scrollArea = ctx.$roomTabBar.find(".tl-room-tab-scroll-area");
    if (!$scrollArea.length) return;
    $scrollArea.empty();

    var cfg = GridCore.getConfig();
    var rooms = GridCore.getRooms();
    var activeId = GridCore.getActiveRoomId();
    var cid = _TL.cid();

    jQuery.each(rooms, function (_, room) {
      var isActive = room.id === activeId;
      var $tab = jQuery("<div>")
        .addClass("tl-room-tab" + (isActive ? " tl-room-tab--active" : ""))
        .attr({ "data-room-id": room.id, "draggable": "true" });

      var $icon = _buildRoomTabIcon(room);
      var $label = jQuery("<span>").addClass("tl-room-tab-label").text(room.label);
      $tab.append($icon, $label);

      if (rooms.length > 1 && cfg.realTime === false && GridCore.isEditing()) {
        var $close = jQuery("<span>")
          .addClass("tl-room-tab-close")
          .html("&times;")
          .on("click", function (e) {
            _TL.use(cid);
            e.stopPropagation();
            if (cfg.realTime === false && !GridCore.isEditing()) return;
            _confirmDeleteRoomTab(room);
          });
        $tab.append($close);
      }

      $tab.on("click", function () {
        _TL.use(cid);
        if (isActive) return;
        if (cfg.realTime === false && GridCore.isEditing()) return;
        GridCore.switchRoom(room.id);
        _rebuildGrid();
        if (typeof cfg.onRoomChange === "function")
          cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
      });

      // Drag-to-reorder
      $tab.on("dragstart", function (e) {
        _TL.use(cid);
        if (cfg.realTime === false && !GridCore.isEditing()) { e.preventDefault(); return; }
        e.originalEvent.dataTransfer.effectAllowed = "move";
        e.originalEvent.dataTransfer.setData("text/plain", room.id);
        $tab.addClass("tl-room-tab--dragging");
      });
      $tab.on("dragend", function () {
        _TL.use(cid);
        $tab.removeClass("tl-room-tab--dragging");
        var c = _c();
        c.$roomTabBar.find(".tl-room-tab--drag-over").removeClass("tl-room-tab--drag-over");
      });
      $tab.on("dragover", function (e) {
        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = "move";
        $tab.addClass("tl-room-tab--drag-over");
      });
      $tab.on("dragleave", function () {
        $tab.removeClass("tl-room-tab--drag-over");
      });
      $tab.on("drop", function (e) {
        _TL.use(cid);
        e.preventDefault();
        $tab.removeClass("tl-room-tab--drag-over");
        var draggedId = e.originalEvent.dataTransfer.getData("text/plain");
        if (draggedId === room.id) return;
        var currentIds = rooms.map(function (r) { return r.id; });
        var fromIdx = currentIds.indexOf(draggedId);
        var toIdx = currentIds.indexOf(room.id);
        if (fromIdx === -1 || toIdx === -1) return;
        currentIds.splice(fromIdx, 1);
        currentIds.splice(toIdx, 0, draggedId);
        GridCore.reorderRooms(currentIds);
      });

      // Double-click to rename
      $tab.on("dblclick", function (e) {
        _TL.use(cid);
        e.stopPropagation();
        if (cfg.realTime !== false || !GridCore.isEditing()) return;
        _startRoomTabRename($tab, room);
      });

      $scrollArea.append($tab);
    });

    _updateScrollButtons();
  }

  function renderTabs() {
    _renderRoomTabs();
  }

  function _buildRoomTabIcon(room) {
    var $icon = jQuery("<div>").addClass("tl-room-tab-icon");
    if (room.icon && room.icon.indexOf("fa-") !== -1) {
      $icon.append(jQuery("<i>").addClass(room.icon));
    } else if (room.icon && /\.(svg|png|jpe?g|gif|webp)/i.test(room.icon)) {
      $icon.append(jQuery("<img>").attr("src", room.icon).css({ width: "14px", height: "14px", "object-fit": "contain" }));
    } else {
      $icon.text(room.icon || "?");
    }
    return $icon;
  }

  function _startRoomTabRename($tab, room) {
    var cid = _TL.cid();
    var $label = $tab.find(".tl-room-tab-label");
    var $input = jQuery("<input>")
      .addClass("tl-room-tab-rename-input")
      .attr({ type: "text", maxlength: 30 })
      .val(room.label);
    $label.replaceWith($input);
    $input.trigger("focus").trigger("select");

    function commit() {
      _TL.use(cid);
      var val = jQuery.trim($input.val());
      if (val && val !== room.label) {
        GridCore.updateRoomMeta(room.id, { label: val });
      }
      _renderRoomTabs();
    }

    $input.on("blur", commit);
    $input.on("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); $input.trigger("blur"); }
      if (e.key === "Escape") { _TL.use(cid); _renderRoomTabs(); }
    });
    $input.on("click", function (e) { e.stopPropagation(); });
  }

  function _confirmDeleteRoomTab(room) {
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
        _TL.use(cid);
        $overlay.remove();
        var wasActive = (room.id === GridCore.getActiveRoomId());
        GridCore.deleteRoom(room.id);
        if (wasActive) _rebuildGrid();
        if (typeof cfg.onRoomChange === "function")
          cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
      });
    $actions.append($cancel, $confirm);
    $modal.append($actions);
    $overlay.append($modal);
    jQuery("#" + _TL.cid()).append($overlay);
    $overlay.on("click", function (e) { if (jQuery(e.target).is($overlay)) $overlay.remove(); });
  }

  return {
    init: init,
    destroy: destroy,
    build: build,
    buildTabBar: buildTabBar,
    renderTabs: renderTabs
  };
})();
