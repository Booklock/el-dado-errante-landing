const TOTAL = 10;

const DICE = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export default function StampCard({ count, compact = false }) {
  const filled = Math.min(count, TOTAL);
  const done   = filled >= TOTAL;
  const left   = TOTAL - filled;

  return (
    <div className={`stamp-card${compact ? " stamp-card-compact" : ""}`}>
      <div className="stamp-card-header">
        <div>
          <p className="stamp-card-title">🎁 Cliente frecuente</p>
          {!compact && (
            <p className="stamp-card-subtitle">
              {done
                ? "¡Felicitaciones! Ganaste un juego sorpresa 🎉"
                : `${left === 1 ? "Te falta 1 alquiler" : `Te faltan ${left} alquileres`} para tu sorpresa`}
            </p>
          )}
        </div>
        <span className="stamp-card-count">{filled}<span className="stamp-card-count-total">/{TOTAL}</span></span>
      </div>

      <div className="stamp-grid">
        {Array.from({ length: TOTAL }, (_, i) => {
          const isFilled = i < filled;
          const isLast   = i === filled - 1;
          return (
            <div
              key={i}
              className={`stamp-slot${isFilled ? " stamp-filled" : ""}${isLast && !done ? " stamp-latest" : ""}${done && isFilled ? " stamp-done" : ""}`}
              style={isFilled ? { animationDelay: `${i * 0.07}s` } : {}}
              title={isFilled ? `Alquiler #${i + 1}` : `Alquiler #${i + 1} — pendiente`}
            >
              {isFilled
                ? <span className="stamp-icon">{DICE[i % DICE.length]}</span>
                : <span className="stamp-empty-num">{i + 1}</span>}
            </div>
          );
        })}
      </div>

      {done && (
        <a
          className="stamp-reward-btn"
          href="https://wa.me/50687717880?text=Hola%21+Complet%C3%A9+mis+10+alquileres+y+quiero+reclamar+mi+juego+sorpresa+%F0%9F%8E%B2"
          target="_blank"
          rel="noopener noreferrer"
        >
          🎲 Reclamar mi juego sorpresa
        </a>
      )}
    </div>
  );
}
