// src/app/components/VendorCard.tsx
import React, { useState } from 'react';
import { ShieldCheck, Users, BadgeCheck, BadgeX } from 'lucide-react';
import ClientRow from './ClientRow';

interface Client {
  id: string;
  username: string | null;
  full_name: string | null;
  is_active: boolean;
}

interface Vendor {
  id: string;
  username: string | null;
  full_name: string | null;
  is_active: boolean;
  client_count: number;
  clients: Client[];
}

export default function VendorCard({ vendor }: { vendor: Vendor }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-panel" style={vendorCardStyle}>
      <div style={headerStyle} onClick={() => setExpanded(!expanded)}>
        <ShieldCheck size={20} style={{ color: 'var(--accent-vendor)' }} />
        <div style={{ flex: 1, marginLeft: '8px' }}>
          <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
            {vendor.full_name || vendor.username || 'Vendedor'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            @{vendor.username}
          </div>
        </div>
        <div style={badgeStyle}>
          {vendor.client_count} clientes
        </div>
        <div style={{ marginLeft: '8px' }}>{expanded ? '▲' : '▼'}</div>
      </div>
      {expanded && (
        <div style={{ marginTop: '12px', borderTop: '1px solid rgba(124,58,237,0.2)', paddingTop: '12px' }}>
          {vendor.clients.map((c) => (
            <ClientRow key={c.id} client={c} vendorId={vendor.id} />
          ))}
          {vendor.clients.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '8px' }}>
              No hay clientes para este vendedor.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const vendorCardStyle: React.CSSProperties = {
  border: '1px solid var(--bg-vendor-card)',
  background: 'var(--bg-vendor-card)',
  borderRadius: '12px',
  padding: '12px',
  marginBottom: '16px',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 4px 12px rgba(124,58,237,0.1)',
  transition: 'transform 0.2s',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
};

const badgeStyle: React.CSSProperties = {
  background: 'rgba(124,58,237,0.12)',
  color: 'var(--accent-vendor)',
  borderRadius: '8px',
  padding: '2px 8px',
  fontSize: '0.75rem',
  fontWeight: 600,
};
