'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Person = {
	id: string;
	name: string;
	role: string;
	department: string;
};

const DATA: Person[] = [
	{ id: '1', name: 'Jane Doe', role: 'Product Designer', department: 'Design' },
	{ id: '2', name: 'Michael Chen', role: 'Staff Engineer', department: 'Engineering' },
	{ id: '3', name: 'Priya Singh', role: 'Product Manager', department: 'Product' },
	{ id: '4', name: 'Leo Ortega', role: 'QA Analyst', department: 'Quality' }
];

const COLUMNS = [
	{ key: 'name', label: 'Name' },
	{ key: 'role', label: 'Role' },
	{ key: 'department', label: 'Department' }
] as const;

type ResizeState =
	| {
			type: 'column';
			index: number;
			startX: number;
			startSize: number;
		}
	| {
			type: 'row';
			index: number;
			startY: number;
			startSize: number;
		}
	| null;

function ResizableTable() {
	const [colWidths, setColWidths] = useState<number[]>(() => COLUMNS.map(() => 220));
	const [rowHeights, setRowHeights] = useState<number[]>(() => DATA.map(() => 60));
	const activeResizeRef = useRef<ResizeState>(null);

	const stopResize = useCallback(() => {
		activeResizeRef.current = null;
		document.body.style.userSelect = '';
	}, []);

	const handlePointerMove = useCallback((evt: PointerEvent) => {
		const active = activeResizeRef.current;
		if (!active) return;

		if (active.type === 'column') {
			const delta = evt.clientX - active.startX;
			const next = Math.max(120, active.startSize + delta);
			setColWidths(prev => {
				const clone = [...prev];
				clone[active.index] = next;
				return clone;
			});
		} else if (active.type === 'row') {
			const delta = evt.clientY - active.startY;
			const next = Math.max(40, active.startSize + delta);
			setRowHeights(prev => {
				const clone = [...prev];
				clone[active.index] = next;
				return clone;
			});
		}
	}, []);

	const handlePointerUp = useCallback(() => {
		if (!activeResizeRef.current) return;
		stopResize();
	}, [stopResize]);

	useEffect(() => {
		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
		window.addEventListener('pointercancel', handlePointerUp);
		return () => {
			window.removeEventListener('pointermove', handlePointerMove);
			window.removeEventListener('pointerup', handlePointerUp);
			window.removeEventListener('pointercancel', handlePointerUp);
		};
	}, [handlePointerMove, handlePointerUp]);

	const beginColumnResize = useCallback((index: number, evt: React.PointerEvent) => {
		evt.preventDefault();
		document.body.style.userSelect = 'none';
		activeResizeRef.current = {
			type: 'column',
			index,
			startX: evt.clientX,
			startSize: colWidths[index]
		};
	}, [colWidths]);

	const beginRowResize = useCallback((index: number, evt: React.PointerEvent) => {
		evt.preventDefault();
		document.body.style.userSelect = 'none';
		activeResizeRef.current = {
			type: 'row',
			index,
			startY: evt.clientY,
			startSize: rowHeights[index]
		};
	}, [rowHeights]);

	const totalWidth = useMemo(
		() => colWidths.reduce((sum, width) => sum + width, 0),
		[colWidths]
	);

	return (
		<div className="resizable-table">
			<table style={{ width: totalWidth }}>
				<thead>
					<tr>
						{COLUMNS.map((column, index) => (
							<th key={column.key} style={{ width: colWidths[index] }}>
								<div className="header-content">
									<span>{column.label}</span>
									<button
										type="button"
										className="resize-handle resize-handle--column"
										onPointerDown={(evt) => beginColumnResize(index, evt)}
										aria-label={`Resize column ${column.label}`}
									/>
								</div>
							</th>
						))}
						<th className="row-resize-header" aria-hidden="true" />
					</tr>
				</thead>
				<tbody>
					{DATA.map((person, rowIndex) => (
						<tr key={person.id} style={{ height: rowHeights[rowIndex] }}>
							{COLUMNS.map((column, colIndex) => (
								<td key={column.key} style={{ width: colWidths[colIndex] }}>
									{(person as Record<string, string>)[column.key]}
								</td>
							))}
							<td className="row-resize-cell">
								<button
									type="button"
									className="resize-handle resize-handle--row"
									onPointerDown={(evt) => beginRowResize(rowIndex, evt)}
									aria-label={`Resize row ${rowIndex + 1}`}
								/>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<div className="metrics">
				<h3>Current dimensions</h3>
				<div className="metrics-grid">
					<div>
						<h4>Columns</h4>
						<ul>
							{COLUMNS.map((column, index) => (
								<li key={column.key}>
									<strong>{column.label}:</strong> {Math.round(colWidths[index])}px
								</li>
							))}
						</ul>
					</div>
					<div>
						<h4>Rows</h4>
						<ul>
							{DATA.map((person, index) => (
								<li key={person.id}>
									<strong>Row {index + 1}:</strong> {Math.round(rowHeights[index])}px
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
			<style jsx>{`
				.resizable-table {
					display: flex;
					flex-direction: column;
					gap: 1.5rem;
					font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
					color: #111827;
				}

				table {
					border-collapse: separate;
					border-spacing: 0;
					min-width: 640px;
					background: #ffffff;
					border-radius: 14px;
					box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
					overflow: hidden;
				}

				th,
				td {
					padding: 0.75rem 1rem;
					border-bottom: 1px solid rgba(15, 23, 42, 0.08);
					position: relative;
					background: white;
				}

				th {
					font-size: 0.85rem;
					letter-spacing: 0.12em;
					text-transform: uppercase;
					font-weight: 600;
					color: #475569;
				}

				td {
					font-size: 0.95rem;
					color: #1f2937;
				}

				tbody tr:last-child td {
					border-bottom: none;
				}

				.header-content {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 1rem;
				}

				.resize-handle {
					display: inline-flex;
					align-items: center;
					justify-content: center;
					border: none;
					background: transparent;
					padding: 0;
					cursor: col-resize;
				}

				.resize-handle:focus-visible {
					outline: 2px solid #2563eb;
					outline-offset: 2px;
				}

				.resize-handle--column {
					width: 16px;
					height: 100%;
					margin-right: -8px;
					cursor: col-resize;
					position: relative;
				}

				.resize-handle--column::before {
					content: '';
					position: absolute;
					top: 0;
					bottom: 0;
					left: 50%;
					width: 2px;
					border-radius: 9999px;
					background: rgba(59, 130, 246, 0.6);
					opacity: 0;
					transform: translateX(-50%);
					transition: opacity 120ms ease;
				}

				.resize-handle--column:hover::before,
				.resize-handle--column:active::before {
					opacity: 1;
				}

				.row-resize-cell {
					width: 32px;
					padding: 0;
					border-bottom: none;
					background: #f8fafc;
				}

				.row-resize-header {
					width: 32px;
					background: #f1f5f9;
				}

				.resize-handle--row {
					width: 100%;
					height: 18px;
					cursor: row-resize;
					position: relative;
				}

				.resize-handle--row::before {
					content: '';
					position: absolute;
					left: 12%;
					right: 12%;
					top: 50%;
					height: 2px;
					border-radius: 9999px;
					background: rgba(59, 130, 246, 0.6);
					opacity: 0;
					transform: translateY(-50%);
					transition: opacity 120ms ease;
				}

				.resize-handle--row:hover::before,
				.resize-handle--row:active::before {
					opacity: 1;
				}

				.metrics {
					padding: 1.5rem;
					background: #ffffff;
					border-radius: 14px;
					border: 1px solid rgba(15, 23, 42, 0.06);
					box-shadow: 0 10px 30px -12px rgba(15, 23, 42, 0.25);
				}

				.metrics h3 {
					margin: 0 0 0.75rem 0;
					font-size: 1rem;
					font-weight: 600;
					color: #0f172a;
				}

				.metrics-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
					gap: 1rem;
				}

				.metrics ul {
					list-style: none;
					margin: 0;
					padding: 0;
					display: grid;
					gap: 0.25rem;
				}

				.metrics li {
					font-size: 0.9rem;
					color: #475569;
				}

				strong {
					color: #0f172a;
					font-weight: 600;
				}

				@media (max-width: 900px) {
					table {
						min-width: 520px;
					}
				}
			`}</style>
		</div>
	);
}

export default function Page() {
	return (
		<div className="page">
			<header>
				<h1>Resizable Table Sandbox</h1>
				<p>
					Drag the blue handles to adjust column widths or row heights. Live pixel values
					update below so you can verify the behaviour.
				</p>
			</header>
			<ResizableTable />
			<style jsx>{`
				.page {
					min-height: 100vh;
					padding: 3rem clamp(1.5rem, 5vw, 4rem);
					background: #e2e8f0;
					display: flex;
					flex-direction: column;
					gap: 2rem;
				}

				header h1 {
					font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
					font-size: clamp(2rem, 3vw, 2.5rem);
					margin-bottom: 0.75rem;
					color: #0f172a;
				}

				header p {
					font-size: 1rem;
					max-width: 720px;
					color: #475569;
					line-height: 1.6;
				}
			`}</style>
		</div>
	);
}
