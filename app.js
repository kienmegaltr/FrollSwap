document.addEventListener('DOMContentLoaded', async () => {
    const pairSelect = document.getElementById('pair-select');
    const confirmPairButton = document.getElementById('confirm-pair');
    const connectWalletButton = document.getElementById('connect-wallet');
    const swapNowButton = document.getElementById('swap-now');
    const walletAddressDisplay = document.getElementById('wallet-address');

    let selectedPair = 'VIC';
    let networkConfig = {};
    let provider, signer, contract;
    let isConnectingWallet = false; // Trạng thái kiểm tra kết nối ví

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
        // Kiểm tra trạng thái đang kết nối ví
        if (isConnectingWallet) {
            alert('Already connecting to wallet. Please wait.');
            return;
        }

        isConnectingWallet = true; // Đặt trạng thái đang kết nối
        connectWalletButton.disabled = true; // Vô hiệu hóa nút

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

            document.getElementById('network-selection').style.display = 'none';
            document.getElementById('swap-interface').style.display = 'block';
        } catch (error) {
            alert(`Failed to connect wallet: ${error.message}`);
        } finally {
            isConnectingWallet = false; // Đặt trạng thái kết nối lại thành `false`
            connectWalletButton.disabled = false; // Bật lại nút
        }
    });

    await init();
});
