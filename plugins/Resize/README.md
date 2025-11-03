## Resize Plugin
Enable edge and corner resizing for Sortable items while neighbouring items reflow to accommodate the new size.

---

### Mounting
```js
import { Sortable, Resize } from '@ajdorfman93/sortablejs/modular/sortable.core.esm';

Sortable.mount(new Resize());
```

---

### Basic usage
```js
new Sortable(el, {
	resize: true
});
```

By default any edge within `8px` of the pointer acts as a handle. Other elements shift automatically because the resized item writes its new `width` and `height` inline.

---

### Options

`resize` accepts either a boolean (`true` to enable with defaults) or an object. All properties can also be supplied as top-level Sortable options (e.g. `resizeMinWidth`) if you prefer.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | Enable/disable when passing an object. |
| `handle` | `string` | `null` | CSS selector for a generic resize handle inside each item. If omitted, edges trigger resizing. |
| `handles` | `Record<string,string>` | `null` | Map of direction tokens (`'n'`, `'s'`, `'e'`, `'w'`, `'ne'`, `'nw'`, `'se'`, `'sw'`) to selectors that act as dedicated handles. |
| `edgeThreshold` | `number` | `8` | Pixel distance from an edge that starts a resize when handles are not used. |
| `edges` | `Array<string> \| Record<string,boolean>` | `['top','right','bottom','left']` | Restrict which edges respond to pointer hits. |
| `minWidth` / `minHeight` | `number|null` | `null` | Clamp the resized size. |
| `maxWidth` / `maxHeight` | `number|null` | `null` | Clamp the resized size. |
| `preserveAspectRatio` | `boolean` | `false` | Maintain the element's starting aspect ratio while resizing. |
| `activeClass` | `string` | `'sortable-resizing'` | Class toggled on the item for the duration of a resize gesture. |

Handle elements can optionally describe a direction via `data-resize-direction="se"` (or `data-direction`). When omitted, the pointer location controls the resize axis.

---

### Events

The plugin emits three sortable events while resizing:

* `resizestart`
* `resize`
* `resizeend`

Each event includes the following properties:

| Property | Description |
| --- | --- |
| `resizeWidth` | Current width in pixels. |
| `resizeHeight` | Current height in pixels. |
| `resizeDelta` | `{ x, y }` pointer delta from the start of the gesture. |
| `resizeDirection` | Direction token (`'e'`, `'sw'`, etc.) for the active handle. |

Example:
```js
new Sortable(el, {
	resize: true,
	onResize(evt) {
		console.log(evt.item, evt.resizeWidth, evt.resizeHeight);
	}
});
```
