import { useState } from 'react';
import { calcEmi, emiSchedule } from '../lib/emi';
import { inr, fmtDate, todayISO } from '../lib/format';
import { RATE_TYPE_LABELS, type RateType } from '../types';
import { Page, Card } from '../components/ui';

const RATE_TYPES = Object.keys(RATE_TYPE_LABELS) as RateType[];

export default function Calculator() {
  const [principal, setPrincipal] = useState('100000');
  const [rate, setRate] = useState('2');
  const [rateType, setRateType] = useState<RateType>('monthly');
  const [tenure, setTenure] = useState('12');

  const p = parseFloat(principal) || 0;
  const r = parseFloat(rate) || 0;
  const n = parseInt(tenure, 10) || 0;
  const emi = calcEmi(p, r, rateType, n);
  const schedule = emi > 0 && n > 0 ? emiSchedule(p, r, rateType, n, todayISO()) : [];
  const totalInterest = schedule.reduce((s, row) => s + row.interest, 0);

  return (
    <Page title="EMI calculator" subtitle="Reducing-balance & flat-rate estimates">
      <Card>
        <label className="field">
          <span>Principal (₹)</span>
          <input type="number" min="0" value={principal} onChange={(e) => setPrincipal(e.target.value)} inputMode="decimal" />
        </label>
        <div className="grid2">
          <label className="field">
            <span>Interest rate</span>
            <input type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
          </label>
          <label className="field">
            <span>Rate type</span>
            <select value={rateType} onChange={(e) => setRateType(e.target.value as RateType)}>
              {RATE_TYPES.map((t) => (
                <option key={t} value={t}>{RATE_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>Tenure (months)</span>
          <input type="number" min="1" value={tenure} onChange={(e) => setTenure(e.target.value)} inputMode="numeric" />
        </label>
      </Card>

      {emi > 0 && (
        <>
          <Card className="stat hero">
            <span className="stat-label">Monthly EMI</span>
            <span className="stat-value">{inr(emi)}</span>
            <span className="stat-sub">
              Total interest {inr(totalInterest)} · Total payable {inr(emi * n)}
            </span>
          </Card>
          <Card>
            <h3 className="card-title">Repayment schedule</h3>
            <div className="table-wrap">
              <table className="sched">
                <thead>
                  <tr>
                    <th>#</th><th>Due</th><th>EMI</th><th>Principal</th><th>Interest</th><th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row) => (
                    <tr key={row.n}>
                      <td>{row.n}</td>
                      <td>{fmtDate(row.date)}</td>
                      <td>{inr(row.emi)}</td>
                      <td>{inr(row.principal)}</td>
                      <td>{inr(row.interest)}</td>
                      <td>{inr(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </Page>
  );
}
