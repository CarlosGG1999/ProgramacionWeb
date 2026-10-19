/* =========================================================
   DATOS
   ========================================================= */

const STORAGE_KEY = 'expenseTrackerData';

// Transacciones de ejemplo. demo:true => ya están incluidas en los valores base de abajo,
// por eso no se vuelven a sumar a los totales.
const initialTransactions = [
    {
        id:1,
        date: "2025-01-14",
        category: "Subscription",
        categoryKey: "subscription",
        description: "Subscription",
        amount: -440,
        status : "success",
        type: "expense",
        demo: true
    },
    {
        id:2,
        date: "2025-01-10",
        category: "Subscription",
        categoryKey: "subscription",
        description: "Subscription",
        amount: -440,
        status : "success",
        type: "expense",
        demo: true
    },
    {
        id:3,
        date: "2025-01-08",
        category: "Subscription",
        categoryKey: "subscription",
        description: "Subscription",
        amount: -440,
        status : "success",
        type: "expense",
        demo: true
    },
];

let transaction = initialTransactions.map(t => ({ ...t }));

// Valores base (a ellos se suman las transacciones que agregues)
let monthlyIncome = 2645;
let monthlyExpenses = 1895;
const lastMonthIncome = 2362;     // para calcular el "% vs last month"
const lastMonthExpenses = 1692;
const spendingLimit = 4645;

const baseAllExpenses = 24645;
const basePeriodExpenses = { daily: 1345, weekly: 7136, monthly: 14927 };
const baseCategories = { food: 863, entertainment: 248, shopping: 1835, investment: 1835, transport: 0, other: 0 };

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Datos base del gráfico (2025)
const baseChart = {
    2025: [
        { income: 560, expenses: 440 },  // Jan
        { income: 550, expenses: 447 },  // Feb
        { income: 370, expenses: 295 },  // Mar
        { income: 894, expenses: 768 },  // Apr
        { income: 690, expenses: 557 },  // May
        { income: 410, expenses: 338 },  // Jun
        { income: 500, expenses: 414 },  // Jul
        { income: 590, expenses: 490 },  // Aug
        { income: 460, expenses: 371 },  // Sep
        { income: 360, expenses: 305 },  // Oct
        { income: 640, expenses: 523 },  // Nov
        { income: 430, expenses: 359 },  // Dec
    ]
};

/* =========================================================
   FECHAS
   ========================================================= */

function toDateString(d){
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

function parseDate(s){
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
}

function formatDate(s){
    return parseDate(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const today = toDateString(new Date())
document.getElementById('incomeDate').value = today
document.getElementById('expenseDate').value = today

function inPeriod(dateStr, period, ref = today){
    if(period === 'all') return true
    const d = parseDate(dateStr)
    const r = parseDate(ref)
    if(period === 'daily') return dateStr === ref
    if(period === 'weekly'){
        const diff = Math.round((r - d) / 86400000)
        return diff >= 0 && diff < 7
    }
    if(period === 'monthly') return d.getFullYear() === r.getFullYear() && d.getMonth() === r.getMonth()
    if(period === 'yearly') return d.getFullYear() === r.getFullYear()
    return true
}

/* =========================================================
   ESTADO DE LA INTERFAZ
   ========================================================= */

let chartYear = 2025
let activeMonth = 3            // Abril
let chartMode = 'both'         // both | income | expenses

let headerPeriod = 'all'       // all | daily | weekly | monthly | yearly
let refDate = today

let typeFilter = 'all'         // all | income | expense
let sortKey = 'date'
let sortDir = 'desc'

let activePeriodTab = 'monthly'
let cardHidden = false

/* =========================================================
   UTILIDADES
   ========================================================= */

const el = id => document.getElementById(id)

function money(n){
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function money0(n){
    return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function num(n){
    return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function esc(s){
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]))
}

function nextId(){
    return transaction.reduce((max, t) => Math.max(max, t.id), 0) + 1
}

/* =========================================================
   CÁLCULOS (valor base + transacciones agregadas)
   ========================================================= */

function sumTx(type, test){
    const total = transaction
        .filter(t => !t.demo && t.type === type && test(t))
        .reduce((s, t) => s + Math.abs(t.amount), 0)
    return Math.round(total * 100) / 100
}

function calcMonthlyIncome(){ return monthlyIncome + sumTx('income', t => inPeriod(t.date, 'monthly')) }
function calcMonthlyExpenses(){ return monthlyExpenses + sumTx('expense', t => inPeriod(t.date, 'monthly')) }
function calcAllExpenses(){ return baseAllExpenses + sumTx('expense', () => true) }
function calcPeriodExpenses(p){ return basePeriodExpenses[p] + sumTx('expense', t => inPeriod(t.date, p)) }
function calcCategory(key){ return baseCategories[key] + sumTx('expense', t => t.categoryKey === key) }

function getChartData(year){
    const data = MONTHS.map((_, i) => ({
        income: baseChart[year]?.[i]?.income || 0,
        expenses: baseChart[year]?.[i]?.expenses || 0
    }))
    transaction.filter(t => !t.demo).forEach(t => {
        const d = parseDate(t.date)
        if(d.getFullYear() === year){
            data[d.getMonth()][t.type === 'income' ? 'income' : 'expenses'] += Math.abs(t.amount)
        }
    })
    return data
}

function getYears(){
    const years = new Set([...Object.keys(baseChart).map(Number), parseDate(today).getFullYear()])
    transaction.forEach(t => years.add(parseDate(t.date).getFullYear()))
    return [...years].sort((a, b) => a - b)
}

/* =========================================================
   PERSISTENCIA (localStorage)
   ========================================================= */

function save(){
    try{
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ transaction }))
    }catch(e){}
}

