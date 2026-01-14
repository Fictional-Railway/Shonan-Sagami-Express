/* ============================================================
   湘南相模急行電鉄 (SER) 統合運行管理システム Ver 5.0
   Supported Lines: 神奈川線, 西三浦線, 衣笠線, 南大和線, 宮ヶ瀬線
   Features: リアルタイムダイヤ, 始発・終電判定, 深夜時間処理
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
   baseInterval: 運行間隔
   firstTrain: 始発時刻(分) 5:00=300
   lastTrain: 終電時刻(分) 25:00=1500
   ============================================================ */

const SERVICE_START = 5 * 60;  // 05:00 始発
const SERVICE_END = 25 * 60 + 30; // 25:30 (翌01:30) 全線運行終了

// 1. 神奈川線 (SK) - 本線
const lineKanagawa = {
    id: "SK", name: "神奈川線", color: "#3498db", baseInterval: 10,
    stations: [
        { name: "本厚木", time: 0, isExpress: true },
        { name: "厚木", time: 3, isExpress: false },
        { name: "海老名", time: 6, isExpress: true },
        { name: "東海老名", time: 9, isExpress: false },
        { name: "相模早川", time: 12, isExpress: false },
        { name: "寺尾台", time: 15, isExpress: false },
        { name: "綾瀬中央", time: 18, isExpress: true },
        { name: "南綾瀬", time: 21, isExpress: false },
        { name: "相模落合", time: 24, isExpress: false },
        { name: "葛原", time: 27, isExpress: false },
        { name: "慶応SFC前", time: 31, isExpress: true },
        { name: "湘南ライフタウン", time: 34, isExpress: true },
        { name: "駒寄小学校前", time: 37, isExpress: false },
        { name: "善行団地西", time: 40, isExpress: false },
        { name: "本藤沢", time: 43, isExpress: false },
        { name: "藤沢", time: 47, isExpress: true },
        { name: "川名", time: 50, isExpress: false },
        { name: "手広", time: 53, isExpress: false },
        { name: "深沢", time: 56, isExpress: true },
        { name: "常盤", time: 59, isExpress: false },
        { name: "鎌倉", time: 64, isExpress: true }
    ]
};

// 2. 西三浦線 (SM)
const lineMiura = {
    id: "SM", name: "西三浦線", color: "#f1c40f", baseInterval: 15,
    stations: [
        { name: "鎌倉", time: 0, isExpress: true },
        { name: "由比ヶ浜", time: 2, isExpress: false },
        { name: "材木座", time: 4, isExpress: false },
        { name: "小坪海浜公園", time: 7, isExpress: false },
        { name: "披露山公園口", time: 10, isExpress: false },
        { name: "逗子海岸", time: 13, isExpress: false },
        { name: "新逗子", time: 15, isExpress: true },
        { name: "葉山アリーナ", time: 18, isExpress: false },
        { name: "森戸神社前", time: 21, isExpress: false },
        { name: "一色海岸", time: 24, isExpress: false },
        { name: "下山口", time: 27, isExpress: false },
        { name: "長者ヶ崎", time: 30, isExpress: false },
        { name: "関根海岸", time: 33, isExpress: false },
        { name: "久留和海岸", time: 35, isExpress: false },
        { name: "秋谷・立石公園", time: 38, isExpress: false },
        { name: "本秋谷", time: 40, isExpress: false },
        { name: "佐島の丘", time: 43, isExpress: false },
        { name: "長坂", time: 46, isExpress: false },
        { name: "市民病院前", time: 49, isExpress: false },
        { name: "駐屯地南", time: 52, isExpress: false },
        { name: "武山", time: 55, isExpress: true },
        { name: "発声", time: 58, isExpress: true },
        { name: "三崎口", time: 61, isExpress: true },
        { name: "北小網代", time: 64, isExpress: false },
        { name: "小網代の森入口", time: 66, isExpress: false },
        { name: "三崎警察署前", time: 69, isExpress: false },
        { name: "三崎原町", time: 71, isExpress: false },
        { name: "原稲荷入口", time: 73, isExpress: false },
        { name: "栄町", time: 75, isExpress: false },
        { name: "北条", time: 77, isExpress: false },
        { name: "すずらん通り", time: 79, isExpress: false },
        { name: "三崎港", time: 82, isExpress: true }
    ]
};

// 3. 衣笠線 (KI)
const lineKinugasa = {
    id: "KI", name: "衣笠線", color: "#9b59b6", baseInterval: 20,
    stations: [
        { name: "武山", time: 0, isExpress: true },
        { name: "一騎塚", time: 2, isExpress: false },
        { name: "武山団地", time: 5, isExpress: false },
        { name: "東漸寺", time: 8, isExpress: false },
        { name: "山科台", time: 10, isExpress: false },
        { name: "衣笠インター", time: 13, isExpress: true },
        { name: "西佐原", time: 16, isExpress: false },
        { name: "佐原", time: 19, isExpress: false },
        { name: "湘南北久里浜", time: 22, isExpress: false },
        { name: "湘南大津", time: 25, isExpress: true },
        { name: "堀之内", time: 28, isExpress: false },
        { name: "安浦町", time: 31, isExpress: false },
        { name: "横須賀若松", time: 34, isExpress: true }
    ]
};

