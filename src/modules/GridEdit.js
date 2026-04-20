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
    var cfg = GridCore.getConfig();
    var currentShape = table.shape || "square";
    var statusColor = cfg.statusColors[table.status] || "#6b7280";
    var styles = GridCore.getShapeStyles(currentShape);

    // ── Table source (same pattern as GridPlace._showModal) ──
    var defaultTables = [];
    var tablesLoading = false;
    var $tablesWrap = jQuery('<div>').css({ position: 'relative', display: 'block', width: '100%' });
    var $search = jQuery('<input type="text" placeholder="Search tables...">').css({ width: '100%', marginBottom: '4px', boxSizing: 'border-box' });
    var $select = jQuery('<select>').css({ width: '100%' });
    var $spinner = jQuery('<span class="tl-spinner"></span>').css({
      display: 'none', position: 'absolute', right: '10px', top: '8px',
      width: '18px', height: '18px', 'z-index': 2
    });
    $tablesWrap.append($search, $select, $spinner);

    function updateTableOptions(tables) {
      $select.empty();
      var filter = $search.val() ? $search.val().toLowerCase() : '';
      // Add current table as first option
      $select.append(
        jQuery('<option>').val('__current__')
          .text(table.name + " (" + table.seats + " seats) — current")
      );
      tables.filter(function (t) {
        return !filter || t.TableName.toLowerCase().includes(filter);
      }).forEach(function (t, i) {
        // Skip tables already in any room (except current table)
        if (t.TableId === table.id) return;
        var allLayers = GridCore.getAllLayersLayout();
        if (allLayers.some(function (layer) {
          return layer.rooms.some(function (room) {
            return room.tables.some(function (tbl) { return tbl.id === t.TableId; });
          });
        })) return;
        $select.append(
          jQuery('<option>').val(i).text(t.TableName + " (" + t.Capacity + " seats)")
        );
      });
      if (tablesLoading) { $spinner.show(); } else { $spinner.hide(); }
    }

    $search.on('input', function () { updateTableOptions(defaultTables); });

    if (typeof cfg.newTable.tables === 'function') {
      tablesLoading = true;
      updateTableOptions([]);
      $spinner.show();
      Promise.resolve(cfg.newTable.tables()).then(function (result) {
        tablesLoading = false;
        defaultTables = result || [];
        updateTableOptions(defaultTables);
      });
    } else if (Array.isArray(cfg.newTable.tables)) {
      defaultTables = cfg.newTable.tables;
      updateTableOptions(defaultTables);
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
          // Update preview
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
      jQuery('<h2>').append(
        jQuery('<span>').addClass('tl-modal-preview').css({
          background: statusColor,
          'clip-path': styles.clipPath,
          'border-radius': styles.borderRadius
        }),
        jQuery('<span>').text('Edit Table')
      )
    );

    // Shape field
    $modal.append(_field('Shape', $shapeWrap));

    // Table select field
    $modal.append(_field('Change table', $tablesWrap));

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
        $err.hide();
        var selectedVal = $select.val();
        var props = { shape: currentShape };

        if (selectedVal !== '__current__') {
          var selTable = defaultTables[parseInt(selectedVal, 10)];
          if (selTable) {
            props.id = selTable.TableId;
            props.name = selTable.TableName;
            props.seats = parseInt(selTable.Capacity, 10) || table.seats;
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
    jQuery('#' + _TL.cid()).append($overlay);

    $overlay.on('click', function (e) {
      if (jQuery(e.target).is($overlay)) $overlay.remove();
    });
  }

  function _field(label, $input) {
    return jQuery('<div>').addClass('tl-field')
      .append(jQuery('<label>').text(label), $input);
  }

  function unbind() {
    jQuery(document).off(".tl-edit");
  }

  return { bind: bind, unbind: unbind, showEditModal: showEditModal };
})();