function load(){
    try{
        const raw = localStorage.getItem(STORAGE_KEY)
        if(!raw) return
        const data = JSON.parse(raw)
        if(Array.isArray(data.transaction)) transaction = data.transaction
    }catch(e){}
}

/* =========================================================
   MODALES
   ========================================================= */

function openIncomeModal(){
    document.getElementById('incomeModal').style.display = 'block';
    document.body.style.overflow = 'hidden'
}


function openExpenseModal(){
    document.getElementById('expenseModal').style.display = 'block';
    document.body.style.overflow = 'hidden'
}

function closeModal(modalId){
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto'

    if(modalId=== 'incomeModal'){
        document.getElementById('incomeForm').reset()
        document.getElementById('incomeDate').value = today

    }else{
        document.getElementById('expenseForm').reset()
        document.getElementById('expenseDate').value = today
  
    }


}

window.onclick = function(event){
    const incomeModal = document.getElementById('incomeModal');
    const expenseModal = document.getElementById('expenseModal');

    if(event.target === incomeModal){
        closeModal('incomeModal')
    }
    if(event.target === expenseModal){
        closeModal('expenseModal')
    }
}

document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
        closeMenu()
        if(el('incomeModal').style.display === 'block') closeModal('incomeModal')
        if(el('expenseModal').style.display === 'block') closeModal('expenseModal')
    }
})

// Enter dentro del formulario = guardar
el('incomeForm').addEventListener('keydown', function(e){
    if(e.key === 'Enter'){ e.preventDefault(); addIncome() }
})
el('expenseForm').addEventListener('keydown', function(e){
    if(e.key === 'Enter'){ e.preventDefault(); addExpense() }
})

/* =========================================================
   AGREGAR / ELIMINAR TRANSACCIONES
   ========================================================= */

function addIncome(){
    const amount = parseFloat(document.getElementById('incomeAmount').value)
    const category = document.getElementById('incomeCategory').value
    const description = document.getElementById('incomeDescription').value
    const date = document.getElementById('incomeDate').value

    if(!amount || !category || !date){
        alert('Please fill in all required fields')
        return
    }

    if(amount < 0){
        alert('The amount must be greater than 0')
        return
    }

    const select = document.getElementById('incomeCategory')
    addTransaction('income', amount, category, select.options[select.selectedIndex].text.trim(), description, date)
    closeModal('incomeModal')
}

function addExpense(){
    const amount = parseFloat(document.getElementById('expenseAmount').value)
    const category = document.getElementById('expenseCategory').value
    const description = document.getElementById('expenseDescription').value
    const date = document.getElementById('expenseDate').value

    if(!amount || !category || !date){
        alert('Please fill in all required fields')
        return
    }

    if(amount < 0){
        alert('The amount must be greater than 0')
        return
    }

    const select = document.getElementById('expenseCategory')
    addTransaction('expense', amount, category, select.options[select.selectedIndex].text.trim(), description, date)
    closeModal('expenseModal')
}

