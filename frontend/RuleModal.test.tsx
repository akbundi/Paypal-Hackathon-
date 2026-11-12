import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { RuleModal } from './RuleModal';

describe('RuleModal validation', () => {
  beforeEach(() => cleanup());

  const setup = () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    const { container } = render(
      <RuleModal isOpen={true} onClose={onClose} onSave={onSave} />
    );

    const form = container.querySelector('form')!;
    const inputs = container.querySelectorAll('input');

    return { onSave, onClose, form, inputs };
  };

  it('rejects an empty rule name', () => {
    const { onSave, form } = setup();
    fireEvent.submit(form);
    expect(screen.getByText('Rule name is required.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('rejects zero transaction limit', () => {
    const { onSave, form, inputs } = setup();
    fireEvent.change(inputs[0], { target: { value: 'Test Rule' } });
    fireEvent.change(inputs[1], { target: { value: '0' } });
    fireEvent.submit(form);
    expect(screen.getByText(/Transaction limit must be greater/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('rejects approval threshold greater than transaction limit', () => {
    const { onSave, form, inputs } = setup();
    fireEvent.change(inputs[0], { target: { value: 'Test Rule' } });
    fireEvent.change(inputs[1], { target: { value: '50' } });
    fireEvent.change(inputs[3], { target: { value: '100' } });
    fireEvent.submit(form);
    expect(screen.getByText(/Approval threshold cannot exceed/i)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves valid rule successfully', () => {
    const { onSave, onClose, form, inputs } = setup();
    fireEvent.change(inputs[0], { target: { value: 'Weekly Budget' } });
    fireEvent.submit(form);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].name).toBe('Weekly Budget');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
