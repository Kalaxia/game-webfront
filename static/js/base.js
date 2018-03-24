getCurrentPlayer().then(() => {
  var profileLink = document.createElement('a');
  profileLink.href = '/views/profile';
  profileLink.innerText = player.pseudo;
  document.querySelector("#player-data h3").appendChild(profileLink);
});

var availableBuildings = [];
var planetId = getCurrentPlanet();

const initBase = () => fetch(`/api/planets/${planetId}`, {
        method: 'GET',
        headers: headers
    })
    .then(apiResponseMiddleware)
    .then(data => {
        availableBuildings = data.available_buildings;
        initBuildings(data.buildings, data.nb_buildings);
    })
;

const initBuildings = (buildings, maxBuildings) => {
    var list = document.querySelector('#planet-buildings > section');
    for (let building of buildings) {
        list.appendChild(newBuilding(building));
    }
    if (maxBuildings <= buildings.length) {
        return;
    }
    let area = newBuilding({name: "area"});
    area.addEventListener('click', event => showAvailableBuildings(event, availableBuildings));
    list.appendChild(area);
}

var timers = [];

const newBuilding = data => {
    let buildingInfo = '';let footer = '';let constructionOverlay = '';
    let building = document.createElement('div');
    building.id = (typeof data.id === 'undefined') ? `building-${data.name.replace(/\./g, '-')}` : `building-${data.id}`;
    building.classList.add('building', `category-${buildingsData[data.name].category}`);
    if (typeof data.price !== 'undefined' && data.price !== null) {
        for (price of data.price) {
            let icon = (price.type === 'points') ? 'industry-point' : 'credits';
            buildingInfo += `<div class="price"><span>${price.amount}</span><div class="${icon}"></div></div>`;
        }
        footer += `<footer><div class="build-button" onclick="launchBuildingConstruction('${data.name}');"></div></footer>`
    }
    if (typeof data.status !== 'undefined' && data.status == 'constructing') {
        building.classList.add('constructing');
        building.setAttribute('data-built-at', data.built_at);
        constructionOverlay = '<div class="construction-overlay"></div>';
        buildingInfo += `<div class="countdown"></div>`;
        timers[building.id] = setInterval(() => refreshConstructionCountdown(building.id), 1000);
    }

    building.innerHTML =
        `<header>${constructionOverlay}<img src="/static/images/buildings/${buildingsData[data.name].picture}"/></header>
            <section><h5>${dictionnary.buildings[data.name]}</h5>${buildingInfo}</section>${footer}
        `
    ;
    if (typeof data.duration !== 'undefined' && data.duration !== null) {
        building.setAttribute('data-duration', data.duration);
    }
    return building;
};

const showAvailableBuildings = (event, availableBuildings) => {
    if (event.currentTarget.classList.contains('selected')) {
        return;
    }
    event.currentTarget.classList.add('selected');
    document.querySelector('#planet-available-buildings').classList.add('visible');
    var list = document.querySelector('#planet-available-buildings > section');

    if (list.querySelectorAll('.building').length > 0) {
        return;
    }

    for (building of availableBuildings) {
        list.appendChild(newBuilding(building));
    }
};

const refreshConstructionCountdown = buildingId => {
    var building = document.querySelector(`#${buildingId}`);
    var dateEntered = new Date(building.getAttribute('data-built-at'));
    var now = new Date();
    var difference = dateEntered.getTime() - now.getTime();

    if (difference <= 0) {
        building.classList.remove('constructing');
        building.querySelector('.construction-overlay').remove();
        building.querySelector('.countdown').remove();
        clearInterval(timers[buildingId])
        return;
    }
    var seconds = Math.floor(difference / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);

    hours %= 24;
    minutes %= 60;
    seconds %= 60;

    building.querySelector(`.countdown`).innerHTML = `${hours}:${minutes}:${seconds}`;
}

const launchBuildingConstruction = buildingName => fetch(`/api/planets/${planetId}/buildings`, {
    method: "POST",
    body: JSON.stringify({
        name: buildingName
    }),
    headers: headers
}).then(response => response.json())
.then(building => {
    document.querySelector('.building.category-area.selected').remove();
    let list = document.querySelector('#planet-buildings > section');
    list.appendChild(newBuilding(building));
    if (building.planet.nb_buildings > document.querySelectorAll('#planet-buildings .building').length) {
        let area = newBuilding({name: "area"});
        area.addEventListener('click', event => showAvailableBuildings(event, availableBuildings));
        list.appendChild(area);
    }
    document.querySelector('#planet-available-buildings').classList.remove('visible');
});

window.addEventListener('load', initBase);