function addTransaction(type, amount, categoryKey, categoryLabel, description, date){
    transaction.push({
        id: nextId(),
        date: date,
        category: categoryLabel,
        categoryKey: categoryKey,
        description: description.trim() || categoryLabel,
        amount: type === 'income' ? amount : -amount,
        status: 'success',
        type: type
    })

    // Mostrar en el gráfico el mes de la transacción nueva
    const d = parseDate(date)
    chartYear = d.getFullYear()
    activeMonth = d.getMonth()

    save()
    renderAll()
}

function deleteTransaction(id){
    if(!confirm('Delete this transaction?')) return
    transaction = transaction.filter(t => t.id !== id)
    save()
    renderAll()
}

function resetData(){
    if(!confirm('Reset everything back to the sample data?')) return
    transaction = initialTransactions.map(t => ({ ...t }))
    try{ localStorage.removeItem(STORAGE_KEY) }catch(e){}
    chartYear = 2025
    activeMonth = 3
    chartMode = 'both'
    headerPeriod = 'all'
    refDate = today
    typeFilter = 'all'
    sortKey = 'date'
    sortDir = 'desc'
    renderAll()
}

/* =========================================================
   MENÚS DESPLEGABLES
   ========================================================= */

let menuAnchor = null

function closeMenu(){
    const m = document.getElementById('popupMenu')
    if(m) m.remove()
    menuAnchor = null
}

function showMenu(anchor, items){
    const same = menuAnchor === anchor
    closeMenu()
    if(same) return

    const menu = document.createElement('div')
    menu.className = 'popup-menu'
    menu.id = 'popupMenu'

    items.forEach(item => {
        const b = document.createElement('button')
        b.type = 'button'
        b.textContent = item.label
        if(item.active) b.classList.add('active')
        if(item.danger) b.classList.add('danger')
        b.onclick = function(){
            closeMenu()
            item.action()
        }
        menu.appendChild(b)
    })

    document.body.appendChild(menu)

    const r = anchor.getBoundingClientRect()
    menu.style.top = (r.bottom + window.scrollY + 6) + 'px'
    menu.style.left = Math.max(8, r.right + window.scrollX - menu.offsetWidth) + 'px'
    menuAnchor = anchor
}

document.addEventListener('click', function(e){
    if(menuAnchor && !menuAnchor.contains(e.target) && !e.target.closest('.popup-menu')) closeMenu()
})
window.addEventListener('resize', closeMenu)

/* ---- Header: periodo y fecha ---- */

function openPeriodMenu(anchor){
    const options = [['all','All'], ['daily','Daily'], ['weekly','Weekly'], ['monthly','Monthly'], ['yearly','Yearly']]
    showMenu(anchor, options.map(([value, label]) => ({
        label: label,
        active: headerPeriod === value,
        action: () => { headerPeriod = value; renderAll() }
    })))
}

function openDatePicker(){
    const input = el('headerDate')
    input.value = refDate
    try{
        input.showPicker()
    }catch(e){
        input.focus()
        input.click()
    }
}

function changeRefDate(value){
    if(!value) return
    refDate = value
    if(headerPeriod === 'all') headerPeriod = 'daily'
    renderAll()
}

/* ---- Gráfico: año y filtro ---- */

function openYearMenu(anchor){
    showMenu(anchor, getYears().map(y => ({
        label: String(y),
        active: chartYear === y,
        action: () => { chartYear = y; renderChart(); renderYearLabel() }
    })))
}

function openChartFilterMenu(anchor){
    const options = [['both','Income & Expenses'], ['income','Income only'], ['expenses','Expenses only']]
    showMenu(anchor, options.map(([value, label]) => ({
        label: label,
        active: chartMode === value,
        action: () => { chartMode = value; renderChart(); renderChartFilterLabel() }
    })))
}

function selectMonth(i){
    activeMonth = i
    renderChart()
}

/* ---- Tabs de All Expenses ---- */

function selectPeriodTab(period){
    activePeriodTab = period
    renderPeriodTabs()
}

/* ---- Tabla: orden y filtro ---- */

function openSortMenu(anchor){
    const options = [
        ['date', 'desc', 'Newest first'],
        ['date', 'asc', 'Oldest first'],
        ['amount', 'desc', 'Highest amount'],
        ['amount', 'asc', 'Lowest amount'],
    ]
    showMenu(anchor, options.map(([key, dir, label]) => ({
        label: label,
        active: sortKey === key && sortDir === dir,
        action: () => { sortKey = key; sortDir = dir; renderTable(); renderTableLabels() }
    })))
}