// 4. 南大和線 (SY)
const lineYamato = {
    id: "SY", name: "南大和線", color: "#e67e22", baseInterval: 20,
    stations: [
        { name: "二俣川", time: 0, isExpress: true },
        { name: "桃源台", time: 3, isExpress: false },
        { name: "神明台", time: 6, isExpress: false },
        { name: "阿久和", time: 9, isExpress: false },
        { name: "和泉", time: 12, isExpress: false },
        { name: "上渋谷", time: 15, isExpress: true },
        { name: "相模高座渋谷", time: 18, isExpress: false },
        { name: "上土棚", time: 21, isExpress: false },
        { name: "南綾瀬", time: 24, isExpress: false },
        { name: "綾瀬中央", time: 27, isExpress: true }
    ]
};

// 5. 宮ヶ瀬線 (SG)
const lineMiyagase = {
    id: "SG", name: "宮ヶ瀬線", color: "#27ae60", baseInterval: 20,
    stations: [
        { name: "本厚木", time: 0, isExpress: true },
        { name: "戸室団地", time: 2, isExpress: false },
        { name: "相模福伝寺", time: 4, isExpress: false },
        { name: "駒ヶ原・古松台", time: 7, isExpress: false },
        { name: "小鮎", time: 10, isExpress: false },
        { name: "相模飯山", time: 13, isExpress: true },
        { name: "上飯山", time: 15, isExpress: false },
        { name: "西桜山", time: 17, isExpress: false },
        { name: "南桜山", time: 19, isExpress: false },
        { name: "煤ヶ原", time: 22, isExpress: true },
        { name: "清川村運動公園", time: 25, isExpress: false },
        { name: "中根", time: 27, isExpress: false },
        { name: "清川", time: 30, isExpress: true },
        { name: "小在家", time: 32, isExpress: false },
        { name: "柿ノ木平", time: 34, isExpress: false },
        { name: "道祖神入口", time: 36, isExpress: false },
        { name: "奥宮ヶ瀬", time: 39, isExpress: true }
    ]
};

const allLines = [lineKanagawa, lineMiura, lineKinugasa, lineYamato, lineMiyagase];

/* ============================================================
   グラフ構築 & 探索
   ============================================================ */

let stationGraph = {};

function buildGraph() {
    stationGraph = {};
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
                    isExpress: current.isExpress && next.isExpress
                };

                stationGraph[current.name].push({ to: next.name, ...edge });
                stationGraph[next.name].push({ to: current.name, ...edge });
            }
        }
    });
}

