/**
 * GridPlace.js
 * Place new tables on the grid by selecting a shape tool and dragging.
 * Per-instance state via _TL context.
 */
var GridPlace = (function () {
  var _inst = {};

  function _c() { return _inst[_TL.cid()]; }

  function init() {
    _inst[_TL.cid()] = {
      start: null,
      $ghost: null,
      pending: null,
      placeTouchMoveHandler: null
    };
  }

  function destroy() {
    var cid = _TL.cid();
    var ctx = _inst[cid];
    if (ctx && ctx.placeTouchMoveHandler) {
      document.removeEventListener("touchmove", ctx.placeTouchMoveHandler);
    }
    jQuery(document).off(".tl-place-" + cid);
    delete _inst[cid];
  }

  function bind() {
    var cfg = GridCore.getConfig();
    var cid = _TL.cid();
    var gridSel = "#" + cfg.containerId + " .tl-layout-grid";

    jQuery(document).on("mousedown.tl-place-" + cid, gridSel + " .tl-cell", function (e) {
      _TL.use(cid);
      if (cfg.realTime === false && !GridCore.isEditing()) return;
      if (!GridToolbar.getActive() || e.which !== 1) return;
      e.preventDefault();
      var ctx = _c();
      ctx.start = {
        col: parseInt(jQuery(this).data("col")),
        row: parseInt(jQuery(this).data("row")),
      };
    });

    jQuery(document).on("mousemove.tl-place-" + cid, gridSel, function (e) {
      _TL.use(cid);
      var ctx = _c();
      if (!GridToolbar.getActive() || !ctx.start) return;
      var end = GridCore.cursorToGrid(e.originalEvent.clientX, e.originalEvent.clientY);
      var span = GridCore.calcSpan(ctx.start, end, GridToolbar.getActive());
      GridRender.maybeExpand(span.col + span.colSpan - 1, span.row + span.rowSpan - 1);
      _autoScrollCanvas(e.originalEvent.clientX, e.originalEvent.clientY);
      var bad = GridCore.hasCollision(span.col, span.row, span.colSpan, span.rowSpan, null);
      _showGhost(span.col, span.row, span.colSpan, span.rowSpan, bad);
    });

    jQuery(document).on("mouseup.tl-place-" + cid, gridSel, function (e) {
      _TL.use(cid);
      var ctx = _c();
      if (!GridToolbar.getActive() || !ctx.start || e.which !== 1) return;
      var end = GridCore.cursorToGrid(e.originalEvent.clientX, e.originalEvent.clientY);
      var span = GridCore.calcSpan(ctx.start, end, GridToolbar.getActive());
      _removeGhost();
      ctx.start = null;
      if (GridCore.hasCollision(span.col, span.row, span.colSpan, span.rowSpan, null)) return;
      _showModal(jQuery.extend({}, span, { shape: GridToolbar.getActive() }));
    });

    jQuery(document).on("mouseup.tl-place-" + cid, function (e) {
      _TL.use(cid);
      var ctx = _c();
      if (GridToolbar.getActive() && ctx.start && !jQuery(e.target).closest(gridSel).length) {
        ctx.start = null;
        _removeGhost();
      }
    });

    jQuery(document).on("keydown.tl-place-" + cid, function (e) {
      _TL.use(cid);
      if (e.key === "Escape" && GridToolbar.getActive()) GridToolbar.deactivate();
    });

    // ── Touch: shape drawing ───────────────────────
    jQuery(document).on("touchstart.tl-place-" + cid, gridSel + " .tl-cell", function (e) {
      _TL.use(cid);
      var ctx = _c();
      if (cfg.editMode !== false && !GridCore.isEditing()) return;
      if (!GridToolbar.getActive()) return;
      if (e.originalEvent.touches.length !== 1) return;
      e.preventDefault();
      var touch = e.originalEvent.touches[0];
      var $cell = jQuery(document.elementFromPoint(touch.clientX, touch.clientY)).closest(".tl-cell");
      if (!$cell.length) return;
      ctx.start = {
        col: parseInt($cell.data("col")),
        row: parseInt($cell.data("row")),
      };

      ctx.placeTouchMoveHandler = function (te) {
        _TL.use(cid);
        var ctx2 = _c();
        if (!ctx2.start) return;
        if (te.touches.length !== 1) return;
        te.preventDefault();
        var tc = te.touches[0];
        var end = GridCore.cursorToGrid(tc.clientX, tc.clientY);
        var span = GridCore.calcSpan(ctx2.start, end, GridToolbar.getActive());
        var bad = GridCore.hasCollision(span.col, span.row, span.colSpan, span.rowSpan, null);
        _showGhost(span.col, span.row, span.colSpan, span.rowSpan, bad);
      };
      document.addEventListener("touchmove", ctx.placeTouchMoveHandler, { passive: false });
    });

    jQuery(document).on("touchend.tl-place-" + cid, function (e) {
      _TL.use(cid);
      var ctx = _c();
      if (ctx.placeTouchMoveHandler) {
        document.removeEventListener("touchmove", ctx.placeTouchMoveHandler);
        ctx.placeTouchMoveHandler = null;
      }
      if (!GridToolbar.getActive() || !ctx.start) return;
      var touch = e.originalEvent.changedTouches[0];
      var end = GridCore.cursorToGrid(touch.clientX, touch.clientY);
      var span = GridCore.calcSpan(ctx.start, end, GridToolbar.getActive());
      _removeGhost();
      ctx.start = null;
      if (GridCore.hasCollision(span.col, span.row, span.colSpan, span.rowSpan, null)) return;
      _showModal(jQuery.extend({}, span, { shape: GridToolbar.getActive() }));
    });
  }

  function _showGhost(col, row, colSpan, rowSpan, invalid) {
    _removeGhost();
    var ctx = _c();
    ctx.$ghost = GridRender.buildPlaceGhost(col, row, colSpan, rowSpan, invalid);
    _TL.$(".tl-layout-grid").append(ctx.$ghost);
  }

  function _removeGhost() {
    var ctx = _c();
    if (ctx.$ghost) {
      ctx.$ghost.remove();
      ctx.$ghost = null;
    }
  }

  function _autoScrollCanvas(clientX, clientY) {
    var canvasEl = _TL.$(".tl-canvas")[0];
    if (!canvasEl) return;
    var rect = canvasEl.getBoundingClientRect();
    var MARGIN = 60, SPEED = 12;
    if      (clientX > rect.right  - MARGIN) canvasEl.scrollLeft += SPEED;
    else if (clientX < rect.left   + MARGIN) canvasEl.scrollLeft = Math.max(0, canvasEl.scrollLeft - SPEED);
    if      (clientY > rect.bottom - MARGIN) canvasEl.scrollTop  += SPEED;
    else if (clientY < rect.top    + MARGIN) canvasEl.scrollTop  = Math.max(0, canvasEl.scrollTop  - SPEED);
  }

  function _showModal(placement) {
    var cid = _TL.cid();
    var ctx = _c();
    ctx.pending = placement;
    var cfg = GridCore.getConfig();
    var shapeDef = (cfg.shapes || {})[placement.shape] || {};
    var nextName = (cfg.newTable.namePrefix || "Table") + " " + GridCore.getCounter();
    var defaultTables = [];

    // ── Table combobox ─────────────────────────────
    var combobox = _buildTableCombobox(cid, 'Select a table...');

    function _buildItems(tables) {
      var allLayers = GridCore.getAllLayersLayout();
      var result = [];
      tables.forEach(function (t, i) {
        if (allLayers && allLayers.some(function (layer) {
          return layer.rooms.some(function (room) {
            return room.tables.some(function (tbl) { return tbl.id === t.TableId; });
          });
        })) return;
        result.push({ value: i, label: t.TableName + ' (' + t.Capacity + ' seats)' });
      });
      return result;
    }

    if (typeof cfg.newTable.tables === 'function') {
      combobox.setLoading(true);
      Promise.resolve(cfg.newTable.tables()).then(function (result) {
        _TL.use(cid);
        defaultTables = result || [];
        combobox.setLoading(false);
        combobox.setItems(_buildItems(defaultTables));
      });
    } else if (Array.isArray(cfg.newTable.tables)) {
      defaultTables = cfg.newTable.tables;
      combobox.setItems(_buildItems(defaultTables));
    }

    // ── Custom modal hook ─────────────────────────
    if (typeof cfg.onCreateTable === "function") {
      var tableDefaults = {
        name: nextName,
        seats: cfg.newTable.defaultSeats || 4,
        status: cfg.newTable.defaultStatus || "available",
      };
      cfg.onCreateTable(
        jQuery.extend({}, placement),
        tableDefaults,
        function (details) {
          _TL.use(cid);
          _commit(details);
        }
      );
      return;
    }

    var color = cfg.statusColors[cfg.newTable.defaultStatus] || "#16a34a";
    var styles = GridCore.getShapeStyles(placement.shape);

    var $overlay = jQuery("<div>").addClass("tl-overlay");
    var $modal = jQuery("<div>").addClass("tl-modal");

    $modal.append(
      jQuery("<h2>").html('<i class="fa-solid fa-chair"></i> Add Table')
    );

    $modal.append(_field("Table", combobox.$el));

    var $err = jQuery("<p>").addClass("tl-error");
    $modal.append($err);

    var $cancel = jQuery("<button>")
      .addClass("tl-btn tl-btn-cancel")
      .text("Cancel")
      .on("click", function () {
        $overlay.remove();
        _TL.use(cid);
        var ctx2 = _c();
        if (ctx2) ctx2.pending = null;
      });

    var $create = jQuery("<button>")
      .addClass("tl-btn tl-btn-primary")
      .text("Create Table")
      .on("click", function () {
        _TL.use(cid);
        $err.hide();
        var selected = combobox.getValue();
        if (combobox.isLoading()) {
          $err.text('Table options are still loading, please wait.').show();
          return;
        }
        if (!selected) {
          $err.text('Please select a table.').show();
          return;
        }
        var t = defaultTables[selected.value];
        _commit({
          id:     t.TableId,
          name:   t.TableName,
          seats:  parseInt(t.Capacity) || cfg.newTable.defaultSeats || 4,
          status: t.Status ? t.Status.toLowerCase() : (cfg.newTable.defaultStatus || 'available'),
        });
        $overlay.remove();
      });

    $modal.append(
      jQuery("<div>").addClass("tl-modal-actions").append($cancel, $create),
    );
    $overlay.append($modal);
    jQuery("#" + cid).append($overlay);

    $overlay.on("click", function (e) {
      if (jQuery(e.target).is($overlay)) {
        $overlay.remove();
        _TL.use(cid);
        var ctx2 = _c();
        if (ctx2) ctx2.pending = null;
      }
    });
  }

  function _field(label, $input) {
    return jQuery("<div>")
      .addClass("tl-field")
      .append(jQuery("<label>").text(label), $input);
  }

  function _commit(details) {
    var ctx = _c();
    if (!ctx || !ctx.pending) return;
    var cfg = GridCore.getConfig();

    var newTable = {
      id: details.id || "T" + Date.now(),
      name: details.name,
      seats: details.seats,
      status: details.status,
      shape: ctx.pending.shape,
      col: ctx.pending.col,
      row: ctx.pending.row,
      colSpan: ctx.pending.colSpan,
      rowSpan: ctx.pending.rowSpan,
    };

    GridCore.addTable(newTable);
    _TL.$(".tl-layout-grid").append(GridRender.buildTableCard(newTable));

    if (typeof cfg.onTableCreated === "function") cfg.onTableCreated(newTable);
    if (typeof cfg.onLayoutChange === "function" && !(cfg.realTime === false && GridCore.isEditing()))
      cfg.onLayoutChange(GridCore.getLayout());

    ctx.pending = null;
    GridToolbar.deactivate();
  }

  // ── Searchable combobox ───────────────────────────
  function _buildTableCombobox(cid, placeholder, initialItem) {
    var _items = [];
    var _selected = initialItem || null;
    var _loading = false;
    var _isOpen = false;
    var _filter = '';
    var _uid = cid + '-tcb-' + Date.now();

    var $wrap     = jQuery('<div>').addClass('tl-combobox');
    var $trigText = jQuery('<span>').addClass('tl-combobox-trigger-text');
    var $trigChev = jQuery('<span>').addClass('tl-combobox-trigger-chevron')
                      .html('<i class="fa-solid fa-chevron-down"></i>');
    var $trigger  = jQuery('<div>').addClass('tl-combobox-trigger').append($trigText, $trigChev);

    var $searchInput = jQuery('<input>').attr({ type: 'text', placeholder: 'Filter...' })
                         .addClass('tl-combobox-search');
    var $searchWrap  = jQuery('<div>').addClass('tl-combobox-search-wrap').append($searchInput);
    var $list        = jQuery('<div>').addClass('tl-combobox-list');
    var $panel       = jQuery('<div>').addClass('tl-combobox-panel').append($searchWrap, $list);

    $wrap.append($trigger, $panel);

    function _updateTrigger() {
      if (_loading && !_selected) {
        $trigText.text('Loading options...')
                 .addClass('tl-combobox-trigger-text--placeholder');
      } else if (_selected) {
        $trigText.text(_selected.label)
                 .removeClass('tl-combobox-trigger-text--placeholder');
      } else {
        $trigText.text(placeholder)
                 .addClass('tl-combobox-trigger-text--placeholder');
      }
    }

    function _renderList() {
      $list.empty();
      if (_loading && _items.length === 0) {
        $list.append(
          jQuery('<div>').addClass('tl-combobox-status').append(
            jQuery('<span>').addClass('tl-spinner'),
            jQuery('<span>').text(' Loading...')
          )
        );
        return;
      }
      // include initialItem at top if it's not in _items
      var all = (_selected && !_items.some(function (it) { return it.value === _selected.value; }))
        ? [_selected].concat(_items)
        : _items;
      var filterLower = _filter.toLowerCase();
      var shown = filterLower
        ? all.filter(function (it) { return it.label.toLowerCase().indexOf(filterLower) !== -1; })
        : all;
      if (shown.length === 0) {
        $list.append(
          jQuery('<div>').addClass('tl-combobox-status').text('No options found')
        );
        return;
      }
      jQuery.each(shown, function (_, item) {
        var isSel = _selected && _selected.value === item.value;
        var $opt = jQuery('<div>')
          .addClass('tl-combobox-option' + (isSel ? ' tl-combobox-option--selected' : ''));
        $opt.append(jQuery('<span>').addClass('tl-combobox-option-label').text(item.label));
        if (isSel) {
          $opt.append(
            jQuery('<span>').addClass('tl-combobox-option-check')
                            .html('<i class="fa-solid fa-check"></i>')
          );
        }
        $opt.on('click', function () {
          _selected = item;
          _closeDropdown();
          _updateTrigger();
        });
        $list.append($opt);
      });
    }

    function _openDropdown() {
      if (_isOpen) return;
      _isOpen = true;
      $wrap.addClass('tl-combobox--open');
      _renderList();
      setTimeout(function () { $searchInput.trigger('focus'); }, 20);
      jQuery(document).on('mousedown.' + _uid, function (e) {
        if (!$wrap.is(e.target) && !$wrap.find(e.target).length) _closeDropdown();
      });
    }

    function _closeDropdown() {
      if (!_isOpen) return;
      _isOpen = false;
      $wrap.removeClass('tl-combobox--open');
      $searchInput.val('');
      _filter = '';
      jQuery(document).off('.' + _uid);
    }

    $trigger.on('click', function (e) {
      e.stopPropagation();
      if (_isOpen) { _closeDropdown(); } else { _openDropdown(); }
    });

    $searchInput.on('input', function () {
      _filter = jQuery(this).val();
      _renderList();
    });

    _updateTrigger();

    return {
      $el:       $wrap,
      getValue:  function () { return _selected; },
      isLoading: function () { return _loading; },
      setItems:  function (items) { _items = items; if (_isOpen) _renderList(); },
      setLoading: function (val) { _loading = val; _updateTrigger(); if (_isOpen) _renderList(); },
    };
  }

  function unbind() {
    var cid = _TL.cid();
    var ctx = _inst[cid];
    if (ctx && ctx.placeTouchMoveHandler) {
      document.removeEventListener("touchmove", ctx.placeTouchMoveHandler);
      ctx.placeTouchMoveHandler = null;
    }
    jQuery(document).off(".tl-place-" + cid);
  }

  return { init: init, destroy: destroy, bind: bind, unbind: unbind };
})();
