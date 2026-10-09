let transaction = [
    {
        id:1,
        data: "2025-01-14",
        amount: -440,
        status : "success",
        type: "expense"

    },
    {
        id:1,
        data: "2025-01-14",
        amount: -440,
        status : "success",
        type: "expense"

    },
    {
        id:1,
        data: "2025-01-14",
        amount: -440,
        status : "success",
        type: "expense"

    },
];


let monthlyIncome = 2645;
let monthlyExpenses = 1895;

const today = new Date().toISOString().split('T')[0]
document.getElementById('incomeDate').value = today
document.getElementById('expeneseDate').value = today

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
    if(event.target === incomeModal){
        closeModal('expenseModal')
    }
}

function addIncome(){
    const amount = parseFloat(document.getElementById('incomeAmount').value)
    const category = document.getElementById('incomeCategory').value
    const description = document.getElementById('incomeDescription').value
    const date = document.getElementById('incomeDate').value

    if(!amount || !category || !date){
        alert('Please fill in all required fields')
        return
    }

    cons

}
