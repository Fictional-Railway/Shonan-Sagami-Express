/* ============================================================
   湘南相模急行電鉄 (SER) 統合運行管理システム Ver 10.0 (Tsuzuki Update)
   Update: 南大和線・港北線直通特急「都筑」の実装、特急コスト計算の最適化
   ============================================================ */

// ■■■■■ 1. 定数・データ定義 ■■■■■

const SERVICE_START = 5 * 60;  // 05:00
const SERVICE_END = 25 * 60 + 30; // 25:30

// 通過待ちを行う主要駅（急行・ライナーの待避）
const PASSING_HUBS = ["綾瀬中央", "藤沢", "新逗子", "衣笠インター", "二俣川", "三崎口", "新横浜", "センター南"];

// --- 路線データ ---

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

// 6. 港北線 (SH)
const lineKohoku = {
    id: "SH", name: "港北線", color: "#32CD32", baseInterval: 10,
    stations: [
        { name: "二俣川", time: 0, isExpress: true },
        { name: "本宿町", time: 3, isExpress: false }, 
        { name: "左近山団地", time: 5, isExpress: false },
        { name: "新桜ヶ丘", time: 8, isExpress: false },
        { name: "初音ヶ丘", time: 10, isExpress: false },
        { name: "岩崎町", time: 12, isExpress: false },
        { name: "相模保土ヶ谷", time: 15, isExpress: false },
        { name: "相模西横浜", time: 17, isExpress: false },
        { name: "戸部", time: 19, isExpress: false },
        { name: "横浜", time: 22, isExpress: true },
        { name: "相模反町", time: 24, isExpress: false },
        { name: "仲木戸", time: 26, isExpress: false },
        { name: "白幡仲町", time: 28, isExpress: false },
        { name: "大口台", time: 30, isExpress: false },
        { name: "東菊名", time: 32, isExpress: false },
        { name: "菊名", time: 34, isExpress: true },
        { name: "新横浜", time: 37, isExpress: true },
        { name: "相模小机", time: 40, isExpress: false },
        { name: "新川向橋", time: 42, isExpress: false },
        { name: "池辺町", time: 45, isExpress: false },
        { name: "北池辺", time: 47, isExpress: false },
        { name: "平台中央", time: 49, isExpress: false },
        { name: "センター南", time: 52, isExpress: true },
        { name: "センター北", time: 54, isExpress: true },
        { name: "すみれが丘", time: 57, isExpress: false },
        { name: "鷺沼台", time: 59, isExpress: false },
        { name: "宮前", time: 61, isExpress: false },
        { name: "神木", time: 63, isExpress: false },
        { name: "神木本町", time: 65, isExpress: false },
        { name: "長尾", time: 67, isExpress: false },
        { name: "相模生田", time: 69, isExpress: false },
        { name: "登戸", time: 72, isExpress: true }
    ]
};

const allLines = [lineKanagawa, lineMiura, lineKinugasa, lineYamato, lineMiyagase, lineKohoku];

// --- 特急設定 ---

// 潮風ライナー（観光・リゾート特急）
const shiokazeStations = ["本厚木", "海老名", "藤沢", "鎌倉", "新逗子", "武山", "三崎口", "三崎港"];

// 特急「都筑」（都市間直通ビジネス特急）
const tsuzukiStations = ["綾瀬中央", "上渋谷", "二俣川", "横浜", "新横浜", "センター南", "センター北", "登戸"];

// グラフ変数
let stationGraph = {};

// ■■■■■ 2. 内部ロジック関数 ■■■■■

/**
 * 2駅間の標準所要時間を取得（特急コスト計算用）
 */
function getStandardTimeCost(from, to) {
    // 同じ路線内での時間を探す
    for (const line of allLines) {
        const s1 = line.stations.find(s => s.name === from);
        const s2 = line.stations.find(s => s.name === to);
        if (s1 && s2) {
            return Math.abs(s1.time - s2.time);
        }
    }
    // 異なる路線の場合は概算（直通特急用）
    return 15; 
}

