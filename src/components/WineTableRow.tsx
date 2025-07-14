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
  const isEmptyRow = row.id.startsWith('empty-');
  const bgColor = isSelected ? "#E6D7B8" : "#F5F0E6";
  const borderW = isSelected ? "2px" : "1px";
  const borderC = isSelected ? "#D97706" : "#92400e";

  const getFontSizeStyle = () => {
    const isTabletLandscape = window.innerWidth <= 1024 && window.innerWidth > 480;
    const adjustedSize = isTabletLandscape ? Math.max(10, fontSize - 2) : fontSize;
    return { fontSize: `${adjustedSize}px` };
  };

  // Per le righe vuote, non gestire i click
  const handleRowClick = (e: React.MouseEvent) => {
    if (!isEmptyRow) {
      onRowClick(index, e);
    }
  };

  return (
    <tr
      key={row.id}
      onClick={handleRowClick}
      className={`transition-all duration-200 ${isEmptyRow ? '' : 'cursor-pointer hover:bg-opacity-80'}`}
      style={{ backgroundColor: bgColor, borderWidth: borderW, borderColor: borderC }}
    >
      <td
        className="border border-amber-900 p-0"
        style={{ backgroundColor: bgColor, width: columnWidths["#"] }}
      >
        <div
          className="w-full px-2 py-2 text-center text-gray-600 font-medium select-none flex items-center justify-center"
          style={{ fontSize: fontSize * 0.7, userSelect: "none", height: 24 }}
        >
          {isEmptyRow ? '' : index + 1}
        </div>
      </td>

      <td
        className="border border-amber-900 p-0"
        style={{ backgroundColor: bgColor, width: columnWidths["nomeVino"] }}
      >
        <div
          className="w-full px-2 py-1 bg-transparent border-none outline-none text-gray-600 text-center select-none flex items-center justify-center"
          style={{ backgroundColor: bgColor, userSelect: "none", ...getFontSizeStyle(), height: 24, lineHeight: "normal" }}
        >
          {isEmptyRow ? '' : row.nomeVino}
        </div>
      </td>

      <td
        className="border border-amber-900 p-0"
        style={{ backgroundColor: bgColor, width: columnWidths["anno"] }}
      >
        <div
          className="w-full px-2 py-1 bg-transparent border-none outline-none text-gray-600 text-center select-none flex items-center justify-center"
          style={{ backgroundColor: bgColor, userSelect: "none", ...getFontSizeStyle(), height: 24, lineHeight: "normal" }}
        >
          {isEmptyRow ? '' : row.anno}
        </div>
      </td>

      <td
        className="border border-amber-900 p-0"
        style={{ backgroundColor: bgColor, width: columnWidths["produttore"] }}
      >
        <div
          className="w-full px-2 py-1 bg-transparent border-none outline-none text-gray-600 text-center select-none flex items-center justify-center"
          style={{ backgroundColor: bgColor, userSelect: "none", ...getFontSizeStyle(), height: 24, lineHeight: "normal" }}
        >
          {isEmptyRow ? '' : row.produttore}
        </div>
      </td>

      <td
        className="border border-amber-900 p-0"
        style={{ backgroundColor: bgColor, width: columnWidths["provenienza"] }}
      >
        <div
          className="w-full px-2 py-1 bg-transparent border-none outline-none text-gray-600 text-center select-none flex items-center justify-center"
          style={{ backgroundColor: bgColor, userSelect: "none", ...getFontSizeStyle(), height: 24, lineHeight: "normal" }}
        >
          {isEmptyRow ? '' : row.provenienza}
        </div>
      </td>

      <td
        className="border border-amber-900 p-0"
        style={{ backgroundColor: bgColor, width: columnWidths["fornitore"] }}
      >
        <div
          className="w-full px-2 py-1 bg-transparent border-none outline-none text-gray-600 text-center select-none flex items-center justify-center"
          style={{ backgroundColor: bgColor, userSelect: "none", ...getFontSizeStyle(), height: 24, lineHeight: "normal" }}
        >
          {isEmptyRow ? '' : row.fornitore || ''}
        </div>
      </td>

      <td
        className="border border-amber-900 p-0"
        style={{ backgroundColor: bgColor, width: columnWidths["giacenza"] }}
      >
        <div className="w-full px-2 py-1 bg-transparent border-none outline-none select-none flex items-center justify-center"
          style={{ backgroundColor: bgColor, userSelect: "none", ...getFontSizeStyle(), height: 24, lineHeight: "normal" }}
        >
          <span className={`text-center w-full ${!isEmptyRow && row.giacenza <= 2 ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
            {isEmptyRow ? '' : row.giacenza}
          </span>
        </div>
      </td>
    </tr>
  );
}