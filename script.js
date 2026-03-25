/* ============================================================================
   CONFIGURAÇÃO E ESTADO GLOBAL
   ============================================================================ */

// Armazena todos os cenários
let scenarios = {};

// Cenário ativo atual
let activeScenario = null;

// Dados de votos para cada cenário
let votesData = {};

const STORAGE_KEY = 'votationScenarios';

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Carrega dados do localStorage
    loadScenariosFromStorage();

    // Configura listeners das abas
    setupTabListeners();

    // Configura formulário de cenário
    setupScenarioForm();

    // Configura formulário de votação
    setupVotingForm();

    // Configura botões de voltar e ações
    setupBackButtons();

    // Configura modal de exclusão
    setupDeleteModal();

    // Renderiza lista de cenários salvos
    renderScenariosList();
}

// ============================================================================
// GERENCIAMENTO DE ARMAZENAMENTO
// ============================================================================

function saveScenarioToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        scenarios: scenarios,
        votesData: votesData
    }));
}

function loadScenariosFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
        try {
            const data = JSON.parse(stored);
            scenarios = data.scenarios || {};
            votesData = data.votesData || {};
        } catch (e) {
            console.error('Erro ao carregar cenários:', e);
            scenarios = {};
            votesData = {};
        }
    } else {
        // Cenário padrão para demonstração
        createDefaultScenario();
    }
}

function createDefaultScenario() {
    const defaultId = 'default_' + Date.now();
    scenarios[defaultId] = {
        id: defaultId,
        title: 'Qual linguagem você prefere?',
        options: ['JavaScript', 'Python', 'Java', 'C#'],
        createdAt: new Date().toLocaleString('pt-BR')
    };
    votesData[defaultId] = {
        'JavaScript': 4,
        'Python': 4,
        'Java': 2,
        'C#': 2
    };
    saveScenarioToStorage();
}

// ============================================================================
// CONFIGURAÇÃO DE ABAS
// ============================================================================

function setupTabListeners() {
    const tabs = document.querySelectorAll('.config-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Remove ativo das abas
    document.querySelectorAll('.config-tab').forEach(tab => {
        tab.classList.remove('config-tab--active');
    });

    document.querySelectorAll('.config-tab-content').forEach(content => {
        content.classList.remove('config-tab-content--active');
    });

    // Ativa a aba selecionada
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('config-tab--active');
    document.getElementById(tabName + 'Tab').classList.add('config-tab-content--active');

    // Se for a aba de seleção, renderiza a lista
    if (tabName === 'select') {
        renderScenariosList();
    }
}

// ============================================================================
// FORMULÁRIO DE CENÁRIO
// ============================================================================

function setupScenarioForm() {
    const form = document.getElementById('scenarioForm');
    const addOptionBtn = document.getElementById('addOptionBtn');

    form.addEventListener('submit', handleScenarioSubmit);
    addOptionBtn.addEventListener('click', addOptionInput);

    // Setup do primeiro conjunto de inputs
    setupOptionInputListeners();
}

function setupOptionInputListeners() {
    const container = document.getElementById('optionsContainer');
    const inputs = container.querySelectorAll('.option-input-field');

    inputs.forEach((input, index) => {
        const removeBtn = input.parentElement.querySelector('.btn--remove-option');
        
        // Mostra botão de remover se houver mais de 2 opções
        if (inputs.length > 2) {
            removeBtn.style.display = 'block';
        }

        removeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            removeOptionInput(input);
        });
    });
}

function addOptionInput(e) {
    e.preventDefault();

    const container = document.getElementById('optionsContainer');
    const optionCount = container.querySelectorAll('.option-input-group').length + 1;

    const newGroup = document.createElement('div');
    newGroup.className = 'option-input-group';
    newGroup.innerHTML = `
        <input 
            type="text" 
            class="form-input option-input-field"
            placeholder="Opção ${optionCount}"
            data-option="${optionCount}"
        >
        <button type="button" class="btn btn--small btn--remove-option">×</button>
    `;

    container.appendChild(newGroup);

    // Setup listeners para a nova opção
    const removeBtn = newGroup.querySelector('.btn--remove-option');
    removeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        removeOptionInput(newGroup.querySelector('.option-input-field'));
    });

    // Atualiza visibilidade de botões de remover
    updateRemoveButtons();
}

function removeOptionInput(input) {
    const container = document.getElementById('optionsContainer');
    const inputs = container.querySelectorAll('.option-input-field');

    if (inputs.length > 2) {
        input.parentElement.remove();
        updateRemoveButtons();
    } else {
        showError('Você precisa de pelo menos 2 opções!');
    }
}

