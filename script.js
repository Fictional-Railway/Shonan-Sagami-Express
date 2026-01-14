/* ============================================================
   湘南相模急行電鉄 (SER) 統合運行管理システム Ver 9.0
   Features: 潮風ライナー, 特急優先検索, 駅ナンバリング, 始発終電判定
   Update: 追い越し・待避ロジック (Passing Wait Logic) 実装
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // UI制御
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('main-nav');
    if (toggle && nav) toggle.addEventListener('click', () => nav.classList.toggle('active'));

    // 運行情報の時刻更新
    const updateTickerTime = () => {
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}更新`;
        const el = document.getElementById('update-time');
        if (el) el.textContent = timeStr;
    };
    updateTickerTime();
    setInterval(updateTickerTime, 60000);

    // 検索システム初期化
    initSearchSystem();
});

/* ============================================================
   路線・駅・ダイヤ定義
   ============================================================ */

const SERVICE_START = 5 * 60;  // 05:00
const SERVICE_END = 25 * 60 + 30; // 25:30

// ★ 通過待ち（待避）を行う主要駅の定義
const PASSING_HUBS = ["綾瀬中央", "藤沢", "新逗子", "衣笠インター", "二俣川", "三崎口"];

// 1. 神奈川線 (SS)
const lineKanagawa = {
    id: "SS", name: "神奈川線", color: "#3498db", baseInterval: 10,
    stations: [
        { name: "本厚木", time: 0, isExpress: true }, { name: "厚木", time: 3, isExpress: false },
        { name: "海老名", time: 6, isExpress: true }, { name: "東海老名", time: 9, isExpress: false },
        { name: "相模早川", time: 12, isExpress: false }, { name: "寺尾台", time: 15, isExpress: false },
        { name: "綾瀬中央", time: 18, isExpress: true }, { name: "南綾瀬", time: 21, isExpress: false },
        { name: "相模落合", time: 24, isExpress: false }, { name: "葛原", time: 27, isExpress: false },
        { name: "慶応SFC前", time: 31, isExpress: true }, { name: "湘南ライフタウン", time: 34, isExpress: true },
        { name: "駒寄小学校前", time: 37, isExpress: false }, { name: "善行団地西", time: 40, isExpress: false },
        { name: "本藤沢", time: 43, isExpress: false }, { name: "藤沢", time: 47, isExpress: true },
        { name: "川名", time: 50, isExpress: false }, { name: "手広", time: 53, isExpress: false },
        { name: "深沢", time: 56, isExpress: true }, { name: "常盤", time: 59, isExpress: false },
        { name: "鎌倉", time: 64, isExpress: true }
    ]
};

// 2. 西三浦線 (SM)
const lineMiura = {
    id: "SM", name: "西三浦線", color: "#f1c40f", baseInterval: 15,
    stations: [
        { name: "鎌倉", time: 0, isExpress: true }, { name: "由比ヶ浜", time: 2, isExpress: false },
        { name: "材木座", time: 4, isExpress: false }, { name: "小坪海浜公園", time: 7, isExpress: false },
        { name: "披露山公園口", time: 10, isExpress: false }, { name: "逗子海岸", time: 13, isExpress: false },
        { name: "新逗子", time: 15, isExpress: true }, { name: "葉山アリーナ", time: 18, isExpress: false },
        { name: "森戸神社前", time: 21, isExpress: false }, { name: "一色海岸", time: 24, isExpress: false },
        { name: "下山口", time: 27, isExpress: false }, { name: "長者ヶ崎", time: 30, isExpress: false },
        { name: "関根海岸", time: 33, isExpress: false }, { name: "久留和海岸", time: 35, isExpress: false },
        { name: "秋谷・立石公園", time: 38, isExpress: false }, { name: "本秋谷", time: 40, isExpress: false },
        { name: "佐島の丘", time: 43, isExpress: false }, { name: "長坂", time: 46, isExpress: false },
        { name: "市民病院前", time: 49, isExpress: false }, { name: "駐屯地南", time: 52, isExpress: false },
        { name: "武山", time: 55, isExpress: true }, { name: "発声", time: 58, isExpress: true },
        { name: "三崎口", time: 61, isExpress: true }, { name: "北小網代", time: 64, isExpress: false },
        { name: "小網代の森入口", time: 66, isExpress: false }, { name: "三崎警察署前", time: 69, isExpress: false },
        { name: "三崎原町", time: 71, isExpress: false }, { name: "原稲荷入口", time: 73, isExpress: false },
        { name: "栄町", time: 75, isExpress: false }, { name: "北条", time: 77, isExpress: false },
        { name: "すずらん通り", time: 79, isExpress: false }, { name: "三崎港", time: 82, isExpress: true }
    ]
};