/**
 * ネットワーク構築：全路線の駅を繋ぎ合わせる
 */
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
                    isExpress: current.isExpress && next.isExpress,
                    isLimitedExp: false
                };

                // 双方向にエッジを張る
                stationGraph[current.name].push({ to: next.name, ...edge });
                stationGraph[next.name].push({ to: current.name, ...edge });
            }
        }
    });

    // 共通関数：特急路線のエッジ追加
    const addLimitedExpress = (stations, id, name, color, interval) => {
        for (let i = 0; i < stations.length - 1; i++) {
            const from = stations[i];
            const to = stations[i+1];
            
            // 基礎となる移動時間を計算し、特急速度（0.65倍）にする
            let standardCost = getStandardTimeCost(from, to);
            // 二俣川など路線またぎの箇所は補正（仮想的な所要時間）
            if (from === "上渋谷" && to === "二俣川") standardCost = 15; // SY線内
            if (from === "二俣川" && to === "横浜") standardCost = 22; // SH線内
            
            // 特急所要時間（最低2分は確保）
            const ltdCost = Math.max(2, Math.floor(standardCost * 0.65));

            if(stationGraph[from] && stationGraph[to]) {
                const edge = {
                    lineId: id,
                    lineName: name,
                    lineColor: color,
                    lineInterval: interval,
                    cost: ltdCost,
                    isExpress: true,
                    isLimitedExp: true
                };
                stationGraph[from].push({ to: to, ...edge });
                stationGraph[to].push({ to: from, ...edge });
            }
        }
    };

    // 特急路線の登録
    addLimitedExpress(shiokazeStations, "LTD_SHIOKAZE", "特急 潮風ライナー", "#e74c3c", 30);
    addLimitedExpress(tsuzukiStations, "LTD_TSUZUKI", "特急 都筑", "#C5A059", 20); // 都筑は20分間隔で頻発
}

