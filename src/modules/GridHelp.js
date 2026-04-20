/**
 * GridHelp.js
 * Help modal with a complete tutorial on all table-layout features.
 */
var GridHelp = (function () {

  function show() {
    // Remove any existing help modal
    jQuery("#" + _TL.cid()).find(".tl-help-overlay").remove();

    var $overlay = jQuery("<div>").addClass("tl-overlay tl-help-overlay");
    var $modal = jQuery("<div>").addClass("tl-modal tl-help-modal");

    // ── Header ──
    var $header = jQuery("<div>").addClass("tl-help-header");
    $header.append(
      jQuery("<div>").addClass("tl-help-title-row").append(
        jQuery("<i>").addClass("fa-solid fa-circle-question").css({ fontSize: "1.4rem", color: "var(--tl-primary)" }),
        jQuery("<h2>").text("How to Use Table Layout")
      ),
      jQuery("<button>").addClass("tl-help-close-btn").attr("title", "Close")
        .html('<i class="fa-solid fa-xmark"></i>')
        .on("click", function () { $overlay.remove(); })
    );
    $modal.append($header);

    // ── Scrollable content ──
    var $body = jQuery("<div>").addClass("tl-help-body");

    var sections = _buildSections();
    sections.forEach(function (sec, idx) {
      var $sec = jQuery("<div>").addClass("tl-help-section");

      // Section number + title
      var $titleRow = jQuery("<div>").addClass("tl-help-section-title");
      $titleRow.append(
        jQuery("<span>").addClass("tl-help-section-num").text(idx + 1),
        jQuery("<span>").text(sec.title)
      );
      if (sec.icon) {
        $titleRow.prepend(jQuery("<i>").addClass(sec.icon).css({ marginRight: "8px", color: "var(--tl-primary)" }));
      }
      $sec.append($titleRow);

      // Description text
      if (sec.description) {
        $sec.append(jQuery("<p>").addClass("tl-help-section-desc").html(sec.description));
      }

      // Steps / tips list
      if (sec.steps && sec.steps.length) {
        var $list = jQuery("<ul>").addClass("tl-help-steps");
        sec.steps.forEach(function (step) {
          $list.append(jQuery("<li>").html(step));
        });
        $sec.append($list);
      }

      // GIF placeholder
      // GIF image or placeholder
      if (sec.gifSrc) {
        var $gifBox = jQuery("<div>").addClass("tl-help-gif-box");
        $gifBox.append(
          jQuery("<img>").addClass("tl-help-gif-img").attr("src", sec.gifSrc).attr("alt", sec.title + " demo")
        );
        $sec.append($gifBox);
      } else if (sec.gifHint) {
        var $gifBox = jQuery("<div>").addClass("tl-help-gif-placeholder");
        $gifBox.append(
          jQuery("<div>").addClass("tl-help-gif-icon").html('<i class="fa-solid fa-film"></i>'),
          jQuery("<div>").addClass("tl-help-gif-text").html(
            '<strong>Demo GIF:</strong> ' + sec.gifHint
          )
        );
        $sec.append($gifBox);
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
    jQuery("#" + _TL.cid()).append($overlay);

    // Close on overlay click
    $overlay.on("click", function (e) {
      if (jQuery(e.target).is($overlay)) $overlay.remove();
    });
  }

  // ── Section data ──────────────────────────────────

  function _buildSections() {
    return [
      // 1 — Overview
      {
        title: "Getting Started",
        icon: "fa-solid fa-rocket",
        description:
          "Table Layout is a visual grid editor for designing restaurant floor plans. " +
          "You can create, position, resize, and manage tables across multiple floors and rooms.",
        steps: [
          "The <strong>toolbar</strong> at the top gives you access to all controls — floors, rooms, edit mode, and settings.",
          "The <strong>grid canvas</strong> is your working area where tables are placed and arranged.",
          "The <strong>shape panel</strong> on the right (visible in edit mode) lets you pick table shapes and tools.",
          "Use the <strong>zoom controls</strong> at the bottom to zoom in, out, reset, or go fullscreen.",
        ],
        gifSrc: "/wwwroot/libs/table-layout/gifs/gettings_started.gif",
        gifHint:
          "Show the full interface overview — toolbar at top, grid canvas in center, shape panel on the right, and zoom controls at the bottom.",
      },

      // 2 — Edit Mode
      {
        title: "Edit Mode",
        icon: "fa-solid fa-pen-to-square",
        description:
          "Table Layout has two modes: <strong>View Mode</strong> (read-only presentation) and <strong>Edit Mode</strong> (full editing). " +
          "You must enter Edit Mode to make changes.",
        steps: [
          "Click the <strong>Settings gear</strong> <i class='fa-solid fa-gear'></i> in the toolbar, then select <strong>\"Edit Layout\"</strong> to enter edit mode.",
          "In edit mode, the <strong>Save</strong> <i class='fa-solid fa-check'></i> and <strong>Discard</strong> <i class='fa-solid fa-xmark'></i> buttons appear in the toolbar.",
          "Click <strong>Save</strong> to keep all your changes, or <strong>Discard</strong> to revert everything back to the last saved state.",
          "The shape panel and all editing tools are only available while in edit mode.",
        ],
        gifSrc: "/wwwroot/libs/table-layout/gifs/edit_mode.gif",
        gifHint:
          "Show clicking the settings gear, selecting 'Edit Layout', making a change, then clicking Save. Also show the Discard flow reverting changes.",
      },

      // 3 — Placing Tables
      {
        title: "Placing New Tables",
        icon: "fa-solid fa-plus",
        description:
          "Add tables to your floor plan by selecting a shape and dragging on the grid.",
        steps: [
          "In edit mode, the <strong>shape panel</strong> appears on the right side of the canvas.",
          "Click a shape tool: <strong>Square</strong>, <strong>Circle</strong>, <strong>Hexagon</strong>, <strong>Diamond</strong>, or <strong>Triangle</strong>.",
          "Click and drag on the grid to place the table — the drag area determines the table size.",
          "A ghost preview shows where the table will be placed. <span style='color:var(--tl-danger)'>Red</span> means the area is occupied.",
          "Each shape has a minimum size (e.g., Circle requires at least 2&times;2 cells).",
          "You can copy properties from existing tables using the dropdown in the create modal.",
        ],
        gifSrc: "/wwwroot/libs/table-layout/gifs/placing_new_tables.gif",
        gifHint:
          "Show selecting the square shape tool, then click-dragging on an empty grid area to place a new table. Show the ghost preview turning green for valid and red for occupied.",
      },

      // 4 — Moving Tables
      {
        title: "Moving Tables",
        icon: "fa-solid fa-arrows-up-down-left-right",
        description: "Drag any table to reposition it on the grid.",
        steps: [
          "Click and drag a table card to move it to a new position.",
          "A <strong>ghost preview</strong> follows your cursor showing where the table will land.",
          "If the target area is occupied or out of bounds, the ghost turns <span style='color:var(--tl-danger)'>red</span> — release to cancel.",
          "On touch devices, <strong>long-press</strong> (hold for 300ms) a table to start dragging.",
        ],
        gifSrc: "/wwwroot/libs/table-layout/gifs/moving_tables.gif",
        gifHint:
          "Show dragging a table from one grid position to another with the ghost preview visible. Show both a successful move and an invalid (red ghost) attempt.",
      },

      // 5 — Resizing Tables
      {
        title: "Resizing Tables",
        icon: "fa-solid fa-up-right-and-down-left-from-center",
        description: "Resize tables by dragging the handles on their edges.",
        steps: [
          "Hover over a placed table to see the <strong>resize handles</strong> on the right edge, bottom edge, and bottom-right corner.",
          "Drag a handle to resize — the <strong>right handle</strong> changes width, <strong>bottom handle</strong> changes height, <strong>corner handle</strong> changes both.",
          "Shape constraints are enforced: for example, circles and diamonds always stay square.",
          "A <strong>size badge</strong> appears while resizing showing the new dimensions (e.g., 3&times;2).",
          "The resize is blocked if it would overlap another table.",
        ],
        gifSrc: "/wwwroot/libs/table-layout/gifs/resizing_tables.gif",
        gifHint:
          "Show hovering over a table to reveal resize handles, then dragging the corner handle to make it bigger. Show the size badge updating in real time.",
      },

      // 6 — Editing Tables
      {
        title: "Editing a Table",
        icon: "fa-solid fa-pen",
        description:
          "Modify a table's shape or swap it with a different table.",
        steps: [
          "Click the <strong>pencil icon</strong> <i class='fa-solid fa-pen'></i> on any placed table to open the edit modal.",
          "Use the <strong>Shape</strong> selector to change the table's shape (Square, Circle, Hexagon, etc.).",
          "Use the <strong>Change Table</strong> dropdown to swap to a different table from your list.",
          "The dropdown is searchable — type to filter tables by name.",
          "A live preview shows the shape and status color before you confirm.",
          "Click <strong>Save</strong> to apply changes or <strong>Cancel</strong> to close without changes.",
        ],
        gifHint:
          "Show clicking the edit pencil on a table, changing the shape from square to circle, using the search dropdown to pick a different table, then saving.",
      },

      // 7 — Multi-Select
      {
        title: "Multi-Select Tool",
        icon: "fa-solid fa-object-group",
        description:
          "Select and manage multiple tables at once using the marquee selection tool.",
        steps: [
          "In edit mode, click the <strong>Multi-Select tool</strong> <i class='fa-solid fa-object-group'></i> at the top of the shape panel.",
          "Click and <strong>drag a rectangle</strong> (marquee) across the grid — all tables inside the rectangle will be selected.",
          "Selected tables are highlighted with a <strong>colored outline</strong>.",
          "Click on <strong>empty grid space</strong> to deselect all tables.",
          "Click and drag any <strong>selected table</strong> to move the entire group together.",
          "Drag the selected group onto the <strong>trash zone</strong> to delete all selected tables at once.",
        ],
        gifHint:
          "Show activating the multi-select tool, dragging a marquee rectangle over several tables to select them, then dragging the group to a new position. Also show dragging to the trash zone to bulk-delete.",
      },

      // 8 — Trash Zone
      {
        title: "Deleting Tables",
        icon: "fa-solid fa-trash-can",
        description: "Remove tables by dragging them to the trash zone.",
        steps: [
          "When you start dragging a table (or a multi-selected group), the <strong>trash zone</strong> appears at the bottom-left of the canvas.",
          "Drag the table over the trash zone — it will <strong>highlight red</strong> when active.",
          "Release the table over the trash zone to permanently delete it.",
          "This works for both <strong>single tables</strong> and <strong>multi-selected groups</strong>.",
        ],
        gifHint:
          "Show dragging a single table to the trash zone (showing the red highlight on hover) and releasing to delete it. Then show doing the same with a multi-selected group.",
      },

      // 9 — Shapes
      {
        title: "Table Shapes",
        icon: "fa-solid fa-shapes",
        description:
          "Five distinct shapes are available for your tables, each with unique visual styling.",
        steps: [
          "<i class='fa-regular fa-square'></i> <strong>Square</strong> — Standard rectangular table. Minimum 1&times;1. Most flexible sizing.",
          "<i class='fa-regular fa-circle'></i> <strong>Circle</strong> — Round table. Minimum 2&times;2. Always keeps a square aspect ratio.",
          "<i class='fa-solid fa-hexagon'></i> <strong>Hexagon</strong> — Six-sided table. Minimum 3&times;2. Great for unique layouts.",
          "<i class='fa-regular fa-gem'></i> <strong>Diamond</strong> — Diamond-shaped table. Minimum 2&times;2. Keeps square aspect ratio.",
          "<i class='fa-solid fa-triangle'></i> <strong>Triangle</strong> — Triangular table. Minimum 2&times;2. Keeps square aspect ratio.",
        ],
        gifHint:
          "Show all five shapes placed on the grid side by side — square, circle, hexagon, diamond, and triangle — in different sizes to demonstrate variety.",
      },

      // 10 — Floors / Layers
      {
        title: "Floors (Layers)",
        icon: "fa-solid fa-layer-group",
        description:
          "Organize your restaurant across multiple floors. Each floor has its own set of rooms and tables.",
        steps: [
          "Floor tabs appear at the <strong>top-left of the toolbar</strong>. Click a tab to switch floors.",
          "Click the <strong>+ button</strong> to add a new floor — enter a name and pick an icon.",
          "<strong>Double-click</strong> a floor tab label to rename it.",
          "<strong>Drag</strong> floor tabs to reorder them.",
          "Click the <strong>&times;</strong> on a tab to delete a floor (only available in edit mode, requires 2+ floors).",
          "Each floor maintains its own independent set of rooms and table layouts.",
        ],
        gifHint:
          "Show clicking between floor tabs to switch views, adding a new floor with the + button, double-clicking to rename a tab, and dragging tabs to reorder.",
      },

      // 11 — Rooms
      {
        title: "Rooms",
        icon: "fa-solid fa-door-open",
        description:
          "Each floor can have multiple rooms. Rooms help you organize different dining areas within a floor.",
        steps: [
          "Click the <strong>door icon</strong> <i class='fa-solid fa-door-open'></i> on the left side of the canvas to open the <strong>room switcher panel</strong>.",
          "Click a room in the list to switch to it (view mode only).",
          "Hover over a room to see a <strong>miniature preview</strong> of its table layout.",
          "Click the <strong>+ button</strong> at the bottom of the panel to add a new room.",
          "<strong>Drag rooms</strong> in the list to reorder them.",
          "In edit mode, click the <strong>room name</strong> in the toolbar to rename it. Click the <strong>room icon</strong> to change it.",
        ],
        gifHint:
          "Show opening the room panel, hovering to preview rooms, switching between rooms, adding a new room, and dragging to reorder.",
      },

      // 12 — Zoom
      {
        title: "Zoom Controls",
        icon: "fa-solid fa-magnifying-glass-plus",
        description:
          "Zoom in and out of the grid canvas for precision editing or a bird's-eye overview.",
        steps: [
          "Use the <strong>zoom slider</strong> at the bottom of the canvas to adjust zoom (40% to 200%).",
          "Hold <strong>Ctrl</strong> and scroll the <strong>mouse wheel</strong> to zoom in/out.",
          "On touch devices, use <strong>pinch-to-zoom</strong> with two fingers.",
          "Click the <strong>reset button</strong> <i class='fa-solid fa-arrows-rotate'></i> to return to 100% zoom.",
          "Click the <strong>fullscreen button</strong> <i class='fa-solid fa-expand'></i> to maximize the canvas. Press <strong>Esc</strong> or click the button again to exit.",
        ],
        gifHint:
          "Show using the zoom slider to zoom in/out, using Ctrl+scroll wheel, clicking the reset button, and toggling fullscreen mode.",
      },

      // 13 — Status Colors
      {
        title: "Table Status Colors",
        icon: "fa-solid fa-palette",
        description:
          "Tables display different colors based on their current status, making it easy to see the state of your floor at a glance.",
        steps: [
          "<span style='color:#3b82f6'><i class='fa-solid fa-circle'></i></span> <strong>Ordering</strong> — Blue. The table is currently ordering.",
          "<span style='color:#e94560'><i class='fa-solid fa-circle'></i></span> <strong>For Payment</strong> — Red. The table is waiting for payment.",
          "<span style='color:#16a34a'><i class='fa-solid fa-circle'></i></span> <strong>Paid</strong> — Green. The table has paid.",
          "<span style='color:#6b7280'><i class='fa-solid fa-circle'></i></span> <strong>Unoccupied</strong> — Gray. The table is available.",
          "Status colors are displayed on table cards, in edit modals, and in room previews.",
        ],
        gifHint:
          "Show a grid with tables in different statuses side by side, highlighting how each color represents a different state.",
      },

      // 14 — Tips
      {
        title: "Tips & Shortcuts",
        icon: "fa-solid fa-lightbulb",
        description: "Quick tips to speed up your workflow.",
        steps: [
          "Always <strong>Save</strong> your changes before switching floors or rooms to avoid losing work.",
          "Use the <strong>multi-select tool</strong> to quickly rearrange groups of tables.",
          "The <strong>room preview</strong> on hover helps you find the right room without switching.",
          "Use <strong>zoom out</strong> for a bird's-eye view of large layouts, then zoom in for fine-tuning.",
          "Shape constraints prevent invalid sizes — if a resize is blocked, the shape may require a minimum dimension.",
          "You can <strong>search tables</strong> by name in the edit modal dropdown for quick swaps.",
        ],
        gifHint:
          "Show a quick workflow: enter edit mode, place a few tables, use multi-select to rearrange, zoom out to verify layout, then save.",
      },
    ];
  }

  return {
    show: show
  };
})();
