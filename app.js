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

// ระบบเข้าสู่ระบบ
async function login() {
    const name = document.getElementById('login-name').value;
    const pass = document.getElementById('login-pass').value;

    if (!name || !pass) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");

    const result = await callAPI("login", { name: name, password: pass });

    if (result.status === "success") {
        alert("เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับ " + result.user.name);
        // บันทึกข้อมูลผู้ใช้ลงในเครื่อง (Local Storage)
        localStorage.setItem("user", JSON.stringify(result.user));
        // สเต็ปต่อไป: โอนไปยังหน้า Profile 
        // window.location.href = "profile.html"; 
    } else if (result.status === "pending") {
        alert(result.message); // รอหัวหน้าทีมยืนยัน
        toggleSection('login-section');
    } else {
        alert(result.message); // รหัสผิด
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
