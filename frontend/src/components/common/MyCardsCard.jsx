import React, { useState } from 'react';
import { CreditCard, Plus, Wifi, Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from './Modal';
import { useToast } from './Toast';

export const MyCardsCard = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [cards, setCards] = useState([
    {
      id: 1,
      bank: 'Artha Global',
      cardHolder: user?.name || 'Ethan Cole',
      cardNumber: '4829 •••• •••• 9104',
      expiry: '12/28',
      type: 'Visa',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardType, setNewCardType] = useState('Visa');

  const activeCard = cards[0];

  const handleAddCard = (e) => {
    e.preventDefault();
    if (!newCardNumber.trim()) {
      toast.error('Card number is required');
      return;
    }
    const last4 = newCardNumber.replace(/\s+/g, '').slice(-4) || '1234';
    const newEntry = {
      id: Date.now(),
      bank: 'Artha Platinum',
      cardHolder: user?.name || 'Ethan Cole',
      cardNumber: `•••• •••• •••• ${last4}`,
      expiry: newCardExpiry || '08/29',
      type: newCardType,
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)',
    };
    setCards([newEntry, ...cards]);
    toast.success('Card added to your wallet');
    setIsModalOpen(false);
    setNewCardNumber('');
    setNewCardExpiry('');
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="card-header" style={{ marginBottom: 0 }}>
        <h3 className="card-title" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
          My Cards
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {cards.length} Active
        </span>
      </div>

      {/* Styled Debit Card */}
      <div
        style={{
          width: '100%',
          height: '185px',
          borderRadius: '18px',
          background: activeCard.gradient,
          padding: '1.25rem 1.4rem',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 24px -6px rgba(99, 102, 241, 0.45)',
        }}
      >
        {/* Subtle background abstract shape */}
        <div
          style={{
            position: 'absolute',
            right: '-20px',
            bottom: '-20px',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            pointerEvents: 'none',
          }}
        />

        {/* Top Card Row: EMV Chip & Contactless */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              width: '38px',
              height: '28px',
              borderRadius: '5px',
              background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '16px',
                border: '1px solid rgba(0,0,0,0.2)',
                borderRadius: '3px',
              }}
            />
          </div>
          <Wifi size={20} style={{ transform: 'rotate(90deg)', opacity: 0.85 }} />
        </div>

        {/* Middle: Masked Number */}
        <div>
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.1em', opacity: 0.75, display: 'block', marginBottom: '2px' }}>
            DEBIT CARD
          </span>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.05rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            {activeCard.cardNumber}
          </div>
        </div>

        {/* Bottom Card Row: Holder Name & Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.7, letterSpacing: '0.05em' }}>
              Card Holder
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.02em' }}>
              {activeCard.cardHolder}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.7, letterSpacing: '0.05em' }}>
                Expires
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {activeCard.expiry}
              </div>
            </div>

            {/* Overlapping Mastercard circles or Visa mark */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.85)',
                }}
              />
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(245, 158, 11, 0.85)',
                  marginLeft: '-9px',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add New Card Button */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="btn btn-outline"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.65rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          borderRadius: 'var(--radius-md)',
          borderStyle: 'dashed',
        }}
      >
        <Plus size={16} />
        <span>Add new card</span>
      </button>

      {/* Add Card Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Debit / Credit Card"
      >
        <form onSubmit={handleAddCard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Card Number</label>
            <input
              type="text"
              placeholder="e.g. 4829 1048 2910 9482"
              value={newCardNumber}
              onChange={(e) => setNewCardNumber(e.target.value)}
              className="form-input"
              maxLength={19}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Expiry (MM/YY)</label>
              <input
                type="text"
                placeholder="12/28"
                value={newCardExpiry}
                onChange={(e) => setNewCardExpiry(e.target.value)}
                className="form-input"
                maxLength={5}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Card Network</label>
              <select
                value={newCardType}
                onChange={(e) => setNewCardType(e.target.value)}
                className="form-select"
              >
                <option value="Visa">Visa</option>
                <option value="Mastercard">Mastercard</option>
                <option value="RuPay">RuPay</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Card
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MyCardsCard;
