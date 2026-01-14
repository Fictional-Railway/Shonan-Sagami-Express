/* ============================================================
   湘南相模急行電鉄 (SER) 統合運行管理システム Ver 3.0
   Supported Lines: 神奈川線, 西三浦線, 衣笠線, 南大和線, 宮ヶ瀬線
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------------------------
    // 1. UI制御：スマホメニュー開閉
    // ---------------------------------------------------
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('main-nav');
    if (toggle && nav) {
        toggle.addEventListener('click', () => nav.classList.toggle('active'));
    }

    // ---------------------------------------------------
    // 2. UI制御：運行情報の時刻自動更新
    // ---------------------------------------------------
    const updateTickerTime = () => {
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}更新`;
        const el = document.getElementById('update-time');
        if (el) el.textContent = timeStr;
    };
    updateTickerTime();
    setInterval(updateTickerTime, 60000); // 1分ごとに更新

    // ---------------------------------------------------
    // 3. 検索システム初期化
    // ---------------------------------------------------
    initSearchSystem();
});


/* ============================================================
   路線・駅データ定義 (全5路線網羅)
   isExpress: 特急・準特急停車駅フラグ
   ============================================================ */

// 1. 神奈川線 (Kanagawa Line) [SK] - 基幹路線
// 接続: 本厚木(宮ヶ瀬線), 綾瀬中央(南大和線), 鎌倉(西三浦線)
const lineKanagawa = {
    id: "SK", name: "神奈川線", color: "#3498db",
    stations: [
        { name: "本厚木", time: 0, isExpress: true }, // 宮ヶ瀬線接続
        { name: "厚木", time: 3, isExpress: false },
        { name: "海老名", time: 6, isExpress: true },
        { name: "東海老名", time: 9, isExpress: false },
        { name: "相模早川", time: 12, isExpress: false },
        { name: "寺尾台", time: 15, isExpress: false },
        { name: "綾瀬中央", time: 18, isExpress: true }, // 南大和線接続
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
        { name: "鎌倉", time: 64, isExpress: true } // 西三浦線接続
    ]
};

