let walkSprite; // 儲存角色的走路精靈圖
let flipSprite; // 儲存角色的空中轉一圈精靈圖
let punchSprite; // 儲存角色的揮拳精靈圖
let idleSprite; // 儲存角色的待機精靈圖
let bgSprite; // 儲存無限捲動用的背景圖片（1/背景.jpg，612 x 367）
let characterX; // 儲存角色目前的水平位置
let characterY; // 儲存角色目前的垂直位置（精靈圖中心點座標）
let bgScrollX = 0; // 儲存背景目前的水平捲動位移量
let facingDirection = 1; // 設定角色朝向，1 為右方，-1 為左方
let isDoingFlip = false; // 記錄角色是否正在播放空翻動作
let isFlipKeyHeld = false; // 記錄上方向鍵是否仍被按住
let flipStartTime = 0; // 記錄空翻動畫開始播放的時間
let isDoingPunch = false; // 記錄角色是否正在播放揮拳動作
let isPunchKeyHeld = false; // 記錄空白鍵是否仍被按住
let punchStartTime = 0; // 記錄揮拳動畫開始播放的時間
const walkFrameCount = 6; // 設定走路精靈圖中的動畫格數
const flipFrameCount = 10; // 設定空翻精靈圖中的動畫格數
const punchFrameCount = 10; // 設定揮拳精靈圖中的動畫格數
const flipFrameDuration = 100; // 設定空翻動畫每一格播放的毫秒數
const punchFrameDuration = 100; // 設定揮拳動畫每一格播放的毫秒數
const characterScale = 2.4; // 放大角色顯示倍率
const grassRatio = 0.795; // 設定草地表面在畫布高度中的垂直比例（約 79.5% 處，可微調）
const idleBottomOffset = 22; // 修正待機圖片底部透明留白的垂直偏移量（正數往下貼近草地、負數往上）
const movementSpeed = 5; // 設定背景捲動的速度

function handleImageError(path) { // 定義圖片載入失敗時的錯誤提示函式
  console.error("圖片載入失敗，請檢查路徑或是否透過本機伺服器開啟：", path); // 在主控台印出失敗的檔案路徑
} // 結束錯誤提示函式

function getGroundY() { // 計算目前畫布中草地表面的垂直座標
  return height * grassRatio; // 依草地比例換算實際所在的 Y 座標
} // 結束草地座標計算函式

function preload() { // 在畫布建立前載入角色與背景圖片
  walkSprite = loadImage("1/走路/all.png", () => {}, () => handleImageError("1/走路/all.png")); // 載入走路精靈圖並監聽載入錯誤
  flipSprite = loadImage("1/空中轉一圈/all.png", () => {}, () => handleImageError("1/空中轉一圈/all.png")); // 載入空翻精靈圖並監聽載入錯誤
  punchSprite = loadImage("1/揮拳/all.png", () => {}, () => handleImageError("1/揮拳/all.png")); // 載入揮拳精靈圖並監聽載入錯誤
  idleSprite = loadImage("1/待機/MC_MarisaKirisame.png", () => {}, () => handleImageError("1/待機/MC_MarisaKirisame.png")); // 載入待機圖片並監聽載入錯誤
  bgSprite = loadImage("1/背景.jpg", (img) => { // 載入 1/背景.jpg 並在成功時於主控台確認尺寸
    console.log("背景圖片載入成功，尺寸：", img.width, "x", img.height); // 輸出背景圖實際寬高以便除錯
  }, () => handleImageError("1/背景.jpg")); // 若背景圖載入失敗則印出錯誤訊息
} // 結束素材載入函式

function setup() { // 設定全螢幕畫布與角色初始位置
  createCanvas(windowWidth, windowHeight); // 建立符合瀏覽器視窗大小的畫布
  imageMode(CENTER); // 讓角色精靈圖以指定位置作為繪製中心
  characterX = width / 2; // 將角色固定在畫面水平中央原地走
  let idleHeight = (idleSprite && idleSprite.height > 0) ? idleSprite.height : 64; // 取得待機圖高度，若尚未取得則使用預設值防呆
  characterY = getGroundY() - (idleHeight * characterScale) / 2 + idleBottomOffset; // 將待機角色底部往下修正並對齊草地表面
} // 結束畫布初始化函式

