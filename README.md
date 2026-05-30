# Power BI Multi-Month Calendar Status Tracker Visual

A premium, interactive, and high-performance custom calendar visual for **Microsoft Power BI**. This visual allows organizations to track daily agent availability, holiday schedules, call statuses, and project tracking roles in a highly intuitive calendar grid format. It features cross-filtering capabilities, robust data mapping, and automatic month-based slicing.

---

## 🌟 Key Features

* **Multi-Month Grid Layout**: Renders dynamic, responsive calendar grids for all months containing data in the dataset.
* **6-Tier Status Representation**: Renders multiple status metrics as proportional colored horizontal bars at the bottom of each date cell:
  * ⬛ **Not Started** (`#252423`)
  * 🟪 **Phone Only** (`#744EC2`)
  * 🟨 **Holiday** (`#D9B300`)
  * 🟥 **Not Reachable** (`#D64550`)
  * 🟧 **Reachable** (`#E66C37`)
  * 🟩 **Available** (`#10B424`)
* **Interactive Filtering & Selection**: Integrates natively with the Power BI `ISelectionManager` for date-level cross-filtering and highlight synchronization across other dashboard visuals (supports `Ctrl/Cmd + Click` multi-select).
* **Smart Role & Fallback Mapping**: Robust parsing logic supports strict Power BI data roles as well as string-matching fallback names (e.g. matching fields by display name or query name regardless of case/whitespace).
* **Intelligent Month Slicing**: Dynamically hides months that contain no status records, ensuring dashboard space is optimized.
* **Detailed Tooltips**: Generates multiline, context-rich tooltips detailing exact values for each active status metric on hover.

---

## 📊 Data Roles & Mappings

The visual binds standard Power BI categorical data to its template structure using the following schema defined in `capabilities.json`:

### 1. Grouping Field
* **Date (`date`)**: The grouping dimension (e.g., date/calendar field) that populates the calendar days.

### 2. Status Measures
You can map up to six integer/numeric measures to represent different statuses:

| Role Name | Display Name | Default Color | Description |
| :--- | :--- | :--- | :--- |
| `notStarted` | **Not Started** | `#252423` (Charcoal) | Operations or tasks that have not yet commenced. |
| `phoneOnly` | **Phone Only** | `#744EC2` (Purple) | Availability or tasks restricted strictly to telephone communications. |
| `holiday` | **Holiday** | `#D9B300` (Yellow/Gold) | Non-working days, company-wide holidays, or leaves. |
| `notReachable` | **Not Reachable** | `#D64550` (Red) | High-priority flag indicating communication failure or outage. |
| `reachable` | **Reachable** | `#E66C37` (Orange) | Active connection or standard contact achieved. |
| `available` | **Available** | `#10B424` (Green) | Full operating status, active, or ready for dispatch. |

---

## 🛠️ Development & Setup

This project uses the official Power BI Visuals SDK (`pbiviz`) and TypeScript.

### Prerequisites
Make sure you have Node.js (v18+ recommended) and the Power BI Visuals SDK CLI installed globally:
```bash
npm install -g powerbi-visuals-tools
```

### Installation
Clone or navigate to the project directory and install the package dependencies:
```bash
npm install
```

### Development Server
To spin up a local development server for live-previewing inside Power BI Service (`https://app.powerbi.com`) or Power BI Desktop:
```bash
npm run start
```
This boots up the local visual hosting server at `https://localhost:8080/webpack/`.

### Packaging the Visual
To compile, bundle, and package the custom visual into a distributable `.pbiviz` file (saved to the `dist/` directory):
```bash
npm run package
```
The resulting `.pbiviz` package can be imported directly into Power BI Desktop or published to the AppSource marketplace.

### Code Formatting & Linting
Run the ESLint suite to check for static issues:
```bash
npm run lint
```

---

## 📂 File Structure

```text
├── .git/                 # Git repository configuration
├── .gitignore            # Git exclusion rules
├── .tmp/                 # Temp build directory (auto-generated)
├── assets/
│   └── icon.png          # Visual icon displayed in Power BI panel
├── dist/                 # Production distribution package folder
├── src/
│   ├── settings.ts       # Formatting model & visual settings configuration
│   └── visual.ts         # Main custom visual logic (data parsing & DOM rendering)
├── style/
│   └── visual.less       # LESS stylesheet for custom visual styling
├── capabilities.json     # Data roles, schemas, and privilege definitions
├── package.json          # Node dependencies, versions, and npm scripts
├── pbiviz.json           # Power BI metadata, author, and resource configurations
├── tsconfig.json         # TypeScript compiler configurations
└── eslint.config.mjs     # ESLint strict ruleset definition
```

---

## 🛡️ License

This custom visual is licensed under the **MIT License**. See `package.json` for details.
