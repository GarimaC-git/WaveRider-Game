
        let gameActive = false;
        let currentLevel = 1;
        let timeLeft = 30;
        let startTime = 0;
        let gameTimer;
        let boat = null;
        let goal = null;
        let boatPosition = { x: 0, y: 0 };
        let boatVelocity = { x: 0, y: 0 };
        let waves = [];
        let levelStartTime = 0;

        const levels = [
            { time: 30, boatStart: { x: 50, y: 80 }, goalPos: { x: 70, y: 20 }, difficulty: 'Easy' },
            { time: 25, boatStart: { x: 20, y: 85 }, goalPos: { x: 80, y: 15 }, difficulty: 'Medium' },
            { time: 20, boatStart: { x: 10, y: 90 }, goalPos: { x: 90, y: 10 }, difficulty: 'Hard' },
            { time: 25, boatStart: { x: 50, y: 90 }, goalPos: { x: 30, y: 30 }, difficulty: 'Expert' },
            { time: 20, boatStart: { x: 80, y: 85 }, goalPos: { x: 20, y: 25 }, difficulty: 'Master' }
        ];

        function startGame() {
            document.getElementById('startScreen').style.display = 'none';
            currentLevel = 1;
            startLevel();
        }

        function startLevel() {
            gameActive = true;
            const level = levels[(currentLevel - 1) % levels.length];
            timeLeft = level.time;
            levelStartTime = Date.now();
            
            updateUI();
            createBoat(level.boatStart);
            createGoal(level.goalPos);
            
            gameTimer = setInterval(gameLoop, 16); // 60 FPS
            
            const timeTimer = setInterval(() => {
                if (!gameActive) {
                    clearInterval(timeTimer);
                    return;
                }
                timeLeft--;
                updateUI();
                if (timeLeft <= 0) {
                    endGame(false);
                    clearInterval(timeTimer);
                }
            }, 1000);
        }

        function createBoat(startPos) {
            if (boat) boat.remove();
            boat = document.createElement('div');
            boat.className = 'boat';
            
            const gameArea = document.getElementById('gameArea');
            const areaRect = gameArea.getBoundingClientRect();
            
            boatPosition.x = (startPos.x / 100) * areaRect.width - 20;
            boatPosition.y = (startPos.y / 100) * areaRect.height - 15;
            boatVelocity = { x: 0, y: 0 };
            
            boat.style.left = boatPosition.x + 'px';
            boat.style.top = boatPosition.y + 'px';
            
            gameArea.appendChild(boat);
        }

        function createGoal(goalPos) {
            if (goal) goal.remove();
            goal = document.createElement('div');
            goal.className = 'goal';
            
            const gameArea = document.getElementById('gameArea');
            const areaRect = gameArea.getBoundingClientRect();
            
            goal.style.left = ((goalPos.x / 100) * areaRect.width - 30) + 'px';
            goal.style.top = ((goalPos.y / 100) * areaRect.height - 30) + 'px';
            
            gameArea.appendChild(goal);
        }

        function gameLoop() {
            if (!gameActive) return;
            
            updateWaves();
            updateBoat();
            checkCollisions();
        }

        function updateWaves() {
            waves = waves.filter(wave => {
                wave.age += 16;
                return wave.age < wave.duration;
            });
        }

        function updateBoat() {
            if (!boat) return;
            
            // Apply wave forces
            let totalForce = { x: 0, y: 0 };
            
            waves.forEach(wave => {
                const distance = Math.sqrt(
                    Math.pow(boatPosition.x - wave.x, 2) + 
                    Math.pow(boatPosition.y - wave.y, 2)
                );
                
                const waveRadius = (wave.age / wave.duration) * wave.maxRadius;
                const waveEdgeDistance = Math.abs(distance - waveRadius);
                
                if (waveEdgeDistance < 30 && wave.age > 100) {
                    const strength = Math.max(0, 1 - (waveEdgeDistance / 30)) * wave.strength;
                    
                    // Calculate direction from wave center to boat
                    const angle = Math.atan2(boatPosition.y - wave.y, boatPosition.x - wave.x);
                    
                    totalForce.x += Math.cos(angle) * strength;
                    totalForce.y += Math.sin(angle) * strength;
                }
            });
            
            // Apply forces to velocity
            boatVelocity.x += totalForce.x * 0.3;
            boatVelocity.y += totalForce.y * 0.3;
            
            // Friction
            boatVelocity.x *= 0.95;
            boatVelocity.y *= 0.95;
            
            // Update position
            boatPosition.x += boatVelocity.x;
            boatPosition.y += boatVelocity.y;
            
            // Boundary checking
            const gameArea = document.getElementById('gameArea');
            const areaRect = gameArea.getBoundingClientRect();
            
            boatPosition.x = Math.max(0, Math.min(areaRect.width - 40, boatPosition.x));
            boatPosition.y = Math.max(0, Math.min(areaRect.height - 30, boatPosition.y));
            
            // Update boat rotation based on velocity
            const rotation = Math.atan2(boatVelocity.y, boatVelocity.x) * (180 / Math.PI);
            boat.style.transform = `rotate(${rotation}deg)`;
            
            boat.style.left = boatPosition.x + 'px';
            boat.style.top = boatPosition.y + 'px';
        }

        function checkCollisions() {
            if (!boat || !goal) return;
            
            const boatRect = boat.getBoundingClientRect();
            const goalRect = goal.getBoundingClientRect();
            
            const distance = Math.sqrt(
                Math.pow(boatRect.left - goalRect.left, 2) + 
                Math.pow(boatRect.top - goalRect.top, 2)
            );
            
            if (distance < 50) {
                endGame(true);
            }
        }

        function createWave(x, y) {
            const wave = {
                x: x,
                y: y,
                age: 0,
                duration: 2000,
                maxRadius: 150,
                strength: 2
            };
            
            waves.push(wave);
            
            // Visual ripple effect
            const ripple = document.createElement('div');
            ripple.className = 'wave-ripple';
            ripple.style.left = (x - 10) + 'px';
            ripple.style.top = (y - 10) + 'px';
            
            document.getElementById('gameArea').appendChild(ripple);
            
            // Wave height indicator
            const waveHeight = document.createElement('div');
            waveHeight.className = 'wave-height';
            waveHeight.style.left = (x - 75) + 'px';
            waveHeight.style.top = y + 'px';
            
            document.getElementById('gameArea').appendChild(waveHeight);
            
            // Particle effects
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const particle = document.createElement('div');
                    particle.className = 'wave-particle';
                    particle.style.left = (x + (Math.random() - 0.5) * 40) + 'px';
                    particle.style.top = (y + (Math.random() - 0.5) * 40) + 'px';
                    
                    document.getElementById('gameArea').appendChild(particle);
                    
                    setTimeout(() => particle.remove(), 2000);
                }, i * 100);
            }
            
            setTimeout(() => {
                ripple.remove();
                waveHeight.remove();
            }, 2000);
        }

        function updateUI() {
            document.getElementById('level').textContent = `Level ${currentLevel}`;
            document.getElementById('timer').textContent = `Time: ${timeLeft}`;
        }

        function endGame(success) {
            gameActive = false;
            clearInterval(gameTimer);
            
            const completionTime = Math.round((Date.now() - levelStartTime) / 1000);
            
            if (success) {
                document.getElementById('gameComplete').classList.add('level-complete');
                document.getElementById('completionTime').textContent = `Completed in ${completionTime}s!`;
                document.getElementById('gameComplete').style.display = 'block';
            } else {
                // Time's up - restart level
                setTimeout(() => {
                    startLevel();
                }, 1000);
            }
        }

        function nextLevel() {
            document.getElementById('gameComplete').style.display = 'none';
            document.getElementById('gameComplete').classList.remove('level-complete');
            currentLevel++;
            
            // Clear existing elements
            waves = [];
            if (boat) boat.remove();
            if (goal) goal.remove();
            
            // Clean up visual elements
            document.querySelectorAll('.wave-ripple, .wave-height, .wave-particle').forEach(el => el.remove());
            
            startLevel();
        }

        function restartGame() {
            document.getElementById('gameComplete').style.display = 'none';
            document.getElementById('gameComplete').classList.remove('level-complete');
            currentLevel = 1;
            
            // Clean up
            waves = [];
            if (boat) boat.remove();
            if (goal) goal.remove();
            document.querySelectorAll('.wave-ripple, .wave-height, .wave-particle').forEach(el => el.remove());
            
            startLevel();
        }

        // Touch and click event handling
        document.getElementById('gameArea').addEventListener('click', function(e) {
            if (!gameActive) return;
            
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            createWave(x, y);
        });

        document.getElementById('gameArea').addEventListener('touchstart', function(e) {
            e.preventDefault();
            if (!gameActive) return;
            
            const rect = e.currentTarget.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            createWave(x, y);
        });

        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function (event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    