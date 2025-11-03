import {
	on,
	off,
	closest,
	css,
	toggleClass,
	getRect
} from '../../src/utils.js';

import dispatchEvent from '../../src/EventDispatcher.js';

function clamp(value, min, max) {
	if (min != null && value < min) return min;
	if (max != null && value > max) return max;
	return value;
}

function toNumber(value, fallback = 0) {
	let parsed = parseFloat(value);
	return Number.isNaN(parsed) ? fallback : parsed;
}

function pointerCoords(evt) {
	if (!evt) return null;
	if (evt.touches && evt.touches.length) {
		return {
			clientX: evt.touches[0].clientX,
			clientY: evt.touches[0].clientY
		};
	}
	if (evt.changedTouches && evt.changedTouches.length) {
		return {
			clientX: evt.changedTouches[0].clientX,
			clientY: evt.changedTouches[0].clientY
		};
	}
	if (typeof evt.clientX === 'number' && typeof evt.clientY === 'number') {
		return {
			clientX: evt.clientX,
			clientY: evt.clientY
		};
	}
	return null;
}

function normalizeEdges(edges) {
	if (!edges) {
		return {
			top: true,
			right: true,
			bottom: true,
			left: true
		};
	}
	let result = {
		top: false,
		right: false,
		bottom: false,
		left: false
	};
	if (Array.isArray(edges)) {
		edges.forEach(edge => {
			if (edge && result.hasOwnProperty(edge)) {
				result[edge] = true;
			}
		});
	} else if (typeof edges === 'string') {
		edges.split(/[\s,]+/).forEach(edge => {
			if (edge && result.hasOwnProperty(edge)) {
				result[edge] = true;
			}
		});
	} else if (typeof edges === 'object') {
		for (let key in result) {
			if (Object.prototype.hasOwnProperty.call(edges, key)) {
				result[key] = !!edges[key];
			}
		}
	}
	return result;
}

function directionFromToken(token) {
	if (!token) return null;
	token = token.toLowerCase();
	let horizontal = 0;
	let vertical = 0;
	if (token.indexOf('e') !== -1) horizontal = 1;
	else if (token.indexOf('w') !== -1) horizontal = -1;
	if (token.indexOf('s') !== -1) vertical = 1;
	else if (token.indexOf('n') !== -1) vertical = -1;
	return (horizontal || vertical) ? { horizontal, vertical } : null;
}

function directionToToken(direction) {
	let token = '';
	if (direction.vertical === -1) token += 'n';
	if (direction.vertical === 1) token += 's';
	if (direction.horizontal === -1) token += 'w';
	if (direction.horizontal === 1) token += 'e';
	return token || 'auto';
}

