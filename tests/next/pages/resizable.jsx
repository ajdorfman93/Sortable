import { useEffect, useMemo, useRef } from 'react';
import SortableCore from '../../../src/Sortable.js';
import ResizePlugin from '../../../plugins/Resize/Resize.js';

if (!SortableCore.__resizeMounted) {
	SortableCore.mount(new ResizePlugin());
	SortableCore.__resizeMounted = true;
}

export default function ResizableDemoPage() {
	const listRef = useRef(null);
	const items = useMemo(() => [
		{ id: 'alpha', title: 'Alpha' },
		{ id: 'bravo', title: 'Bravo' },
		{ id: 'charlie', title: 'Charlie' },
		{ id: 'delta', title: 'Delta' }
	], []);

	useEffect(() => {
		if (!listRef.current) return;

		const sortable = new SortableCore(listRef.current, {
			handle: '.card__title',
			animation: 180,
			resize: {
				enabled: true,
				edgeThreshold: 12,
				minWidth: 140,
				minHeight: 96,
				activeClass: 'card--resizing'
			},
			onResize(evt) {
				const { item, resizeWidth, resizeHeight } = evt;
				item.querySelector('.card__meta').textContent = `${Math.round(resizeWidth)}px × ${Math.round(resizeHeight)}px`;
			}
		});

		return () => {
			sortable.destroy();
		};
	}, []);

	return (
		<div className="page">
			<h1>Sortable Resize Demo</h1>
			<p>
				This Next.js page wires the local Sortable build with the Resize plugin.
				Drag the card headers to reorder, or drag card edges/corners to resize them.
			</p>
			<div ref={listRef} className="card-grid">
				{items.map(item => (
					<div className="card" key={item.id} data-id={item.id}>
						<header className="card__title">
							{item.title}
						</header>
						<div className="card__meta">
							Auto
						</div>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse porta neque a leo
							tincidunt, vitae fermentum justo finibus.
						</p>
					</div>
				))}
			</div>

			<style jsx>{`
				.page {
					padding: 2rem;
					font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
					background: #f5f5f5;
					min-height: 100vh;
					color: #1c1c1c;
				}

				h1 {
					margin-bottom: 0.5rem;
				}

				p {
					max-width: 640px;
					line-height: 1.6;
					margin-bottom: 1.5rem;
				}

				.card-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
					gap: 1rem;
					align-items: start;
				}

				.card {
					position: relative;
					background: #ffffff;
					border-radius: 12px;
					box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
					padding: 1rem 1.25rem;
					min-width: 160px;
					min-height: 120px;
					display: flex;
					flex-direction: column;
				}

				.card__title {
					font-weight: 600;
					cursor: grab;
					user-select: none;
					margin-bottom: 0.5rem;
				}

				.card__meta {
					font-size: 0.75rem;
					letter-spacing: 0.05em;
					text-transform: uppercase;
					color: #475569;
					margin-bottom: 0.75rem;
				}

				.card--resizing {
					outline: 2px dashed #3b82f6;
					cursor: nwse-resize;
				}
			`}</style>
		</div>
	);
}
