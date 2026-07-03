document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const alertBox = document.getElementById('login-alert');
    const loginBtn = document.getElementById('login-btn');
    alertBox.classList.add('hidden');

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    loginBtn.disabled = true;
    loginBtn.innerText = 'Logging in...';

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            alertBox.innerText = data.msg || 'Login failed';
            alertBox.classList.remove('hidden');
            return;
        }

        window.location.href = 'index.html';
    } catch (err) {
        alertBox.innerText = 'Something went wrong. Please try again.';
        alertBox.classList.remove('hidden');
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerText = 'Login';
    }
});
