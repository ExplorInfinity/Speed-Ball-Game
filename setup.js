import { PreviewBall, PreviewStar } from "./js/previewPlayer.js";
import { create_div } from "./js/utils.js";

export class Setup {
    static saveSetup(props, once=false) {
        let setupCount = 0;
        while(localStorage.getItem(`Setup${setupCount}`)) setupCount++;

        if(once) {
            localStorage.setItem(`Setup${Number.MAX_SAFE_INTEGER}`, JSON.stringify(props));
            return Number.MAX_SAFE_INTEGER
        }
        else if(setupCount < maxSetups) {
            localStorage.setItem(`Setup${setupCount}`, JSON.stringify(props)); 
            Setup.showSetups();
            return setupCount
        } else {
            alert('All slots are occupied. Clear some slots before saving.')
        }
    }

    static deleteSetup(setupNumber) {
        localStorage.removeItem(`Setup${setupNumber}`);
    }

    static retrieveSetup(setupIndex) {
        const props = localStorage.getItem(`Setup${setupIndex}`);
        
        if(!props) {
            window.alert('Setup not found!');
            return
        }

        return JSON.parse(props)
    }

    static showSetups() {
        const setupNameNodes = document.querySelectorAll('.setupName');
        const playerNodes = document.querySelectorAll('.playerSetup');
        const trailNodes = document.querySelectorAll('.trailSetup');
        let setupCount = 0;
        while(setupCount < maxSetups) {
            if(localStorage.getItem(`Setup${setupCount}`)) {
                const { setupName, playerProps, effectProps } = JSON.parse(localStorage.getItem(`Setup${setupCount}`));
                setupNameNodes[setupCount].textContent = setupName;
                setupNameNodes[setupCount].setAttribute('setupNumber', setupCount);
                playerNodes[setupCount].textContent = JSON.stringify(playerProps, null, 1);
                trailNodes[setupCount].textContent = JSON.stringify(effectProps, null, 1);
            }
            setupCount++;
        }
    }

    static createSetupListComponent(setupNumber) {
        const container = create_div('setupListItem');
        
        const setupLabel = create_div('setupLabel');
        setupLabel.textContent = `Setup ${setupNumber}`;
        
        const setupInfo = create_div('setupInfo');
        
        const setupName = create_div('setupName');
        setupName.textContent = `Setup Name`;

        const setupControls = create_div('setupControls');
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('removeSetupBtn');
        deleteBtn.textContent = '❌';

        const setup = create_div('setup');
        const playerSetup = create_div('playerSetup');
        playerSetup.textContent = 'Empty Slot';
        const trailSetup = create_div('trailSetup');
        
        deleteBtn.addEventListener('click', e => {
            const setupNumber = setupName.getAttribute('setupNumber');
            if(setupNumber) {
                Setup.deleteSetup(setupNumber);
                setupName.removeAttribute('setupNumber');
                setupName.textContent = `Setup Name`;
                playerSetup.textContent = 'Empty Slot';
                trailSetup.textContent = '';
            }
        });

        setupControls.append(deleteBtn);
        setupInfo.append(setupName, setupControls);
        setup.append(playerSetup, trailSetup);
        container.append(setupLabel, setupInfo, setup);

        return { container }
    }

    static createSetupComponents(count) {
        const setups = document.getElementById('savedSetups');

        const slots = [];
        for(let i = 1; i <= count; i++) {
            const {container} = Setup.createSetupListComponent(i);
            setups.appendChild(container);
            slots.push(container);
        }
    }
}
const maxSetups = 10;
Setup.createSetupComponents(maxSetups);
Setup.showSetups();