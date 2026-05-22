document.addEventListener('DOMContentLoaded', () => {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const adminContainer = document.querySelector('.admin-container');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            adminContainer.classList.toggle('active');
        });
    }

    // Handle screen resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            adminContainer.classList.remove('active');
        }
    });
});