// 3. 衣笠線 (SK)
const lineKinugasa = {
    id: "SK", name: "衣笠線", color: "#9b59b6", baseInterval: 20,
    stations: [
        { name: "武山", time: 0, isExpress: true }, { name: "一騎塚", time: 2, isExpress: false },
        { name: "武山団地", time: 5, isExpress: false }, { name: "東漸寺", time: 8, isExpress: false },
        { name: "山科台", time: 10, isExpress: false }, { name: "衣笠インター", time: 13, isExpress: true },
        { name: "西佐原", time: 16, isExpress: false }, { name: "佐原", time: 19, isExpress: false },
        { name: "湘南北久里浜", time: 22, isExpress: false }, { name: "湘南大津", time: 25, isExpress: true },
        { name: "堀之内", time: 28, isExpress: false }, { name: "安浦町", time: 31, isExpress: false },
        { name: "横須賀若松", time: 34, isExpress: true }
    ]
};

// 4. 南大和線 (SY)
const lineYamato = {
    id: "SY", name: "南大和線", color: "#e67e22", baseInterval: 20,
    stations: [
        { name: "二俣川", time: 0, isExpress: true }, { name: "桃源台", time: 3, isExpress: false },
        { name: "神明台", time: 6, isExpress: false }, { name: "阿久和", time: 9, isExpress: false },
        { name: "和泉", time: 12, isExpress: false }, { name: "上渋谷", time: 15, isExpress: true },
        { name: "相模高座渋谷", time: 18, isExpress: false }, { name: "上土棚", time: 21, isExpress: false },
        { name: "南綾瀬", time: 24, isExpress: false }, { name: "綾瀬中央", time: 27, isExpress: true }
    ]
};

// 5. 宮ヶ瀬線 (SG)
const lineMiyagase = {
    id: "SG", name: "宮ヶ瀬線", color: "#27ae60", baseInterval: 20,
    stations: [
        { name: "本厚木", time: 0, isExpress: true }, { name: "戸室団地", time: 2, isExpress: false },
        { name: "相模福伝寺", time: 4, isExpress: false }, { name: "駒ヶ原・古松台", time: 7, isExpress: false },
        { name: "小鮎", time: 10, isExpress: false }, { name: "相模飯山", time: 13, isExpress: true },
        { name: "上飯山", time: 15, isExpress: false }, { name: "西桜山", time: 17, isExpress: false },
        { name: "南桜山", time: 19, isExpress: false }, { name: "煤ヶ原", time: 22, isExpress: true },
        { name: "清川村運動公園", time: 25, isExpress: false }, { name: "中根", time: 27, isExpress: false },
        { name: "清川", time: 30, isExpress: true }, { name: "小在家", time: 32, isExpress: false },
        { name: "柿ノ木平", time: 34, isExpress: false }, { name: "道祖神入口", time: 36, isExpress: false },
        { name: "奥宮ヶ瀬", time: 39, isExpress: true }
    ]
};

const allLines = [lineKanagawa, lineMiura, lineKinugasa, lineYamato, lineMiyagase];

// ★ 潮風ライナーの停車駅
const shiokazeStations = ["本厚木", "海老名", "藤沢", "鎌倉", "新逗子", "武山", "三崎口", "三崎港"];

/* ============================================================
   グラフ構築 & 探索
   ============================================================ */

let stationGraph = {};

