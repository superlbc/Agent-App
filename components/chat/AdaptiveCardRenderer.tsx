import React, { useEffect, useRef } from 'react';
import * as AdaptiveCards from 'adaptivecards';

interface AdaptiveCardRendererProps {
  card: any;
  fallbackText?: string;
}

export const AdaptiveCardRenderer: React.FC<AdaptiveCardRendererProps> = ({ card, fallbackText }) => {
  const cardContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardContainerRef.current || !card) return;

    try {
      // Create an AdaptiveCard instance
      const adaptiveCard = new AdaptiveCards.AdaptiveCard();

      // Set host config for dark mode support
      adaptiveCard.hostConfig = new AdaptiveCards.HostConfig({
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      });

      // Parse the card payload
      adaptiveCard.parse(card);

      // Render the card to HTML
      const renderedCard = adaptiveCard.render();

      // Clear previous content and append new card
      if (renderedCard) {
        cardContainerRef.current.innerHTML = '';
        cardContainerRef.current.appendChild(renderedCard);
      } else {
        throw new Error('Card rendering failed');
      }
    } catch (error) {
      console.error('Error rendering adaptive card:', error);
      // Show fallback text if rendering fails
      if (cardContainerRef.current && fallbackText) {
        cardContainerRef.current.innerHTML = `<div class="text-sm whitespace-pre-wrap">${fallbackText}</div>`;
      }
    }
  }, [card, fallbackText]);

  return (
    <div
      ref={cardContainerRef}
      className="adaptive-card-container"
      style={{
        // Style overrides for adaptive cards in dark mode
        color: 'inherit',
      }}
    />
  );
};
