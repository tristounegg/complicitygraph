export async function populateSelectors() {
    // Populate countries
    //  to do : need to link accomplices with countries first in the backend
    console.log("Fetching countries from API");

    const countryResponse =  await fetch("/api/v1/wikidata/country/");
    console.log("Fetching countries from API", countryResponse);
    // const countrySelector = document.getElementById("countrySelector");
    // countryResponse.forEach(country => {
    //     const option = document.createElement("option");
    //     option.value = country.name;
    //     option.textContent = country.name;
    //     countrySelector.appendChild(option);
    // });

    // // Populate accomplices
    // const accompliceResponse =  fetch("/api/v1/wikidata/accomplice/");
    //     console.log("Fetching accompliceResponse from API", accompliceResponse);

    // let accompliceData = fetch("/api/v1/wikidata/accomplice/").then(res => res.json());
    // const accompliceSelector = document.getElementById("accompliceSelector");
    // accompliceData.forEach(accomplice => {
    //     const option = document.createElement("option");
    //     option.value = accomplice.id;
    //     option.textContent = accomplice.label;
    //     accompliceSelector.appendChild(option);
    // });
};
