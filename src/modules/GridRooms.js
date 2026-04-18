/**
 * GridRooms.js
 * Room (layer) creation logic — the "Add Layout" modal and layer factory.
 * Extracted from GridLayers so that GridLayers stays focused on
 * rendering and switching, while GridRooms owns the create-room flow.
 *
 * Public API
 *   GridRooms.openAddModal($panel)          — show the create-room modal
 *   GridRooms.createLayer(details, $panel)  — commit a new layer/room
 */
var GridRooms = (function () {
  // ── Public: open "New Layout" modal ───────────────

  function openAddModal($panel) {
    var cfg = GridCore.getConfig();
    var pickerCfg = cfg.iconPicker || {};
    var icons = pickerCfg.icons || [];
    var maxText = pickerCfg.maxTextLength || 4;
    var allowText = pickerCfg.allowText !== false;
    var _selectedIcon = "";

    var $overlay = jQuery("<div>").addClass("tl-overlay");
    var $modal = jQuery("<div>").addClass("tl-modal");

    $modal.append(
      jQuery("<h2>").html('<i class="fa-solid fa-layer-group"></i> New Layout'),
    );

    // ── Name field ────────────────────────────────
    var $nameField = jQuery("<div>").addClass("tl-field");
    $nameField.append(jQuery("<label>").text("Name"));
    var $nameInput = jQuery("<input>").attr({
      type: "text",
      placeholder: "Layout name",
      maxlength: 30,
    });
    $nameField.append($nameInput);

    // ── Icon field ────────────────────────────────
    var $iconField = jQuery("<div>").addClass("tl-field");
    $iconField.append(jQuery("<label>").text("Icon"));

    var $iconPreview = jQuery("<div>").addClass("tl-modal-icon-preview");
    $iconPreview.text("?");
    $iconField.append($iconPreview);

    function _updatePreview(val) {
      $iconPreview.empty();
      if (!val) {
        $iconPreview.text("?");
        return;
      }
      if (val.indexOf("fa-") !== -1) {
        $iconPreview.append(jQuery("<i>").addClass(val));
      } else if (/\.(svg|png|jpe?g|gif|webp)/i.test(val)) {
        $iconPreview.append(
          jQuery("<img>")
            .attr("src", val)
            .css({ width: "22px", height: "22px", "object-fit": "contain" }),
        );
      } else {
        $iconPreview.text(val);
      }
    }

    // Icon grid
    var $textInput = null;
    if (icons.length) {
      var $grid = jQuery("<div>").addClass("tl-modal-icon-grid");
      jQuery.each(icons, function (_, ico) {
        var $btn = jQuery("<button>")
          .addClass("tl-icon-picker-btn")
          .attr({ title: ico.label || "", type: "button" })
          .on("click", function () {
            _selectedIcon = ico.value;
            $grid
              .find(".tl-icon-picker-btn")
              .removeClass("tl-icon-picker-btn--active");
            jQuery(this).addClass("tl-icon-picker-btn--active");
            if ($textInput) $textInput.val("");
            _updatePreview(_selectedIcon);
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
        $grid.append($btn);
      });
      $iconField.append($grid);
    }

    // Text input fallback
    if (allowText) {
      var $textRow = jQuery("<div>")
        .addClass("tl-icon-picker-text-row")
        .css("margin-top", "8px");
      $textInput = jQuery("<input>")
        .addClass("tl-icon-picker-text-input")
        .attr({
          type: "text",
          maxlength: maxText,
          placeholder: "Or type: A, 1F\u2026",
        })
        .on("input", function () {
          var v = jQuery.trim(jQuery(this).val());
          if (v) {
            _selectedIcon = v;
            $iconField
              .find(".tl-icon-picker-btn")
              .removeClass("tl-icon-picker-btn--active");
            _updatePreview(v);
          }
        });
      $textRow.append($textInput);
      $iconField.append($textRow);
    }

    // ── Actions ───────────────────────────────────
    var $actions = jQuery("<div>").addClass("tl-modal-actions");

    var $cancel = jQuery("<button>")
      .addClass("tl-btn tl-btn-cancel")
      .text("Cancel")
      .on("click", function () {
        $overlay.remove();
      });

    var $create = jQuery("<button>")
      .addClass("tl-btn tl-btn-primary")
      .text("Add Layout")
      .on("click", function () {
        var labelVal = jQuery.trim($nameInput.val());
        if (!labelVal) {
          $nameInput.addClass("tl-input-error").trigger("focus");
          return;
        }
        $nameInput.removeClass("tl-input-error");
        var iconVal = _selectedIcon || labelVal.charAt(0).toUpperCase();
        $overlay.remove();
        createLayer({ label: labelVal, icon: iconVal }, $panel);
      });

    $nameInput.on("input", function () {
      jQuery(this).removeClass("tl-input-error");
    });
    $nameInput.on("keydown", function (e) {
      if (e.key === "Enter") $create.trigger("click");
    });

    $actions.append($cancel, $create);
    $modal.append($nameField, $iconField, $actions);
    $overlay.append($modal);
    jQuery(".tl-root").first().append($overlay);

    $overlay.on("click", function (e) {
      if (jQuery(e.target).is($overlay)) $overlay.remove();
    });

    setTimeout(function () {
      $nameInput.trigger("focus");
    }, 50);
  }

  // ── Public: commit a new room/layer ──────────────

  function createLayer(details, $panel) {
    var label = details.label || "Layout";
    var layer = {
      id: "layer-" + Date.now(),
      label: label,
      icon: details.icon || label.charAt(0).toUpperCase(),
      tables: [],
    };

    GridCore.addLayer(layer);
    GridCore.switchLayer(layer.id);

    // Rebuild the grid canvas for the fresh layer
    jQuery(".tl-zoom-area").empty().append(GridRender.buildGrid());

    // Ask the layer panel to refresh itself if a reference was provided
    if ($panel && typeof $panel.triggerHandler === "function") {
      $panel.triggerHandler("tl:rooms:created", [layer]);
    }

    var cfg = GridCore.getConfig();
    if (typeof cfg.onLayerChange === "function") {
      cfg.onLayerChange(layer, []);
    }

    return layer;
  }

  // ── Public API ────────────────────────────────────

  return {
    openAddModal: openAddModal,
    createLayer: createLayer,
  };
})();