function updateRemoveButtons() {
    const container = document.getElementById('optionsContainer');
    const inputs = container.querySelectorAll('.option-input-field');
    const removeBtns = container.querySelectorAll('.btn--remove-option');

    removeBtns.forEach(btn => {
        btn.style.display = inputs.length > 2 ? 'block' : 'none';
    });
}

function handleScenarioSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('scenarioTitle').value.trim();
    const optionInputs = document.querySelectorAll('.option-input-field');
    
    const options = Array.from(optionInputs)
        .map(input => input.value.trim())
        .filter(value => value.length > 0);

    // Validações
    if (!title) {
        showError('Por favor, insira uma pergunta.');
        return;
    }

    if (options.length < 2) {
        showError('Você precisa de pelo menos 2 opções.');
        return;
    }

    // Cria novo cenário
    const scenarioId = 'scenario_' + Date.now();
    scenarios[scenarioId] = {
        id: scenarioId,
        title: title,
        options: options,
        createdAt: new Date().toLocaleString('pt-BR')
    };

    // Inicializa votos
    votesData[scenarioId] = {};
    options.forEach(option => {
        votesData[scenarioId][option] = 0;
    });

    // Salva e reseta
    saveScenarioToStorage();
    document.getElementById('scenarioForm').reset();
    showSuccess('Cenário criado com sucesso!');

    // Aguarda um pouco e seleciona o novo cenário
    setTimeout(() => {
        selectScenario(scenarioId);
        switchTab('select');
        renderScenariosList();
    }, 500);
}

// ============================================================================
// LISTA DE CENÁRIOS
// ============================================================================

function renderScenariosList() {
    const list = document.getElementById('scenariosList');
    
    if (Object.keys(scenarios).length === 0) {
        list.innerHTML = '<p class="empty-message">Nenhum cenário salvo ainda.</p>';
        return;
    }

    let html = '';
    for (const [id, scenario] of Object.entries(scenarios)) {
        // Não mostra cenários de segundo turno na lista principal
        if (scenario.isSecondRound) continue;

        const totalVotes = Object.values(votesData[id] || {})
            .reduce((a, b) => a + b, 0);
        
        const isActive = activeScenario === id ? 'scenario-item--active' : '';
        
        html += `
            <div class="scenario-item ${isActive}" data-scenario-id="${id}">
                <div class="scenario-content">
                    <div class="scenario-title">${escapeHtml(scenario.title)}</div>
                    <div class="scenario-count">${scenario.options.length} opções</div>
                    <div class="scenario-count">${totalVotes} votos</div>
                </div>
                <button class="btn btn--small btn--danger btn-delete-scenario" data-scenario-id="${id}" title="Excluir cenário">×</button>
            </div>
        `;
    }

    list.innerHTML = html;

    // Setup listeners para seleção
    list.querySelectorAll('.scenario-item').forEach(item => {
        item.addEventListener('click', function(e) {
            // Não ativa se clicou no botão de deletar
            if (!e.target.classList.contains('btn-delete-scenario')) {
                const scenarioId = this.dataset.scenarioId;
                selectScenario(scenarioId);
            }
        });
    });

    // Setup listeners para deletar
    list.querySelectorAll('.btn-delete-scenario').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const scenarioId = this.dataset.scenarioId;
            deleteScenario(scenarioId);
        });
    });
}

function selectScenario(scenarioId) {
    if (!scenarios[scenarioId]) {
        showError('Cenário não encontrado.');
        return;
    }

    activeScenario = scenarioId;
    saveScenarioToStorage();

    // Renderiza opções de votação
    renderVotingOptions();

    // Mostra seção de votação
    document.querySelector('.config-section').style.display = 'none';
    document.getElementById('votingSection').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'block';

    // Atualiza resultados
    updateResults();

    // Renderiza lista de cenários para mostrar ativo
    renderScenariosList();
}

// ============================================================================
// OPÇÕES DE VOTAÇÃO
// ============================================================================

function renderVotingOptions() {
    if (!activeScenario || !scenarios[activeScenario]) {
        return;
    }

    const scenario = scenarios[activeScenario];
    const optionsContainer = document.getElementById('votingOptions');
    const votingTitle = document.getElementById('votingTitle');

    // Atualiza título
    votingTitle.textContent = scenario.title;

    // Renderiza opções
    let html = '';
    scenario.options.forEach((option, index) => {
        const optionId = 'option_' + index;
        html += `
            <label class="option-label">
                <input 
                    type="radio" 
                    name="option" 
                    value="${escapeHtml(option)}" 
                    id="${optionId}"
                    class="option-input"
                    required
                >
                <div class="option-box">
                    <span class="option-icon">◉</span>
                    <span class="option-text">${escapeHtml(option)}</span>
                </div>
            </label>
        `;
    });

    optionsContainer.innerHTML = html;
}

