// URL จาก Google Apps Script ของคุณ
const API_URL = "https://script.google.com/macros/s/AKfycbw6DZi149qDMApfkg0bB46wHV_wU_QAb9JIpk2fjSBktkLJF7dHP3ia3On5UR18Uko/exec";

// ฟังก์ชันสลับหน้าต่าง UI
function toggleSection(sectionId) {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'none';
    
    if(sectionId !== 'loading-section') {
        document.getElementById('loading-section').style.display = 'none';
    }
    
    document.getElementById(sectionId).style.display = 'flex';
}

// ฟังก์ชันสำหรับเรียก API
async function callAPI(action, payload) {
    toggleSection('loading-section'); // เปิดหน้าต่างโหลด
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: action, payload: payload })
        });
        const result = await response.json();
        return result;
    } catch (error) {
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        console.error(error);
    }
}

// --- แก้ไขฟังก์ชัน login() เดิม ให้พาไปหน้า Profile เมื่อสำเร็จ ---
async function login() {
    const name = document.getElementById('login-name').value;
    const pass = document.getElementById('login-pass').value;

    if (!name || !pass) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");

    const result = await callAPI("login", { name: name, password: pass });

    if (result.status === "success") {
        // บันทึกข้อมูลลงเครื่อง
        localStorage.setItem("user", JSON.stringify(result.user));
        // แสดงหน้า Profile
        renderProfile(result.user);
    } else {
        alert(result.message); 
        toggleSection('login-section');
    }
}

// --- โค้ดที่ต้องเพิ่มใหม่ด้านล่างนี้ ---

// ฟังก์ชันจัดเตรียมข้อมูลแสดงในหน้า Profile
function renderProfile(user) {
    document.getElementById('user-name').innerText = user.name;
    document.getElementById('user-details').innerText = `${user.position} | เบอร์ ${user.jerseyNo}`;
    document.getElementById('user-role-badge').innerText = user.role;
    
    if(user.profilePic) {
        document.getElementById('user-avatar').src = user.profilePic;
    } else {
        document.getElementById('user-avatar').src = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; // รูปพื้นฐาน
    }
    
    toggleSection('profile-section');
}

// ฟังก์ชันออกจากระบบ
function logout() {
    localStorage.removeItem("user");
    document.getElementById('login-name').value = "";
    document.getElementById('login-pass').value = "";
    toggleSection('login-section');
}

// ตรวจสอบสถานะตอนเปิดแอป (ถ้าเคยล็อกอินไว้แล้ว ให้เข้าหน้า Profile เลย ไม่ต้องล็อกอินใหม่)
window.onload = function() {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
        renderProfile(JSON.parse(savedUser));
    } else {
        toggleSection('login-section');
    }
}


// ระบบสมัครสมาชิก
async function register() {
    const name = document.getElementById('reg-name').value;
    const pass = document.getElementById('reg-pass').value;
    const jersey = document.getElementById('reg-jersey').value;
    const position = document.getElementById('reg-position').value;
    const pic = document.getElementById('reg-pic').value;

    if (!name || !pass || !jersey || !position) {
        return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    }

    const payload = {
        name: name,
        password: pass,
        jerseyNo: jersey,
        position: position,
        profilePic: pic
    };

    const result = await callAPI("register", payload);

    if (result.status === "success") {
        alert(result.message); // สำเร็จ ให้ไปบอกหัวหน้าทีม
        toggleSection('login-section'); // เด้งกลับไปหน้าล็อกอิน
    } else {
        alert(result.message); // เช่น ชื่อซ้ำ
        toggleSection('register-section');
    }
}
