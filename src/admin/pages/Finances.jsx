import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { fmtDate } from "../../lib/formatDate";

const PERIODS = [
  { key: "month",  label: "Este mes" },
  { key: "prev",   label: "Mes anterior" },
  { key: "year",   label: "Este año" },
  { key: "all",    label: "Todo" },
];

function fmt(n) {
  return `₡${Number(n ?? 0).toLocaleString("es-CR")}`;
}

function periodRange(key) {
  const now = new Date();
  if (key === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return [start.toISOString().split("T")[0], end.toISOString().split("T")[0]];
  }
  if (key === "prev") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end   = new Date(now.getFullYear(), now.getMonth(), 0);
    return [start.toISOString().split("T")[0], end.toISOString().split("T")[0]];
  }
  if (key === "year") {
    return [`${now.getFullYear()}-01-01`, `${now.getFullYear()}-12-31`];
  }
  return [null, null];
}

function inPeriod(dateStr, period) {
  const [from, to] = periodRange(period);
  if (!from) return true;
  return dateStr >= from && dateStr <= to;
}

function SummaryCard({ label, value, color, sub }) {
  return (
    <div className="fin-summary-card">
      <p className="fin-summary-label">{label}</p>
      <p className="fin-summary-value" style={{ color }}>{value}</p>
      {sub && <p className="fin-summary-sub">{sub}</p>}
    </div>
  );
}

function AddExpenseForm({ onAdded }) {
  const [form,    setForm]    = useState({ amount: "", description: "", date: new Date().toISOString().split("T")[0] });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.amount || isNaN(Number(form.amount))) { setError("Ingresá un monto válido."); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.from("expenses").insert({
      amount:      Number(form.amount),
      description: form.description || null,
      date:        form.date,
    });
    if (error) {
      setError("No se pudo guardar el gasto.");
    } else {
      setForm({ amount: "", description: "", date: new Date().toISOString().split("T")[0] });
      onAdded();
    }
    setLoading(false);
  }

  return (
    <form className="fin-expense-form card" onSubmit={handleSubmit}>
      <h3 className="fin-section-title" style={{ marginTop: 0 }}>Registrar gasto</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Monto (₡) *</label>
          <input name="amount" type="number" min="0" step="50" required
            value={form.amount} onChange={handleChange} placeholder="5000" />
        </div>
        <div className="form-group">
          <label>Fecha *</label>
          <input name="date" type="date" required value={form.date} onChange={handleChange} />
        </div>
      </div>
      <div className="form-group">
        <label>Detalle</label>
        <input name="description" type="text" value={form.description} onChange={handleChange}
          placeholder="Ej: Envío por correo, insumos, publicidad..." />
      </div>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn btn-primary btn-sm" disabled={loading} style={{ alignSelf: "flex-end" }}>
        {loading ? "Guardando..." : "Agregar gasto"}
      </button>
    </form>
  );
}

