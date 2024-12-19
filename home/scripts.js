document.addEventListener('DOMContentLoaded', function() {
    const tiles = document.querySelectorAll('.tile');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const timerElement = document.getElementById('timer');
    let currentIndex = 0;
    let timer = 10;
    let timerInterval;

    function showTile(index) {
        tiles.forEach((tile, i) => {
            tile.classList.toggle('active', i === index);
        });
        resetTimer();
    }

    function updateTimer() {
        timer--;
        timerElement.textContent = timer;
        if (timer <= 0) {
            nextSlide();
        }
    }

    function resetTimer() {
        clearInterval(timerInterval);
        timer = 10;
        timerElement.textContent = timer;
        timerInterval = setInterval(updateTimer, 1000);
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % tiles.length;
        showTile(currentIndex);
    }

    prevBtn.addEventListener('click', function() {
        currentIndex = (currentIndex - 1 + tiles.length) % tiles.length;
        showTile(currentIndex);
    });

    nextBtn.addEventListener('click', nextSlide);

    showTile(currentIndex);
});
