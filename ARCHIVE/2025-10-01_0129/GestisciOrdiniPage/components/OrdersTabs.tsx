import React from 'react';
import { ORDINI_LABELS } from '../../../constants/ordiniLabels';
import { TabType } from '../types';

interface OrdersTabsProps {
  activeTab: TabType;
  onSetActiveTab: (tab: TabType) => void;
  getTabCount: (tab: TabType) => number;
}

export const OrdersTabs: React.FC<OrdersTabsProps> = React.memo(({
  activeTab,
  onSetActiveTab,
  getTabCount
}) => {
  return (
    <div className="gestisci-ordini-tabs" style={{
      flexShrink: 0,
      padding: '16px 16px 0 16px',
      background: '#fff9dc'
    }}>
      <div className="flex gap-2 mb-6 flex-nowrap">
        <button
          onClick={() => onSetActiveTab('inviati')}
          className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-medium transition-colors flex-1 whitespace-nowrap"
          style={{
            background: activeTab === 'inviati' ? '#d4a300' : 'transparent',
            color: activeTab === 'inviati' ? '#fff9dc' : '#541111',
            border: activeTab === 'inviati' ? 'none' : '1px solid #e2d6aa'
          }}
        >
          {ORDINI_LABELS.tabs.creati} ({getTabCount('inviati')})
        </button>
        
        <button
          onClick={() => onSetActiveTab('archiviati')}
          className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-medium transition-colors flex-1 whitespace-nowrap"
          style={{
            background: activeTab === 'archiviati' ? '#d4a300' : 'transparent',
            color: activeTab === 'archiviati' ? '#fff9dc' : '#541111',
            border: activeTab === 'archiviati' ? 'none' : '1px solid #e2d6aa'
          }}
        >
          {ORDINI_LABELS.tabs.archiviati} ({getTabCount('archiviati')})
        </button>
      </div>
    </div>
  );
});