function ResizePlugin() {
	function Resize(sortable) {
		this.sortable = sortable;
		for (let fn in this) {
			if (fn.charAt(0) === '_' && typeof this[fn] === 'function') {
				this[fn] = this[fn].bind(this);
			}
		}
		this.defaults = {
			resize: false,
			resizeHandle: null,
			resizeHandles: null,
			resizeEdgeThreshold: 8,
			resizeEdges: ['top', 'right', 'bottom', 'left'],
			resizeMinWidth: null,
			resizeMinHeight: null,
			resizeMaxWidth: null,
			resizeMaxHeight: null,
			resizePreserveAspectRatio: false,
			resizeActiveClass: 'sortable-resizing'
		};
	}

	Resize.prototype = {
		pointerDown({ evt, originalTarget, cancel }) {
			if (this._activeResize) return;
			const config = this._normalizeOptions();
			if (!config.enabled) return;

			const item = closest(originalTarget, this.options.draggable, this.sortable.el, false);
			if (!item) return;

			const pointer = pointerCoords(evt);
			if (!pointer) return;

			const direction = this._resolveDirection(originalTarget, item, pointer, config);
			if (!direction) return;

			cancel();
			evt.preventDefault && evt.preventDefault();
			evt.stopPropagation && evt.stopPropagation();

			this._startResize(evt, item, pointer, direction, config);
		},

		_normalizeOptions() {
			const base = {
				enabled: !!this.options.resize,
				handle: this.options.resizeHandle,
				handles: this.options.resizeHandles,
				edgeThreshold: this.options.resizeEdgeThreshold,
				edges: this.options.resizeEdges,
				minWidth: this.options.resizeMinWidth,
				minHeight: this.options.resizeMinHeight,
				maxWidth: this.options.resizeMaxWidth,
				maxHeight: this.options.resizeMaxHeight,
				preserveAspectRatio: this.options.resizePreserveAspectRatio,
				activeClass: this.options.resizeActiveClass
			};

			let resizeOption = this.options.resize;
			if (typeof resizeOption === 'object' && resizeOption !== null) {
				base.enabled = resizeOption.enabled !== void 0 ? !!resizeOption.enabled : true;
				if (resizeOption.handle !== void 0) base.handle = resizeOption.handle;
				if (resizeOption.handles !== void 0) base.handles = resizeOption.handles;
				if (resizeOption.edgeThreshold !== void 0) base.edgeThreshold = resizeOption.edgeThreshold;
				if (resizeOption.edges !== void 0) base.edges = resizeOption.edges;
				if (resizeOption.minWidth !== void 0) base.minWidth = resizeOption.minWidth;
				if (resizeOption.minHeight !== void 0) base.minHeight = resizeOption.minHeight;
				if (resizeOption.maxWidth !== void 0) base.maxWidth = resizeOption.maxWidth;
				if (resizeOption.maxHeight !== void 0) base.maxHeight = resizeOption.maxHeight;
				if (resizeOption.preserveAspectRatio !== void 0) base.preserveAspectRatio = resizeOption.preserveAspectRatio;
				if (resizeOption.activeClass !== void 0) base.activeClass = resizeOption.activeClass;
			}

			base.edgeThreshold = base.edgeThreshold != null ? Number(base.edgeThreshold) : 8;
			base.edges = normalizeEdges(base.edges);
			base.minWidth = base.minWidth == null ? null : parseFloat(base.minWidth);
			base.minHeight = base.minHeight == null ? null : parseFloat(base.minHeight);
			base.maxWidth = base.maxWidth == null ? null : parseFloat(base.maxWidth);
			base.maxHeight = base.maxHeight == null ? null : parseFloat(base.maxHeight);
			base.minWidth = Number.isNaN(base.minWidth) ? null : base.minWidth;
			base.minHeight = Number.isNaN(base.minHeight) ? null : base.minHeight;
			base.maxWidth = Number.isNaN(base.maxWidth) ? null : base.maxWidth;
			base.maxHeight = Number.isNaN(base.maxHeight) ? null : base.maxHeight;
			base.preserveAspectRatio = !!base.preserveAspectRatio;

			if (base.handles && typeof base.handles !== 'object') {
				base.handles = null;
			}

			return base;
		},

		_resolveDirection(originalTarget, item, pointer, config) {
			let fromHandles = this._directionFromHandles(originalTarget, item, config);
			if (fromHandles) return fromHandles;

			if (config.handle) {
				let handleMatch = closest(originalTarget, config.handle, item, false);
				if (!handleMatch) return null;
				let token = handleMatch.dataset && (handleMatch.dataset.resizeDirection || handleMatch.dataset.direction);
				let dir = directionFromToken(token) || this._directionFromEdges(item, pointer, config);
				if (!dir) return null;
				dir.handle = handleMatch;
				return dir;
			}

			return this._directionFromEdges(item, pointer, config);
		},

		_directionFromHandles(originalTarget, item, config) {
			let handles = config.handles;
			if (!handles) return null;
			for (let token in handles) {
				if (!handles.hasOwnProperty(token)) continue;
				let selector = handles[token];
				let match = closest(originalTarget, selector, item, false);
				if (match) {
					let dir = directionFromToken(token);
					if (!dir) return null;
					dir.handle = match;
					return dir;
				}
			}
			return null;
		},

		_directionFromEdges(item, pointer, config) {
			let rect = getRect(item);
			let threshold = config.edgeThreshold || 8;
			let horizontal = 0;
			let vertical = 0;

			if (config.edges.left && pointer.clientX <= rect.left + threshold) horizontal = -1;
			else if (config.edges.right && pointer.clientX >= rect.right - threshold) horizontal = 1;

			if (config.edges.top && pointer.clientY <= rect.top + threshold) vertical = -1;
			else if (config.edges.bottom && pointer.clientY >= rect.bottom - threshold) vertical = 1;

			if (!horizontal && !vertical) return null;

			return {
				horizontal,
				vertical
			};
		},

		_startResize(evt, item, pointer, direction, config) {
			const rect = getRect(item);
			const computed = css(item);

			const captureEl = direction.handle || item;

			if (evt.pointerId != null && captureEl.setPointerCapture) {
				try {
					captureEl.setPointerCapture(evt.pointerId);
				} catch (_) {}
			}

			const doc = captureEl.ownerDocument || document;

			this._activeResize = {
				el: item,
				handle: direction.handle || null,
				captureEl,
				document: doc,
				direction: {
					horizontal: direction.horizontal || 0,
					vertical: direction.vertical || 0
				},
				config,
				startPointer: { ...pointer },
				startRect: rect,
				currentWidth: rect.width,
				currentHeight: rect.height,
				startMarginLeft: toNumber(computed.marginLeft, 0),
				startMarginTop: toNumber(computed.marginTop, 0),
				pointerId: evt.pointerId != null ? evt.pointerId : null,
				listenerType: this.options.supportPointer ? 'pointer' : (evt.touches ? 'touch' : 'mouse'),
				raf: null,
				pendingEvent: null,
				prevUserSelect: css(document.body, 'user-select') || '',
				aspectRatio: rect.height ? rect.width / rect.height : null,
				token: directionToToken(direction),
				lastDeltaX: 0,
				lastDeltaY: 0
			};

			if (config.activeClass) {
				toggleClass(item, config.activeClass, true);
			}

			css(document.body, 'user-select', 'none');

			this._bindListeners(evt);
			this._emitResize('resizestart', evt, rect.width, rect.height, 0, 0);
		},

		_bindListeners(evt) {
			const active = this._activeResize;
			if (!active) return;
			const doc = active.document;

			if (active.listenerType === 'pointer') {
				on(doc, 'pointermove', this._onPointerMove);
				on(doc, 'pointerup', this._onPointerUp);
				on(doc, 'pointercancel', this._onPointerUp);
			} else if (active.listenerType === 'touch') {
				on(doc, 'touchmove', this._onPointerMove);
				on(doc, 'touchend', this._onPointerUp);
				on(doc, 'touchcancel', this._onPointerUp);
			} else {
				on(doc, 'mousemove', this._onPointerMove);
				on(doc, 'mouseup', this._onPointerUp);
			}
		},

		_unbindListeners() {
			const active = this._activeResize;
			if (!active) return;
			const doc = active.document;
			if (active.listenerType === 'pointer') {
				off(doc, 'pointermove', this._onPointerMove);
				off(doc, 'pointerup', this._onPointerUp);
				off(doc, 'pointercancel', this._onPointerUp);
			} else if (active.listenerType === 'touch') {
				off(doc, 'touchmove', this._onPointerMove);
				off(doc, 'touchend', this._onPointerUp);
				off(doc, 'touchcancel', this._onPointerUp);
			} else {
				off(doc, 'mousemove', this._onPointerMove);
				off(doc, 'mouseup', this._onPointerUp);
			}
		},

		_onPointerMove(evt) {
			const active = this._activeResize;
			if (!active) return;
			active.pendingEvent = evt;
			if (evt.cancelable) {
				evt.preventDefault();
			}
			this._scheduleResize();
		},

		_scheduleResize() {
			const active = this._activeResize;
			if (!active || active.raf) return;
			const scheduler = (typeof window !== 'undefined' && window.requestAnimationFrame) || function(cb) {
				return setTimeout(cb, 16);
			};
			active.raf = scheduler(() => {
				active.raf = null;
				this._commitResize();
			});
		},

		_commitResize() {
			const active = this._activeResize;
			if (!active || !active.pendingEvent) return;

			const evt = active.pendingEvent;
			const pointer = pointerCoords(evt);
			if (!pointer) return;

			active.pendingEvent = null;

			const deltaX = pointer.clientX - active.startPointer.clientX;
			const deltaY = pointer.clientY - active.startPointer.clientY;

			let width = active.startRect.width;
			let height = active.startRect.height;
			let marginLeft = active.startMarginLeft;
			let marginTop = active.startMarginTop;

			const config = active.config;

			if (active.direction.horizontal) {
				const candidate = active.direction.horizontal === 1 ? active.startRect.width + deltaX : active.startRect.width - deltaX;
				width = clamp(candidate, config.minWidth, config.maxWidth);
				if (active.direction.horizontal === -1) {
					marginLeft = active.startMarginLeft + (active.startRect.width - width);
				}
			}

			if (active.direction.vertical) {
				const candidate = active.direction.vertical === 1 ? active.startRect.height + deltaY : active.startRect.height - deltaY;
				height = clamp(candidate, config.minHeight, config.maxHeight);
				if (active.direction.vertical === -1) {
					marginTop = active.startMarginTop + (active.startRect.height - height);
				}
			}

			if (config.preserveAspectRatio && active.aspectRatio) {
				if (active.direction.horizontal && !active.direction.vertical) {
					height = clamp(width / active.aspectRatio, config.minHeight, config.maxHeight);
					if (active.direction.vertical === -1) {
						marginTop = active.startMarginTop + (active.startRect.height - height);
					}
				} else if (!active.direction.horizontal && active.direction.vertical) {
					width = clamp(height * active.aspectRatio, config.minWidth, config.maxWidth);
					if (active.direction.horizontal === -1) {
						marginLeft = active.startMarginLeft + (active.startRect.width - width);
					}
				} else if (active.direction.horizontal && active.direction.vertical) {
					if (Math.abs(deltaX) > Math.abs(deltaY)) {
						height = clamp(width / active.aspectRatio, config.minHeight, config.maxHeight);
						if (active.direction.vertical === -1) {
							marginTop = active.startMarginTop + (active.startRect.height - height);
						}
					} else {
						width = clamp(height * active.aspectRatio, config.minWidth, config.maxWidth);
						if (active.direction.horizontal === -1) {
							marginLeft = active.startMarginLeft + (active.startRect.width - width);
						}
					}
				}
			}

			if (active.direction.horizontal) {
				active.el.style.width = width + 'px';
				if (active.direction.horizontal === -1) {
					active.el.style.marginLeft = marginLeft + 'px';
				}
				this._applyTableColumnWidth(active.el, width);
			}

			if (active.direction.vertical) {
				active.el.style.height = height + 'px';
				if (active.direction.vertical === -1) {
					active.el.style.marginTop = marginTop + 'px';
				}
			}

			active.currentWidth = width;
			active.currentHeight = height;
			active.lastDeltaX = deltaX;
			active.lastDeltaY = deltaY;

			this._emitResize('resize', evt, width, height, deltaX, deltaY);
		},

		_applyTableColumnWidth(el, width) {
			if (!el || width == null) return;

			const cell = closest(el, 'th,td');
			if (!cell || cell.colSpan > 1) return;

			const table = closest(cell, 'table');
			if (!table) return;

			const row = closest(cell, 'tr');
			if (!row) return;

			let columnIndex = 0;
			let found = false;
			for (let i = 0; i < row.cells.length; i++) {
				const current = row.cells[i];
				const span = current.colSpan || 1;
				if (current === cell) {
					if (span !== 1) return;
					found = true;
					break;
				}
				columnIndex += span;
			}
			if (!found) return;

			const pxWidth = width + 'px';
			const applyToRow = targetRow => {
				if (!targetRow || !targetRow.cells || !targetRow.cells.length) return;
				let position = 0;
				for (let i = 0; i < targetRow.cells.length; i++) {
					const current = targetRow.cells[i];
					const span = current.colSpan || 1;
					if (columnIndex >= position && columnIndex < position + span) {
						if (span === 1) {
							current.style.width = pxWidth;
						}
						break;
					}
					position += span;
				}
			};

			const sections = [];
			if (table.tHead) sections.push(table.tHead);
			if (table.tBodies) {
				for (let i = 0; i < table.tBodies.length; i++) {
					sections.push(table.tBodies[i]);
				}
			}
			if (table.tFoot) sections.push(table.tFoot);

			for (let i = 0; i < sections.length; i++) {
				const section = sections[i];
				if (!section || !section.rows) continue;
				for (let j = 0; j < section.rows.length; j++) {
					applyToRow(section.rows[j]);
				}
			}

			const colGroups = table.getElementsByTagName('colgroup');
			if (!colGroups || !colGroups.length) return;

			let position = 0;
			for (let i = 0; i < colGroups.length; i++) {
				const cols = colGroups[i].children;
				for (let j = 0; j < cols.length; j++) {
					const col = cols[j];
					const span = parseInt(col.getAttribute('span') || '1', 10) || 1;
					if (columnIndex >= position && columnIndex < position + span) {
						if (span === 1) {
							col.style.width = pxWidth;
						}
						return;
					}
					position += span;
				}
			}
		},

		_onPointerUp(evt) {
			const active = this._activeResize;
			if (!active) return;

			active.pendingEvent = evt;
			this._commitResize();
			this._finishResize(evt);
		},

		_finishResize(evt) {
			const active = this._activeResize;
			if (!active) return;

			const cancelFrame = (typeof window !== 'undefined' && window.cancelAnimationFrame) || function(id) {
				clearTimeout(id);
			};
			if (active.raf) {
				cancelFrame(active.raf);
				active.raf = null;
			}

			this._unbindListeners();

			if (active.pointerId != null && active.captureEl && active.captureEl.releasePointerCapture) {
				try {
					active.captureEl.releasePointerCapture(active.pointerId);
				} catch (_) {}
			}

			if (active.config.activeClass) {
				toggleClass(active.el, active.config.activeClass, false);
			}

			css(document.body, 'user-select', active.prevUserSelect || '');

			this._emitResize('resizeend', evt, active.currentWidth, active.currentHeight, active.lastDeltaX, active.lastDeltaY);

			this._activeResize = null;
		},

		_emitResize(name, originalEvent, width, height, deltaX, deltaY) {
			const active = this._activeResize;
			const targetEl = active ? active.el : (originalEvent && originalEvent.target);

			dispatchEvent({
				sortable: this.sortable,
				rootEl: this.sortable.el,
				name,
				targetEl,
				originalEvent,
				extraEventProperties: {
					resizeWidth: width,
					resizeHeight: height,
					resizeDelta: { x: deltaX, y: deltaY },
					resizeDirection: active ? active.token : null
				}
			});
		}
	};

	return Object.assign(Resize, {
		pluginName: 'resize'
	});
}

export default ResizePlugin;
