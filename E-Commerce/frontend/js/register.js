document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const alertBox = document.getElementById('register-alert');
    const registerBtn = document.getElementById('register-btn');
    alertBox.classList.add('hidden');
    alertBox.classList.remove('alert-success');
    alertBox.classList.add('alert-error');

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alertBox.innerText = 'Passwords do not match';
        alertBox.classList.remove('hidden');
        return;
    }

    registerBtn.disabled = true;
    registerBtn.innerText = 'Creating account...';

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            alertBox.innerText = data.msg || 'Registration failed';
            alertBox.classList.remove('hidden');
            return;
        }

        alertBox.classList.remove('alert-error');
        alertBox.classList.add('alert-success');
        alertBox.innerText = 'Account created! Redirecting to login...';
        alertBox.classList.remove('hidden');

        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    } catch (err) {
        alertBox.innerText = 'Something went wrong. Please try again.';
        alertBox.classList.remove('hidden');
    } finally {
        registerBtn.disabled = false;
        registerBtn.innerText = 'Register';
    }
});