function findPath(startName, endName) {
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
   時刻ロジック (始発・終電対応)
   ============================================================ */

// HH:MM を「鉄道分」に変換 (例: 01:00 -> 25:00 -> 1500分)
function timeToMinsRailway(t) {
    const [h, m] = t.split(':').map(Number);
    // 0～3時は「深夜24時～27時」扱い
    if (h < 4) return (h + 24) * 60 + m;
    return h * 60 + m;
}

// 分を時刻表示に戻す (例: 1500 -> 25:00 ではなく 01:00 表記に直すか、25:00のままにするか)
// ここでは鉄道っぽく「25:00」のような表記も許容しつつ、わかりやすく整形
function minsToTimeRailway(m) {
    let hh = Math.floor(m / 60);
    let mm = Math.floor(m % 60);
    // 表示用: 24時を超えたら翌表記にするなどの装飾
    if (hh >= 24) {
        return `翌${(hh - 24).toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
    }
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
}

// 次の列車計算 (始発・終電ロジック)
// 戻り値: -1 なら「終電終了」
function getNextDepartureTime(currentMins, interval) {
    // 1. まだ始発前の場合 -> 始発まで待つ
    if (currentMins < SERVICE_START) {
        return SERVICE_START;
    }

    // 2. 既に終電時間を過ぎている場合
    if (currentMins > SERVICE_END) {
        return -1; 
    }

    // 3. 通常運行計算
    const remainder = currentMins % interval;
    let departure = (remainder === 0) ? currentMins : currentMins + (interval - remainder);

    // 計算した発車時刻が終電を超えていたらアウト
    if (departure > SERVICE_END) {
        return -1;
    }
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
            op.text = s.name;
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

    if (fromVal === toVal) return alert("出発駅と到着駅が同じです。");

    const rawPath = findPath(fromVal, toVal);
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
                stops: [step.from]
            };
        }
        currentSeg.to = step.to;
        currentSeg.stops.push(step.to);
        currentSeg.rawDuration += step.cost;
        if (!step.isExpress) currentSeg.allExpress = false;
    });
    if (currentSeg) segments.push(currentSeg);

    // --- 計算実行 ---
    
    // 入力時間を鉄道時間に変換
    let inputMins = timeToMinsRailway(timeVal);
    
    // もし入力が「終電後(25:30〜)」かつ「始発前(29:00=翌5:00)」の間なら
    // 「本日の運行は終了しました」として、翌日の始発検索に切り替えるか警告する
    // ここでは親切に「翌日の始発」を案内する
    let isNextDayStart = false;
    if (inputMins > SERVICE_END) {
        inputMins = SERVICE_START; // 強制的に翌朝5時にセット
        isNextDayStart = true;
    }

    let currentMins = inputMins;
    let totalFare = 0;
    let timelineHTML = '';
    let isRoutePossible = true;
    
    // 始発待ちメッセージ
    if (isNextDayStart) {
        timelineHTML += `<div style="background:#e74c3c; color:#fff; padding:10px; border-radius:4px; margin-bottom:15px; font-size:13px;">
            本日の運行は終了しました。翌日の始発をご案内します。
        </div>`;
    } else if (inputMins < SERVICE_START) {
        // 早朝に検索した場合
        timelineHTML += `<div style="background:#f39c12; color:#fff; padding:5px; border-radius:4px; margin-bottom:10px; font-size:12px;">
            始発までお待ちください
        </div>`;
    }

    let isFirstStation = true;

    // ループ処理
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        
        // 発車時刻を計算
        // 改札移動等で+3分してから次の電車を探す
        let searchTimeBase = (isFirstStation) ? currentMins : currentMins + 3; 
        
        let departureMins = getNextDepartureTime(searchTimeBase, seg.interval);

        // ★終電判定★
        if (departureMins === -1) {
            timelineHTML += `
                <div class="timeline-point transfer" style="opacity:0.6;">
                    <span class="station">${seg.from}</span>
                </div>
                <div style="background:#c0392b; color:white; padding:10px; margin:10px 0; border-radius:4px; font-weight:bold;">
                    ⛔ 終電接続なし<br>
                    <span style="font-size:0.8em; font-weight:normal;">これより先の ${seg.lineName} は運行を終了しました。</span>
                </div>
            `;
            isRoutePossible = false;
            break; // 計算打ち切り
        }

        // 待ち時間
        const waitTime = departureMins - searchTimeBase; // 単純な待ち時間

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
            // 始発駅での発車
            timelineHTML += `
            <div class="timeline-point departure">
                <span class="time">${minsToTimeRailway(departureMins)}</span>
                <span class="station"><strong>${seg.from}</strong> 発</span>
            </div>`;
            isFirstStation = false;
        }

        // 所要時間計算
        let type = "各駅停車";
        let speedFactor = 1.0;
        if (seg.allExpress) {
            type = (seg.lineId === "SK" || seg.lineId === "SM") ? "準特急" : "急行"; 
            speedFactor = 0.75;
        }
        const duration = Math.ceil(seg.rawDuration * speedFactor);
        const arrivalMins = departureMins + duration;

        // 運賃
        const fare = 150 + (Math.floor(duration / 3) * 20); 
        totalFare += (i === 0) ? fare : (fare - 50);

        // バー描画
        timelineHTML += `
            <div class="train-info" style="border-left: 4px solid ${seg.lineColor}; padding-left:10px; margin: 5px 0 5px 15px;">
                <div style="font-weight:bold; color:${seg.lineColor};">
                    ${seg.lineName} [${type}]
                </div>
                <div style="font-size:12px; color:#666;">
                    ${minsToTimeRailway(departureMins)}発 → ${minsToTimeRailway(arrivalMins)}着 (${duration}分)
                </div>
            </div>`;

        currentMins = arrivalMins;
    }

    // 最終結果表示
    if (isRoutePossible) {
        timelineHTML += `
            <div class="timeline-point arrival">
                <span class="time">${minsToTimeRailway(currentMins)}</span>
                <span class="station"><strong>${toVal}</strong> 着</span>
            </div>`;
            
        const totalDuration = currentMins - inputMins;

        const resDiv = document.getElementById('search-results');
        resDiv.style.display = 'block';
        resDiv.innerHTML = `
            <div class="result-card">
                <div class="result-header" style="background:#b4b4b4; color:#fff;">
                    <div class="route-summary" style="font-size:1.1em;">
                        ${fromVal} <small>から</small> ${toVal} <small>までの経路</small>
                    </div>
                    <div class="route-meta" style="margin-top:5px; color:#4b4b4b; font-size:0.9em;">
                        到着: <strong>${minsToTimeRailway(currentMins)}</strong> / 総所要: ${totalDuration}分 / 運賃: ${totalFare}円
                    </div>
                </div>
                <div class="result-body">
                    <div class="timeline">
                        ${timelineHTML}
                    </div>
                </div>
            </div>
        `;
    } else {
        // 終電アウトの場合
        const resDiv = document.getElementById('search-results');
        resDiv.style.display = 'block';
        resDiv.innerHTML = `
            <div class="result-card">
                <div class="result-header" style="background:#7f8c8d; color:#fff;">
                    <div class="route-summary">経路計算不能</div>
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