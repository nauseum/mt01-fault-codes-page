document.addEventListener("DOMContentLoaded", () => {
    // Search and index elements
    const searchButton = document.getElementById("searchButton");
    const searchInput = document.getElementById("searchInput");
    const faultCodeList = document.getElementById("faultCodeList");
    
    // Fault Details Modal elements
    const faultModal = document.getElementById("faultModal");
    const modalBody = document.getElementById("modal-body");
    const faultCloseButton = faultModal.querySelector(".close-button");

    // Diagnostic Mode Modal elements
    const diagnosticModeButton = document.getElementById("diagnosticModeButton");
    const diagnosticModal = document.getElementById("diagnosticModal");
    const diagnosticModalBody = document.getElementById("diagnostic-modal-body");
    const diagnosticCloseButton = diagnosticModal.querySelector(".close-button");

    // New Buttons
    const facebookButton = document.getElementById("facebookButton");
    const manualButton = document.getElementById("manualButton");

    let xmlData;
    let summaryXmlData;

    // Fetch and parse both XML data files
    Promise.all([
        fetch("diagnostic_codes.xml").then(response => response.text()),
        fetch("Summary.xml").then(response => response.text())
    ]).then(([diagText, summaryText]) => {
        const parser = new DOMParser();
        xmlData = parser.parseFromString(diagText, "application/xml");
        summaryXmlData = parser.parseFromString(summaryText, "application/xml");
        displayFaultCodeIndex(xmlData);
    }).catch(error => {
        console.error("Error fetching XML data:", error);
        faultCodeList.innerHTML = "<li>Error loading diagnostic data. Please check the console.</li>";
    });

    function displayFaultCodeIndex(xml) {
        faultCodeList.innerHTML = '';
        const faults = xml.getElementsByTagName("fault");
        for (let i = 0; i < faults.length; i++) {
            const faultCode = faults[i].getAttribute("code");
            const symptom = faults[i].getElementsByTagName("symptom")[0].textContent;
            const listItem = document.createElement("li");
            listItem.textContent = `Fault ${faultCode}: ${symptom}`;
            listItem.dataset.faultCode = faultCode;
            listItem.addEventListener("click", () => showFaultDetails(faultCode));
            faultCodeList.appendChild(listItem);
        }
    }

    function showFaultDetails(faultCode) {
        const fault = xmlData.querySelector(`fault[code="${faultCode}"]`);
        if (fault) {
            const symptom = fault.getElementsByTagName("symptom")[0].textContent;
            const probableCause = fault.getElementsByTagName("probableCause")[0].textContent.replace(/\n/g, '<br>');
            const diagnosticCode = fault.getElementsByTagName("diagnosticCode")[0].textContent;
            
            let detailsHTML = `<h3>Fault Code: ${faultCode}</h3><p><strong>Symptom:</strong> ${symptom}</p><p><strong>Probable Cause:</strong><br>${probableCause}</p><p><strong>Diagnostic Code:</strong> ${diagnosticCode}</p>`;

            if (diagnosticCode !== '—') {
                const codes = diagnosticCode.split(/, |:/).map(s => s.trim()).filter(Boolean);
                codes.forEach(code => {
                    const sensor = xmlData.querySelector(`sensor[code="${code}"]`);
                    if (sensor) detailsHTML += `<h4>Sensor Operation (Code ${code})</h4>` + getSensorHTML(sensor);
                    const actuator = xmlData.querySelector(`actuator[code="${code}"]`);
                    if (actuator) detailsHTML += `<h4>Actuator Operation (Code ${code})</h4>` + getActuatorHTML(actuator);
                });
            }

            const steps = fault.getElementsByTagName("step");
            if (steps.length > 0) {
                detailsHTML += `<h4>Troubleshooting Steps</h4><div class="troubleshooting-steps"><ol>`;
                for (let i = 0; i < steps.length; i++) {
                    const item = steps[i].getElementsByTagName("item")[0].textContent;
                    const check = steps[i].getElementsByTagName("check")[0].textContent;
                    const reinstatement = steps[i].getElementsByTagName("reinstatement")[0].textContent;
                    detailsHTML += `<li><strong>Item:</strong> ${item}<br><strong>Check:</strong> ${check}<br><strong>Reinstatement:</strong> ${reinstatement}</li>`;
                }
                detailsHTML += `</ol></div>`;
            }

            // Find and append the AI Summary and Search Button
            const summaryFault = summaryXmlData.querySelector(`Fault[code="${faultCode}"]`);
            if (summaryFault) {
                const aiSummary = summaryFault.querySelector("AISummary").textContent.trim().replace(/(\r\n|\n|\r)/gm, "<br>");
                const searchQuery = summaryFault.querySelector("SearchQuery")?.textContent;
                let searchButtonHTML = '';
                if (searchQuery) {
                    const searchURL = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
                    searchButtonHTML = `<button class="search-online-button" onclick="window.open('${searchURL}', '_blank')">Search Online</button>`;
                }
                detailsHTML += `<h4>User Summary Help</h4><div class="user-summary">${aiSummary}${searchButtonHTML}</div>`;
            }

            modalBody.innerHTML = detailsHTML;
            faultModal.style.display = "block";
        } else {
            modalBody.innerHTML = `<p>Fault code not found.</p>`;
            faultModal.style.display = "block";
        }
    }
    
    function getSensorHTML(sensor) {
        return `<p><strong>Item:</strong> ${sensor.getElementsByTagName("item")[0].textContent}</p><p><strong>Meter Display:</strong> ${sensor.getElementsByTagName("meterDisplay")[0].textContent}</p><p><strong>Checking Method:</strong> ${sensor.getElementsByTagName("checkingMethod")[0].textContent}</p>`;
    }

    function getActuatorHTML(actuator) {
        return `<p><strong>Item:</strong> ${actuator.getElementsByTagName("item")[0].textContent}</p><p><strong>Actuation:</strong> ${actuator.getElementsByTagName("actuation")[0].textContent}</p><p><strong>Checking Method:</strong> ${actuator.getElementsByTagName("checkingMethod")[0].textContent}</p>`;
    }
    
    function showDiagnosticModeInfo() {
        diagnosticModalBody.innerHTML = `
            <h3>Diagnostic Mode Instructions</h3>
            <h4>Setting the diagnostic mode</h4>
            <ol>
                <li>Turn the main switch to “OFF” and set the engine stop switch to the "run" position.</li>
                <li>Disconnect the wire harness coupler from the fuel pump.</li>
                <li>Press and hold the “RESET” button, turn the main switch to “ON”, and continue to press the button for 8 seconds or more.</li>
            </ol>
            <img src="reset_select.jpg" alt="Reset and Select buttons">
            <p><strong>NOTE:</strong> All displays on the meter will disappear except the clock and odometer/trip meter displays. “dIAG” will appear on the LCD.</p>
            <ol start="4">
                <li>Press the “SELECT” button to select the diagnostic mode “dIAG”.</li>
                <li>After selecting “dIAG”, simultaneously press the “SELECT” and “RESET” buttons for 2 seconds or more to activate the mode. The diagnostic code number “d01” will appear.</li>
                <li>Set the engine stop switch to the "run" position.</li>
                <li>Select the diagnostic code number corresponding to the fault code by pressing the “SELECT” and “RESET” buttons.</li>
            </ol>
             <img src="d_button.jpg" alt="d button selector">
            <p><strong>NOTE:</strong> To decrease the number, press “RESET”. To increase, press “SELECT”. Holding either button for 1 second or longer will automatically change the numbers.</p>
            <ol start="8">
                <li>Verify the operation of the sensor or actuator. Sensor data will appear on the odometer LCD. To operate an actuator, set the engine stop switch to the "run" position.</li>
                <li>Turn the main switch to “OFF” to cancel the diagnostic mode.</li>
            </ol>
        `;
        diagnosticModal.style.display = "block";
    }

    // --- Event Listeners ---
    searchButton.addEventListener("click", () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            showFaultDetails(searchTerm);
        }
    });
    
    searchInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            searchButton.click();
        }
    });

    // Listeners for Fault Details Modal
    faultCloseButton.addEventListener("click", () => faultModal.style.display = "none");
    
    // Listeners for Diagnostic Mode Modal
    diagnosticModeButton.addEventListener("click", showDiagnosticModeInfo);
    diagnosticCloseButton.addEventListener("click", () => diagnosticModal.style.display = "none");

    // Listener for new FaceBook Button
    facebookButton.addEventListener("click", () => {
        window.open("https://www.facebook.com/groups/yamahamt01ridersgroup", "_blank");
    });

    // Listener for new Manual Button
    manualButton.addEventListener("click", () => {
        // Open the PDF in a new tab, allowing the browser's viewer to handle it.
        window.open('Manual2005.pdf', '_blank');
    });

    // Listener to close either modal by clicking outside
    window.addEventListener("click", (event) => {
        if (event.target == faultModal) {
            faultModal.style.display = "none";
        }
        if (event.target == diagnosticModal) {
            diagnosticModal.style.display = "none";
        }
    });
});