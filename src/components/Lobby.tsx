import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const GAME_ID = 'demo-game';

export function Lobby({ onJoin }: { onJoin: (name: string) => void }) {
  const [name, setName] = useState('');

  const joinGame = async () => {
    if (!name) return;
    const ref = doc(db, 'games', GAME_ID);
    const snapshot = await getDoc(ref);
    const data = snapshot.data();

    const existing = data?.players || [];
    const alreadyIn = existing.find((p: any) => p.name === name);
    if (!alreadyIn) {
      await setDoc(ref, {
        players: [...existing, { name, hand: [], sets: [[], [], [], [], []], money: 100, winnings: 0 }],
      }, { merge: true });
    }
    onJoin(name);
  };

  return (
    <div className="p-4 border rounded bg-white">
      <h2 className="text-lg font-semibold mb-2">Join Game</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
        className="border p-2 mr-2"
      />
      <button
        onClick={joinGame}
        className="px-4 py-2 bg-indigo-600 text-white rounded"
      >
        Join
      </button>
    </div>
  );
}
