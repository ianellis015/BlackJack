document.addEventListener('DOMContentLoaded', () => {

    // Define the initial bankroll
    let bankroll = localStorage.getItem('bankroll') ? parseInt(localStorage.getItem('bankroll'), 10) : 100;

    // Cache DOM elements
    const balanceElement = document.getElementById('balance');
    const betInput = document.getElementById('bet-amount');
    const startButton = document.querySelector('.start-button');
    const gameDiv = document.querySelector('.game');
    const playerCardsDiv = document.getElementById('player-cards');
    const dealerCardsDiv = document.getElementById('dealer-cards');
    const playerValueSpan = document.getElementById('player-value');
    const dealerValueSpan = document.getElementById('dealer-value');
    const hitButton = document.querySelector('.hit-button');
    const standButton = document.querySelector('.stand-button');
    const resultDiv = document.querySelector('.result');
    const resultMessage = document.getElementById('result-message');
    const nextRoundButton = document.querySelector('.next-round-button');
    const currentBet = document.getElementById('curr-bet');
    const resetButton = document.querySelector('.reset-button');
    const quickBetButtons = document.querySelectorAll('.quick-bet');
    const quickBetDiv = document.querySelector('.quick-bet-buttons');
    const header = document.querySelector('.Header');
    const icons = document.querySelectorAll('.icon');
    
    // Function to update the balance display
    function updateBalanceDisplay() {
        balanceElement.textContent = bankroll;
        localStorage.setItem('bankroll', bankroll); // Save bankroll to local storage
    }

    // Update the balance display initially
    updateBalanceDisplay();

    function updateBetDisplay() {
        let myBet = betInput.value;
        currentBet.textContent = myBet;
    }

    // Update the bet display initially
    betInput.addEventListener('input', updateBetDisplay);

    // Event listener for quick bet buttons
    quickBetButtons.forEach(button => {
        button.addEventListener('click', () => {
            betInput.value = button.getAttribute('data-amount');
            updateBetDisplay();
        });
    });

    // Event listener for Start button
    startButton.addEventListener('click', () => {
        startGame();
    });

    // Event Listener for Enter key
    betInput.addEventListener('keyup', e => {
        e.preventDefault();
        if (e.key === 'Enter') {
            startGame();
        }
    });

    let deck, playerHand, dealerHand, bet;

    function startGame() {
        bet = parseInt(betInput.value, 10);
        if (isNaN(bet) || bet <= 0 || bet > bankroll) {
            alert('Invalid bet amount. Please enter a valid number within your balance.');
            return;
        }
        // When the game starts, the current bet is displayed
        updateBetDisplay();

        gameDiv.classList.add('active');
        startButton.classList.add('hidden');
        betInput.classList.add('hidden');
        quickBetDiv.classList.add('hidden');
        resultDiv.classList.add('hidden');
        header.classList.add('hidden');
        icons.forEach(icon => icon.classList.add('hidden'));

        deck = new Deck();
        playerHand = new Hand();
        dealerHand = new Hand();
        playerHand.addCard(deck.dealCard());
        playerHand.addCard(deck.dealCard());
        dealerHand.addCard(deck.dealCard());
        dealerHand.addCard(deck.dealCard());
        updateHandsDisplay(true);
        enablePlayerActions();
        // Check for blackjack
        if (calculateHandValue(playerHand) === 21 && playerHand.cards.length === 2) {
            playerWinsBlackjack();
        }
    }

    function updateHandsDisplay(hideDealerCard = false) {
        playerCardsDiv.innerHTML = playerHand.cards.map(card => `<img class="player-cards" src="${card.getImagePath()}" alt="${card.toString()}">`).join('');
        playerValueSpan.textContent = calculateHandValue(playerHand);

        if (hideDealerCard) {
            dealerCardsDiv.innerHTML = `<img class="dealer-cards" src="${dealerHand.cards[0].getImagePath()}" alt="${dealerHand.cards[0].toString()}"><img class="dealer-cards" src="playing-cards/back.svg" alt="Hidden Card">`;
            dealerValueSpan.textContent = calculateCardValue(dealerHand.cards[0]);
        } else {
            dealerCardsDiv.innerHTML = dealerHand.cards.map(card => `<img class="dealer-cards" src="${card.getImagePath()}" alt="${card.toString()}">`).join('');
            dealerValueSpan.textContent = calculateHandValue(dealerHand);
        }
        const playerCards = document.querySelectorAll(".player-cards");
        const dealerCards = document.querySelectorAll(".dealer-cards");
        updateCardSizes(playerCards);
        updateCardSizes(dealerCards);
    }

    function updateCardSizes(cards) {
        const count = cards.length;

        cards.forEach(card => {
            card.classList.remove("small", "medium", "large");

            if (count === 2) {
                card.classList.add("large");
            } else if (count === 3) {
                card.classList.add("medium");
            } else {
                card.classList.add("small");
            }
        });
    }

    function enablePlayerActions() {
        hitButton.classList.remove('hidden');
        standButton.classList.remove('hidden');
        hitButton.disabled = false;
        standButton.disabled = false;
    }

    function disablePlayerActions() {
        hitButton.classList.add('hidden');
        standButton.classList.add('hidden');
        hitButton.disabled = true;
        standButton.disabled = true;
    }

    function endRound(message) {
        resultMessage.textContent = message;
        resultDiv.classList.remove('hidden');
        nextRoundButton.classList.remove('hidden');
        updateBalanceDisplay();

        // Show play again button when balance reaches zero
        if (bankroll <= 0) {
            nextRoundButton.classList.add('hidden');
            resetButton.classList.remove('hidden');
        } else {
            resetButton.classList.add('hidden');
        }
        updateHandsDisplay();
    }

    function playerWinsBlackjack() {
        bankroll += bet * 2;
        endRound("Blackjack! You win!");
        disablePlayerActions();
    }

    hitButton.addEventListener('click', () => {
        playerHand.addCard(deck.dealCard());
        updateHandsDisplay(true);
        if (calculateHandValue(playerHand) > 21) {
            bankroll = adjustBankroll(bankroll, bet, 'lose');
            disablePlayerActions();
            endRound("Bust! You lose.");
        }
    });

    standButton.addEventListener('click', () => {
        disablePlayerActions();
        dealerTurn();
    });

    nextRoundButton.addEventListener('click', () => {
        startButton.classList.remove('hidden');
        betInput.classList.remove('hidden');
        gameDiv.classList.remove('active');
        resultDiv.classList.add('hidden');
        quickBetDiv.classList.remove('hidden');
        header.classList.remove('hidden');
        icons.forEach(icon => icon.classList.remove('hidden'));
    });

    resetButton.addEventListener('click', () => {
        bankroll = 100;
        updateBalanceDisplay();
        startButton.classList.remove('hidden');
        betInput.classList.remove('hidden');
        gameDiv.classList.remove('active');
        resultDiv.classList.add('hidden');
        quickBetDiv.classList.remove('hidden');
        header.classList.remove('hidden');
        icons.forEach(icon => icon.classList.remove('hidden')); 
    });

    function dealerTurn() {
        while (calculateHandValue(dealerHand) < 17) {
            dealerHand.addCard(deck.dealCard());
        }
        updateHandsDisplay();
        if (calculateHandValue(dealerHand) > 21) {
            bankroll = adjustBankroll(bankroll, bet, 'win');
            endRound("Dealer busts! You win.");
        } else if (calculateHandValue(playerHand) > calculateHandValue(dealerHand)) {
            bankroll = adjustBankroll(bankroll, bet, 'win');
            endRound("You win!");
        } else if (calculateHandValue(playerHand) < calculateHandValue(dealerHand)) {
            bankroll = adjustBankroll(bankroll, bet, 'lose');
            endRound("You lose");
        } else {
            endRound("Push");
        }
    }

    // Helper functions/Game logic
    class Card {
        constructor(rank, suit) {
            this.rank = rank;
            this.suit = suit;
        }

        toString() {
            return `${this.rank} of ${this.suit}`;
        }

        getImagePath() {
            return `playing-cards/${this.rank}_of_${this.suit.toLowerCase()}.svg`
        }
    }

    class Deck {
        static ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
        static suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];

        constructor() {
            this.cards = [];
            for (let rank of Deck.ranks) {
                for (let suit of Deck.suits) {
                    this.cards.push(new Card(rank, suit));
                }
            }
            this.shuffle();
        }

        shuffle() {
            for (let i = this.cards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
            }
        }

        dealCard() {
            return this.cards.pop();
        }
    }

    class Hand {
        constructor() {
            this.cards = [];
            this.value = 0;
            this.aces = 0;
        }

        addCard(card) {
            this.cards.push(card);
            if (['Jack', 'Queen', 'King'].includes(card.rank)) {
                this.value += 10;
            } else if (card.rank === 'Ace') {
                this.value += 11;
                this.aces += 1;
            } else {
                this.value += parseInt(card.rank, 10);
            }
        }

        adjustForAce() {
            while (this.value > 21 && this.aces > 0) {
                this.value -= 10;
                this.aces -= 1;
            }
        }
    }

    function calculateHandValue(hand) {
        hand.adjustForAce();
        return hand.value;
    }

    function calculateCardValue(card) {
        if (['Jack', 'Queen', 'King'].includes(card.rank)) {
            return 10;
        } else if (card.rank === 'Ace') {
            return 11;
        } else {
            return parseInt(card.rank, 10);
        }
    }

    function adjustBankroll(bankroll, bet, result) {
        if (result === 'win') {
            return bankroll + bet;
        } else if (result === 'lose') {
            return bankroll - bet;
        }
        return bankroll;
    }
});
