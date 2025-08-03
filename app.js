// Professional Trading Journal PWA Application
class TradingJournalPWA {
    constructor() {
        this.trades = [];
        this.currentTab = 'dashboard';
        this.sortConfig = { field: 'date', direction: 'desc' };
        this.filters = {};
        this.charts = {};
        this.settings = {
            sessionStart: '07:00',
            sessionEnd: '19:30'
        };
        
        // PWA specific properties
        this.deferredPrompt = null;
        this.installButton = null;
        this.userEngagement = {
            startTime: Date.now(),
            interactions: 0
        };
        
        this.init();
    }

    async init() {
        console.log('Initializing Trading Journal PWA...');
        
        // Register service worker first
        await this.registerServiceWorker();
        
        // Setup PWA install functionality - Show install banner immediately for demo
        this.setupPWAInstall();
        
        // Load data and setup UI
        this.loadData();
        this.setupEventListeners();
        this.startRealTimeUpdates();
        this.loadNews();
        
        // Initialize with sample data if no trades exist
        if (this.trades.length === 0) {
            this.loadSampleData();
        }
        
        // Initialize dashboard
        this.updateDashboard();
        this.updateTradeHistory();
        
        // Show install banner after 3 seconds for demo purposes
        setTimeout(() => {
            if (!this.deferredPrompt) {
                // Create a mock install prompt for demo
                this.showInstallBannerDemo();
            }
        }, 3000);
        
        console.log('Trading Journal PWA initialized successfully');
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                // Create and register service worker inline
                const swCode = `
                    const CACHE_NAME = 'trading-journal-v1';
                    const urlsToCache = [
                        '/',
                        '/index.html',
                        '/style.css',
                        '/app.js',
                        'https://cdn.jsdelivr.net/npm/chart.js',
                        'https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/9d92085f-c775-46d5-ab70-8f535ce651d8.png'
                    ];

                    self.addEventListener('install', (event) => {
                        console.log('Service Worker installing...');
                        event.waitUntil(
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    console.log('Service Worker caching files');
                                    return cache.addAll(urlsToCache);
                                })
                                .catch((error) => {
                                    console.error('Service Worker cache failed:', error);
                                })
                        );
                        self.skipWaiting();
                    });

                    self.addEventListener('activate', (event) => {
                        console.log('Service Worker activating...');
                        event.waitUntil(
                            caches.keys().then((cacheNames) => {
                                return Promise.all(
                                    cacheNames.map((cacheName) => {
                                        if (cacheName !== CACHE_NAME) {
                                            console.log('Service Worker deleting old cache:', cacheName);
                                            return caches.delete(cacheName);
                                        }
                                    })
                                );
                            })
                        );
                        self.clients.claim();
                    });

                    self.addEventListener('fetch', (event) => {
                        event.respondWith(
                            caches.match(event.request)
                                .then((response) => {
                                    if (response) {
                                        return response;
                                    }
                                    return fetch(event.request).catch(() => {
                                        if (event.request.destination === 'document') {
                                            return caches.match('/index.html');
                                        }
                                    });
                                })
                        );
                    });
                `;

                const blob = new Blob([swCode], { type: 'application/javascript' });
                const swUrl = URL.createObjectURL(blob);
                
                const registration = await navigator.serviceWorker.register(swUrl);
                console.log('Service Worker registered successfully:', registration.scope);
                
                // Clean up the blob URL
                URL.revokeObjectURL(swUrl);
                
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    setupPWAInstall() {
        this.installButton = document.getElementById('installButton');
        const installBanner = document.getElementById('installBanner');
        const dismissInstall = document.getElementById('dismissInstall');

        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('beforeinstallprompt event fired');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallBanner();
        });

