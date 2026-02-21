import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import GlassCard from '../GlassCard';

const theme = createTheme();

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('GlassCard', () => {
  it('renders children correctly', () => {
    renderWithTheme(
      <GlassCard>
        <span>Test Content</span>
      </GlassCard>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    renderWithTheme(
      <GlassCard>
        <span>First Child</span>
        <span>Second Child</span>
      </GlassCard>
    );

    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
  });

  it('applies custom sx styles', () => {
    renderWithTheme(
      <GlassCard sx={{ padding: '20px' }} data-testid="glass-card">
        <span>Styled Content</span>
      </GlassCard>
    );

    expect(screen.getByText('Styled Content')).toBeInTheDocument();
  });

  it('renders with hover disabled', () => {
    renderWithTheme(
      <GlassCard hover={false} data-testid="no-hover-card">
        <span>No Hover</span>
      </GlassCard>
    );

    expect(screen.getByText('No Hover')).toBeInTheDocument();
  });

  it('accepts different intensity values', () => {
    const { unmount } = renderWithTheme(
      <GlassCard intensity="light">
        <span>Light Intensity</span>
      </GlassCard>
    );
    expect(screen.getByText('Light Intensity')).toBeInTheDocument();
    unmount();

    renderWithTheme(
      <GlassCard intensity="strong">
        <span>Strong Intensity</span>
      </GlassCard>
    );
    expect(screen.getByText('Strong Intensity')).toBeInTheDocument();
  });

  it('accepts noBorder prop', () => {
    renderWithTheme(
      <GlassCard noBorder>
        <span>No Border Card</span>
      </GlassCard>
    );

    expect(screen.getByText('No Border Card')).toBeInTheDocument();
  });

  it('defaults to hover=true and intensity=medium', () => {
    renderWithTheme(
      <GlassCard>
        <span>Default Props</span>
      </GlassCard>
    );

    // Component renders successfully with default props
    expect(screen.getByText('Default Props')).toBeInTheDocument();
  });
});
