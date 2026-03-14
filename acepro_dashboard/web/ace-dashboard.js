// ValgACE Dashboard JavaScript with Layout Backup in Import/Export

const { createApp } = Vue;

createApp({
    data() {
        return {
            currentLanguage: 'en',
            translations: {
                en: {
                    header: {
                        title: 'ACE Control Panel',
                        connectionLabel: 'Status',
                        connected: 'Connected',
                        disconnected: 'Disconnected',
                        instance: 'ACE Instance:',
                        instanceLabel: 'ACE {index}'
                    },
                    cards: {
                        deviceStatus: 'Device Status',
                        dryer: 'Dryer Control',
                        slots: 'Filament Slots',
                        quickActions: 'Quick Actions',
                        temperatures: 'Temperatures & Fans'
                    },
                    deviceInfo: {
                        model: 'Model',
                        firmware: 'Firmware',
                        bootFirmware: 'Boot Firmware',
                        status: 'Status',
                        temp: 'Temperature',
                        fan: 'Fan Speed',
                        usb: 'USB',
                        rfid: 'RFID',
                        rfidOn: 'Enabled',
                        rfidOff: 'Disabled'
                    },
                    dryer: {
                        status: 'Status',
                        targetTemp: 'Target Temperature',
                        duration: 'Set Duration',
                        remainingTime: 'Remaining Time',
                        currentTemperature: 'Current Temperature',
                        inputs: {
                            temp: 'Temperature (°C):',
                            duration: 'Duration (min):'
                        },
                        buttons: {
                            start: 'Start Drying',
                            stop: 'Stop Drying'
                        }
                    },
                    slots: {
                        slot: 'Slot',
                        status: 'Status',
                        type: 'Type',
                        temp: 'Temp',
                        sku: 'SKU',
                        rfid: 'RFID'
                    },
                    quickActions: {
                        unload: 'Save Inventory',
                        stopAssist: 'Stop All Assist',
                        refresh: 'Refresh Status'
                    },
                    buttons: {
                        load: 'Load',
                        unload: 'Unload',
                        assistOn: 'Assist ON',
                        assistOff: 'Assist OFF'
                    },
                    dialogs: {
                        feedTitle: 'Feed Filament - Slot {slot}',
                        retractTitle: 'Retract Filament - Slot {slot}',
                        length: 'Length (mm):',
                        speed: 'Speed (mm/s):',
                        execute: 'Execute',
                        cancel: 'Cancel',
                        editColor: 'Edit Color',
                        hex: 'Hex',
                        save: 'Save'
                    },
                    notifications: {
                        websocketConnected: 'WebSocket connected',
                        websocketDisconnected: 'WebSocket disconnected',
                        apiError: 'API error: {error}',
                        loadError: 'Status load error: {error}',
                        commandSuccess: 'Command {command} executed successfully',
                        commandSent: 'Command {command} sent',
                        commandError: 'Error: {error}',
                        commandErrorGeneric: 'Command execution error',
                        executeError: 'Command execution error: {error}',
                        feedAssistOn: 'Feed assist enabled for slot {index}',
                        feedAssistOff: 'Feed assist disabled for slot {index}',
                        feedAssistAllOff: 'Feed assist disabled for all slots',
                        feedAssistAllOffError: 'Failed to disable feed assist',
                        refreshStatus: 'Status refreshed',
                        validation: {
                            tempRange: 'Temperature must be between 20 and 55°C',
                            durationMin: 'Duration must be at least 1 minute',
                            feedLength: 'Length must be at least 1 mm',
                            retractLength: 'Length must be at least 1 mm'
                        }
                    },
                    statusMap: {
                        ready: 'Ready',
                        busy: 'Busy',
                        unknown: 'Unknown',
                        disconnected: 'Disconnected'
                    },
                    dryerStatusMap: {
                        drying: 'Drying',
                        stop: 'Stopped'
                    },
                    connectionStateMap: {
                        connected: 'Connected',
                        reconnecting: 'Reconnecting',
                        connecting: 'Connecting',
                        initializing: 'Initializing',
                        disabled: 'Disabled',
                        disconnected: 'Disconnected',
                        unknown: 'Unknown'
                    },
                    slotStatusMap: {
                        ready: 'Ready',
                        empty: 'Empty',
                        busy: 'Busy',
                        unknown: 'Unknown'
                    },
                    rfidStatusMap: {
                        0: 'Not found',
                        1: 'Error',
                        2: 'Identified',
                        3: 'Identifying...'
                    },
                    common: {
                        unknown: 'Unknown'
                    },
                    time: {
                        hours: 'h',
                        minutes: 'min',
                        minutesShort: 'm',
                        secondsShort: 's'
                    }
                }
            },
            // Connection
            wsConnected: false,
            ws: null,
            apiBase: ACE_DASHBOARD_CONFIG?.apiBase || window.location.origin,
            
            // Device Status (ACE)
            deviceStatus: {
                status: 'unknown',
                connection_state: 'unknown',
                model: 'Anycubic Color Engine Pro',
                firmware: 'N/A',
                boot_firmware: 'N/A',
                temp: 0,
                fan_speed: 0,
                enable_rfid: 0,
                usb_port: '',
                usb_path: ''
            },
            
            // Dryer
            dryerStatus: {
                status: 'stop',
                target_temp: 0,
                duration: 0,
                remain_time: 0
            },
            dryingTemp: ACE_DASHBOARD_CONFIG?.defaults?.dryingTemp || 50,
            dryingHours: 4,
            dryingMinutes: 0,
            
            // ACE Slots
            slots: [],
            currentTool: -1,
            feedAssistSlot: -1,
            instanceOptions: [],
            selectedInstance: 0,
            instancesPanels: [],
            colorPresets: ['#ff0000', '#00ff00', '#0000ff', '#ff9900', '#ffff00', '#ff00ff', '#00ffff', '#ffffff', '#808080', '#000000'],
            colorPickerTarget: null,
            materialOptions: {
                'PLA': 200,
                'PETG': 235,
                'ABS': 240,
                'ASA': 245,
                'PVA': 185,
                'HIPS': 230,
                'PC': 260,
                'PLA+': 210,
                'PLA Glow': 210,
                'PLA High Speed': 215,
                'PLA Marble': 205,
                'PLA Matte': 205,
                'PLA SE': 210,
                'PLA Silk': 215,
                'TPU': 210
            },
            rfidSyncEnabled: false,
            editingHex: {},
            // Temporary storage for temperature inputs while editing
            tempInputs: {},
            // Track which slots are currently being edited
            editingTemp: {},
            
            // Endless Spool
            endlessSpoolEnabled: false,
            endlessSpoolMode: 'exact',
            
            // Connection Diagnostics
            showConnectionModal: false,
            connectionDetails: [],
            
            // Color Modal
            showColorModal: false,
            selectedColorHex: '#000000',
            colorModalContext: null,
            
            // Animation tracking
            animatingSlots: {},
            
            // Preset lengths/speeds
            presetLengths: [50, 100, 200],
            presetSpeeds: [10, 25, 50],
            
            // Modals
            showFeedModal: false,
            showRetractModal: false,
            feedSlot: 0,
            feedLength: ACE_DASHBOARD_CONFIG?.defaults?.feedLength || 50,
            feedSpeed: ACE_DASHBOARD_CONFIG?.defaults?.feedSpeed || 25,
            retractSlot: 0,
            retractLength: ACE_DASHBOARD_CONFIG?.defaults?.retractLength || 50,
            retractSpeed: ACE_DASHBOARD_CONFIG?.defaults?.retractSpeed || 25,
            
            // Notifications
            notification: {
                show: false,
                message: '',
                type: 'info'
            },
            
            // Dryer countdown interval
            dryerCountdownInterval: null,
            
            // Printer Dashboard data
            printStats: null,
            toolhead: { position: [0,0,0], homed_axes: '' },
            gcodeMove: { speed_factor: 1.0, extrude_factor: 1.0 },
            // Dynamic temperature and fan data structures
            temperatures: {},
            temperatureObjects: [],
            fanObjects: [],
            allObjects: [],
            fans: [],
            history: [],
            selectedJob: null,
            jobMetadata: null,
            printerRefreshTimer: null,
            
            // Dryer instance selector
            dryerInstance: 0,
            
            // Layout edit mode
            layoutEditMode: false,
            
            // Mobile detection
            isMobile: window.innerWidth <= 768,
            
            // Card positions and sizes (original layout)
            cardPositions: {
                deviceStatus: { x: 20, y: 20 },
                dryer: { x: 390, y: 20 },
                currentPrint: { x: 760, y: 20 },
                temperatures: { x: 20, y: 260 },
                filamentSlots: { x: 390, y: 260 },
                toolhead: { x: 760, y: 260 },
                recentJobs: { x: 20, y: 540 },
                quickActions: { x: 390, y: 540 }
            },
            cardSizes: {
                deviceStatus: { width: 350, height: 220 },
                dryer: { width: 350, height: 220 },
                currentPrint: { width: 350, height: 220 },
                temperatures: { width: 350, height: 260 },
                filamentSlots: { width: 350, height: 260 },
                toolhead: { width: 350, height: 260 },
                recentJobs: { width: 350, height: 280 },
                quickActions: { width: 350, height: 280 }
            },
            
            // Drag state
            dragState: {
                active: false,
                cardId: null,
                startX: 0,
                startY: 0,
                startLeft: 0,
                startTop: 0,
                startWidth: 0,
                startHeight: 0,
                resizeDirection: null,
                guideX: null,
                guideY: null
            },
            
            // Grid size for snapping
            gridSize: 20,
            
            // Snap tolerance in pixels
            snapTolerance: 10,
            
            // Layout enhancement properties
            snapToGrid: true,
            autoScrollSpeed: 10,
            autoScrollInterval: null,
            containerHeight: 1200,
            lastContainerWidth: 0,
            lastContainerHeight: 0,
            
            // Mobile expand/collapse state for each card
            cardExpanded: {
                deviceStatus: true,
                currentPrint: true,
                filamentSlots: true,
                dryer: true,
                temperatures: true,
                recentJobs: true,
                toolhead: true,
                quickActions: true
            }
        };
    },
    
    computed: {
        dryingDuration() {
            return (this.dryingHours * 60) + this.dryingMinutes;
        },
        formattedRemainingTime() {
            if (this.dryerStatus.status !== 'drying' || this.dryerStatus.remain_time <= 0) return '';
            const totalMinutes = Math.floor(this.dryerStatus.remain_time);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            const seconds = Math.round((this.dryerStatus.remain_time - totalMinutes) * 60);
            if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
            if (minutes > 0) return `${minutes}m ${seconds}s`;
            return `${seconds}s`;
        },
        printProgress() {
            if (!this.printStats || !this.printStats.total_duration) return 0;
            return Math.min(100, ((this.printStats.print_duration || 0) / this.printStats.total_duration) * 100).toFixed(1);
        },
        printState() {
            return this.printStats?.state || 'standby';
        },
        printFilename() {
            return this.printStats?.filename || '';
        },
        // Organized temperature data for display
        organizedTemperatures() {
            const heaters = [];
            const sensors = [];
            
            for (const [name, data] of Object.entries(this.temperatures)) {
                // Skip if it's a fan object (handled separately)
                if (this.isFanObject(name)) continue;
                
                const displayName = this.formatObjectName(name);
                const icon = this.getIconForObject(name);
                
                const item = {
                    name: name,
                    displayName: displayName,
                    icon: icon,
                    temperature: data.temperature,
                    target: data.target,
                    hasTarget: data.target !== undefined && data.target !== null
                };
                
                // Categorize: heaters have targets, sensors don't
                if (this.isHeaterObject(name) && data.target !== undefined) {
                    heaters.push(item);
                } else {
                    sensors.push(item);
                }
            }
            
            return { heaters, sensors };
        }
    },
    
    mounted() {
        this.connectWebSocket();
        this.loadStatus();
        this.loadConnectionStatus();
        this.startPrintPolling();
        this.updateDocumentTitle();
        
        const refreshInterval = ACE_DASHBOARD_CONFIG?.autoRefreshInterval || 5000;
        setInterval(() => {
            if (this.wsConnected) {
                this.loadStatus();
                this.loadConnectionStatus();
            }
        }, refreshInterval);
        
        this.startDryerCountdown();
        
        // Printer dashboard polling
        this.startPrinterPolling();
        this.fetchJobHistory();
        this.discoverPrinterObjects(); // Discover all printer objects
        
        // Load saved layout from localStorage
        this.loadCardLayout();
        
        // Automatically load settings from printer on page load
        this.loadFromPrinter().catch(() => {
            // Silently fail if file doesn't exist – that's fine
            if (ACE_DASHBOARD_CONFIG?.debug) console.log('No saved settings on printer');
        });
        
        // Add global mouse event listeners for drag/resize
        document.addEventListener('mousemove', this.onDragMove);
        document.addEventListener('mouseup', this.onDragEnd);
        
        // Initialize container height
        this.$nextTick(() => {
            this.updateContainerHeight();
        });

        // Mobile detection resize listener
        window.addEventListener('resize', this.checkMobile);
        this.checkMobile();
    },
    
    beforeUnmount() {
        if (this.printTimer) clearInterval(this.printTimer);
        if (this.dryerCountdownInterval) clearInterval(this.dryerCountdownInterval);
        if (this.printerRefreshTimer) clearInterval(this.printerRefreshTimer);
        if (this.autoScrollInterval) clearInterval(this.autoScrollInterval);
        document.removeEventListener('mousemove', this.onDragMove);
        document.removeEventListener('mouseup', this.onDragEnd);
        window.removeEventListener('resize', this.checkMobile);
    },
    
    methods: {
        // Mobile detection
        checkMobile() {
            this.isMobile = window.innerWidth <= 768;
            if (this.isMobile && this.layoutEditMode) {
                this.layoutEditMode = false; // force exit edit mode on mobile
            }
        },

        // Toggle card expansion on mobile
        toggleCard(cardId) {
            if (this.isMobile) {
                this.cardExpanded[cardId] = !this.cardExpanded[cardId];
            }
        },

        // ---------- ACE METHODS ----------
        t(path, params = {}) {
            const keys = path.split('.');
            let value = this.translations[this.currentLanguage];
            for (const key of keys) {
                if (value && Object.prototype.hasOwnProperty.call(value, key)) {
                    value = value[key];
                } else {
                    return undefined;
                }
            }
            if (typeof value === 'string') {
                return value.replace(/\{(\w+)\}/g, (match, token) => {
                    return Object.prototype.hasOwnProperty.call(params, token) ? params[token] : match;
                });
            }
            return undefined;
        },

        isSlotHexEditing(instIndex, slotIndex) {
            const key = `${instIndex}-${slotIndex}`;
            return !!this.editingHex[key];
        },

        getPreviousHex(prevPanel, slotIndex) {
            if (!prevPanel || !Array.isArray(prevPanel.slots)) return null;
            const found = prevPanel.slots.find(s => s.index === slotIndex);
            return found ? found.hex : null;
        },

        startHexEdit(instIndex, slotIndex) {
            const key = `${instIndex}-${slotIndex}`;
            const next = { ...this.editingHex };
            next[key] = true;
            this.editingHex = next;
        },

        commitSlotHex(slot, instanceIndex) {
            if (!slot) return;
            const val = slot.hex || '';
            const hex = (typeof val === 'string' && /^#?[0-9a-fA-F]{6}$/.test(val.trim())) ? (val.trim().startsWith('#') ? val.trim() : `#${val.trim()}`) : null;
            if (!hex) {
                this.showNotification('Invalid hex color', 'error');
                return;
            }
            const normalized = hex.trim().startsWith('#') ? hex.trim() : `#${hex.trim()}`;
            slot.hex = normalized;
            this.setSlotColor(slot.index, instanceIndex, normalized, slot.tool, slot.material || slot.type || '', slot.temp);
            const key = `${instanceIndex}-${slot.index}`;
            const next = { ...this.editingHex };
            delete next[key];
            this.editingHex = next;
        },

        // Start editing temperature: set editing flag and initialize tempInputs
        startTempEdit(instIndex, slotIndex, currentTemp) {
            const key = `${instIndex}-${slotIndex}`;
            this.editingTemp = { ...this.editingTemp, [key]: true };
            this.tempInputs = { ...this.tempInputs, [key]: currentTemp };
        },

        // Commit temperature: send command, optimistically update local data, clear editing flag
        async commitTempInput(instIndex, slotIndex, toolNumber, color, material) {
            const key = `${instIndex}-${slotIndex}`;
            const temp = this.tempInputs[key];
            if (temp === undefined) return;

            let parsed = Number(temp);
            if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 300) parsed = 200;

            // Optimistically update local slot.temp and keep tempInputs
            this.updateLocalSlotTemp(instIndex, slotIndex, parsed);
            this.tempInputs = { ...this.tempInputs, [key]: parsed };
            
            // Clear editing flag
            const nextEditing = { ...this.editingTemp };
            delete nextEditing[key];
            this.editingTemp = nextEditing;

            // Send command
            const success = await this.setSlotTemp(slotIndex, instIndex, toolNumber, parsed, color, material);
            if (!success) {
                // If command failed, reload status to get correct values
                this.loadStatus();
            }
        },

        getInstanceFeedAssistSlot(instanceIndex) {
            const panel = this.instancesPanels.find(p => p.index === instanceIndex);
            return (panel && typeof panel.feedAssistSlot === 'number') ? panel.feedAssistSlot : -1;
        },

        setInstanceFeedAssistSlot(instanceIndex, slotIndex) {
            this.instancesPanels = this.instancesPanels.map(panel => {
                if (panel.index !== instanceIndex) return panel;
                return { ...panel, feedAssistSlot: slotIndex };
            });
            if (instanceIndex === this.selectedInstance) this.feedAssistSlot = slotIndex;
        },

        isSlotLocked(inst, slot) {
            const instIndex = typeof inst === 'number' ? inst : inst?.index;
            const panel = this.instancesPanels.find(p => p.index === instIndex);
            const syncEnabled = panel ? panel.rfidSyncEnabled : this.rfidSyncEnabled;
            return !!(syncEnabled && slot && slot.rfid === 2);
        },

        updateDocumentTitle() {
            document.title = this.t('header.title');
        },

        connectWebSocket() {
            const wsUrl = getWebSocketUrl();
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                this.wsConnected = true;
                this.showNotification(this.t('notifications.websocketConnected'), 'success');
                this.subscribeToStatus();
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.wsConnected = false;
            };
            
            this.ws.onclose = () => {
                this.wsConnected = false;
                this.showNotification(this.t('notifications.websocketDisconnected'), 'error');
                const reconnectTimeout = ACE_DASHBOARD_CONFIG?.wsReconnectTimeout || 3000;
                setTimeout(() => this.connectWebSocket(), reconnectTimeout);
            };
        },
        
        subscribeToStatus() {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
            this.ws.send(JSON.stringify({
                jsonrpc: "2.0",
                method: "printer.objects.subscribe",
                params: {
                    objects: {
                        "ace": null
                    }
                },
                id: 5434
            }));
        },
        
        handleWebSocketMessage(data) {
            if (data.method === "notify_status_update") {
                const aceData = data.params[0]?.ace;
                if (aceData) {
                    if (typeof aceData.instance_index === 'number' && aceData.instance_index !== this.selectedInstance) {
                        return;
                    }
                    this.updateStatus(aceData);
                }
            }
        },
        
        async loadStatus() {
            try {
                const inst = Number.isInteger(this.selectedInstance) ? this.selectedInstance : 0;
                const response = await fetch(`${this.apiBase}/server/ace/status?instance=${inst}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const result = await response.json();
                if (ACE_DASHBOARD_CONFIG?.debug) console.log('Status response:', result);
                if (result.error) {
                    console.error('API error:', result.error);
                    this.showNotification(this.t('notifications.apiError', { error: result.error }), 'error');
                    return;
                }
                const statusData = result.result || result;
                if (statusData && typeof statusData === 'object' && 
                    (statusData.status !== undefined || statusData.slots !== undefined || statusData.dryer !== undefined)) {
                    this.updateStatus(statusData);
                    if (statusData.ace_manager) {
                        this.endlessSpoolEnabled = !!statusData.ace_manager.endless_spool_enabled;
                        this.endlessSpoolMode = statusData.ace_manager.endless_spool_match_mode || 'exact';
                    }
                } else {
                    console.warn('Invalid status data in response:', result);
                }
            } catch (error) {
                console.error('Error loading status:', error);
                this.showNotification(this.t('notifications.loadError', { error: error.message }), 'error');
            }
        },
        
        updateStatus(data) {
            if (!data || typeof data !== 'object') {
                console.warn('Invalid status data:', data);
                return;
            }

            let incomingCurrentTool = null;
            const topLevelCurrent = Number(data.current_index);
            const managerCurrent = Number(data?.ace_manager?.current_index);
            if (Number.isInteger(topLevelCurrent)) {
                incomingCurrentTool = topLevelCurrent;
            } else if (Number.isInteger(managerCurrent)) {
                incomingCurrentTool = managerCurrent;
            }
            if (incomingCurrentTool !== null) {
                this.currentTool = incomingCurrentTool;
            }
            
            if (typeof data.rfid_sync_enabled === 'boolean') {
                this.rfidSyncEnabled = data.rfid_sync_enabled;
            }
            
            if (ACE_DASHBOARD_CONFIG?.debug) {
                console.log('Updating status with data:', data);
            }
            
            const instances = Array.isArray(data.instances) ? data.instances : [];
            this.instanceOptions = instances
                .map(item => ({ index: typeof item?.index === 'number' ? item.index : 0 }))
                .sort((a, b) => a.index - b.index);
            if (typeof data.instance_index === 'number') {
                if (
                    !Number.isInteger(this.selectedInstance) ||
                    !this.instanceOptions.find(opt => opt.index === this.selectedInstance)
                ) {
                    this.selectedInstance = data.instance_index;
                }
            }
            
            if (data.status !== undefined) {
                this.deviceStatus.status = data.status;
            }
            if (data.connection_state !== undefined) {
                this.deviceStatus.connection_state = data.connection_state || 'unknown';
            }
            if (data.model !== undefined) {
                this.deviceStatus.model = data.model;
            }
            if (data.firmware !== undefined) {
                this.deviceStatus.firmware = data.firmware;
            }
            if (data.boot_firmware !== undefined) {
                this.deviceStatus.boot_firmware = data.boot_firmware;
            }
            if (data.temp !== undefined) {
                this.deviceStatus.temp = data.temp;
            }
            if (data.fan_speed !== undefined) {
                this.deviceStatus.fan_speed = data.fan_speed;
            }
            if (data.usb_port !== undefined) {
                this.deviceStatus.usb_port = data.usb_port;
            }
            if (data.usb_path !== undefined) {
                this.deviceStatus.usb_path = data.usb_path;
            }
            if (data.enable_rfid !== undefined) {
                this.deviceStatus.enable_rfid = data.enable_rfid;
            }
            
            const dryer = data.dryer || data.dryer_status;
            
            if (dryer && typeof dryer === 'object') {
                if (dryer.duration !== undefined) {
                    this.dryerStatus.duration = Math.floor(dryer.duration);
                }
                if (dryer.remain_time !== undefined) {
                    let remain_time = dryer.remain_time;
                    if (remain_time > 1440) {
                        remain_time = remain_time / 60;
                    } else if (this.dryerStatus.duration > 0 && remain_time > this.dryerStatus.duration * 1.5 && remain_time > 60) {
                        remain_time = remain_time / 60;
                    }
                    this.dryerStatus.remain_time = remain_time;
                }
                if (dryer.status !== undefined) {
                    this.dryerStatus.status = dryer.status;
                }
                if (dryer.target_temp !== undefined) {
                    this.dryerStatus.target_temp = dryer.target_temp;
                }
            }
            
            const instancesRaw = Array.isArray(data.instances) ? data.instances : [];
            const prevPanels = this.instancesPanels || [];
            if (instancesRaw.length > 0) {
                this.instancesPanels = instancesRaw.map(item => {
                    const slotsArr = Array.isArray(item.slots) ? item.slots : [];
                    const prevPanel = prevPanels.find(p => p.index === item.index);
                    
                    // Get connection state for this instance
                    let connectionState = 'unknown';
                    const connDetail = this.connectionDetails.find(d => d.instance === item.index);
                    if (connDetail) {
                        if (!connDetail.connected) {
                            connectionState = 'disconnected';
                        } else if (connDetail.stable) {
                            connectionState = 'stable';
                        } else {
                            connectionState = 'unstable';
                        }
                    } else {
                        connectionState = this.wsConnected ? 'connected' : 'disconnected';
                    }
                    
                    return {
                        index: typeof item.index === 'number' ? item.index : 0,
                        slots: slotsArr.map(slot => {
                            const key = `${item.index}-${slot.index}`;
                            // Update tempInputs only if not being edited
                            if (!this.editingTemp[key]) {
                                this.tempInputs = { ...this.tempInputs, [key]: slot.temp };
                            }
                            return {
                                index: slot.index !== undefined ? slot.index : -1,
                                tool: slot.tool !== undefined ? slot.tool : null,
                                status: slot.status || 'unknown',
                                type: slot.type || slot.material || '',
                                material: slot.material || slot.type || '',
                                temp: slot.temp,
                                color: Array.isArray(slot.color) ? slot.color : [0, 0, 0],
                                hex: this.isSlotHexEditing(item.index, slot.index)
                                    ? this.getPreviousHex(prevPanel, slot.index) || this.getColorHex(slot.color)
                                    : this.getColorHex(slot.color),
                                sku: slot.sku || '',
                                rfid: slot.rfid !== undefined ? slot.rfid : 0
                            };
                        }),
                        feedAssistSlot: typeof item.feed_assist_slot === 'number' ? item.feed_assist_slot : -1,
                        rfidSyncEnabled: typeof item.rfid_sync_enabled === 'boolean' ? item.rfid_sync_enabled : this.rfidSyncEnabled,
                        connectionState: connectionState
                    };
                });
                const selectedPanel = this.instancesPanels.find(p => p.index === this.selectedInstance) || this.instancesPanels[0];
                if (selectedPanel) {
                    this.slots = selectedPanel.slots;
                    this.feedAssistSlot = selectedPanel.feedAssistSlot ?? -1;
                }
            } else if (data.slots !== undefined) {
                if (Array.isArray(data.slots)) {
                    this.slots = data.slots.map(slot => {
                        const key = `${this.selectedInstance}-${slot.index}`;
                        // Update tempInputs only if not being edited
                        if (!this.editingTemp[key]) {
                            this.tempInputs = { ...this.tempInputs, [key]: slot.temp };
                        }
                        return {
                            index: slot.index !== undefined ? slot.index : -1,
                            tool: slot.tool !== undefined ? slot.tool : null,
                            status: slot.status || 'unknown',
                            type: slot.type || slot.material || '',
                            material: slot.material || slot.type || '',
                            color: Array.isArray(slot.color) ? slot.color : [0, 0, 0],
                            hex: this.isSlotHexEditing(this.selectedInstance, slot.index)
                                ? (this.slots.find(s => s.index === slot.index)?.hex || this.getColorHex(slot.color))
                                : this.getColorHex(slot.color),
                            temp: slot.temp,
                            sku: slot.sku || '',
                            rfid: slot.rfid !== undefined ? slot.rfid : 0
                        };
                    });
                } else {
                    console.warn('Slots data is not an array:', data.slots);
                }
                if (data.feed_assist_slot !== undefined) {
                    this.feedAssistSlot = data.feed_assist_slot;
                } else if (data.feed_assist_count !== undefined && data.feed_assist_count > 0) {
                    if (this.feedAssistSlot === -1 && this.currentTool !== -1 && this.currentTool < 4) {
                        this.feedAssistSlot = this.currentTool;
                    }
                } else {
                    this.feedAssistSlot = -1;
                }
            }
            
            if (ACE_DASHBOARD_CONFIG?.debug) {
                console.log('Status updated:', {
                    deviceStatus: this.deviceStatus,
                    dryerStatus: this.dryerStatus,
                    slotsCount: this.slots.length,
                    feedAssistSlot: this.feedAssistSlot
                });
            }
        },
        
        onInstanceChange() {
            this.loadStatus();
        },
        
        getSlotFromTool(tool) {
            if (tool < 0) return null;
            const instanceIndex = Math.floor(tool / 4);
            const slotIndex = tool % 4;
            const instance = this.instancesPanels.find(p => p.index === instanceIndex);
            if (!instance) return null;
            return { instanceIndex, slotIndex };
        },
        
        async executeCommand(command, params = {}) {
            try {
                const cmdParams = { ...params };
                if (typeof cmdParams.INSTANCE === 'undefined' && Number.isInteger(this.selectedInstance)) {
                    cmdParams.INSTANCE = this.selectedInstance;
                }
                console.log(`Executing command: ${command}`, cmdParams);
                const response = await fetch(`${this.apiBase}/server/ace/command`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command, params: cmdParams })
                });
                const result = await response.json();
                if (ACE_DASHBOARD_CONFIG?.debug) console.log('Command response:', result);
                if (result.error) {
                    this.showNotification(this.t('notifications.apiError', { error: result.error }), 'error');
                    return false;
                }
                if (result.result) {
                    if (result.result.success !== false && !result.result.error) {
                        this.showNotification(this.t('notifications.commandSuccess', { command }), 'success');
                        setTimeout(() => this.loadStatus(), 1000);
                        return true;
                    } else {
                        const errorMsg = result.result.error || result.result.message || this.t('notifications.commandErrorGeneric');
                        this.showNotification(this.t('notifications.commandError', { error: errorMsg }), 'error');
                        return false;
                    }
                }
                this.showNotification(this.t('notifications.commandSent', { command }), 'success');
                setTimeout(() => this.loadStatus(), 1000);
                return true;
            } catch (error) {
                console.error('Error executing command:', error);
                this.showNotification(this.t('notifications.executeError', { error: error.message }), 'error');
                return false;
            }
        },
        
        async changeToolForInstance(tool, instanceIndex) {
            let targetInstanceIndex = instanceIndex;
            let targetSlotIndex = -1;
            if (tool >= 0) {
                const slotInfo = this.getSlotFromTool(tool);
                if (slotInfo) {
                    targetInstanceIndex = slotInfo.instanceIndex;
                    targetSlotIndex = slotInfo.slotIndex;
                }
            } else if (tool === -1 && this.currentTool >= 0) {
                const slotInfo = this.getSlotFromTool(this.currentTool);
                if (slotInfo) {
                    targetInstanceIndex = slotInfo.instanceIndex;
                    targetSlotIndex = slotInfo.slotIndex;
                }
            }
            if (targetSlotIndex !== -1) this.startAnimation(targetInstanceIndex, targetSlotIndex);
            try {
                const success = await this.executeCommand('ACE_CHANGE_TOOL', { TOOL: tool, INSTANCE: instanceIndex });
                if (success && instanceIndex === this.selectedInstance) {
                    if (tool >= 0) this.currentTool = tool;
                    else if (tool === -1) this.currentTool = -1;
                }
                return success;
            } finally {}
        },
        
        async unloadFilament(instanceIndex) {
            await this.changeToolForInstance(-1, instanceIndex);
        },

        async stopAssist() {
            let anySuccess = false;
            const instances = this.instanceOptions.length > 0 ? this.instanceOptions : [{ index: this.selectedInstance || 0 }];
            for (const inst of instances) {
                const activeSlot = this.getInstanceFeedAssistSlot(inst.index);
                if (activeSlot !== -1) {
                    const success = await this.disableFeedAssist(activeSlot, inst.index, true);
                    if (success) {
                        anySuccess = true;
                    }
                    continue;
                }
                for (let index = 0; index < 4; index++) {
                    const success = await this.executeCommand('ACE_DISABLE_FEED_ASSIST', { INDEX: index, INSTANCE: inst.index });
                    if (success) {
                        anySuccess = true;
                        this.setInstanceFeedAssistSlot(inst.index, -1);
                    }
                }
            }
            if (anySuccess) {
                this.instancesPanels = this.instancesPanels.map(panel => ({ ...panel, feedAssistSlot: -1 }));
                this.feedAssistSlot = -1;
                this.showNotification(this.t('notifications.feedAssistAllOff'), 'success');
            } else {
                this.showNotification(this.t('notifications.feedAssistAllOffError'), 'error');
            }
        },

        async saveInventoryAll() {
            let anySuccess = false;
            const instances = this.instanceOptions.length > 0 ? this.instanceOptions : [{ index: this.selectedInstance || 0 }];
            for (const inst of instances) {
                const success = await this.executeCommand('ACE_SAVE_INVENTORY', { INSTANCE: inst.index });
                if (success) {
                    anySuccess = true;
                }
            }
            if (anySuccess) {
                this.showNotification(this.t('notifications.commandSuccess', { command: 'ACE_SAVE_INVENTORY' }), 'success');
            } else {
                this.showNotification(this.t('notifications.commandErrorGeneric'), 'error');
            }
        },
        
        async toggleFeedAssist(index, instanceIndex) {
            const targetInstance = Number.isInteger(instanceIndex) ? instanceIndex : (this.selectedInstance || 0);
            const activeSlot = this.getInstanceFeedAssistSlot(targetInstance);
            if (activeSlot === index) {
                await this.disableFeedAssist(index, targetInstance);
            } else {
                if (activeSlot !== -1) {
                    await this.disableFeedAssist(activeSlot, targetInstance, true);
                }
                await this.enableFeedAssist(index, targetInstance);
            }
        },
        
        async enableFeedAssist(index, instanceIndex) {
            const targetInstance = Number.isInteger(instanceIndex) ? instanceIndex : (this.selectedInstance || 0);
            const activeSlot = this.getInstanceFeedAssistSlot(targetInstance);
            if (activeSlot !== -1 && activeSlot !== index) {
                await this.disableFeedAssist(activeSlot, targetInstance, true);
            }
            const success = await this.executeCommand('ACE_ENABLE_FEED_ASSIST', { INDEX: index, INSTANCE: targetInstance });
            if (success) {
                this.setInstanceFeedAssistSlot(targetInstance, index);
                this.showNotification(this.t('notifications.feedAssistOn', { index }), 'success');
            }
            return success;
        },
        
        async disableFeedAssist(index, instanceIndex, silent = false) {
            const targetInstance = Number.isInteger(instanceIndex) ? instanceIndex : (this.selectedInstance || 0);
            const success = await this.executeCommand('ACE_DISABLE_FEED_ASSIST', { INDEX: index, INSTANCE: targetInstance });
            if (success) {
                this.setInstanceFeedAssistSlot(targetInstance, -1);
                if (!silent) {
                    this.showNotification(this.t('notifications.feedAssistOff', { index }), 'success');
                }
            }
            return success;
        },
        
        async startDrying() {
            if (this.dryingTemp < 20 || this.dryingTemp > 55) {
                this.showNotification('Temperature must be between 20 and 55°C', 'error');
                return;
            }
            if (this.dryingDuration < 1) {
                this.showNotification('Duration must be at least 1 minute', 'error');
                return;
            }
            console.log('Starting drying with temp:', this.dryingTemp, 'duration:', this.dryingDuration, 'instance:', this.dryerInstance);
            
            if (this.dryerInstance === 'all') {
                for (const opt of this.instanceOptions) {
                    await this.executeCommand('ACE_START_DRYING', {
                        TEMP: this.dryingTemp,
                        DURATION: this.dryingDuration,
                        INSTANCE: opt.index
                    });
                }
            } else {
                await this.executeCommand('ACE_START_DRYING', {
                    TEMP: this.dryingTemp,
                    DURATION: this.dryingDuration,
                    INSTANCE: this.dryerInstance
                });
            }
        },
        
        async stopDrying() {
            console.log('Stopping drying, instance:', this.dryerInstance);
            if (this.dryerInstance === 'all') {
                for (const opt of this.instanceOptions) {
                    await this.executeCommand('ACE_STOP_DRYING', { INSTANCE: opt.index });
                }
            } else {
                await this.executeCommand('ACE_STOP_DRYING', { INSTANCE: this.dryerInstance });
            }
        },

        startDryerCountdown() {
            this.dryerCountdownInterval = setInterval(() => {
                if (this.dryerStatus.status === 'drying' && this.dryerStatus.remain_time > 0) {
                    this.dryerStatus.remain_time = Math.max(0, this.dryerStatus.remain_time - 1/60);
                }
            }, 1000);
        },

        startPrintPolling() {
            this.fetchPrintStatus();
            this.printTimer = setInterval(this.fetchPrintStatus, 2000);
        },
        async fetchPrintStatus() {
            try {
                const response = await fetch(`${this.apiBase}/printer/objects/query?print_stats`);
                const data = await response.json();
                const printStats = data.result?.status?.print_stats || {};
                this.printStats = printStats;
            } catch (e) {
                console.error('Failed to fetch print status', e);
            }
        },

        // FEED/RETRACT METHODS
        showFeedDialog(slot) {
            this.feedSlot = slot;
            this.feedLength = ACE_DASHBOARD_CONFIG?.defaults?.feedLength || 50;
            this.feedSpeed = ACE_DASHBOARD_CONFIG?.defaults?.feedSpeed || 25;
            this.showFeedModal = true;
        },
        
        closeFeedDialog() {
            this.showFeedModal = false;
        },
        
        async executeFeed() {
            if (this.feedLength < 1) {
                this.showNotification(this.t('notifications.validation.feedLength'), 'error');
                return;
            }
            console.log(`Executing feed on slot ${this.feedSlot}, length ${this.feedLength}, speed ${this.feedSpeed}`);
            this.startAnimation(this.selectedInstance, this.feedSlot);
            const success = await this.executeCommand('ACE_FEED', {
                INDEX: this.feedSlot,
                LENGTH: this.feedLength,
                SPEED: this.feedSpeed,
                INSTANCE: this.selectedInstance
            });
            if (success) this.closeFeedDialog();
        },
        
        showRetractDialog(slot) {
            this.retractSlot = slot;
            this.retractLength = ACE_DASHBOARD_CONFIG?.defaults?.retractLength || 50;
            this.retractSpeed = ACE_DASHBOARD_CONFIG?.defaults?.retractSpeed || 25;
            this.showRetractModal = true;
        },
        
        closeRetractDialog() {
            this.showRetractModal = false;
        },
        
        async executeRetract() {
            if (this.retractLength < 1) {
                this.showNotification(this.t('notifications.validation.retractLength'), 'error');
                return;
            }
            console.log(`Executing retract on slot ${this.retractSlot}, length ${this.retractLength}, speed ${this.retractSpeed}`);
            this.startAnimation(this.selectedInstance, this.retractSlot);
            const success = await this.executeCommand('ACE_RETRACT', {
                INDEX: this.retractSlot,
                LENGTH: this.retractLength,
                SPEED: this.retractSpeed,
                INSTANCE: this.selectedInstance
            });
            if (success) this.closeRetractDialog();
        },
        
        async refreshStatus() {
            await this.loadStatus();
            this.showNotification(this.t('notifications.refreshStatus'), 'success');
        },
        
        getStatusText(status) {
            return this.t(`statusMap.${status}`) || status;
        },
        
        getConnectionStateText(state) {
            const key = state || 'unknown';
            return this.t(`connectionStateMap.${key}`) || this.t('common.unknown');
        },
        
        connectionBadgeClass() {
            if (!this.wsConnected) return 'disconnected';
            return this.deviceStatus.connection_state || 'unknown';
        },
        
        getDryerStatusText(status) {
            return this.t(`dryerStatusMap.${status}`) || status;
        },
        
        getSlotStatusText(status) {
            return this.t(`slotStatusMap.${status}`) || status;
        },
        
        getRfidStatusText(rfid) {
            let key;
            if (rfid === true) key = 2;
            else if (rfid === false || rfid === null || rfid === undefined) key = 0;
            else key = rfid;
            const value = this.t(`rfidStatusMap.${key}`);
            return value === undefined ? this.t('common.unknown') : value;
        },

        isRfidIdentified(rfid) {
            if (rfid === true) return true;
            if (rfid === false || rfid === null || rfid === undefined) return false;
            if (typeof rfid === 'number') return rfid === 2;
            const str = String(rfid).toLowerCase();
            return str === '2' || str === 'identified';
        },
        
        formatUsbPath(port, usbPath) {
            if (port && usbPath) return `${port} (${usbPath})`;
            if (port) return port;
            if (usbPath) return usbPath;
            return this.t('common.unknown');
        },
        
        getColorHex(color) {
            if (!color || !Array.isArray(color) || color.length < 3) return '#000000';
            const r = Math.max(0, Math.min(255, color[0])).toString(16).padStart(2, '0');
            const g = Math.max(0, Math.min(255, color[1])).toString(16).padStart(2, '0');
            const b = Math.max(0, Math.min(255, color[2])).toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
        },
        
        rgbToHex(rgb) {
            if (!Array.isArray(rgb) || rgb.length < 3) return '#000000';
            const [r, g, b] = rgb.map(v => Math.max(0, Math.min(255, Number(v) || 0)));
            return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
        },

        hexToRgb(hex) {
            if (typeof hex !== 'string') return null;
            const m = hex.trim().match(/^#?([0-9a-fA-F]{6})$/);
            if (!m) return null;
            const intVal = parseInt(m[1], 16);
            return [(intVal >> 16) & 255, (intVal >> 8) & 255, intVal & 255];
        },

        // COLOR METHODS
        async setSlotColor(slotIndex, instanceIndex, hex, toolNumber = null, material = '', temp = 0) {
            const rgb = this.hexToRgb(hex);
            if (!rgb) {
                this.showNotification('Invalid color', 'error');
                return;
            }
            const payload = {};
            if (toolNumber !== null && toolNumber !== undefined) payload.T = toolNumber;
            else payload.INDEX = slotIndex;
            payload.COLOR = `${rgb[0]},${rgb[1]},${rgb[2]}`;
            const safeMaterial = (typeof material === 'string' && material.trim()) ? material.trim() : 'PLA';
            let safeTemp = Number(temp);
            if (!Number.isFinite(safeTemp) || safeTemp <= 0 || safeTemp > 300) safeTemp = 200;
            payload.MATERIAL = safeMaterial;
            payload.TEMP = safeTemp;
            await this.executeCommand('ACE_SET_SLOT', payload);
        },

        async setSlotMaterial(slotIndex, instanceIndex, toolNumber, material, currentColor, currentTemp) {
            const panel = this.instancesPanels.find(p => p.index === instanceIndex);
            const locked = (panel && panel.rfidSyncEnabled) ? (panel.slots.find(s => s.index === slotIndex)?.rfid === 2) : false;
            if (locked) {
                this.showNotification('RFID locked: disable RFID sync to edit', 'error');
                return;
            }
            const hex = this.getColorHex(currentColor);
            const rgb = this.hexToRgb(hex);
            const tempDefault = this.materialOptions[material] || currentTemp || 200;
            const payload = {};
            if (toolNumber !== null && toolNumber !== undefined) payload.T = toolNumber;
            else payload.INDEX = slotIndex;
            payload.COLOR = Array.isArray(rgb) ? `${rgb[0]},${rgb[1]},${rgb[2]}` : hex || '255,255,255';
            payload.MATERIAL = material && material.trim() ? material.trim() : 'PLA';
            payload.TEMP = Math.max(1, Math.min(300, tempDefault));
            const success = await this.executeCommand('ACE_SET_SLOT', payload);
            if (success) setTimeout(() => this.loadStatus(), 500);
        },

        // Modified: return success boolean, no tempInputs clearing
        async setSlotTemp(slotIndex, instanceIndex, toolNumber, tempValue, currentColor, currentMaterial) {
            const panel = this.instancesPanels.find(p => p.index === instanceIndex);
            const locked = (panel && panel.rfidSyncEnabled) ? (panel.slots.find(s => s.index === slotIndex)?.rfid === 2) : false;
            if (locked) {
                this.showNotification('RFID locked: disable RFID sync to edit', 'error');
                return false;
            }
            const hex = this.getColorHex(currentColor);
            const rgb = this.hexToRgb(hex);
            let temp = Number(tempValue);
            if (!Number.isFinite(temp) || temp <= 0 || temp > 300) temp = 200;
            const payload = {};
            if (toolNumber !== null && toolNumber !== undefined) payload.T = toolNumber;
            else payload.INDEX = slotIndex;
            payload.COLOR = Array.isArray(rgb) ? `${rgb[0]},${rgb[1]},${rgb[2]}` : hex || '255,255,255';
            payload.MATERIAL = currentMaterial && currentMaterial.trim() ? currentMaterial.trim() : 'PLA';
            payload.TEMP = temp;
            const success = await this.executeCommand('ACE_SET_SLOT', payload);
            if (success) setTimeout(() => this.loadStatus(), 500);
            return success;
        },

        // This method is now handled by commitTempInput, but keep for compatibility
        commitSlotTemp(slotIndex, instanceIndex, toolNumber, event, currentColor, currentMaterial) {
            // Redirect to commitTempInput
            this.commitTempInput(instanceIndex, slotIndex, toolNumber, currentColor, currentMaterial);
        },

        updateLocalSlotTemp(instanceIndex, slotIndex, temp) {
            this.instancesPanels = this.instancesPanels.map(panel => {
                if (panel.index !== instanceIndex) return panel;
                const slots = panel.slots.map(slot => {
                    if (slot.index === slotIndex) return { ...slot, temp };
                    return slot;
                });
                return { ...panel, slots };
            });
            if (this.selectedInstance === instanceIndex) {
                this.slots = this.slots.map(slot => {
                    if (slot.index === slotIndex) return { ...slot, temp };
                    return slot;
                });
            }
        },

        getSlotToolNumber(slot, instanceIndex) {
            if (slot && slot.tool !== null && slot.tool !== undefined) {
                const toolNum = Number(slot.tool);
                return Number.isInteger(toolNum) ? toolNum : null;
            }
            const slotIndex = Number(slot?.index);
            if (!Number.isInteger(slotIndex)) return null;
            const panel = this.instancesPanels.find(p => p.index === instanceIndex);
            if (panel && Array.isArray(panel.slots)) {
                const sample = panel.slots.find(s => Number.isInteger(Number(s?.tool)) && Number.isInteger(Number(s?.index)));
                if (sample) {
                    const sampleTool = Number(sample.tool);
                    const sampleIndex = Number(sample.index);
                    const offset = sampleTool - sampleIndex;
                    return offset + slotIndex;
                }
            }
            if (this.instancesPanels.length <= 1) return slotIndex;
            return null;
        },

        isCurrentToolSlot(slot, instanceIndex) {
            if (!Number.isInteger(this.currentTool) || this.currentTool < 0) return false;
            const slotTool = this.getSlotToolNumber(slot, instanceIndex);
            return slotTool !== null && slotTool === this.currentTool;
        },
        
        openColorPicker(instanceIndex, slotIndex, currentColor, toolNumber, material, temp, slotObj) {
            const panel = this.instancesPanels.find(p => p.index === instanceIndex);
            const locked = (panel && panel.rfidSyncEnabled && slotIndex !== undefined) ? (panel.slots.find(s => s.index === slotIndex)?.rfid === 2) : false;
            if (locked) return;
            this.colorPickerTarget = { instanceIndex, slotIndex, toolNumber, material, temp, slotObj };
            const picker = this.$refs.globalColorPicker;
            if (picker) {
                const hex = slotObj?.hex || this.getColorHex(currentColor);
                picker.value = hex;
                picker.click();
            }
        },

        handleColorPicked(event) {
            if (!this.colorPickerTarget) return;
            const { instanceIndex, slotIndex, toolNumber, material, temp, slotObj } = this.colorPickerTarget;
            const hex = event.target.value;
            if (slotObj) slotObj.hex = hex;
            this.setSlotColor(slotIndex, instanceIndex, hex, toolNumber, material, temp);
            this.colorPickerTarget = null;
        },
        
        formatTime(minutes) {
            if (!minutes || minutes <= 0) return `0 ${this.t('time.minutes')}`;
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            if (hours > 0) return `${hours}${this.t('time.hours')} ${mins}${this.t('time.minutesShort')}`;
            return `${mins} ${this.t('time.minutes')}`;
        },
        
        formatRemainingTime(minutes) {
            if (!minutes || minutes <= 0) return `0${this.t('time.minutesShort')} 0${this.t('time.secondsShort')}`;
            const totalMinutes = Math.floor(minutes);
            const fractionalPart = minutes - totalMinutes;
            const seconds = Math.round(fractionalPart * 60);
            if (totalMinutes > 0) {
                if (seconds > 0) return `${totalMinutes}${this.t('time.minutesShort')} ${seconds}${this.t('time.secondsShort')}`;
                return `${totalMinutes}${this.t('time.minutesShort')}`;
            }
            return `${seconds}${this.t('time.secondsShort')}`;
        },
        
        showNotification(message, type = 'info') {
            this.notification = {
                show: true,
                message: message,
                type: type
            };
            setTimeout(() => { this.notification.show = false; }, 3000);
        },

        // Endless Spool
        async toggleEndlessSpool() {
            const cmd = this.endlessSpoolEnabled ? 'ACE_ENABLE_ENDLESS_SPOOL' : 'ACE_DISABLE_ENDLESS_SPOOL';
            const success = await this.executeCommand(cmd, {});
            if (!success) this.endlessSpoolEnabled = !this.endlessSpoolEnabled;
        },
        async setEndlessSpoolMode() {
            await this.executeCommand('ACE_SET_ENDLESS_SPOOL_MODE', { MODE: this.endlessSpoolMode });
        },

        // Connection Diagnostics
        async loadConnectionStatus() {
            try {
                const response = await fetch(`${this.apiBase}/server/ace/command`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command: 'ACE_GET_CONNECTION_STATUS', params: {} })
                });
                const result = await response.json();
                if (result.result && Array.isArray(result.result)) {
                    this.connectionDetails = result.result;
                } else if (result.result && typeof result.result === 'object') {
                    this.connectionDetails = Object.entries(result.result).map(([inst, data]) => ({ instance: parseInt(inst), ...data }));
                } else {
                    this.connectionDetails = [];
                }
            } catch (e) {
                console.error('Failed to load connection status', e);
            }
        },
        
        getInstanceConnectionClass(instanceIndex) {
            const panel = this.instancesPanels.find(p => p.index === instanceIndex);
            if (!panel) return 'unknown';
            return panel.connectionState || 'unknown';
        },
        
        getInstanceConnectionTooltip(instanceIndex) {
            const det = this.connectionDetails.find(d => d.instance === instanceIndex);
            if (!det) return 'Unknown';
            return `Connected: ${det.connected ? 'Yes' : 'No'}, Stable: ${det.stable ? 'Yes' : 'No'}, Reconnects: ${det.recent_reconnects || 0}`;
        },
        
        async reconnectInstance(instanceIndex) {
            await this.executeCommand('ACE_RECONNECT', { INSTANCE: instanceIndex, DELAY: 2 });
            setTimeout(() => this.loadConnectionStatus(), 3000);
        },
        
        refreshConnectionStatus() {
            this.loadConnectionStatus();
        },

        // Color Modal
        openColorModal(instanceIndex, slot) {
            if (this.isSlotLocked({ index: instanceIndex }, slot)) return;
            this.colorModalContext = { instanceIndex, slot };
            this.selectedColorHex = slot.hex || this.getColorHex(slot.color);
            this.showColorModal = true;
        },
        closeColorModal() {
            this.showColorModal = false;
            this.colorModalContext = null;
        },
        async saveColor() {
            if (!this.colorModalContext) return;
            const { instanceIndex, slot } = this.colorModalContext;
            const hex = this.selectedColorHex;
            if (!/^#?[0-9a-fA-F]{6}$/.test(hex.replace('#', ''))) {
                this.showNotification('Invalid hex color', 'error');
                return;
            }
            const normalizedHex = hex.startsWith('#') ? hex : `#${hex}`;
            slot.hex = normalizedHex;
            const rgb = this.hexToRgb(normalizedHex);
            if (!rgb) return;
            await this.setSlotColor(slot.index, instanceIndex, normalizedHex, slot.tool, slot.material, slot.temp);
            this.closeColorModal();
        },

        // Instance overview helpers
        selectInstance(index) {
            this.selectedInstance = index;
            this.onInstanceChange();
        },
        getInstanceAvgColor(instanceIndex) {
            const inst = this.instancesPanels.find(p => p.index === instanceIndex);
            if (!inst || !inst.slots.length) return '#888';
            const nonEmpty = inst.slots.find(s => s.status === 'ready' && s.color && s.color.some(c => c > 0));
            if (nonEmpty) return this.getColorHex(nonEmpty.color);
            return '#888';
        },

        // Spool animation
        isAnimating(instIndex, slotIndex) {
            return this.animatingSlots[`${instIndex}-${slotIndex}`] || false;
        },
        startAnimation(instIndex, slotIndex) {
            const key = `${instIndex}-${slotIndex}`;
            this.animatingSlots = { ...this.animatingSlots, [key]: true };
            setTimeout(() => {
                const newState = { ...this.animatingSlots };
                delete newState[key];
                this.animatingSlots = newState;
            }, 1000);
        },

        // ---------- DYNAMIC TEMPERATURE DETECTION ----------
        async discoverPrinterObjects() {
            try {
                const response = await fetch(`${this.apiBase}/printer/objects/list`);
                const data = await response.json();
                const objects = data.result?.objects || [];
                this.allObjects = objects;
                
                this.temperatureObjects = objects.filter(obj => 
                    obj.startsWith('extruder') || 
                    obj === 'heater_bed' ||
                    obj.startsWith('heater_generic') ||
                    obj.startsWith('temperature_sensor') ||
                    obj.startsWith('temperature_fan')
                );
                
                this.fanObjects = objects.filter(obj => 
                    obj === 'fan' ||
                    obj.startsWith('heater_fan') ||
                    obj.startsWith('controller_fan') ||
                    obj.startsWith('fan_generic')
                );
                
                if (ACE_DASHBOARD_CONFIG?.debug) {
                    console.log('Detected temperature objects:', this.temperatureObjects);
                    console.log('Detected fan objects:', this.fanObjects);
                }
                
            } catch (e) {
                console.error('Failed to discover printer objects', e);
                this.temperatureObjects = [];
                this.fanObjects = [];
            }
        },
        
        isHeaterObject(objName) {
            return objName.startsWith('extruder') || 
                   objName === 'heater_bed' || 
                   objName.startsWith('heater_generic');
        },
        
        isFanObject(objName) {
            return objName === 'fan' ||
                   objName.startsWith('heater_fan') ||
                   objName.startsWith('controller_fan') ||
                   objName.startsWith('fan_generic') ||
                   objName.startsWith('temperature_fan');
        },
        
        formatObjectName(objName) {
            if (objName === 'heater_bed') return 'Heated Bed';
            if (objName === 'extruder') return 'Extruder';
            if (objName === 'fan') return 'Part Cooling Fan';
            
            const parts = objName.split(' ');
            if (parts.length > 1) {
                const name = parts.slice(1).join(' ');
                return this.formatDisplayName(name);
            }
            
            if (objName.startsWith('extruder')) {
                const num = objName.replace('extruder', '');
                return num ? `Extruder ${num}` : 'Extruder';
            }
            if (objName.startsWith('heater_generic')) {
                const parts = objName.split(' ');
                if (parts.length > 1) {
                    return this.formatDisplayName(parts[1]);
                }
                return 'Heater';
            }
            if (objName.startsWith('temperature_sensor')) {
                const parts = objName.split(' ');
                if (parts.length > 1) {
                    return this.formatDisplayName(parts[1]);
                }
                return 'Temperature Sensor';
            }
            if (objName.startsWith('heater_fan')) {
                const parts = objName.split(' ');
                if (parts.length > 1) {
                    return this.formatDisplayName(parts[1]);
                }
                return 'Heater Fan';
            }
            if (objName.startsWith('controller_fan')) {
                const parts = objName.split(' ');
                if (parts.length > 1) {
                    return this.formatDisplayName(parts[1]);
                }
                return 'Controller Fan';
            }
            if (objName.startsWith('temperature_fan')) {
                const parts = objName.split(' ');
                if (parts.length > 1) {
                    return this.formatDisplayName(parts[1]);
                }
                return 'Temperature Fan';
            }
            if (objName.startsWith('fan_generic')) {
                const parts = objName.split(' ');
                if (parts.length > 1) {
                    return this.formatDisplayName(parts[1]);
                }
                return 'Fan';
            }
            
            return this.formatDisplayName(objName);
        },
        
        formatDisplayName(name) {
            return name.split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        },
        
        getIconForObject(objName) {
            if (objName.startsWith('extruder')) return '🔥';
            if (objName === 'heater_bed') return '🛏️';
            if (objName.startsWith('heater_generic')) return '🔥';
            if (objName.startsWith('temperature_sensor')) return '🌡️';
            if (objName.startsWith('temperature_fan')) return '💨🌡️';
            if (this.isFanObject(objName)) return '💨';
            return '📊';
        },
        
        // ---------- PRINTER DASHBOARD METHODS ----------
        startPrinterPolling() {
            this.fetchPrinterStatus();
            this.printerRefreshTimer = setInterval(this.fetchPrinterStatus, 3000);
        },
        
        async fetchPrinterStatus() {
            try {
                if (!this.temperatureObjects) this.temperatureObjects = [];
                if (!this.fanObjects) this.fanObjects = [];
                
                let query = 'print_stats&toolhead&gcode_move';
                [...this.temperatureObjects, ...this.fanObjects].forEach(obj => {
                    query += `&${obj}`;
                });
                
                const response = await fetch(`${this.apiBase}/printer/objects/query?${query}`);
                const data = await response.json();
                const status = data.result?.status;
                if (status) {
                    this.updatePrinterStatus(status);
                }
            } catch (e) {
                console.error('Failed to fetch printer status', e);
            }
        },
        
        updatePrinterStatus(status) {
            if (status.print_stats) this.printStats = { ...this.printStats, ...status.print_stats };
            if (status.toolhead) this.toolhead = { ...this.toolhead, ...status.toolhead };
            if (status.gcode_move) this.gcodeMove = { ...this.gcodeMove, ...status.gcode_move };

            const newTemperatures = {};
            const newFans = [];
            
            this.temperatureObjects.forEach(objName => {
                if (status[objName]) {
                    newTemperatures[objName] = status[objName];
                }
            });
            
            Object.keys(status).forEach(key => {
                if ((key.startsWith('extruder') || key === 'heater_bed' || 
                     key.startsWith('heater_generic') || key.startsWith('temperature_sensor')) &&
                    !newTemperatures[key]) {
                    newTemperatures[key] = status[key];
                    if (!this.temperatureObjects.includes(key)) {
                        this.temperatureObjects.push(key);
                    }
                }
            });
            
            this.temperatures = newTemperatures;
            
            this.fanObjects.forEach(objName => {
                if (status[objName]) {
                    const fanData = status[objName];
                    if (fanData && fanData.speed !== undefined) {
                        const displayName = this.formatObjectName(objName);
                        const icon = this.getIconForObject(objName);
                        newFans.push({
                            name: objName,
                            displayName: displayName,
                            icon: icon,
                            speed: Math.round(fanData.speed * 100),
                            rpm: fanData.rpm || null,
                            temperature: fanData.temperature
                        });
                    }
                }
            });
            
            ['fan', 'heater_fan', 'controller_fan', 'fan_generic', 'temperature_fan'].forEach(type => {
                Object.keys(status).forEach(key => {
                    if (key.startsWith(type) && !this.fanObjects.includes(key)) {
                        this.fanObjects.push(key);
                        const fanData = status[key];
                        if (fanData && fanData.speed !== undefined) {
                            const displayName = this.formatObjectName(key);
                            const icon = this.getIconForObject(key);
                            newFans.push({
                                name: key,
                                displayName: displayName,
                                icon: icon,
                                speed: Math.round(fanData.speed * 100),
                                rpm: fanData.rpm || null,
                                temperature: fanData.temperature
                            });
                        }
                    }
                });
            });
            
            if (newFans.length) this.fans = newFans;
        },
        
        async fetchJobHistory() {
            try {
                const response = await fetch(`${this.apiBase}/server/history/list?limit=20`);
                const data = await response.json();
                this.history = data.result?.jobs || [];
                if (this.history.length > 0 && !this.selectedJob) {
                    this.selectJob(this.history[0]);
                }
            } catch (e) {
                console.error('Failed to fetch job history', e);
            }
        },
        async selectJob(job) {
            this.selectedJob = job;
            this.jobMetadata = null;
            try {
                const metaResponse = await fetch(`${this.apiBase}/server/files/metadata?filename=${encodeURIComponent(job.filename)}`);
                const metaData = await metaResponse.json();
                this.jobMetadata = metaData.result;
            } catch (e) {
                console.error('Failed to fetch job metadata', e);
            }
        },
        formatDate(timestamp) {
            if (!timestamp) return '';
            const date = new Date(timestamp * 1000);
            return date.toLocaleDateString();
        },
        formatDateTime(timestamp) {
            if (!timestamp) return '';
            return new Date(timestamp * 1000).toLocaleString();
        },
        formatDuration(seconds) {
            if (!seconds) return '-';
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            if (hours > 0) return `${hours}h ${minutes}m`;
            if (minutes > 0) return `${minutes}m ${secs}s`;
            return `${secs}s`;
        },
        formatRemaining(total, elapsed) {
            if (!total || !elapsed) return '-';
            const remaining = total - elapsed;
            return this.formatDuration(remaining);
        },
        formatName(name) {
            return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        },

        // ---------- LAYOUT ENHANCEMENT METHODS ----------
        startAutoScroll(direction) {
            if (this.autoScrollInterval) return;
            
            this.autoScrollInterval = setInterval(() => {
                const container = this.$refs.scrollContainer;
                if (!container) return;
                
                if (direction === 'up') {
                    container.scrollTop -= this.autoScrollSpeed;
                } else if (direction === 'down') {
                    container.scrollTop += this.autoScrollSpeed;
                } else if (direction === 'left') {
                    container.scrollLeft -= this.autoScrollSpeed;
                } else if (direction === 'right') {
                    container.scrollLeft += this.autoScrollSpeed;
                }
            }, 16);
        },

        stopAutoScroll() {
            if (this.autoScrollInterval) {
                clearInterval(this.autoScrollInterval);
                this.autoScrollInterval = null;
            }
        },

        checkAutoScroll(event) {
            if (!this.dragState.active || !this.layoutEditMode) return;
            
            const container = this.$refs.scrollContainer;
            if (!container) return;
            
            const rect = container.getBoundingClientRect();
            const threshold = 50;
            
            let direction = null;
            
            if (event.clientY < rect.top + threshold) {
                direction = 'up';
            } else if (event.clientY > rect.bottom - threshold) {
                direction = 'down';
            } else if (event.clientX < rect.left + threshold) {
                direction = 'left';
            } else if (event.clientX > rect.right - threshold) {
                direction = 'right';
            }
            
            if (direction) {
                this.startAutoScroll(direction);
            } else {
                this.stopAutoScroll();
            }
        },

        updateContainerHeight() {
            let maxBottom = 100;
            
            const cards = [
                'deviceStatus', 'dryer', 'currentPrint', 'temperatures',
                'filamentSlots', 'toolhead', 'recentJobs', 'quickActions'
            ];
            
            cards.forEach(cardId => {
                const bottom = this.cardPositions[cardId].y + this.cardSizes[cardId].height;
                maxBottom = Math.max(maxBottom, bottom);
            });
            
            this.containerHeight = maxBottom + 100;
            
            let maxRight = 100;
            cards.forEach(cardId => {
                const right = this.cardPositions[cardId].x + this.cardSizes[cardId].width;
                maxRight = Math.max(maxRight, right);
            });
            
            const container = this.$refs.scrollContainer;
            if (container && maxRight > container.clientWidth) {
                container.style.minWidth = maxRight + 50 + 'px';
            }
        },

        arrangeHorizontally() {
            let x = 20;
            const y = 20;
            const spacing = 20;
            
            const cards = [
                'deviceStatus', 'dryer', 'currentPrint', 'temperatures',
                'filamentSlots', 'toolhead', 'recentJobs', 'quickActions'
            ];
            
            cards.forEach(cardId => {
                this.cardPositions[cardId].x = x;
                this.cardPositions[cardId].y = y;
                x += this.cardSizes[cardId].width + spacing;
            });
            
            this.applyCardPositions();
            this.saveCardLayout();
        },

        arrangeVertically() {
            const x = 20;
            let y = 20;
            const spacing = 20;
            
            const cards = [
                'deviceStatus', 'dryer', 'currentPrint', 'temperatures',
                'filamentSlots', 'toolhead', 'recentJobs', 'quickActions'
            ];
            
            cards.forEach(cardId => {
                this.cardPositions[cardId].x = x;
                this.cardPositions[cardId].y = y;
                y += this.cardSizes[cardId].height + spacing;
            });
            
            this.applyCardPositions();
            this.saveCardLayout();
        },

        toggleSnapToGrid() {
            this.snapToGrid = !this.snapToGrid;
            this.showNotification(`Snap to grid ${this.snapToGrid ? 'enabled' : 'disabled'}`, 'info');
        },

        applyCardPositions() {
            // Prevent applying inline positions on mobile
            if (this.isMobile) return;
            
            const cards = [
                'deviceStatus', 'dryer', 'currentPrint', 'temperatures',
                'filamentSlots', 'toolhead', 'recentJobs', 'quickActions'
            ];
            
            cards.forEach(cardId => {
                const card = this.$refs[`${cardId}Card`];
                if (card) {
                    card.style.left = this.cardPositions[cardId].x + 'px';
                    card.style.top = this.cardPositions[cardId].y + 'px';
                    card.style.width = this.cardSizes[cardId].width + 'px';
                    card.style.height = this.cardSizes[cardId].height + 'px';
                }
            });
            
            this.updateContainerHeight();
        },

        onContainerScroll() {},

        // ---------- DRAG AND RESIZE ----------
        startDrag(event, cardId) {
            if (!this.layoutEditMode) return;
            
            const target = event.target;
            if (target.closest('button') || 
                target.closest('select') || 
                target.closest('input') || 
                target.closest('.spool') ||
                target.closest('.resize-handle')) {
                return;
            }
            
            event.preventDefault();
            
            const card = this.$refs[`${cardId}Card`];
            if (!card) return;
            
            const rect = card.getBoundingClientRect();
            const containerRect = card.parentElement.getBoundingClientRect();
            
            this.dragState = {
                active: true,
                cardId: cardId,
                startX: event.clientX,
                startY: event.clientY,
                startLeft: rect.left - containerRect.left,
                startTop: rect.top - containerRect.top,
                startWidth: rect.width,
                startHeight: rect.height,
                resizeDirection: null,
                guideX: null,
                guideY: null
            };
            
            card.style.cursor = 'grabbing';
            card.style.zIndex = '1000';
        },
        
        startResize(event, cardId, direction) {
            if (!this.layoutEditMode) return;
            event.preventDefault();
            event.stopPropagation();
            
            const card = this.$refs[`${cardId}Card`];
            if (!card) return;
            
            const rect = card.getBoundingClientRect();
            const containerRect = card.parentElement.getBoundingClientRect();
            
            this.dragState = {
                active: true,
                cardId: cardId,
                startX: event.clientX,
                startY: event.clientY,
                startLeft: rect.left - containerRect.left,
                startTop: rect.top - containerRect.top,
                startWidth: rect.width,
                startHeight: rect.height,
                resizeDirection: direction,
                guideX: null,
                guideY: null
            };
            
            card.style.zIndex = '1000';
        },
        
        checkAlignment(newLeft, newTop, newWidth, newHeight, isResize) {
            let guideX = null;
            let guideY = null;
            
            const otherCards = [
                'deviceStatus', 'dryer', 'currentPrint', 'temperatures',
                'filamentSlots', 'toolhead', 'recentJobs', 'quickActions'
            ].filter(id => id !== this.dragState.cardId);
            
            for (const otherId of otherCards) {
                const otherLeft = this.cardPositions[otherId].x;
                const otherRight = otherLeft + this.cardSizes[otherId].width;
                const cardRight = newLeft + newWidth;
                
                if (Math.abs(newLeft - otherLeft) < this.snapTolerance) {
                    guideX = otherLeft;
                    newLeft = otherLeft;
                }
                if (Math.abs(cardRight - otherRight) < this.snapTolerance) {
                    guideX = otherRight - newWidth;
                    newLeft = otherRight - newWidth;
                }
                const otherCenter = otherLeft + this.cardSizes[otherId].width / 2;
                const cardCenter = newLeft + newWidth / 2;
                if (Math.abs(cardCenter - otherCenter) < this.snapTolerance) {
                    guideX = otherCenter - newWidth / 2;
                    newLeft = otherCenter - newWidth / 2;
                }
            }
            
            for (const otherId of otherCards) {
                const otherTop = this.cardPositions[otherId].y;
                const otherBottom = otherTop + this.cardSizes[otherId].height;
                const cardBottom = newTop + newHeight;
                
                if (Math.abs(newTop - otherTop) < this.snapTolerance) {
                    guideY = otherTop;
                    newTop = otherTop;
                }
                if (Math.abs(cardBottom - otherBottom) < this.snapTolerance) {
                    guideY = otherBottom - newHeight;
                    newTop = otherBottom - newHeight;
                }
                const otherMiddle = otherTop + this.cardSizes[otherId].height / 2;
                const cardMiddle = newTop + newHeight / 2;
                if (Math.abs(cardMiddle - otherMiddle) < this.snapTolerance) {
                    guideY = otherMiddle - newHeight / 2;
                    newTop = otherMiddle - newHeight / 2;
                }
            }
            
            this.dragState.guideX = guideX;
            this.dragState.guideY = guideY;
            
            return { newLeft, newTop };
        },
        
        onDragMove(event) {
            if (!this.dragState.active || !this.layoutEditMode) return;
            event.preventDefault();
            
            this.checkAutoScroll(event);
            
            const { cardId, startX, startY, startLeft, startTop, startWidth, startHeight, resizeDirection } = this.dragState;
            const card = this.$refs[`${cardId}Card`];
            if (!card) return;
            
            const container = card.parentElement;
            const containerRect = container.getBoundingClientRect();
            
            const dx = event.clientX - startX;
            const dy = event.clientY - startY;
            
            if (resizeDirection) {
                let newWidth = startWidth;
                let newHeight = startHeight;
                let newLeft = startLeft;
                let newTop = startTop;
                
                if (resizeDirection.includes('e')) {
                    newWidth = Math.max(150, startWidth + dx);
                }
                if (resizeDirection.includes('w')) {
                    const potentialWidth = Math.max(150, startWidth - dx);
                    newWidth = potentialWidth;
                    newLeft = startLeft + (startWidth - potentialWidth);
                }
                if (resizeDirection.includes('s')) {
                    newHeight = Math.max(120, startHeight + dy);
                }
                if (resizeDirection.includes('n')) {
                    const potentialHeight = Math.max(120, startHeight - dy);
                    newHeight = potentialHeight;
                    newTop = startTop + (startHeight - potentialHeight);
                }
                
                if (this.snapToGrid) {
                    newWidth = Math.round(newWidth / this.gridSize) * this.gridSize;
                    newHeight = Math.round(newHeight / this.gridSize) * this.gridSize;
                    newLeft = Math.round(newLeft / this.gridSize) * this.gridSize;
                    newTop = Math.round(newTop / this.gridSize) * this.gridSize;
                }
                
                const aligned = this.checkAlignment(newLeft, newTop, newWidth, newHeight, true);
                newLeft = aligned.newLeft;
                newTop = aligned.newTop;
                
                newLeft = Math.max(0, Math.min(containerRect.width - newWidth, newLeft));
                newTop = Math.max(0, Math.min(containerRect.height - newHeight, newTop));
                
                card.style.width = newWidth + 'px';
                card.style.height = newHeight + 'px';
                card.style.left = newLeft + 'px';
                card.style.top = newTop + 'px';
                
                this.cardSizes[cardId].width = newWidth;
                this.cardSizes[cardId].height = newHeight;
                this.cardPositions[cardId].x = newLeft;
                this.cardPositions[cardId].y = newTop;
                
            } else {
                let newLeft = startLeft + dx;
                let newTop = startTop + dy;
                
                if (this.snapToGrid) {
                    newLeft = Math.round(newLeft / this.gridSize) * this.gridSize;
                    newTop = Math.round(newTop / this.gridSize) * this.gridSize;
                }
                
                const aligned = this.checkAlignment(newLeft, newTop, startWidth, startHeight, false);
                newLeft = aligned.newLeft;
                newTop = aligned.newTop;
                
                newLeft = Math.max(0, Math.min(containerRect.width - startWidth, newLeft));
                newTop = Math.max(0, Math.min(containerRect.height - startHeight, newTop));
                
                card.style.left = newLeft + 'px';
                card.style.top = newTop + 'px';
                
                this.cardPositions[cardId].x = newLeft;
                this.cardPositions[cardId].y = newTop;
            }
            
            this.updateContainerHeight();
        },
        
        onDragEnd() {
            if (this.dragState.active && this.layoutEditMode) {
                const { cardId } = this.dragState;
                const card = this.$refs[`${cardId}Card`];
                if (card) {
                    card.style.cursor = '';
                    card.style.zIndex = '';
                }
                this.autoSaveLayout();
            }
            this.dragState.active = false;
            this.dragState.guideX = null;
            this.dragState.guideY = null;
            this.stopAutoScroll();
        },

        toggleLayoutEdit() {
            if (this.isMobile) {
                this.showNotification('Layout editing is not available on mobile', 'info');
                return;
            }
            this.layoutEditMode = !this.layoutEditMode;
            if (!this.layoutEditMode) {
                this.saveCardLayout();
            } else {
                this.$nextTick(() => {
                    this.updateContainerHeight();
                });
            }
        },

        saveCardLayout() {
            try {
                localStorage.setItem('aceDashboardLayout', JSON.stringify({
                    positions: this.cardPositions,
                    sizes: this.cardSizes
                }));
                this.showNotification('Layout saved', 'success');
            } catch (e) {
                console.warn('Failed to save layout', e);
            }
        },

        loadCardLayout() {
            try {
                const saved = localStorage.getItem('aceDashboardLayout');
                if (saved) {
                    const { positions, sizes } = JSON.parse(saved);
                    if (positions) this.cardPositions = positions;
                    if (sizes) this.cardSizes = sizes;
                    
                    // Only apply positions if not on mobile
                    if (!this.isMobile) {
                        this.$nextTick(() => {
                            this.applyCardPositions();
                        });
                    }
                }
            } catch (e) {
                console.warn('Failed to load layout', e);
            }
        },

        resetCardLayout() {
            // Prevent reset on mobile
            if (this.isMobile) {
                this.showNotification('Layout reset not available on mobile', 'info');
                return;
            }
            this.cardPositions = {
                deviceStatus: { x: 20, y: 20 },
                dryer: { x: 390, y: 20 },
                currentPrint: { x: 760, y: 20 },
                temperatures: { x: 20, y: 260 },
                filamentSlots: { x: 390, y: 260 },
                toolhead: { x: 760, y: 260 },
                recentJobs: { x: 20, y: 540 },
                quickActions: { x: 390, y: 540 }
            };
            this.cardSizes = {
                deviceStatus: { width: 350, height: 220 },
                dryer: { width: 350, height: 220 },
                currentPrint: { width: 350, height: 220 },
                temperatures: { width: 350, height: 260 },
                filamentSlots: { width: 350, height: 260 },
                toolhead: { width: 350, height: 260 },
                recentJobs: { width: 350, height: 280 },
                quickActions: { width: 350, height: 280 }
            };
            
            this.applyCardPositions();
            this.saveCardLayout();
            this.showNotification('Layout reset to default', 'success');
        },

        autoSaveLayout() {
            if (this.layoutEditMode) {
                this.saveCardLayout();
            }
        },

        updateDryerInstance() {
            console.log('Dryer now controls', this.dryerInstance);
        },

        // ---------- EXPORT/IMPORT ----------
        exportSettings() {
            const data = {
                instances: this.instancesPanels.map(inst => ({
                    index: inst.index,
                    slots: inst.slots.map(slot => ({
                        index: slot.index,
                        material: slot.material,
                        color: slot.color,
                        temp: slot.temp,
                        hex: slot.hex
                    }))
                })),
                layout: {
                    positions: this.cardPositions,
                    sizes: this.cardSizes
                },
                // Include mobile expand/collapse state
                cardExpanded: this.cardExpanded
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ace-settings-${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        },
        
        triggerImport() {
            this.$refs.importFile.click();
        },
        
        async importSettings(event) {
            const file = event.target.files[0];
            if (!file) return;
            const text = await file.text();
            try {
                const data = JSON.parse(text);
                
                if (data.instances && Array.isArray(data.instances)) {
                    for (const inst of data.instances) {
                        const targetInst = this.instancesPanels.find(p => p.index === inst.index);
                        if (!targetInst) continue;
                        for (const slotData of inst.slots) {
                            const targetSlot = targetInst.slots.find(s => s.index === slotData.index);
                            if (!targetSlot) continue;
                            await this.setSlotColor(
                                slotData.index,
                                inst.index,
                                slotData.hex || this.getColorHex(slotData.color),
                                targetSlot.tool,
                                slotData.material,
                                slotData.temp
                            );
                        }
                    }
                }
                
                if (data.layout) {
                    if (data.layout.positions) {
                        this.cardPositions = data.layout.positions;
                    }
                    if (data.layout.sizes) {
                        this.cardSizes = data.layout.sizes;
                    }
                    
                    this.$nextTick(() => {
                        const cards = [
                            'deviceStatus', 'dryer', 'currentPrint', 'temperatures',
                            'filamentSlots', 'toolhead', 'recentJobs', 'quickActions'
                        ];
                        cards.forEach(cardId => {
                            const card = this.$refs[`${cardId}Card`];
                            if (card) {
                                card.style.left = this.cardPositions[cardId].x + 'px';
                                card.style.top = this.cardPositions[cardId].y + 'px';
                                card.style.width = this.cardSizes[cardId].width + 'px';
                                card.style.height = this.cardSizes[cardId].height + 'px';
                            }
                        });
                        this.updateContainerHeight();
                    });
                    
                    this.saveCardLayout();
                }

                // Restore mobile expand/collapse state
                if (data.cardExpanded) {
                    this.cardExpanded = data.cardExpanded;
                }
                
                this.showNotification('Settings and layout imported successfully', 'success');
                this.loadStatus();
            } catch (e) {
                this.showNotification(`Import failed: ${e.message}`, 'error');
            } finally {
                event.target.value = '';
            }
        },

        // ---------- MOONRAKER PRINTER SYNC ----------
        async saveToPrinter() {
            const filename = 'ace_dashboard_settings.json';
            const root = 'config';  // Moonraker's config directory

            // Prepare data (same structure as export, including cardExpanded)
            const data = {
                instances: this.instancesPanels.map(inst => ({
                    index: inst.index,
                    slots: inst.slots.map(slot => ({
                        index: slot.index,
                        material: slot.material,
                        color: slot.color,
                        temp: slot.temp,
                        hex: slot.hex
                    }))
                })),
                layout: {
                    positions: this.cardPositions,
                    sizes: this.cardSizes
                },
                cardExpanded: this.cardExpanded
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const formData = new FormData();
            formData.append('file', blob, filename);
            formData.append('root', root);

            try {
                const response = await fetch(`${this.apiBase}/server/files/upload`, {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    this.showNotification('Settings saved to printer successfully', 'success');
                } else {
                    const errorText = await response.text();
                    throw new Error(errorText || `HTTP ${response.status}`);
                }
            } catch (error) {
                console.error('Save to printer error:', error);
                this.showNotification('Failed to save to printer: ' + error.message, 'error');
            }
        },

        async loadFromPrinter() {
            const filename = 'ace_dashboard_settings.json';
            const path = `config/${filename}`;  // Moonraker serves files from /server/files/<path>

            try {
                const response = await fetch(`${this.apiBase}/server/files/${path}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        // File doesn't exist yet – silently ignore
                        return;
                    }
                    throw new Error(`HTTP ${response.status}`);
                }
                const data = await response.json();

                // Apply instances data
                if (data.instances && Array.isArray(data.instances)) {
                    for (const inst of data.instances) {
                        const targetInst = this.instancesPanels.find(p => p.index === inst.index);
                        if (!targetInst) continue;
                        for (const slotData of inst.slots) {
                            const targetSlot = targetInst.slots.find(s => s.index === slotData.index);
                            if (!targetSlot) continue;
                            await this.setSlotColor(
                                slotData.index,
                                inst.index,
                                slotData.hex || this.getColorHex(slotData.color),
                                targetSlot.tool,
                                slotData.material,
                                slotData.temp
                            );
                        }
                    }
                }

                // Apply layout
                if (data.layout) {
                    if (data.layout.positions) this.cardPositions = data.layout.positions;
                    if (data.layout.sizes) this.cardSizes = data.layout.sizes;
                    this.$nextTick(() => {
                        if (!this.isMobile) {
                            this.applyCardPositions();
                        }
                        this.updateContainerHeight();
                    });
                    this.saveCardLayout(); // also save to localStorage
                }

                // Restore mobile expand/collapse state
                if (data.cardExpanded) {
                    this.cardExpanded = data.cardExpanded;
                }

                this.showNotification('Settings loaded from printer successfully', 'success');
                this.loadStatus(); // refresh status
            } catch (error) {
                console.error('Load from printer error:', error);
                // Only show error if it's not a 404 (file not found)
                if (!error.message.includes('404')) {
                    this.showNotification('Failed to load from printer: ' + error.message, 'error');
                }
            }
        }
    }
}).mount('#app');