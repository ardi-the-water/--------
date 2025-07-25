function showCustomModal(title, message, buttons) {
    const modalOverlay = document.getElementById('custom-modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalActions = document.getElementById('modal-actions');

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalActions.innerHTML = ''; // Clear previous buttons

    buttons.forEach(buttonInfo => {
        const button = document.createElement('button');
        button.textContent = buttonInfo.text;
        button.className = `btn ${buttonInfo.class}`;
        button.addEventListener('click', () => {
            modalOverlay.classList.remove('visible');
            if (buttonInfo.onClick) {
                buttonInfo.onClick();
            }
        });
        modalActions.appendChild(button);
    });

    modalOverlay.classList.add('visible');
}

function showCustomAlert(message, title = 'پیام') {
    return new Promise((resolve) => {
        showCustomModal(title, message, [
            {
                text: 'باشه',
                class: 'btn-primary',
                onClick: () => resolve(true)
            }
        ]);
    });
}

function showCustomConfirm(message, title = 'تایید') {
    return new Promise((resolve) => {
        showCustomModal(title, message, [
            {
                text: 'بله',
                class: 'btn-danger',
                onClick: () => resolve(true)
            },
            {
                text: 'خیر',
                class: 'btn-secondary',
                onClick: () => resolve(false)
            }
        ]);
    });
}
