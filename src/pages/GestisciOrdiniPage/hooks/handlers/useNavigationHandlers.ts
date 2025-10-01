import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TabType } from '../../types';

interface UseNavigationHandlersProps {
  setTabs: React.Dispatch<React.SetStateAction<any>>;
}

export const useNavigationHandlers = ({ setTabs }: UseNavigationHandlersProps) => {
  const navigate = useNavigate();

  const handleClose = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleSetActiveTab = useCallback((tab: TabType) => {
    setTabs(prev => ({ ...prev, active: tab }));
  }, [setTabs]);

  const handleToggleExpanded = useCallback((ordineId: string) => {
    setTabs(prev => ({
      ...prev,
      expanded: new Set(prev.expanded).has(ordineId)
        ? new Set([...prev.expanded].filter(id => id !== ordineId))
        : new Set([...prev.expanded, ordineId])
    }));
  }, [setTabs]);

  return {
    handleClose,
    handleSetActiveTab,
    handleToggleExpanded
  };
};
