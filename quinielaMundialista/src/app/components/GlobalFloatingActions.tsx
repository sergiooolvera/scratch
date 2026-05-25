'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { X, Check } from 'lucide-react';
import { picante } from '@/lib/spicy';

export function GlobalFloatingActions() {
  const { user, profile, spicyMode } = useAuth();
  
  // Modals States
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [copiedSupportCLABE, setCopiedSupportCLABE] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  
  // Toast State
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  const handleCopyCLABE = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('012180004701190246');
      setCopiedSupportCLABE(true);
      setTimeout(() => setCopiedSupportCLABE(false), 2000);
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) return;
    setFeedbackSending(true);
    try {
      const subject = picante(
        `Feedback QuiMundial (@${profile?.username || 'invitado'})`,
        `¡Chisme y Sugerencia QuiMundial! (@${profile?.username || 'invitado'})`,
        spicyMode
      );
      
      // 1. Guardar en Base de Datos (a través de nuestra API segura)
      const dbResponse = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: profile?.full_name || profile?.username || 'Usuario Invitado',
          email: user?.email || 'invitado@quimundial.com',
          message: feedbackText,
          subject: subject
        })
      });

      // 2. Enviar Correo Directo desde el Navegador (evitando bloqueos de Vercel/AWS de FormSubmit)
      const emailResponse = await fetch('https://formsubmit.co/ajax/sergio.olver@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: profile?.full_name || profile?.username || 'Usuario Invitado',
          email: 'noreply@quimundial.com',
          'Remitente Real': user?.email || 'invitado@quimundial.com',
          message: feedbackText,
          _subject: subject
        })
      });

      if (dbResponse.ok || emailResponse.ok) {
        showToast(picante(
          'Mensaje enviado con éxito. Gracias por sus sugerencias.',
          '⚽ ¡Golazo! Mensaje enviado al correo. ¡Gracias por el paro!',
          spicyMode
        ));
        setFeedbackText('');
        setShowFeedbackModal(false);
      } else {
        let errMsg = 'Error al enviar.';
        try {
          const data = await dbResponse.json();
          if (data?.error) errMsg = data.error;
        } catch (e) {}
        throw new Error(errMsg);
      }
    } catch (error: any) {
      console.error('Error sending feedback:', error);
      showToast(picante(
        'Error al enviar. Por favor inténtalo de nuevo.',
        '❌ ¡Híjole! Se nos ponchó el balón al intentar mandar el chisme. Vuelve a tirar.',
        spicyMode
      ));
    } finally {
      setFeedbackSending(false);
    }
  };

  return (
    <>
      {user && (
        <>
          <button
            onClick={() => setShowSupportModal(true)}
            className="floating-support-btn animate-pulse"
            title="Apoyar a la plataforma"
          >
            <span style={{ fontSize: '1.1rem' }}>☕</span>
            <span className="mobile-hide">Apoyar plataforma</span>
          </button>

          <button
            onClick={() => {
              setFeedbackText('');
              setShowFeedbackModal(true);
            }}
            className="floating-feedback-btn"
            title="Enviar sugerencias o comentarios"
          >
            <span style={{ fontSize: '1.1rem' }}>💬</span>
            <span className="mobile-hide">Sugerencias</span>
          </button>
        </>
      )}

      {/* Support / Donation Modal */}
      {showSupportModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(3, 7, 18, 0.65)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            padding: '20px'
          }} 
          onClick={() => setShowSupportModal(false)}
        >
          <div 
            className="glass-panel" 
            style={{
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px 20px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
              borderRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              position: 'relative'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setShowSupportModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>

            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '2px solid var(--accent-gold)',
              borderRadius: '50%',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-gold)',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.15)'
            }}>
              <span style={{ fontSize: '2rem' }}>🎁</span>
            </div>

            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: 900,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>
              {picante('Apoyar a QuiMundial ☕', '¡Cooperacha para la quiniela! ☕🌶️', spicyMode)}
            </h3>

            <p style={{
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: 0
            }}>
              {picante(
                'QuiMundial es una plataforma recreativa 100% gratuita. Sin embargo, los servidores en la nube, las bases de datos rápidas y los envíos automáticos de correos tienen costos fijos.',
                '¡QuiMundial es de la racita y 100% gratis, compadre! Pero mantener los servidores en la nube volando alto, la base de datos más rápida que el Chucky Lozano y los correos automáticos al pie del cañón cuesta sus buenos morlacos fijos.',
                spicyMode
              )}
              <br />
              <strong style={{ color: 'var(--accent-gold)', display: 'block', marginTop: '8px' }}>
                {picante(
                  'Si en tu posibilidad está donarnos unos pesos nos caerían súper bien para mantener el hosting, pero si no, con que uses la plataforma y nos recomiendes estará excelente.',
                  'Si te sobra una lanita o te anda yendo chido en la quiniela y nos quieres tirar un paro con unos pesitos, ¡nos caería de perlas para el chesco! Pero si andas en la lona, no hay falla, con que sigas jugando y nos recomiendes con toda la flota, ¡ya te la sabes que estás más que perdonado!',
                  spicyMode
                )}
              </strong>
            </p>

            {/* SPEI CLABE Transfer option */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid var(--border-glass)',
              borderRadius: '16px',
              padding: '16px',
              width: '100%',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Opción 1: Transferencia SPEI (Sin comisiones)
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
                <div style={{ lineHeight: 1.4 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>CLABE Interbancaria (BBVA)</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                    012 180 00470119024 6
                  </strong>
                </div>
                <button
                  onClick={handleCopyCLABE}
                  className="btn btn-secondary"
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    borderColor: copiedSupportCLABE ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-glass)',
                    color: copiedSupportCLABE ? 'var(--accent-neon-green)' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copiedSupportCLABE ? <Check size={12} /> : null}
                  <span>{copiedSupportCLABE ? '¡Copiado!' : 'Copiar CLABE'}</span>
                </button>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-glass)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Beneficiario: <strong style={{ color: 'var(--text-primary)' }}>Sergio Olvera</strong></span>
                <span>Banco: <strong style={{ color: 'var(--text-primary)' }}>BBVA</strong></span>
              </div>
            </div>

            {/* Alternative Links */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid var(--border-glass)',
              borderRadius: '16px',
              padding: '16px',
              width: '100%',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Opción 2: Pago rápido en línea
              </span>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href="https://link.mercadopago.com.mx/sergioolvera"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    textAlign: 'center',
                    background: '#009ee3',
                    borderColor: '#009ee3',
                    color: '#ffffff',
                    textDecoration: 'none'
                  }}
                >
                  💳 Mercado Pago
                </a>

                <a
                  href="https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=serrgio.olver@gmail.com&item_name=Apoyo%20Quiniela%20Mundialista&currency_code=MXN"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-gold"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    textAlign: 'center',
                    textDecoration: 'none'
                  }}
                >
                  🔵 PayPal Link
                </a>
              </div>
            </div>

            {/* Tip futbolero */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.03)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              borderRadius: '12px',
              padding: '12px 14px',
              width: '100%',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              textAlign: 'left',
              lineHeight: 1.4
            }}>
              💡 <strong>{picante('Tip futbolero de transferencia:', '💡 Tip futbolero matón:', spicyMode)}</strong> {picante(
                'Al realizar tu SPEI o pago, por favor pon en el concepto de pago tu nombre de usuario (@' + (profile?.username || 'user') + ') o la palabra "Apoyo" para mantener en orden las cuentas con el banco.',
                'Al hacer tu SPEI o pago, pon en el concepto tu nombre de usuario (@' + (profile?.username || 'user') + ') o la palabra "Apoyo" para que el banco no nos ande marcando fuera de juego.',
                spicyMode
              )}
            </div>

            <button
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '6px',
                fontWeight: 700
              }}
              onClick={() => setShowSupportModal(false)}
            >
              Cerrar Ventana
            </button>
          </div>
        </div>
      )}

      {/* Dedicated Suggestions / Feedback Modal */}
      {showFeedbackModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(3, 7, 18, 0.65)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            padding: '20px'
          }} 
          onClick={() => setShowFeedbackModal(false)}
        >
          <div 
            className="glass-panel" 
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '32px 24px',
              textAlign: 'center',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
              borderRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '18px',
              position: 'relative'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setShowFeedbackModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>

            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '2px solid var(--accent-blue)',
              borderRadius: '50%',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-blue)',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)'
            }}>
              <span style={{ fontSize: '2rem' }}>💬</span>
            </div>

            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: 900,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>
              {picante('Ayúdanos a Mejorar 🚀', '¡Suelta la sopa, compadre! 🌶️', spicyMode)}
            </h3>

            <p style={{
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: 0
            }}>
              {picante(
                'Apóyanos con algún comentario de qué te parece la página. ¿Qué cambiarías? ¿Qué quitarías? Tus ideas nos ayudan enormemente a mejorar.',
                '¿Qué tal se ve la quiniela? ¿Qué le cambiarías, qué le quitarías o si de plano ya nos volamos la barda? ¡Toda crítica chida nos ayuda a mejorar!',
                spicyMode
              )}
            </p>

            <textarea
              placeholder={picante(
                'Escribe aquí tus comentarios, sugerencias o quejas...',
                'Escribe aquí todo el chisme, ideas locas, quejas o porras...',
                spicyMode
              )}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              style={{
                width: '100%',
                minHeight: '120px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '0.88rem',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                textAlign: 'left'
              }}
            />

            <button
              onClick={handleSendFeedback}
              disabled={!feedbackText.trim() || feedbackSending}
              className="btn"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.88rem',
                fontWeight: 900,
                background: feedbackText.trim() ? 'var(--accent-blue)' : 'var(--text-muted)',
                borderColor: feedbackText.trim() ? 'var(--accent-blue)' : 'var(--text-muted)',
                color: '#ffffff',
                cursor: (feedbackText.trim() && !feedbackSending) ? 'pointer' : 'not-allowed',
                opacity: (feedbackText.trim() && !feedbackSending) ? 1 : 0.5,
                boxShadow: feedbackText.trim() ? '0 4px 12px rgba(59, 130, 246, 0.25)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {feedbackSending ? (
                <>
                  <div className="animate-spin" style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid #ffffff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%'
                  }}></div>
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <span>{picante('Enviar sugerencia', '¡Mandar chisme al correo! 🚀', spicyMode)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className="toast-msg" 
          style={{ 
            borderColor: 'var(--accent-blue)', 
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)',
            zIndex: 11000
          }}
        >
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
