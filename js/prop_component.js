const customisationPanel = document.getElementById('panel');

export function createProperty(labelText, id, obj, propKey, min, max, step, signal) {
    const container = document.createElement('label');
    container.classList.add('prop');

    const label = document.createElement('div');
    label.classList.add('label');
    label.textContent = `${labelText}: ${obj[propKey]}`;

    const defaultValue = obj[propKey];
    const refreshBtn = document.createElement('button');
    refreshBtn.classList.add('refresh');
    refreshBtn.textContent = '↺';
    refreshBtn.addEventListener('click', () => {
        input.value = defaultValue;
        obj[propKey] = defaultValue;
        changeLabel(defaultValue);
    }, { signal });

    const input = document.createElement('input');
    input.setAttribute('type', 'range');
    input.setAttribute('name', id);
    input.id = id;
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = defaultValue;

    input.addEventListener('input', e => {
        const value = Number(e.target.value)
        obj[propKey] = value;
        changeLabel(value);
    }, { signal });

    const changeLabel = (value) => {
        label.textContent = `${labelText}: ${value}`;
        label.appendChild(refreshBtn);
    }

    label.appendChild(refreshBtn);
    container.append(label, input);
    customisationPanel.appendChild(container);

    const abort = () => container.remove();

    return { container, input, refreshBtn, propKey, abort }
}