import { currentUser, currentUserData, logout } from "./auth.js";
import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, query, where, updateDoc, doc, setDoc, increment, runTransaction, arrayUnion, serverTimestamp, orderBy } from "firebase/firestore";

const btnRoomsPanel = document.getElementById('btn-rooms-panel');
const btnContactsPanel = document.getElementById('btn-contacts-panel');
const btnWalletPanel = document.getElementById('btn-wallet-panel');
const btnSettingsPanel = document.getElementById('btn-settings-panel');
const btnProfilePanel = document.getElementById('btn-profile-panel');

const panelRooms = document.getElementById('panel-rooms');
const panelContacts = document.getElementById('panel-contacts');
const panelWallet = document.getElementById('panel-wallet');
const panelSettings = document.getElementById('panel-settings');
const panelProfile = document.getElementById('panel-profile');

function closePanels() {
    panelRooms.classList.remove('active');
    panelContacts.classList.remove('active');
    panelWallet.classList.remove('active');
    panelSettings.classList.remove('active');
    panelProfile.classList.remove('active');
}

if (btnRoomsPanel) {
    btnRoomsPanel.addEventListener('click', () => {
        closePanels();
        panelRooms.classList.add('active');
        renderRoomsPanel();
    });
}

if (btnContactsPanel) {
    btnContactsPanel.addEventListener('click', () => {
        closePanels();
        panelContacts.classList.add('active');
        renderContactsPanel();
    });
}

if (btnWalletPanel) {
    btnWalletPanel.addEventListener('click', () => {
        closePanels();
        panelWallet.classList.add('active');
        renderWalletPanel();
    });
}

if (btnSettingsPanel) {
    btnSettingsPanel.addEventListener('click', () => {
        closePanels();
        panelSettings.classList.add('active');
        renderSettingsPanel();
    });
}

if (btnProfilePanel) {
    btnProfilePanel.addEventListener('click', () => {
        closePanels();
        panelProfile.classList.add('active');
        renderProfilePanel();
    });
}

function renderRoomsPanel() {
    panelRooms.innerHTML = '<div class="panel-title">🌐 الغرف المتاحة</div>';
    const q = query(collection(db, 'rooms'), where('type', '==', 'public'));
    getDocs(q).then((snap) => {
        if (snap.empty) {
            panelRooms.innerHTML += '<div style="padding:10px; text-align:center; color:#666;">لا توجد غرف</div>';
            return;
        }
        snap.forEach((d) => {
            const room = d.data();
            const item = document.createElement('div');
            item.className = 'panel-item';
            item.textContent = `📌 ${room.name}`;
            item.onclick = () => {
                window.dispatchEvent(new CustomEvent('room-joined', { detail: { roomId: d.id, roomName: room.name } }));
                document.getElementById('lobby-screen').classList.remove('active');
                document.getElementById('chat-screen').classList.add('active');
                closePanels();
            };
            panelRooms.appendChild(item);
        });
    });
}

function renderContactsPanel() {
    panelContacts.innerHTML = '<div class="panel-title">👥 جهات الاتصال</div>';
    if (currentUserData?.friends?.length > 0) {
        currentUserData.friends.forEach((f) => {
            const item = document.createElement('div');
            item.className = 'panel-item';
            item.textContent = `✦ ${f}`;
            panelContacts.appendChild(item);
        });
    } else {
        panelContacts.innerHTML += '<div style="padding:10px; text-align:center; color:#999;">لا يوجد أصدقاء</div>';
    }
}

function renderWalletPanel() {
    panelWallet.innerHTML = `<div class="panel-title">💰 المحفظة</div>
    <div style="padding:10px; background:#e8f5e9; border-radius:6px; margin-bottom:10px;">
        <strong>رصيدك: ${currentUserData?.wallet || 0} وحدة</strong>
    </div>
    <div style="margin-bottom:10px;">
        <label style="font-weight:bold; display:block; margin-bottom:6px;">نص الشريط</label>
        <input id="bar-text" class="form-control" maxlength="60" placeholder="نص الشريط...">
    </div>
    <div style="display:flex; gap:8px; margin-bottom:10px;">
        <div style="flex:1;"><label style="font-weight:bold; font-size:12px;">لون نص</label><input id="bar-color" type="color" value="#000000" style="width:100%; height:36px; border:1px solid #ccc; border-radius:4px;"></div>
        <div style="flex:1;"><label style="font-weight:bold; font-size:12px;">لون خلفية</label><input id="bar-bg" type="color" value="#ffffff" style="width:100%; height:36px; border:1px solid #ccc; border-radius:4px;"></div>
    </div>
    <button id="btn-request-bar" class="btn-primary" style="width:100%; margin-bottom:10px;">📋 طلب شراء شريط</button>
    <h4 style="color:#0f3b82; margin-bottom:8px;">أشرطتي</h4>
    <div id="my-bars"></div>`;

    const myBarsDiv = document.getElementById('my-bars');
    if (currentUserData?.bars?.length > 0) {
        currentUserData.bars.forEach((bar) => {
            const barDiv = document.createElement('div');
            barDiv.style.cssText = `padding:8px; margin-bottom:6px; background:${bar.bgColor || '#fff'}; color:${bar.color || '#000'}; border-radius:4px; border:1px solid #ddd;`;
            barDiv.textContent = bar.text;
            myBarsDiv.appendChild(barDiv);
        });
    } else {
        myBarsDiv.innerHTML = '<div style="text-align:center; color:#999; font-size:12px;">لا توجد أشرطة</div>';
    }

    const btnRequestBar = document.getElementById('btn-request-bar');
    if (btnRequestBar) {
        btnRequestBar.addEventListener('click', async () => {
            const text = document.getElementById('bar-text').value.trim();
            const color = document.getElementById('bar-color').value;
            const bg = document.getElementById('bar-bg').value;
            if (!text) return alert('اكتب نص الشريط');

            try {
                if (currentUser && currentUserData) {
                    await addDoc(collection(db, 'payment_requests'), {
                        userId: currentUser.uid,
                        username: currentUserData?.username || '',
                        type: 'bar',
                        details: { text, color, bgColor: bg },
                        status: 'pending',
                        createdAt: serverTimestamp()
                    });
                    alert('✅ تم إرسال طلب الشراء إلى المدير');
                    document.getElementById('bar-text').value = '';
                }
            } catch (e) {
                alert('❌ فشل إرسال الطلب');
            }
        });
    }
}

