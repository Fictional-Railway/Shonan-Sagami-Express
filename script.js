document.addEventListener('DOMContentLoaded', () => {
    // スマホメニュー開閉
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('main-nav');
    
    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }

    // 運行時間の自動更新（現在時刻を表示）
    const updateTickerTime = () => {
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}更新`;
        const updateTimeElement = document.getElementById('update-time');
        if (updateTimeElement) {
            updateTimeElement.textContent = timeStr;
        }
    };
    updateTickerTime();
});