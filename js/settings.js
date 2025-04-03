const dialog = document.getElementById('settingsCode');
const settingsController = new AbortController();
const { signal } = settingsController;
const keys = new Set();
window.addEventListener('keydown', ({key}) => {
    key = key.toLowerCase();
    if(!keys.has(key)) {
        keys.add(key);
        if(keys.has('shift') && keys.has('c')) {
            dialog.showModal();
        }
    }
}, { signal });

window.addEventListener('keyup', ({key}) => {
    key = key.toLowerCase();
    keys.delete(key);
}, { signal });

const submit = document.getElementById('checkCode');
submit.addEventListener('click', () => {
    const settingsInput = document.getElementById('settingsInput');
    let reload = true;
    switch(settingsInput.value) {
        case 'reset':
            const confirm = prompt('Your Progress will reset! Confirm[Y]').toLowerCase() === 'y';
            if(confirm) {
                localStorage.removeItem('stats');
                alert('Your progress is deleted!');
            } else {
                reload = false;
            }
            break
        case 'unlockBackgrounds':
            const stats = { starsEarned: Number.MAX_SAFE_INTEGER, 
                            starsCollected: Number.MAX_SAFE_INTEGER };
            localStorage.setItem('stats', JSON.stringify(stats));
            alert('Backgrounds Unlocked!');
            break
        case 'betaTesting':
            localStorage.setItem('betaTester', JSON.stringify({ betaTester: true }));
            alert('You are a Beta Tester!');
            break
        case 'normalUser':
            localStorage.removeItem('betaTester');
            alert('You opted out as a Beta Tester!');
            break
        default:
            alert('Cheat Code Unavailable!');
            reload = false;
            break
    }

    settingsInput.value = "";
    dialog.close();
    if(reload) {
        location.reload();
    }
});

export default settingsController;