'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { createVouchers } from '../../../../services/voucher-service';

export default function CreateVouchersPage() {
  const router = useRouter();
  const { federalStateId } = useParams<{ federalStateId: string }>();
  const [amount, setAmount] = useState(1000); // default 10.00 €
  const [count, setCount] = useState(1); // default 1 code
  const [createdBy, setCreatedBy] = useState('admin');
  const [comment, setComment] = useState('');
  const [months, setMonths] = useState(3); // default 3 months

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createVouchers(
        federalStateId,
        amount,
        months,
        createdBy,
        comment,
        count,
      );
      console.log('Voucher created:', result);
      router.push(`/vouchers/${federalStateId}`);
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <div>
      <h1>Neue Guthaben Codes erstellen für Bundesland {federalStateId}</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Erhöhungsbetrag (in Cent): </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value))}
            min={100}
            max={20000}
            required
          />
        </div>
        <div>
          <label>Dauer (in Monaten): </label>
          <input
            type="number"
            value={months}
            onChange={(e) => setMonths(parseInt(e.target.value))}
            min={1}
            max={12}
            required
          />
        </div>
        <div>
          <label>Anzahl der Codes: </label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            min={1}
            max={100}
            required
          />
        </div>
        <div>
          <label>Erstellt von: </label>
          <input type="text" value={createdBy} readOnly required />
        </div>
        <div>
          <label>Grund für die Erstellung: </label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} required />
        </div>
        <button type="submit">Codes erstellen</button>
      </form>
    </div>
  );
}