function sortBy(key){
    if(sortKey === key){
        sortDir = sortDir === 'asc' ? 'desc' : 'asc'
    }else{
        sortKey = key
        sortDir = key === 'category' ? 'asc' : 'desc'
    }
    renderTable()
    renderTableLabels()
}

function openTypeFilterMenu(anchor){
    const options = [['all','All'], ['income','Income'], ['expense','Expenses']]
    showMenu(anchor, options.map(([value, label]) => ({
        label: label,
        active: typeFilter === value,
        action: () => { typeFilter = value; renderTable(); renderTableLabels() }
    })))
}

function openRowMenu(anchor, id){
    showMenu(anchor, [
        { label: 'Delete', danger: true, action: () => deleteTransaction(id) }
    ])
}

/* ---- Menús de las tarjetas ---- */

function openCardMenu(anchor, which){
    let items = []
    if(which === 'income'){
        items = [{ label: 'Add income', action: openIncomeModal }]
    }else if(which === 'expenses'){
        items = [{ label: 'Add expense', action: openExpenseModal }]
    }else if(which === 'allExpenses'){
        items = [
            { label: 'Add expense', action: openExpenseModal },
            { label: 'Export CSV', action: exportCSV }
        ]
    }else if(which === 'card'){
        items = [
            { label: cardHidden ? 'Show card number' : 'Hide card number', action: toggleCardNumber },
            { label: 'Reset sample data', danger: true, action: resetData }
        ]
    }
    showMenu(anchor, items)
}

function toggleCardNumber(){
    cardHidden = !cardHidden
    renderCard()
}

/* =========================================================
   EXPORTAR CSV
   ========================================================= */