// ============================================================================
// FORMULÁRIO DE VOTAÇÃO
// ============================================================================

function setupVotingForm() {
    const form = document.getElementById('votingForm');
    form.addEventListener('submit', handleVoteSubmit);
}

function handleVoteSubmit(e) {
    e.preventDefault();

    if (!activeScenario) {
        showError('Por favor, selecione um cenário primeiro.');
        return;
    }

    const selectedOption = document.querySelector('input[name="option"]:checked');

    if (!selectedOption) {
        showError('Por favor, selecione uma opção.');
        return;
    }

    const option = selectedOption.value;
    submitVote(option);
}

function submitVote(option) {
    const submitButton = document.querySelector('.voting-form .btn--primary');
    submitButton.disabled = true;

    // Simula requisição ao servidor
    setTimeout(() => {
        try {
            // Incrementa voto
            votesData[activeScenario][option]++;

            // Salva dados
            saveScenarioToStorage();

            // Atualiza resultados
            updateResults();

            // Mostra sucesso
            showSuccess(`Voto em "${option}" registrado com sucesso!`);

            // Reseta formulário
            document.getElementById('votingForm').reset();

            // Reabilita botão
            submitButton.disabled = false;

        } catch (error) {
            console.error('Erro ao registrar voto:', error);
            showError('Ocorreu um erro ao registrar o voto.');
            submitButton.disabled = false;
        }
    }, 500);
}

// ============================================================================
// ATUALIZAÇÃO DE RESULTADOS
// ============================================================================

function updateResults() {
    if (!activeScenario || !scenarios[activeScenario]) {
        return;
    }

    const scenario = scenarios[activeScenario];
    const votes = votesData[activeScenario];
    const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

    // Encontra o máximo de votos para identificar o vencedor
    const maxVotes = totalVotes > 0 ? Math.max(...Object.values(votes)) : 0;
    const hasWinner = maxVotes > 0 && Object.values(votes).filter(v => v === maxVotes).length === 1;

    const resultsContainer = document.getElementById('resultsContainer');
    let html = '';

    scenario.options.forEach(option => {
        const optionVotes = votes[option] || 0;
        const percentage = totalVotes > 0 ? (optionVotes / totalVotes * 100) : 0;
        
        // Aplica classe winner se for o vencedor único
        const isWinner = hasWinner && optionVotes === maxVotes;
        const winnerClass = isWinner ? ' result-item--winner' : '';
        
        // Adiciona partículas de confetti para o vencedor
        const particles = isWinner ? `
            <div class="particle particle-1">✨</div>
            <div class="particle particle-2">⭐</div>
            <div class="particle particle-3">✨</div>
        ` : '';

        html += `
            <div class="result-item${winnerClass}">
                <div class="result-header">
                    <span class="result-language">${escapeHtml(option)}</span>
                    <span class="result-count">${optionVotes}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%;"></div>
                </div>
                ${particles}
            </div>
        `;
    });

    resultsContainer.innerHTML = html;

    // Atualiza total de votos
    const totalVotesElement = document.getElementById('totalVotes');
    totalVotesElement.innerHTML = `Total de votos: <strong>${totalVotes}</strong>`;
}

// ============================================================================
// BOTÕES DE VOLTAR
// ============================================================================

function setupBackButtons() {
    const backBtn1 = document.getElementById('backBtn');
    const backBtn2 = document.getElementById('backBtn2');
    const resetVotesBtn = document.getElementById('resetVotesBtn');
    const endVotingBtn = document.getElementById('endVotingBtn');

    if (backBtn1) {
        backBtn1.addEventListener('click', goBack);
    }

    if (backBtn2) {
        backBtn2.addEventListener('click', goBack);
    }

    if (resetVotesBtn) {
        resetVotesBtn.addEventListener('click', resetVotes);
    }

    if (endVotingBtn) {
        endVotingBtn.addEventListener('click', endVoting);
    }
}