// 2. 西三浦線 (Nishi-Miura Line) [SM] - 海岸線
// 接続: 鎌倉(神奈川線), 武山(衣笠線)
const lineMiura = {
    id: "SM", name: "西三浦線", color: "#f1c40f",
    stations: [
        { name: "鎌倉", time: 0, isExpress: true }, // 神奈川線接続
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
        { name: "武山", time: 55, isExpress: false }, // 衣笠線接続
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

// 3. 衣笠線 (Kinugasa Line) [KI] - 紫色
// 接続: 武山(西三浦線)
const lineKinugasa = {
    id: "KI", name: "衣笠線", color: "#9b59b6",
    stations: [
        { name: "武山", time: 0, isExpress: true }, // 西三浦線接続
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

// 4. 南大和線 (Minami-Yamato Line) [SY] - オレンジ
// 接続: 綾瀬中央(神奈川線)
const lineYamato = {
    id: "SY", name: "南大和線", color: "#e67e22",
    stations: [
        { name: "二俣川", time: 0, isExpress: true },
        { name: "桃源台", time: 3, isExpress: false },
        { name: "神明台", time: 6, isExpress: false },
        { name: "阿久和", time: 9, isExpress: false },
        { name: "和泉", time: 12, isExpress: false },
        { name: "上渋谷", time: 15, isExpress: true }, // 画像ではKami-Kouza
        { name: "相模高座渋谷", time: 18, isExpress: false },
        { name: "上土棚", time: 21, isExpress: false },
        { name: "南綾瀬", time: 24, isExpress: false }, // 注:神奈川線の南綾瀬とは別駅扱い(接続なし)とするか、同名駅とするか。今回は別路線接続駅が綾瀬中央なので、ここは通過扱いの別駅とします
        { name: "綾瀬中央", time: 27, isExpress: true } // 神奈川線接続
    ]
};

// 5. 宮ヶ瀬線 (Miyagase Line) [SG] - 緑
// 接続: 本厚木(神奈川線)
const lineMiyagase = {
    id: "SG", name: "宮ヶ瀬線", color: "#27ae60",
    stations: [
        { name: "本厚木", time: 0, isExpress: true }, // 神奈川線接続
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

// 全路線配列
const allLines = [lineKanagawa, lineMiura, lineKinugasa, lineYamato, lineMiyagase];

/* ============================================================
   グラフ理論による経路探索ロジック
   (どんなに複雑な乗換も自動計算します)
   ============================================================ */

// グラフデータ構築
let stationGraph = {};

function buildGraph() {
    stationGraph = {};
    
    allLines.forEach(line => {
        for (let i = 0; i < line.stations.length; i++) {
            const current = line.stations[i];
            const next = line.stations[i+1];
            
            // ノード作成
            if (!stationGraph[current.name]) stationGraph[current.name] = [];
            
            if (next) {
                if (!stationGraph[next.name]) stationGraph[next.name] = [];
                
                // 隣接リストに追加 (双方向)
                const cost = Math.abs(next.time - current.time);
                
                // 順方向
                stationGraph[current.name].push({
                    to: next.name,
                    lineId: line.id,
                    lineName: line.name,
                    lineColor: line.color,
                    cost: cost,
                    isExpress: current.isExpress && next.isExpress // 区間が特急対応か
                });
                
                // 逆方向
                stationGraph[next.name].push({
                    to: current.name,
                    lineId: line.id,
                    lineName: line.name,
                    lineColor: line.color,
                    cost: cost,
                    isExpress: current.isExpress && next.isExpress
                });
            }
        }
    });
}

// 探索アルゴリズム (幅優先探索の変形)
function findPath(startName, endName) {
    if(!stationGraph[startName]) return null;

    let queue = [{ name: startName, path: [], totalCost: 0 }];
    let visited = new Set();
    
    // 簡易的な探索 (最短経路を発見)
    while (queue.length > 0) {
        // コスト順にソート (ダイクストラ法っぽく)
        queue.sort((a, b) => a.totalCost - b.totalCost);
        let current = queue.shift();

        if (current.name === endName) {
            return current.path;
        }

        if (visited.has(current.name)) continue;
        visited.add(current.name);

        const neighbors = stationGraph[current.name];
        if (neighbors) {
            neighbors.forEach(neighbor => {
                if (!visited.has(neighbor.to)) {
                    // 乗換コスト計算 (前の路線と違う場合 +7分)
                    let transferCost = 0;
                    if (current.path.length > 0) {
                        const lastLeg = current.path[current.path.length - 1];
                        if (lastLeg.lineId !== neighbor.lineId) {
                            transferCost = 7; // 標準乗換時間
                        }
                    }

                    let newPath = [...current.path, {
                        from: current.name,
                        to: neighbor.to,
                        lineId: neighbor.lineId,
                        lineName: neighbor.lineName,
                        lineColor: neighbor.lineColor,
                        baseCost: neighbor.cost,
                        isExpressSection: neighbor.isExpress
                    }];

                    queue.push({
                        name: neighbor.to,
                        path: newPath,
                        totalCost: current.totalCost + neighbor.cost + transferCost
                    });
                }
            });
        }
    }
    return null; // 経路なし
}


/* ============================================================
   UI操作・表示ロジック
   ============================================================ */

function initSearchSystem() {
    buildGraph(); // グラフ構築
    
    const fromSelect = document.getElementById('station-from');
    const toSelect = document.getElementById('station-to');
    if (!fromSelect || !toSelect) return;

    // セレクトボックス生成
    const addGroup = (select, line) => {
        let grp = document.createElement('optgroup');
        grp.label = line.name;
        line.stations.forEach(s => {
            // 重複駅(乗換駅)は一度だけ追加したいが、
            // ユーザーが選びやすいように各路線グループにあえて残す設計もアリ。
            // ここではシンプルにそのまま追加。
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

    if (fromVal === toVal) {
        alert("出発駅と到着駅が同じです。");
        return;
    }

    const rawPath = findPath(fromVal, toVal);
    
    if (!rawPath) {
        alert("経路が見つかりませんでした。(海を越える移動はまだできません！)");
        return;
    }

    // パスを「乗り物ごとのセグメント」にまとめる
    const segments = [];
    let currentSeg = null;

    rawPath.forEach(step => {
        if (!currentSeg || currentSeg.lineId !== step.lineId) {
            // 新しいセグメント開始
            if (currentSeg) segments.push(currentSeg);
            currentSeg = {
                lineId: step.lineId,
                lineName: step.lineName,
                lineColor: step.lineColor,
                from: step.from,
                to: step.to,
                rawDuration: 0,
                allExpress: true,
                stops: [step.from]
            };
        }
        // セグメント更新
        currentSeg.to = step.to;
        currentSeg.stops.push(step.to);
        currentSeg.rawDuration += step.baseCost;
        if (!step.isExpressSection) currentSeg.allExpress = false;
    });
    if (currentSeg) segments.push(currentSeg);

    // 詳細計算とHTML生成
    let startMins = timeToMins(timeVal);
    let currentMins = startMins + 3; // 改札入り3分後に出発
    let totalFare = 0;
    let timelineHTML = '';

    // 出発駅
    timelineHTML += `
        <div class="timeline-point departure">
            <span class="time">${minsToTime(currentMins)}</span>
            <span class="station"><strong>${fromVal}</strong> 発</span>
        </div>`;

    segments.forEach((seg, index) => {
        // 種別判定: 全区間がExpress対応なら準特急/特急、そうでなければ各停
        // ※宮ヶ瀬線などの支線は「各停」表記にするか、優等が走るならそれにする
        let type = "各駅停車";
        let speedFactor = 1.0;
        
        if (seg.allExpress) {
            type = (seg.lineId === "SK" || seg.lineId === "SM") ? "準特急" : "急行"; 
            speedFactor = 0.75; // 優等列車は速い
        }
        
        const duration = Math.ceil(seg.rawDuration * speedFactor);
        const arrivalMins = currentMins + duration;
        
        // 運賃 (基本150円 + 距離加算)
        // 路線またぐごとに初乗りがかかる簡易計算(リアル)
        const fare = 150 + (Math.floor(duration / 3) * 20); 
        totalFare += (index === 0) ? fare : (fare - 50); // 乗継割引50円

        // 移動バーの描画
        timelineHTML += `
            <div class="train-info" style="border-left: 4px solid ${seg.lineColor}; padding-left:10px; margin: 5px 0 5px 15px;">
                <div style="font-weight:bold; color:${seg.lineColor};">${seg.lineName} [${type}]</div>
                <div style="font-size:12px; color:#666;">
                    所要 ${duration}分 / ${seg.stops.length -1}駅
                </div>
            </div>`;

        // 到着駅 (最終駅以外は乗換)
        if (index < segments.length - 1) {
            // 乗換
            timelineHTML += `
            <div class="timeline-point transfer">
                <span class="time">${minsToTime(arrivalMins)}</span>
                <span class="station">${seg.to} <span class="transfer-badge">乗換</span></span>
            </div>`;
            
            // 乗換待ち時間
            const waitTime = 7; 
            currentMins = arrivalMins + waitTime;
            timelineHTML += `<div style="font-size:11px; color:#999; margin-left:20px; padding:5px;">↓ 乗換・待ち合わせ ${waitTime}分</div>`;
        } else {
            // 最終到着
            currentMins = arrivalMins;
            timelineHTML += `
            <div class="timeline-point arrival">
                <span class="time">${minsToTime(arrivalMins)}</span>
                <span class="station"><strong>${seg.to}</strong> 着</span>
            </div>`;
        }
    });

    const totalDuration = currentMins - startMins - 3;

    // 結果表示
    const resDiv = document.getElementById('search-results');
    resDiv.style.display = 'block';
    resDiv.innerHTML = `
        <div class="result-card">
            <div class="result-header" style="background:#444; color:#fff;">
                <div class="route-summary" style="font-size:1.1em;">
                    ${fromVal} <small>to</small> ${toVal}
                </div>
                <div class="route-meta" style="margin-top:5px;">
                    総所要時間: <strong>${totalDuration}分</strong> / 合計運賃: <strong>${totalFare}円</strong>
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