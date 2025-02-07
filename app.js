document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const priceDisplay = document.getElementById('froll-price'); // Hiển thị giá FROLL trên thanh điều hướng
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

    // Blockchain Config
    let provider, signer;
    const frollSwapAddress = "0x9197BF0813e0727df4555E8cb43a0977F4a3A068";
    const frollTokenAddress = "0xB4d562A8f811CE7F134a1982992Bd153902290BC";

    const RATE = 100; // 1 FROLL = 100 VIC
    const FEE = 0.01; // 0.01 VIC swap fee
    const GAS_FEE_ESTIMATE = 0.000029; // Estimated gas fee
    const MIN_SWAP_AMOUNT_VIC = 0.011; // Minimum VIC
    const MIN_SWAP_AMOUNT_FROLL = 0.00011; // Minimum FROLL

    // Fetch giá FROLL theo USD từ API
    async function fetchFrollPrice() {
        try {
            priceDisplay.textContent = "Loading price...";
            const response = await fetch("http://api.lottery.vin/price");

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            if (data.price) {
                priceDisplay.textContent = `1 FROLL = ${parseFloat(data.price).toFixed(4)} USD`;
            } else {
                priceDisplay.textContent = "Price unavailable";
            }
        } catch (error) {
            console.error("Error fetching FROLL price:", error);
            priceDisplay.textContent = "Price error";
        }
    }

    // Gọi API ngay khi tải trang & cập nhật mỗi 10 giây
    fetchFrollPrice();
    setInterval(fetchFrollPrice, 10000);

    // Mọi dòng code khác giữ nguyên từ file cũ của bạn, không thay đổi gì cả
});
