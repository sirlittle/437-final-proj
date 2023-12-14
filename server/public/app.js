const ws = new WebSocket('ws://' + window.location.host);

// Global variables for storing cached prices
let cachedBitcoinPrice = null;
let cachedEthereumPrice = null;

// Function to fetch and cache prices on load
async function cachePrices() {
    try {
        // Fetch Bitcoin price
        let response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        let priceData = await response.json();
        cachedBitcoinPrice = priceData.bitcoin.usd;

        // Fetch Ethereum price
        response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        priceData = await response.json();
        cachedEthereumPrice = priceData.ethereum.usd;
    } catch (error) {
        console.error('Error fetching prices:', error);
    }
}

// Call cachePrices on load
cachePrices();

ws.onmessage = async function(event) {
    const data = JSON.parse(event.data);
    const bitcoinConfidence = parseFloat(data.bitcoin);
    const ethereumConfidence = parseFloat(data.ethereum);

    if (bitcoinConfidence > 0.70) {
        displayPrice('bitcoin', cachedBitcoinPrice);
    } else if (ethereumConfidence > 0.70) {
        displayPrice('ethereum', cachedEthereumPrice);
    }
};

// Modified showPrice function is no longer needed

function displayPrice(crypto, price) {
    const priceDiv = document.getElementById(`${crypto}Price`);
    if (price) {
        priceDiv.innerText = `${crypto.charAt(0).toUpperCase() + crypto.slice(1)}: $${price}`;
        priceDiv.style.display = 'block';
    } else {
        priceDiv.innerText = `Price not available`;
        priceDiv.style.display = 'block';
    }

    setTimeout(() => {
        priceDiv.style.display = 'none';
    }, 5000);
}
