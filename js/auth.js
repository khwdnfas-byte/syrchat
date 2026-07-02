import { auth } from "./firebase-config.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "firebase/auth";
import { db } from "./firebase-config.js";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const authModal = document.getElementById('auth-modal');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const usernameInput = document.getElementById('username');
const genderInput = document.getElementById('gender');
const authError = document.getElementById('auth-error');
const authFields = document.getElementById('auth-fields');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');

const lobbyScreen = document.getElementById('lobby-screen');
const chatScreen = document.getElementById('chat-screen');

export let currentUser = null;
export let currentUserData = null;

let isRegistering = false;

btnRegister.addEventListener('click', () => {
    isRegistering = !isRegistering;
    authFields.style.display = isRegistering ? 'block' : 'none';
    btnLogin.style.display = isRegistering ? 'none' : 'block';
    btnRegister.textContent = isRegistering ? 'تأكيد التسجيل' : 'إنشاء حساب';
});

btnLogin.addEventListener('click', () => {
    isRegistering = false;
    authFields.style.display = 'none';
    btnLogin.style.display = 'block';
    btnRegister.textContent = 'إنشاء حساب';
});

async function handleAuth() {
    const email = emailInput.value.trim();
    const pass = passwordInput.value.trim();
    if (!email || !pass) return showError('ملء البريد وكلمة المرور مطلوب');

    try {
        if (isRegistering) {
            const user = (await createUserWithEmailAndPassword(auth, email, pass)).user;
            await setDoc(doc(db, 'users', user.uid), {
                email,
                username: usernameInput.value.trim() || 'مستخدم',
                gender: genderInput.value || 'male',
                role: 'user',
                createdAt: serverTimestamp(),
                wallet: 0,
                bars: [],
                friends: [],
                messageCount: 0
            });
            alert('✅ تم إنشاء الحساب بنجاح!');
            isRegistering = false;
            authFields.style.display = 'none';
        } else {
            await signInWithEmailAndPassword(auth, email, pass);
        }
    } catch (err) {
        showError(err.code === 'auth/email-already-in-use' ? 'البريد مستخدم سابقاً' : err.message);
    }
}

btnLogin.addEventListener('click', handleAuth);
btnRegister.addEventListener('click', handleAuth);

function showError(msg) {
    authError.textContent = msg;
    setTimeout(() => {
        if (authError.textContent === msg) authError.textContent = '';
    }, 3500);
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        authModal.classList.remove('active');
        lobbyScreen.classList.add('active');

        try {
            const snap = await getDoc(doc(db, 'users', user.uid));
            if (snap.exists()) {
                currentUserData = snap.data();
                if (!currentUserData.messageCount) currentUserData.messageCount = 0;
                document.getElementById('welcome-msg').textContent = `👋 أهلاً ${currentUserData.username}!`;
            }
        } catch (e) {
            console.error(e);
        }

        // Trigger lobby and chat initialization
        window.dispatchEvent(new Event('auth-success'));
    } else {
        currentUser = null;
        currentUserData = null;
        authModal.classList.add('active');
        lobbyScreen.classList.remove('active');
        chatScreen.classList.remove('active');
    }
});

export async function logout() {
    try {
        await signOut(auth);
    } catch (e) {
        console.error(e);
    }
}