import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, ArrowDownLeft, ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, CircleHelp, CreditCard, Download, FileText, Filter, LayoutDashboard, LogOut, Menu, MoreHorizontal, Plus, Search, Settings, Sparkles, Target, TrendingUp, Wallet, X, Pencil, Trash2, Utensils, Car, House, HeartPulse, GraduationCap, ShoppingBag, BriefcaseBusiness, Zap, SlidersHorizontal, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import './styles.css';

const CATEGORIES = ['Food & Dining','Transport','Bills & Utilities','Shopping','Education','Health','Entertainment','Housing','Income','Other'];
const CATEGORY_META = {
  'Food & Dining': { icon: Utensils, color: '#f59e0b', bg: '#fff4dc' },
  Transport: { icon: Car, color: '#4785f5', bg: '#eaf1ff' },
  'Bills & Utilities': { icon: Zap, color: '#8b5cf6', bg: '#f1eaff' },
  Shopping: { icon: ShoppingBag, color: '#e879a9', bg: '#ffeaf3' },
  Education: { icon: GraduationCap, color: '#0ea5a4', bg: '#e0f8f6' },
  Health: { icon: HeartPulse, color: '#ef6461', bg: '#ffe9e8' },
  Entertainment: { icon: Sparkles, color: '#9673f7', bg: '#f0eaff' },
  Housing: { icon: House, color: '#64748b', bg: '#edf1f5' },
  Income: { icon: BriefcaseBusiness, color: '#19a974', bg: '#e1f8ed' },
  Other: { icon: CreditCard, color: '#64748b', bg: '#edf1f5' }
};
const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const prettyDate = (value) => new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const currentMonth = new Date().toISOString().slice(0, 7);
const emptyForm = { title: '', amount: '', category: 'Food & Dining', date: new Date().toISOString().slice(0,10), note: '', type: 'expense' };

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [month, setMonth] = useState(currentMonth);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Overview');
  const [budget, setBudget] = useState(25000);
  const titleInputRef = useRef(null);
  const amountInputRef = useRef(null);
  const toastTimerRef = useRef(null);

  // Fetch starter records from a local mock API, then prefer the user's saved data.
  useEffect(() => {
    let active = true;
    async function loadTransactions() {
      try {
        setLoading(true);
        const saved = localStorage.getItem('pennywise_transactions_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (!Array.isArray(parsed)) throw new Error('Saved data is not a valid transaction list.');
          if (active) setTransactions(parsed);
        } else {
          const response = await fetch('/mock-expenses.json');
          if (!response.ok) throw new Error(`Mock API returned ${response.status}`);
          const data = await response.json();
          if (active) setTransactions(data);
        }
        if (active) setLoadError('');
      } catch (error) {
        if (active) setLoadError('We could not load sample transactions. You can still add your first transaction.');
        console.error('Could not load transactions:', error);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadTransactions();
    return () => { active = false; };
  }, []);

  // Persist every transaction change locally so data survives refreshes.
  useEffect(() => {
    if (!loading) {
      try { localStorage.setItem('pennywise_transactions_v1', JSON.stringify(transactions)); }
      catch (error) { console.error('Could not save transactions:', error); }
    }
  }, [transactions, loading]);

  useEffect(() => {
    if (modalOpen) window.setTimeout(() => titleInputRef.current?.focus(), 50);
    return undefined;
  }, [modalOpen]);

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), []);

  const notify = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 2800);
  }, []);

  const monthTransactions = useMemo(() => transactions.filter(t => (t.date || '').slice(0,7) === month), [transactions, month]);
  const totals = useMemo(() => monthTransactions.reduce((acc, t) => {
    if (t.type === 'income') acc.income += Number(t.amount) || 0;
    else acc.expenses += Number(t.amount) || 0;
    return acc;
  }, { income: 0, expenses: 0 }), [monthTransactions]);
  const balance = totals.income - totals.expenses;
  const budgetUsed = totals.expenses;
  const budgetPercent = budget > 0 ? Math.min(100, Math.round((budgetUsed / budget) * 100)) : 0;

  const filteredTransactions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...monthTransactions]
      .filter(t => filterType === 'all' || t.type === filterType)
      .filter(t => filterCategory === 'all' || t.category === filterCategory)
      .filter(t => !normalized || `${t.title} ${t.category} ${t.note || ''}`.toLowerCase().includes(normalized))
      .sort((a,b) => b.date.localeCompare(a.date));
  }, [monthTransactions, filterType, filterCategory, query]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map();
    monthTransactions.filter(t => t.type === 'expense').forEach(t => map.set(t.category, (map.get(t.category) || 0) + Number(t.amount)));
    return [...map.entries()].sort((a,b) => b[1]-a[1]).slice(0,5).map(([category, amount]) => ({ category, amount, percent: totals.expenses ? amount / totals.expenses * 100 : 0 }));
  }, [monthTransactions, totals.expenses]);

  const weeklyBars = useMemo(() => {
    const year = Number(month.slice(0,4)); const mon = Number(month.slice(5,7));
    const buckets = [0,0,0,0];
    monthTransactions.filter(t => t.type === 'expense').forEach(t => {
      const day = new Date(`${t.date}T12:00:00`).getDate();
      buckets[Math.min(3, Math.floor((day - 1) / 7))] += Number(t.amount) || 0;
    });
    const max = Math.max(...buckets, 1);
    return buckets.map((amount, i) => ({ label: ['Week 1','Week 2','Week 3','Week 4+'][i], amount, height: Math.max(5, amount/max*100) }));
  }, [monthTransactions, month]);

  const openCreate = useCallback(() => { setEditingId(null); setForm({ ...emptyForm, date: new Date().toISOString().slice(0,10) }); setFormError(''); setModalOpen(true); }, []);
  const openEdit = useCallback((transaction) => { setEditingId(transaction.id); setForm({ ...emptyForm, ...transaction, amount: String(transaction.amount) }); setFormError(''); setModalOpen(true); }, []);
  const closeModal = useCallback(() => { setModalOpen(false); setFormError(''); }, []);
  const handleFormChange = useCallback((event) => {
    const { name, value } = event.target;
    setForm(previous => ({ ...previous, [name]: value }));
  }, []);
  const handleSubmit = useCallback((event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.title.trim()) { setFormError('Please enter a transaction title.'); titleInputRef.current?.focus(); return; }
    if (!Number.isFinite(amount) || amount <= 0) { setFormError('Enter an amount greater than ₹0.'); amountInputRef.current?.focus(); return; }
    if (!form.date) { setFormError('Please choose a date.'); return; }
    const item = { ...form, id: editingId || (globalThis.crypto?.randomUUID?.() ?? `tx-${Date.now()}`), title: form.title.trim(), amount, note: form.note.trim(), type: form.type, category: form.type === 'income' ? 'Income' : form.category };
    setTransactions(previous => editingId ? previous.map(t => t.id === editingId ? item : t) : [item, ...previous]);
    setModalOpen(false); setForm(emptyForm); setFormError(''); notify(editingId ? 'Transaction updated successfully' : 'Transaction added successfully');
  }, [form, editingId, notify]);
  const deleteTransaction = useCallback((id) => {
    const target = transactions.find(t => t.id === id);
    if (!target) return;
    if (window.confirm(`Delete “${target.title}”? This cannot be undone.`)) {
      setTransactions(previous => previous.filter(t => t.id !== id));
      notify('Transaction deleted');
    }
  }, [transactions, notify]);
  const exportCSV = useCallback(() => {
    const rows = [['Title','Type','Category','Amount (INR)','Date','Note'], ...filteredTransactions.map(t => [t.title,t.type,t.category,t.amount,t.date,t.note || ''])];
    const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"','""')}"`).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `pennywise-transactions-${month}.csv`; link.click(); URL.revokeObjectURL(url);
    notify('CSV export downloaded');
  }, [filteredTransactions, month, notify]);

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Transactions', icon: Activity },
    { label: 'Budgets', icon: Target },
    { label: 'Reports', icon: FileText }
  ];
  const navClick = (label) => {
    setActiveNav(label); setMobileNavOpen(false);
    if (label === 'Transactions') document.getElementById('transactions')?.scrollIntoView({ behavior: 'smooth' });
    else if (label === 'Budgets') document.getElementById('budget-card')?.scrollIntoView({ behavior: 'smooth' });
    else if (label === 'Reports') document.getElementById('spending-card')?.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Wallet size={23}/></div><div><div className="brand-name">pennywise<span>.</span></div><div className="brand-caption">PERSONAL FINANCE</div></div><button className="icon-btn sidebar-close" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="nav-list" aria-label="Main navigation">{navItems.map(({label,icon:Icon}) => <button key={label} onClick={() => navClick(label)} className={`nav-item ${activeNav === label ? 'active' : ''}`}><Icon size={18}/><span>{label}</span>{label === 'Transactions' && <span className="nav-count">{transactions.length}</span>}</button>)}</nav>
      <div className="sidebar-divider"/>
      <div className="workspace-label">YOUR SPACE</div>
      <button className="nav-item" onClick={() => { setBudget(Number(prompt('Set your monthly expense budget (₹)', String(budget))) || budget); notify('Budget preference updated'); }}><Target size={18}/><span>Monthly budget</span></button>
      <button className="nav-item" onClick={() => notify('You are all caught up!')}><Bell size={18}/><span>Notifications</span><span className="notification-dot"/></button>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Sparkles size={17}/></div><strong>Small steps add up.</strong><p>Build a clearer picture of your money, one transaction at a time.</p><button onClick={() => notify('Tip: Add transactions regularly to keep your budget accurate.')}>Quick tip <ArrowRight size={14}/></button></div><button className="profile-row" onClick={() => notify('Demo profile · Local browser storage')}><div className="avatar">SS</div><div className="profile-info"><strong>Sujal Sahu</strong><span>Personal account</span></div><MoreHorizontal size={18} className="muted"/></button></div>
    </aside>
    {mobileNavOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}/>}
    <main className="main-content">
      <header className="topbar"><div className="breadcrumb"><button className="icon-btn mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={20}/></button><span>Workspace</span><span className="crumb-slash">/</span><strong>{activeNav}</strong></div><div className="topbar-actions"><div className="date-control"><CalendarDays size={16}/><input aria-label="Filter by month" type="month" value={month} onChange={e => setMonth(e.target.value)}/><ChevronDown size={14}/></div><button className="icon-btn notification-button" aria-label="Notifications" onClick={() => notify('You are all caught up!')}><Bell size={18}/><i/></button><div className="top-avatar">SS</div></div></header>
      <div className="page-wrap">
        <section className="welcome-row"><div><div className="eyebrow"><Sparkles size={14}/> YOUR MONEY, IN FOCUS</div><h1>Good things start <span>with clarity.</span></h1><p className="page-subtitle">Here’s how your money is looking this month.</p></div><button className="primary-btn" onClick={openCreate}><Plus size={18}/> Add transaction</button></section>
        {loadError && <div className="notice warning-notice"><AlertCircle size={17}/><span>{loadError}</span><button onClick={() => setLoadError('')} aria-label="Dismiss warning"><X size={16}/></button></div>}
        <section className="stats-grid" aria-label="Monthly financial summary">
          <article className="stat-card balance-card"><div className="stat-top"><span className="stat-label">Net balance</span><span className="stat-icon purple"><Wallet size={18}/></span></div><div className="stat-value">{money(balance)}</div><div className="stat-footer"><span className={`trend-pill ${balance >= 0 ? 'positive' : 'negative'}`}><TrendingUp size={13}/>{balance >= 0 ? 'In the green' : 'Overspent'}</span><span className="stat-footnote">Income − expenses</span></div><div className="card-orb orb-one"/><div className="card-orb orb-two"/></article>
          <article className="stat-card"><div className="stat-top"><span className="stat-label">Total income</span><span className="stat-icon green"><ArrowDownLeft size={18}/></span></div><div className="stat-value">{money(totals.income)}</div><div className="stat-footer"><span className="tiny-dot green-dot"/> <span className="stat-footnote">Money received this month</span></div><div className="mini-sparkline income-line"><svg viewBox="0 0 120 34" role="img" aria-label="Illustrative income trend"><path d="M2 27 C14 24,16 12,29 18 S48 27,60 12 S82 20,92 8 S108 12,118 2"/></svg></div></article>
          <article className="stat-card"><div className="stat-top"><span className="stat-label">Total expenses</span><span className="stat-icon coral"><ArrowUpRight size={18}/></span></div><div className="stat-value">{money(totals.expenses)}</div><div className="stat-footer"><span className="tiny-dot coral-dot"/><span className="stat-footnote">Money spent this month</span></div><div className="mini-sparkline expense-line"><svg viewBox="0 0 120 34" role="img" aria-label="Illustrative expense trend"><path d="M2 5 C14 9,19 5,30 16 S46 11,58 23 S76 13,88 24 S104 19,118 31"/></svg></div></article>
          <article className="stat-card"><div className="stat-top"><span className="stat-label">Savings rate</span><span className="stat-icon blue"><Target size={18}/></span></div><div className="stat-value">{totals.income > 0 ? Math.round((balance / totals.income) * 100) : 0}%</div><div className="stat-footer"><span className="stat-footnote">Of your income retained</span></div><div className="savings-track"><div style={{width:`${Math.max(0,Math.min(100,totals.income ? balance/totals.income*100 : 0))}%`}}/></div></article>
        </section>

        <section className="insights-grid">
          <article className="panel spending-panel" id="spending-card"><div className="panel-heading"><div><h2>Spending overview</h2><p>Where your money went</p></div><button className="subtle-select" onClick={() => setFilterType('expense')}>Expenses <ChevronDown size={14}/></button></div><div className="spending-content"><div className="donut-wrap"><div className="donut" style={{background: donutGradient(categoryBreakdown)}}><div className="donut-center"><span>Total spent</span><strong>{money(totals.expenses)}</strong><small>this month</small></div></div></div><div className="category-legend">{categoryBreakdown.length ? categoryBreakdown.map(item => { const meta = CATEGORY_META[item.category] || CATEGORY_META.Other; return <div className="legend-row" key={item.category}><span className="legend-dot" style={{background:meta.color}}/><span className="legend-name">{item.category}</span><strong>{money(item.amount)}</strong></div>; }) : <div className="empty-inline">No expenses for this month yet.</div>}</div></div><div className="panel-bottom-note"><span><span className="tiny-dot purple-dot"/> Top spending categories</span><button onClick={() => { setFilterType('expense'); document.getElementById('transactions')?.scrollIntoView({behavior:'smooth'}); }}>View transactions <ArrowRight size={14}/></button></div></article>
          <article className="panel budget-panel" id="budget-card"><div className="panel-heading"><div><h2>Monthly budget</h2><p>Keep your spending on track</p></div><button className="icon-btn" aria-label="Edit monthly budget" onClick={() => { const value = prompt('Set your monthly expense budget (₹)', String(budget)); if (value !== null && Number(value) > 0) { setBudget(Number(value)); notify('Monthly budget updated'); } }}><MoreHorizontal size={20}/></button></div><div className="budget-summary"><div><span className="muted-label">You've spent</span><strong>{money(budgetUsed)}</strong></div><div className="budget-right"><span className="muted-label">Monthly limit</span><strong>{money(budget)}</strong></div></div><div className="budget-progress"><div className={budgetPercent >= 100 ? 'over-budget' : ''} style={{width:`${budgetPercent}%`}}/></div><div className="budget-progress-labels"><span>{budgetPercent}% used</span><span>{money(Math.max(0,budget-budgetUsed))} left</span></div><div className={`budget-message ${budgetPercent >= 100 ? 'budget-danger' : budgetPercent >= 80 ? 'budget-warn' : ''}`}><span className="budget-message-icon">{budgetPercent >= 80 ? <AlertCircle size={16}/> : <CheckCircle2 size={16}/>}</span><span>{budgetPercent >= 100 ? 'You’ve reached your monthly budget. Review spending before adding more.' : budgetPercent >= 80 ? 'You’re getting close to your limit. Keep an eye on the next few purchases.' : 'You’re on track. Keep it up — consistency beats perfection.'}</span></div><div className="budget-footer"><span><span className="tiny-dot blue-dot"/> Monthly spending limit</span><button onClick={() => { const value = prompt('Set your monthly expense budget (₹)', String(budget)); if (value !== null && Number(value) > 0) { setBudget(Number(value)); notify('Monthly budget updated'); } }}>Adjust budget <ArrowRight size={14}/></button></div></article>
        </section>

        <section className="panel activity-panel" id="transactions"><div className="activity-heading"><div><div className="heading-with-icon"><div className="section-icon"><Activity size={18}/></div><div><h2>Recent transactions</h2><p>Your latest money movements, all in one place.</p></div></div></div><button className="outline-btn" onClick={exportCSV}><Download size={16}/> Export CSV</button></div>
          <div className="filters-row"><label className="search-field"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search transactions..." aria-label="Search transactions"/><kbd>⌘ K</kbd></label><div className="filter-controls"><label className="filter-select"><Filter size={15}/><select value={filterType} onChange={e => setFilterType(e.target.value)} aria-label="Filter transaction type"><option value="all">All types</option><option value="expense">Expenses</option><option value="income">Income</option></select></label><label className="filter-select"><SlidersHorizontal size={15}/><select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} aria-label="Filter category"><option value="all">All categories</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></label></div></div>
          <div className="table-wrap"><table><thead><tr><th>TRANSACTION</th><th>CATEGORY</th><th>DATE</th><th>AMOUNT</th><th aria-label="Actions"/></tr></thead><tbody>{loading ? <tr><td colSpan="5"><div className="table-empty"><span className="loader"/>Loading transactions…</div></td></tr> : filteredTransactions.length ? filteredTransactions.map(t => <TransactionRow key={t.id} transaction={t} onEdit={openEdit} onDelete={deleteTransaction}/>) : <tr><td colSpan="5"><div className="table-empty"><div className="empty-illustration"><Search size={23}/></div><strong>No transactions found</strong><span>Try another search or add a transaction to get started.</span><button className="text-btn" onClick={() => { setQuery(''); setFilterType('all'); setFilterCategory('all'); }}>Clear filters</button></div></td></tr>}</tbody></table></div>
          <div className="table-footer"><span>Showing <strong>{filteredTransactions.length}</strong> of <strong>{monthTransactions.length}</strong> transactions</span><div className="table-footer-actions"><button className="text-btn" onClick={() => { setQuery(''); setFilterType('all'); setFilterCategory('all'); }}>Reset filters</button><button className="text-btn" onClick={openCreate}>Add new <Plus size={14}/></button></div></div>
        </section>
        <footer className="page-footer"><span>Made for a clearer financial life <span className="footer-heart">♥</span></span><span>Keep your data close — saved in this browser</span></footer>
      </div>
    </main>
    {modalOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) closeModal(); }}><section className="transaction-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><div className="modal-kicker">YOUR MONEY, YOUR CALL</div><h2 id="modal-title">{editingId ? 'Edit transaction' : 'Add a transaction'}</h2><p>Every little detail helps you see the bigger picture.</p></div><button className="icon-btn" onClick={closeModal} aria-label="Close dialog"><X size={19}/></button></div><form onSubmit={handleSubmit} noValidate><div className="type-switch" role="group" aria-label="Transaction type"><button type="button" className={form.type === 'expense' ? 'selected expense-selected' : ''} onClick={() => setForm(p => ({...p,type:'expense',category:p.category === 'Income' ? 'Food & Dining' : p.category}))}><ArrowUpRight size={16}/> Expense</button><button type="button" className={form.type === 'income' ? 'selected income-selected' : ''} onClick={() => setForm(p => ({...p,type:'income',category:'Income'}))}><ArrowDownLeft size={16}/> Income</button></div><div className="form-grid"><label className="form-field full-field"><span>Transaction title <b>*</b></span><input ref={titleInputRef} name="title" value={form.title} onChange={handleFormChange} placeholder="e.g. Weekly groceries" maxLength="80" required/></label><label className="form-field"><span>Amount (₹) <b>*</b></span><div className="amount-input"><span>₹</span><input ref={amountInputRef} name="amount" value={form.amount} onChange={handleFormChange} placeholder="0.00" type="number" min="0.01" step="0.01" required/></div></label><label className="form-field"><span>Date <b>*</b></span><input name="date" value={form.date} onChange={handleFormChange} type="date" required/></label><label className="form-field full-field"><span>Category</span><select name="category" value={form.type === 'income' ? 'Income' : form.category} onChange={handleFormChange} disabled={form.type === 'income'}>{CATEGORIES.filter(c => form.type === 'income' ? c === 'Income' : c !== 'Income').map(c => <option key={c}>{c}</option>)}</select></label><label className="form-field full-field"><span>Note <small>OPTIONAL</small></span><textarea name="note" value={form.note} onChange={handleFormChange} placeholder="Add a little context..." rows="3" maxLength="240"/></label></div>{formError && <div className="form-error"><AlertCircle size={15}/>{formError}</div>}<div className="modal-actions"><button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button><button type="submit" className="primary-btn"><Check size={17}/>{editingId ? 'Save changes' : 'Add transaction'}</button></div></form></section></div>}
    {toast && <div className="toast" role="status"><CheckCircle2 size={18}/><span>{toast}</span><button onClick={() => setToast('')} aria-label="Dismiss notification"><X size={15}/></button></div>}
  </div>;
}

function donutGradient(items) {
  if (!items.length) return 'conic-gradient(#e9eaf1 0deg 360deg)';
  const colors = items.map(i => CATEGORY_META[i.category]?.color || CATEGORY_META.Other.color);
  let start = 0;
  const stops = items.map((item, index) => { const end = start + item.percent * 3.6; const segment = `${colors[index]} ${start}deg ${end}deg`; start = end; return segment; });
  if (start < 360) stops.push(`#edf0f5 ${start}deg 360deg`);
  return `conic-gradient(${stops.join(',')})`;
}

const TransactionRow = memo(function TransactionRow({ transaction: t, onEdit, onDelete }) {
  const meta = CATEGORY_META[t.category] || CATEGORY_META.Other;
  const Icon = meta.icon;
  return <tr><td><div className="transaction-cell"><div className="transaction-icon" style={{color:meta.color,background:meta.bg}}><Icon size={18}/></div><div className="transaction-text"><strong>{t.title}</strong><span>{t.note || (t.type === 'income' ? 'Money received' : 'Expense')}</span></div></div></td><td><span className="category-pill"><i style={{background:meta.color}}/>{t.category}</span></td><td className="date-cell">{prettyDate(t.date)}</td><td><strong className={`amount-cell ${t.type === 'income' ? 'income-amount' : ''}`}>{t.type === 'income' ? '+' : '−'}{money(t.amount)}</strong></td><td><div className="row-actions"><button aria-label={`Edit ${t.title}`} title="Edit transaction" onClick={() => onEdit(t)}><Pencil size={15}/></button><button aria-label={`Delete ${t.title}`} title="Delete transaction" onClick={() => onDelete(t.id)}><Trash2 size={15}/></button></div></td></tr>;
});

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
