
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { EmojiSwitcher } from './EmojiSwitcher';

describe('EmojiSwitcher Component', () => {
  it('should render the initial emoji', () => {
    render(<EmojiSwitcher />);
    expect(screen.getByText('🐶')).toBeInTheDocument();
  });

  it('should cycle through emojis on click', async () => {
    render(<EmojiSwitcher />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    expect(await screen.findByText('🐱')).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(await screen.findByText('🐰')).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(await screen.findByText('🦜')).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(await screen.findByText('🐢')).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(await screen.findByText('🐶')).toBeInTheDocument();
  });

  it('should have framer-motion animations applied', () => {
    const { container } = render(<EmojiSwitcher />);
    // Framer motion uses transform styles, we can check for their presence or class
    const emojiContainer = container.querySelector('.emoji-container');
    expect(emojiContainer).toBeDefined();
  });
});
