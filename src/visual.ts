"use strict";

import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.visuals.ISelectionId;

interface DayEntry {
    date: Date;
    totals: Record<string, number>;
    selectionId: ISelectionId;
}

export class Visual implements IVisual {
    private host: IVisualHost;
    private container: HTMLElement;
    private selectionManager: ISelectionManager;

    private readonly STATUS_MAP = [
        { role: "notStarted",   color: "#252423", label: "Not Started"   },
        { role: "phoneOnly",    color: "#744EC2", label: "Phone Only"    },
        { role: "holiday",      color: "#D9B300", label: "Holiday"       },
        { role: "notReachable", color: "#D64550", label: "Not Reachable" },
        { role: "reachable",    color: "#E66C37", label: "Reachable"     },
        { role: "available",    color: "#10B424", label: "Available"     },
    ];

    private readonly BAR_HEIGHT = 6;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.container = options.element;
        this.selectionManager = this.host.createSelectionManager();

        this.container.style.cssText = `
            overflow-y: auto;
            overflow-x: hidden;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #FFFFFF;
            height: 100%;
            width: 100%;
            box-sizing: border-box;
            padding: 6px;
        `;

        this.container.addEventListener("click", () => {
            this.selectionManager.clear().then(() => this.syncSelection());
        });
    }

    public update(options: VisualUpdateOptions): void {
        this.container.innerHTML = "";
        const dataView = options.dataViews?.[0];
        if (!dataView) return;

        const map = this.parseData(dataView);
        if (map.size === 0) return;

        const wrapper = document.createElement("div");
        wrapper.style.cssText = `
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            width: 100%;
        `;

        const months = this.getMonths(map);
        months.sort((a, b) => (a.year * 12 + a.month) - (b.year * 12 + b.month));

        months.forEach(({ year, month }) => {
            wrapper.appendChild(this.renderMonth(year, month, map));
        });

        this.container.appendChild(wrapper);
        this.syncSelection();
    }

    // ✅ FIXED mapping logic (color issue solved)
    private parseData(dataView: DataView): Map<string, DayEntry> {
        const map = new Map<string, DayEntry>();
        const cat = dataView.categorical;
        if (!cat || !cat.categories || !cat.values) return map;

        const dateCol = cat.categories[0];
        const values  = cat.values;

        const roleIdx: Record<string, number> = {};

        // Pass 1: strict role mapping
        values.forEach((col, i) => {
            Object.keys(col.source.roles || {}).forEach(roleName => {
                if (roleIdx[roleName] === undefined) roleIdx[roleName] = i;
            });
        });

        // Pass 2: fallback matching
        values.forEach((col, i) => {
            const displayName = (col.source.displayName || "").toLowerCase().replace(/\s+/g, "").replace(/#/g, "");
            const queryName   = (col.source.queryName   || "").toLowerCase().replace(/\s+/g, "").replace(/#/g, "");

            this.STATUS_MAP.forEach(s => {
                if (roleIdx[s.role] !== undefined) return;

                const role = s.role.toLowerCase();
                const label = s.label.toLowerCase().replace(/\s+/g, "");

                if (
                    displayName === role ||
                    displayName === label ||
                    queryName === role ||
                    queryName === label ||
                    displayName.includes(role) ||
                    queryName.includes(role)
                ) {
                    roleIdx[s.role] = i;
                }
            });
        });

        dateCol.values.forEach((val: any, rowIdx: number) => {
            const date = new Date(val);
            if (isNaN(date.getTime())) return;

            const dateKey = this.key(date);
            let entry = map.get(dateKey);

            if (!entry) {
                const totals: Record<string, number> = {};
                this.STATUS_MAP.forEach(s => { totals[s.role] = 0; });

                const selectionId = this.host
                    .createSelectionIdBuilder()
                    .withCategory(dateCol, rowIdx)
                    .createSelectionId();

                entry = { date, totals, selectionId };
                map.set(dateKey, entry);
            }

            this.STATUS_MAP.forEach(s => {
                const colIdx = roleIdx[s.role];
                if (colIdx === undefined) return;

                const raw = values[colIdx].values[rowIdx];
                if (raw !== null && raw !== undefined) {
                    entry!.totals[s.role] += Number(raw);
                }
            });
        });

        return map;
    }

    private renderMonth(year: number, month: number, map: Map<string, DayEntry>): HTMLElement {
        const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
        const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

        const monthCard = document.createElement("div");
        monthCard.style.cssText = `border:1.5px solid #000; display:flex; flex-direction:column; background:#fff;`;

        const header = document.createElement("div");
        header.style.cssText = `background:#000;color:#fff;text-align:center;padding:7px;font-weight:700;font-size:14px;`;
        header.textContent = `${MONTHS[month]} ${year}`;
        monthCard.appendChild(header);

        const grid = document.createElement("div");
        grid.style.cssText = `display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:#ccc;`;

        DAYS.forEach(d => {
            const el = document.createElement("div");
            el.style.cssText = `background:#fff;text-align:center;font-size:10px;font-weight:700;padding:4px;`;
            el.textContent = d;
            grid.appendChild(el);
        });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cellCount = Math.ceil((firstDay + daysInMonth) / 7) * 7;

        for (let i = 0; i < cellCount; i++) {
            const dayNum = i - firstDay + 1;
            const isInside = dayNum >= 1 && dayNum <= daysInMonth;

            const cell = document.createElement("div");
            cell.className = "day-cell";
            cell.style.cssText = `position:relative;min-height:52px;background:${isInside?"#f5f5f5":"#fff"};display:flex;flex-direction:column;justify-content:flex-end;`;

            if (!isInside) {
                grid.appendChild(cell);
                continue;
            }

            const num = document.createElement("div");
            num.style.cssText = `position:absolute;top:3px;left:4px;font-size:9px;font-weight:700;color:#111;`;
            num.textContent = String(dayNum);
            cell.appendChild(num);

            const data = map.get(this.key(new Date(year, month, dayNum)));
            const activeStatuses = data ? this.STATUS_MAP.filter(s => (data.totals[s.role] || 0) > 0) : [];

            if (activeStatuses.length > 0 && data) {
                (cell as any).__selectionId = data.selectionId;

                const barsWrap = document.createElement("div");

                activeStatuses.forEach(s => {
                    const bar = document.createElement("div");
                    bar.style.cssText = `height:${this.BAR_HEIGHT}px;background:${s.color};`;
                    barsWrap.appendChild(bar);
                });

                cell.appendChild(barsWrap);

                cell.title = activeStatuses.map(s => `${s.label}: ${data.totals[s.role]}`).join("\n");

                cell.style.cursor = "pointer";
                cell.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.selectionManager
                        .select(data.selectionId, e.ctrlKey || e.metaKey)
                        .then(() => this.syncSelection());
                });
            }

            grid.appendChild(cell);
        }

        monthCard.appendChild(grid);
        return monthCard;
    }

    // ✅ SLICER FIX
    private getMonths(map: Map<string, DayEntry>): { year: number; month: number }[] {
        const set = new Set<string>();

        map.forEach(d => {
            const hasData = this.STATUS_MAP.some(s => (d.totals[s.role] || 0) > 0);
            if (hasData) {
                set.add(`${d.date.getFullYear()}-${d.date.getMonth()}`);
            }
        });

        return Array.from(set).map(k => {
            const [y, m] = k.split("-").map(Number);
            return { year: y, month: m };
        });
    }

    private syncSelection(): void {
        const hasSelection = this.selectionManager.hasSelection();
        const selectedIds = this.selectionManager.getSelectionIds() as ISelectionId[];

        this.container.querySelectorAll<HTMLElement>(".day-cell").forEach(cell => {
            const sid = (cell as any).__selectionId;

            if (!hasSelection) {
                cell.style.opacity = "1";
                cell.style.outline = "none";
                return;
            }

            const isSelected = sid && selectedIds.some(id => id.equals(sid));
            cell.style.opacity = isSelected ? "1" : "0.3";
            cell.style.outline = isSelected ? "2px solid #0078d4" : "none";
        });
    }

    private key(d: Date): string {
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }
}