function buildGraph() {
    stationGraph = {};
    // 1. 通常路線の登録
    allLines.forEach(line => {
        for (let i = 0; i < line.stations.length; i++) {
            const current = line.stations[i];
            const next = line.stations[i+1];
            
            if (!stationGraph[current.name]) stationGraph[current.name] = [];
            
            if (next) {
                if (!stationGraph[next.name]) stationGraph[next.name] = [];
                const cost = Math.abs(next.time - current.time);
                
                const edge = {
                    lineId: line.id,
                    lineName: line.name,
                    lineColor: line.color,
                    lineInterval: line.baseInterval,
                    cost: cost,
                    isExpress: current.isExpress && next.isExpress,
                    isLimitedExp: false
                };

                stationGraph[current.name].push({ to: next.name, ...edge });
                stationGraph[next.name].push({ to: current.name, ...edge });
            }
        }
    });

    // 2. 潮風ライナー（特急）の登録 - 高速バイパス
    for (let i = 0; i < shiokazeStations.length - 1; i++) {
        const from = shiokazeStations[i];
        const to = shiokazeStations[i+1];
        const edge = {
            lineId: "LTD_SHIOKAZE",
            lineName: "潮風ライナー",
            lineColor: "#e74c3c", // 特急専用色(赤)
            lineInterval: 30,     // 30分間隔
            cost: 12,             // 通常より短い時間コスト
            isExpress: true,
            isLimitedExp: true    // ★特急フラグ
        };
        stationGraph[from].push({ to: to, ...edge });
        stationGraph[to].push({ to: from, ...edge });
    }
}

// 探索関数（特急利用チェックを受け取る）
function findPath(startName, endName, useLimitedExp) {
    if(!stationGraph[startName]) return null;
    let queue = [{ name: startName, path: [], totalCost: 0 }];
    let visited = new Set();
    
    while (queue.length > 0) {
        queue.sort((a, b) => a.totalCost - b.totalCost);
        let current = queue.shift();

        if (current.name === endName) return current.path;
        if (visited.has(current.name)) continue;
        visited.add(current.name);

        const neighbors = stationGraph[current.name];
        if (neighbors) {
            neighbors.forEach(neighbor => {
                // ★特急チェック: チェックOFFかつ特急路線の場合は無視
                if (neighbor.isLimitedExp && !useLimitedExp) return;

                if (!visited.has(neighbor.to)) {
                    let transferCost = 0;
                    if (current.path.length > 0) {
                        const lastLeg = current.path[current.path.length - 1];
                        if (lastLeg.lineId !== neighbor.lineId) transferCost = 7;
                    }
                    queue.push({
                        name: neighbor.to,
                        path: [...current.path, { from: current.name, to: neighbor.to, ...neighbor }],
                        totalCost: current.totalCost + neighbor.cost + transferCost
                    });
                }
            });
        }
    }
    return null;
}

/* ============================================================
   ヘルパー関数：駅ナンバリング取得
   ============================================================ */
function getStationCode(stationName, lineId = null) {
    // 特急IDの場合は通常の線から探す
    if (lineId === "LTD_SHIOKAZE") lineId = null;

    for (const line of allLines) {
        if (lineId && line.id !== lineId) continue;
        const index = line.stations.findIndex(s => s.name === stationName);
        if (index !== -1) {
            return `${line.id}${(index + 1).toString().padStart(2, '0')}`;
        }
    }
    return "";
}

/* ============================================================
   時刻ロジック
   ============================================================ */

function timeToMinsRailway(t) {
    const [h, m] = t.split(':').map(Number);
    if (h < 4) return (h + 24) * 60 + m;
    return h * 60 + m;
}

