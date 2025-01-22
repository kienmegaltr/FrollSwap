document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const pairSelect = document.getElementById('pair-select');
    const confirmPairButton = document.getElementById('confirm-pair');
    const connectWalletButton = document.getElementById('connect-wallet');
    const swapNowButton = document.getElementById('swap-now');
    const fromAmountInput = document.getElementById('from-amount');
    const toAmountInput = document.getElementById('to-amount');
    const fromTokenInfo = document.getElementById('from-token-info');
    const toTokenInfo = document.getElementById('to-token-info');
    const walletAddressDisplay = document.getElementById('wallet-address');
    const transactionFeeDisplay = document.getElementById('transaction-fee');
    const gasFeeDisplay = document.getElementById('gas-fee');

    let selectedPair = "VIC";
    let networkConfig = {};
    let provider, signer, contract;

    // Load network configurations
    async function loadNetworkConfig() {
        const response = await fetch('networkConfig.json');
        networkConfig = await response.json();
    }

    // Initialize application
    async function init() {
        await loadNetworkConfig();

        // Default to the first pair (VIC)
        updateInterfaceForPair(selectedPair);
    }

    // Update interface based on selected pair
    function updateInterfaceForPair(pair) {
        const pairConfig = networkConfig.pairs[pair];
        if (!pairConfig) {
            alert('Invalid token pair selected.');
            return;
        }

        // Update token information
        fromTokenInfo.textContent = `From: ${pairConfig.symbol}`;
        toTokenInfo.textContent = `To: FROLL`;
        transactionFeeDisplay.textContent = `Transaction Fee: ~0.01 ${pairConfig.symbol}`;
        gasFeeDisplay.textContent = `Estimated Gas Fee: ~... ${pairConfig.symbol}`;
    }

    // Handle pair selection
    confirmPairButton.addEventListener('click', () => {
        selectedPair = pairSelect.value;
        updateInterfaceForPair(selectedPair);

        document.getElementById('pair-selection').style.display = 'none';
        document.getElementById('network-selection').style.display = 'block';
    });

    // Connect Wallet
    connectWalletButton.addEventListener('click', async () => {
        const pairConfig = networkConfig.pairs[selectedPair];
        if (!pairConfig) {
            alert('Invalid network configuration.');
            return;
        }

        try {
            if (!window.ethereum) {
                alert('MetaMask is not installed. Please install MetaMask to use this application.');
                return;
            }

            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: `0x${pairConfig.chainId.toString(16)}`,
                    rpcUrls: [pairConfig.rpcUrl],
                    chainName: pairConfig.name,
                }],
            });

            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            const walletAddress = await signer.getAddress();
            walletAddressDisplay.textContent = `Connected: ${walletAddress}`;

            contract = new ethers.Contract(pairConfig.contractAddress, await fetch(pairConfig.abi).then(res => res.json()), signer);

            document.getElementById('network-selection').style.display = 'none';
            document.getElementById('swap-interface').style.display = 'block';
        } catch (error) {
            console.error('Failed to connect wallet:', error);
        }
    });

    // Handle Swap
    swapNowButton.addEventListener('click', async () => {
        try {
            const fromAmount = parseFloat(fromAmountInput.value);
            if (isNaN(fromAmount) || fromAmount <= 0) {
                alert('Please enter a valid amount to swap.');
                return;
            }

            if (selectedPair === 'VIC') {
                const fromAmountInWei = ethers.utils.parseEther(fromAmount.toString());
                const tx = await contract.swapVicToFroll({ value: fromAmountInWei });
                await tx.wait();
                alert('Swap VIC to FROLL successful.');
            } else if (selectedPair === 'BNB') {
                const fromAmountInWei = ethers.utils.parseEther(fromAmount.toString());
                const tx = await contract.swapBNBForFROLL({ value: fromAmountInWei });
                await tx.wait();
                alert('Swap BNB to FROLL successful.');
            }

            // Update balances or other UI elements as needed
        } catch (error) {
            console.error('Swap failed:', error);
            alert(`Swap failed: ${error.message}`);
        }
    });

    await init();
});
