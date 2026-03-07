document.addEventListener('DOMContentLoaded', function() {
    // Tab switching for navigation
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const contentSections = document.querySelectorAll('.content-section');
    
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Remove active class from all links and sections
        navLinks.forEach(navLink => navLink.parentElement.classList.remove('active'));
        contentSections.forEach(section => section.classList.remove('active'));
        
        // Add active class to clicked link and corresponding section
        this.parentElement.classList.add('active');
        const sectionId = this.getAttribute('data-section') + '-section';
        document.getElementById(sectionId).classList.add('active');
      });
    });
    
    // Tab switching for settings
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        // Remove active class from all buttons and contents
        tabBtns.forEach(tabBtn => tabBtn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        this.classList.add('active');
        const tabId = this.getAttribute('data-tab') + '-tab';
        document.getElementById(tabId).classList.add('active');
      });
    });
    
    // Simulate loading data
    setTimeout(() => {
      const loadingElements = document.querySelectorAll('.chart-placeholder');
      loadingElements.forEach(el => {
        el.innerHTML = '<div class="loading-text">Chart loaded successfully</div>';
      });
    }, 1500);
  });