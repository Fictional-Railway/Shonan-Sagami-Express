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

/* =========================================
   時刻表・乗換検索システム (SER Mock System)
   ========================================= */

/* * 駅データ定義
 * 画像に基づき全駅網羅 (2026.01.12版)
 * time: 起点からの累積所要時間（分）※各駅停車基準の目安
 */

// ■ 神奈川線 (Kanagawa Line) [SK]
// 起点：本厚木(SK-21) -> 終点：鎌倉(SK-01)
const lineKanagawa = [
    { name: "本厚木", time: 0 },
    { name: "厚木", time: 3 },
    { name: "海老名", time: 6 },
    { name: "東海老名", time: 9 },
    { name: "相模早川", time: 12 },
    { name: "寺尾台", time: 15 },
    { name: "綾瀬中央", time: 18 },
    { name: "南綾瀬", time: 21 },
    { name: "相模落合", time: 24 },
    { name: "葛原", time: 27 },
    { name: "慶応SFC前", time: 31 },      // 少し距離がある想定
    { name: "湘南ライフタウン", time: 34 },
    { name: "駒寄小学校前", time: 37 },
    { name: "善行団地西", time: 40 },
    { name: "本藤沢", time: 43 },
    { name: "藤沢", time: 47 },           // 主要駅・JR乗換
    { name: "川名", time: 50 },
    { name: "手広", time: 53 },
    { name: "深沢", time: 56 },
    { name: "常盤", time: 59 },
    { name: "鎌倉", time: 64 }            // 終点・乗換
];

// ■ 西三浦線 (Nishi-Miura Line) [SM]
// 起点：鎌倉(SM-01) -> 終点：三崎港(SM-32)
const lineMiura = [
    { name: "鎌倉", time: 0 },
    { name: "由比ヶ浜", time: 2 },
    { name: "材木座", time: 4 },
    { name: "小坪海浜公園", time: 7 },
    { name: "披露山公園口", time: 10 },
    { name: "逗子海岸", time: 13 },
    { name: "新逗子", time: 15 },
    { name: "葉山アリーナ", time: 18 },
    { name: "森戸神社前", time: 21 },
    { name: "一色海岸", time: 24 },
    { name: "下山口", time: 27 },
    { name: "長者ヶ崎", time: 30 },
    { name: "関根海岸", time: 33 },
    { name: "久留和海岸", time: 35 },
    { name: "秋谷・立石公園", time: 38 },
    { name: "本秋谷", time: 40 },
    { name: "佐島の丘", time: 43 },
    { name: "長坂", time: 46 },
    { name: "市民病院前", time: 49 },
    { name: "駐屯地南", time: 52 },
    { name: "武山", time: 55 },
    { name: "発声", time: 58 },           // 画像の文字「発声」を採用
    { name: "三崎口", time: 61 },         // 京急乗換
    { name: "北小網代", time: 64 },
    { name: "小網代の森入口", time: 66 },
    { name: "三崎警察署前", time: 69 },
    { name: "三崎原町", time: 71 },
    { name: "原稲荷入口", time: 73 },
    { name: "栄町", time: 75 },
    { name: "北条", time: 77 },
    { name: "すずらん通り", time: 79 },
    { name: "三崎港", time: 82 }
];

// 路線ごとの設定
const lines = {
    "kanagawa": { name: "神奈川線", data: lineKanagawa },
    "miura": { name: "西三浦線", data: lineMiura }
};

// =========================================
//  以下、ロジック部分は共通
// =========================================

// 初期化処理：セレクトボックスに駅を追加
function initSearchForm() {
    const fromSelect = document.getElementById('station-from');
    const toSelect = document.getElementById('station-to');
    
    if (!fromSelect || !toSelect) return;

    // オプショングループ作成
    const addOptions = (select) => {
        // 神奈川線
        let groupK = document.createElement('optgroup');
        groupK.label = "神奈川線";
        lineKanagawa.forEach(st => {
            let op = document.createElement('option');
            op.value = `kanagawa:${st.name}`;
            op.text = st.name;
            groupK.appendChild(op);
        });
        select.appendChild(groupK);

        // 西三浦線
        let groupM = document.createElement('optgroup');
        groupM.label = "西三浦線";
        lineMiura.forEach(st => {
            // 鎌倉は重複するのでスキップ(神奈川線側を使う)
            if(st.name === "鎌倉") return; 
            let op = document.createElement('option');
            op.value = `miura:${st.name}`;
            op.text = st.name;
            groupM.appendChild(op);
        });
        select.appendChild(groupM);
    };

    addOptions(fromSelect);
    addOptions(toSelect);

    // 検索ボタンイベント
    document.getElementById('btn-search').addEventListener('click', performSearch);
    
    // スマホメニュー開閉
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('main-nav');
    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }

    // 運行時間の自動更新
    updateTickerTime();
}

