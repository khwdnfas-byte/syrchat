import { currentUser, currentUserData } from "./auth.js";
import { db } from "./firebase-config.js";
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    getDoc,
    updateDoc,
    increment
} from "firebase/firestore";

const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const btnSend = document.getElementById('btn-send');
const btnBackLobby = document.getElementById('btn-back-lobby');
const chatScreen = document.getElementById('chat-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const msgError = document.getElementById('msg-error');

let currentRoomId = null;
let unsubscribeMessages = null;
let lastMessageTime = 0;
let userProfileCache = {};
let currentRoomModeration = { floodActive: false, expiresAt: 0, required: 1000 };

// Levels configuration
const LEVELS = [
    { min: 800000, name: 'أسطوري', male: '#1a237e', female: '#4a148c' },
    { min: 400000, name: 'مميز', male: '#0d47a1', female: '#6a1b9a' },
    { min: 200000, name: 'طويل المدى', male: '#1565c0', female: '#7b1fa2' },
    { min: 100000, name: 'غالي', male: '#1976d2', female: '#8e24aa' },
    { min: 50000, name: 'عزيز', male: '#1e88e5', female: '#ab47bc' },
    { min: 1000, name: 'هاوي', male: '#2196f3', female: '#ce93d8' },
    { min: 0, name: 'مبتدئ', male: '#64b5f6', female: '#f8bbd0' }
];

function getLevel(count) {
    for (const l of LEVELS) {
        if (count >= l.min) return l;
    }
    return LEVELS[LEVELS.length - 1];
}

function bubbleColor(level, gender) {
    return gender === 'female' ? level.female : level.male;
}

async function subscribeRoomModeration(roomId) {
    const modRef = doc(db, 'rooms', roomId, 'moderation', 'state');
    onSnapshot(modRef, (snap) => {
        if (!snap.exists()) {
            currentRoomModeration = { floodActive: false, expiresAt: 0, required: 1000 };
            return;
        }
        const data = snap.data();
        currentRoomModeration = {
            floodActive: data.floodActive || false,
            expiresAt: data.expiresAt || 0,
            required: data.required || 1000
        };
        if (currentRoomModeration.floodActive && Date.now() > currentRoomModeration.expiresAt) {
            updateDoc(modRef, { floodActive: false }).catch(() => {});
        }
    });
}

async function loadChat(roomId, roomName) {
    if (unsubscribeMessages) unsubscribeMessages();
    currentRoomId = roomId;

    subscribeRoomModeration(roomId);

    const q = query(collection(db, 'rooms', roomId, 'messages'), orderBy('timestamp', 'asc'));
    unsubscribeMessages = onSnapshot(q, async (snapshot) => {
        chatMessages.innerHTML = '';
        for (const d of snapshot.docs) {
            const data = d.data();
            const bubble = document.createElement('div');
            bubble.className = 'message-bubble ' + (data.userId === currentUser.uid ? 'me' : 'other');

            let profile = userProfileCache[data.userId];
            if (!profile && data.userId) {
                try {
                    const p = await getDoc(doc(db, 'users', data.userId));
                    if (p.exists()) {
                        profile = p.data();
                        userProfileCache[data.userId] = profile;
                    }
                } catch (e) {
                    console.error(e);
                }
            }

            if (profile) {
                const level = getLevel(profile.messageCount || 0);
                const bg = bubbleColor(level, profile.gender || 'male');
                bubble.style.background = bg;
                bubble.style.color = '#fff';
            }

            const userEl = document.createElement('div');
            userEl.className = 'message-user';
            userEl.textContent = data.username || 'زائر';

            const textEl = document.createElement('div');
            textEl.className = 'message-text';
            textEl.textContent = data.text || '';

            const timeEl = document.createElement('div');
            timeEl.className = 'message-time';
            timeEl.textContent = data.timestamp ? new Date(data.timestamp.toMillis()).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '';

            bubble.appendChild(userEl);
            bubble.appendChild(textEl);
            bubble.appendChild(timeEl);
            chatMessages.appendChild(bubble);
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

function showMsgError(msg) {
    msgError.textContent = msg;
    setTimeout(() => {
        if (msgError.textContent === msg) msgError.textContent = '';
    }, 3000);
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentRoomId) return;

    // Throttle
    if (Date.now() - lastMessageTime < 1200) {
        return showMsgError('⏱️ انتظر قليلاً قبل الإرسال');
    }

    // Flood check
    if (currentRoomModeration.floodActive) {
        const required = currentRoomModeration.required || 1000;
        const userCount = currentUserData?.messageCount || 0;
        if (userCount < required) {
            return showMsgError(`🌊 الطوفان مفعل! يتطلب ${required} رسالة على الأقل`);
        }
    }

    lastMessageTime = Date.now();

    try {
        await addDoc(collection(db, 'rooms', currentRoomId, 'messages'), {
            text,
            userId: currentUser.uid,
            username: currentUserData?.username || 'مستخدم',
            timestamp: serverTimestamp()
        });

        // Increment message count
        await updateDoc(doc(db, 'users', currentUser.uid), {
            messageCount: increment(1)
        });
        currentUserData.messageCount = (currentUserData.messageCount || 0) + 1;

        messageInput.value = '';
    } catch (err) {
        console.error(err);
        showMsgError('❌ خطأ بالإرسال');
    }
}

btnSend.onclick = sendMessage;
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

btnBackLobby.onclick = () => {
    if (unsubscribeMessages) unsubscribeMessages();
    chatScreen.classList.remove('active');
    lobbyScreen.classList.add('active');
};

// Listen for room join event
window.addEventListener('room-joined', (e) => {
    loadChat(e.detail.roomId, e.detail.roomName);
});