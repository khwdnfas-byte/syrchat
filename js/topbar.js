const topbarWrapper = document.getElementById('topbar-wrapper');
const topbar = document.getElementById('topbar');
const topbarHandle = document.getElementById('topbar-handle');
const chatScreen = document.getElementById('chat-screen');

let topbarDragging = false;
let topbarStartY = 0;
let topbarCurrentDelta = 0;
let topbarTimeout = null;

function showTopbar() {
    topbar.classList.add('active');
    if (topbarTimeout) clearTimeout(topbarTimeout);
    topbarTimeout = setTimeout(() => { hideTopbar(); }, 3500);
}

function hideTopbar() {
    topbar.classList.remove('active');
    if (topbarTimeout) clearTimeout(topbarTimeout);
}

function onMouseDown(e) {
    if (e.clientY <= 60 && chatScreen.classList.contains('active')) {
        topbarDragging = true;
        topbarStartY = e.clientY;
    }
}

function onMouseMove(e) {
    if (!topbarDragging) return;
    topbarCurrentDelta = Math.max(0, e.clientY - topbarStartY);
    if (topbarCurrentDelta > 10) {
        showTopbar();
    }
}

function onMouseUp(e) {
    if (!topbarDragging) return;
    topbarDragging = false;
    topbarCurrentDelta = 0;
}

function onTouchStart(e) {
    if (e.touches[0].clientY <= 60 && chatScreen.classList.contains('active')) {
        topbarDragging = true;
        topbarStartY = e.touches[0].clientY;
    }
}

function onTouchMove(e) {
    if (!topbarDragging) return;
    topbarCurrentDelta = Math.max(0, e.touches[0].clientY - topbarStartY);
    if (topbarCurrentDelta > 10) {
        showTopbar();
    }
}

function onTouchEnd(e) {
    if (!topbarDragging) return;
    topbarDragging = false;
    topbarCurrentDelta = 0;
}

window.addEventListener('auth-success', () => {
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    topbarHandle.addEventListener('click', showTopbar);
});