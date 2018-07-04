getCurrentPlayer().then(() => {
  var profileLink = document.createElement('a');
  profileLink.href = '/views/profile';
  profileLink.innerText = player.pseudo;
  document.querySelector("#player-data h3").appendChild(profileLink);
});

let planetId = getCurrentPlanet();
let ship = {};

let shipFramesData;
let shipModulesData;

fetch('/config/ship_frames.json', {cache: "no-store"})
.then(response => response.json())
.then(frames => {
  shipFramesData = frames;
});

fetch('/config/ship_modules.json', {cache: "no-store"})
.then(response => response.json())
.then(modules => {
  shipModulesData = modules;
});

const initShipyard = () => fetch('/api/me/ship-models', {
        method: 'GET',
        headers: headers
    })
    .then(apiResponseMiddleware)
    .then(shipModels => {
        let list = document.querySelector('#ships-list > section');

        for (let model of shipModels) {
            let element = document.createElement('div');
            element.classList.add('ship');
            let picture = (shipFramesData[model.frame].picture !== '') ? `<img src="/static/images/shipyard/frame_${shipFramesData[model.frame].picture}" />` : '#';
            element.innerHTML = `<header>${picture}</header><footer>${model.name}</footer>`;

            list.append(element);
        }
    })
;

const createShipModel = () => {
    console.log(ship);
};

const displayFrames = () => {
    document.querySelector('#ship-vizualizer').style.display = 'none';
    document.querySelector('#ship-data').style.display = 'none';
    document.querySelector('#modules').style.display = 'none';
    document.querySelector('#ships-list').style.display = 'block';
    let container = document.querySelector('#frames');
    container.style.display = 'block';
    let list = container.querySelector('section');
    list.innerHTML = '';

    for (let frameSlug in shipFramesData) {
        let frame = shipFramesData[frameSlug];
        let element = document.createElement('div');
        let picture = (frame.picture !== '') ? `<img src="/static/images/shipyard/frame_${frame.picture}" />` : '#';
        element.classList.add('frame');
        element.setAttribute('data-frame-slug', frameSlug)
        element.addEventListener('click', chooseFrame);
        element.innerHTML = `<header>${picture}</header><footer>${dictionnary.ships.frames[frameSlug]}</footer>`
        list.append(element);
    }
};

const chooseFrame = event => {
    let frameElement = event.currentTarget;
    if (frameElement === null) {
        return;
    }
    let frameSlug = frameElement.getAttribute('data-frame-slug');
    let frame = shipFramesData[frameSlug];
    document.querySelector('#frames').style.display = "none";
    let vizualizer = document.querySelector('#ship-vizualizer');
    vizualizer.style.display = 'block';
    vizualizer.querySelector('header > h3').innerText = dictionnary.ships.frames[frameSlug];
    ship = { frame: frameSlug, slots: {} };
    displaySlots(frame);
    removeModuleData();

    document.querySelector('#ship-data').style.display = 'block';
    document.querySelector('#modules').style.display = 'flex';
    document.querySelector('#modules > section').innerHTML = '';
    document.querySelector('#ships-list').style.display = 'none';
    displayShipStats();
};

const displaySlots = frame => {
    let vizualizer = document.querySelector('#ship-vizualizer > section');
    let picture = (frame.picture !== '') ? `<img src="/static/images/shipyard/frame_${frame.picture}" />` : '#';
    vizualizer.innerHTML = `<div id="ship-image">${picture}</div>`;

    for (slot of frame.slots) {
        let element = document.createElement('div');
        element.classList.add('slot');
        element.setAttribute('data-position', slot.position);
        element.setAttribute('data-size', slot.size);
        element.setAttribute('data-shape', slot.shape);
        element.addEventListener('click', displayModules);
        element.addEventListener('mouseenter', displaySlotModuleData);
        element.addEventListener('mouseleave', removeModuleData);

        ship.slots[slot.position] = {
            shape: slot.shape,
            size: slot.size,
            module: null,
        };

        for (position of ['top', 'right', 'bottom', 'left']) {
            if (typeof slot[position] !== 'undefined') {
                element.style[position] = `${slot[position]}%`;
            }
        }
        vizualizer.append(element);
    }
};

const displayModules = event => {
    let slot = event.currentTarget;
    let previous = document.querySelector('.slot.selected');
    if (previous !== null) {
        previous.classList.remove('selected');
    }
    slot.classList.add('selected');
    let slotData = ship.slots[slot.getAttribute('data-position')];
    let list = document.querySelector('#modules > section');
    list.innerHTML = '';

    for (let moduleSlug in shipModulesData) {
        let module = shipModulesData[moduleSlug];
        if (module.shape !== slotData['shape'] || module.size !== slotData['size']) {
            continue;
        }
        let element = document.createElement('div');
        let picture = (module.picture !== '') ? `module_${module.type}_${module.size}_${module.picture}` : 'module.png';
        let transformScale = '';
        let transform = '';
        if (module.picture_flip_x === true) {
            transformScale += ' scaleX(-1)';
        }
        if (module.picture_flip_y === true) {
            transformScale += ' scaleY(-1)';
        }
        if (module.picture !== '' && transformScale !== '') {
            transform = `transform: ${transformScale}`;
        }
        element.classList.add('module', module.type);
        element.setAttribute('data-slug', moduleSlug);
        element.setAttribute('data-type', module.type);
        element.addEventListener('click', affectModule);
        element.addEventListener('mouseenter', () => { displayModuleData(moduleSlug) });
        element.addEventListener('mouseleave', removeModuleData);
        element.innerHTML = `<div class="${module.shape}" style="background-image: url('/static/images/shipyard/${picture}');${transform}"></div>`;
        list.append(element);
    }
};

