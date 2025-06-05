export function isSalami(player: any): boolean {
  return (player?.winnings || 0) === 4;
}

export function nextDealer(players: any[]): string {
  return players.reduce((prev, curr) => (curr.winnings || 0) > (prev.winnings || 0) ? curr : prev).name;
}

export function getWinnings(players: any[]): number[] {
  return players.map(p => p.winnings || 0);
}