function minsToTimeRailway(m) {
    let hh = Math.floor(m / 60);
    let mm = Math.floor(m % 60);
    if (hh >= 24) {
        return `翌${(hh - 24).toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
    }
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
}

function getNextDepartureTime(currentMins, interval) {
    if (currentMins < SERVICE_START) return SERVICE_START;
    if (currentMins > SERVICE_END) return -1;
    const remainder = currentMins % interval;
    let departure = (remainder === 0) ? currentMins : currentMins + (interval - remainder);
    if (departure > SERVICE_END) return -1;
    return departure;
}

/* ============================================================
   UI操作・検索実行
   ============================================================ */

function initSearchSystem() {
    buildGraph();
    const fromSelect = document.getElementById('station-from');
    const toSelect = document.getElementById('station-to');
    if (!fromSelect || !toSelect) return;

    const addGroup = (select, line) => {
        let grp = document.createElement('optgroup');
        grp.label = line.name;
        line.stations.forEach(s => {
            let op = document.createElement('option');
            op.value = s.name;
            // ナンバリング付与
            const code = getStationCode(s.name, line.id);
            op.text = `[${code}] ${s.name}`;
            grp.appendChild(op);
        });
        select.appendChild(grp);
    };

    allLines.forEach(line => {
        addGroup(fromSelect, line);
        addGroup(toSelect, line);
    });

    document.getElementById('btn-search').addEventListener('click', performSearch);
}

function performSearch() {
    const fromVal = document.getElementById('station-from').value;
    const toVal = document.getElementById('station-to').value;
    const timeVal = document.getElementById('search-time').value;
    
    // ★チェックボックスの状態を取得
    const useLtd = document.getElementById('check-ltd') ? document.getElementById('check-ltd').checked : false;

    if (fromVal === toVal) return alert("出発駅と到着駅が同じです。");

    // ★特急利用フラグを渡す
    const rawPath = findPath(fromVal, toVal, useLtd);
    if (!rawPath) return alert("経路が見つかりませんでした。");

    // セグメント化
    const segments = [];
    let currentSeg = null;

    rawPath.forEach(step => {
        if (!currentSeg || currentSeg.lineId !== step.lineId) {
            if (currentSeg) segments.push(currentSeg);
            currentSeg = {
                lineId: step.lineId,
                lineName: step.lineName,
                lineColor: step.lineColor,
                interval: step.lineInterval,
                from: step.from,
                to: step.to,
                rawDuration: 0,
                allExpress: true,
                isLimitedExp: step.isLimitedExp, // 特急フラグ
                stops: [step.from]
            };
        }
        currentSeg.to = step.to;
        currentSeg.stops.push(step.to);
        currentSeg.rawDuration += step.cost;
        if (!step.isExpress) currentSeg.allExpress = false;
    });
    if (currentSeg) segments.push(currentSeg);

    // 時間計算
    let inputMins = timeToMinsRailway(timeVal);
    let isNextDayStart = false;
    if (inputMins > SERVICE_END) {
        inputMins = SERVICE_START;
        isNextDayStart = true;
    }

    let currentMins = inputMins;
    let totalFare = 0;
    let totalLtdFee = 0; // 特急料金
    let timelineHTML = '';
    let isRoutePossible = true;
    
    if (isNextDayStart) {
        timelineHTML += `<div style="background:#e74c3c; color:#fff; padding:10px; border-radius:4px; margin-bottom:15px; font-size:13px;">本日の運行は終了しました。翌日の始発をご案内します。</div>`;
    }

    let isFirstStation = true;

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        
        let searchTimeBase = (isFirstStation) ? currentMins : currentMins + 3; 
        let departureMins = getNextDepartureTime(searchTimeBase, seg.interval);

        if (departureMins === -1) {
            timelineHTML += `<div style="background:#c0392b; color:white; padding:10px; margin:10px 0;">⛔ 終電接続なし</div>`;
            isRoutePossible = false;
            break;
        }

        if (!isFirstStation) {
            timelineHTML += `
            <div class="timeline-point transfer">
                <span class="time">${minsToTimeRailway(currentMins)}</span>
                <span class="station">${seg.from} <span class="transfer-badge">乗換</span></span>
            </div>
            <div style="font-size:12px; color:#4b4b4b; margin-left:20px; padding:5px 0;">
                ↓ 待ち合わせ ${Math.max(0, departureMins - currentMins)}分
            </div>`;
        } else {
            const code = getStationCode(seg.from, seg.lineId.startsWith("LTD") ? null : seg.lineId);
            timelineHTML += `
            <div class="timeline-point departure">
                <span class="time">${minsToTimeRailway(departureMins)}</span>
                <span class="station"><strong>[${code}] ${seg.from}</strong> 発</span>
            </div>`;
            isFirstStation = false;
        }

        // 列車種別・速度・通過待ち判定
        let type = "各駅停車";
        let speedFactor = 1.0;
        let passingWaitTime = 0;
        let waitingHubs = [];
        
        if (seg.isLimitedExp) {
            type = "潮風ライナー";
            speedFactor = 1.0; 
            totalLtdFee += 500; 
        } else if (seg.allExpress) {
            type = (seg.lineId === "SS" || seg.lineId === "SM") ? "準特急" : "急行"; 
            speedFactor = 0.75;
        } else {
            // ★ 各駅停車の通過待ちロジック
            // セグメント内の停車駅をスキャンし、待避駅（PASSING_HUBS）が含まれていれば待ち時間を追加
            // ただし、乗車駅(from)や下車駅(to)自体が待避駅の場合は、乗降中なので待ち時間に含めない
            seg.stops.forEach(st => {
                if (PASSING_HUBS.includes(st) && st !== seg.from && st !== seg.to) {
                    passingWaitTime += 4; // 1駅につき4分の待ち合わせ
                    waitingHubs.push(st);
                }
            });
        }
        
        const runDuration = Math.ceil(seg.rawDuration * speedFactor);
        const totalSegDuration = runDuration + passingWaitTime;
        const arrivalMins = departureMins + totalSegDuration;

        // 運賃計算
        const fare = 150 + (Math.floor(runDuration / 3) * 20); 
        totalFare += (i === 0) ? fare : (fare - 50);

        // HTML生成（通過待ちがある場合は注釈を表示）
        let waitNote = '';
        if (passingWaitTime > 0) {
            waitNote = `<div style="margin-top:4px; font-size:11px; color:#e67e22;">
                <span style="background:#f39c12; color:white; padding:1px 4px; border-radius:3px;">通過待</span> 
                ${waitingHubs.join("、")} で急行・特急の通過待ち
            </div>`;
        }

        timelineHTML += `
            <div class="train-info" style="border-left: 4px solid ${seg.lineColor}; padding-left:10px; margin: 5px 0 5px 15px;">
                <div style="font-weight:bold; color:${seg.lineColor};">
                    ${seg.lineName} [${type}]
                </div>
                <div style="font-size:12px; color:#666;">
                    ${minsToTimeRailway(departureMins)}発 → ${minsToTimeRailway(arrivalMins)}着 (${totalSegDuration}分)
                </div>
                ${waitNote}
            </div>`;

        currentMins = arrivalMins;
    }

    if (isRoutePossible) {
        const lastCode = getStationCode(toVal);
        timelineHTML += `
            <div class="timeline-point arrival">
                <span class="time">${minsToTimeRailway(currentMins)}</span>
                <span class="station"><strong>[${lastCode}] ${toVal}</strong> 着</span>
            </div>`;
            
        const totalDuration = currentMins - inputMins;

        const resDiv = document.getElementById('search-results');
        resDiv.style.display = 'block';
        resDiv.innerHTML = `
            <div class="result-card">
                <div class="result-header" style="background:${totalLtdFee > 0 ? '#b4b4b4' : '#b4b4b4'}; color:#4b4b4b;">
                    <div class="route-summary" style="font-size:1.1em;">
                        ${fromVal} ➔ ${toVal}
                    </div>
                    <div class="route-meta" style="margin-top:5px; color:#4b4b4b; font-size:0.9em;">
                        到着: <strong>${minsToTimeRailway(currentMins)}</strong> / 所要: ${totalDuration}分<br>
                        運賃: <strong>${totalFare + totalLtdFee}円</strong>
                        ${totalLtdFee > 0 ? `(内 特急券:500円)` : ''}
                    </div>
                </div>
                <div class="result-body">
                    <div class="timeline">
                        ${timelineHTML}
                    </div>
                </div>
            </div>
        `;
    }
}