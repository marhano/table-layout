/**
 * GridEdit.js
 * Edit modal for placed table cards.
 * Opens when the edit button on a table card is clicked.
 * Allows changing shape and reassigning to a different table.
 */
var GridEdit = (function () {

  function bind() {
    // Click handlers are bound directly on edit buttons in GridRender.buildTableCard
  }

  function showEditModal(t) {
    _showEditModal(t);
  }

  function _showEditModal(table) {
    var cid = _TL.cid();
    var cfg = GridCore.getConfig();
    var currentShape = table.shape || "square";
    var statusColor = cfg.statusColors[table.status] || "#6b7280";
    var styles = GridCore.getShapeStyles(currentShape);
    var defaultTables = [];

    // ── Table combobox ─────────────────────────────
    var initialItem = {
      value: '__current__',
      label: table.name + ' (' + table.seats + ' seat' + (table.seats !== 1 ? 's' : '') + ') — current',
    };
    var combobox = _buildTableCombobox(cid, 'Select a table', initialItem);

    function _buildItems(tables) {
      var allLayers = GridCore.getAllLayersLayout();
      var result = [];
      tables.forEach(function (t, i) {
        if (t.TableId === table.id) return;
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
        defaultTables = result || [];
        combobox.setLoading(false);
        combobox.setItems(_buildItems(defaultTables));
      });
    } else if (Array.isArray(cfg.newTable.tables)) {
      defaultTables = cfg.newTable.tables;
      combobox.setItems(_buildItems(defaultTables));
    }

    // ── Shape selector ──
    var $shapeWrap = jQuery('<div>').addClass('tl-edit-shapes');
    jQuery.each(cfg.shapes, function (key, shapeDef) {
      var $btn = jQuery('<button>')
        .addClass('tl-edit-shape-btn')
        .toggleClass('tl-edit-shape-btn--active', key === currentShape)
        .attr({ 'data-shape': key, title: shapeDef.label, type: 'button' })
        .html('<i class="' + shapeDef.icon + '"></i>')
        .on('click', function () {
          $shapeWrap.find('.tl-edit-shape-btn--active').removeClass('tl-edit-shape-btn--active');
          jQuery(this).addClass('tl-edit-shape-btn--active');
          currentShape = key;
          var newStyles = GridCore.getShapeStyles(key);
          $modal.find('.tl-modal-preview').css({
            'clip-path': newStyles.clipPath,
            'border-radius': newStyles.borderRadius
          });
        });
      $shapeWrap.append($btn);
    });

    // ── Build modal ──
    var $overlay = jQuery('<div>').addClass('tl-overlay');
    var $modal = jQuery('<div>').addClass('tl-modal');

    $modal.append(
      jQuery('<h2>')
        .append(jQuery('<i>').addClass('fa-solid fa-pen-to-square'))
        .append(' ')
        .append(jQuery('<span>').text(table.name))
    );

    $modal.append(_field('Shape', $shapeWrap));
    $modal.append(_field('Change table', combobox.$el));

    var $err = jQuery('<p>').addClass('tl-error').text('Error saving changes.');
    $modal.append($err);

    var $cancel = jQuery('<button>')
      .addClass('tl-btn tl-btn-cancel')
      .text('Cancel')
      .on('click', function () { $overlay.remove(); });

    var $save = jQuery('<button>')
      .addClass('tl-btn tl-btn-primary')
      .text('Save')
      .on('click', function () {
        _TL.use(cid);
        $err.hide();

        var selected = combobox.getValue();
        if (combobox.isLoading() && (!selected || selected.value === '__current__')) {
          $err.text('Table options are still loading, please wait.').show();
          return;
        }

        var props = { shape: currentShape };

        if (selected && selected.value !== '__current__') {
          var selTable = defaultTables[parseInt(selected.value, 10)];
          if (selTable) {
            props.id     = selTable.TableId;
            props.name   = selTable.TableName;
            props.seats  = parseInt(selTable.Capacity, 10) || table.seats;
            props.status = selTable.Status ? selTable.Status.toLowerCase() : table.status;
          }
        }

        // Enforce shape min dimensions
        var shapeDef = (cfg.shapes || {})[currentShape] || {};
        var minC = shapeDef.minCols || 1;
        var minR = shapeDef.minRows || 1;
        var newColSpan = Math.max(minC, table.colSpan);
        var newRowSpan = Math.max(minR, table.rowSpan);
        if (shapeDef.preferSquare) {
          var side = Math.max(newColSpan, newRowSpan);
          newColSpan = side;
          newRowSpan = side;
        }
        props.colSpan = newColSpan;
        props.rowSpan = newRowSpan;

        if (GridCore.hasCollision(table.col, table.row, newColSpan, newRowSpan, table.id)) {
          $err.text('Not enough space for this shape.').show();
          return;
        }

        var origId = table.id;
        GridCore.updateTable(origId, props);
        var updated = GridCore.tableById(props.id || origId);
        _TL.$('[data-table-id="' + origId + '"]').replaceWith(GridRender.buildTableCard(updated));

        if (typeof cfg.onLayoutChange === "function" && !(cfg.realTime === false && GridCore.isEditing()))
          cfg.onLayoutChange(GridCore.getLayout());

        $overlay.remove();
      });

    $modal.append(
      jQuery('<div>').addClass('tl-modal-actions').append($cancel, $save)
    );
    $overlay.append($modal);
    jQuery('#' + cid).append($overlay);

    $overlay.on('click', function (e) {
      if (jQuery(e.target).is($overlay)) $overlay.remove();
    });
  }

  function _field(label, $input) {
    return jQuery('<div>').addClass('tl-field')
      .append(jQuery('<label>').text(label), $input);
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
      $el:        $wrap,
      getValue:   function () { return _selected; },
      isLoading:  function () { return _loading; },
      setItems:   function (items) { _items = items; if (_isOpen) _renderList(); },
      setLoading: function (val) { _loading = val; _updateTrigger(); if (_isOpen) _renderList(); },
    };
  }

  function unbind() {
    jQuery(document).off(".tl-edit");
  }

  return { bind: bind, unbind: unbind, showEditModal: showEditModal };
})();