        // Install button click handler
        if (this.installButton) {
            this.installButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleInstallClick();
            });
        }

        // Dismiss install banner
        if (dismissInstall) {
            dismissInstall.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideInstallBanner();
            });
        }

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed successfully');
            this.hideInstallBanner();
            this.showToast('App installed successfully! You can now use it offline.', 'success');
        });

        // Track user interactions
        document.addEventListener('click', () => {
            this.userEngagement.interactions++;
        });

        document.addEventListener('touchstart', () => {
            this.userEngagement.interactions++;
        });
    }

    showInstallBannerDemo() {
        // Show install banner for demo purposes
        const installBanner = document.getElementById('installBanner');
        if (installBanner) {
            installBanner.style.display = 'block';
            console.log('Demo install banner shown');
            this.showToast('PWA install functionality ready! Click "Install App" to test.', 'info');
        }
    }

    showInstallBanner() {
        const installBanner = document.getElementById('installBanner');
        if (installBanner) {
            installBanner.style.display = 'block';
            console.log('Install banner shown');
        }
    }

    hideInstallBanner() {
        const installBanner = document.getElementById('installBanner');
        if (installBanner) {
            installBanner.style.display = 'none';
        }
    }

    async handleInstallClick() {
        if (!this.deferredPrompt) {
            // Demo functionality when no real prompt is available
            this.showToast('Install prompt triggered! In a real PWA environment, this would open the native install dialog.', 'success');
            this.hideInstallBanner();
            return;
        }

        try {
            console.log('Triggering install prompt');
            this.deferredPrompt.prompt();
            
            const choiceResult = await this.deferredPrompt.userChoice;
            console.log('User choice:', choiceResult.outcome);
            
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
                this.showToast('Installing app...', 'success');
            } else {
                console.log('User dismissed the install prompt');
            }
            
            this.deferredPrompt = null;
            this.hideInstallBanner();
            
        } catch (error) {
            console.error('Error during install:', error);
            this.showToast('Install failed. Please try again.', 'error');
        }
    }

    loadSampleData() {
        const sampleTrades = [
            {
                id: Date.now() + 1,
                date: "2025-08-01",
                time: "09:30",
                pair: "XAUUSD",
                direction: "Long",
                entryPrice: 2045.50,
                exitPrice: 2055.25,
                positionSize: 0.1,
                stopLoss: 2040.00,
                takeProfit: 2060.00,
                pnl: 975.00,
                notes: "Strong bullish momentum, broke resistance at 2045 level",
                emotionalState: "Confident",
                timestamp: new Date('2025-08-01 09:30').getTime()
            },
            {
                id: Date.now() + 2,
                date: "2025-08-01",
                time: "14:45",
                pair: "EURJPY",
                direction: "Short",
                entryPrice: 165.80,
                exitPrice: 164.20,
                positionSize: 0.05,
                stopLoss: 166.50,
                takeProfit: 163.50,
                pnl: 800.00,
                notes: "Bearish divergence on RSI",
                emotionalState: "Neutral",
                timestamp: new Date('2025-08-01 14:45').getTime()
            },
            {
                id: Date.now() + 3,
                date: "2025-08-02",
                time: "11:00",
                pair: "USDJPY",
                direction: "Long",
                entryPrice: 149.25,
                exitPrice: 148.80,
                positionSize: 0.08,
                stopLoss: 148.50,
                takeProfit: 150.00,
                pnl: -360.00,
                notes: "False breakout, hit stop loss",
                emotionalState: "Anxious",
                timestamp: new Date('2025-08-02 11:00').getTime()
            }
        ];
        
        this.trades = sampleTrades;
        this.saveData();
        this.showToast('Sample trading data loaded successfully!', 'success');
    }

    setupEventListeners() {
        // Navigation - CRITICAL FIX: Proper event delegation
        const navButtons = document.querySelectorAll('.nav-btn');
        console.log('Setting up navigation buttons:', navButtons.length);
        
        navButtons.forEach((btn, index) => {
            const tab = btn.getAttribute('data-tab');
            console.log(`Button ${index}: ${tab}`);
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Navigation clicked:', tab);
                if (tab) {
                    this.switchTab(tab);
                }
            });
        });

        // Additional navigation buttons
        const otherNavButtons = document.querySelectorAll('[data-tab]:not(.nav-btn)');
        otherNavButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tab = btn.getAttribute('data-tab');
                if (tab) {
                    this.switchTab(tab);
                }
            });
        });

        // Trade form - CRITICAL: Prevent form submission reload
        const tradeForm = document.getElementById('tradeForm');
        if (tradeForm) {
            tradeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Form submitted');
                this.handleTradeSubmit(e);
            });
        }

        // Real-time P&L calculation
        const priceInputs = ['entryPrice', 'exitPrice', 'positionSize', 'tradePair', 'tradeDirection'];
        priceInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.calculateRealTimePnL());
                element.addEventListener('change', () => this.calculateRealTimePnL());
            }
        });

        // Form reset button
        const resetBtn = document.getElementById('resetForm');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.resetTradeForm();
            });
        }

        // Filters
        const filterInputs = ['filterStartDate', 'filterEndDate', 'filterPair', 'filterDirection', 'filterResult'];
        filterInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.applyFilters());
            }
        });

        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.clearFilters();
            });
        }

        // Table sorting
        document.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', (e) => {
                e.preventDefault();
                const sortField = e.target.getAttribute('data-sort');
                if (sortField) {
                    this.sortTable(sortField);
                }
            });
        });

        // Action buttons
        this.setupActionButtons();
        this.setupModalControls();
        this.setupSettingsControls();
        this.setDefaultDateTime();
    }

    setupActionButtons() {
        const buttonActions = [
            { id: 'exportCsv', action: () => this.exportCsv() },
            { id: 'exportData', action: () => this.exportData() },
            { id: 'importData', action: () => document.getElementById('importFile')?.click() },
            { id: 'clearData', action: () => this.confirmClearData() },
            { id: 'refreshBtn', action: () => this.refreshDashboard() },
            { id: 'refreshNews', action: () => this.loadNews() }
        ];

        buttonActions.forEach(({ id, action }) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    action();
                });
            }
        });

        // File import
        const importFile = document.getElementById('importFile');
        if (importFile) {
            importFile.addEventListener('change', (e) => this.importData(e));
        }
    }

    setupModalControls() {
        const modalOverlay = document.getElementById('modalOverlay');
        const modalClose = document.getElementById('modalClose');
        const modalCancel = document.getElementById('modalCancel');
        const toastClose = document.getElementById('toastClose');

        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.hideModal();
                }
            });
        }

        if (modalClose) {
            modalClose.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideModal();
            });
        }

        if (modalCancel) {
            modalCancel.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideModal();
            });
        }

        if (toastClose) {
            toastClose.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideToast();
            });
        }
    }

    setupSettingsControls() {
        const sessionStart = document.getElementById('sessionStart');
        const sessionEnd = document.getElementById('sessionEnd');
        
        if (sessionStart) {
            sessionStart.value = this.settings.sessionStart;
            sessionStart.addEventListener('change', (e) => {
                this.settings.sessionStart = e.target.value;
                this.saveSettings();
            });
        }
        
        if (sessionEnd) {
            sessionEnd.value = this.settings.sessionEnd;
            sessionEnd.addEventListener('change', (e) => {
                this.settings.sessionEnd = e.target.value;
                this.saveSettings();
            });
        }
    }

    switchTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        if (!tabName) {
            console.error('No tab name provided');
            return;
        }

        try {
            // Update navigation active state
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            const targetNavBtn = document.querySelector(`[data-tab="${tabName}"].nav-btn`);
            if (targetNavBtn) {
                targetNavBtn.classList.add('active');
            }

            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show target tab content
            const targetContent = document.getElementById(tabName);
            if (targetContent) {
                targetContent.classList.add('active');
            } else {
                console.error('Target tab content not found:', tabName);
                return;
            }

            this.currentTab = tabName;

            // Load content based on tab
            switch(tabName) {
                case 'dashboard':
                    this.updateDashboard();
                    break;
                case 'history':
                    this.updateTradeHistory();
                    break;
                case 'analytics':
                    this.updateAnalytics();
                    break;
                case 'news':
                    const newsList = document.getElementById('newsList');
                    if (!newsList || newsList.children.length === 0) {
                        this.loadNews();
                    }
                    break;
                case 'trades':
                    this.setDefaultDateTime();
                    break;
            }
            
        } catch (error) {
            console.error('Error switching tabs:', error);
            this.showToast('Error switching tabs', 'error');
        }
    }

    handleTradeSubmit(e) {
        console.log('Handling trade submission');
        
        try {
            const tradeData = {
                id: Date.now(),
                date: document.getElementById('tradeDate').value,
                time: document.getElementById('tradeTime').value,
                pair: document.getElementById('tradePair').value,
                direction: document.getElementById('tradeDirection').value,
                entryPrice: parseFloat(document.getElementById('entryPrice').value),
                exitPrice: parseFloat(document.getElementById('exitPrice').value),
                positionSize: parseFloat(document.getElementById('positionSize').value),
                stopLoss: parseFloat(document.getElementById('stopLoss').value) || null,
                takeProfit: parseFloat(document.getElementById('takeProfit').value) || null,
                emotionalState: document.getElementById('emotionalState').value,
                notes: document.getElementById('tradeNotes').value.trim(),
                timestamp: new Date(`${document.getElementById('tradeDate').value} ${document.getElementById('tradeTime').value}`).getTime()
            };

            // Validate required fields
            if (!this.validateTradeData(tradeData)) {
                return;
            }

            // Calculate P&L
            tradeData.pnl = this.calculatePnL(tradeData);

            // FIXED: Simplified trading hours validation - more permissive
            if (!this.isWithinTradingHours(tradeData.time)) {
                console.log('Trading hours validation failed, but allowing trade');
                // Don't block the trade, just warn
                this.showToast(`Note: Trade time is outside preferred hours (${this.settings.sessionStart} - ${this.settings.sessionEnd})`, 'warning');
            }

            // Save trade
            this.trades.unshift(tradeData);
            this.saveData();
            this.updateDashboard();
            this.updateTradeHistory();
            
            this.resetTradeForm();
            this.showToast('Trade saved successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving trade:', error);
            this.showToast('Error saving trade: ' + error.message, 'error');
        }
    }

    validateTradeData(data) {
        const required = ['date', 'time', 'pair', 'direction', 'entryPrice', 'exitPrice', 'positionSize', 'emotionalState'];
        
        for (let field of required) {
            if (!data[field] && data[field] !== 0) {
                this.showToast(`${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`, 'error');
                return false;
            }
        }

        if (data.entryPrice <= 0 || data.exitPrice <= 0 || data.positionSize <= 0) {
            this.showToast('Prices and position size must be greater than 0', 'error');
            return false;
        }

        return true;
    }

    calculatePnL(trade) {
        const { pair, direction, entryPrice, exitPrice, positionSize } = trade;
        let priceDiff = direction === 'Long' ? exitPrice - entryPrice : entryPrice - exitPrice;
        
        if (pair === 'XAUUSD') {
            return priceDiff * positionSize * 100; // Gold
        } else {
            return priceDiff * positionSize * 10000; // Forex pairs
        }
    }

    calculateRealTimePnL() {
        try {
            const pair = document.getElementById('tradePair')?.value;
            const direction = document.getElementById('tradeDirection')?.value;
            const entryPrice = parseFloat(document.getElementById('entryPrice')?.value);
            const exitPrice = parseFloat(document.getElementById('exitPrice')?.value);
            const positionSize = parseFloat(document.getElementById('positionSize')?.value);

            const pnlElement = document.getElementById('calculatedPnl');
            if (!pnlElement) return;

            if (pair && direction && entryPrice && exitPrice && positionSize) {
                const pnl = this.calculatePnL({ pair, direction, entryPrice, exitPrice, positionSize });
                pnlElement.textContent = `$${pnl.toFixed(2)}`;
                pnlElement.className = `pnl-value ${pnl >= 0 ? 'positive' : 'negative'}`;
            } else {
                pnlElement.textContent = '$0.00';
                pnlElement.className = 'pnl-value';
            }
        } catch (error) {
            console.error('Error calculating P&L:', error);
        }
    }

    // FIXED: Simplified and more robust time validation
    isWithinTradingHours(time) {
        try {
            if (!time) return true; // Allow if no time specified
            
            // Parse time in HH:MM format
            const timeMatch = time.match(/^(\d{1,2}):(\d{2})$/);
            if (!timeMatch) return true; // Allow if time format is unexpected
            
            const hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            
            // Validate basic time format
            if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                return false;
            }
            
            const timeInMinutes = hours * 60 + minutes;
            
            // Parse session times
            const [startHours, startMinutes] = this.settings.sessionStart.split(':').map(Number);
            const [endHours, endMinutes] = this.settings.sessionEnd.split(':').map(Number);
            
            const startInMinutes = startHours * 60 + startMinutes;
            const endInMinutes = endHours * 60 + endMinutes;
            
            return timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes;
        } catch (error) {
            console.error('Error validating trading hours:', error);
            return true; // Allow trade if validation fails
        }
    }

    resetTradeForm() {
        try {
            const form = document.getElementById('tradeForm');
            if (form) {
                form.reset();
                this.setDefaultDateTime();
                const pnlElement = document.getElementById('calculatedPnl');
                if (pnlElement) {
                    pnlElement.textContent = '$0.00';
                    pnlElement.className = 'pnl-value';
                }
            }
        } catch (error) {
            console.error('Error resetting form:', error);
        }
    }

    setDefaultDateTime() {
        try {
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().slice(0, 5);
            
            const dateInput = document.getElementById('tradeDate');
            const timeInput = document.getElementById('tradeTime');
            
            if (dateInput) dateInput.value = dateStr;
            if (timeInput) timeInput.value = timeStr;
        } catch (error) {
            console.error('Error setting default date/time:', error);
        }
    }

    updateDashboard() {
        try {
            this.updateMetrics();
            this.updatePnLChart();
            this.updateRecentTrades();
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    updateMetrics() {
        try {
            const totalTrades = this.trades.length;
            const winningTrades = this.trades.filter(t => t.pnl > 0).length;
            const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : 0;
            const totalPnl = this.trades.reduce((sum, t) => sum + t.pnl, 0);
            
            const today = new Date().toISOString().split('T')[0];
            const todayTrades = this.trades.filter(t => t.date === today);
            const todayPnl = todayTrades.reduce((sum, t) => sum + t.pnl, 0);

            this.updateElement('totalTrades', totalTrades.toString());
            this.updateElement('winRate', `${winRate}%`);
            this.updateElement('totalPnl', `$${totalPnl.toFixed(2)}`, totalPnl >= 0 ? 'positive' : 'negative');
            this.updateElement('todayPnl', `$${todayPnl.toFixed(2)}`, todayPnl >= 0 ? 'positive' : 'negative');
        } catch (error) {
            console.error('Error updating metrics:', error);
        }
    }

    updateElement(id, text, className = '') {
        try {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
                if (className) {
                    element.className = `metric-value ${className}`;
                }
            }
        } catch (error) {
            console.error(`Error updating element ${id}:`, error);
        }
    }

    updatePnLChart() {
        try {
            const ctx = document.getElementById('pnlChart');
            if (!ctx) return;

            if (this.charts.pnl) {
                this.charts.pnl.destroy();
            }

            const sortedTrades = [...this.trades].sort((a, b) => a.timestamp - b.timestamp);
            const cumulativeData = [];
            let cumulative = 0;

            sortedTrades.forEach((trade, index) => {
                cumulative += trade.pnl;
                cumulativeData.push({
                    x: index + 1,
                    y: cumulative
                });
            });

            this.charts.pnl = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'Cumulative P&L',
                        data: cumulativeData,
                        borderColor: '#1FB8CD',
                        backgroundColor: 'rgba(31, 184, 205, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 3,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Trade Number'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Cumulative P&L ($)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toFixed(2);
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error updating P&L chart:', error);
        }
    }

    updateRecentTrades() {
        try {
            const container = document.getElementById('recentTradesList');
            if (!container) return;

            const recentTrades = this.trades.slice(0, 5);
            
            if (recentTrades.length === 0) {
                container.innerHTML = '<div class="empty-state">No trades yet. Add your first trade!</div>';
                return;
            }

            container.innerHTML = recentTrades.map(trade => `
                <div class="trade-item">
                    <div class="trade-info">
                        <div class="trade-pair">${trade.pair}</div>
                        <div class="trade-direction ${trade.direction.toLowerCase()}">${trade.direction}</div>
                        <div class="trade-time">${trade.date} ${trade.time}</div>
                    </div>
                    <div class="trade-pnl ${trade.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}">
                        $${trade.pnl.toFixed(2)}
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error updating recent trades:', error);
        }
    }

    updateTradeHistory() {
        try {
            const tbody = document.getElementById('tradesTableBody');
            if (!tbody) return;

            let filteredTrades = this.applyTradeFilters();
            filteredTrades = this.sortTrades(filteredTrades);

            if (filteredTrades.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No trades match your criteria</td></tr>';
                return;
            }

            tbody.innerHTML = filteredTrades.map(trade => `
                <tr>
                    <td>${new Date(trade.date).toLocaleDateString()}</td>
                    <td>${trade.time}</td>
                    <td>${trade.pair}</td>
                    <td>
                        <span class="trade-direction ${trade.direction.toLowerCase()}">${trade.direction}</span>
                    </td>
                    <td>${trade.entryPrice.toFixed(5)}</td>
                    <td>${trade.exitPrice.toFixed(5)}</td>
                    <td class="${trade.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}">
                        $${trade.pnl.toFixed(2)}
                    </td>
                    <td>
                        <div class="trade-actions">
                            <button type="button" class="btn btn-secondary" onclick="app.deleteTrade(${trade.id})">Delete</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error updating trade history:', error);
        }
    }

    applyTradeFilters() {
        try {
            return this.trades.filter(trade => {
                const startDate = document.getElementById('filterStartDate')?.value;
                const endDate = document.getElementById('filterEndDate')?.value;
                const pair = document.getElementById('filterPair')?.value;
                const direction = document.getElementById('filterDirection')?.value;
                const result = document.getElementById('filterResult')?.value;

                if (startDate && trade.date < startDate) return false;
                if (endDate && trade.date > endDate) return false;
                if (pair && trade.pair !== pair) return false;
                if (direction && trade.direction !== direction) return false;
                if (result === 'profit' && trade.pnl <= 0) return false;
                if (result === 'loss' && trade.pnl >= 0) return false;

                return true;
            });
        } catch (error) {
            console.error('Error applying filters:', error);
            return this.trades;
        }
    }

    sortTrades(trades) {
        try {
            const { field, direction } = this.sortConfig;
            
            return trades.sort((a, b) => {
                let aVal = a[field];
                let bVal = b[field];

                if (field === 'date') {
                    aVal = new Date(aVal).getTime();
                    bVal = new Date(bVal).getTime();
                }

                if (aVal < bVal) return direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        } catch (error) {
            console.error('Error sorting trades:', error);
            return trades;
        }
    }

    sortTable(field) {
        try {
            if (this.sortConfig.field === field) {
                this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortConfig.field = field;
                this.sortConfig.direction = 'asc';
            }
            this.updateTradeHistory();
        } catch (error) {
            console.error('Error sorting table:', error);
        }
    }

    applyFilters() {
        this.updateTradeHistory();
    }

    clearFilters() {
        try {
            ['filterStartDate', 'filterEndDate', 'filterPair', 'filterDirection', 'filterResult'].forEach(id => {
                const element = document.getElementById(id);
                if (element) element.value = '';
            });
            this.updateTradeHistory();
        } catch (error) {
            console.error('Error clearing filters:', error);
        }
    }

    deleteTrade(id) {
        this.showModal(
            'Delete Trade',
            'Are you sure you want to delete this trade? This action cannot be undone.',
            () => {
                try {
                    this.trades = this.trades.filter(t => t.id !== id);
                    this.saveData();
                    this.updateDashboard();
                    this.updateTradeHistory();
                    this.updateAnalytics();
                    this.showToast('Trade deleted successfully', 'success');
                } catch (error) {
                    console.error('Error deleting trade:', error);
                    this.showToast('Error deleting trade', 'error');
                }
            }
        );
    }

    updateAnalytics() {
        try {
            this.updateWinRateChart();
            this.updateProfitDistributionChart();
            this.updateMonthlyChart();
            this.updatePerformanceStats();
        } catch (error) {
            console.error('Error updating analytics:', error);
        }
    }

    updateWinRateChart() {
        try {
            const ctx = document.getElementById('winRateChart');
            if (!ctx) return;

            if (this.charts.winRate) {
                this.charts.winRate.destroy();
            }

            const pairs = ['XAUUSD', 'EURJPY', 'USDJPY', 'GBPJPY'];
            const data = pairs.map(pair => {
                const pairTrades = this.trades.filter(t => t.pair === pair);
                const wins = pairTrades.filter(t => t.pnl > 0).length;
                return pairTrades.length > 0 ? (wins / pairTrades.length * 100).toFixed(1) : 0;
            });

            this.charts.winRate = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: pairs,
                    datasets: [{
                        label: 'Win Rate %',
                        data: data,
                        backgroundColor: '#1FB8CD',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: value => value + '%'
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        } catch (error) {
            console.error('Error updating win rate chart:', error);
        }
    }

    updateProfitDistributionChart() {
        try {
            const ctx = document.getElementById('profitDistChart');
            if (!ctx) return;

            if (this.charts.profitDist) {
                this.charts.profitDist.destroy();
            }

            const winners = this.trades.filter(t => t.pnl > 0).length;
            const losers = this.trades.filter(t => t.pnl < 0).length;

            this.charts.profitDist = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Winning Trades', 'Losing Trades'],
                    datasets: [{
                        data: [winners, losers],
                        backgroundColor: ['#B4413C', '#5D878F'],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error updating profit distribution chart:', error);
        }
    }

    updateMonthlyChart() {
        try {
            const ctx = document.getElementById('monthlyChart');
            if (!ctx) return;

            if (this.charts.monthly) {
                this.charts.monthly.destroy();
            }

            const monthlyData = {};
            this.trades.forEach(trade => {
                const month = trade.date.substring(0, 7);
                monthlyData[month] = (monthlyData[month] || 0) + trade.pnl;
            });

            const sortedMonths = Object.keys(monthlyData).sort();
            const values = sortedMonths.map(month => monthlyData[month]);

            this.charts.monthly = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: sortedMonths.map(month => {
                        const date = new Date(month + '-01');
                        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    }),
                    datasets: [{
                        label: 'Monthly P&L',
                        data: values,
                        backgroundColor: values.map(val => val >= 0 ? '#B4413C' : '#5D878F'),
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: value => '$' + value.toFixed(2)
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        } catch (error) {
            console.error('Error updating monthly chart:', error);
        }
    }

    updatePerformanceStats() {
        try {
            const winners = this.trades.filter(t => t.pnl > 0);
            const losers = this.trades.filter(t => t.pnl < 0);
            
            const avgWin = winners.length > 0 ? winners.reduce((sum, t) => sum + t.pnl, 0) / winners.length : 0;
            const avgLoss = losers.length > 0 ? losers.reduce((sum, t) => sum + t.pnl, 0) / losers.length : 0;
            const profitFactor = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

            const statsContainer = document.getElementById('performanceStats');
            if (statsContainer) {
                statsContainer.innerHTML = `
                    <div class="stat-item">
                        <span class="stat-label">Average Win</span>
                        <span class="stat-value">$${avgWin.toFixed(2)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Average Loss</span>
                        <span class="stat-value">$${avgLoss.toFixed(2)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Profit Factor</span>
                        <span class="stat-value">${profitFactor.toFixed(2)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Total Trades</span>
                        <span class="stat-value">${this.trades.length}</span>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error updating performance stats:', error);
        }
    }

    async loadNews() {
        const newsContainer = document.getElementById('newsList');
        const loadingContainer = document.getElementById('newsLoading');
        
        try {
            if (loadingContainer) loadingContainer.classList.remove('hidden');
            if (newsContainer) newsContainer.innerHTML = '';

            const newsData = [
                {
                    event: "US Non-Farm Payrolls",
                    time: "18:30",
                    impact: "High",
                    currency: "USD",
                    description: "Monthly employment data release - major market mover"
                },
                {
                    event: "ECB Interest Rate Decision",
                    time: "15:45",
                    impact: "High",
                    currency: "EUR",
                    description: "European Central Bank monetary policy decision"
                },
                {
                    event: "Japanese CPI Data",
                    time: "10:30",
                    impact: "Medium",
                    currency: "JPY",
                    description: "Consumer Price Index inflation data"
                },
                {
                    event: "Gold Market Analysis",
                    time: "20:00",
                    impact: "Medium",
                    currency: "USD",
                    description: "Weekly precious metals outlook and analysis"
                },
                {
                    event: "UK GDP Preliminary",
                    time: "14:00",
                    impact: "High",
                    currency: "GBP",
                    description: "Quarterly gross domestic product preliminary reading"
                }
            ];

            this.displayNews(newsData);
            
        } catch (error) {
            console.error('News loading error:', error);
            this.displayFallbackNews();
        } finally {
            if (loadingContainer) loadingContainer.classList.add('hidden');
        }
    }

    displayNews(newsData) {
        try {
            const newsContainer = document.getElementById('newsList');
            if (!newsContainer) return;

            newsContainer.innerHTML = newsData.map(item => `
                <div class="news-item">
                    <div class="news-header">
                        <div>
                            <div class="news-title">${item.event}</div>
                            <div class="news-time">${item.time} IST</div>
                        </div>
                        <div class="news-impact ${item.impact.toLowerCase()}">${item.impact}</div>
                    </div>
                    <div class="news-description">${item.description}</div>
                    <div class="news-currency">Currency: ${item.currency}</div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error displaying news:', error);
        }
    }

    displayFallbackNews() {
        const fallbackNews = [
            {
                event: "Market Update",
                time: "09:00",
                impact: "Medium",
                currency: "USD",
                description: "Daily market analysis and trading opportunities"
            },
            {
                event: "Technical Analysis",
                time: "15:00",
                impact: "Low",
                currency: "Multiple",
                description: "Key support and resistance levels for major pairs"
            }
        ];
        this.displayNews(fallbackNews);
    }

    exportCsv() {
        try {
            const headers = ['Date', 'Time', 'Pair', 'Direction', 'Entry Price', 'Exit Price', 'Position Size', 'P&L', 'Notes'];
            const csvContent = [
                headers.join(','),
                ...this.trades.map(trade => [
                    trade.date,
                    trade.time,
                    trade.pair,
                    trade.direction,
                    trade.entryPrice,
                    trade.exitPrice,
                    trade.positionSize,
                    trade.pnl.toFixed(2),
                    `"${(trade.notes || '').replace(/"/g, '""')}"`
                ].join(','))
            ].join('\n');

            this.downloadFile(csvContent, `trading-journal-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
            this.showToast('CSV exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting CSV:', error);
            this.showToast('Error exporting CSV', 'error');
        }
    }

    exportData() {
        try {
            const data = {
                trades: this.trades,
                settings: this.settings,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const jsonContent = JSON.stringify(data, null, 2);
            this.downloadFile(jsonContent, `trading-journal-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
            this.showToast('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showToast('Error exporting data', 'error');
        }
    }

    importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (data.trades && Array.isArray(data.trades)) {
                    this.trades = data.trades;
                    if (data.settings) {
                        this.settings = { ...this.settings, ...data.settings };
                        this.saveSettings();
                    }
                    this.saveData();
                    this.updateDashboard();
                    this.updateTradeHistory();
                    this.updateAnalytics();
                    this.showToast('Data imported successfully!', 'success');
                } else {
                    this.showToast('Invalid file format', 'error');
                }
            } catch (error) {
                console.error('Error importing data:', error);
                this.showToast('Error importing data: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
        
        e.target.value = '';
    }

    confirmClearData() {
        this.showModal(
            'Clear All Data',
            'This will permanently delete all your trading data, including trades, settings, and analytics. This action cannot be undone. Are you sure?',
            () => {
                try {
                    this.trades = [];
                    this.saveData();
                    this.updateDashboard();
                    this.updateTradeHistory();
                    this.updateAnalytics();
                    this.showToast('All data cleared successfully!', 'success');
                } catch (error) {
                    console.error('Error clearing data:', error);
                    this.showToast('Error clearing data', 'error');
                }
            }
        );
    }

    downloadFile(content, filename, mimeType) {
        try {
            const blob = new Blob([content], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
            this.showToast('Error downloading file', 'error');
        }
    }

    refreshDashboard() {
        try {
            this.updateDashboard();
            this.showToast('Dashboard refreshed!', 'success');
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
            this.showToast('Error refreshing dashboard', 'error');
        }
    }

    startRealTimeUpdates() {
        try {
            this.updateTime();
            setInterval(() => this.updateTime(), 1000);
            
            this.updateMarketStatus();
            setInterval(() => this.updateMarketStatus(), 60000);
        } catch (error) {
            console.error('Error starting real-time updates:', error);
        }
    }

    updateTime() {
        try {
            const now = new Date();
            const istTime = now.toLocaleString('en-US', {
                timeZone: 'Asia/Kolkata',
                hour12: true,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            const timeDisplay = document.getElementById('timeDisplay');
            if (timeDisplay) {
                timeDisplay.textContent = istTime + ' IST';
            }
        } catch (error) {
            console.error('Error updating time:', error);
        }
    }

    updateMarketStatus() {
        try {
            const now = new Date();
            const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
            const hours = istTime.getHours();
            const minutes = istTime.getMinutes();
            const currentTimeInMinutes = hours * 60 + minutes;
            
            const [startHours, startMinutes] = this.settings.sessionStart.split(':').map(Number);
            const [endHours, endMinutes] = this.settings.sessionEnd.split(':').map(Number);
            
            const startInMinutes = startHours * 60 + startMinutes;
            const endInMinutes = endHours * 60 + endMinutes;
            
            const isOpen = currentTimeInMinutes >= startInMinutes && currentTimeInMinutes <= endInMinutes;
            
            const statusElement = document.getElementById('marketStatus');
            if (statusElement) {
                statusElement.className = `market-status ${isOpen ? 'open' : 'closed'}`;
                const statusText = statusElement.querySelector('.status-text');
                if (statusText) {
                    statusText.textContent = isOpen ? 'Market Open' : 'Market Closed';
                }
            }
        } catch (error) {
            console.error('Error updating market status:', error);
        }
    }

    showToast(message, type = 'info') {
        try {
            const toast = document.getElementById('toast');
            const toastMessage = document.getElementById('toastMessage');
            
            if (!toast || !toastMessage) return;
            
            toastMessage.textContent = message;
            toast.className = `toast ${type} show`;
            
            setTimeout(() => {
                this.hideToast();
            }, 4000);
        } catch (error) {
            console.error('Error showing toast:', error);
        }
    }

    hideToast() {
        try {
            const toast = document.getElementById('toast');
            if (toast) {
                toast.classList.remove('show');
            }
        } catch (error) {
            console.error('Error hiding toast:', error);
        }
    }

    showModal(title, message, onConfirm) {
        try {
            const modalOverlay = document.getElementById('modalOverlay');
            const modalTitle = document.getElementById('modalTitle');
            const modalMessage = document.getElementById('modalMessage');
            const modalConfirm = document.getElementById('modalConfirm');
            
            if (!modalOverlay) return;
            
            if (modalTitle) modalTitle.textContent = title;
            if (modalMessage) modalMessage.textContent = message;
            
            modalOverlay.classList.add('show');
            
            const newConfirmBtn = modalConfirm.cloneNode(true);
            modalConfirm.parentNode.replaceChild(newConfirmBtn, modalConfirm);
            
            newConfirmBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                onConfirm();
                this.hideModal();
            });
        } catch (error) {
            console.error('Error showing modal:', error);
        }
    }

    hideModal() {
        try {
            const modalOverlay = document.getElementById('modalOverlay');
            if (modalOverlay) {
                modalOverlay.classList.remove('show');
            }
        } catch (error) {
            console.error('Error hiding modal:', error);
        }
    }

    saveData() {
        try {
            // Note: localStorage not available in sandbox, keeping in memory
            console.log('Data saved to memory:', this.trades.length, 'trades');
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    loadData() {
        try {
            this.trades = [];
            console.log('Data initialized');
        } catch (error) {
            console.error('Error loading data:', error);
            this.trades = [];
        }
    }

    saveSettings() {
        try {
            console.log('Settings saved to memory:', this.settings);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }
}

// Initialize the PWA application
let app;
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('Initializing Trading Journal PWA...');
        app = new TradingJournalPWA();
    } catch (error) {
        console.error('Error initializing PWA application:', error);
    }
});