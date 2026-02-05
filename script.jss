class LudoGame {
    constructor() {
        this.players = ['red', 'blue', 'green', 'yellow'];
        this.currentPlayerIndex = 0;
        this.diceValue = 0;
        this.tokens = {};
        this.tournamentScores = {
            red: 0,
            blue: 0,
            green: 0,
            yellow: 0
        };
        this.gamesPlayed = {
            red: 0,
            blue: 0,
            green: 0,
            yellow: 0
        };
        this.canRoll = true;
        this.selectedToken = null;
        
        this.initializeGame();
        this.setupEventListeners();
        this.drawBoard();
        this.loadTournamentData();
    }

    initializeGame() {
        // Initialize 4 tokens per player
        this.players.forEach((player, pIndex) => {
            this.tokens[player] = [];
            for (let i = 0; i < 4; i++) {
                this.tokens[player].push({
                    id: `${player}-${i}`,
                    position: -1, // -1 means in home
                    isHome: true,
                    isFinished: false,
                    player: player
                });
            }
        });
        this.createTokenElements();
        this.updateDisplay();
    }

    drawBoard() {
        const board = document.getElementById('ludo-board');
        const cellSize = 40;
        
        // Draw the track cells (simplified version)
        const trackCells = this.getTrackCells();
        
        trackCells.forEach((cell, index) => {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', cell.x);
            rect.setAttribute('y', cell.y);
            rect.setAttribute('width', cellSize);
            rect.setAttribute('height', cellSize);
            rect.setAttribute('fill', cell.safe ? '#90EE90' : 'white');
            rect.setAttribute('stroke', '#000');
            rect.setAttribute('stroke-width', '1');
            rect.classList.add('track-cell');
            rect.dataset.position = index;
            board.appendChild(rect);
        });
    }

    getTrackCells() {
        // Simplified track layout for Ludo board
        const cells = [];
        const cellSize = 40;
        
        // Create a circular track around the board
        // Starting positions for each color
        const tracks = {
            red: { startX: 240, startY: 200 },
            blue: { startX: 360, startY: 240 },
            green: { startX: 200, startY: 360 },
            yellow: { startX: 240, startY: 360 }
        };
        
        // Vertical left track (positions 0-5)
        for (let i = 0; i < 6; i++) {
            cells.push({ x: 200, y: 240 + (i * cellSize), safe: i === 0 });
        }
        
        // Horizontal bottom track (positions 6-11)
        for (let i = 0; i < 6; i++) {
            cells.push({ x: 200 + (i * cellSize), y: 400, safe: false });
        }
        
        // Vertical right track (positions 12-17)
        for (let i = 0; i < 6; i++) {
            cells.push({ x: 400, y: 400 - (i * cellSize), safe: i === 0 });
        }
        
        // Horizontal top track (positions 18-23)
        for (let i = 0; i < 6; i++) {
            cells.push({ x: 400 - (i * cellSize), y: 160, safe: false });
        }
        
        // Continue around (positions 24-51 to complete the loop)
        for (let i = 0; i < 28; i++) {
            const angle = (i / 28) * Math.PI * 2;
            cells.push({
                x: 300 + Math.cos(angle) * 120,
                y: 300 + Math.sin(angle) * 120,
                safe: i % 13 === 0
            });
        }
        
        return cells;
    }

    createTokenElements() {
        const container = document.getElementById('tokens-container');
        container.innerHTML = '';
        
        this.players.forEach((player, pIndex) => {
            this.tokens[player].forEach((token, tIndex) => {
                const tokenEl = document.createElement('div');
                tokenEl.className = `token ${player}`;
                tokenEl.id = token.id;
                tokenEl.dataset.player = player;
                tokenEl.dataset.index = tIndex;
                
                // Position in home area
                const homePositions = this.getHomePositions(player);
                tokenEl.style.left = homePositions[tIndex].x + 'px';
                tokenEl.style.top = homePositions[tIndex].y + 'px';
                
                tokenEl.addEventListener('click', () => this.onTokenClick(token));
                
                container.appendChild(tokenEl);
            });
        });
    }

    getHomePositions(player) {
        const positions = {
            red: [
                { x: 60, y: 60 },
                { x: 140, y: 60 },
                { x: 60, y: 140 },
                { x: 140, y: 140 }
            ],
            blue: [
                { x: 420, y: 60 },
                { x: 500, y: 60 },
                { x: 420, y: 140 },
                { x: 500, y: 140 }
            ],
            green: [
                { x: 60, y: 420 },
                { x: 140, y: 420 },
                { x: 60, y: 500 },
                { x: 140, y: 500 }
            ],
            yellow: [
                { x: 420, y: 420 },
                { x: 500, y: 420 },
                { x: 420, y: 500 },
                { x: 500, y: 500 }
            ]
        };
        return positions[player];
    }

    setupEventListeners() {
        document.getElementById('roll-btn').addEventListener('click', () => this.rollDice());
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('reset-tournament-btn').addEventListener('click', () => this.resetTournament());
    }

    rollDice() {
        if (!this.canRoll) return;
        
        const dice = document.getElementById('dice');
        const btn = document.getElementById('roll-btn');
        
        btn.disabled = true;
        dice.classList.add('rolling');
        
        setTimeout(() => {
            this.diceValue = Math.floor(Math.random() * 6) + 1;
            dice.querySelector('.dice-face').textContent = this.diceValue;
            dice.classList.remove('rolling');
            
            this.canRoll = false;
            this.handleDiceRoll();
        }, 500);
    }

    handleDiceRoll() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const movableTokens = this.getMovableTokens(currentPlayer);
        
        if (movableTokens.length === 0) {
            this.showMessage(`No valid moves for ${currentPlayer}!`);
            setTimeout(() => {
                if (this.diceValue !== 6) {
                    this.nextPlayer();
                } else {
                    this.canRoll = true;
                    document.getElementById('roll-btn').disabled = false;
                    this.showMessage(`${currentPlayer} rolled a 6! Roll again!`);
                }
            }, 1500);
        } else {
            this.highlightMovableTokens(movableTokens);
            this.showMessage(`Select a token to move ${this.diceValue} steps`);
        }
    }

    getMovableTokens(player) {
        return this.tokens[player].filter(token => {
            if (token.isFinished) return false;
            if (token.isHome && this.diceValue === 6) return true;
            if (!token.isHome && token.position + this.diceValue <= 51) return true;
            return false;
        });
    }

    highlightMovableTokens(tokens) {
        document.querySelectorAll('.token').forEach(el => {
            el.classList.remove('selectable');
        });
        
        tokens.forEach(token => {
            document.getElementById(token.id).classList.add('selectable');
        });
    }

    onTokenClick(token) {
        if (!token.id) return;
        const tokenEl = document.getElementById(token.id);
        if (!tokenEl.classList.contains('selectable')) return;
        
        this.moveToken(token);
    }

    moveToken(token) {
        document.querySelectorAll('.token').forEach(el => {
            el.classList.remove('selectable');
        });
        
        if (token.isHome && this.diceValue === 6) {
            token.isHome = false;
            token.position = 0;
        } else {
            token.position += this.diceValue;
        }
        
        // Check if token reached finish
        if (token.position >= 51) {
            token.isFinished = true;
            this.showMessage(`${token.player} token reached home!`);
            this.checkWinner();
        }
        
        this.updateTokenPosition(token);
        
        setTimeout(() => {
            if (this.diceValue === 6) {
                this.canRoll = true;
                document.getElementById('roll-btn').disabled = false;
                this.showMessage(`Rolled a 6! Roll again!`);
            } else {
                this.nextPlayer();
            }
        }, 500);
    }

    updateTokenPosition(token) {
        const tokenEl = document.getElementById(token.id);
        if (token.isFinished) {
            tokenEl.style.left = '285px';
            tokenEl.style.top = '285px';
            tokenEl.style.opacity = '0.5';
        } else if (!token.isHome) {
            const trackCells = this.getTrackCells();
            if (trackCells[token.position]) {
                tokenEl.style.left = trackCells[token.position].x + 'px';
                tokenEl.style.top = trackCells[token.position].y + 'px';
            }
        }
    }

    checkWinner() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const finishedTokens = this.tokens[currentPlayer].filter(t => t.isFinished).length;
        
        if (finishedTokens === 4) {
            this.tournamentScores[currentPlayer]++;
            this.gamesPlayed[currentPlayer]++;
            this.showMessage(`🎉 ${currentPlayer.toUpperCase()} WINS! 🎉`);
            this.saveTournamentData();
            this.updateDisplay();
            
            setTimeout(() => {
                if (confirm(`${currentPlayer} wins! Start a new game?`)) {
                    this.newGame();
                }
            }, 1000);
        }
    }

    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.canRoll = true;
        document.getElementById('roll-btn').disabled = false;
        this.updateDisplay();
        this.showMessage(`${this.players[this.currentPlayerIndex]}'s turn - Roll the dice!`);
    }

    showMessage(msg) {
        document.getElementById('game-message').textContent = msg;
    }

    updateDisplay() {
        document.getElementById('current-player-display').textContent = 
            this.players[this.currentPlayerIndex].toUpperCase();
        document.getElementById('current-player-display').style.color = 
            this.players[this.currentPlayerIndex];
        
        this.players.forEach(player => {
            const scoreEl = document.querySelector(`#score-${player} .score`);
            scoreEl.textContent = this.tournamentScores[player];
        });
        
        this.updateLeaderboard();
    }

    updateLeaderboard() {
        const tbody = document.getElementById('leaderboard-body');
        tbody.innerHTML = '';
        
        const standings = this.players.map(player => ({
            name: player,
            wins: this.tournamentScores[player],
            games: this.gamesPlayed[player]
        })).sort((a, b) => b.wins - a.wins);
        
        standings.forEach((player, index) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td style="color: ${player.name}; font-weight: bold;">${player.name.toUpperCase()}</td>
                <td>${player.wins}</td>
                <td>${player.games}</td>
            `;
        });
    }

    newGame() {
        this.currentPlayerIndex = 0;
        this.diceValue = 0;
        this.canRoll = true;
        this.selectedToken = null;
        document.getElementById('dice').querySelector('.dice-face').textContent = '?';
        document.getElementById('roll-btn').disabled = false;
        
        this.initializeGame();
        this.showMessage('New game started! Red player begins.');
    }

    resetTournament() {
        if (confirm('Are you sure you want to reset the tournament scores?')) {
            this.players.forEach(player => {
                this.tournamentScores[player] = 0;
                this.gamesPlayed[player] = 0;
            });
            this.saveTournamentData();
            this.updateDisplay();
            this.showMessage('Tournament scores reset!');
        }
    }

    saveTournamentData() {
        localStorage.setItem('ludoTournamentScores', JSON.stringify(this.tournamentScores));
        localStorage.setItem('ludoGamesPlayed', JSON.stringify(this.gamesPlayed));
    }

    loadTournamentData() {
        const savedScores = localStorage.getItem('ludoTournamentScores');
        const savedGames = localStorage.getItem('ludoGamesPlayed');
        
        if (savedScores) {
            this.tournamentScores = JSON.parse(savedScores);
        }
        if (savedGames) {
            this.gamesPlayed = JSON.parse(savedGames);
        }
        
        this.updateDisplay();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new LudoGame();
});
