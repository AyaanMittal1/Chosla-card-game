export const getDeck = (): string[] => {
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];
  for (let suit of suits) {
    for (let value of values) {
      deck.push(`${value}${suit}`);
    }
  }
  return deck;
};

export const shuffle = (deck: string[]): string[] => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

export const deal = (deck: string[], players: number): string[][] => {
  const hands = Array.from({ length: players }, () => []);
  for (let i = 0; i < players * 13; i++) {
    hands[i % players].push(deck[i]);
  }
  return hands;
};

export const compareSets = (a: string[], b: string[]): number => {
  // Simplified logic: prefer longer sets, fallback to string compare
  if (a.length !== b.length) return a.length - b.length;
  return a.join('').localeCompare(b.join(''));
};