// 運行情報更新時刻の表示
function updateTickerTime() {
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}更新`;
    const updateTimeElement = document.getElementById('update-time');
    if (updateTimeElement) {
        updateTimeElement.textContent = timeStr;
    }
}

// 時間計算ヘルパー (HH:MM を 分に変換)
function timeToMins(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

// 分を HH:MM 表記に戻す
function minsToTime(mins) {
    let h = Math.floor(mins / 60) % 24;
    let m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// 検索実行メインロジック
function performSearch() {
    const fromVal = document.getElementById('station-from').value;
    const toVal = document.getElementById('station-to').value;
    const timeVal = document.getElementById('search-time').value;

    if (!fromVal || !toVal) {
        alert("出発駅と到着駅を選択してください。");
        return;
    }
    if (fromVal === toVal) {
        alert("出発駅と到着駅が同じです。");
        return;
    }

    const [lineFrom, nameFrom] = fromVal.split(':');
    const [lineTo, nameTo] = toVal.split(':');
    
    // 入力時刻（分）
    const startMins = timeToMins(timeVal);
    
    let resultHTML = '';
    
    // --- 経路計算ロジック (Mock) ---
    
    // ケース1: 同じ路線内 (または片方が鎌倉)
    if (lineFrom === lineTo || (nameFrom === "鎌倉" && lineTo === "miura") || (nameTo === "鎌倉" && lineFrom === "miura")) {
        
        let currentLine = (lineFrom === "kanagawa" || nameFrom === "鎌倉") ? lineKanagawa : lineMiura;
        
        // 鎌倉から西三浦線へ行く場合の補正
        if(nameFrom === "鎌倉" && lineTo === "miura") currentLine = lineMiura;
        
        // 逆方向（西三浦線から鎌倉へ）の場合の補正はlineMiuraのまま検索すればOK
        
        const stStart = currentLine.find(s => s.name === nameFrom);
        const stEnd = currentLine.find(s => s.name === nameTo);

        if (!stStart || !stEnd) {
             // 念の為のエラーハンドリング
             alert("経路が見つかりませんでした。(システムエラー)");
             return;
        }

        const duration = Math.abs(stEnd.time - stStart.time);
        
        // 出発・到着時刻
        const depTime = minsToTime(startMins + 5); 
        const arrTime = minsToTime(startMins + 5 + duration);
        
        // 運賃計算 (1駅20円 + 基本150円 と仮定)
        const fare = 150 + (Math.floor(duration / 3) * 30);

        resultHTML += createResultCard(
            "直通", 
            `${nameFrom} → ${nameTo}`, 
            duration, 
            fare, 
            [
                { time: depTime, station: nameFrom, type: "dep" },
                { info: `特急・準特急 (${duration}分)` },
                { time: arrTime, station: nameTo, type: "arr" }
            ]
        );
    } 
    // ケース2: 乗り換え (神奈川線 <-> 西三浦線) ※必ず鎌倉経由
    else {
        // 1. 出発 -> 鎌倉
        let line1 = (lineFrom === "kanagawa") ? lineKanagawa : lineMiura;
        let st1_Start = line1.find(s => s.name === nameFrom);
        let st1_End = line1.find(s => s.name === "鎌倉");
        let dur1 = Math.abs(st1_End.time - st1_Start.time);
        
        // 2. 鎌倉 -> 到着
        let line2 = (lineTo === "kanagawa") ? lineKanagawa : lineMiura;
        let st2_Start = line2.find(s => s.name === "鎌倉");
        let st2_End = line2.find(s => s.name === nameTo);
        let dur2 = Math.abs(st2_End.time - st2_Start.time);

        // 時刻計算
        let dep1 = startMins + 4;
        let arr1 = dep1 + dur1;
        let dep2 = arr1 + 6; // 乗換6分
        let arr2 = dep2 + dur2;
        let totalDur = dur1 + 6 + dur2;
        
        // 運賃合算
        const fare = (150 + (Math.floor(dur1 / 3) * 30)) + (150 + (Math.floor(dur2 / 3) * 30)) - 50; // 乗継割引

        resultHTML += createResultCard(
            "乗換1回", 
            `${nameFrom} → ${nameTo}`, 
            totalDur, 
            fare, 
            [
                { time: minsToTime(dep1), station: nameFrom, type: "dep" },
                { info: `急行・準特急 (${dur1}分)` },
                { time: minsToTime(arr1), station: "鎌倉", type: "transfer", badge: "乗換" },
                { info: `待ち合わせ 6分` },
                { time: minsToTime(dep2), station: "鎌倉", type: "dep" },
                { info: `普通・区間急行 (${dur2}分)` },
                { time: minsToTime(arr2), station: nameTo, type: "arr" }
            ]
        );
    }

    const resDiv = document.getElementById('search-results');
    resDiv.style.display = 'block';
    resDiv.innerHTML = `<h4 style="margin-bottom:15px; color:#333;">検索結果</h4>` + resultHTML;
}

// 結果カード生成
function createResultCard(label, route, duration, fare, steps) {
    let stepsHTML = '';
    
    steps.forEach(step => {
        if (step.info) {
            stepsHTML += `<div class="train-info">${step.info}</div>`;
        } else {
            let badge = step.badge ? `<span class="transfer-badge">${step.badge}</span>` : '';
            let markClass = step.type === 'dep' ? 'departure' : (step.type === 'arr' ? 'arrival' : '');
            stepsHTML += `
                <div class="timeline-point ${markClass}">
                    <span class="time">${step.time}</span>
                    <span class="station">${step.station}</span>
                    ${badge}
                </div>`;
        }
    });

    return `
    <div class="result-card">
        <div class="result-header">
            <div class="route-summary">
                ${steps[0].time} <span style="font-size:14px; color:#888;">発</span>
                → 
                ${steps[steps.length-1].time} <span style="font-size:14px; color:#888;">着</span>
            </div>
            <div class="route-meta">
                所要時間: <strong>${duration}分</strong> / 片道運賃: <strong>${fare}円</strong> (IC)
            </div>
        </div>
        <div class="result-body">
            <div class="timeline">
                ${stepsHTML}
            </div>
        </div>
    </div>`;
}

// DOM読み込み完了時に初期化
document.addEventListener('DOMContentLoaded', initSearchForm);