function renderSettingsPanel() {
    panelSettings.innerHTML = '<div class="panel-title">⚙️ الإعدادات</div>';

    if (currentUserData?.role === 'admin') {
        panelSettings.innerHTML += '<h4 style="color:#0f3b82; margin:10px 0 8px 0;">طلبات الدفع المعلقة</h4>';
        const q = query(collection(db, 'payment_requests'), where('status', '==', 'pending'));
        getDocs(q).then((snap) => {
            if (snap.empty) {
                const div = document.createElement('div');
                div.style.cssText = 'padding:10px; text-align:center; color:#999;';
                div.textContent = 'لا توجد طلبات معلقة';
                panelSettings.appendChild(div);
                return;
            }
            snap.forEach((d) => {
                const req = d.data();
                const item = document.createElement('div');
                item.style.cssText = 'padding:10px; background:#fff8e1; border-radius:6px; margin-bottom:8px;';
                item.innerHTML = `<strong>${req.username}</strong> - ${req.type}<br><small>${req.details.text || ''}</small>`;

                const approveBtn = document.createElement('button');
                approveBtn.className = 'btn-primary';
                approveBtn.textContent = '✓ موافقة';
                approveBtn.style.marginRight = '6px';
                approveBtn.style.fontSize = '12px';
                approveBtn.onclick = async () => {
                    const userRef = doc(db, 'users', req.userId);
                    try {
                        if (currentUser) {
                            await runTransaction(db, async (t) => {
                                const snap = await t.get(userRef);
                                if (!snap.exists()) throw new Error('مستخدم غير موجود');
                                const wallet = snap.data().wallet || 0;
                                if (wallet < 1) throw new Error('رصيد غير كاف');
                                t.update(userRef, { wallet: wallet - 1 });
                                t.update(userRef, { bars: arrayUnion(req.details) });
                                t.update(doc(db, 'payment_requests', d.id), { status: 'approved', processedBy: currentUser.uid, processedAt: serverTimestamp() });
                            });
                            alert('✅ تم الموافقة');
                            renderSettingsPanel();
                        }
                    } catch (err) {
                        alert('❌ ' + err.message);
                    }
                };

                const declineBtn = document.createElement('button');
                declineBtn.className = 'btn-primary danger';
                declineBtn.textContent = '✗ رفض';
                declineBtn.style.fontSize = '12px';
                declineBtn.onclick = async () => {
                    if (currentUser) {
                        await updateDoc(doc(db, 'payment_requests', d.id), { status: 'declined', processedBy: currentUser.uid, processedAt: serverTimestamp() });
                        renderSettingsPanel();
                    }
                };

                item.appendChild(approveBtn);
                item.appendChild(declineBtn);
                panelSettings.appendChild(item);
            });
        });
    } else {
        panelSettings.innerHTML += '<div style="padding:10px; color:#666;">خيارات الإعدادات العامة</div>';
    }
}

function renderProfilePanel() {
    const LEVELS = [
        { min: 800000, name: 'أسطوري' },
        { min: 400000, name: 'مميز' },
        { min: 200000, name: 'طويل المدى' },
        { min: 100000, name: 'غالي' },
        { min: 50000, name: 'عزيز' },
        { min: 1000, name: 'هاوي' },
        { min: 0, name: 'مبتدئ' }
    ];

    function getLevel(count) {
        for (const l of LEVELS) {
            if (count >= l.min) return l;
        }
        return LEVELS[LEVELS.length - 1];
    }

    panelProfile.innerHTML = `<div class="panel-title">👤 ملفي الشخصي</div>
    <div style="padding:12px; background:#f5f5f5; border-radius:6px;">
        <div style="margin-bottom:8px;"><strong>الاسم:</strong> ${currentUserData?.username || 'مستخدم'}</div>
        <div style="margin-bottom:8px;"><strong>البريد:</strong> ${currentUserData?.email || ''}</div>
        <div style="margin-bottom:8px;"><strong>الجنس:</strong> ${currentUserData?.gender === 'female' ? 'أنثى' : 'ذكر'}</div>
        <div style="margin-bottom:8px;"><strong>الرسائل المرسلة:</strong> ${currentUserData?.messageCount || 0}</div>
        <div style="margin-bottom:8px;"><strong>المستوى:</strong> ${getLevel(currentUserData?.messageCount || 0).name}</div>
        <div style="margin-bottom:8px;"><strong>المحفظة:</strong> ${currentUserData?.wallet || 0} وحدة</div>
    </div>
    <button id="btn-logout" class="btn-primary danger" style="width:100%; margin-top:12px;">🚪 تسجيل الخروج</button>`;

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', logout);
    }
}