export default function Finances() {
  const [period,   setPeriod]   = useState("month");
  const [incomes,  setIncomes]  = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    const [{ data: resv }, { data: exp }] = await Promise.all([
      supabase.from("reservations")
        .select("id, end_date, total_price, game_ids, clients(name), games(name, price)")
        .eq("status", "returned")
        .order("end_date", { ascending: false }),
      supabase.from("expenses")
        .select("*")
        .order("date", { ascending: false }),
    ]);
    setIncomes(resv ?? []);
    setExpenses(exp ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteExpense(id) {
    if (!confirm("¿Eliminar este gasto?")) return;
    await supabase.from("expenses").delete().eq("id", id);
    load();
  }

  const filteredIncomes  = incomes.filter(r => inPeriod(r.end_date, period));
  const filteredExpenses = expenses.filter(e => inPeriod(e.date, period));

  const totalIncome  = filteredIncomes.reduce((s, r) => s + (r.total_price ?? r.games?.price ?? 0), 0);
  const totalExpense = filteredExpenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  const netBalance   = totalIncome - totalExpense;

  if (loading) return <div className="admin-page-loading">Cargando...</div>;

  return (
    <div className="admin-page">
      <div className="admin-top-bar">
        <h1 className="admin-page-title" style={{ margin: 0 }}>Finanzas</h1>
        <div className="fin-period-tabs">
          {PERIODS.map(p => (
            <button key={p.key} className={`fin-period-btn${period === p.key ? " active" : ""}`}
              onClick={() => setPeriod(p.key)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resumen */}
      <div className="fin-summary-grid">
        <SummaryCard
          label="Ingresos"
          value={fmt(totalIncome)}
          color="#065f46"
          sub={`${filteredIncomes.length} reserva${filteredIncomes.length !== 1 ? "s" : ""} completada${filteredIncomes.length !== 1 ? "s" : ""}`}
        />
        <SummaryCard
          label="Gastos"
          value={fmt(totalExpense)}
          color="#991b1b"
          sub={`${filteredExpenses.length} gasto${filteredExpenses.length !== 1 ? "s" : ""}`}
        />
        <SummaryCard
          label="Balance neto"
          value={fmt(netBalance)}
          color={netBalance >= 0 ? "#065f46" : "#991b1b"}
          sub={netBalance >= 0 ? "Positivo ✅" : "Negativo ⚠️"}
        />
      </div>

      <div className="fin-columns">
        {/* Ingresos */}
        <div className="fin-col">
          <h2 className="fin-section-title">Ingresos</h2>
          <p className="fin-col-hint">Reservas marcadas como devueltas en el período seleccionado.</p>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Juego</th>
                  <th>Fecha devolución</th>
                  <th style={{ textAlign: "right" }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncomes.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--color-text-soft)", padding: "1.5rem" }}>Sin ingresos en este período</td></tr>
                )}
                {filteredIncomes.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.clients?.name ?? "—"}</td>
                    <td style={{ fontSize: "0.85rem" }}>
                      {r.game_ids?.length > 1
                        ? <span>Pack ({r.game_ids.length} juegos)</span>
                        : r.games?.name ?? "—"}
                    </td>
                    <td style={{ fontSize: "0.85rem", color: "var(--color-text-soft)" }}>{fmtDate(r.end_date)}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "#065f46" }}>
                      {fmt(r.total_price ?? r.games?.price)}
                    </td>
                  </tr>
                ))}
                {filteredIncomes.length > 0 && (
                  <tr style={{ borderTop: "2px solid var(--color-border)", background: "#f0fdf4" }}>
                    <td colSpan={3} style={{ fontWeight: 700, fontSize: "0.875rem" }}>Total</td>
                    <td style={{ textAlign: "right", fontWeight: 800, color: "#065f46" }}>{fmt(totalIncome)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gastos */}
        <div className="fin-col">
          <h2 className="fin-section-title">Gastos</h2>
          <AddExpenseForm onAdded={load} />
          <div className="admin-table-wrapper" style={{ marginTop: "1.25rem" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Detalle</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: "right" }}>Monto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--color-text-soft)", padding: "1.5rem" }}>Sin gastos en este período</td></tr>
                )}
                {filteredExpenses.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontSize: "0.875rem" }}>{e.description ?? <em style={{ color: "var(--color-text-soft)" }}>Sin detalle</em>}</td>
                    <td style={{ fontSize: "0.85rem", color: "var(--color-text-soft)" }}>{fmtDate(e.date)}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "#991b1b" }}>{fmt(e.amount)}</td>
                    <td>
                      <button className="btn-danger" style={{ fontSize: "0.7rem", padding: "3px 8px" }}
                        onClick={() => deleteExpense(e.id)}>✕</button>
                    </td>
                  </tr>
                ))}
                {filteredExpenses.length > 0 && (
                  <tr style={{ borderTop: "2px solid var(--color-border)", background: "#fff5f5" }}>
                    <td colSpan={2} style={{ fontWeight: 700, fontSize: "0.875rem" }}>Total</td>
                    <td style={{ textAlign: "right", fontWeight: 800, color: "#991b1b" }}>{fmt(totalExpense)}</td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
