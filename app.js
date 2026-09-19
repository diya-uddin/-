// ==========================================
// 1. การตั้งค่าระบบ (System Configuration)
// ==========================================
// ⚠️ คุณต้องนำ URL ของ Google Apps Script (Web App) มาใส่ที่นี่
const API_URL = "https://script.google.com/macros/s/AKfycbw6DZi149qDMApfkg0bB46wHV_wU_QAb9JIpk2fjSBktkLJF7dHP3ia3On5UR18Uko/exec"; 

let currentUser = null;
let currentMatchId = null;

// ==========================================
// 2. ระบบแจ้งเตือน (OneSignal Push Notification)
// ==========================================
window.OneSignal = window.OneSignal || [];
OneSignal.push(function() {
    OneSignal.init({
        appId: "fdd3c4f0-58c4-41e6-90b0-40bc81b36097", // จะมาใส่ทีหลังตอนทำระบบแจ้งเตือนได้ครับ
        safari_web_id: "",
        notifyButton: {
            enable: true,
        },
    });
});

// ==========================================
// 3. ระบบควบคุมหน้าจอ UI (UI Controls)
// ==========================================
function toggleSection(sectionId) {
    // รายชื่อหน้าทั้งหมดที่มีในระบบ
    const sections = [
        'login-section', 'register-section', 'profile-section', 
        'match-setup-section', 'lobby-section', 'referee-section', 
        'leaderboard-section', 'stats-section'
    ];
    
    // ซ่อนทุกหน้าก่อน
    sections.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });
    
    // เปิดเฉพาะหน้าที่ต้องการ
    const targetEl = document.getElementById(sectionId);
    if(targetEl) targetEl.style.display = 'flex';
}

function showLoading(text = "กำลังประมวลผล...") {
    document.getElementById('loading-text').innerText = text;
    document.getElementById('loading-section').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-section').style.display = 'none';
}

// ฟังก์ชันหลักสำหรับคุยกับ Google Apps Script
async function callAPI(action, payload) {
    showLoading();
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: action, payload: payload })
        });
        const result = await response.json();
        hideLoading();
        return result;
    } catch (error) {
        hideLoading();
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        console.error(error);
        return { status: "error", message: "Connection failed" };
    }
}

// ==========================================
// 4. ระบบบัญชีผู้ใช้ (Authentication)
// ==========================================
async function login() {
    const name = document.getElementById('login-name').value;
    const pass = document.getElementById('login-pass').value;

    if (!name || !pass) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");

    const result = await callAPI("login", { name: name, password: pass });

    if (result.status === "success") {
        currentUser = result.user;
        localStorage.setItem("user", JSON.stringify(currentUser));
        renderProfile();
    } else {
        alert(result.message); 
    }
}

async function register() {
    const name = document.getElementById('reg-name').value;
    const pass = document.getElementById('reg-pass').value;
    const jersey = document.getElementById('reg-jersey').value;
    const position = document.getElementById('reg-position').value;
    const pic = document.getElementById('reg-pic').value;

    if (!name || !pass || !jersey || !position) return alert("กรุณากรอกข้อมูลสำคัญให้ครบถ้วน");

    const result = await callAPI("register", {
        name: name, password: pass, jerseyNo: jersey, position: position, profilePic: pic
    });

    alert(result.message);
    if (result.status === "success") toggleSection('login-section');
}

function logout() {
    localStorage.removeItem("user");
    currentUser = null;
    document.getElementById('login-name').value = "";
    document.getElementById('login-pass').value = "";
    toggleSection('login-section');
}

function renderProfile() {
    if(!currentUser) return toggleSection('login-section');
    
    document.getElementById('user-name').innerText = currentUser.name;
    document.getElementById('user-details').innerText = `${currentUser.position} | เบอร์ ${currentUser.jerseyNo}`;
    document.getElementById('user-role-badge').innerText = currentUser.role || 'Player';
    document.getElementById('user-avatar').src = currentUser.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    
    toggleSection('profile-section');
}

// ==========================================
// 5. ระบบจับคู่แข่ง (Matchmaking & Lobby)
// ==========================================
async function createMatch(type) {
    if(!currentUser) return;
    const result = await callAPI("createMatch", { type: type, creatorId: currentUser.name });
    if(result.status === "success") {
        currentMatchId = result.matchId;
        document.getElementById('lobby-title').innerText = `ห้องแข่ง ${type}`;
        toggleSection('lobby-section');
    } else {
        alert("สร้างห้องไม่สำเร็จ: " + result.message);
    }
}

async function loadActiveMatches() {
    // ในอนาคตจะใช้ API ดึงห้องที่เปิดอยู่มาแสดง
    alert("ระบบกำลังพัฒนาดึงรายชื่อห้อง... ตอนนี้จำลองการเข้าห้อง LOBBY ไปก่อนนะครับ");
    toggleSection('lobby-section');
}

