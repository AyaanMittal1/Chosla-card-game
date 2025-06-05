import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { compareSets } from '../utils/cardEngine';

const GAME_ID = 'demo-game';

export function CardTable({ playerName, setNextDealer }: { playerName: string, setNextDealer: (name: string) => void }) {
  const [hand, setHand] = useState<string[]>([]);
  const [sets, setSets] = useState<string[][]>([[], [], [], [], []]);
  const [discard, setDiscard] = useState<string | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [pot, setPot] = useState<number>(0);
  const [currentMiniRound, setCurrentMiniRound] = useState<number>(0);

  useEffect(() => {
    const ref = doc(db, 'games', GAME_ID);
    const unsubscribe = onSnapshot(ref, (docSnap) => {
      const data = docSnap.data();
      if (data && data.players) {
        setPlayers(data.players);
        const me = data.players.find((p: any) => p.name === playerName);
        if (me) {
          setHand(me.hand || []);
          setSets(me.sets || [[], [], [], [], []]);
          setDiscard(me.discard || null);
        }
        setPot(data.pot || 0);
        setCurrentMiniRound(data.currentMiniRound || 0);
      }
    });
    return unsubscribe;
  }, [playerName]);

  const updateFirestore = async (updatedSets: string[][], updatedDiscard: string | null) => {
    const ref = doc(db, 'games', GAME_ID);
    const updatedPlayers = players.map((p) =>
      p.name === playerName ? { ...p, hand, sets: updatedSets, discard: updatedDiscard } : p
    );
    await setDoc(ref, {
      players: updatedPlayers
    }, { merge: true });
  };

  const moveCard = (card: string, targetSet: number) => {
    if (discard === card) setDiscard(null);
    const newSets = sets.map((s, i) => (i === targetSet ? [...s, card] : s.map(c => c !== card ? c : '')));
    const cleanedSets = newSets.map(s => s.filter(c => c !== ''));
    setSets(cleanedSets);
    setHand(prev => prev.filter(c => c !== card));
    updateFirestore(cleanedSets, discard);
  };

  const discardCard = (card: string) => {
    setDiscard(card);
    setHand(prev => prev.filter(c => c !== card));
    updateFirestore(sets, card);
  };

  const scoreMiniRound = async () => {
    if (players.length < 2) return;
    const scores = players.map((p, idx) => ({
      index: idx,
      set: p.sets[currentMiniRound] || [],
    })).sort((a, b) => compareSets(a.set, b.set));

    const winnerIndex = scores[scores.length - 1].index;
    const winner = players[winnerIndex];
    setNextDealer(winner.name);

    const updatedPlayers = players.map((p, idx) => ({
      ...p,
      winnings: (p.winnings || 0) + (idx === winnerIndex ? 1 : 0)
    }));

    const ref = doc(db, 'games', GAME_ID);
    await setDoc(ref, {
      players: updatedPlayers,
      pot: pot + players.length,
      currentMiniRound: currentMiniRound + 1
    }, { merge: true });
  };

  return (
    <div className="border p-4 rounded bg-gray-100">
      <h2 className="font-bold">Your Hand</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {hand.map(card => (
          <button key={card} onClick={() => discardCard(card)} className="p-2 bg-white border rounded shadow">
            {card}
          </button>
        ))}
      </div>

      <h2 className="font-bold">Sets</h2>
      {sets.map((set, index) => (
        <div key={index} className="mb-2">
          <label className="mr-2">Set {index + 1}:</label>
          <div className="inline-flex gap-2">
            {set.map(card => (
              <span key={card} className="p-2 bg-blue-100 rounded border">{card}</span>
            ))}
          </div>
        </div>
      ))}

      <h2 className="font-bold mt-4">Discard</h2>
      {discard ? <div className="p-2 bg-red-100 inline-block rounded">{discard}</div> : <p>None</p>}

      <button
        onClick={scoreMiniRound}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
      >
        Score Mini-Round {currentMiniRound + 1}
      </button>

      <div className="mt-4">
        <h3 className="font-bold">Pot: {pot}</h3>
        <ul>
          {players.map((p, i) => (
            <li key={i}>{p.name || `Player ${i + 1}`}: {p.winnings || 0}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
