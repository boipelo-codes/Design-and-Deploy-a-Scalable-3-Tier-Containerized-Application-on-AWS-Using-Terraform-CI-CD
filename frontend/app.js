// Connect to server
const socket = io('http://localhost:3000');

// DOM elements
const loginDiv = document.getElementById('login');
const gameDiv = document.getElementById('game');
const usernameInput = document.getElementById('username');
const loginBtn = document.getElementById('loginBtn');
const resultDiv = document.getElementById('result');
const scoreDiv = document.getElementById('score');

let currentUser = null;
let currentRoom = null;
let opponentName = '';
let myRole = null; 

// Login logic
loginBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    if (!username) return alert('Please enter a name');

    try {
        const response = await fetch('http://localhost:3000/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        
        if (!response.ok) throw new Error('User fetch failed');
        
        currentUser = await response.json();

        loginDiv.style.display = 'none';
        gameDiv.style.display = 'block';

        updateScoreDisplay(currentUser.wins, currentUser.losses);
        socket.emit('ready', currentUser.username);
    } catch (err) {
        console.error('Login failed:', err);
        alert('Failed to login. Check if backend is running at :3000');
    }
});

function updateScoreDisplay(wins, losses) {
    scoreDiv.innerHTML = `Wins: ${wins} | Losses: ${losses}`;
}

socket.on('gameStart', (data) => {
    opponentName = data.opponent;
    currentRoom = data.room;
    myRole = data.myRole; 
    resultDiv.innerHTML = `Game started! Playing against <strong>${opponentName}</strong>. Make your move!`;
});

// Move handling
['rock', 'paper', 'scissors'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => makeMove(id));
});

function makeMove(choice) {
    if (!currentRoom) return alert('Waiting for an opponent...');
    
    // Visual feedback that move was sent
    resultDiv.innerHTML = `You chose ${choice}. Waiting for opponent...`;
    socket.emit('move', { choice, room: currentRoom });
}

socket.on('roundResult', async (data) => {
    const { p1Choice, p2Choice, winner } = data;

    // FIX: Determine what "I" chose and what the "Opponent" chose based on myRole
    const myChoice = (myRole === 'player1') ? p1Choice : p2Choice;
    const oppChoice = (myRole === 'player1') ? p2Choice : p1Choice;

    let winnerMessage = '';
    if (winner === 'tie') {
        winnerMessage = "It's a tie!";
    } else {
        winnerMessage = (winner === myRole) ? 'You win!' : 'Opponent wins!';
    }

    resultDiv.innerHTML = `
        <p>You chose: <strong>${myChoice}</strong></p>
        <p>Opponent chose: <strong>${oppChoice}</strong></p>
        <h3 style="color: ${winnerMessage === 'You win!' ? 'green' : 'red'}">${winnerMessage}</h3>
    `;

    // Refresh stats from DB
    try {
        const response = await fetch(`http://localhost:3000/api/users/${currentUser.username}`);
        const updatedUser = await response.json();
        currentUser = updatedUser;
        updateScoreDisplay(updatedUser.wins, updatedUser.losses);
    } catch (err) {
        console.error('Stats refresh failed:', err);
    }
});

socket.on('opponentDisconnected', () => {
    resultDiv.innerHTML = '<b style="color:red">Opponent left the game.</b> Waiting for a new match...';
    currentRoom = null;
});

socket.on('connect_error', (err) => {
    console.error('Connection error:', err.message);
});