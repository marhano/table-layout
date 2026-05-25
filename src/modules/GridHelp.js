/**
 * GridHelp.js
 * Help modal — two guides: View Mode and Edit Mode.
 */
var GridHelp = (function () {

  function show() {
    var cfg  = GridCore.getConfig();
    var cid  = _TL.cid();
    var mode = GridCore.isEditing() ? 'edit' : 'view';
    _render(mode, cfg, cid);
  }

  function _render(mode, cfg, cid) {
    jQuery("#" + cid).find(".tl-help-overlay").remove();

    var $overlay = jQuery("<div>").addClass("tl-overlay tl-help-overlay");
    var $modal   = jQuery("<div>").addClass("tl-modal tl-help-modal");

    // ── Header ──
    var $header = jQuery("<div>").addClass("tl-help-header");

    var titleText = mode === 'edit' ? "Edit Mode Guide" : "View Mode Guide";
    var titleIcon = mode === 'edit' ? "fa-solid fa-pen-to-square" : "fa-solid fa-eye";

    var $headerTop = jQuery("<div>").addClass("tl-help-header-top").append(
      jQuery("<div>").addClass("tl-help-title-row").append(
        jQuery("<i>").addClass(titleIcon).css({ fontSize: "1.4rem", color: "var(--tl-primary)" }),
        jQuery("<h2>").text(titleText)
      ),
      jQuery("<button>").addClass("tl-help-close-btn").attr("title", "Close")
        .html('<i class="fa-solid fa-xmark"></i>')
        .on("click", function () { $overlay.remove(); })
    );
    $header.append($headerTop);

    // Mode tabs — only when edit mode is available on this instance
    if (cfg.mode === 'edit') {
      var $tabs = jQuery("<div>").addClass("tl-help-mode-tabs");
      jQuery.each([
        { key: 'view', label: 'View Mode', icon: 'fa-solid fa-eye' },
        { key: 'edit', label: 'Edit Mode', icon: 'fa-solid fa-pen-to-square' }
      ], function (_, tab) {
        jQuery("<button>")
          .addClass("tl-help-mode-tab" + (mode === tab.key ? " tl-help-mode-tab--active" : ""))
          .html('<i class="' + tab.icon + '"></i> ' + tab.label)
          .on("click", function () { _render(tab.key, cfg, cid); })
          .appendTo($tabs);
      });
      $header.append($tabs);
    }

    $modal.append($header);

    // ── Body ──
    var $body    = jQuery("<div>").addClass("tl-help-body");
    var sections = mode === 'edit' ? _buildEditSections(cfg) : _buildViewSections(cfg);

    sections.forEach(function (sec, idx) {
      var $sec      = jQuery("<div>").addClass("tl-help-section");
      var $titleRow = jQuery("<div>").addClass("tl-help-section-title");

      if (sec.icon) {
        $titleRow.append(jQuery("<i>").addClass(sec.icon).css({ marginRight: "8px", color: "var(--tl-primary)" }));
      }
      $titleRow.append(
        jQuery("<span>").addClass("tl-help-section-num").text(idx + 1),
        jQuery("<span>").text(sec.title)
      );
      $sec.append($titleRow);

      if (sec.description) {
        $sec.append(jQuery("<p>").addClass("tl-help-section-desc").html(sec.description));
      }

      if (sec.steps && sec.steps.length) {
        var $list = jQuery("<ul>").addClass("tl-help-steps");
        sec.steps.forEach(function (step) { $list.append(jQuery("<li>").html(step)); });
        $sec.append($list);
      }

      if (sec.gifSrc) {
        $sec.append(
          jQuery("<div>").addClass("tl-help-gif-box").append(
            jQuery("<img>").addClass("tl-help-gif-img").attr({ src: sec.gifSrc, alt: sec.title + " demo" })
          )
        );
      } else if (sec.gifHint) {
        $sec.append(
          jQuery("<div>").addClass("tl-help-gif-placeholder").append(
            jQuery("<div>").addClass("tl-help-gif-icon").html('<i class="fa-solid fa-film"></i>'),
            jQuery("<div>").addClass("tl-help-gif-text").html('<strong>GIF:</strong> ' + sec.gifHint)
          )
        );
      }

      $body.append($sec);
    });

    $modal.append($body);

    // ── Footer ──
    var $footer = jQuery("<div>").addClass("tl-help-footer");
    $footer.append(
      jQuery("<button>").addClass("tl-btn tl-btn-primary").text("Got it!")
        .on("click", function () { $overlay.remove(); })
    );
    $modal.append($footer);

    $overlay.append($modal);
    jQuery("#" + cid).append($overlay);

    $overlay.on("click", function (e) {
      if (jQuery(e.target).is($overlay)) $overlay.remove();
    });
  }

  // ── View Mode sections ────────────────────────────

  function _buildViewSections(cfg) {
    var hasFullscreen = cfg.zoom && cfg.zoom.fullscreen;
    var isGenshin     = cfg.roomStyle === 'genshin';

    var sections = [
      {
        title: "Interface Overview",
        icon: "fa-solid fa-eye",
        description:
          "View Mode shows your restaurant floor plan in a read-only state. " +
          "Use it to monitor live table statuses and navigate across floors and rooms.",
        steps: [
          "The <strong>toolbar</strong> at the top shows floor tabs and the active room name.",
          "The <strong>canvas</strong> displays all tables in the current room with their live statuses.",
          "The <strong>zoom controls</strong> at the bottom let you zoom in, out, and reset the view.",
          cfg.mode === 'edit'
            ? "Click the <strong>Settings gear</strong> <i class='fa-solid fa-gear'></i> in the toolbar to access <strong>Edit Layout</strong>."
            : "This layout is view-only — contact your administrator to make layout changes.",
        ],
        gifSrc: "",
        gifHint:
          "Start on the floor plan in view mode. Pan across the canvas showing multiple tables with different status colors. Point out the toolbar at the top, the floor tabs, the room name, and the zoom controls at the bottom.",
      },

      {
        title: "Table Status Colors",
        icon: "fa-solid fa-palette",
        description:
          "Each table is color-coded by its current status, giving you an instant floor overview.",
        steps: [
          "<span style='color:#3b82f6'><i class='fa-solid fa-circle'></i></span> <strong>Ordering</strong> — Blue. The table is actively ordering.",
          "<span style='color:#e94560'><i class='fa-solid fa-circle'></i></span> <strong>For Payment</strong> — Red. Waiting for the bill.",
          "<span style='color:#16a34a'><i class='fa-solid fa-circle'></i></span> <strong>Paid</strong> — Green. Payment completed.",
          "<span style='color:#6b7280'><i class='fa-solid fa-circle'></i></span> <strong>Unoccupied</strong> — Gray. Table is available.",
        ],
        gifSrc: "",
        gifHint:
          "Show a floor with tables in all four statuses side by side — one blue (Ordering), one red (For Payment), one green (Paid), one gray (Unoccupied). Briefly highlight each table and its label.",
      },

      {
        title: "Switching Floors",
        icon: "fa-solid fa-layer-group",
        description:
          "Navigate between floors using the tabs in the toolbar. Each floor has its own rooms and tables.",
        steps: [
          "Floor tabs appear at the <strong>top-left of the toolbar</strong>.",
          "Click a tab to switch — the canvas updates to show that floor's layout.",
          "Each floor maintains its own independent set of rooms and tables.",
        ],
        gifSrc: "",
        gifHint:
          "Click between at least two floor tabs. Show the canvas visibly changing layout between floors. Briefly pause on each floor so the viewer can see the difference.",
      },

      {
        title: "Switching Rooms",
        icon: "fa-solid fa-door-open",
        description:
          "Each floor can have multiple rooms for different dining areas — switch between them freely.",
        steps: [
          isGenshin
            ? "Click the <strong>door icon</strong> <i class='fa-solid fa-door-open'></i> on the left of the canvas to open the <strong>room panel</strong>."
            : "Room tabs appear in the toolbar below the floor tabs — click any room tab to switch to it.",
          "The active room name is shown in the toolbar.",
          cfg.roomPreview !== false
            ? "Hover over a room to see a <strong>miniature preview</strong> of its table layout."
            : null,
        ].filter(Boolean),
        gifSrc: "",
        gifHint:
          isGenshin
            ? "Open the room panel by clicking the door icon. Hover over a room to show the preview thumbnail. Click a room to switch — show the canvas updating."
            : "Click between at least two room tabs in the toolbar. Show the canvas updating to each room's layout. Hover over a room tab to show the preview thumbnail.",
      },

      {
        title: "Zoom Controls",
        icon: "fa-solid fa-magnifying-glass-plus",
        description:
          "Adjust the zoom level to see the full floor plan or focus on a specific area.",
        steps: [
          "Use the <strong>zoom slider</strong> at the bottom of the canvas to adjust zoom.",
          "Hold <strong>Ctrl</strong> and scroll the <strong>mouse wheel</strong> to zoom in/out.",
          "On touch devices, use <strong>pinch-to-zoom</strong> with two fingers.",
          "Click the <strong>reset button</strong> <i class='fa-solid fa-arrows-rotate'></i> to return to the default zoom level.",
          hasFullscreen
            ? "Click the <strong>fullscreen button</strong> <i class='fa-solid fa-expand'></i> to maximize the canvas. Press <strong>Esc</strong> to exit."
            : null,
        ].filter(Boolean),
        gifHint:
          "Drag the zoom slider left to zoom out (show full floor), then right to zoom in (show table detail). Then use Ctrl + mouse wheel to zoom. Finally click the reset button to snap back to default zoom.",
      },
    ];

    if (cfg.mode === 'edit') {
      sections.push({
        title: "Entering Edit Mode",
        icon: "fa-solid fa-pen-to-square",
        description:
          "Switch to Edit Mode to modify the floor plan — add, move, resize, or remove tables.",
        steps: [
          "Click the <strong>Settings gear</strong> <i class='fa-solid fa-gear'></i> in the top-right of the toolbar.",
          "Select <strong>\"Edit Layout\"</strong> from the dropdown.",
          "The toolbar will show <strong>Save</strong> and <strong>Discard</strong> buttons once in edit mode.",
          "Click the <strong>Edit Mode tab</strong> above to read the full editing guide.",
        ],
        gifSrc: "",
        gifHint:
          "Click the settings gear in the toolbar, hover over 'Edit Layout', then click it. Show the toolbar updating — Save and Discard buttons appear, and the shape panel slides in on the right.",
      });
    }

    return sections;
  }

  // ── Edit Mode sections ────────────────────────────

  function _buildEditSections(cfg) {
    var isGenshin = cfg.roomStyle === 'genshin';
    var showIcons = cfg.showIcons !== false;

    return [
      {
        title: "Edit Mode Overview",
        icon: "fa-solid fa-pen-to-square",
        description:
          "In Edit Mode you can add, move, resize, and delete tables. " +
          "All changes are staged until you explicitly save or discard them.",
        steps: [
          "Enter edit mode via the <strong>Settings gear</strong> <i class='fa-solid fa-gear'></i> → <strong>\"Edit Layout\"</strong>.",
          "The toolbar shows <strong>Save</strong> <i class='fa-solid fa-check'></i> and <strong>Discard</strong> <i class='fa-solid fa-xmark'></i> buttons.",
          "Click <strong>Save</strong> to commit all changes to the layout.",
          "Click <strong>Discard</strong> to revert everything back to the last saved state.",
          "The <strong>shape panel</strong> appears on the right side of the canvas for placing new tables.",
          "<strong>Always save</strong> before switching floors or rooms to avoid losing unsaved changes.",
        ],
        gifSrc: "",
        gifHint:
          "Click the settings gear → 'Edit Layout'. Show the Save/Discard buttons appearing in the toolbar and the shape panel sliding in on the right. Move a table, then click Discard to show it reverting. Repeat but this time click Save.",
      },

      {
        title: "Placing New Tables",
        icon: "fa-solid fa-plus",
        description:
          "Add tables to your floor plan by selecting a shape and dragging on the grid.",
        steps: [
          "In the <strong>shape panel</strong> on the right, click a shape: <strong>Square</strong> or <strong>Circle</strong>.",
          "Click and <strong>drag on the grid</strong> to place the table — the drag area determines its size.",
          "A ghost preview shows where the table will land. <span style='color:var(--tl-danger)'>Red</span> means the area is occupied or invalid.",
          "A modal appears after placing — select the table you want to assign from the <strong>dropdown</strong>.",
          "Click <strong>Save</strong> to place the table, or <strong>Cancel</strong> to discard.",
        ],
        gifSrc: "",
        gifHint:
          "Click the Square shape in the panel. Drag on an empty grid area — show the green ghost preview during drag. Release to open the assign modal. Select a table from the dropdown and click Save. Show the table appearing on the grid.",
      },

      {
        title: "Moving Tables",
        icon: "fa-solid fa-arrows-up-down-left-right",
        description: "Drag any placed table to reposition it anywhere on the grid.",
        steps: [
          "Click and <strong>drag a table card</strong> to move it.",
          "A ghost preview follows your cursor showing the target position.",
          "If the target area is occupied, the ghost turns <span style='color:var(--tl-danger)'>red</span> — release to cancel the move.",
          "On touch devices, <strong>long-press</strong> (hold ~300ms) a table to start dragging.",
        ],
        gifSrc: "",
        gifHint:
          "Drag a table from one grid position to another — show the ghost preview following the cursor. Show a successful drop (green ghost). Then drag toward an occupied cell to show the red ghost, and release to cancel.",
      },

      {
        title: "Resizing Tables",
        icon: "fa-solid fa-up-right-and-down-left-from-center",
        description: "Resize tables by dragging the handles on their edges.",
        steps: [
          "Hover over a placed table to reveal <strong>resize handles</strong> on the right edge, bottom edge, and bottom-right corner.",
          "<strong>Right handle</strong> — changes width only.",
          "<strong>Bottom handle</strong> — changes height only.",
          "<strong>Corner handle</strong> — changes width and height together.",
          "A <strong>size badge</strong> appears while resizing showing the current dimensions (e.g., 3&times;2).",
          "Shape constraints are enforced — Circles always maintain a square aspect ratio.",
          "A resize is blocked if it would overlap another table.",
        ],
        gifSrc: "",
        gifHint:
          "Hover over a table to show the resize handles appearing. Drag the corner handle to make the table larger — show the size badge updating live (e.g., 2×2 → 4×4). Then drag the right handle to change width only. Show a blocked resize (another table in the way).",
      },

      {
        title: "Editing a Table",
        icon: "fa-solid fa-pen",
        description:
          "Change a placed table's shape or reassign it to a different table.",
        steps: [
          "Click the <strong>pencil icon</strong> <i class='fa-solid fa-pen'></i> on any placed table to open the edit modal.",
          "Use the <strong>Shape</strong> selector to switch between Square and Circle.",
          "Use the <strong>Table</strong> searchable dropdown to reassign it to a different table from your list.",
          "A live preview updates as you make changes.",
          "Click <strong>Save</strong> to apply, or <strong>Cancel</strong> to close without changes.",
        ],
        gifSrc: "",
        gifHint:
          "Click the pencil icon on a table. Change the shape from Square to Circle — show the live preview updating. Then type in the table dropdown to filter and select a different table. Click Save and show the table updating on the grid.",
      },

      {
        title: "Multi-Select Tool",
        icon: "fa-solid fa-object-group",
        description:
          "Select and manage multiple tables at once using the marquee selection tool.",
        steps: [
          "Click the <strong>Multi-Select tool</strong> <i class='fa-solid fa-object-group'></i> at the top of the shape panel.",
          "Click and <strong>drag a rectangle</strong> across the grid — all tables inside the rectangle will be selected.",
          "Selected tables are highlighted with a colored border.",
          "Drag any <strong>selected table</strong> to move the entire group together.",
          "Click <strong>empty grid space</strong> to deselect all.",
          "Drag the selected group to the <strong>trash zone</strong> to bulk-delete all selected tables.",
        ],
        gifSrc: "",
        gifHint:
          "Click the multi-select tool icon in the shape panel. Drag a marquee rectangle over 3–4 tables — show them highlighting as they get selected. Drag the group to a new position. Then drag the group toward the trash zone to show bulk delete.",
      },

      {
        title: "Deleting Tables",
        icon: "fa-solid fa-trash-can",
        description: "Remove tables by dragging them into the trash zone.",
        steps: [
          "Start dragging a table — the <strong>trash zone</strong> appears at the bottom-left of the canvas.",
          "Drag the table over the trash zone until it <strong>highlights red</strong>.",
          "Release to permanently delete the table from the layout.",
          "Works for both <strong>single tables</strong> and <strong>multi-selected groups</strong>.",
        ],
        gifSrc: "",
        gifHint:
          "Start dragging a table — show the trash zone appearing at the bottom-left. Drag the table over it (show the red highlight on the trash zone). Release and show the table disappearing. Repeat with a multi-selected group.",
      },

      {
        title: "Table Shapes",
        icon: "fa-solid fa-shapes",
        description:
          "Two shapes are available when placing tables.",
        steps: [
          "<i class='fa-regular fa-square'></i> <strong>Square</strong> — Standard rectangle. Minimum 1&times;1. Most flexible sizing.",
          "<i class='fa-regular fa-circle'></i> <strong>Circle</strong> — Round table. Minimum 2&times;2. Always maintains a square aspect ratio.",
        ],
        gifHint:
          "Place a Square and a Circle side by side on the grid in comparable sizes. Zoom in slightly so both shapes are clearly visible. Hover over each to highlight it.",
      },

      {
        title: "Managing Floors",
        icon: "fa-solid fa-layer-group",
        description:
          "Organize your restaurant across multiple floors. Each floor is an independent layer with its own rooms and tables.",
        steps: [
          "Click the <strong>+</strong> button next to the floor tabs to add a new floor.",
          "<strong>Drag</strong> floor tabs left or right to reorder them.",
          "Click the <strong>&times;</strong> on a tab to delete that floor (requires at least 2 floors).",
        ],
        gifSrc: "",
        gifHint:
          "Click + to add a new floor. Drag it left or right to reorder. Then click × to delete it.",
      },

      {
        title: "Managing Rooms",
        icon: "fa-solid fa-door-open",
        description:
          "Each floor supports multiple rooms for different dining areas. Room editing is only available outside of edit layout mode.",
        steps: [
          isGenshin
            ? "Open the <strong>room panel</strong> via the door icon on the canvas left, then click <strong>+</strong> to add a room."
            : "Click the <strong>+</strong> tab in the room tab bar to add a new room.",
          "To rename a room, <strong>exit edit layout mode first</strong> (Save or Discard), then click the <strong>Settings gear</strong> <i class='fa-solid fa-gear'></i> — an <strong>Edit Room</strong> option will appear and open a rename modal.",
          showIcons ? "The Edit Room modal also lets you change the room's icon." : null,
          "Drag rooms in the panel/tab bar to reorder them.",
          "Click the <strong>&times;</strong> on a room to delete it (requires at least 2 rooms).",
        ].filter(Boolean),
        gifHint:
          isGenshin
            ? "Open the room panel. Click + to add a room. Exit edit mode, then click the settings gear and select 'Edit Room' — show the rename modal. Drag a room in the panel to reorder. Click × to delete a room."
            : "Click the + room tab to add a new room. Exit edit mode, click the settings gear and select 'Edit Room' — show the rename modal. Drag a room tab to reorder. Click × on a room tab to delete it.",
      },

      {
        title: "Tips & Shortcuts",
        icon: "fa-solid fa-lightbulb",
        description: "Quick tips to speed up your editing workflow.",
        steps: [
          "<strong>Save often</strong> — all unsaved changes are lost when switching floors or rooms.",
          "Use the <strong>multi-select tool</strong> to move or delete groups of tables at once.",
          "Use <strong>zoom out</strong> for a full floor view when placing tables, then zoom in for fine adjustments.",
          "The <strong>Discard</strong> button is a full undo — it reverts the entire layout to the last save.",
          "The <strong>Change Table</strong> dropdown in the edit modal is searchable — type to filter by name.",
          "Click the <strong>Refresh button</strong> <i class='fa-solid fa-rotate-right'></i> to reload the latest table data from your system.",
        ],
        gifHint:
          "Quick montage: (1) zoom out to place several tables efficiently, (2) use multi-select to drag a group, (3) type in the edit modal search to find a table by name, (4) click Refresh to reload data. Keep each clip 2–3 seconds.",
      },
    ];
  }

  return { show: show };
})();
