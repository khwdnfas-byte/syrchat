import { currentUser, currentUserData } from "./auth.js";
import { db } from "./firebase-config.js";
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, getDocs, orderBy } from "firebase/firestore";

const publicRoomsList = document.getElementById('public-rooms');
const btnCreateRoom = document.getElementById('btn-create-room');
const notificationArea = document.getElementById('notification-area');

let unsubscribeNotifs = null;

function loadRooms() {
    const q = query(collection(db, 'rooms'), where('type', '==', 'public'));
    onSnapshot(q, (snapshot) => {
        publicRoomsList.innerHTML = '';
        if (snapshot.empty) {
            addDoc(collection(db, 'rooms'), {
                name: 'عام',
                type: 'public',
                createdAt: serverTimestamp(),
                memberCount: 0
            });
            return;
        }
        snapshot.forEach((d) => {
            const room = d.data();
            const div = document.createElement('div');
            div.className = 'room-item';
            const nameEl = document.createElement('span');
            nameEl.textContent = room.name;
            const countEl = document.createElement('span');
            countEl.style.fontSize = '12px';
            countEl.style.color = '#666';
            countEl.textContent = `👥 ${room.memberCount || 0}`;
            div.appendChild(nameEl);
            div.appendChild(countEl);
            div.onclick = () => joinRoom(d.id, room.name);
            publicRoomsList.appendChild(div);
        });
    });
}

function loadNotifications() {
    const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
    unsubscribeNotifs = onSnapshot(q, (snapshot) => {
        notificationArea.innerHTML = '';
        if (snapshot.empty) {
            notificationArea.innerHTML = '<div style="text-align:center; color:#999; font-size:12px;">لا توجد إشعارات</div>';
            return;
        }
        snapshot.forEach((d) => {
            const data = d.data();
            const item = document.createElement('div');
            item.className = 'notif-item';
            item.textContent = `${data.username} انتقل إلى ${data.roomName}`;
            item.onclick = () => joinRoom(data.roomId, data.roomName);
            notificationArea.appendChild(item);
        });
    });
}

async function joinRoom(roomId, roomName) {
    // Hide lobby, show chat
    document.getElementById('lobby-screen').classList.remove('active');
    document.getElementById('chat-screen').classList.add('active');
    document.getElementById('chat-header-title').textContent = `🎤 ${roomName}`;

    // Create notification
    if (currentUser && currentUserData) {
        await addDoc(collection(db, 'notifications'), {
            userId: currentUser.uid,
            username: currentUserData.username,
            roomId,
            roomName,
            timestamp: serverTimestamp()
        });
    }

    // Trigger chat load
    window.dispatchEvent(new CustomEvent('room-joined', { detail: { roomId, roomName } }));
}

if (btnCreateRoom) {
    btnCreateRoom.onclick = () => {
        const name = prompt('اسم الغرفة الجديدة:');
        if (name && currentUser) {
            addDoc(collection(db, 'rooms'), {
                name,
                type: 'public',
                createdAt: serverTimestamp(),
                createdBy: currentUser.uid,
                memberCount: 1
            });
        }
    };
}

// Initialize on auth success
window.addEventListener('auth-success', () => {
    loadRooms();
    loadNotifications();
});
