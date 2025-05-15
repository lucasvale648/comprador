// Dados da aplicação
let purchases = JSON.parse(localStorage.getItem('purchases')) || [];
let currentPurchase = {
    company: '',
    date: new Date(),
    items: []
};
let editingIndex = null;

// Elementos DOM
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const purchasesHistory = document.getElementById('purchasesHistory');
const companyName = document.getElementById('companyName');
const itemsList = document.getElementById('itemsList');
const addItemBtn = document.getElementById('addItemBtn');
const savePurchaseBtn = document.getElementById('savePurchaseBtn');
const itemModal = document.getElementById('itemModal');
const closeModal = document.querySelector('.close');
const saveItemBtn = document.getElementById('saveItemBtn');
const itemName = document.getElementById('itemName');
const itemQuantity = document.getElementById('itemQuantity');
const itemPrice = document.getElementById('itemPrice');

// Funções
function switchTab(tabId) {
    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

function renderPurchasesHistory() {
    purchasesHistory.innerHTML = '';
    
    if (purchases.length === 0) {
        purchasesHistory.innerHTML = '<p class="empty-message">Nenhuma compra registrada ainda.</p>';
        return;
    }
    
    purchases.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    purchases.forEach((purchase, index) => {
        const purchaseEl = document.createElement('div');
        purchaseEl.className = 'purchase-card';
        
        const formattedDate = new Date(purchase.date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let itemsHtml = purchase.items.map(item => `
            <div class="purchase-item">
                <span>${item.quantity}x ${item.name}</span>
                <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');
        
        const total = purchase.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        purchaseEl.innerHTML = `
    <div class="purchase-header">
        <span>${purchase.company}</span>
        <span class="purchase-date">${formattedDate}</span>
    </div>
    <div class="purchase-items">
        ${itemsHtml}
    </div>
    <div class="purchase-total">
        <strong>Total: R$ ${total.toFixed(2)}</strong>
        <div class="purchase-actions">
            <button class="edit-purchase-btn" onclick="startEditPurchase(${index})">
                Editar
            </button>
            <button class="export-pdf-btn" onclick="generatePurchasePDF(${JSON.stringify(purchase).replace(/"/g, '&quot;')})">
                PDF
            </button>
            <button class="delete-purchase-btn" onclick="deletePurchase(${index})">
                Excluir
            </button>
        </div>
    </div>
`;
        
        purchasesHistory.appendChild(purchaseEl);
    });
}

function startEditPurchase(index) {
    editingIndex = index;
    currentPurchase = JSON.parse(JSON.stringify(purchases[index]));
    
    companyName.value = currentPurchase.company;
    renderCurrentItems();
    switchTab('new-purchase');
    
    // Altera o botão para "Atualizar Compra"
    savePurchaseBtn.textContent = 'Atualizar Compra';
}

function renderCurrentItems() {
    itemsList.innerHTML = '';
    
    if (currentPurchase.items.length === 0) {
        itemsList.innerHTML = '<p class="empty-message">Nenhum item adicionado ainda.</p>';
        return;
    }
    
    currentPurchase.items.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'purchase-item';
        itemEl.innerHTML = `
            <span>${item.quantity}x ${item.name}</span>
            <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
            <button onclick="removeItem(${index})">✕</button>
        `;
        itemsList.appendChild(itemEl);
    });
}

function addItem() {
    const name = itemName.value.trim();
    const quantity = parseInt(itemQuantity.value) || 1;
    const price = parseFloat(itemPrice.value) || 0;
    
    if (name) {
        currentPurchase.items.push({ name, quantity, price });
        renderCurrentItems();
        closeModal.click();
        resetItemForm();
    }
}

function removeItem(index) {
    currentPurchase.items.splice(index, 1);
    renderCurrentItems();
}

function deletePurchase(index) {
    if (confirm('Tem certeza que deseja excluir esta compra permanentemente?')) {
        purchases.splice(index, 1);
        localStorage.setItem('purchases', JSON.stringify(purchases));
        renderPurchasesHistory();
    }
}

function savePurchase() {
    const company = companyName.value.trim();
    
    if (!company) {
        alert('Por favor, informe o nome da empresa');
        return;
    }
    
    if (currentPurchase.items.length === 0) {
        alert('Adicione pelo menos um item à compra');
        return;
    }
    
    currentPurchase.company = company;
    currentPurchase.date = new Date();
    
    if (editingIndex !== null) {
        // Atualiza compra existente
        purchases[editingIndex] = {...currentPurchase};
    } else {
        // Adiciona nova compra
        purchases.push({...currentPurchase});
    }
    
    localStorage.setItem('purchases', JSON.stringify(purchases));
    
    // Resetar estado
    editingIndex = null;
    currentPurchase = {
        company: '',
        date: new Date(),
        items: []
    };
    
    companyName.value = '';
    renderCurrentItems();
    switchTab('my-purchases');
    renderPurchasesHistory();
    
    // Restaura o texto do botão
    savePurchaseBtn.textContent = 'Salvar Compra';
    
    alert(`Compra ${editingIndex !== null ? 'atualizada' : 'salva'} com sucesso!`);
}

function generatePurchasePDF(purchaseData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configurações do documento
    const title = "PEDIDO DE COMPRA";
    const date = new Date(purchaseData.date).toLocaleDateString('pt-BR');
    const time = new Date(purchaseData.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // Cabeçalho
    doc.setFontSize(18);
    doc.text(title, 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Empresa: ${purchaseData.company}`, 14, 30);
    doc.text(`Data: ${date} às ${time}`, 14, 38);
    
    // Linha divisória
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 42, 196, 42);
    
    // Tabela de itens
    const itemsData = purchaseData.items.map(item => [
        item.name,
        item.quantity,
        `R$ ${item.price.toFixed(2)}`,
        `R$ ${(item.price * item.quantity).toFixed(2)}`
    ]);
    
    doc.autoTable({
        startY: 50,
        head: [['Item', 'Qtd', 'Preço Unit.', 'Total']],
        body: itemsData,
        headStyles: {
            fillColor: [138, 170, 229], // Azul pastel
            textColor: 255
        },
        styles: {
            cellPadding: 3,
            fontSize: 10
        },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 20 },
            2: { cellWidth: 30 },
            3: { cellWidth: 30 }
        }
    });
    
    // Total geral
    const total = purchaseData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    doc.setFontSize(12);
    doc.text(`Total Geral: R$ ${total.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 15);
    
    // Salvar o PDF
    doc.save(`Pedido_${purchaseData.company}_${date.replace(/\//g, '-')}.pdf`);
}

function resetItemForm() {
    itemName.value = '';
    itemQuantity.value = '';
    itemPrice.valeu ='';
}

// Event Listeners
tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

addItemBtn.addEventListener('click', () => {
    itemModal.style.display = 'block';
    itemName.focus();
});

closeModal.addEventListener('click', () => {
    itemModal.style.display = 'none';
});

saveItemBtn.addEventListener('click', addItem);

savePurchaseBtn.addEventListener('click', savePurchase);

window.addEventListener('click', (event) => {
    if (event.target === itemModal) {
        itemModal.style.display = 'none';
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registrado com sucesso');
            })
            .catch(error => {
                console.log('Falha no registro do ServiceWorker: ', error);
            });
    }
    
    switchTab('new-purchase');
    renderPurchasesHistory();
});

// Funções globais
window.removeItem = removeItem;
window.deletePurchase = deletePurchase;
window.generatePurchasePDF = generatePurchasePDF;
window.startEditPurchase = startEditPurchase;