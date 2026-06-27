// src/app/components/ClientRow.tsx
import React from 'react';
import { BadgeCheck, BadgeX } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Client {
  id: string;
  username: string | null;
  full_name: string | null;
  is_active: boolean;
}

export default function ClientRow({ client, vendorId }: { client: Client; vendorId: string }) {
  const toggleActive = async () => {
    try {
      const { error } = await supabase
        .from('qui_profiles')
        .update({ is_active: !client.is_active })
        .eq('id', client.id);
      if (error) throw error;
      // Optionally refetch data from parent; omitted for brevity.
    } catch (e) {
      console.error('Error toggling client activation', e);
    }
  };

  return (
    <div className="client-row" style={rowStyle}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {client.full_name || client.username || 'Cliente'}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          @{client.username}
        </div>
      </div>
      <div style={{ marginRight: '8px' }}>
        {client.is_active ? (
          <BadgeCheck size={16} style={{ color: 'var(--accent-neon-green)' }} />
        ) : (
          <BadgeX size={16} style={{ color: 'var(--accent-red)' }} />
        )}
      </div>
      <button onClick={toggleActive} className="btn btn-gold" style={btnStyle}>
        {client.is_active ? 'Desactivar' : 'Activar'}
      </button>
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 0',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
};

const btnStyle: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: '0.75rem',
  background: 'rgba(255,215,0,0.15)',
  border: '1px solid rgba(255,215,0,0.3)',
  color: '#FBBF24',
  borderRadius: '4px',
};
