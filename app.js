document.addEventListener('DOMContentLoaded', async () => {
    const networkSelection = document.getElementById('network-select');
    const connectWalletButton = document.getElementById('connect-wallet');
    const swapInterface = document.getElementById('swap-interface');
    const networkSelectionInterface = document.getElementById('network-selection');

    let selectedNetwork = "VIC";

    const networkConfig = {
        VIC: {
            name: "VIC Network",
            rpcUrl: "https://rpc.vicnetwork.com",
            contractAddress: "0x9197BF0813e0727df4555E8cb43a0977F4a3A068",
            tokenAddress: "0xB4d562A8f811CE7F134a1982992Bd153902290BC",
            abi: VIC_ABI // Replace with the actual ABI
        },
        BNB: {
            name: "BNB Smart Chain",
            rpcUrl: "https://bsc-dataseed.binance.org/",
            contractAddress: "0xC03217B3eb055D720e90a75fCfAA7577f22e52F9",
            tokenAddress: "0x7783cBC17d43F936DA1C1D052E4a33a9FfF774c1",
            abi: BNB_ABI // Replace with the actual ABI
        }
    };

    // Handle network selection
    networkSelection.addEventListener('change', (event) => {
        selectedNetwork = event.target.value;
    });

    // Connect Wallet
    connectWalletButton.addEventListener('click', async () => {
        const network = networkConfig[selectedNetwork];
        if (!network) {
            alert('Invalid network selected!');
            return;
        }

        try {
            if (!window.ethereum) {
                alert('MetaMask not found. Please install MetaMask to use this application.');
                return;
            }

            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: `0x${network.chainId.toString(16)}`,
                    rpcUrls: [network.rpcUrl],
                    chainName: network.name,
                }],
            });

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const walletAddress = await signer.getAddress();

            alert(`Connected to ${network.name} as ${walletAddress}`);
            networkSelectionInterface.style.display = 'none';
            swapInterface.style.display = 'block';

            const contract = new ethers.Contract(
                network.contractAddress,
                network.abi,
                signer
            );

            // Initialize swap logic
            initSwapFunctionality(contract, walletAddress, network);
        } catch (error) {
            console.error('Failed to connect wallet:', error);
        }
    });

    function initSwapFunctionality(contract, walletAddress, network) {
        console.log(`Swap functionality initialized for ${network.name}`);
    }
});
