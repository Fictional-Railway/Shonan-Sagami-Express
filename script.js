/* ============================================================
   湘南相模急行電鉄 (SER) リアル検索システム
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // 1. UI制御：スマホメニュー開閉
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('main-nav');
    if (toggle && nav) {
        toggle.addEventListener('click', () => nav.classList.toggle('active'));
    }

    // 2. UI制御：運行情報の時刻更新
    const updateTickerTime = () => {
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}更新`;
        const el = document.getElementById('update-time');
        if (el) el.textContent = timeStr;
    };
    updateTickerTime();
    setInterval(updateTickerTime, 60000); // 1分ごとに更新

    // 3. 検索システム初期化
    initSearchSystem();
});

/* --- 駅・路線データ定義 --- */

// 神奈川線 (Kanagawa Line) - SK
// isExpress: 特急・準特急が停車するかどうか (画像に基づき設定)
const lineKanagawa = [
    { id: "SK21", name: "本厚木", time: 0, isExpress: true },
    { id: "SK20", name: "厚木", time: 3, isExpress: false },
    { id: "SK19", name: "海老名", time: 6, isExpress: true },
    { id: "SK18", name: "東海老名", time: 9, isExpress: false },
    { id: "SK17", name: "相模早川", time: 12, isExpress: false },
    { id: "SK16", name: "寺尾台", time: 15, isExpress: false },
    { id: "SK15", name: "綾瀬中央", time: 18, isExpress: true },
    { id: "SK14", name: "南綾瀬", time: 21, isExpress: false },
    { id: "SK13", name: "相模落合", time: 24, isExpress: false },
    { id: "SK12", name: "葛原", time: 27, isExpress: false },
    { id: "SK11", name: "慶応SFC前", time: 31, isExpress: true },
    { id: "SK10", name: "湘南ライフタウン", time: 34, isExpress: true },
    { id: "SK09", name: "駒寄小学校前", time: 37, isExpress: false },
    { id: "SK08", name: "善行団地西", time: 40, isExpress: false },
    { id: "SK07", name: "本藤沢", time: 43, isExpress: false },
    { id: "SK06", name: "藤沢", time: 47, isExpress: true },
    { id: "SK05", name: "川名", time: 50, isExpress: false },
    { id: "SK04", name: "手広", time: 53, isExpress: false },
    { id: "SK03", name: "深沢", time: 56, isExpress: true },
    { id: "SK02", name: "常盤", time: 59, isExpress: false },
    { id: "SK01", name: "鎌倉", time: 64, isExpress: true }
];

// 西三浦線 (Nishi-Miura Line) - SM
const lineMiura = [
    { id: "SM01", name: "鎌倉", time: 0, isExpress: true },
    { id: "SM02", name: "由比ヶ浜", time: 2, isExpress: false },
    { id: "SM03", name: "材木座", time: 4, isExpress: false },
    { id: "SM04", name: "小坪海浜公園", time: 7, isExpress: false },
    { id: "SM05", name: "披露山公園口", time: 10, isExpress: false },
    { id: "SM06", name: "逗子海岸", time: 13, isExpress: false },
    { id: "SM07", name: "新逗子", time: 15, isExpress: true },
    { id: "SM08", name: "葉山アリーナ", time: 18, isExpress: false },
    { id: "SM09", name: "森戸神社前", time: 21, isExpress: false },
    { id: "SM10", name: "一色海岸", time: 24, isExpress: false },
    { id: "SM11", name: "下山口", time: 27, isExpress: false },
    { id: "SM12", name: "長者ヶ崎", time: 30, isExpress: false },
    { id: "SM13", name: "関根海岸", time: 33, isExpress: false },
    { id: "SM14", name: "久留和海岸", time: 35, isExpress: false },
    { id: "SM15", name: "秋谷・立石公園", time: 38, isExpress: false },
    { id: "SM16", name: "本秋谷", time: 40, isExpress: false },
    { id: "SM17", name: "佐島の丘", time: 43, isExpress: false },
    { id: "SM18", name: "長坂", time: 46, isExpress: false },
    { id: "SM19", name: "市民病院前", time: 49, isExpress: false },
    { id: "SM20", name: "駐屯地南", time: 52, isExpress: false },
    { id: "SM21", name: "武山", time: 55, isExpress: false },
    { id: "SM22", name: "発声", time: 58, isExpress: true },
    { id: "SM23", name: "三崎口", time: 61, isExpress: true },
    { id: "SM24", name: "北小網代", time: 64, isExpress: false },
    { id: "SM25", name: "小網代の森入口", time: 66, isExpress: false },
    { id: "SM26", name: "三崎警察署前", time: 69, isExpress: false },
    { id: "SM27", name: "三崎原町", time: 71, isExpress: false },
    { id: "SM28", name: "原稲荷入口", time: 73, isExpress: false },
    { id: "SM29", name: "栄町", time: 75, isExpress: false },
    { id: "SM30", name: "北条", time: 77, isExpress: false },
    { id: "SM31", name: "すずらん通り", time: 79, isExpress: false },
    { id: "SM32", name: "三崎港", time: 82, isExpress: true }
];

