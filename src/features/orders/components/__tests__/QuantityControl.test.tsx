import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuantityControl from '../QuantityControl';

describe('QuantityControl', () => {
  const defaultProps = {
    quantity: 12,
    mode: 'bottiglie' as const,
    onQuantityChange: vi.fn(),
    onModeChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render quantity control with correct values', () => {
      render(<QuantityControl {...defaultProps} />);
      
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('bottiglie')).toBeInTheDocument();
    });

    it('should display correct quantity for cartoni mode', () => {
      render(<QuantityControl {...defaultProps} quantity={18} mode="cartoni" />);
      
      // 18 bottiglie = 3 cartoni
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('cartoni')).toBeInTheDocument();
    });

    it('should have correct button sizes (≥44px touch targets)', () => {
      render(<QuantityControl {...defaultProps} />);
      
      const minusButton = screen.getByLabelText('Diminuisci quantità');
      const plusButton = screen.getByLabelText('Aumenta quantità');
      
      // Verifica che i pulsanti abbiano dimensioni minime per touch
      expect(minusButton).toHaveStyle({ minWidth: '44px', minHeight: '44px' });
      expect(plusButton).toHaveStyle({ minWidth: '44px', minHeight: '44px' });
    });
  });

  describe('Quantity Controls', () => {
    it('should call onQuantityChange with -1 when minus button is clicked', () => {
      const onQuantityChange = vi.fn();
      render(<QuantityControl {...defaultProps} onQuantityChange={onQuantityChange} />);
      
      const minusButton = screen.getByLabelText('Diminuisci quantità');
      fireEvent.click(minusButton);
      
      expect(onQuantityChange).toHaveBeenCalledWith(-1);
    });

    it('should call onQuantityChange with +1 when plus button is clicked', () => {
      const onQuantityChange = vi.fn();
      render(<QuantityControl {...defaultProps} onQuantityChange={onQuantityChange} />);
      
      const plusButton = screen.getByLabelText('Aumenta quantità');
      fireEvent.click(plusButton);
      
      expect(onQuantityChange).toHaveBeenCalledWith(1);
    });
  });

  describe('Mode Toggle', () => {
    it('should call onModeChange with "bottiglie" when bottiglie button is clicked', () => {
      const onModeChange = vi.fn();
      render(<QuantityControl {...defaultProps} mode="cartoni" onModeChange={onModeChange} />);
      
      const bottiglieButton = screen.getByText('Bottiglie');
      fireEvent.click(bottiglieButton);
      
      expect(onModeChange).toHaveBeenCalledWith('bottiglie');
    });

    it('should call onModeChange with "cartoni" when cartoni button is clicked', () => {
      const onModeChange = vi.fn();
      render(<QuantityControl {...defaultProps} mode="bottiglie" onModeChange={onModeChange} />);
      
      const cartoniButton = screen.getByText('Cartoni');
      fireEvent.click(cartoniButton);
      
      expect(onModeChange).toHaveBeenCalledWith('cartoni');
    });

    it('should highlight active mode button', () => {
      render(<QuantityControl {...defaultProps} mode="bottiglie" />);
      
      const bottiglieButton = screen.getByText('Bottiglie');
      const cartoniButton = screen.getByText('Cartoni');
      
      // Bottone attivo dovrebbe avere background scuro
      expect(bottiglieButton).toHaveStyle({ background: '#541111' });
      expect(cartoniButton).toHaveStyle({ background: 'transparent' });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button roles', () => {
      render(<QuantityControl {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4); // minus, plus, bottiglie, cartoni
    });

    it('should maintain color contrast for text', () => {
      render(<QuantityControl {...defaultProps} />);
      
      const quantityText = screen.getByText('12');
      expect(quantityText).toHaveStyle({ color: '#541111' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero quantity', () => {
      render(<QuantityControl {...defaultProps} quantity={0} />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle large quantities', () => {
      render(<QuantityControl {...defaultProps} quantity={144} mode="cartoni" />);
      
      // 144 bottiglie = 24 cartoni
      expect(screen.getByText('24')).toBeInTheDocument();
    });
  });
});