/**
 * 経路探索：ダイクストラ法をベースとした最短時間探索
 */
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
                // 特急設定がOFFの場合は特急専用線を通らない
                if (neighbor.isLimitedExp && !useLimitedExp) return;

                if (!visited.has(neighbor.to)) {
                    let transferCost = 0;
                    if (current.path.length > 0) {
                        const lastLeg = current.path[current.path.length - 1];
                        // 路線IDが異なる場合は乗換コスト（待ち時間含む仮想コスト）を加算
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

// 駅コード取得ユーティリティ
function getStationCode(stationName, lineId = null) {
    // 特急IDは無視して元の駅コードを探す
    if (lineId && lineId.startsWith("LTD")) lineId = null; 
    
    for (const line of allLines) {
        if (lineId && line.id !== lineId) continue;
        const index = line.stations.findIndex(s => s.name === stationName);
        if (index !== -1) {
            return `${line.id}${(index + 1).toString().padStart(2, '0')}`;
        }
    }
    return "??00";
}

// 時刻計算ユーティリティ
function timeToMinsRailway(t) {
    const [h, m] = t.split(':').map(Number);
    if (h < 4) return (h + 24) * 60 + m; // 深夜24時以降
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
    return (departure > SERVICE_END) ? -1 : departure;
}

// ■■■■■ 3. 実行関数 (performSearch) ■■■■■

function performSearch() {
    // 画面表示エリアの取得
    const resDiv = document.getElementById('search-results');
    const fromVal = document.getElementById('station-from').value;
    const toVal = document.getElementById('station-to').value;
    const timeVal = document.getElementById('search-time').value;
    const useLtd = document.getElementById('check-ltd') ? document.getElementById('check-ltd').checked : false;

    // 表示リセット
    if (!resDiv) return;
    resDiv.style.display = 'block';
    resDiv.innerHTML = '<div style="padding:20px; text-align:center; color:#666;"><i class="fas fa-spinner fa-spin"></i> 経路を計算中...</div>';

    // 入力バリデーション
    if (!fromVal || !toVal) {
        resDiv.innerHTML = '<div class="error-msg">出発駅と到着駅を選択してください。</div>';
        return;
    }
    if (fromVal === toVal) {
        resDiv.innerHTML = '<div class="error-msg">出発駅と到着駅が同じです。</div>';
        return;
    }

    // グラフ構築の確認
    if (Object.keys(stationGraph).length === 0) buildGraph();

    // 経路探索実行
    const rawPath = findPath(fromVal, toVal, useLtd);
    
    // 経路が見つからない場合のフィードバック
    if (!rawPath) {
        resDiv.innerHTML = `
            <div class="error-msg">
                <h4 style="margin-top:0;">経路が見つかりませんでした</h4>
                <p style="font-size:14px;">以下の理由が考えられます：</p>
                <ul style="font-size:13px; text-align:left;">
                    <li>指定の時間帯に運行している便がありません。</li>
                    <li>選択した駅が路線のネットワーク内で繋がっていません。</li>
                    <li>特急オプションが必要な区間かもしれません。</li>
                </ul>
            </div>`;
        return;
    }

    // --- セグメント化（同じ路線の走行をまとめる） ---
    const segments = [];
    let currentSeg = null;

    rawPath.forEach(step => {
        if (!currentSeg || currentSeg.lineId !== step.lineId) {
            if (currentSeg) segments.push(currentSeg);
            currentSeg = {
                lineId: step.lineId, lineName: step.lineName, lineColor: step.lineColor,
                interval: step.lineInterval, from: step.from, to: step.to,
                rawDuration: 0, allExpress: true, isLimitedExp: step.isLimitedExp,
                stops: [step.from]
            };
        }
        currentSeg.to = step.to;
        currentSeg.stops.push(step.to);
        currentSeg.rawDuration += step.cost;
        if (!step.isExpress) currentSeg.allExpress = false;
    });
    if (currentSeg) segments.push(currentSeg);

    // 時刻・料金計算
    let inputMins = timeToMinsRailway(timeVal);
    let isNextDayStart = false;
    if (inputMins > SERVICE_END) {
        inputMins = SERVICE_START;
        isNextDayStart = true;
    }

    let currentMins = inputMins;
    let totalFare = 0;
    let totalLtdFee = 0;
    let timelineHTML = '';
    let isRoutePossible = true;
    
    if (isNextDayStart) {
        timelineHTML += `<div style="background:#e74c3c; color:#fff; padding:10px; border-radius:4px; margin-bottom:15px; font-size:13px; text-align:center;">本日の運行は終了しました。翌日の始発をご案内します。</div>`;
    }

    let isFirstStation = true;

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        let searchTimeBase = (isFirstStation) ? currentMins : currentMins + 3; // 乗換時間は最低3分
        let departureMins = getNextDepartureTime(searchTimeBase, seg.interval);

        if (departureMins === -1) {
            timelineHTML += `<div style="background:#c0392b; color:white; padding:10px; margin:10px 0; border-radius:4px;">⛔ 本日の運行は終了しました（接続不能）</div>`;
            isRoutePossible = false;
            break;
        }

        if (!isFirstStation) {
            timelineHTML += `
            <div class="timeline-point transfer">
                <span class="time">${minsToTimeRailway(currentMins)}着</span>
                <span class="station" style="margin-left:10px;">${seg.from} <small style="color:#7f8c8d;">[乗換]</small></span>
            </div>
            <div style="font-size:12px; color:#e67e22; margin-left:55px; padding:5px 0;">
                （待ち合わせ ${departureMins - currentMins}分）
            </div>`;
        } else {
            const code = getStationCode(seg.from, seg.lineId.startsWith("LTD") ? null : seg.lineId);
            timelineHTML += `
            <div class="timeline-point departure">
                <span class="time" style="font-size:1.1em;">${minsToTimeRailway(departureMins)}発</span>
                <span class="station" style="margin-left:10px;"><strong>[${code}] ${seg.from}</strong></span>
            </div>`;
            isFirstStation = false;
        }

        let type = "各駅停車";
        let speedFactor = 1.0;
        let passingWaitTime = 0;
        let waitingHubs = [];
        let specialIcon = "";
        
        if (seg.isLimitedExp) {
            type = seg.lineName; // "特急 潮風ライナー" or "特急 都筑"
            specialIcon = '<i class="fas fa-star" style="color:#f1c40f; margin-right:5px;"></i> ';
            totalLtdFee += 500; 
        } else if (seg.allExpress) {
            type = "急行"; 
            speedFactor = 0.75; // 急行は走行時間が25%短縮
        } else {
            // 各停の場合、ハブ駅での待避時間をシミュレート
            seg.stops.forEach(st => {
                if (PASSING_HUBS.includes(st) && st !== seg.from && st !== seg.to) {
                    passingWaitTime += 4;
                    waitingHubs.push(st);
                }
            });
        }
        
        // 特急の場合はすでにコストが最適化されているのでspeedFactorは1.0
        const runDuration = (seg.isLimitedExp) ? seg.rawDuration : Math.ceil(seg.rawDuration * speedFactor);
        const totalSegDuration = runDuration + passingWaitTime;
        const arrivalMins = departureMins + totalSegDuration;

        // 運賃計算（SER独自基準：初乗り150円 + 走行距離加算）
        const fare = 150 + (Math.floor(runDuration / 3) * 20); 
        totalFare += (i === 0) ? fare : (fare - 50); // 乗継割引

        let waitNote = waitingHubs.length > 0 ? `<div style="margin-top:4px; font-size:11px; color:#d35400;">※ ${waitingHubs.join("、")} で上位列車の通過待ちを行います</div>` : '';

        timelineHTML += `
            <div class="train-info" style="border-left: 5px solid ${seg.lineColor};">
                <div style="font-weight:bold; color:${seg.lineColor}; font-size:1.05em;">${specialIcon}${type}</div>
                <div style="font-size:13px; color:#555;">${seg.to} 行 <span style="margin-left:10px;">(${totalSegDuration}分)</span></div>
                ${waitNote}
            </div>`;

        currentMins = arrivalMins;
    }

    // 最終到着駅の出力
    if (isRoutePossible) {
        const lastCode = getStationCode(toVal);
        timelineHTML += `
            <div class="timeline-point arrival">
                <span class="time" style="font-size:1.1em;">${minsToTimeRailway(currentMins)}着</span>
                <span class="station" style="margin-left:10px;"><strong>[${lastCode}] ${toVal}</strong></span>
            </div>`;
            
        const totalDuration = currentMins - inputMins;

        // 結果カードの書き出し
        resDiv.innerHTML = `
            <div class="result-card">
                <div class="result-header">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px;">
                        <span style="font-size:1.2em; font-weight:bold;">${fromVal} → ${toVal}</span>
                        <div style="text-align:right;">
                            <span style="font-size:0.8em; font-weight:bold; color:#f1c40f;">　${(totalFare + totalLtdFee).toLocaleString()}円</span>
                            
                        </div>
                    </div>
                    <div style="margin-top:8px; font-size:0.9em;"><i class="far fa-clock"></i> 所要時間: ${totalDuration}分</div>
                </div>
                <div class="result-body">
                    <div class="timeline">${timelineHTML}</div>
                </div>
            </div>`;
    }
}

// ■■■■■ 4. 初期化処理 ■■■■■

document.addEventListener('DOMContentLoaded', () => {
    // 運行データの初期構築
    buildGraph();

    // セレクトボックスの動的生成
    const fromSelect = document.getElementById('station-from');
    const toSelect = document.getElementById('station-to');

    // 検索ボタンへのイベントリスナー追加
    const btnSearch = document.getElementById('btn-search');
    if (btnSearch) {
        btnSearch.addEventListener('click', performSearch);
    }

    if (fromSelect && toSelect) {
        allLines.forEach(line => {
            let grpFrom = document.createElement('optgroup');
            let grpTo = document.createElement('optgroup');
            grpFrom.label = grpTo.label = line.name;

            line.stations.forEach(s => {
                const code = getStationCode(s.name, line.id);
                
                let opFrom = document.createElement('option');
                opFrom.value = s.name;
                opFrom.text = `[${code}] ${s.name}`;
                grpFrom.appendChild(opFrom);

                let opTo = document.createElement('option');
                opTo.value = s.name;
                opTo.text = `[${code}] ${s.name}`;
                grpTo.appendChild(opTo);
            });
            fromSelect.appendChild(grpFrom);
            toSelect.appendChild(grpTo);
        });
    }

    // デフォルト時刻設定
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    document.getElementById('search-time').value = timeStr;
});