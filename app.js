document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const connectWalletButton = document.getElementById('connect-wallet');
    const disconnectWalletButton = document.getElementById('disconnect-wallet');
    const walletAddressDisplay = document.getElementById('wallet-address');
    const networkSelect = document.getElementById('network-select');
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

    // Configuration Variables
    let provider, signer;
    let walletAddress = null;
    let balances = { native: 0, froll: 0 };
    let fromToken = 'native';
    let toToken = 'froll';
    let currentNetwork = null;

    // Load network configurations
    const networkConfig = await fetch('networkConfig.json').then(res => res.json());
    let frollSwapContract = null;
    let frollTokenContract = null;

    // Update UI based on selected network
    async function updateNetworkConfig(networkKey) {
        currentNetwork = networkConfig[networkKey];

        if (!currentNetwork) {
            alert('Invalid network selected.');
            return;
        }

        // Update Contract Instances
        if (provider) {
            frollSwapContract = new ethers.Contract(
                currentNetwork.frollSwapAddress,
                [
                    {
                        "inputs": [],
                        "name": "swapNativeToFroll",
                        "outputs": [],
                        "stateMutability": "payable",
                        "type": "function"
                    },
                    {
                        "inputs": [{ "internalType": "uint256", "name": "frollAmount", "type": "uint256" }],
                        "name": "swapFrollToNative",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    }
                ],
                signer
            );

            frollTokenContract = new ethers.Contract(
                currentNetwork.frollAddress,
                [
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
                ],
                signer
            );

            await updateBalances();
        }
    }

    // Update Balances
    async function updateBalances() {
        try {
            balances.native = parseFloat(ethers.utils.formatEther(await provider.getBalance(walletAddress)));
            balances.froll = parseFloat(
                ethers.utils.formatUnits(
                    await frollTokenContract.balanceOf(walletAddress),
                    18
                )
            );
            updateTokenDisplay();
        } catch (error) {
            console.error('Error updating balances:', error);
        }
    }

    // Update Token Display
    function updateTokenDisplay() {
        fromTokenInfo.textContent = `${fromToken === 'native' ? currentNetwork.nativeToken : 'FROLL'}: ${balances[fromToken].toFixed(4)}`;
        toTokenInfo.textContent = `${toToken === 'native' ? currentNetwork.nativeToken : 'FROLL'}: ${balances[toToken].toFixed(4)}`;
    }

    // Max Button
    maxButton.addEventListener('click', () => {
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
        toAmountInput.value = fromToken === 'native' ? fromAmount.toFixed(4) : fromAmount.toFixed(4);
    }

    // Swap Tokens
    swapNowButton.addEventListener('click', async () => {
        const fromAmount = parseFloat(fromAmountInput.value);
        if (isNaN(fromAmount) || fromAmount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        try {
            if (fromToken === 'native') {
                const tx = await frollSwapContract.swapNativeToFroll({
                    value: ethers.utils.parseEther(fromAmount.toString())
                });
                await tx.wait();
            } else {
                const fromAmountInWei = ethers.utils.parseUnits(fromAmount.toString(), 18);
                const approvalTx = await frollTokenContract.approve(currentNetwork.frollSwapAddress, fromAmountInWei);
                await approvalTx.wait();
                const swapTx = await frollSwapContract.swapFrollToNative(fromAmountInWei);
                await swapTx.wait();
            }

            await updateBalances();
            alert('Swap successful!');
        } catch (error) {
            console.error('Swap failed:', error);
            alert(`Swap failed: ${error.message}`);
        }
    });

    // Handle Wallet Connection
    connectWalletButton.addEventListener('click', async () => {
        if (!window.ethereum) {
            alert('Please install MetaMask to use this application.');
            return;
        }

        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            walletAddress = await signer.getAddress();
            walletAddressDisplay.textContent = walletAddress;

            // Initialize network
            const selectedNetwork = networkSelect.value || 'vic';
            await updateNetworkConfig(selectedNetwork);

            document.getElementById('connect-interface').style.display = 'none';
            document.getElementById('swap-interface').style.display = 'block';
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            alert('Failed to connect wallet.');
        }
    });

    // Disconnect Wallet
    disconnectWalletButton.addEventListener('click', () => {
        provider = null;
        signer = null;
        walletAddress = null;
        frollSwapContract = null;
        frollTokenContract = null;
        walletAddressDisplay.textContent = '';
        document.getElementById('connect-interface').style.display = 'block';
        document.getElementById('swap-interface').style.display = 'none';
    });

    // Network Selection
    networkSelect.addEventListener('change', async (e) => {
        await updateNetworkConfig(e.target.value);
    });
});
