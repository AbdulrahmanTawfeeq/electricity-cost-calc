       let devices = [];
        let inputMethod = 'amps';
        let operationMode = 'continuous';

        const pricingTiers = [
            { min: 1, max: 400, price: 72 },
            { min: 401, max: 800, price: 108 },
            { min: 801, max: 1200, price: 175 },
            { min: 1201, max: 1600, price: 265 },
            { min: 1601, max: Infinity, price: 350 }
        ];

        // LocalStorage functions
        function saveDevicesToStorage() {
            try {
                localStorage.setItem('roonaqi_devices', JSON.stringify(devices));
            } catch (e) {
                console.warn('LocalStorage not available');
            }
        }

        function loadDevicesFromStorage() {
            try {
                const savedDevices = localStorage.getItem('roonaqi_devices');
                if (savedDevices) {
                    devices = JSON.parse(savedDevices);
                    updateDevicesList();
                    updateResults();
                }
            } catch (e) {
                console.warn('Error loading from LocalStorage');
            }
        }

        // Fullscreen functions
        function enterFullscreen() {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
            
            updateFullscreenButtons(true);
        }

        function exitFullscreen() {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            
            updateFullscreenButtons(false);
        }

        function updateFullscreenButtons(isFullscreen) {
            const desktopFullscreenBtn = document.getElementById('desktopFullscreenBtn');
            const mobileFullscreenBtn = document.getElementById('mobileFullscreenBtn');
            const exitFullscreenBtn = document.getElementById('exitFullscreenBtn');
            
            if (isFullscreen) {
                if (desktopFullscreenBtn) desktopFullscreenBtn.style.display = 'none';
                if (mobileFullscreenBtn) mobileFullscreenBtn.style.display = 'none';
                if (exitFullscreenBtn) exitFullscreenBtn.style.display = 'block';
            } else {
                if (desktopFullscreenBtn) desktopFullscreenBtn.style.display = 'block';
                if (mobileFullscreenBtn) mobileFullscreenBtn.style.display = 'flex';
                if (exitFullscreenBtn) exitFullscreenBtn.style.display = 'none';
            }
        }

        // Listen for fullscreen changes
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);

        function handleFullscreenChange() {
            const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
            updateFullscreenButtons(isFullscreen);
        }

        function selectMethod(method) {
            inputMethod = method;
            
            document.querySelectorAll('.method-toggle .toggle-btn').forEach(btn => btn.classList.remove('active'));
            event.target.closest('.toggle-btn').classList.add('active');
            
            if (method === 'amps') {
                document.getElementById('ampsInput').style.display = 'block';
                document.getElementById('wattsInput').style.display = 'none';
            } else {
                document.getElementById('ampsInput').style.display = 'none';
                document.getElementById('wattsInput').style.display = 'block';
            }
        }

        function selectOperation(operation) {
            operationMode = operation;
            
            document.querySelectorAll('.operation-toggle .toggle-btn').forEach(btn => btn.classList.remove('active'));
            event.target.closest('.toggle-btn').classList.add('active');
            
            // Hide all operation inputs
            document.getElementById('continuousInputs').style.display = 'none';
            document.getElementById('cyclicInputs').style.display = 'none';
            document.getElementById('intervalInputs').style.display = 'none';
            
            // Show selected operation input
            if (operation === 'continuous') {
                document.getElementById('continuousInputs').style.display = 'block';
            } else if (operation === 'cyclic') {
                document.getElementById('cyclicInputs').style.display = 'block';
            } else if (operation === 'interval') {
                document.getElementById('intervalInputs').style.display = 'block';
            }
        }

        function updateCyclePreview() {
            const workMinutes = parseFloat(document.getElementById('workMinutes').value);
            const restMinutes = parseFloat(document.getElementById('restMinutes').value);
            const preview = document.getElementById('cyclePreview');
            
            if (workMinutes && restMinutes) {
                const totalCycle = workMinutes + restMinutes;
                const efficiency = (workMinutes / totalCycle * 100).toFixed(1);
                const dailyWork = (workMinutes / totalCycle * 24).toFixed(1);
                
                preview.innerHTML = `يعمل ${efficiency}% من الوقت = ${dailyWork} ساعة فعلية يومياً`;
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
            }
        }

        function updateIntervalPreview() {
            const hours = parseFloat(document.getElementById('intervalHours').value);
            const days = parseFloat(document.getElementById('intervalDays').value);
            const preview = document.getElementById('intervalPreview');
            
            if (hours && days) {
                const dailyAverage = (hours / days).toFixed(2);
                preview.innerHTML = `متوسط ${dailyAverage} ساعة يومياً`;
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
            }
        }

        function addDevice(event) {
            event.preventDefault();
            
            const name = document.getElementById('deviceName').value || `جهاز ${devices.length + 1}`;
            
            let effectiveHours;
            let operationInfo;

            if (operationMode === 'continuous') {
                const hours = parseFloat(document.getElementById('deviceHours').value);
                if (!hours) {
                    alert('⚠️ يرجى إدخال ساعات التشغيل اليومية\n\nمثال: 6 ساعات يومياً');
                    return;
                }
                effectiveHours = hours;
                operationInfo = `${hours} ساعة`;
            } else if (operationMode === 'cyclic') {
                const workMinutes = parseFloat(document.getElementById('workMinutes').value);
                const restMinutes = parseFloat(document.getElementById('restMinutes').value);
                
                if (!workMinutes || !restMinutes) {
                    alert('⚠️ يرجى إدخال مدة التشغيل ومدة الراحة\n\nمثال: 30 دقيقة تشغيل، 20 دقيقة راحة');
                    return;
                }
                
                const totalCycle = workMinutes + restMinutes;
                const efficiency = workMinutes / totalCycle;
                effectiveHours = 24 * efficiency;
                
                operationInfo = `${effectiveHours.toFixed(1)} ساعة فعلية`;
            } else if (operationMode === 'interval') {
                const hours = parseFloat(document.getElementById('intervalHours').value);
                const days = parseFloat(document.getElementById('intervalDays').value);
                
                if (!hours || !days) {
                    alert('⚠️ يرجى إدخال ساعات التشغيل وعدد الأيام\n\nمثال: 3 ساعات كل 4 أيام');
                    return;
                }
                
                effectiveHours = hours / days;
                operationInfo = `${hours}س كل ${days} أيام`;
            }

            let dailyKwh;
            let powerInfo;

            if (inputMethod === 'amps') {
                const amps = parseFloat(document.getElementById('deviceAmps').value);
                if (!amps) {
                    alert('⚠️ يرجى إدخال قيمة الأمبير\n\nاستخدم جهاز القياس لمعرفة قراءة التيار\nمثال: 8.5 أمبير');
                    return;
                }
                dailyKwh = (amps * 220 / 1000) * effectiveHours;
                powerInfo = `${amps} أمبير`;
            } else {
                const watts = parseFloat(document.getElementById('deviceWatts').value);
                if (!watts) {
                    alert('⚠️ يرجى إدخال استهلاك الواط\n\nاقرأ الرقم من ملصق الجهاز\nمثال: 1200 واط');
                    return;
                }
                dailyKwh = (watts / 1000) * effectiveHours;
                powerInfo = `${watts} واط`;
            }

            const device = {
                name: name,
                powerInfo: powerInfo,
                operationInfo: operationInfo,
                dailyKwh: dailyKwh,
                monthlyKwh: dailyKwh * 30
            };

            devices.push(device);
            updateDevicesList();
            updateResults();
            clearForm();
            saveDevicesToStorage();
            
            // Success notification
            alert(`تم إضافة "${device.name}" بنجاح!\n\nالاستهلاك الشهري: ${device.monthlyKwh.toFixed(1)} كيلو واط ساعة`);
        }

        function updateDevicesList() {
            const countElement = document.getElementById('deviceCount');
            const sidebarCountElement = document.getElementById('sidebarDeviceCount');
            const modalCountElement = document.getElementById('modalDeviceCount');
            const headerCountElement = document.getElementById('headerDeviceCount');
            const modalDevicesList = document.getElementById('modalDevicesList');
            
            if (countElement) countElement.textContent = devices.length;
            if (sidebarCountElement) sidebarCountElement.textContent = devices.length;
            if (modalCountElement) modalCountElement.textContent = devices.length;
            if (headerCountElement) headerCountElement.textContent = devices.length;
            
            if (devices.length === 0) {
                modalDevicesList.innerHTML = `
                    <div class="empty-state" style="padding: 2rem;">
                        <div class="empty-state-icon">📱</div>
                        <p>لا توجد أجهزة مضافة</p>
                    </div>
                `;
                return;
            }

            modalDevicesList.innerHTML = devices.map((device, index) => `
                <div class="device-item" style="margin-bottom: 0.75rem;">
                    <button class="device-remove" onclick="removeDevice(${index}); updateModalDevices();">&times;</button>
                    <div class="device-name">${device.name}</div>
                    <div class="device-details">
                        ${device.powerInfo} × ${device.operationInfo}<br>
                        ${device.monthlyKwh.toFixed(1)} كيلو واط ساعة شهرياً
                    </div>
                </div>
            `).join('');
        }

        function updateModalDevices() {
            updateDevicesList();
            updateResults();
        }

        // Sidebar Functions
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.querySelector('.sidebar-overlay');
            
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        }

        function closeSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.querySelector('.sidebar-overlay');
            
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }

        function showDevicesModal() {
            updateDevicesList();
            document.getElementById('devicesModal').style.display = 'block';
        }

        function showDocumentationModal() {
            document.getElementById('documentationModal').style.display = 'block';
        }

        function showHelpModal() {
            document.getElementById('helpModal').style.display = 'block';
        }

        // Mobile Splitter Functions (Enhanced)
        let isDragging = false;
        let startY = 0;
        let startResultsHeight = 0;

        function initMobileSplitter() {
            const splitter = document.getElementById('mobileSplitter');
            const resultsSection = document.getElementById('resultsSection');
            const calculatorSection = document.getElementById('calculatorSection');
            
            if (!splitter || window.innerWidth > 768) return;

            splitter.addEventListener('touchstart', handleSplitterStart, { passive: false });
            splitter.addEventListener('mousedown', handleSplitterStart);
            
            document.addEventListener('touchmove', handleSplitterMove, { passive: false });
            document.addEventListener('mousemove', handleSplitterMove);
            
            document.addEventListener('touchend', handleSplitterEnd);
            document.addEventListener('mouseup', handleSplitterEnd);
        }

        function handleSplitterStart(e) {
            if (window.innerWidth > 768) return;
            
            isDragging = true;
            const splitter = document.getElementById('mobileSplitter');
            const resultsSection = document.getElementById('resultsSection');
            
            splitter.classList.add('dragging');
            
            const touch = e.touches ? e.touches[0] : e;
            startY = touch.clientY;
            startResultsHeight = resultsSection.offsetHeight;
            
            e.preventDefault();
        }

        function handleSplitterMove(e) {
            if (!isDragging || window.innerWidth > 768) return;
            
            const touch = e.touches ? e.touches[0] : e;
            const deltaY = touch.clientY - startY;
            const containerHeight = document.querySelector('.mobile-container').offsetHeight;
            const splitterHeight = 20;
            
            let newResultsHeight = startResultsHeight + deltaY;
            
            // Enhanced constraints - allow more flexibility
            const minResultsHeight = 60; // Reduced minimum
            const minCalculatorHeight = 120; // Minimum for calculator
            const maxResultsHeight = containerHeight - splitterHeight - minCalculatorHeight;
            
            newResultsHeight = Math.max(minResultsHeight, Math.min(maxResultsHeight, newResultsHeight));
            
            const resultsSection = document.getElementById('resultsSection');
            const resultsPercentage = (newResultsHeight / containerHeight) * 100;
            
            resultsSection.style.flex = `0 0 ${resultsPercentage}%`;
            
            e.preventDefault();
        }

        function handleSplitterEnd(e) {
            if (!isDragging) return;
            
            isDragging = false;
            const splitter = document.getElementById('mobileSplitter');
            splitter.classList.remove('dragging');
        }

        function removeDevice(index) {
            const deviceName = devices[index].name;
            if (confirm(`هل أنت متأكد من حذف "${deviceName}"؟\n\nسيتم فقدان جميع بيانات هذا الجهاز.`)) {
                devices.splice(index, 1);
                updateDevicesList();
                updateResults();
                saveDevicesToStorage();
            }
        }

        function calculateCost(totalKwh) {
            let cost = 0;
            let breakdown = [];
            let remainingKwh = totalKwh;

            for (let tier of pricingTiers) {
                if (remainingKwh <= 0) break;
                
                let tierMin = tier.min;
                let tierMax = tier.max === Infinity ? remainingKwh + tierMin - 1 : tier.max;
                let tierConsumption = Math.min(remainingKwh, tierMax - tierMin + 1);
                
                if (tierConsumption > 0) {
                    let tierCost = tierConsumption * tier.price;
                    cost += tierCost;
                    
                    let rangeText = tier.max === Infinity ? 
                        `فوق ${tier.min}` : 
                        `${tierMin}-${tierMax}`;
                    
                    breakdown.push({
                        range: rangeText,
                        consumption: tierConsumption,
                        price: tier.price,
                        cost: tierCost
                    });
                    
                    remainingKwh -= tierConsumption;
                }
            }

            return { cost, breakdown };
        }

        function updateResults() {
            const resultsContainer = document.getElementById('resultsContent');
            
            if (devices.length === 0) {
                resultsContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📊</div>
                        <p>أضف أجهزتك لرؤية النتائج</p>
                    </div>
                `;
                return;
            }

            const totalMonthlyKwh = devices.reduce((sum, device) => sum + device.monthlyKwh, 0);
            const { cost, breakdown } = calculateCost(totalMonthlyKwh);
            
            let statusClass = '';
            let statusMessage = '';
            let progressPercent = 0;
            let progressClass = '';

            if (totalMonthlyKwh <= 400) {
                statusClass = 'status-good';
                statusMessage = '✅ ممتاز! أنت ضمن الشريحة الأولى';
                progressPercent = (totalMonthlyKwh / 400) * 20;
            } else if (totalMonthlyKwh <= 800) {
                statusClass = 'status-warning';
                statusMessage = '⚠️ الشريحة الثانية - مقبول';
                progressPercent = 20 + ((totalMonthlyKwh - 400) / 400) * 20;
                progressClass = 'warning';
            } else if (totalMonthlyKwh <= 1200) {
                statusClass = 'status-warning';
                statusMessage = '🔶 الشريحة الثالثة - مرتفع';
                progressPercent = 40 + ((totalMonthlyKwh - 800) / 400) * 20;
                progressClass = 'warning';
            } else if (totalMonthlyKwh <= 1600) {
                statusClass = 'status-danger';
                statusMessage = '🚨 الشريحة الرابعة - مرتفع جداً';
                progressPercent = 60 + ((totalMonthlyKwh - 1200) / 400) * 20;
                progressClass = 'danger';
            } else {
                statusClass = 'status-danger';
                statusMessage = '🔴 الشريحة الخامسة - مفرط';
                progressPercent = 80 + Math.min(((totalMonthlyKwh - 1600) / 400) * 20, 20);
                progressClass = 'danger';
            }

            resultsContainer.innerHTML = `
                <div class="results-summary">
                    <div class="total-consumption">${totalMonthlyKwh.toFixed(1)} كيلو واط ساعة شهرياً</div>
                    <div class="total-cost">${cost.toLocaleString()} دينار</div>
                </div>

                <div class="progress-bar">
                    <div class="progress-fill ${progressClass}" style="width: ${Math.min(progressPercent, 100)}%"></div>
                </div>

                <div class="${statusClass}">
                    ${statusMessage}
                </div>

                <div class="collapsible">
                    <div class="collapsible-header" onclick="toggleCollapsible(this)">
                        <span>تفاصيل الحساب</span>
                        <span>▼</span>
                    </div>
                    <div class="collapsible-content">
                        ${breakdown.map(tier => `
                            <div class="breakdown-item">
                                <span>${tier.range}</span>
                                <span>${tier.consumption.toFixed(1)} × ${tier.price} = ${tier.cost.toLocaleString()} د</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <button class="btn-secondary" onclick="clearAll()" style="width: 100%; margin-top: 0.75rem;">
                    مسح الكل
                </button>
            `;
        }

        function clearForm() {
            document.getElementById('deviceName').value = '';
            document.getElementById('deviceAmps').value = '';
            document.getElementById('deviceWatts').value = '';
            document.getElementById('deviceHours').value = '';
            document.getElementById('workMinutes').value = '';
            document.getElementById('restMinutes').value = '';
            document.getElementById('intervalHours').value = '';
            document.getElementById('intervalDays').value = '';
            document.getElementById('cyclePreview').style.display = 'none';
            document.getElementById('intervalPreview').style.display = 'none';
        }

        function clearAll() {
            if (devices.length === 0) {
                alert('لا توجد أجهزة لحذفها.');
                return;
            }
            
            if (confirm(`هل أنت متأكد من حذف جميع الأجهزة؟\n\nعدد الأجهزة: ${devices.length}\n\nسيتم فقدان جميع البيانات المحفوظة.`)) {
                devices = [];
                updateDevicesList();
                updateResults();
                clearForm();
                saveDevicesToStorage();
                alert('تم حذف جميع الأجهزة بنجاح.');
            }
        }

        function toggleCollapsible(header) {
            const content = header.nextElementSibling;
            const arrow = header.querySelector('span:last-child');
            
            content.classList.toggle('show');
            arrow.textContent = content.classList.contains('show') ? '▲' : '▼';
        }

        function showInfoModal() {
            document.getElementById('infoModal').style.display = 'block';
        }

        function showDisclaimerModal() {
            document.getElementById('disclaimerModal').style.display = 'block';
        }

        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }

        // Close modals when clicking outside
        window.onclick = function(event) {
            const infoModal = document.getElementById('infoModal');
            const disclaimerModal = document.getElementById('disclaimerModal');
            const helpModal = document.getElementById('helpModal');
            const devicesModal = document.getElementById('devicesModal');
            const documentationModal = document.getElementById('documentationModal');
            
            if (event.target === infoModal) {
                infoModal.style.display = 'none';
            }
            if (event.target === disclaimerModal) {
                disclaimerModal.style.display = 'none';
            }
            if (event.target === helpModal) {
                helpModal.style.display = 'none';
            }
            if (event.target === devicesModal) {
                devicesModal.style.display = 'none';
            }
            if (event.target === documentationModal) {
                documentationModal.style.display = 'none';
            }
        }

        // Initialize mobile splitter on load and resize
        window.addEventListener('load', () => {
            initMobileSplitter();
            loadDevicesFromStorage();
        });
        
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                // Reset flex styles for desktop
                const resultsSection = document.getElementById('resultsSection');
                if (resultsSection) {
                    resultsSection.style.flex = '';
                }
            } else {
                initMobileSplitter();
            }
        });

        // Prevent text selection on touch devices
        document.addEventListener('selectstart', function(e) {
            if (!e.target.matches('input, textarea')) {
                e.preventDefault();
            }
        });