/* ============================================================
   湘南相模急行電鉄 (SER) 統合運行管理システム Ver 4.0
   Supported Lines: 神奈川線, 西三浦線, 衣笠線, 南大和線, 宮ヶ瀬線
   Features: リアルタイムダイヤ計算, 乗り継ぎ最適化
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
   baseInterval: その路線の基本運行間隔（分）
   ============================================================ */

// 1. 神奈川線 (SK) - 本線なので頻繁に来る (10分間隔)
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

// 2. 西三浦線 (SM) - 観光路線 (15分間隔)
// ★武山を準特急停車(true)に変更済み
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
        { name: "武山", time: 55, isExpress: true }, // ★準特急停車！
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

// 3. 衣笠線 (KI) - 支線 (20分間隔)
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

// 4. 南大和線 (SY) - 支線 (20分間隔)
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

// 5. 宮ヶ瀬線 (SG) - 山岳支線 (20分間隔)
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
   グラフ理論 & ダイヤ計算ロジック
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
                    lineInterval: line.baseInterval, // 運行間隔データ
                    cost: cost,
                    isExpress: current.isExpress && next.isExpress
                };

                stationGraph[current.name].push({ to: next.name, ...edge });
                stationGraph[next.name].push({ to: current.name, ...edge });
            }
        }
    });
}

// 探索アルゴリズム
function findPath(startName, endName) {
    if(!stationGraph[startName]) return null;

    let queue = [{ name: startName, path: [], totalCost: 0 }];
    let visited = new Set();
    
    // 単純な距離(時間)での最短経路を探す
    // ※ダイヤ待ち時間はここでは考慮せず、経路確定後に計算する
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
                    // 乗り換えペナルティ(7分)を仮に入れて探索
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

// 次の列車発車時刻を計算する関数
// arrivalTime: 駅に着いた時刻(分), interval: 運行間隔(分)
function getNextDepartureTime(arrivalTime, interval) {
    // 例: 10:12着(612分)、間隔10分なら、次は10:20(620分)発
    // 乗り換え等の最低時間を3分確保する
    const minDeparture = arrivalTime + 3; 
    
    // intervalの倍数で、minDeparture以上の最小の値を計算
    // 例: minDeparture=615, interval=10 -> 620
    const remainder = minDeparture % interval;
    if (remainder === 0) return minDeparture;
    return minDeparture + (interval - remainder);
}

/* ============================================================
   UI操作・表示ロジック
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

function timeToMins(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function minsToTime(m) {
    let hh = Math.floor(m / 60) % 24;
    let mm = Math.floor(m % 60);
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
}

function performSearch() {
    const fromVal = document.getElementById('station-from').value;
    const toVal = document.getElementById('station-to').value;
    const timeVal = document.getElementById('search-time').value;

    if (fromVal === toVal) return alert("出発駅と到着駅が同じです。");

    const rawPath = findPath(fromVal, toVal);
    if (!rawPath) return alert("経路が見つかりませんでした。");

    // パスをセグメント化
    const segments = [];
    let currentSeg = null;

    rawPath.forEach(step => {
        if (!currentSeg || currentSeg.lineId !== step.lineId) {
            if (currentSeg) segments.push(currentSeg);
            currentSeg = {
                lineId: step.lineId,
                lineName: step.lineName,
                lineColor: step.lineColor,
                interval: step.lineInterval, // この路線の運行間隔
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

    // ★リアルタイム計算処理★
    let currentMins = timeToMins(timeVal); // 現在時刻(駅にいる状態)
    let totalFare = 0;
    let timelineHTML = '';
    
    // 最初の出発
    // 改札入ってから最初の電車を捕まえる
    let departureMins = getNextDepartureTime(currentMins - 3, segments[0].interval); 
    // ※ -3 しているのは、getNextDepartureで+3されるため、入力時刻ちょうど以降の電車を拾う調整
    
    let isFirst = true;

    segments.forEach((seg, index) => {
        // 出発時刻決定 (2本目以降は前の到着時刻に基づいて計算)
        if (!isFirst) {
            // 前の到着時刻 currentMins から、この路線のintervalに合わせて次の発車を探す
            departureMins = getNextDepartureTime(currentMins, seg.interval);
            
            // 待ち時間計算
            const waitTime = departureMins - currentMins;
            
            // 乗換表示
            timelineHTML += `
            <div class="timeline-point transfer">
                <span class="time">${minsToTime(currentMins)}</span>
                <span class="station">${seg.from} <span class="transfer-badge">乗換</span></span>
            </div>
            <div style="font-size:12px; color:000; margin-left:20px; padding:5px 0; font-weight:bold;">
                ↓ 待ち合わせ ${waitTime}分
            </div>`;
        } else {
            // 最初の出発駅
            timelineHTML += `
            <div class="timeline-point departure">
                <span class="time">${minsToTime(departureMins)}</span>
                <span class="station"><strong>${seg.from}</strong> 発</span>
            </div>`;
            isFirst = false;
        }

        // 移動時間計算
        let type = "各駅停車";
        let speedFactor = 1.0;
        if (seg.allExpress) {
            type = (seg.lineId === "SK" || seg.lineId === "SM") ? "準特急" : "急行"; 
            speedFactor = 0.75;
        }
        const duration = Math.ceil(seg.rawDuration * speedFactor);
        const arrivalMins = departureMins + duration;

        // 運賃計算
        const fare = 150 + (Math.floor(duration / 3) * 20); 
        totalFare += (index === 0) ? fare : (fare - 50);

        // 移動バー
        timelineHTML += `
            <div class="train-info" style="border-left: 4px solid ${seg.lineColor}; padding-left:10px; margin: 5px 0 5px 15px;">
                <div style="font-weight:bold; color:${seg.lineColor};">
                    ${seg.lineName} [${type}]
                </div>
                <div style="font-size:12px; color:#666;">
                    ${minsToTime(departureMins)}発 → ${minsToTime(arrivalMins)}着 (所要${duration}分)
                </div>
            </div>`;
        
        // 現在時刻を到着時刻に進める
        currentMins = arrivalMins;
    });

    // 最終到着
    timelineHTML += `
        <div class="timeline-point arrival">
            <span class="time">${minsToTime(currentMins)}</span>
            <span class="station"><strong>${toVal}</strong> 着</span>
        </div>`;

    const totalDuration = currentMins - timeToMins(timeVal); // 待ち時間込みの総所要時間

    // 結果表示
    const resDiv = document.getElementById('search-results');
    resDiv.style.display = 'block';
    resDiv.innerHTML = `
        <div class="result-card">
            <div class="result-header" style="background:#b4b4b4; color:#fff;">
                <div class="route-summary" style="font-size:1.1em;">
                    ${fromVal} <small>から</small> ${toVal} <small>までの経路</small>
                </div>
                <div class="route-meta" style="margin-top:5px;">
                    到着時刻: <strong>${minsToTime(currentMins)}</strong> (総所要: ${totalDuration}分) / 運賃: <strong>${totalFare}円</strong>
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