document.addEventListener('DOMContentLoaded', async () => {
    const pairSelect = document.getElementById('pair-select');
    const confirmPairButton = document.getElementById('confirm-pair');
    const connectWalletButton = document.getElementById('connect-wallet');
    const swapNowButton = document.getElementById('swap-now');
    const fromAmountInput = document.getElementById('from-amount');
    const toAmountInput = document.getElementById('to-amount');
    const walletAddressDisplay = document.getElementById('wallet-address');

    let selectedPair = 'VIC';
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
        document.getElementById('pair-selection').style.display = 'block';
    }

    confirmPairButton.addEventListener('click', () => {
        selectedPair = pairSelect.value;
        document.getElementById('pair-selection').style.display = 'none';
        document.getElementById('network-selection').style.display = 'block';
    });

    connectWalletButton.addEventListener('click', async () => {
        const pairConfig = networkConfig.pairs[selectedPair];
        try {
            if (!window.ethereum) throw new Error('MetaMask is not installed.');
            await window.ethereum.request({
                method: 'eth_requestAccounts',
            });

            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: `0x${pairConfig.chainId.toString(16)}`,
                    rpcUrls: [pairConfig.rpcUrl],
                    chainName: pairConfig.name,
                    nativeCurrency: {
                        name: pairConfig.symbol,
                        symbol: pairConfig.symbol,
                        decimals: 18,
                    },
                    blockExplorerUrls: [pairConfig.blockExplorer],
                }],
            });

            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            const walletAddress = await signer.getAddress();
            walletAddressDisplay.textContent = `Connected: ${walletAddress}`;

            const abiResponse = await fetch(pairConfig.abi);
            const abi = await abiResponse.json();

            contract = new ethers.Contract(pairConfig.contractAddress, abi, signer);
            document.getElementById('network-selection').style.display = 'none';
            document.getElementById('swap-interface').style.display = 'block';
        } catch (error) {
            alert(`Failed to connect wallet: ${error.message}`);
        }
    });

    swapNowButton.addEventListener('click', async () => {
        try {
            const fromAmount = parseFloat(fromAmountInput.value);
            if (isNaN(fromAmount) || fromAmount <= 0) throw new Error('Invalid amount.');

            const fromAmountInWei = ethers.utils.parseEther(fromAmount.toString());
            const tx = await contract.swapVicToFroll({ value: fromAmountInWei });
            await tx.wait();
            alert('Swap successful.');
        } catch (error) {
            alert(`Swap failed: ${error.message}`);
        }
    });

    await init();
});