const affectModule = event => {
    let slot = document.querySelector('.slot.selected');
    let moduleElement = event.currentTarget;
    ship.slots[slot.getAttribute('data-position')].module = moduleElement.getAttribute('data-slug');

    displayShipStats();

    let moduleStyle = window.getComputedStyle(moduleElement.querySelector('div'), null);
    slot.setAttribute('data-type', moduleElement.getAttribute('data-type'));

    slot.style.transform = moduleStyle.transform;
    slot.style.backgroundImage = moduleStyle.backgroundImage;
};

const displayShipStats = () => {
    const stats = {};
    let prices = {};
    const statsList = document.querySelector('#ship-stats');
    const priceList = document.querySelector('#ship-data > section > .list');
    statsList.innerHTML = '';
    priceList.innerHTML = '';

    for (const key in shipFramesData[ship.frame].stats) {
        stats[key] = (typeof stats[key] !== 'undefined') ? stats[key] + shipFramesData[ship.frame].stats[key] : shipFramesData[ship.frame].stats[key];
    }
    for (const price of shipFramesData[ship.frame].price) {
        const key = (price.type !== 'resource') ? price.type : price.resource;
        if (typeof prices[key] !== 'undefined') {
            prices[key].amount += price.amount;
        } else {
            prices[key] = Object.assign({}, price);
        }
    }
    for (const id of Object.keys(ship.slots)) {
        const slot = ship.slots[id];
        if (slot.module === null || typeof shipModulesData[slot.module].ship_stats === 'undefined') {
            continue;
        }
        for (const key in shipModulesData[slot.module].ship_stats) {
            stats[key] = (typeof stats[key] !== 'undefined') ? stats[key] + shipModulesData[slot.module].ship_stats[key] : shipModulesData[slot.module].ship_stats[key];
        }
        for (const price of shipModulesData[slot.module].price) {
            let key = (price.type !== 'resource') ? price.type : price.resource;
            if (typeof prices[key] !== 'undefined') {
                prices[key].amount += price.amount;
            } else {
                prices[key] = price;
            }
        }
    }
    for (let key in stats) {
        let element = document.createElement('div');
        element.classList.add('stat');
        element.innerHTML = `<header>${dictionnary.ships.stats[key]}</header><section>${stats[key]}</section>`;
        statsList.append(element);
    }
    for (let key in prices) {
        displayPrice(priceList, prices[key]);
    }
    prices = {};
};

const displaySlotModuleData = event => {
    let module = ship.slots[event.target.getAttribute('data-position')].module;
    if (module !== null) {
        displayModuleData(module);
    }
};

const displayModuleData = module => {
    let stats = {};
    let statsList = document.querySelector('#modules > footer');
    statsList.innerHTML = '';
    let priceList = document.querySelector('#modules > header > div');
    priceList.innerHTML = '';
    let moduleData = shipModulesData[module];

    document.querySelector('#modules > header > h3').innerText = dictionnary.ships.modules[module].name;

    let addStat = (list, key, value) => {
        let element = document.createElement('div');
        element.classList.add('stat');
        element.innerHTML = `<header>${dictionnary.ships.stats[key]}</header><section>${value}</section>`;
        list.append(element);
    };
    for (let key in moduleData.stats) {
        addStat(statsList, key, moduleData.stats[key]);
    }
    for (let key in moduleData.ship_stats) {
        addStat(statsList, key, moduleData.ship_stats[key]);
    }
    for (let price of moduleData.price) {
        displayPrice(priceList, price);
    }
};

const displayPrice = (list, price) => {
    let name = '';
    let picto = '/static/images/resources/';

    switch (price.type) {
        case 'credits':
            name = dictionnary.credits;
            picto += 'credits.svg';
            break;
        case 'points':
            name = dictionnary.planet.settings.military;
            picto += 'industry_point.svg';
            break;
        case 'resource':
            name = dictionnary.resources[price.resource];
            picto += resourcesData[price.resource].picto;
            break;
    }

    let element = document.createElement('div');
    element.classList.add('price');
    element.innerHTML = `<header>${name}</header><section>${price.amount} <img src="${picto}"/></section>`;
    list.append(element);
};

const removeModuleData = () => {
    document.querySelector('#modules > header > h3').innerText = '';
    document.querySelector('#modules > header > div').innerHTML = '';
    document.querySelector('#modules > footer').innerHTML = '';

    let slot = document.querySelector('.slot.selected');
    if (slot === null) {
        return;
    }
    let module = ship.slots[slot.getAttribute('data-position')].module
    if (module !== null) {
        displayModuleData(module);
    }
};
