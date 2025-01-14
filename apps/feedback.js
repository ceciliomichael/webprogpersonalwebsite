document.getElementById('feedbackForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Collect form data
    const formData = new FormData(this);
    const results = {};
    
    // Interface rating
    results.interface = formData.get('interface');
    
    // Features (multiple selections)
    results.features = formData.getAll('features').join(', ');
    
    // Performance rating
    results.performance = formData.get('performance');
    
    // Suggestions
    results.suggestions = formData.get('suggestions');

    // Format email body
    const emailBody = `
Website Feedback Results:

1. Interface Rating: ${results.interface}

2. Useful Features: ${results.features}

3. Performance Rating: ${results.performance}

4. Suggestions for Improvement:
${results.suggestions}

--- End of Feedback ---
`.trim();

    // Create mailto link with feedback data
    const mailtoLink = `mailto:mtcecilio@student.apc.edu.ph?subject=Website Feedback&body=${encodeURIComponent(emailBody)}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    // Show thank you message
    alert('Thank you for your feedback! Your email client will open to send the results.');
    
    // Reset form
    this.reset();
});
