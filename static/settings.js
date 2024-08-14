var myOffcanvas = document.getElementById('offcanvasSettings')
const scrollToTop = document.querySelectorAll('.scroll-to-top');


function addSettings(event) {

    if (lightMode === undefined){
        lightMode = "light"
    }
    const settings = {lightMode};
    // Save the settings in the database using fetch
    fetch("/api/settings", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(settings),
    })
        .then((response) => response.json())
        .catch((error) => console.error(error));
}



function loadSettings() {
    // Fetch the settings from the server
    fetch("/api/settings", {
        method: "GET",
        headers: {"Content-Type": "application/json"},
    })
        .then((response) => response.json())
        .then((settings) => {
            lightMode = settings.lightMode;
        })
        .catch((error) => console.error(error));
}

window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-bs-theme-value]')
        .forEach(toggle => {
            toggle.addEventListener('click', () => {
                let theme;
                theme = toggle.getAttribute('data-bs-theme-value');
                lightMode = theme;
                addSettings(event);
            })
        })
})



scrollToTop.forEach(function (scrollToTop) {
    scrollToTop.addEventListener('click', function (e) {
        e.preventDefault();
        window.scroll({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    });
});


let currentnventurItemIndex = 0; // Keep track of the current item index
document.getElementById('cancel-inventur-button').addEventListener('click', function(){
    currentnventurItemIndex = 0;
})
document.getElementById("inventur").addEventListener("click", function () {
    const edit_btn = document.getElementById('edit-btn-inventur');
    const continue_btn = document.getElementById('continue-btn-inventur');
    const text = document.getElementById('current-item-text');
    const img = document.getElementById('current-item-img');
    const amount = document.getElementById('current-item-amount');
    const minus_btn = document.getElementById('minus-btn-inventur');
    const plus_btn = document.getElementById('plus-btn-inventur');
    // Create an array of objects containing ids and names
    const itemsData = fetchedItems
    // Function to display current item
    const confirmationModal = new bootstrap.Modal(document.getElementById('inventur-modal'));
    confirmationModal.show();
    function displayItem(index) {
        const currentItem = itemsData[index];
        text.innerHTML = currentItem.name;
        amount.innerHTML = currentItem.quantity;
        img.src = currentItem.image;
        fetch(`/api/items/${currentItem.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ action: "locate" }),
        }).catch((error) => console.error(error));
    }

    // Display the first item
    displayItem(currentnventurItemIndex);
    minus_btn.onclick = function() {
        const currentItem = itemsData[currentnventurItemIndex];
        handleQuantityChange(currentItem, -1);
        amount.innerHTML = currentItem.quantity - 1;
    };

    plus_btn.onclick = function() {
        const currentItem = itemsData[currentnventurItemIndex];
        handleQuantityChange(currentItem, + 1);
        amount.innerHTML = currentItem.quantity + 1 ;
    };


    edit_btn.addEventListener("click", function () {
        const currentItem = itemsData[currentnventurItemIndex];
        isEditingItem = true;
        console.log("editing item")
        removeLocalStorage();


        $("#item-modal").modal("show");
        confirmationModal.hide();
        document.getElementById("item_name").value = currentItem.name;
        document.getElementById("item_url").value = currentItem.link;
        document.getElementById("item_image").value = currentItem.image;
        document.getElementById("item_quantity").value = currentItem.quantity;


        // Set item tags for editing
        if (currentItem.tags) {
            const cleanedTags = currentItem.tags.replace(/[\[\]'"`\\]/g, '');
            const itemTagsArray = cleanedTags.split(',');
            localStorage.setItem('item_tags', JSON.stringify(itemTagsArray))
            tags = itemTagsArray;
            loadTagsIntoTagify()
        }

        // Set editing item ID and IP
        editingItemId = currentItem.id;
        // Check if not already editing an item
    });


    // Handle the "continue" button click
    continue_btn.addEventListener("click", function () {
        console.log("Continue clicked for item with ID: " + itemsData[currentnventurItemIndex].id);
        currentnventurItemIndex++; // Move to the next item
        if (currentnventurItemIndex < itemsData.length) {
            // Display the next item if there's any left
            displayItem(currentnventurItemIndex);
        } else {
            console.log("End of items reached.");
            currentnventurItemIndex = 0; // Reset to the beginning
            displayItem(currentnventurItemIndex); // Display the first item again
        }
    });
});



document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    lucide.createIcons();
});
