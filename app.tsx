import React, { useEffect, useState } from 'react';
import { CardTable } from './components/CardTable';
import { Lobby } from './components/Lobby';
import { getDeck, shuffle, deal } from './utils/cardEngine';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const GAME_ID = 'demo-game';

export default function App() {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [dealer, setDealer] = useState<string | null>(null);
  const [roundComplete, setRoundComplete] = useState(false);
  const [nextDealer, setNextDealer] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    const ref = doc(db, 'games', GAME_ID);
    const unsubscribe = onSnapshot(ref, (docSnap) => {
      const data = docSnap.data();
      if (data && data.players) {
        setDealer(data.dealer || null);
        setRoundComplete(data.currentMiniRound >= 4);
        setNextDealer(data.nextDealer || null);

        const sorted = [...data.players].sort((a, b) => (b.money ?? 100) - (a.money ?? 100));
        setLeaderboard(sorted);
      }
    });
    return unsubscribe;
  }, []);

  const dealCards = async () => {
    const ref = doc(db, 'games', GAME_ID);
    const snapshot = await getDoc(ref);
    const data = snapshot.data();
    if (!data || !data.players || data.players.length === 0) return;

    const deck = shuffle(getDeck());
    const hands = deal(deck, data.players.length);
    const updatedPlayers = data.players.map((p: any, i: number) => {
      const roundWinnings = p.winnings || 0;
      const salamiBonus = roundWinnings === 4 ? (data.players.length - 1) : 0;
      const totalGain = roundWinnings + salamiBonus;
      return {
        ...p,
        hand: hands[i],
        sets: [[], [], [], [], []],
        discard: null,
        money: (p.money ?? 100) + totalGain - 4,
        winnings: 0,
      };
    });

    const winner = data.players.reduce((prev: any, curr: any) =>
      (curr.winnings || 0) > (prev.winnings || 0) ? curr : prev
    );

    const newDealer = winner.name || nextDealer || playerName;

    await setDoc(ref, {
      players: updatedPlayers,
      currentMiniRound: 0,
      pot: 0,
      dealer: newDealer,
      nextDealer: null,
    }, { merge: true });
  };

  const canDeal = (!dealer && playerName) || (roundComplete && dealer === playerName);

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Chosla - The Card Game</h1>
      {!playerName ? (
        <Lobby onJoin={setPlayerName} />
      ) : (
        <>
          {canDeal && (
            <button
              className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded"
              onClick={dealCards}
            >
              Deal Cards
            </button>
          )}
          <CardTable playerName={playerName} setNextDealer={setNextDealer} />
          {roundComplete && (
            <div className="mt-6 border-t pt-4">
              <h2 className="text-xl font-semibold mb-2">Leaderboard</h2>
              <ul>
                {leaderboard.map((player, i) => (
                  <li key={i} className="mb-1">
                    {i + 1}. {player.name || `Player ${i + 1}`} – ${player.money ?? 100}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </main>
  );
}
