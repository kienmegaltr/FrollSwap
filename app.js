document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const connectWalletButton = document.getElementById('connect-wallet');
    const disconnectWalletButton = document.getElementById('disconnect-wallet');
    const walletAddressDisplay = document.getElementById('wallet-address');
    const fromAmountInput = document.getElementById('from-amount');
    const toAmountInput = document.getElementById('to-amount');
    const fromTokenInfo = document.getElementById('from-token-info');
    const toTokenInfo = document.getElementById('to-token-info');
    const fromTokenLogo = document.getElementById('from-token-logo');
    const toTokenLogo = document.getElementById('to-token-logo');
    const swapDirectionButton = document.getElementById('swap-direction');
    const maxButton = document.getElementById('max-button');
    const swapNowButton = document.getElementById('swap-now');
    const transactionFeeDisplay = document.getElementById('transaction-fee');
    const gasFeeDisplay = document.getElementById('gas-fee');
    const networkSelect = document.getElementById('network-select');

    // Blockchain Config
    let provider, signer;
    let selectedNetwork = "VIC"; // Default network

    const networks = {
        VIC: {
            frollTokenAddress: "0xB4d562A8f811CE7F134a1982992Bd153902290BC",
            swapContractAddress: "0x9197BF0813e0727df4555E8cb43a0977F4a3A068",
            rpcUrl: "https://rpc.viction.xyz"
        },
        BNB: {
            frollTokenAddress: "0x7783cBC17d43F936DA1C1D052E4a33a9FfF774c1",
            swapContractAddress: "0xC03217B3eb055D720e90a75fCfAA7577f22e52F9",
            rpcUrl: "https://bsc-dataseed.binance.org/"
        }
    };

    const frollSwapABI = [
        {
            "inputs": [],
            "name": "swapTokenToFroll",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [{ "internalType": "uint256", "name": "frollAmount", "type": "uint256" }],
            "name": "swapFrollToToken",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];

    const frollABI = [
        {
            "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
            "name": "balanceOf",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                { "internalType": "address", "name": "spender", "type": "address" },
                { "internalType": "uint256", "name": "amount", "type": "uint256" }
            ],
            "name": "approve",
            "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];

    let frollSwapContract, frollTokenContract;
    let walletAddress = null;
    let balances = { TOKEN: 0, FROLL: 0 };
    let fromToken = 'TOKEN';
    let toToken = 'FROLL';

    async function updateNetworkConfig() {
        const networkConfig = networks[selectedNetwork];
        provider = new ethers.providers.JsonRpcProvider(networkConfig.rpcUrl);
        signer = provider.getSigner();
        frollSwapContract = new ethers.Contract(networkConfig.swapContractAddress, frollSwapABI, signer);
        frollTokenContract = new ethers.Contract(networkConfig.frollTokenAddress, frollABI, signer);
        if (walletAddress) await updateBalances();
    }

    async function ensureWalletConnected() {
        try {
            if (!window.ethereum) {
                alert('MetaMask is not installed. Please install MetaMask to use this application.');
                return false;
            }
            await window.ethereum.request({ method: "eth_requestAccounts" });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            walletAddress = await signer.getAddress();
            walletAddressDisplay.textContent = `Connected: ${walletAddress}`;
            return true;
        } catch (error) {
            console.error("Failed to connect wallet:", error);
            alert('Failed to connect wallet. Please try again.');
            return false;
        }
    }

    async function updateBalances() {
        try {
            const networkConfig = networks[selectedNetwork];
            balances.TOKEN = parseFloat(ethers.utils.formatEther(await provider.getBalance(walletAddress)));
            balances.FROLL = parseFloat(
                ethers.utils.formatUnits(await frollTokenContract.balanceOf(walletAddress), 18)
            );
            updateTokenDisplay();
        } catch (error) {
            console.error('Error fetching balances:', error);
        }
    }

    function updateTokenDisplay() {
        fromTokenInfo.textContent = `${fromToken}: ${balances[fromToken].toFixed(18)}`;
        toTokenInfo.textContent = `${toToken}: ${balances[toToken].toFixed(18)}`;
    }

    networkSelect.addEventListener('change', async (event) => {
        selectedNetwork = event.target.value;
        await updateNetworkConfig();
    });

    connectWalletButton.addEventListener('click', async () => {
        const connected = await ensureWalletConnected();
        if (!connected) return;
        await updateNetworkConfig();
    });

    disconnectWalletButton.addEventListener('click', () => {
        walletAddress = null;
        walletAddressDisplay.textContent = '';
        fromTokenInfo.textContent = '';
        toTokenInfo.textContent = '';
    });
});
