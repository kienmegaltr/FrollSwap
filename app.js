document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const connectWalletButton = document.getElementById('connect-wallet');
    const disconnectWalletButton = document.getElementById('disconnect-wallet');
    const walletAddressDisplay = document.getElementById('wallet-address');
    const fromAmountInput = document.getElementById('from-amount');
    const toAmountInput = document.getElementById('to-amount');
    const fromTokenInfo = document.getElementById('from-token-info');
    const toTokenInfo = document.getElementById('to-token-info');
    const swapDirectionButton = document.getElementById('swap-direction');
    const maxButton = document.getElementById('max-button');
    const swapNowButton = document.getElementById('swap-now');
    const transactionFeeDisplay = document.getElementById('transaction-fee');
    const gasFeeDisplay = document.getElementById('gas-fee');

    // Blockchain Config
    let provider, signer;
    const frollSwapAddress = "0x9197BF0813e0727df4555E8cb43a0977F4a3A068";
    const frollTokenAddress = "0xB4d562A8f811CE7F134a1982992Bd153902290BC";

    const frollSwapABI = [
        {
            "inputs": [],
            "name": "swapVicToFroll",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [{ "internalType": "uint256", "name": "frollAmount", "type": "uint256" }],
            "name": "swapFrollToVic",
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

    const RATE = 100; // 1 FROLL = 100 VIC
    const FEE = 0.01; // 0.01 VIC swap fee
    const MIN_SWAP_AMOUNT_VIC = 0.011; // Minimum VIC
    const MIN_SWAP_AMOUNT_FROLL = 0.00011; // Minimum FROLL

    let walletAddress = null;
    let balances = { VIC: 0, FROLL: 0 };
    let fromToken = 'VIC';
    let toToken = 'FROLL';

    // Ensure Wallet Connected
    async function ensureWalletConnected() {
        try {
            if (!window.ethereum) {
                alert('MetaMask is not installed. Please install MetaMask to use this application.');
                return false;
            }

            const isConnected = await ethereum.isConnected();
            if (!isConnected) {
                console.log("Wallet not connected. Requesting connection...");
                await ethereum.request({ method: "eth_requestAccounts" });
            }

            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            walletAddress = await signer.getAddress();
            console.log("Wallet connected:", walletAddress);
            return true;
        } catch (error) {
            console.error("Failed to connect wallet:", error);
            alert('Failed to connect wallet. Please try again.');
            return false;
        }
    }

    // Connect Wallet
    connectWalletButton.addEventListener('click', async () => {
        const connected = await ensureWalletConnected();
        if (!connected) return;

        try {
            const network = await provider.getNetwork();
            console.log("Connected network Chain ID:", network.chainId);
            if (network.chainId !== 88) {
                alert("Please connect to the Viction network (Chain ID: 88).");
                return;
            }

            // Initialize contracts
            frollSwapContract = new ethers.Contract(frollSwapAddress, frollSwapABI, signer);
            frollTokenContract = new ethers.Contract(frollTokenAddress, frollABI, signer);

            walletAddressDisplay.textContent = walletAddress;
            await updateBalances();
            showSwapInterface();
        } catch (error) {
            console.error('Failed to initialize wallet:', error);
            alert(`Failed to initialize wallet: ${error.message}`);
        }
    });

    // Disconnect Wallet
    disconnectWalletButton.addEventListener('click', () => {
        walletAddress = null;
        walletAddressDisplay.textContent = '';
        balances = { VIC: 0, FROLL: 0 };
        showConnectInterface();
    });

    // Update Balances
    async function updateBalances() {
        try {
            balances.VIC = parseFloat(ethers.utils.formatEther(await provider.getBalance(walletAddress)));
            balances.FROLL = parseFloat(ethers.utils.formatUnits(await frollTokenContract.balanceOf(walletAddress), 18));
            updateTokenDisplay();
        } catch (error) {
            console.error('Error fetching balances:', error);
        }
    }

    function updateTokenDisplay() {
        // Hiển thị số dư với 18 chữ số thập phân
        fromTokenInfo.textContent = `${fromToken}: ${balances[fromToken].toFixed(18)}`;
        toTokenInfo.textContent = `${toToken}: ${balances[toToken].toFixed(18)}`;
    }

    // Swap Direction
    swapDirectionButton.addEventListener('click', () => {
        [fromToken, toToken] = [toToken, fromToken];
        updateTokenDisplay();
        clearInputs();
    });

    // Max Button
    maxButton.addEventListener('click', async () => {
        const connected = await ensureWalletConnected();
        if (!connected) return;

        fromAmountInput.value = balances[fromToken];
        calculateToAmount();
    });

    // Calculate To Amount
    fromAmountInput.addEventListener('input', calculateToAmount);
    function calculateToAmount() {
        const fromAmount = parseFloat(fromAmountInput.value);
        if (isNaN(fromAmount) || fromAmount <= 0) {
            toAmountInput.value = '';
            return;
        }

        let netFromAmount;
        let toAmount;

        if (fromToken === 'VIC') {
            netFromAmount = fromAmount - FEE;
            toAmount = netFromAmount > 0 ? (netFromAmount / RATE).toFixed(18) : '0.000000000000000000';
        } else {
            netFromAmount = fromAmount * RATE;
            toAmount = netFromAmount > FEE ? (netFromAmount - FEE).toFixed(18) : '0.000000000000000000';
        }

        toAmountInput.value = toAmount;
        transactionFeeDisplay.textContent = `Transaction Fee: ${FEE} VIC`;
        gasFeeDisplay.textContent = `Estimated Gas Fee: ~0.000029 VIC`;
    }

    // Clear Inputs
    function clearInputs() {
        fromAmountInput.value = '';
        toAmountInput.value = '';
    }

    // Swap Now
    swapNowButton.addEventListener('click', async () => {
        const connected = await ensureWalletConnected();
        if (!connected) return;

        const fromAmount = parseFloat(fromAmountInput.value);

        if (isNaN(fromAmount) || fromAmount <= 0) {
            alert('Please enter a valid amount to swap.');
            return;
        }

        if (fromToken === 'VIC' && fromAmount < MIN_SWAP_AMOUNT_VIC) {
            alert(`Minimum swap amount is ${MIN_SWAP_AMOUNT_VIC.toFixed(3)} VIC.`);
            return;
        }
        if (fromToken === 'FROLL' && fromAmount < MIN_SWAP_AMOUNT_FROLL) {
            alert(`Minimum swap amount is ${MIN_SWAP_AMOUNT_FROLL.toFixed(5)} FROLL.`);
            return;
        }

        try {
            if (fromToken === 'VIC') {
                const value = ethers.utils.parseEther(fromAmount.toString());
                const tx = await frollSwapContract.swapVicToFroll({ value });
                await tx.wait();
                alert('Swap VIC to FROLL successful.');
            } else {
                const value = ethers.utils.parseUnits(fromAmount.toString(), 18);
                const approveTx = await frollTokenContract.approve(frollSwapAddress, value);
                await approveTx.wait();
                const tx = await frollSwapContract.swapFrollToVic(value);
                await tx.wait();
                alert('Swap FROLL to VIC successful.');
            }
            await updateBalances();
        } catch (error) {
            console.error("Swap failed:", error);
            alert(`Swap failed: ${error.reason || error.message}`);
        }
    });

    // Show/Hide Interfaces
    function showSwapInterface() {
        document.getElementById('swap-interface').style.display = 'block';
        document.getElementById('connect-interface').style.display = 'none';
    }

    function showConnectInterface() {
        document.getElementById('swap-interface').style.display = 'none';
        document.getElementById('connect-interface').style.display = 'block';
    }

    // Initial State
    showConnectInterface();
});
