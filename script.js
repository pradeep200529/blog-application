const API_BASE_URL = 'http://localhost:3000';
const TOKEN_KEY = 'fieldnotesToken';
const USER_KEY = 'fieldnotesUser';

function getUser() {
	try {
		return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
	} catch {
		return null;
	}
}

function setStatus(element, message, type = '') {
	if (!element) return;
	element.textContent = message;
	element.className = `status-message${type ? ` ${type}` : ''}`;
}

async function apiRequest(path, options = {}) {
	const headers = { 'Content-Type': 'application/json', ...options.headers };
	const token = localStorage.getItem(TOKEN_KEY);
	if (token && !headers.Authorization) {
		headers.Authorization = `Bearer ${token}`;
	}

	let response;
	try {
		response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
	} catch {
		throw new Error('Could not reach the blog server. Check that it is running.');
	}

	const result = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(result.error || 'Something went wrong. Please try again.');
	}
	return result;
}

function saveSession(result) {
	localStorage.setItem(TOKEN_KEY, result.token);
	localStorage.setItem(USER_KEY, JSON.stringify(result.user));
}

function clearSession() {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(USER_KEY);
	window.location.href = 'index.html';
}

function updateNavigation() {
	const signedIn = Boolean(localStorage.getItem(TOKEN_KEY));
	document.querySelectorAll('[data-auth-only]').forEach((element) => {
		element.hidden = !signedIn;
	});
	document.querySelectorAll('[data-anon-only]').forEach((element) => {
		element.hidden = signedIn;
	});
	document.querySelectorAll('[data-logout]').forEach((button) => {
		button.hidden = !signedIn;
		button.addEventListener('click', clearSession);
	});
}

function formatDate(value) {
	const date = new Date(`${value.replace(' ', 'T')}Z`);
	return Number.isNaN(date.getTime())
		? ''
		: new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

function createPostElement(post) {
	const article = document.createElement('article');
	article.className = 'blog-card';

	const metadata = document.createElement('p');
	metadata.className = 'post-meta';
	metadata.textContent = `${post.author_name} · ${formatDate(post.created_at)}`;

	const title = document.createElement('h3');
	title.textContent = post.title;

	const excerpt = document.createElement('p');
	excerpt.className = 'post-excerpt';
	excerpt.textContent = post.excerpt || post.content.slice(0, 240);

	const details = document.createElement('details');
	details.className = 'post-details';
	const summary = document.createElement('summary');
	summary.textContent = 'Read the story';
	const content = document.createElement('p');
	content.className = 'post-content';
	content.textContent = post.content;
	details.append(summary, content);
	article.append(metadata, title, excerpt, details);
	return article;
}

async function loadPosts() {
	const container = document.querySelector('#blog-feed');
	if (!container) return;

	const status = document.querySelector('#feed-status');
	setStatus(status, 'Loading stories...');
	try {
		const { blogs } = await apiRequest('/api/blogs');
		container.replaceChildren();
		if (blogs.length === 0) {
			setStatus(status, 'No stories yet. Be the first to publish one.');
			return;
		}
		blogs.forEach((post) => container.append(createPostElement(post)));
		setStatus(status, '');
	} catch (error) {
		setStatus(status, error.message, 'error');
	}
}

function handleAuthForm(formId, endpoint) {
	const form = document.querySelector(`#${formId}`);
	if (!form) return;

	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		const button = form.querySelector('button[type="submit"]');
		const status = document.querySelector('#form-status');
		button.disabled = true;
		setStatus(status, 'Please wait...');

		try {
			const payload = Object.fromEntries(new FormData(form));
			const result = await apiRequest(endpoint, {
				method: 'POST',
				body: JSON.stringify(payload),
			});
			saveSession(result);
			window.location.href = 'dashboard.html';
		} catch (error) {
			setStatus(status, error.message, 'error');
			button.disabled = false;
		}
	});
}

function handleCreatePost() {
	const form = document.querySelector('#create-blog-form');
	if (!form) return;

	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		const button = form.querySelector('button[type="submit"]');
		const status = document.querySelector('#form-status');
		button.disabled = true;
		setStatus(status, 'Publishing your story...');

		try {
			const payload = Object.fromEntries(new FormData(form));
			await apiRequest('/api/blogs', {
				method: 'POST',
				body: JSON.stringify(payload),
			});
			window.location.href = 'dashboard.html';
		} catch (error) {
			setStatus(status, error.message, 'error');
			button.disabled = false;
		}
	});
}

function initializePage() {
	updateNavigation();
	handleAuthForm('register-form', '/api/auth/register');
	handleAuthForm('login-form', '/api/auth/login');
	handleCreatePost();

	if (document.body.dataset.page === 'dashboard') {
		if (!localStorage.getItem(TOKEN_KEY)) {
			window.location.replace('login.html');
			return;
		}
		const user = getUser();
		const welcomeName = document.querySelector('#welcome-name');
		if (user && welcomeName) welcomeName.textContent = user.name;
	}

	if (document.body.dataset.page === 'create-blog' && !localStorage.getItem(TOKEN_KEY)) {
		window.location.replace('login.html');
		return;
	}

	loadPosts();
}

document.addEventListener('DOMContentLoaded', initializePage);