function exportCSV(){
    const list = getVisibleTransactions()
    if(list.length === 0){
        alert('There are no transactions to export')
        return
    }

    const cell = v => '"' + String(v).replace(/"/g, '""') + '"'
    const rows = [['Date', 'Type', 'Category', 'Description', 'Amount', 'Status']]
    list.forEach(t => rows.push([t.date, t.type, t.category, t.description, t.amount.toFixed(2), t.status]))

    const csv = '\uFEFF' + rows.map(r => r.map(cell).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transactions-' + today + '.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}

/* =========================================================
   RENDER
   ========================================================= */

function renderHeader(){
    const h = new Date().getHours()
    const greet = h < 12 ? 'Good Morning' : h < 19 ? 'Good Afternoon' : 'Good Evening'
    el('greeting').textContent = greet + ', Codynn!'

    const labels = { all: 'All', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' }
    el('periodLabel').textContent = labels[headerPeriod]
    el('dateLabel').textContent = parseDate(refDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function renderChange(element, current, last){
    const pct = last ? ((current - last) / last) * 100 : 0
    const up = pct >= 0
    element.className = 'change' + (up ? '' : ' down')
    element.innerHTML = '<i class="fas fa-arrow-' + (up ? 'up' : 'down') + '"></i> ' + Math.abs(Math.round(pct)) + '% vs last month'
}

function renderSummary(){
    const income = calcMonthlyIncome()
    const expenses = calcMonthlyExpenses()
    el('monthlyIncomeValue').textContent = money(income)
    el('monthlyExpensesValue').textContent = money(expenses)
    renderChange(el('incomeChange'), income, lastMonthIncome)
    renderChange(el('expensesChange'), expenses, lastMonthExpenses)
}

function renderCard(){
    el('cardNumber').textContent = cardHidden ? '•••• •••• •••• 0015' : '5435 2735 0037 0015'

    const used = calcMonthlyExpenses()
    const pct = Math.min((used / spendingLimit) * 100, 100)
    el('spendingLimit').textContent = money(spendingLimit)
    el('progressFill').style.width = pct + '%'
    el('progressFill').style.background = used >= spendingLimit ? '#ef4444' : '#ea580c'
    el('progressFill').title = Math.round((used / spendingLimit) * 100) + '% of the limit used'
}

function renderYearLabel(){
    el('yearLabel').textContent = 'Yearly · ' + chartYear
}

function renderChartFilterLabel(){
    const labels = { both: 'Filter', income: 'Income', expenses: 'Expenses' }
    el('chartFilterLabel').textContent = labels[chartMode]
}

function renderChart(){
    const data = getChartData(chartYear)
    const valueOf = d => chartMode === 'income' ? d.income : chartMode === 'expenses' ? d.expenses : d.income + d.expenses
    const max = Math.max(...data.map(valueOf), 1)
    const MAX_HEIGHT = 190
    const scale = MAX_HEIGHT / max

    el('chartContainer').innerHTML = data.map((d, i) => {
        const active = i === activeMonth
        const h = Math.max(valueOf(d) * scale, 24)
        let inner = ''

        if(active){
            const parts = []
            if(chartMode !== 'expenses') parts.push(['chart-bar-income', d.income])
            if(chartMode !== 'income') parts.push(['chart-bar-expenses', d.expenses])
            const total = parts.reduce((s, p) => s + p[1], 0)
            const available = h - parts.length * 4

            inner = `
                <div class="chart-tooltip">
                    <div class="tt-title">${MONTHS_FULL[i]} ${chartYear}</div>
                    <div class="tt-income">Income: ${money0(d.income)}</div>
                    <div class="tt-expenses">Expenses: ${money0(d.expenses)}</div>
                </div>` +
                parts.map(([cls, v]) => {
                    const ph = total ? Math.max(available * v / total, 2) : available / parts.length
                    return `<div class="${cls}" style="height: ${ph}px;"></div>`
                }).join('')
        }

        return `<div class="chart-bar${active ? ' active' : ''}" style="height: ${h}px;" onclick="selectMonth(${i})">${inner}</div>`
    }).join('')

    el('chartLabels').innerHTML = MONTHS.map((m, i) =>
        `<span class="${i === activeMonth ? 'active' : ''}">${m}</span>`
    ).join('')
}

function renderPeriodTabs(){
    document.querySelectorAll('.period-tab').forEach(t => t.classList.toggle('active', t.dataset.period === activePeriodTab))
    document.querySelectorAll('.period-amounts span, .period-values span').forEach(s => s.classList.toggle('active', s.dataset.period === activePeriodTab))
}

function renderExpenses(){
    el('totalExpenses').textContent = money(calcAllExpenses())
    el('valueDaily').textContent = money0(calcPeriodExpenses('daily'))
    el('valueWeekly').textContent = money0(calcPeriodExpenses('weekly'))
    el('valueMonthly').textContent = money0(calcPeriodExpenses('monthly'))

    Object.keys(baseCategories).forEach(key => {
        el('cat-' + key).textContent = num(calcCategory(key))
    })

    renderPeriodTabs()
}

function getVisibleTransactions(){
    let list = transaction.filter(t => typeFilter === 'all' || t.type === typeFilter)
    list = list.filter(t => inPeriod(t.date, headerPeriod, refDate))

    list.sort((a, b) => {
        let r = 0
        if(sortKey === 'date') r = a.date.localeCompare(b.date)
        else if(sortKey === 'category') r = a.category.localeCompare(b.category)
        else if(sortKey === 'amount') r = Math.abs(a.amount) - Math.abs(b.amount)
        if(r === 0) r = a.id - b.id
        return sortDir === 'asc' ? r : -r
    })
    return list
}

function renderTable(){
    const list = getVisibleTransactions()
    const body = el('transactionsBody')

    if(list.length === 0){
        body.innerHTML = '<tr class="empty-row"><td colspan="5">No transactions found</td></tr>'
        return
    }

    body.innerHTML = list.map(t => `
        <tr>
            <td>${formatDate(t.date)}</td>
            <td title="${esc(t.description)}">${esc(t.category)}</td>
            <td class="${t.amount < 0 ? 'amount-expense' : 'amount-income'}">${t.amount < 0 ? '-' : '+'}${money(Math.abs(t.amount))}</td>
            <td><span class="status-succes">Success</span></td>
            <td><button class="action-btn" onclick="openRowMenu(this, ${t.id})"><i class="fas fa-ellipsis-h"></i></button></td>
        </tr>
    `).join('')
}

function renderTableLabels(){
    const sortLabels = {
        'date-desc': 'Newest first', 'date-asc': 'Oldest first',
        'amount-desc': 'Highest amount', 'amount-asc': 'Lowest amount',
        'category-asc': 'Category A-Z', 'category-desc': 'Category Z-A'
    }
    el('sortLabel').textContent = sortLabels[sortKey + '-' + sortDir] || 'Sort'

    const filterLabels = { all: 'Filter', income: 'Income', expense: 'Expenses' }
    el('typeFilterLabel').textContent = filterLabels[typeFilter]
}

function renderAll(){
    renderHeader()
    renderSummary()
    renderCard()
    renderYearLabel()
    renderChartFilterLabel()
    renderChart()
    renderExpenses()
    renderTable()
    renderTableLabels()
}

/* =========================================================
   INICIO
   ========================================================= */

load()
renderAll()