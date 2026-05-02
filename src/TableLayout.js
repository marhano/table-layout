/**
 * TableLayout.js
 * ─────────────────────────────────────────────────────────────────
 * Public API — this is the only object the user ever touches.
 * Supports multiple independent instances on the same page.
 *
 * Usage:
 *
 *   var layout1 = TableLayout.create({ containerId: 'div1', ... });
 *   var layout2 = TableLayout.create({ containerId: 'div2', ... });
 *
 *   layout1.zoomIn();
 *   layout2.getLayout();
 *   layout1.destroy();
 */
var TableLayout = (function () {
  function create(userConfig) {
    // ── Guard: jQuery required ─────────────────────
    if (typeof jQuery === "undefined") {
      throw new Error("[TableLayout] jQuery is required but not loaded.");
    }

    // ── Guard: container must exist ────────────────
    var cfg = GridConfig.merge(userConfig);
    var cid = cfg.containerId;
    if (!jQuery("#" + cid).length) {
      throw new Error(
        "[TableLayout] Container #" + cid + " not found in DOM.",
      );
    }

    // ── Set context to this instance ───────────────
    _TL.use(cid);

    // ── Boot core modules ──────────────────────────
    GridEvents.reset();
    GridCore.init(cfg);
    GridZoom.init(cfg.zoom.initial || 1);
    GridFullscreen.init();
    GridLayers.init();
    GridToolbar.init();
    GridDrag.init();
    GridResize.init();
    GridMultiSelect.init();
    GridPlace.init();
    GridRooms.init();

    // ── Build DOM ──────────────────────────────────
    var $container = jQuery("#" + cid)
      .empty()
      .addClass("tl-root");

    // Apply theme CSS variables
    var camelToKebab = function (s) {
      return s.replace(/([A-Z])/g, function (m) { return "-" + m.toLowerCase(); });
    };
    jQuery.each(cfg.theme, function (key, val) {
      $container[0].style.setProperty("--tl-" + camelToKebab(key), val);
    });
    var $wrapper = jQuery("<div>").addClass("tl-wrapper");
    var $canvas = GridRender.buildCanvas();
    var $canvasWrap = jQuery("<div>").addClass("tl-canvas-wrap");
    $canvasWrap.append($canvas);
    $canvasWrap.append(GridZoom.buildControls());
    $canvasWrap.append(GridToolbar.buildShapePanel());
    if (cfg.trashZone) $canvasWrap.append(GridRender.buildTrashZone());
    if (cfg.layers && cfg.layers.length) {
      var $rooms = GridRooms.build();
      if ($rooms) $canvasWrap.append($rooms);
      if (cfg.roomStyle === "simple") {
        $canvasWrap.append(GridRooms.buildTabBar());
      }
    }

    $wrapper.append(GridToolbar.build());
    $wrapper.append($canvasWrap);
    $wrapper.append(GridRender.buildLegend());

    if (cfg.showHint) {
      $wrapper.append(
        jQuery("<p>")
          .addClass("tl-hint")
          .text(
            "Select a shape tool then drag on the grid  •  Ctrl + scroll to zoom",
          ),
      );
    }

    $container.append($wrapper);
    $container.addClass("tl-mode-" + (cfg.mode || "edit"));
    if (cfg.realTime === false) $container.addClass("tl-view-mode");
    if (cfg.showGridLines === false) $container.addClass("tl-no-grid-lines");

    // ── Apply initial zoom ─────────────────────────
    GridZoom.applyZoom(cfg.zoom.initial || 1, true);

    // ── Bind modules ───────────────────────────────
    GridDrag.bind();
    GridResize.bind();
    GridEdit.bind();
    GridMultiSelect.bind();
    GridPlace.bind();
    GridZoom.bindWheelZoom();
    GridFullscreen.bind();

    // ── Wire internal events to user callbacks ─────
    GridEvents.on("zoom:changed", function (level) {
      if (typeof cfg.onZoom === "function") cfg.onZoom(level);
    });
    // Layer events
    GridEvents.on("layer:switched", function (layer) {
      _TL.use(cid);
      if (typeof cfg.onLayerChange === "function")
        cfg.onLayerChange(layer, GridCore.getAllLayersLayout());
    });
    GridEvents.on("layer:updated", function (layer) {
      _TL.use(cid);
      if (typeof cfg.onLayerChange === "function" && !(cfg.realTime === false && GridCore.isEditing()))
        cfg.onLayerChange(layer, GridCore.getAllLayersLayout());
    });
    GridEvents.on("layer:deleted", function (removed) {
      _TL.use(cid);
      if (typeof cfg.onLayerDelete === "function")
        cfg.onLayerDelete(removed);
      if (typeof cfg.onLayerChange === "function")
        cfg.onLayerChange(GridCore.getActiveLayer(), GridCore.getAllLayersLayout());
    });
    GridEvents.on("layer:reordered", function (layers) {
      if (typeof cfg.onLayerReorder === "function")
        cfg.onLayerReorder(layers);
    });
    // Room events
    GridEvents.on("room:switched", function (room) {
      _TL.use(cid);
      if (typeof cfg.onRoomChange === "function")
        cfg.onRoomChange(room, GridCore.getLayout());
    });
    GridEvents.on("room:updated", function (room) {
      _TL.use(cid);
      if (typeof cfg.onRoomChange === "function" && !(cfg.realTime === false && GridCore.isEditing()))
        cfg.onRoomChange(room, GridCore.getLayout());
    });
    GridEvents.on("room:deleted", function (removed) {
      _TL.use(cid);
      if (typeof cfg.onRoomDelete === "function")
        cfg.onRoomDelete(removed);
      if (typeof cfg.onRoomChange === "function")
        cfg.onRoomChange(GridCore.getActiveRoom(), GridCore.getLayout());
    });
    GridEvents.on("room:reordered", function (rooms) {
      if (typeof cfg.onRoomReorder === "function")
        cfg.onRoomReorder(rooms);
    });

    // ── Return instance API ────────────────────────
    return {
      // Zoom
      zoomIn: function () {
        _TL.use(cid);
        GridZoom.applyZoom(GridZoom.getZoom() + (cfg.zoom.step || 0.1));
      },
      zoomOut: function () {
        _TL.use(cid);
        GridZoom.applyZoom(GridZoom.getZoom() - (cfg.zoom.step || 0.1));
      },
      zoomReset: function () {
        _TL.use(cid);
        GridZoom.applyZoom(cfg.zoom.initial || 1);
      },
      zoomTo: function (l) {
        _TL.use(cid);
        GridZoom.applyZoom(l);
      },
      getZoom: function () {
        _TL.use(cid);
        return GridZoom.getZoom();
      },

      // Data
      getLayout: function () {
        _TL.use(cid);
        return GridCore.getLayout();
      },
      getTables: function () {
        _TL.use(cid);
        return GridCore.getTables();
      },
      getConfig: function () {
        _TL.use(cid);
        return GridCore.getConfig();
      },

      // Layers
      getLayers: function () {
        _TL.use(cid);
        return GridCore.getLayers();
      },
      getActiveLayer: function () {
        _TL.use(cid);
        return GridCore.getActiveLayer();
      },
      switchLayer: function (id) {
        _TL.use(cid);
        if (GridCore.switchLayer(id)) {
          _TL.$(".tl-zoom-area").empty().append(GridRender.buildGrid());
        }
      },
      addLayer: function (details) {
        _TL.use(cid);
        var label = (details && details.label) || "Layout";
        var firstRoom = {
          id: "room-" + Date.now(),
          label: (details && details.roomLabel) || "Room 1",
          icon: (details && details.roomIcon) || "fa-solid fa-utensils",
          tables: [],
        };
        var layer = {
          id: "layer-" + Date.now(),
          label: label,
          rooms: (details && details.rooms) || [firstRoom],
        };
        GridCore.addLayer(layer);
        return layer;
      },
      deleteLayer: function (id) {
        _TL.use(cid);
        return GridCore.deleteLayer(id);
      },
      reorderLayers: function (orderedIds) {
        _TL.use(cid);
        return GridCore.reorderLayers(orderedIds);
      },
      getAllLayersLayout: function () {
        _TL.use(cid);
        return GridCore.getAllLayersLayout();
      },

      // Rooms
      getRooms: function () {
        _TL.use(cid);
        return GridCore.getRooms();
      },
      getActiveRoom: function () {
        _TL.use(cid);
        return GridCore.getActiveRoom();
      },
      switchRoom: function (id) {
        _TL.use(cid);
        if (GridCore.switchRoom(id)) {
          _TL.$(".tl-zoom-area").empty().append(GridRender.buildGrid());
        }
      },
      addRoom: function (details) {
        _TL.use(cid);
        var label = (details && details.label) || "Room";
        var room = {
          id: "room-" + Date.now(),
          label: label,
          icon: (details && details.icon) || label.charAt(0).toUpperCase(),
          tables: (details && details.tables) || [],
        };
        GridCore.addRoom(room);
        return room;
      },
      deleteRoom: function (id) {
        _TL.use(cid);
        return GridCore.deleteRoom(id);
      },
      reorderRooms: function (orderedIds) {
        _TL.use(cid);
        return GridCore.reorderRooms(orderedIds);
      },

      // Edit mode
      isEditing: function () {
        _TL.use(cid);
        return GridCore.isEditing();
      },

      // Update config in place without recreating the instance
      update: function (newConfig) {
        _TL.use(cid);

        var needsLayoutRebuild = newConfig.columns !== undefined ||
                                 newConfig.rows    !== undefined ||
                                 newConfig.cellSize !== undefined ||
                                 newConfig.gap     !== undefined ||
                                 newConfig.layers  !== undefined;

        // Merge newConfig into the live cfg object in place
        for (var key in newConfig) {
          if (!newConfig.hasOwnProperty(key)) continue;
          var val = newConfig[key];
          if (
            val !== null &&
            typeof val === "object" &&
            !Array.isArray(val) &&
            typeof cfg[key] === "object" &&
            cfg[key] !== null &&
            !Array.isArray(cfg[key])
          ) {
            jQuery.extend(cfg[key], val);
          } else {
            cfg[key] = val;
          }
        }

        // Re-apply theme CSS custom properties
        if (newConfig.theme !== undefined) {
          jQuery.each(cfg.theme, function (k, v) {
            jQuery("#" + cid)[0].style.setProperty("--tl-" + camelToKebab(k), v);
          });
        }

        // Reinitialize core + rebuild grid for structural changes
        if (needsLayoutRebuild) {
          GridCore.init(cfg);
          _TL.$(".tl-zoom-area").empty().append(GridRender.buildGrid());
          GridLayers.renderTabs();
          GridRooms.renderTabs();
        }

        // Rebuild legend when status colours change
        if (newConfig.statusColors !== undefined) {
          _TL.$(".tl-legend").replaceWith(GridRender.buildLegend());
        }

        // Toggle view-mode class
        if (newConfig.realTime !== undefined) {
          jQuery("#" + cid).toggleClass("tl-view-mode", newConfig.realTime === false);
        }

        // Toggle grid lines
        if (newConfig.showGridLines !== undefined) {
          jQuery("#" + cid).toggleClass("tl-no-grid-lines", newConfig.showGridLines === false);
        }
      },

      // Tools
      setTool: function (key) {
        _TL.use(cid);
        GridToolbar.toggle(key);
      },
      clearTool: function () {
        _TL.use(cid);
        GridToolbar.deactivate();
      },
      getActiveTool: function () {
        _TL.use(cid);
        return GridToolbar.getActive();
      },

      // Lifecycle
      destroy: function () {
        _TL.use(cid);
        GridDrag.unbind();
        GridResize.unbind();
        GridMultiSelect.unbind();
        GridPlace.unbind();
        GridZoom.destroy();
        GridFullscreen.destroy();
        GridLayers.destroy();
        GridToolbar.destroy();
        GridRooms.destroy();
        GridDrag.destroy();
        GridResize.destroy();
        GridMultiSelect.destroy();
        GridPlace.destroy();
        jQuery("#" + cid)
          .empty()
          .removeClass("tl-root tl-view-mode");
        GridEvents.destroy();
        GridCore.destroy();
      },
    };
  }

  // Predefined table positions (deterministic, no layout jitter on re-render)
  var _skeletonPositions = [
    { top: "8%",  left: "5%",  w: 90,  h: 60 },
    { top: "8%",  left: "22%", w: 110, h: 60 },
    { top: "8%",  left: "44%", w: 80,  h: 60 },
    { top: "8%",  left: "60%", w: 130, h: 60 },
    { top: "8%",  left: "82%", w: 80,  h: 60 },
    { top: "36%", left: "5%",  w: 110, h: 80 },
    { top: "36%", left: "28%", w: 80,  h: 80 },
    { top: "36%", left: "50%", w: 110, h: 60 },
    { top: "36%", left: "72%", w: 80,  h: 80 },
    { top: "65%", left: "8%",  w: 130, h: 60 },
    { top: "65%", left: "36%", w: 80,  h: 60 },
    { top: "65%", left: "56%", w: 110, h: 80 },
    { top: "65%", left: "80%", w: 70,  h: 60 },
  ];

  function skeleton(containerId, options) {
    if (typeof jQuery === "undefined") return;
    var $container = jQuery("#" + containerId);
    if (!$container.length) return;

    var opts        = options || {};
    var height      = opts.height      || "400px";
    var tabs        = opts.tabs        || 2;
    var roomTabs    = opts.roomTabs    || 3;
    var tables      = Math.min(opts.tables !== undefined ? opts.tables : 10, _skeletonPositions.length);

    // Toolbar
    var $toolbar = jQuery("<div>").addClass("tl-skeleton-toolbar");
    for (var t = 0; t < tabs; t++) {
      $toolbar.append(
        jQuery("<div>").addClass("tl-skeleton-bone tl-skeleton-tab").css("width", (55 + t * 25) + "px")
      );
    }

    // Canvas with fake table cards
    var $canvas = jQuery("<div>").addClass("tl-skeleton-canvas").css("height", height);
    for (var i = 0; i < tables; i++) {
      var p = _skeletonPositions[i];
      $canvas.append(
        jQuery("<div>").addClass("tl-skeleton-bone tl-skeleton-table").css({
          top: p.top, left: p.left, width: p.w + "px", height: p.h + "px",
        })
      );
    }

    // Room tab bar (simple style)
    var $tabbar = jQuery("<div>").addClass("tl-skeleton-tabbar");
    for (var r = 0; r < roomTabs; r++) {
      $tabbar.append(
        jQuery("<div>").addClass("tl-skeleton-bone tl-skeleton-room-tab").css("width", (60 + r * 20) + "px")
      );
    }

    $container.empty().append(
      jQuery("<div>").addClass("tl-root").append($toolbar, $canvas, $tabbar)
    );
  }

  return { create: create, skeleton: skeleton };
})();
