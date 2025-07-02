import React from 'react';

interface WineTableHeaderProps {
  columnWidths: Record<string, string>;
  fontSize: number;
  lineHeight: number;
  rowHeight: number;
}

export default function WineTableHeader({ 
  columnWidths, 
  fontSize, 
  lineHeight, 
  rowHeight 
}: WineTableHeaderProps) {
  return (
    <thead
      className="sticky top-0 z-30 shadow-lg"
      style={{ backgroundColor: "#3b1d1d" }}
    >
      <tr
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: `${lineHeight}px`,
          height: `${rowHeight}px`,
        }}
      >
        <th
          className="px-2 py-3 text-center align-middle font-bold text-white border border-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm"
          style={{ width: columnWidths["#"] }}
        >
          #
        </th>

        <th
          className="px-3 py-3 text-center align-middle font-bold text-white border border-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm"
          style={{ width: columnWidths["nomeVino"] }}
        >
          Nome Vino
        </th>

        <th
          className="px-3 py-3 text-center align-middle font-bold text-white border border-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm"
          style={{ width: columnWidths["anno"] }}
        >
          Anno
        </th>

        <th
          className="px-3 py-3 text-center align-middle font-bold text-white border border-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm"
          style={{ width: columnWidths["produttore"] }}
        >
          Produttore
        </th>

        <th
          className="px-3 py-3 text-center align-middle font-bold text-white border border-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm"
          style={{ width: columnWidths["provenienza"] }}
        >
          Provenienza
        </th>

        <th
          className="px-3 py-3 text-center align-middle font-bold text-white border border-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm"
          style={{ width: columnWidths["fornitore"] }}
        >
          Fornitore
        </th>

        <th
          className="px-1 py-3 text-center align-middle font-bold text-white border border-amber-900 uppercase bg-[#3b1d1d] backdrop-blur-sm"
          style={{ width: columnWidths["giacenza"] }}
        >
          Giacenza
        </th>
      </tr>
    </thead>
  );
}