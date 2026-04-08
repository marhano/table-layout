# table-layout

> Restaurant table layout grid library — drag & drop, zoom, shape tools.  
> Requires jQuery 3+.

## Installation

### npm
```bash
npm install table-layout
```

### CDN (coming soon)
```html
<link rel="stylesheet" href="dist/table-layout.css" />
<script src="dist/table-layout.js"></script>
```

### .NET MVC
```html
<link rel="stylesheet" href="~/Content/table-layout.css" />
<script src="~/Scripts/table-layout.js"></script>
```

## Quick Start

```html
<div id="restaurantGrid"></div>

<script src="jquery.min.js"></script>
<script src="table-layout.js"></script>
<script>
    var floorPlan = TableLayout.create({
        containerId : 'restaurantGrid',
        columns     : 12,
        rows        : 8,
        tables      : [
            {
                id: 'T1', name: 'Table 1', seats: 4,
                status: 'available',
                col: 1, row: 1, colSpan: 2, rowSpan: 2,
                shape: 'circle'
            }
        ],
        onLayoutChange: function (layout) {
            console.log('Layout saved:', layout);
        }
    });
</script>
```

## Configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `containerId` | string | `'tableGrid'` | ID of the target div |
| `columns` | number | `12` | Number of grid columns |
| `rows` | number | `8` | Number of grid rows |
| `cellSize` | number | `70` | Cell size in px |
| `gap` | number | `8` | Gap between cells in px |
| `draggable` | boolean | `true` | Enable drag & drop |
| `tables` | array | `[]` | Initial tables |
| `zoom.enabled` | boolean | `true` | Enable zoom |
| `zoom.min` | number | `0.4` | Minimum zoom level |
| `zoom.max` | number | `2` | Maximum zoom level |

## API

```javascript
var layout = TableLayout.create({ ... });

layout.zoomIn();           // zoom in one step
layout.zoomOut();          // zoom out one step
layout.zoomReset();        // reset to initial zoom
layout.zoomTo(1.5);        // jump to 150%
layout.getZoom();          // returns current zoom level

layout.getLayout();        // returns current table positions
layout.getTables();        // returns live tables array
layout.getConfig();        // returns active config

layout.setTool('circle'); // activate a shape tool
layout.clearTool();        // deactivate current tool
layout.getActiveTool();    // returns active tool key or null

layout.destroy();          // tear down and clean up
```

## Shapes

| Key | Min Size | Square |
|---|---|---|
| `square` | 1×1 | No |
| `circle` | 2×2 | Yes |
| `hexagon` | 3×2 | No |
| `diamond` | 2×2 | Yes |
| `triangle` | 2×2 | Yes |

## Callbacks

```javascript
TableLayout.create({
    onSwap: function (from, to, layout) { },
    onLayoutChange: function (layout) { },
    onTableCreated: function (table) { },
    onZoom: function (level) { },
});
```

## License

MIT