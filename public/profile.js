// profile.js

document.addEventListener('DOMContentLoaded', async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(userStr);
    const userId = user.id;

    // DOM Elements
    const loadingIndicator = document.getElementById('loading-indicator');
    const viewMode = document.getElementById('view-mode');
    const editMode = document.getElementById('edit-mode');

    // View Elements
    const displayName = document.getElementById('display-name');
    const displayEmail = document.getElementById('display-email');
    const displayBio = document.getElementById('display-bio');
    const displaySkills = document.getElementById('display-skills');
    const avatarInitials = document.getElementById('avatar-initials');
    const editBtn = document.getElementById('edit-btn');

    // Edit Elements
    const profileForm = document.getElementById('profile-form');
    const editFullname = document.getElementById('edit-fullname');
    const editBio = document.getElementById('edit-bio');
    const editSkills = document.getElementById('edit-skills');
    const cancelBtn = document.getElementById('cancel-btn');

    // Initial Data
    let currentProfile = {};

    // Load Profile
    try {
        const res = await fetch(`/api/profiles/${userId}`);
        if (res.ok) {
            currentProfile = await res.json();
        } else {
            console.warn('Failed to fetch profile, might be new user');
        }
    } catch (err) {
        console.error('Error loading profile:', err);
    }

    // Render View
    renderView();
    loadingIndicator.style.display = 'none';
    viewMode.style.display = 'block';

    function renderView() {
        // Use profile data or fallback to auth data
        const name = currentProfile.full_name || user.user_metadata?.full_name || 'Anonymous';
        const email = user.email;
        const bio = currentProfile.bio || 'No bio yet.';
        const skills = currentProfile.skills || [];

        displayName.textContent = name;
        displayEmail.textContent = email;
        displayBio.textContent = bio;

        // Avatar
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        avatarInitials.textContent = initials;

        // Skills
        if (skills.length > 0) {
            displaySkills.innerHTML = skills.map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('');
        } else {
            displaySkills.innerHTML = '<span style="color:#64748b; font-style:italic;">No skills listed</span>';
        }
    }

    // Enter Edit Mode
    editBtn.addEventListener('click', () => {
        viewMode.style.display = 'none';
        editMode.style.display = 'block';

        // Populate form
        editFullname.value = currentProfile.full_name || user.user_metadata?.full_name || '';
        editBio.value = currentProfile.bio || '';
        editSkills.value = (currentProfile.skills || []).join(', ');
    });

    // Cancel Edit
    cancelBtn.addEventListener('click', () => {
        editMode.style.display = 'none';
        viewMode.style.display = 'block';
    });

    // Save Profile
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const saveBtn = profileForm.querySelector('.save-btn');
        const originalBtnText = saveBtn.textContent;

        // Set loading state
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        saveBtn.style.opacity = '0.7';

        const updatedName = editFullname.value.trim();
        const updatedBio = editBio.value.trim();
        const updatedSkills = editSkills.value.split(',').map(s => s.trim()).filter(s => s);

        const payload = {
            full_name: updatedName,
            bio: updatedBio,
            skills: updatedSkills
        };

        try {
            const res = await fetch(`/api/profiles/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to save profile');
            }

            const savedData = await res.json();
            currentProfile = savedData;

            // Update View
            renderView();

            // Switch back
            editMode.style.display = 'none';
            viewMode.style.display = 'block';

            // Update local storage user name if changed
            if (updatedName) {
                user.user_metadata = { ...user.user_metadata, full_name: updatedName };
                localStorage.setItem('user', JSON.stringify(user));
            }

        } catch (err) {
            console.error('Error saving profile:', err);
            alert(`Failed to save profile: ${err.message}`);
        } finally {
            // Reset loading state
            saveBtn.textContent = originalBtnText;
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
        }
    });

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
