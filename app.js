document.addEventListener('DOMContentLoaded', async () => {
    const pairSelect = document.getElementById('pair-select');
    const confirmPairButton = document.getElementById('confirm-pair');
    const connectWalletButton = document.getElementById('connect-wallet');
    const swapNowButton = document.getElementById('swap-now');
    const fromAmountInput = document.getElementById('from-amount');
    const toAmountInput = document.getElementById('to-amount');
    const walletAddressDisplay = document.getElementById('wallet-address');
    const fromTokenInfo = document.getElementById('from-token-info');
    const toTokenInfo = document.getElementById('to-token-info');
    const transactionFeeDisplay = document.getElementById('transaction-fee');
    const gasFeeDisplay = document.getElementById('gas-fee');

    let selectedPair = 'VIC';
    let networkConfig = {};
    let provider, signer, contract, tokenContract;

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

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts',
            });

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found in MetaMask.');
            }

            // Switch or add network
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

            // Initialize provider and signer
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            const walletAddress = await signer.getAddress();

            walletAddressDisplay.textContent = `Connected: ${walletAddress}`;

            // Load contract ABI
            const abiResponse = await fetch(pairConfig.abi);
            const abi = await abiResponse.json();

            contract = new ethers.Contract(pairConfig.contractAddress, abi, signer);
            tokenContract = new ethers.Contract(pairConfig.tokenAddress, abi, signer);

            // Update UI
            document.getElementById('network-selection').style.display = 'none';
            document.getElementById('swap-interface').style.display = 'block';

            // Fetch balances
            await updateBalances(pairConfig);
        } catch (error) {
            alert(`Failed to connect wallet: ${error.message}`);
            console.error('Error:', error);
        }
    });

    async function updateBalances(pairConfig) {
        try {
            const walletAddress = await signer.getAddress();

            // Fetch native token balance (e.g., VIC or BNB)
            const nativeBalance = ethers.utils.formatEther(await provider.getBalance(walletAddress));
            fromTokenInfo.textContent = `From: ${parseFloat(nativeBalance).toFixed(4)} ${pairConfig.symbol}`;

            // Fetch FROLL balance
            const frollBalance = await tokenContract.balanceOf(walletAddress);
            toTokenInfo.textContent = `To: ${parseFloat(ethers.utils.formatEther(frollBalance)).toFixed(4)} FROLL`;

            // Set transaction fee and gas fee
            transactionFeeDisplay.textContent = `Transaction Fee: ~0.01 ${pairConfig.symbol}`;
            gasFeeDisplay.textContent = `Estimated Gas Fee: ~0.0001 ${pairConfig.symbol}`;
        } catch (error) {
            console.error('Failed to fetch balances:', error);
        }
    }

    swapNowButton.addEventListener('click', async () => {
        try {
            const fromAmount = parseFloat(fromAmountInput.value);
            if (isNaN(fromAmount) || fromAmount <= 0) throw new Error('Invalid amount.');

            const pairConfig = networkConfig.pairs[selectedPair];
            const fromAmountInWei = ethers.utils.parseEther(fromAmount.toString());

            // Perform the swap
            if (selectedPair === 'VIC') {
                const tx = await contract.swapVicToFroll({ value: fromAmountInWei });
                await tx.wait();
                alert('Swap VIC to FROLL successful.');
            } else if (selectedPair === 'BNB') {
                const tx = await contract.swapBNBForFROLL({ value: fromAmountInWei });
                await tx.wait();
                alert('Swap BNB to FROLL successful.');
            }

            // Update balances after the swap
            await updateBalances(pairConfig);
        } catch (error) {
            alert(`Swap failed: ${error.message}`);
            console.error('Swap Error:', error);
        }
    });

    await init();
});