/* --- 検索システムロジック --- */

function initSearchSystem() {
    const fromSelect = document.getElementById('station-from');
    const toSelect = document.getElementById('station-to');
    if (!fromSelect || !toSelect) return;

    const renderOptions = (select) => {
        let kanagawaGroup = document.createElement('optgroup');
        kanagawaGroup.label = "神奈川線";
        lineKanagawa.forEach(s => {
            kanagawaGroup.innerHTML += `<option value="SK:${s.name}">${s.name}</option>`;
        });
        select.appendChild(kanagawaGroup);

        let miuraGroup = document.createElement('optgroup');
        miuraGroup.label = "西三浦線";
        lineMiura.forEach(s => {
            if(s.name === "鎌倉") return;
            miuraGroup.innerHTML += `<option value="SM:${s.name}">${s.name}</option>`;
        });
        select.appendChild(miuraGroup);
    };

    renderOptions(fromSelect);
    renderOptions(toSelect);

    document.getElementById('btn-search').addEventListener('click', calculateRoute);
}

function timeToMins(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function minsToTime(m) {
    const hh = Math.floor(m / 60) % 24;
    const mm = m % 60;
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
}

// 経路計算のメイン
function calculateRoute() {
    const fromRaw = document.getElementById('station-from').value;
    const toRaw = document.getElementById('station-to').value;
    const startTimeStr = document.getElementById('search-time').value;

    if (fromRaw === toRaw) return alert("出発駅と到着駅が同じです。");

    const [lineFrom, nameFrom] = fromRaw.split(':');
    const [lineTo, nameTo] = toRaw.split(':');
    const startMins = timeToMins(startTimeStr);

    let resultHTML = '';

    // 単一路線内の判定
    if (lineFrom === lineTo || nameFrom === "鎌倉" || nameTo === "鎌倉") {
        const lineData = (lineFrom === "SK" || nameFrom === "鎌倉" && lineTo !== "SM") ? lineKanagawa : lineMiura;
        resultHTML = generateSingleLineRoute(lineData, nameFrom, nameTo, startMins);
    } else {
        // 路線を跨ぐ場合（鎌倉乗り換え）
        resultHTML = generateTransferRoute(nameFrom, nameTo, startMins, lineFrom);
    }

    const resDiv = document.getElementById('search-results');
    resDiv.style.display = 'block';
    resDiv.innerHTML = `<h4 style="margin-bottom:15px; border-left:4px solid #f39c12; padding-left:10px;">検索結果</h4>` + resultHTML;
}

// 単一路線内ロジック（優等・各停の使い分け）
function generateSingleLineRoute(lineData, from, to, startMins) {
    const st1 = lineData.find(s => s.name === from);
    const st2 = lineData.find(s => s.name === to);
    const rawDuration = Math.abs(st2.time - st1.time);

    // 両方の駅が優等停車駅なら「準特急」、そうでなければ「各駅停車」
    const useExpress = st1.isExpress && st2.isExpress;
    const type = useExpress ? "準特急" : "各駅停車";
    const duration = useExpress ? Math.floor(rawDuration * 0.75) : rawDuration; // 優等は25%速い設定
    
    const depTime = startMins + 3;
    const arrTime = depTime + duration;
    const fare = 160 + Math.floor(duration / 4) * 20;

    return createResultCard(type, `${from} → ${to}`, duration, fare, [
        { time: minsToTime(depTime), station: from, type: "dep" },
        { info: `${type} (${duration}分)` },
        { time: minsToTime(arrTime), station: to, type: "arr" }
    ]);
}

// 乗り換えロジック（神奈川線 ↔ 西三浦線）
function generateTransferRoute(from, to, startMins, fromLineCode) {
    const line1 = fromLineCode === "SK" ? lineKanagawa : lineMiura;
    const line2 = fromLineCode === "SK" ? lineMiura : lineKanagawa;

    const stStart = line1.find(s => s.name === from);
    const stMid1 = line1.find(s => s.name === "鎌倉");
    const stMid2 = line2.find(s => s.name === "鎌倉");
    const stEnd = line2.find(s => s.name === to);

    // 第1区間
    const useExp1 = stStart.isExpress && stMid1.isExpress;
    const dur1 = useExp1 ? Math.floor(Math.abs(stMid1.time - stStart.time) * 0.75) : Math.abs(stMid1.time - stStart.time);
    
    // 第2区間
    const useExp2 = stMid2.isExpress && stEnd.isExpress;
    const dur2 = useExp2 ? Math.floor(Math.abs(stEnd.time - stMid2.time) * 0.75) : Math.abs(stEnd.time - stMid2.time);

    const dep1 = startMins + 3;
    const arr1 = dep1 + dur1;
    const dep2 = arr1 + 7; // 乗り換え7分
    const arr2 = dep2 + dur2;
    const totalFare = 340 + Math.floor((dur1+dur2)/5) * 20;

    return createResultCard("乗換あり", `${from} → ${to}`, (arr2 - dep1), totalFare, [
        { time: minsToTime(dep1), station: from, type: "dep" },
        { info: `${useExp1 ? '準特急' : '各駅停車'} (${dur1}分)` },
        { time: minsToTime(arr1), station: "鎌倉", type: "transfer", badge: "乗換" },
        { info: "鎌倉駅にて乗り換え" },
        { time: minsToTime(dep2), station: "鎌倉", type: "dep" },
        { info: `${useExp2 ? '特急' : '各駅停車'} (${dur2}分)` },
        { time: minsToTime(arr2), station: to, type: "arr" }
    ]);
}

function createResultCard(label, route, duration, fare, steps) {
    let stepsHTML = '';
    steps.forEach(step => {
        if (step.info) {
            stepsHTML += `<div class="train-info">${step.info}</div>`;
        } else {
            const cls = step.type === 'dep' ? 'departure' : (step.type === 'arr' ? 'arrival' : '');
            stepsHTML += `
                <div class="timeline-point ${cls}">
                    <span class="time">${step.time}</span>
                    <span class="station">${step.station} ${step.badge ? `<span class="transfer-badge">${step.badge}</span>`:''}</span>
                </div>`;
        }
    });

    return `
    <div class="result-card">
        <div class="result-header">
            <span class="type-badge">${label}</span>
            <div class="route-summary">${steps[0].time} ⇒ ${steps[steps.length-1].time}</div>
            <div class="route-meta">所要 ${duration}分 / 運賃 ${fare}円</div>
        </div>
        <div class="result-body"><div class="timeline">${stepsHTML}</div></div>
    </div>`;
}