function goBack() {
    activeScenario = null;
    
    // Mostra seção de configuração
    document.querySelector('.config-section').style.display = 'block';
    document.getElementById('votingSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';

    // Vai para aba de seleção
    switchTab('select');
}

// ============================================================================
// GERENCIAMENTO DE VOTOS
// ============================================================================

function resetVotes() {
    if (!activeScenario) {
        showError('Nenhum cenário selecionado.');
        return;
    }

    const isConfirmed = confirm('Tem certeza que deseja ZERAR todos os votos deste cenário?');
    
    if (isConfirmed) {
        // Reseta todos os votos para 0
        const scenario = scenarios[activeScenario];
        scenario.options.forEach(option => {
            votesData[activeScenario][option] = 0;
        });

        // Salva e atualiza
        saveScenarioToStorage();
        updateResults();
        showSuccess('Votos zerados com sucesso!');
    }
}

function endVoting() {
    if (!activeScenario) {
        showError('Nenhum cenário selecionado.');
        return;
    }

    // Verifica se há empate
    const tiedOptions = checkForTie();

    if (tiedOptions && tiedOptions.length > 1) {
        showTieModal(tiedOptions);
    } else {
        // Se não houver empate, apenas muda para resultados
        switchToResults();
        showSuccess('Votação encerrada!');
    }
}

function checkForTie() {
    const votes = votesData[activeScenario];
    const voteValues = Object.values(votes);
    
    // Se não há votos, não há empate
    if (voteValues.length === 0 || Math.max(...voteValues) === 0) {
        return null;
    }

    const maxVotes = Math.max(...voteValues);
    const tiedOptions = Object.entries(votes)
        .filter(([_, count]) => count === maxVotes)
        .map(([option, _]) => option);

    // Retorna empate apenas se houver mais de uma opção com o mesmo máximo
    return tiedOptions.length > 1 ? tiedOptions : null;
}

function showTieModal(tiedOptions) {
    const modal = document.getElementById('tieModal');
    const tieMessage = document.getElementById('tieOptionsMessage');
    
    const optionsText = tiedOptions.join(', ');
    tieMessage.textContent = `Opções empatadas: ${optionsText}`;

    modal.style.display = 'flex';

    const startBtn = document.getElementById('startSecondRoundBtn');
    const skipBtn = document.getElementById('skipSecondRoundBtn');

    startBtn.onclick = () => {
        modal.style.display = 'none';
        createSecondRound(tiedOptions);
    };

    skipBtn.onclick = () => {
        modal.style.display = 'none';
        switchToResults();
        showSuccess('Votação encerrada!');
    };
}

function createSecondRound(tiedOptions) {
    // Cria um novo cenário com as opções empatadas
    const secondRoundId = 'second_round_' + activeScenario + '_' + Date.now();
    const originalScenario = scenarios[activeScenario];

    scenarios[secondRoundId] = {
        id: secondRoundId,
        title: `🔄 Segundo Turno - ${originalScenario.title}`,
        options: tiedOptions,
        parentScenario: activeScenario,
        isSecondRound: true,
        createdAt: new Date().toLocaleString('pt-BR')
    };

    // Inicializa votos zerados
    votesData[secondRoundId] = {};
    tiedOptions.forEach(option => {
        votesData[secondRoundId][option] = 0;
    });

    // Salva dados
    saveScenarioToStorage();

    // Muda para o novo cenário
    activeScenario = secondRoundId;
    renderVotingOptions();
    updateResults();

    showSuccess(`Segundo turno iniciado! Opções: ${tiedOptions.join(', ')}`);
}

// ============================================================================
// EXCLUSÃO DE CENÁRIOS
// ============================================================================

function setupDeleteModal() {
    const modal = document.getElementById('deleteModal');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const cancelBtn = document.getElementById('cancelDeleteBtn');

    confirmBtn.addEventListener('click', confirmDelete);
    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

let scenarioToDelete = null;

function deleteScenario(scenarioId) {
    scenarioToDelete = scenarioId;
    const scenario = scenarios[scenarioId];
    
    const modal = document.getElementById('deleteModal');
    const message = document.getElementById('modalMessage');

    message.textContent = `Tem certeza que deseja excluir o cenário "${scenario.title}"? Esta ação não pode ser desfeita.`;
    modal.style.display = 'flex';
}

function confirmDelete() {
    if (!scenarioToDelete) return;

    const id = scenarioToDelete;
    const wasCurrent = activeScenario === id;

    // Remove o cenário
    delete scenarios[id];
    delete votesData[id];

    // Salva dados
    saveScenarioToStorage();

    // Fecha modal
    document.getElementById('deleteModal').style.display = 'none';

    showSuccess('Cenário excluído com sucesso!');

    // Se era o cenário atual, volta
    if (wasCurrent) {
        goBack();
    } else {
        // Renderiza lista novamente
        renderScenariosList();
    }

    scenarioToDelete = null;
}

// ============================================================================
// MENSAGENS DE FEEDBACK
// ============================================================================

function showSuccess(message) {
    const successElement = document.getElementById('successMessage');
    if (successElement) {
        successElement.textContent = '✓ ' + message;
        successElement.style.display = 'block';

        setTimeout(() => {
            successElement.style.display = 'none';
        }, 3000);
    }
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = '✕ ' + message;
        errorElement.style.display = 'block';

        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 3000);
    }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function switchToResults() {
    // Esconde a seção de votação
    document.getElementById('votingSection').style.display = 'none';
    
    // Mostra a seção de resultados
    document.getElementById('resultsSection').style.display = 'block';
    
    // Scroll para a seção de resultados
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
}