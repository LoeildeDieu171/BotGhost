fetch('/api/me')
.then(r => r.json())
.then(user => {
document.getElementById('pseudo').textContent = user.username;
document.getElementById('username').textContent = user.username;
document.getElementById('avatar').src = user.avatar;
})
.catch(() => {
document.getElementById('pseudo').textContent = 'Invité';
});