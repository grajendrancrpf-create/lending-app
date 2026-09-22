import { useState } from 'react';
import { calcEmi, emiSchedule } from '../lib/emi';
import { inr, fmtDate, todayISO } from '../lib/format';
import { RATE_TYPE_LABELS, type RateType } from '../types';
import { Page, Card, Field, SegmentedControl, SectionHead } from '../components/ui';

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
    <Page eyebrow="Tools" title="EMI calculator" subtitle="Reducing-balance & flat-rate estimates">
      <Card>
        <Field label="Principal (₹)">
          <input type="number" min="0" value={principal} onChange={(e) => setPrincipal(e.target.value)} inputMode="decimal" placeholder="100000" />
        </Field>
        <div className="grid2">
          <Field label="Interest rate">
            <input type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" placeholder="2" />
          </Field>
          <Field label="Tenure (months)">
            <input type="number" min="1" value={tenure} onChange={(e) => setTenure(e.target.value)} inputMode="numeric" placeholder="12" />
          </Field>
        </div>
        <span className="field"><span>Rate type</span></span>
        <SegmentedControl<RateType>
          ariaLabel="Rate type"
          value={rateType}
          onChange={setRateType}
          options={RATE_TYPES.map((t) => ({ value: t, label: RATE_TYPE_LABELS[t] }))}
        />
      </Card>

      {emi > 0 && (
        <>
          <div className="hero">
            <span className="eyebrow">Monthly EMI</span>
            <div className="hero-amount">{inr(emi)}</div>
            <div className="hero-sub hero-sub-split">
              <span>Total interest <b>{inr(totalInterest)}</b></span>
              <span>Total payable <b>{inr(emi * n)}</b></span>
            </div>
          </div>
          <SectionHead title="Repayment schedule" />
          <Card>
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
