import React from 'react';

interface WineRow {
  id: string;
  nomeVino: string;
  anno: string;
  produttore: string;
  provenienza: string;
  giacenza: number;
  fornitore: string;
  tipologia?: string;
}

interface WineTableRowProps {
  row: WineRow;
  index: number;
  isSelected: boolean;
  columnWidths: Record<string, string>;
  fontSize: number;
  onRowClick: (index: number, event: React.MouseEvent) => void;
  onCellChange: (rowIndex: number, field: string, value: string) => void;
}

export default function WineTableRow({
  row,
  index,
  isSelected,
  columnWidths,
  fontSize,
  onRowClick,
  onCellChange
}: WineTableRowProps) {
  const bgColor = isSelected ? "#E6D7B8" : "#F5F0E6";
  const borderW = isSelected ? "2px" : "1px";
  const borderC = isSelected ? "#D97706" : "#92400e";

  const getFontSizeStyle = () => {
    const isTabletLandscape = window.innerWidth <= 1024 && window.innerWidth > 480;
    const adjustedSize = isTabletLandscape ? Math.max(10, fontSize - 2) : fontSize;
    return { fontSize: `${adjustedSize}px` };
  };

  return (
    <tr
      key={row.id}
      onClick={(e) => onRowClick(index, e)}
      className="cursor-pointer transition-all duration-200 hover:bg-opacity-80"
      style={{ backgroundColor: bgColor, borderWidth: borderW, borderColor: borderC }}
    >
      <td
        className="border border-amber-900 p-0"
        style={{ backgroundColor: bgColor, width: columnWidths["#"] }}
      >
        <div
          className="w-full px-2 py-2 text-center text-gray-600 font-medium select-none flex items-center justify-center"
          style={{ fontSize: fontSize * 0.7, userSelect: "none", height: 40 }}
        >
          {index + 1}
        </div>
      </td>

      <td
        className="border border-amber-900 p-0"
        style={{ backgroundColor: bgColor, width: columnWidths["nomeVino"] }}
      >
        <div
          className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 text-center select-none flex items-center justify-center"
          style={{ backgroundColor: bgColor, userSelect: "none", ...getFontSizeStyle(), height: 40, lineHeight: "normal" }}
        >
          {row.nomeVino}
        </div>
      </td>

      <td
        className="border border-amber-900 p-0"
        style={{ backgroundColor: bgColor, width: columnWidths["anno"] }}
      >
        <div
          className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 text-center select-none flex items-center justify-center"
          style={{ backgroundColor: bgColor, userSelect: "none", ...getFontSizeStyle(), height: 40, lineHeight: "normal" }}
        >
          {row.anno}
        </div>
      </td>

      <td
        className="border border-amber-900 p-0"
        style={{ backgroundColor: bgColor, width: columnWidths["produttore"] }}
      >
        <div
          className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 text-center select-none flex items-center justify-center"
          style={{ backgroundColor: bgColor, userSelect: "none", ...getFontSizeStyle(), height: 40, lineHeight: "normal" }}
        >
          {row.produttore}
        </div>
      </td>

      <td
        className="border border-amber-900 p-0"
        style={{ backgroundColor: bgColor, width: columnWidths["provenienza"] }}
      >
        <div
          className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 text-center select-none flex items-center justify-center"
          style={{ backgroundColor: bgColor, userSelect: "none", ...getFontSizeStyle(), height: 40, lineHeight: "normal" }}
        >
          {row.provenienza}
        </div>
      </td>

      <td
        className="border border-amber-900 p-0"
        style={{ backgroundColor: bgColor, width: columnWidths["fornitore"] }}
      >
        <div
          className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 text-center select-none flex items-center justify-center"
          style={{ backgroundColor: bgColor, userSelect: "none", ...getFontSizeStyle(), height: 40, lineHeight: "normal" }}
        >
          {row.fornitore}
        </div>
      </td>

      <td
        className="border border-amber-900 p-0"
        style={{ backgroundColor: bgColor, width: columnWidths["giacenza"] }}
      >
        <div className="w-full px-2 py-2 bg-transparent border-none outline-none text-gray-600 select-none flex items-center justify-center gap-1"
          style={{ backgroundColor: bgColor, userSelect: "none", ...getFontSizeStyle(), height: 40, lineHeight: "normal" }}
        >
          {row.giacenza <= 2 && row.giacenza > 0 && (
            <svg className="w-3 h-3 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z"/>
            </svg>
          )}
          <span className="flex-1 text-center">{row.giacenza}</span>
        </div>
      </td>
    </tr>
  );
}