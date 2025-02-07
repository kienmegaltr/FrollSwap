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
    const priceDisplay = document.createElement('div'); // Tạo phần tử DOM hiển thị giá FROLL

// Chèn vào thanh điều hướng
priceDisplay.id = "froll-price";
priceDisplay.style.fontWeight = "bold";
priceDisplay.style.color = "white";
priceDisplay.style.marginLeft = "15px";
priceDisplay.textContent = "Loading price...";

// Chèn phần tử vào thanh điều hướng
document.querySelector('.navbar').appendChild(priceDisplay);

        // Blockchain Config
    let provider, signer;
    const frollSwapAddress = "0x9197BF0813e0727df4555E8cb43a0977F4a3A068";
    const frollTokenAddress = "0xB4d562A8f811CE7F134a1982992Bd153902290BC";

    const RATE = 100; // 1 FROLL = 100 VIC
    const FEE = 0.01; // 0.01 VIC swap fee
    const GAS_FEE_ESTIMATE = 0.000029; // Estimated gas fee
    const MIN_SWAP_AMOUNT_VIC = 0.011; // Minimum VIC
    const MIN_SWAP_AMOUNT_FROLL = 0.00011; // Minimum FROLL

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

            await window.ethereum.request({ method: "eth_requestAccounts" });

            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            walletAddress = await signer.getAddress();

            return true;
        } catch (error) {
            console.error("Failed to connect wallet:", error);
            alert('Failed to connect wallet. Please try again.');
            return false;
        }
    }

    // Fetch Balances
    async function updateBalances() {
        try {
            balances.VIC = parseFloat(ethers.utils.formatEther(await provider.getBalance(walletAddress)));
            balances.FROLL = parseFloat(
                ethers.utils.formatUnits(
                    await frollTokenContract.balanceOf(walletAddress),
                    18
                )
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
            if (fromAmount < MIN_SWAP_AMOUNT_VIC) {
                alert(`Minimum swap amount is ${MIN_SWAP_AMOUNT_VIC} VIC.`);
                return;
            }
            netFromAmount = fromAmount - FEE;
            toAmount = netFromAmount > 0 ? (netFromAmount / RATE).toFixed(18) : '0.000000000000000000';
        } else {
            if (fromAmount < MIN_SWAP_AMOUNT_FROLL) {
                alert(`Minimum swap amount is ${MIN_SWAP_AMOUNT_FROLL} FROLL.`);
                return;
            }
            netFromAmount = fromAmount * RATE;
            toAmount = netFromAmount > FEE ? (netFromAmount - FEE).toFixed(18) : '0.000000000000000000';
        }

        toAmountInput.value = toAmount;
        transactionFeeDisplay.textContent = `Transaction Fee: ${FEE} VIC`;
        gasFeeDisplay.textContent = `Estimated Gas Fee: ~${GAS_FEE_ESTIMATE} VIC`;
    }

    // Swap Direction
    swapDirectionButton.addEventListener('click', () => {
        [fromToken, toToken] = [toToken, fromToken];
        [fromTokenLogo.src, toTokenLogo.src] = [toTokenLogo.src, fromTokenLogo.src];
        updateTokenDisplay();
        clearInputs();
    });

    // Clear Inputs
    function clearInputs() {
        fromAmountInput.value = '';
        toAmountInput.value = '';
    }

    // Swap Tokens
    swapNowButton.addEventListener('click', async () => {
        try {
            const fromAmount = parseFloat(fromAmountInput.value);

            if (isNaN(fromAmount) || fromAmount <= 0) {
                alert('Please enter a valid amount to swap.');
                return;
            }

            if (fromToken === 'VIC') {
                const fromAmountInWei = ethers.utils.parseEther(fromAmount.toString());

                const tx = await frollSwapContract.swapVicToFroll({
                    value: fromAmountInWei
                });
                await tx.wait();
                alert('Swap VIC to FROLL successful.');
            } else {
                const fromAmountInWei = ethers.utils.parseUnits(fromAmount.toString(), 18);

                const approveTx = await frollTokenContract.approve(frollSwapAddress, fromAmountInWei);
                await approveTx.wait();

                const tx = await frollSwapContract.swapFrollToVic(fromAmountInWei);
                await tx.wait();
                alert('Swap FROLL to VIC successful.');
            }

            await updateBalances();
        } catch (error) {
            console.error("Swap failed:", error);
            alert(`Swap failed: ${error.reason || error.message}`);
        }
    });

    // Connect Wallet
    connectWalletButton.addEventListener('click', async () => {
        const connected = await ensureWalletConnected();
        if (!connected) return;

        try {
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

    // Handle Disconnect Wallet button click
    disconnectWalletButton.addEventListener('click', async () => {
        try {
            // Reset wallet-related variables
            walletAddress = null;
            balances = { VIC: 0, FROLL: 0 };
            frollSwapContract = null;
            frollTokenContract = null;

            // Update UI
            walletAddressDisplay.textContent = '';
            clearInputs();
            showConnectInterface();

            alert('Wallet disconnected successfully.');
        } catch (error) {
            console.error('Error disconnecting wallet:', error);
            alert('Failed to disconnect wallet. Please try again.');
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

    // Initialize Interface
    showConnectInterface();
});
