document.addEventListener("DOMContentLoaded", function () {
    const transactionForm = document.getElementById("transactionForm");
    const financeTableBody = document.getElementById("financeTableBody");
    const totalIncome = document.getElementById("totalIncome");
    const totalExpense = document.getElementById("totalExpense");
    const finalBalance = document.getElementById("finalBalance");
    const savePDFButton = document.getElementById("savePDF");
    const newReportButton = document.getElementById("newReport");

    let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

    function formatRupiah(amount) {
        return amount.toLocaleString("id-ID", { style: "currency", currency: "IDR" });
    }

    function getCurrentDate() {
        const today = new Date();
        const months = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        const day = today.getDate();
        const month = months[today.getMonth()];
        const year = today.getFullYear();

        return `${day} ${month} ${year}`;
    }

    function updateTable() {
        transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
        financeTableBody.innerHTML = "";
        let incomeTotal = 0;
        let expenseTotal = 0;
        let balance = 0;

        transactions.forEach((transaction, index) => {
            balance += transaction.type === "income" ? transaction.amount : -transaction.amount;
            financeTableBody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${transaction.date}</td>
                <td>${transaction.description}</td>
                <td>${transaction.type === "income" ? formatRupiah(transaction.amount) : "-"}</td>
                <td>${transaction.type === "expense" ? formatRupiah(transaction.amount) : "-"}</td>
                <td>${formatRupiah(balance)}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editTransaction(${index})">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteTransaction(${index})">
                        <i class="fa fa-trash"></i>
                    </button>
                </td>
            </tr>`;
            if (transaction.type === "income") incomeTotal += transaction.amount;
            else expenseTotal += transaction.amount;
        });

        totalIncome.textContent = formatRupiah(incomeTotal);
        totalExpense.textContent = formatRupiah(expenseTotal);
        finalBalance.textContent = formatRupiah(balance);
        localStorage.setItem("transactions", JSON.stringify(transactions));
    }

    window.deleteTransaction = function (index) {
        transactions.splice(index, 1);
        updateTable();
    };

    window.editTransaction = function (index) {
        const transaction = transactions[index];
        document.getElementById("date").value = transaction.date;
        document.getElementById("description").value = transaction.description;
        document.getElementById("type").value = transaction.type;
        document.getElementById("amount").value = transaction.amount;

        transactionForm.onsubmit = function (event) {
            event.preventDefault();
            transactions[index] = {
                date: date.value,
                description: description.value,
                type: type.value,
                amount: parseFloat(amount.value)
            };
            updateTable();
            transactionForm.reset();
            transactionForm.onsubmit = addTransaction;
        };
    };

    function addTransaction(event) {
        event.preventDefault();
        transactions.push({
            date: date.value,
            description: description.value,
            type: type.value,
            amount: parseFloat(amount.value)
        });
        updateTable();
        transactionForm.reset();
    }

    transactionForm.onsubmit = addTransaction;

    newReportButton.addEventListener("click", function () {
        transactions = [];
        localStorage.removeItem("transactions");
        updateTable();
    });

    savePDFButton.addEventListener("click", function () {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const currentDate = getCurrentDate();

        doc.text("Laporan Keuangan Harian", 75, 10);
        const rows = transactions.map((t, index) => [
            index + 1,
            t.date,
            t.description,
            t.type === "income" ? formatRupiah(t.amount) : "-",
            t.type === "expense" ? formatRupiah(t.amount) : "-",
            formatRupiah(t.amount)
        ]);

        const incomeTotal = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
        const expenseTotal = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
        const finalBalance = incomeTotal - expenseTotal;

        rows.push(["", "", "Total", formatRupiah(incomeTotal), formatRupiah(expenseTotal), formatRupiah(finalBalance)]);

        doc.autoTable({
            head: [["No", "Tanggal", "Keterangan", "Pemasukan (Rp)", "Pengeluaran (Rp)", "Saldo (Rp)"]],
            body: rows,
            styles: { lineWidth: 0.1, lineColor: [0, 0, 0], fontSize: 10 },
            headStyles: { fillColor: [22, 136, 147], textColor: 255 },
            theme: "grid",
            margin: { top: 20 }
        });
        
        doc.setFont("times", "bolditalic"); // Mengatur font menjadi Bold Italic
        doc.setFontSize(10); // Ukuran font 10

        doc.text(`Tanggal Laporan: ${currentDate}`, 15, doc.autoTable.previous.finalY + 6);

        const pageHeight = doc.internal.pageSize.height;
        doc.setFont("times", "italic");
        doc.setFontSize(10);
        doc.text("© 2025 Laporan Keuangan Design By DLB Semua Hak Dilindungi.", 70, pageHeight - 10);
        
        doc.save("Laporan-Keuangan.pdf");
    });

    updateTable();
});