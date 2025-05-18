<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css"
/>

<script>

    var form = window.fsApi().getForm("6194941");
    
    // IDs of the key form fields we'll be using
    var numberFieldId = "183724225";  // Field to store the number of businesses
    var firstNameFieldId = "183717727";  // Field containing the user's first name
    
    // Define the entities (businesses) and their associated form fields
    // Each entity has upload, ID, and name field IDs in the Formstack form
    const entities = [
      { uploadId: '183724751', idFieldId: '183724418', nameFieldId: '183717809' },
      { uploadId: '183724847', idFieldId: '183724455', nameFieldId: '183717815' },
      { uploadId: '183724852', idFieldId: '183724457', nameFieldId: '183717820' },
      { uploadId: '183724856', idFieldId: '183724458', nameFieldId: '183717825' },
      { uploadId: '183724859', idFieldId: '183724460', nameFieldId: '183717831' },
      { uploadId: '183737072', idFieldId: '183737074', nameFieldId: '183737070' }
    ];
    
    // State variables to manage the form's behavior
    let currentStep = 'business-selection';  // Current step in the form flow
    let selectedBusinessIndex = null;        // Currently selected business index
    let completedBusinesses = [];            // Array of completed business indices
    let uploadMethods = {};                  // Methods chosen for each business (screenshot/manual)
    let showInfoModal = false;               // Whether to show the help modal
    let showSuccessState = false;            // Whether to show the completion screen
    let customerIds = {};                    // Store customer IDs entered manually
    let userName = '';                       // Store the user's name for personalization
    
    // SVG Icons for the UI components
    // These provide visual cues and improve the user experience
    const icons = {
      camera: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>',
      info: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
      checkCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      x: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
      upload: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>',
      arrowRight: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
      arrowLeft: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>',
      building: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="2"></line><line x1="15" y1="22" x2="15" y2="2"></line></svg>',
      lock: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
      plus: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>'
    };
    
    /**
     * Initialize the form when it's ready
     * This event listener waits for the Formstack form to be fully loaded before customizing it
     */
    form.registerFormEventListener({
      type: "ready",
      onFormEvent: function(event) {
        // Get the user's name from the form for personalization
        const firstNameField = form.getField(firstNameFieldId);
        if (firstNameField && firstNameField.getValue) {
          userName = firstNameField.getValue().value || 'Customer';
        }
        
        // get the raw business data right off the form
        const businesses = getBusinessData();
    
        if (businesses.length === 1) {
          // there’s exactly one business: skip straight to “provide-ID”
          selectedBusinessIndex = businesses[0].id;
          uploadMethods[selectedBusinessIndex] = 'manual';  // or 'screenshot' if you prefer
          currentStep = 'method-selection';
        }
        
        // Small delay to ensure all form elements are fully loaded
        setTimeout(function() {
          initializeUI();                  // Set up the custom UI
          handleBusinessSelectionScreen(); // Show the initial business selection screen
          setupEventHandlers();            // Set up button click handlers
        }, 500);
        return Promise.resolve(event);
      }
    });
    
    /**
     * Initialize the custom UI by replacing the default Formstack interface
     * This creates our custom form layout and hides the original Formstack elements
     */
    function initializeUI() {
      // Find the main section of the form
      const section = document.querySelector('[data-testid="section0-col1"]') || 
                      document.querySelector('#fsSection0') || 
                      document.querySelector('.fsSection');
      if (!section) return;
      
      // Clear the section to remove default Formstack UI
      section.innerHTML = '';
      
      // Add custom header with title and instructions
      const header = document.createElement('div');
      header.className = 'form-header';
      header.innerHTML = `
        <h1 class="header-title">Google Antitrust Proof of Account</h1>
        <h2 class="header-subtitle">Final Step: Verify Your Google Ads IDs</h2>
        
        <div class="notification-card">
          <p class="notification-title">${userName}, we're ready to complete your claim.</p>
          <p class="notification-text">
            We need to verify the Google Ads Account IDs for each of your businesses. This is the last step to start your claim.
          </p>
        </div>
      `;
      section.appendChild(header);
      
      // Add container for the main form content
      // This will be dynamically updated as the user progresses through the form
      const mainContent = document.createElement('div');
      mainContent.id = 'main-content';
      mainContent.className = 'main-content';
      section.appendChild(mainContent);
      
      // Create the help modal (initially hidden)
      // This modal provides instructions for finding Google Ads Customer IDs
      const infoModal = document.createElement('div');
      infoModal.id = 'info-modal';
      infoModal.className = 'info-modal';
      infoModal.style.display = 'none';
      infoModal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Finding Your Customer ID</h3>
            <button type="button" class="close-button" onclick="document.getElementById('info-modal').style.display='none';">${icons.x}</button>
          </div>
          <div class="modal-body">
            <p>Your Google Ads Customer ID is a 10-digit number in the format XXX-XXX-XXXX that looks like this:</p>
            
            <div class="id-example">
              <span>123-456-7890</span>
            </div>
            
            <p>Here's how to find it:</p>
            <ol>
              <li>Sign in to your Google Ads account</li>
              <li>Click the help icon (?) in the top right</li>
              <li>Your Customer ID appears at the bottom of the menu</li>
            </ol>
            
            <div class="tip-box">
              <p>
                <strong>Tip:</strong> If you've used multiple Google Ads accounts for each business since 2016, we need all Customer IDs to maximize your compensation.
              </p>
            </div>
            
            <button type="button" class="primary-button" onclick="document.getElementById('info-modal').style.display='none';">
              Got it
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(infoModal);
      
      // Create a hidden container for the original form fields
      // We'll still use these fields to store data, but they'll be hidden from view
      const hiddenContainer = document.createElement('div');
      hiddenContainer.id = 'hidden-fields';
      hiddenContainer.style.display = 'none';
      section.appendChild(hiddenContainer);
      
      // Move all form fields to the hidden container
      // This preserves the original form functionality while using our custom UI
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const uploadEl = document.querySelector(`[data-testid="field-${entity.uploadId}"]`);
        const idFieldEl = document.querySelector(`[data-testid="field-${entity.idFieldId}"]`);
        const nameFieldEl = document.querySelector(`[data-testid="field-${entity.nameFieldId}"]`);
        
        if (uploadEl) hiddenContainer.appendChild(uploadEl);
        if (idFieldEl) hiddenContainer.appendChild(idFieldEl);
        if (nameFieldEl) hiddenContainer.appendChild(nameFieldEl);
      }
      
      // Also hide the number field (stores count of businesses)
      const numberFieldEl = document.querySelector(`[data-testid="field-${numberFieldId}"]`);
      if (numberFieldEl) hiddenContainer.appendChild(numberFieldEl);
      
      // Hide the default form submit button - we'll create our own
      const submitButton = document.querySelector('.fsSubmitButton');
      if (submitButton) {
        submitButton.style.display = 'none';
      }
      
      // Set the value of the number field to track businesses
      updateNumberOfBusinesses();

      const single = getBusinessData().length === 1;
      document.body.classList.toggle('single-entity', single);
    }
    
    /**
     * Update the hidden field that tracks the number of businesses
     * This ensures that backend processing knows how many businesses to process
     */
    function updateNumberOfBusinesses() {
      // Get the number of businesses from form data
      const numberField = form.getField(numberFieldId);
      if (numberField && numberField.setValue) {
        // Get business names
        const businesses = getBusinessData();
        numberField.setValue(businesses.length.toString());
      }
    }
    
    /**
     * Get data for all businesses from the form fields
     * This extracts business names and creates an array of business objects
     * @returns {Array} Array of business objects with id, name, and completion status
     */
    function getBusinessData() {
      // Get business names and data from form fields
      let businesses = [];
      
      for (let i = 0; i < entities.length; i++) {
        const nameField = form.getField(entities[i].nameFieldId);
        if (nameField && nameField.getValue && nameField.getValue().value) {
          const name = nameField.getValue().value;
          businesses.push({
            id: i,
            name: name,
            completed: completedBusinesses.includes(i)
          });
        }
      }
      
      return businesses;
    }
    
    /**
     * Handle displaying the appropriate screen based on the current step
     * This function renders different views as the user progresses through the form
     */
    function handleBusinessSelectionScreen() {
      const mainContent = document.getElementById('main-content');
      if (!mainContent) return;
      
      // If all businesses are verified, show success screen
      if (showSuccessState) {
        // Show success state when all businesses are verified
        mainContent.innerHTML = `
          <div class="success-container">
            <div class="success-icon">
              ${icons.checkCircle}
            </div>
            <h2 class="success-title">Your Claims Are Now Active!</h2>
            <p class="success-text">
              Your Google Ads Customer IDs for all your businesses have been verified.
            </p>
            <p class="success-subtext">
              Our legal team will begin working on your compensation immediately. We'll update you soon on your case progress.
            </p>
            <button type="button" class="primary-button" onclick="submitFinalForm()">
                Return to Dashboard
            </button>
          </div>
        `;
        return;
      }
      
      // Display different screens based on the current step
      if (currentStep === 'business-selection') {
        // Step 1: Business selection screen - user chooses which business to verify
        const businesses = getBusinessData();
        
        // Build business selection screen
        let html = '<div class="business-selection">';
        html += '<p class="step-description">Select a business to provide its Google Ads ID:</p>';
        
        // Add business cards
        businesses.forEach(business => {
          const isCompleted = completedBusinesses.includes(business.id);
          
          html += `
            <button 
              type="button"
              class="business-card ${isCompleted ? 'completed' : ''}" 
              onclick="selectBusiness(${business.id})"
              ${isCompleted ? 'disabled' : ''}
            >
              <div class="business-icon">
                <div class="icon-circle ${isCompleted ? 'completed' : ''}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
              </div>
              <div class="business-info">
                <h3>${business.name}</h3>
                <p>${isCompleted ? 'Completed' : 'Needs Google Ads ID'}</p>
              </div>
              ${!isCompleted ? `<div class="arrow-icon"><i style="font-family: 'Font Awesome 5 Free' !important;" class="fas fa-chevron-down"></i></div>` : `<div class="arrow-icon"><i style="font-family: 'Font Awesome 5 Free' !important;" class="fas fa-check"></i></div>`}
            </button>
          `;
        });
        
        // Add help link and security info
        html += `
          <div class="help-link">
            <button type="button" onclick="showInfoModalHelper()" class="info-button">
              ${icons.info} Need help finding your Customer IDs?
            </button>
          </div>
          <div class="security-info">
            <div class="security-icon">${icons.lock}</div>
            <p>Your information is secure and encrypted</p>
          </div>
        </div>`;

        const total = businesses.length;
        const done  = completedBusinesses.length;
        const pct   = total ? (done / total) * 100 : 0;

        //Add Progress Bar
        html += `
        <div class="progress-container">
            <div class="progress-track">
                <div 
                class="progress-bar-fill" 
                style="width: ${pct}%;"
                ></div>
            </div>
            <p class="progress-label">${done}/${total} Businesses Complete</p>
        </div>
        `;

        
        
        mainContent.innerHTML = html;
      } else if (currentStep === 'method-selection') {
        // Step 2: Method selection screen - user chooses how to provide the Customer ID
        const businesses = getBusinessData();
        const business = businesses[selectedBusinessIndex];
        
        if (!business) {
          // If business not found, go back to selection screen
          currentStep = 'business-selection';
          handleBusinessSelectionScreen();
          return;
        }
        
        const multiple = getBusinessData().length > 1;

        // Build method selection screen
        let html = `
          <div class="method-selection">
            ${multiple
                ? `<div class="nav-header">
                    <button type="button" class="back-button" onclick="backToBusinessSelection()">
                        ← ${business.name}
                    </button>
                    </div>`
                : ``
                }
            
            <p class="step-description">Choose how you'd like to provide the Google Ads ID:</p>
            <p class="google-link">
              (You can use the link below to view your Google account)
              <br>
              <a href="https://ads.google.com" target="_blank" class="external-link">
                ads.google.com
              </a>
            </p>
            
            <button type="button" class="method-card" onclick="selectMethod('screenshot', ${business.id})">
              <div class="method-icon">
                <div class="icon-circle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </div>
              </div>
              <div class="method-info">
                <h3>Upload a Screenshot</h3>
                <p>Fastest & easiest method (recommended)</p>
              </div>
              <div class="arrow-icon"><i style="font-family: 'Font Awesome 5 Free' !important;" class="fas fa-chevron-down"></i></div>
            </button>
            
            <button type="button" class="method-card" onclick="selectMethod('manual', ${business.id})">
              <div class="method-icon">
                <div class="icon-circle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <polyline points="19 12 12 19 5 12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="method-info">
                <h3>Enter ID Manually</h3>
                <p>Type your 10-digit Customer ID</p>
              </div>
              <div class="arrow-icon"><i style="font-family: 'Font Awesome 5 Free' !important;" class="fas fa-chevron-down"></i></div>
            </button>
            
            <div class="example-section">
              <h3>Example Google Ads Account Screen:</h3>
              <div class="example-image">
                <img src="https://s3.amazonaws.com/files.formstack.com/public/932922/image_SampleGoogleAccountImage.png" alt="Example Google Ads Screen" />
              </div>
            </div>
          </div>
        `;
        
        mainContent.innerHTML = html;
      } else if (currentStep === 'provide-id') {
        // Step 3: ID provision screen - user provides Customer ID via chosen method
        const businesses = getBusinessData();
        const business = businesses[selectedBusinessIndex];
        
        if (!business) {
          // If business not found, go back to selection screen
          currentStep = 'business-selection';
          handleBusinessSelectionScreen();
          return;
        }
        
        const method = uploadMethods[business.id] || 'screenshot';
        const entity = entities[business.id];
        
        const multiple = getBusinessData().length > 1;

        // Start building HTML
        let html = `
          <div class="provide-id">
            <div class="nav-header">
                <button type="button" class="back-button-method" onclick="backToMethodSelection()">
                    ← ${uploadMethods[business.id] === 'screenshot'
                        ? 'Upload Screenshot for'
                        : 'Enter Customer ID for'
                    } ${business.name}
                </button>
            </div>
            <p class="google-link">
              (You can use the link below to view your Google account)
              <br>
              <a href="https://ads.google.com" target="_blank" class="external-link">
                ads.google.com
              </a>
            </p>
        `;
        
        // Different UI based on selected method (screenshot or manual entry)
        if (method === 'screenshot') {
          // Screenshot upload method
          html += `
            <div class="upload-container" id="upload-container">
              <div class="upload-placeholder">
                <div class="icon-circle large">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </div>
                <p class="upload-text">Upload a screenshot showing your Customer ID</p>
                <p class="upload-hint">Make sure both your business name and the 10-digit ID<br>(XXX-XXX-XXXX) are visible in your screenshot</p>
              </div>
              <!-- Upload element will be placed here -->
            </div>
            
            <button type="button" class="primary-button upload-button" id="upload-trigger">
              Upload Screenshot
            </button>

          `;
        } else {
          // Manual ID entry method
          // If we have existing customer IDs for this business, show them
          const existingIds = customerIds[business.id] || [''];
          
          html += `
            <div class="manual-entry-container">
              <p class="entry-label">Enter your 10-digit Google Ads Customer ID:</p>
              <div id="id-fields-container" class="id-fields-container">
          `;
          
          // Add input fields for each customer ID
          existingIds.forEach((id, index) => {
            html += `
              <div class="id-field-wrapper" id="id-field-wrapper-${index}">
                <input 
                  type="text" 
                  class="customer-id-input" 
                  placeholder="XXX-XXX-XXXX" 
                  value="${id}"
                  oninput="formatCustomerId(this)"
                  id="customer-id-${index}"
                >
                ${index > 0 ? `
                  <button type="button" class="remove-id-button" onclick="removeIdField(${index})">
                    ${icons.x}
                  </button>
                ` : ''}
              </div>
            `;
          });
          
          html += `
              </div>
              
              <button type="button" class="outline-button add-another-button" onclick="addAnotherIdField()">
                ${icons.plus} Add Another Customer ID
              </button>
              
              <button type="button" class="primary-button submit-button" onclick="saveAndContinue(${business.id})">
                Submit
              </button>
            </div>
          `;
        }
        
        // Add help and security info at the bottom
        html += `
            <div class="help-link">
              <button type="button" onclick="showInfoModalHelper()" class="info-button">
                ${icons.info} Need help finding your Customer ID?
              </button>
            </div>
            <div class="security-info">
              <div class="security-icon">${icons.lock}</div>
              <p>Your information is secure and encrypted</p>
            </div>
          </div>
        `;
        
        mainContent.innerHTML = html;
        
        // Now append the original upload form element if using screenshot method
        if (method === 'screenshot' && document.querySelector(`[data-testid="field-${entity.uploadId}"]`)) {
          const container = document.getElementById('upload-container');
          if (container) {
            // Move the upload element from hidden container to main content
            container.appendChild(document.querySelector(`[data-testid="field-${entity.uploadId}"]`));
            // Style the upload element
            styleUploadElement(container.querySelector(`[data-testid="field-${entity.uploadId}"]`));
            
            // Set up trigger button
            const triggerButton = document.getElementById('upload-trigger');
            if (triggerButton) {
              const fileInput = document.querySelector(`[data-testid="field-${entity.uploadId}"]`).querySelector('input[type="file"]');
              if (fileInput) {
                triggerButton.addEventListener('click', (e) => {
                  e.preventDefault(); // Prevent form submission
                  e.stopPropagation(); // Prevent event bubbling
                  triggerButton.disabled = true;
                  fileInput.click();
                });

                fileInput.addEventListener('change', () => {
                    const entity    = entities[business.id];
                    const wrapper   = document.querySelector(`[data-testid="field-${entity.uploadId}"]`);
                    const statusSel = '.AsyncFileUploadstyles__StyledStatusContainer-sc-wvu5q-7';

                    // Stage 1: wait for the status element to appear
                    const waitForStatusEl = setInterval(() => {
                        const statusEl = wrapper.querySelector(statusSel);
                        if (statusEl) {
                        clearInterval(waitForStatusEl);

                        // Stage 2: wait for "Uploading" to disappear
                        let tries = 0, maxTries = 20, interval = 500;
                        const waitForDone = setInterval(() => {
                            const txt = statusEl.innerText || '';
                            if (!/Uploading/.test(txt)) {
                                clearInterval(waitForDone);
                                // Stage 3: give the UI one more second to settle, then complete
                                setTimeout(() => {
                                    completeBusiness(business.id);
                                }, 1000);
                            } else if (++tries >= maxTries) {
                                clearInterval(waitForDone);
                                console.warn(`Upload still in progress after ${tries} checks.`);
                            }
                        }, interval);

                        }
                    }, 300);  // check every 300ms for the status element to appear
                    });


              }
            }
          }
        }
      }
    }
    
    /**
     * Style the Formstack upload element to match our custom UI
     * This hides the default styling of the file upload element
     * @param {HTMLElement} element - The upload element to style
     */
    function styleUploadElement(element) {
      if (!element) return;
      
      // Find the drag and drop container
      const dragContainer = element.querySelector('.AsyncFileUploadstyles__StyledDragAndDropContainer-sc-wvu5q-0');
      if (!dragContainer) return;
      
      // Hide original content
      const originalContent = dragContainer.querySelector('.AsyncFileUploadstyles__StyledContentWrapper-sc-wvu5q-1');
      if (originalContent) {
        originalContent.style.display = 'none';
      }
      
      // Style the container
      dragContainer.style.border = 'none';
      dragContainer.style.background = 'none';
      dragContainer.style.padding = '0';
      dragContainer.style.margin = '0';
      
      // File input
      const fileInput = element.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.style.opacity = '0';
        fileInput.style.position = 'absolute';
        fileInput.style.pointerEvents = 'none';
      }
      
      // Files list styling
      const filesList = element.querySelector('.AsyncFileUploadstyles__StyledFilesList-sc-wvu5q-4');
      if (filesList) {
        filesList.style.margin = '20px 0 0 0';
      }
      
      // File items styling
      const fileItems = element.querySelectorAll('.AsyncFileUploadstyles__StyledFile-sc-wvu5q-5');
      fileItems.forEach(item => {
        item.style.backgroundColor = '#f0f9ff';
        item.style.border = '1px solid #bfdbfe';
        item.style.borderRadius = '8px';
        item.style.padding = '10px 15px';
        item.style.margin = '10px 0';
      });
      
      // Filenames
      const fileNames = element.querySelectorAll('.AsyncFileUploadstyles__StyledFileName-sc-wvu5q-6');
      fileNames.forEach(name => {
        name.style.color = '#1e40af';
        name.style.fontWeight = '500';
      });
    }
    
    /**
     * Add another Customer ID input field
     * For manual entry method, allows adding multiple IDs per business
     */
    function addAnotherIdField() {
      const container = document.getElementById('id-fields-container');
      if (!container) return;
      
      // Get current business
      const businessId = selectedBusinessIndex;
      if (businessId === null) return;
      
      // Initialize customer IDs array if needed
      if (!customerIds[businessId]) {
        customerIds[businessId] = [''];
      }
      
      // Add a new empty ID
      customerIds[businessId].push('');
      
      // Create new field
      const fieldIndex = customerIds[businessId].length - 1;
      const fieldWrapper = document.createElement('div');
      fieldWrapper.className = 'id-field-wrapper';
      fieldWrapper.id = `id-field-wrapper-${fieldIndex}`;
      
      fieldWrapper.innerHTML = `
        <input 
          type="text" 
          class="customer-id-input" 
          placeholder="XXX-XXX-XXXX" 
          oninput="formatCustomerId(this)" 
          id="customer-id-${fieldIndex}"
        >
        <button type="button" class="remove-id-button" onclick="removeIdField(${fieldIndex})">
          ${icons.x}
        </button>
      `;
      
      container.appendChild(fieldWrapper);
    }
    
    /**
     * Remove a Customer ID input field
     * @param {number} index - The index of the field to remove
     */
    function removeIdField(index) {
      const fieldWrapper = document.getElementById(`id-field-wrapper-${index}`);
      if (!fieldWrapper) return;
      
      // Remove from DOM
      fieldWrapper.remove();
      
      // Remove from data structure
      const businessId = selectedBusinessIndex;
      if (businessId === null || !customerIds[businessId]) return;
      
      customerIds[businessId].splice(index, 1);
      
      // Re-index remaining fields
      const container = document.getElementById('id-fields-container');
      if (!container) return;
      
      const wrappers = container.querySelectorAll('.id-field-wrapper');
      wrappers.forEach((wrapper, newIndex) => {
        wrapper.id = `id-field-wrapper-${newIndex}`;
        const input = wrapper.querySelector('input');
        if (input) {
          input.id = `customer-id-${newIndex}`;
        }
        
        const removeButton = wrapper.querySelector('.remove-id-button');
        if (removeButton) {
          removeButton.setAttribute('onclick', `removeIdField(${newIndex})`);
        }
      });
    }
    
    /**
     * Format Customer ID with dashes as user types
     * Ensures the ID is in the correct XXX-XXX-XXXX format
     * @param {HTMLInputElement} inputElement - The input field being typed in
     */
    function formatCustomerId(inputElement) {
      if (!inputElement) return;
      
      // Get current value and clean it (remove non-digits)
      let value = inputElement.value.replace(/\D/g, '');
      
      // Truncate if too long
      if (value.length > 10) {
        value = value.substring(0, 10);
      }
      
      // Format with dashes
      if (value.length > 6) {
        value = value.substring(0, 3) + '-' + value.substring(3, 6) + '-' + value.substring(6);
      } else if (value.length > 3) {
        value = value.substring(0, 3) + '-' + value.substring(3);
      }
      
      // Update the input value
      inputElement.value = value;
      
      // Update our data structure
      const businessId = selectedBusinessIndex;
      if (businessId === null) return;
      
      // Find the index of this input
      const idMatch = inputElement.id.match(/customer-id-(\d+)/);
      if (!idMatch) return;
      
      const index = parseInt(idMatch[1]);
      
      // Initialize if needed
      if (!customerIds[businessId]) {
        customerIds[businessId] = [''];
      }
      
      // Update the value
      if (customerIds[businessId].length > index) {
        customerIds[businessId][index] = value;
      }
    }
    
    /**
     * Save the Customer ID(s) and continue to the next step
     * @param {number} businessId - The ID of the business being processed
     */
    function saveAndContinue(businessId) {
      // Get all ID inputs
      const inputs = document.querySelectorAll('.customer-id-input');
      let hasValidId = false;
      
      // Store values
      if (!customerIds[businessId]) {
        customerIds[businessId] = [];
      } else {
        customerIds[businessId] = [];
      }
      
      inputs.forEach(input => {
        const value = input.value.trim();
        
        if (value) {
          customerIds[businessId].push(value);
          
          // Check if valid format (XXX-XXX-XXXX)
          if (/^\d{3}-\d{3}-\d{4}$/.test(value)) {
            hasValidId = true;
          }
        }
      });
      
      if (!hasValidId) {
        // Validate that at least one ID is in the correct format
        alert('Please enter at least one valid Customer ID in the format XXX-XXX-XXXX');
        return;
      }
      
      // Update the original form field
      const entity = entities[businessId];
      const idField = form.getField(entity.idFieldId);
      
      if (idField && idField.setValue) {
        idField.setValue(customerIds[businessId].join(', '));
      }
      
      // Mark business as complete
      if (!completedBusinesses.includes(businessId)) {
        completedBusinesses.push(businessId);
      }
      
      // Return to business selection
      returnElementsToContainer();
      currentStep = 'business-selection';
      
      // Check if all businesses are complete
      const businesses = getBusinessData();
      if (completedBusinesses.length >= businesses.length) {
        showSuccessState = true;
      }
      
      handleBusinessSelectionScreen();
    }
    
    /**
     * Select a business to verify
     * @param {number} businessId - The ID of the selected business
     */
    function selectBusiness(businessId) {
      selectedBusinessIndex = businessId;
      currentStep = 'method-selection';
      handleBusinessSelectionScreen();
    }
    
    /**
     * Select a method for providing the Customer ID
     * @param {string} method - The method selected ('screenshot' or 'manual')
     * @param {number} businessId - The ID of the business
     */
    function selectMethod(method, businessId) {
      uploadMethods[businessId] = method;
      currentStep = 'provide-id';
      handleBusinessSelectionScreen();
    }
    
    /**
     * Go back to the business selection screen
     */
    function backToBusinessSelection() {
      selectedBusinessIndex = null;
      currentStep = 'business-selection';
      returnElementsToContainer();
      handleBusinessSelectionScreen();
    }
    
    /**
     * Go back to the method selection screen
     */
    function backToMethodSelection() {
      currentStep = 'method-selection';
      returnElementsToContainer();
      handleBusinessSelectionScreen();
    }
    
    /**
     * Complete a business when using screenshot method
     * @param {number} businessId - The ID of the business being completed
     */
    function completeBusiness(businessId) {
      // Check if business is complete - for screenshot method only
      const entity = entities[businessId];
      let isComplete = false;
      
      // Check if file is uploaded
      const uploadContainer = document.querySelector(`[data-testid="field-${entity.uploadId}"]`);
      if (uploadContainer) {
        const filesList = uploadContainer.querySelector('.AsyncFileUploadstyles__StyledFileItemContainer-sc-wvu5q-4');
        const filesItems = uploadContainer.querySelectorAll('.AsyncFileUploadstyles__StyledFileNameContainer-sc-wvu5q-5');

        if ((filesList && filesItems.length > 0)) {
          isComplete = true;
        }
        
      }
      
      if (isComplete) {
        // Mark business as complete
        if (!completedBusinesses.includes(businessId)) {
          completedBusinesses.push(businessId);
        }
        
        // Return to business selection
        returnElementsToContainer();
        currentStep = 'business-selection';
        
        // Check if all businesses are complete
        const businesses = getBusinessData();
        if (completedBusinesses.length >= businesses.length) {
          showSuccessState = true;
        }
        
        handleBusinessSelectionScreen();
      } else {
        // Show error message
        alert('Please upload a screenshot of your Google Ads Customer ID before continuing.');
      }
    }
    
    /**
     * Return all Formstack elements to the hidden container
     * Called when navigating between screens
     */
    function returnElementsToContainer() {
      // Return all elements to the hidden container
      const hiddenContainer = document.getElementById('hidden-fields');
      if (!hiddenContainer) return;
      
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const uploadEl = document.querySelector(`[data-testid="field-${entity.uploadId}"]`);
        const idFieldEl = document.querySelector(`[data-testid="field-${entity.idFieldId}"]`);
        
        if (uploadEl && uploadEl.parentNode && uploadEl.parentNode.id !== 'hidden-fields') {
          hiddenContainer.appendChild(uploadEl);
        }
        
        if (idFieldEl && idFieldEl.parentNode && idFieldEl.parentNode.id !== 'hidden-fields') {
          hiddenContainer.appendChild(idFieldEl);
        }
      }
    }
    
    /**
     * Show the help modal with instructions for finding Customer IDs
     */
    function showInfoModalHelper() {
      const modal = document.getElementById('info-modal');
      if (modal) {
        modal.style.display = 'flex';
      }
    }
    
    /**
     * Submit the final form when all businesses are verified
     */
    function submitFinalForm() {
      // Check if all businesses are complete
      const businesses = getBusinessData();
      
      if (completedBusinesses.length < businesses.length) {
        alert('Please complete all businesses before submitting.');
        return;
      }
      
      // Submit the form
      const formElement = document.querySelector('form');
      if (formElement) {
        formElement.submit();
      }
    }
    
    /**
     * Set up event handlers and add the final submit button
     */
    function setupEventHandlers() {
      // Add final submit button
      const formFooter = document.querySelector('.fsSubmit');
      
      if (formFooter) {
        const submitButton = document.createElement('button');
        submitButton.className = 'primary-button final-submit';
        submitButton.textContent = 'Submit All Business Information';
        submitButton.type = 'button'; // Ensure it's not a submit button by default
        submitButton.addEventListener('click', submitFinalForm);
        
        formFooter.innerHTML = '';
        formFooter.appendChild(submitButton);
      }
      
      // Prevent default form submission on all buttons
      document.querySelectorAll('button').forEach(button => {
        if (button.type !== 'submit') {
          button.type = 'button';
        }
      });
    }
    
    // Making functions available globally for onclick handlers
    window.selectBusiness = selectBusiness;
    window.selectMethod = selectMethod;
    window.backToBusinessSelection = backToBusinessSelection;
    window.backToMethodSelection = backToMethodSelection;
    window.completeBusiness = completeBusiness;
    window.showInfoModalHelper = showInfoModalHelper;
    window.formatCustomerId = formatCustomerId;
    window.addAnotherIdField = addAnotherIdField;
    window.removeIdField = removeIdField;
    window.saveAndContinue = saveAndContinue;
    window.submitFinalForm = submitFinalForm;
    </script>
    
    <style>
    /**
     * Google Antitrust Proof of Account Form - CSS Styles
     *
     * This stylesheet defines the visual appearance of the custom form interface.
     * It uses a modern, clean design with a color scheme based on blue tones.
     */
    
    /* Import Open Sans font from Google Fonts for consistent typography */
    @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap');
    
    /* Reset default browser styles for consistent cross-browser appearance */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    /* Define global CSS variables for consistent theming throughout the application */
    :root {
      /* Primary colors */
      --blue-primary: #004a7f;    /* Main brand color - purple-blue */
      --blue-hover: #043c64;      /* Darker shade for hover states */
      --blue-light: #e0e7ff;      /* Light blue for backgrounds */
      --blue-lighter: #f5f3ff;    /* Very light blue for subtle backgrounds */
      --blue-focus: rgba(79, 70, 229, 0.2);  /* Transparent blue for focus states */
      
      /* Text colors */
      --text-primary: #1e293b;    /* Dark blue-gray for main text */
      --text-secondary: #64748b;  /* Medium blue-gray for secondary text */
      --text-light: #94a3b8;      /* Light blue-gray for less important text */
      
      /* UI colors */
      --border-color: #e2e8f0;    /* Light gray for borders */
      --success-color: #10b981;   /* Green for success states */
      --success-light: #d1fae5;   /* Light green for success backgrounds */
      --warning-color: #f59e0b;   /* Amber for warnings */
      --warning-light: #fef3c7;   /* Light amber for warning backgrounds */
      --info-color: #3b82f6;      /* Blue for information */
      --info-light: #dbeafe;      /* Light blue for info backgrounds */
      
      /* Background colors */
      --bg-white: #ffffff;        /* White background */
      --bg-gray: #f8fafc;         /* Light gray background */
      
      /* Sizes and shapes */
      --radius-md: 8px;           /* Medium border radius */
      --radius-lg: 12px;          /* Large border radius */
      
      /* Shadows */
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);  /* Subtle shadow */
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);  /* Medium shadow */
    }
    
    /* Base body styles */
    body{
      font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif!important;
      background-color: var(--bg-gray);
      color: var(--text-primary);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;  /* Smoother text rendering in WebKit browsers */
    }
    
    body * {
        font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif!important;
    }
    
    #fsHeaderImage {
        display:none;
    }
    
    /* Hide default Formstack elements that we're replacing with custom UI */
    .fsBody .fsForm .fsLabel,
    .fsBody .fsForm .fsSupporting,
    .fsPagination,
    .fsNextButton,
    .fsPreviousButton {
      display: none !important;
    }
    
    /* Style the main form container */
    .fsForm {
      background: var(--bg-white);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      max-width: 650px;
      margin: 2rem auto;
      padding: 0;
      border: none;
      overflow: hidden;
    }

    body.single-entity .back-button {
        display: none !important;
    }
    
    /* Form Header Styles */
    .form-header {
      padding: 24px;
    }
    
    .header-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #004a7f;  /* Brand color for main title */
      margin-bottom: 4px;
      font-family: "Lato"!important;
    }
    
    .header-subtitle {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 16px;
      font-family: "Lato"!important;
    }
    
    /* Notification card that explains the purpose of the form */
    .notification-card {
      background: var(--bg-white);
      border: 1px solid var(--border-color);
      padding: 16px;
      border-radius: var(--radius-md);
      margin-top: 16px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .notification-title {
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .notification-text {
      color: var(--text-secondary);
    }
    
    /* Main Content Area */
    .main-content {
      padding: 24px;
    }
    
    /* Business Selection Screen Styles */
    .business-selection {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .step-description {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 16px;
    }
    
    /* Business card for selecting a business to verify */
    .business-card {
      display: flex;
      align-items: center;
      padding: 16px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-white);
      transition: all 0.2s ease;
      cursor: pointer;
      text-align: left;
      width: 100%;
    }
    
    .business-card:hover:not(.completed) {
      background: var(--bg-gray);  /* Subtle hover effect */
    }
    
    /* Special styling for completed business cards */
    .business-card.completed {
      background: var(--success-light);
      border-color: #86efac;
      cursor: default;  /* No pointer cursor for completed items */
    }
    
    /* Circle icon containers used throughout the UI */
    .icon-circle {
      width: 36px;
      height: 36px;
      background: #e0e7ff;  /* Light blue circle */
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #004a7f;  /* Blue icon color */
    }
    
    .icon-circle.completed {
      background: #d1fae5;  /* Green circle for completed state */
      color: #10b981;       /* Green icon for completed state */
    }
    
    .icon-circle.large {
      width: 64px;
      height: 64px;  /* Larger circle for more emphasis */
    }
    
    /* Business info container inside the business card */
    .business-info {
      margin-left: 12px;
      flex: 1;
    }
    
    .business-info h3 {
      font-weight: 600;
      font-size: 1rem;
      margin-bottom: 4px;
    }
    
    .business-info p {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
    
    /* Right arrow icon for navigable cards */
    .arrow-icon {
      color: var(--text-light);
      font-size: 1.25rem;
    }
    
    /* Help link container */
    .help-link {
      display: flex;
      justify-content: center;
      margin-top: 24px;
    }
    
    /* Info button for getting help */
    .info-button {
      display: inline-flex;
      align-items: center;
      color: var(--blue-primary);
      font-weight: 500;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
    }
    
    .info-button svg {
      margin-right: 4px;
      width: 16px;
      height: 16px;
    }
    
    /* Security information at the bottom of the screen */
    .security-info {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 24px;
      color: var(--text-light);
      font-size: 0.75rem;
      gap: 6px;
    }
    
    .security-icon {
      display: flex;
    }
    
    .security-icon svg {
      width: 14px;
      height: 14px;
    }
    
    /* Method Selection Screen Styles */
    .nav-header {
      margin-bottom: 24px;
    }
    
    /* Back button for navigation */
    .back-button {
      display: inline-flex;
      align-items: center;
      background: none;
      border: none;
      color: var(--blue-primary);
      cursor: pointer;
      font-weight: 500;
      padding: 0;
      font-size: 0.875rem;
    }

    .back-button-method {
      display: inline-flex;
      align-items: center;
      background: none;
      border: none;
      color: var(--blue-primary);
      cursor: pointer;
      font-weight: 500;
      padding: 0;
      font-size: 0.875rem;
    }
    
    /* Google link information */
    .google-link {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 16px;
    }
    
    .external-link {
      color: var(--blue-primary);
      text-decoration: none;
      font-weight: 500;
    }
    
    .external-link:hover {
      text-decoration: underline;
    }
    
    /* Method card for selecting verification method */
    .method-card {
      display: flex;
      align-items: center;
      padding: 16px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-white);
      transition: all 0.2s ease;
      cursor: pointer;
      margin-bottom: 12px;
      width: 100%;
      text-align: left;
    }
    
    .method-card:hover {
      background: var(--bg-gray);
    }
    
    .method-info {
      margin-left: 12px;
      flex: 1;
    }
    
    .method-info h3 {
      font-weight: 600;
      font-size: 1rem;
      margin-bottom: 4px;
    }
    
    .method-info p {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
    
    /* Example section with screenshot */
    .example-section {
      margin-top: 24px;
    }
    
    .example-section h3 {
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 12px;
    }
    
    .example-image {
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    
    .example-image img {
      width: 100%;
      height: auto;
      display: block;
    }
    
    /* Provide ID Screen Styles */
    .upload-container {
      margin: 24px 0;
    }
    
    /* Placeholder for the upload area */
    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 2px dashed #dbeafe;  /* Dashed border for upload area */
      padding: 24px;
      border-radius: var(--radius-md);
      text-align: center;
      background-color: #f0f9ff;  /* Light blue background */
      width: 100%;
    }
    
    .upload-text {
      font-weight: 600;
      margin: 12px 0 8px;
      color: var(--text-primary);
    }
    
    .upload-hint {
      color: var(--text-secondary);
      font-size: 0.875rem;
      line-height: 1.5;
    }
    
    .upload-button {
      width: 100%;
    }
    
    /* Manual entry container */
    .manual-entry-container {
      margin: 24px 0;
    }
    
    .entry-label {
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--text-primary);
    }
    
    .id-fields-container {
      margin-bottom: 16px;
    }
    
    /* Container for each ID input field */
    .id-field-wrapper {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      position: relative;
    }
    
    /* Style for the Customer ID input field */
    .customer-id-input {
      width: 100%;
      padding: 14px 16px;
      font-size: 16px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      font-family: 'Open Sans', sans-serif;
    }
    
    .customer-id-input:focus {
      outline: none;
      border-color: var(--blue-primary);
      box-shadow: 0 0 0 3px var(--blue-focus);  /* Focus ring */
    }
    
    /* Remove button for additional ID fields */
    .remove-id-button {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-light);
      cursor: pointer;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    
    .remove-id-button:hover {
      color: var(--text-primary);
    }
    
    /* Add another ID button */
    .add-another-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      margin-bottom: 24px;
    }
    
    .submit-button {
      width: 100%;
    }
    
    /* Info Modal Styles */
    .info-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);  /* Semi-transparent overlay */
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;  /* Ensure it appears above other content */
      padding: 16px;
    }
    
    .modal-content {
      background: var(--bg-white);
      border-radius: 12px;
      max-width: 450px;
      width: 100%;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);  /* Deeper shadow for modal */
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
    }
    
    .modal-header h3 {
      font-weight: 600;
      font-size: 1.125rem;
    }
    
    /* Close button for the modal */
    .close-button {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-light);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
    }
    
    .modal-body {
      padding: 16px;
    }
    
    /* Example of a Customer ID in the help modal */
    .id-example {
      background: var(--bg-gray);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 12px;
      text-align: center;
      margin: 16px 0;
    }
    
    .id-example span {
      font-size: 1.125rem;
      font-weight: 500;
    }
    
    /* Ordered list in the modal */
    .modal-body ol {
      margin: 16px 0 16px 24px;
    }
    
    .modal-body ol li {
      margin-bottom: 8px;
    }
    
    /* Tip box in the modal */
    .tip-box {
      background: var(--info-light);
      border: 1px solid #bfdbfe;
      border-radius: var(--radius-md);
      padding: 12px;
      margin: 16px 0 24px;
    }
    
    .tip-box p {
      color: #1e40af;
      font-size: 0.875rem;
    }
    
    /* Button Styles */
    /* Primary action button - blue background */
    .primary-button {
      background: #004a7f;
      color: white;
      font-weight: 600;
      padding: 12px 16px;
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: 'Open Sans', sans-serif;
      font-size: 0.875rem;
      text-align: center;
    }
    
    .primary-button:hover {
      background: #043c64;  /* Darker blue on hover */
    }
    
    /* Outline button - blue border with white background */
    .outline-button {
      background: var(--bg-white);
      color: #004a7f;
      font-weight: 600;
      padding: 12px 16px;
      border: 1px solid #004a7f;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: 'Open Sans', sans-serif;
      font-size: 0.875rem;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    
    .outline-button:hover {
      background: var(--blue-lighter);  /* Very light blue on hover */
    }
    
    /* Final submit button */
    .final-submit {
      width: 100%;
      margin-top: 24px;
      padding: 16px;
      font-size: 1rem;
    }
    
    /* Success Screen Styles */
    .success-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 32px 16px;
    }
    
    /* Success icon */
    .success-icon {
      width: 64px;
      height: 64px;
      background: var(--success-light);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--success-color);
      margin-bottom: 24px;
    }
    
    .success-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 12px;
    }
    
    .success-text {
      color: var(--text-primary);
      margin-bottom: 16px;
    }
    
    .success-subtext {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin-bottom: 24px;
    }
    
    /* Hidden container for original form fields */
    #hidden-fields {
      position: absolute;
      left: -9999px;  /* Move off-screen */
      visibility: hidden;
    }
    
    /* Override Formstack's default styles */
    .fsForm .fsSubmit {
      margin: 0;
      padding: 0 24px 24px;
      background: none;
    }
    
    /* Responsive Design */
    /* Adjust layout for smaller screens */
    @media (max-width: 640px) {
      .form-header, .main-content {
        padding: 16px;  /* Smaller padding on mobile */
      }
      
      .header-title, .header-subtitle {
        font-size: 1.125rem;  /* Smaller headings on mobile */
      }
      
      .business-card,
      .method-card {
        padding: 12px;  /* Smaller card padding on mobile */
      }
      
      .icon-circle {
        width: 32px;
        height: 32px;  /* Smaller icons on mobile */
      }
      
      .icon-circle svg {
        width: 16px;
        height: 16px;  /* Smaller SVG icons on mobile */
      }
    }

    /* Progress Bar */
    .progress-container {
        margin-top: 1.5rem;
        text-align: center;
    }

    .progress-track {
        width: 100%;
        height: 0.625rem;
        background: var(--border-color);
        border-radius: var(--radius-md);
        overflow: hidden;
    }

    .progress-bar-fill {
        height: 100%;
        background: var(--blue-primary);
        border-radius: var(--radius-md) 0 0 var(--radius-md);
        width: 0;
        transition: width 0.3s ease;
    }

    .progress-label {
        margin-top: 0.5rem;
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
    /*File Upload*/
    .bqAmRW {
        max-width:300px;
    }
    </style>