// ==========================================
// 6. ระบบกรรมการ (Referee Quick-Tap)
// ==========================================
function joinAsReferee() {
    if(currentUser.role !== 'Admin') {
        alert("เฉพาะหัวหน้าทีม (Admin) เท่านั้นที่สามารถเป็นกรรมการได้!");
        return;
    }
    // จำลองรายชื่อผู้เล่นลงใน Select Box ของกรรมการ
    const playerSelect = document.getElementById('ref-player-select');
    playerSelect.innerHTML = '<option value="">เลือกผู้เล่นเพื่อบันทึก...</option>';
    playerSelect.innerHTML += `<option value="${currentUser.name}">${currentUser.name} (คุณ)</option>`;
    playerSelect.innerHTML += `<option value="ผู้เล่นสมมติ 1">ผู้เล่นสมมติ 1</option>`;
    
    toggleSection('referee-section');
}

async function addStat(statType) {
    const playerName = document.getElementById('ref-player-select').value;
    if(!playerName) return alert("กรุณาเลือกผู้เล่นก่อนกดบันทึกสถิติ");
    
    // ตรงนี้จะเป็นจุดที่ส่งข้อมูลไปบันทึกลง Google Sheets แบบ Real-time
    // ตอนนี้จำลองการแจ้งเตือนสถิติ
    console.log(`ส่งข้อมูลสถิติ: ${playerName} ทำ ${statType}`);
    
    // สร้าง Effect เล็กน้อยเมื่อกดปุ่ม (UX)
    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = "✅ บันทึกแล้ว!";
    btn.style.background = "#22c55e";
    setTimeout(() => {
        btn.innerText = originalText;
        btn.style.background = "rgba(249, 115, 22, 0.15)";
    }, 800);
}

function finishMatch() {
    if(confirm("ยืนยันการจบการแข่งขันและสรุปสถิติ?")) {
        alert("บันทึกสถิติลงระบบเรียบร้อยแล้ว!");
        toggleSection('profile-section');
    }
}

// ==========================================
// 7. ระบบสถิติ และ AI Coach
// ==========================================
async function loadLeaderboard() {
    toggleSection('leaderboard-section');
    const content = document.getElementById('leaderboard-content');
    content.innerHTML = '<div class="spinner"></div><p style="text-align:center;">กำลังดึงข้อมูล...</p>';
    
    // จำลองการโหลดข้อมูลจาก API
    setTimeout(() => {
        content.innerHTML = `
            <div class="list-item"><span>1. ${currentUser.name}</span> <span style="color:#f97316; font-weight:bold;">120 pts</span></div>
            <div class="list-item"><span>2. ผู้เล่นสมมติ A</span> <span style="color:#f97316; font-weight:bold;">95 pts</span></div>
            <div class="list-item"><span>3. ผู้เล่นสมมติ B</span> <span style="color:#f97316; font-weight:bold;">80 pts</span></div>
        `;
    }, 1000);
}

async function loadPersonalStats() {
    toggleSection('stats-section');
    const content = document.getElementById('personal-stats-content');
    document.getElementById('ai-coach-response').style.display = 'none';
    
    // จำลองสถิติ
    content.innerHTML = `
        <div class="list-item"><span>คะแนนรวม (Points)</span> <span style="color:#f97316; font-weight:bold;">45</span></div>
        <div class="list-item"><span>รีบาวด์ (Rebounds)</span> <span style="color:#f97316; font-weight:bold;">12</span></div>
        <div class="list-item"><span>ส่งบอล (Assists)</span> <span style="color:#f97316; font-weight:bold;">8</span></div>
        <div class="list-item"><span>เปอร์เซ็นต์ชู้ต (FG%)</span> <span style="color:#f97316; font-weight:bold;">42%</span></div>
    `;
}

async function callAICoach() {
    const aiBox = document.getElementById('ai-coach-response');
    aiBox.style.display = 'block';
    aiBox.innerHTML = '<div class="spinner" style="width:20px; height:20px;"></div><p style="text-align:center; font-size:14px;">AI กำลังวิเคราะห์ฟอร์มของคุณ...</p>';
    
    // ตรงนี้ในอนาคตจะยิง API ไปหา Google Apps Script เพื่อให้ดึง Gemini มาวิเคราะห์สถิติ
    setTimeout(() => {
        aiBox.innerHTML = `
            <strong style="color: #8b5cf6;">🤖 AI Coach แนะนำ:</strong><br><br>
            จากสถิติของคุณในสัปดาห์นี้ คุณทำได้ดีมากในการหาพื้นที่ทำคะแนน (45 แต้ม) แต่ค่า FG% ยังอยู่ที่ 42% <br><br>
            <strong>จุดที่ควรพัฒนา:</strong> ลองฝึกจังหวะการชู้ตแบบ Catch & Shoot เพิ่มเติมเพื่อเพิ่มความแม่นยำ และอย่าลืมช่วยเพื่อนป้องกันเพื่อเพิ่มค่า Steal/Block ครับ!
        `;
    }, 2500);
}

// ==========================================
// 8. ตรวจสอบการล็อกอินเมื่อเปิดแอป
// ==========================================
window.onload = function() {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        renderProfile();
    } else {
        toggleSection('login-section');
    }
}
