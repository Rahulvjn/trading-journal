// app.js - Trading Journal Data Persistence & UI Logic

const STORAGE_KEY = 'tradingJournalTrades';

// Load trades from localStorage or start empty
function loadTrades() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading trades from localStorage', err);
    return [];
  }
}

// Save trades array to localStorage
function saveTrades(tradesArray) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tradesArray));
  } catch (err) {
    console.error('Error saving trades to localStorage', err);
  }
}

// Global trades array
let trades = loadTrades();

// Render trade history table (implement your own UI rendering logic)
function renderTradeHistory() {
  const tbody = document.getElementById('tradeHistoryBody');
  if (!tbody) return; // Defensive
  tbody.innerHTML = '';

  trades.forEach(trade => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${trade.date} ${trade.time}</td>
      <td>${trade.pair}</td>
      <td>${trade.direction}</td>
      <td>${trade.entryPrice.toFixed(4)}</td>
      <td>${trade.exitPrice.toFixed(4)}</td>
      <td>${trade.positionSize}</td>
      <td>${trade.pnl.toFixed(2)}</td>
      <td>${trade.emotion}</td>
      <td>
        <button type="button" onclick="deleteTrade(${trade.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Render dashboard stats (implement your own logic as needed)
function renderDashboard() {
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.pnl > 0).length;
  const winRate = totalTrades ? ((wins / totalTrades) * 100).toFixed(2) : '0.00';

  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0).toFixed(2);

  const winRateElem = document.getElementById('winRate');
  const totalPnlElem = document.getElementById('totalPnl');
  const totalTradesElem = document.getElementById('totalTrades');

  if(winRateElem) winRateElem.textContent = `${winRate}%`;
  if(totalPnlElem) totalPnlElem.textContent = `${totalPnl}`;
  if(totalTradesElem) totalTradesElem.textContent = `${totalTrades}`;
}

// Calculate P&L for the trade
function calculatePnL(entryPrice, exitPrice, size, direction) {
  const diff = direction === 'Long' ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
  return diff * size;
}

// Handle form submit: add new trade
function handleTradeFormSubmit(event) {
  event.preventDefault();

  // Collect data from form inputs by id
  const date = document.getElementById('tradeDate').value;
  const time = document.getElementById('tradeTime').value;
  const pair = document.getElementById('tradePair').value;
  const direction = document.getElementById('tradeDirection').value;
  const entryPriceRaw = document.getElementById('entryPrice').value;
  const exitPriceRaw = document.getElementById('exitPrice').value;
  const sizeRaw = document.getElementById('positionSize').value;
  const emotion = document.getElementById('emotionalState').value || 'Neutral';
  const notes = document.getElementById('tradeNotes').value || '';

  // Validate
  if(!date || !time || !pair || !direction || !entryPriceRaw || !exitPriceRaw || !sizeRaw) {
    alert('Please fill in all required fields!');
    return;
  }

  const entryPrice = parseFloat(entryPriceRaw);
  const exitPrice = parseFloat(exitPriceRaw);
  const positionSize = parseFloat(sizeRaw);

  if(isNaN(entryPrice) || isNaN(exitPrice) || isNaN(positionSize)) {
    alert('Entry, Exit Prices and Position Size must be valid numbers.');
    return;
  }

  // Calculate PnL
  const pnl = calculatePnL(entryPrice, exitPrice, positionSize, direction);

  const trade = {
    id: Date.now(),          // unique id based on timestamp
    date,
    time,
    pair,
    direction,
    entryPrice,
    exitPrice,
    positionSize,
    pnl,
    emotion,
    notes
  };

  trades.unshift(trade);    // add newest on top
  saveTrades(trades);
  renderTradeHistory();
  renderDashboard();

  event.target.reset();
}

// Delete a trade by ID
function deleteTrade(id) {
  trades = trades.filter(t => t.id !== id);
  saveTrades(trades);
  renderTradeHistory();
  renderDashboard();
}

// Initialize app
function initApp() {
  // Attach form submit handler
  const form = document.getElementById('tradeForm');
  if(form){
    form.addEventListener('submit', handleTradeFormSubmit);
  }

  renderTradeHistory();
  renderDashboard();
}

// Run after DOM loaded
window.addEventListener('DOMContentLoaded', initApp);
