document.addEventListener('DOMContentLoaded', function() {
    const tiles = document.querySelectorAll('.tile');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    let currentIndex = 0;

    function showTile(index) {
        tiles.forEach((tile, i) => {
            tile.classList.toggle('active', i === index);
        });
    }

    prevBtn.addEventListener('click', function() {
        currentIndex = (currentIndex - 1 + tiles.length) % tiles.length;
        showTile(currentIndex);
    });

    nextBtn.addEventListener('click', function() {
        currentIndex = (currentIndex + 1) % tiles.length;
        showTile(currentIndex);
    });

    showTile(currentIndex);
});