function draw() { // 每一影格更新背景捲動與角色狀態
  background("#FEFAE0"); // 作為背景圖片載入前或透明處的備用底色
  let isMoving = false; // 記錄角色本影格是否正在走路移動
  if (keyIsDown(LEFT_ARROW)) { // 檢查左方向鍵是否正被按住
    facingDirection = -1; // 將角色朝向設定為左方
    bgScrollX += movementSpeed; // 角色面朝左走時，背景向右捲動營造前進感
    isMoving = true; // 標記角色正在走路
  } // 結束左方向鍵的處理
  if (keyIsDown(RIGHT_ARROW)) { // 檢查右方向鍵是否正被按住
    facingDirection = 1; // 將角色朝向設定為右方
    bgScrollX -= movementSpeed; // 角色面朝右走時，背景向左捲動營造前進感
    isMoving = true; // 標記角色正在走路
  } // 結束右方向鍵的處理
  if (bgSprite && bgSprite.width > 0 && bgSprite.height > 0) { // 確認背景圖片已載入完成且寬高大於 0
    let bgScale = height / bgSprite.height; // 依背景高度（367）等比例計算填滿畫布高度的倍率
    let bgDrawWidth = bgSprite.width * bgScale; // 依背景寬度（612）計算等比例縮放後的顯示寬度
    let wrappedOffset = ((bgScrollX % bgDrawWidth) + bgDrawWidth) % bgDrawWidth; // 將捲動位移正規化至 0 到 bgDrawWidth 之間
    let startX = wrappedOffset - bgDrawWidth; // 從左側超出畫面一倍背景寬度處開始起算
    push(); // 暫存目前繪圖設定
    imageMode(CORNER); // 切換為左上角對齊模式以便無縫拼接背景
    for (let x = startX; x < width + bgDrawWidth; x += bgDrawWidth) { // 橫向重複繪製背景直到覆蓋整個畫面寬度
      image(bgSprite, x, 0, bgDrawWidth, height); // 繪製單塊背景並填滿畫布高度
    } // 結束無限捲動背景繪製迴圈
    pop(); // 還原繪圖設定
  } // 結束背景繪製區塊
  let flipElapsed = millis() - flipStartTime; // 計算空翻動畫已播放的時間
  if (isDoingFlip && flipElapsed >= flipFrameCount * flipFrameDuration) { // 檢查空翻動畫是否已播放完畢
    isDoingFlip = false; // 結束空翻並返回一般角色動畫
  } // 結束空翻動畫播放完畢的處理
  let punchElapsed = millis() - punchStartTime; // 計算揮拳動畫已播放的時間
  if (isDoingPunch && punchElapsed >= punchFrameCount * punchFrameDuration) { // 檢查揮拳動畫是否已播放完畢
    isDoingPunch = false; // 結束揮拳並返回一般角色動畫
  } // 結束揮拳動畫播放完畢的處理
  let activeSprite = isDoingPunch ? punchSprite : isDoingFlip ? flipSprite : isMoving ? walkSprite : idleSprite; // 依目前動作選擇要繪製的精靈圖
  if (activeSprite && activeSprite.width > 0 && activeSprite.height > 0) { // 確認目前角色的精靈圖已成功載入
    let frameCount = activeSprite === punchSprite ? punchFrameCount : activeSprite === flipSprite ? flipFrameCount : activeSprite === walkSprite ? walkFrameCount : 1; // 依目前精靈圖決定總格數
    let activeFrameWidth = activeSprite.width / frameCount; // 計算目前精靈圖單格的來源寬度
    let activeFrameIndex = isDoingPunch ? floor(punchElapsed / punchFrameDuration) : isDoingFlip ? floor(flipElapsed / flipFrameDuration) : isMoving ? floor(millis() / 100) % walkFrameCount : 0; // 依動作狀態計算目前動畫格
    let characterWidth = activeFrameWidth * characterScale; // 計算角色顯示時的寬度
    let characterHeight = activeSprite.height * characterScale; // 計算角色顯示時的高度
    let activeBottomOffset = activeSprite === idleSprite ? idleBottomOffset : 0; // 待機動作套用 idleBottomOffset，其他動作維持 0
    characterX = width / 2; // 讓角色維持在畫面水平中央原地走
    characterY = getGroundY() - characterHeight / 2 + activeBottomOffset; // 讓角色底部精準落在草地表面上
    push(); // 暫存畫布的座標與縮放狀態
    translate(characterX, characterY); // 將繪圖原點移至角色目前位置
    scale(facingDirection, 1); // 依角色方向決定是否水平翻轉精靈圖
    image(activeSprite, 0, 0, characterWidth, characterHeight, activeFrameIndex * activeFrameWidth, 0, activeFrameWidth, activeSprite.height); // 繪製目前動畫格
    pop(); // 還原畫布的座標與縮放狀態
  } // 結束角色繪製區塊
} // 結束畫面更新函式

function keyPressed() { // 處理鍵盤按下事件
  if (keyCode === UP_ARROW && !isFlipKeyHeld) { // 確認上方向鍵剛被按下而非持續按住
    isFlipKeyHeld = true; // 標記上方向鍵目前處於按住狀態
    isDoingFlip = true; // 啟動角色空翻動畫
    flipStartTime = millis(); // 記錄空翻動畫的起始時間
    return false; // 阻止瀏覽器執行上方向鍵的預設捲動行為
  } // 結束上方向鍵觸發處理
  if (keyCode === 32 && !isPunchKeyHeld) { // 確認空白鍵剛被按下而非持續按住
    isPunchKeyHeld = true; // 標記空白鍵目前處於按住狀態
    isDoingPunch = true; // 啟動角色揮拳動畫
    punchStartTime = millis(); // 記錄揮拳動畫的起始時間
    return false; // 阻止空白鍵執行瀏覽器預設的頁面捲動
  } // 結束空白鍵觸發處理
} // 結束鍵盤按下事件函式

function keyReleased() { // 處理鍵盤放開事件
  if (keyCode === UP_ARROW) { // 確認放開的是上方向鍵
    isFlipKeyHeld = false; // 允許下一次按鍵重新觸發空翻
  } // 結束上方向鍵放開處理
  if (keyCode === 32) { // 確認放開的是空白鍵
    isPunchKeyHeld = false; // 允許下一次按鍵重新觸發揮拳
  } // 結束空白鍵放開處理
} // 結束鍵盤放開事件函式

function windowResized() { // 當瀏覽器視窗尺寸改變時重新調整畫布
  resizeCanvas(windowWidth, windowHeight); // 將畫布調整為最新的視窗大小
  characterX = width / 2; // 重新將角色水平置中
  let idleHeight = (idleSprite && idleSprite.height > 0) ? idleSprite.height : 64; // 取得待機圖高度作為視窗縮放後的底部基準
  characterY = getGroundY() - (idleHeight * characterScale) / 2 + idleBottomOffset; // 視窗縮放後重新將待機角色底部對齊草地表面
} // 結束視窗尺寸調整函式