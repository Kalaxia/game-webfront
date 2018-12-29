import Api from '../core/api.js';
import Ship from './ship/ship.js';
import ShipGroup from './ship/group.js';
import Player from './player.js';
import Planet from './planet.js';
import Journey from './journey.js';

export default class Fleet {
    constructor(data) {
        this.id = data.id;
        this.player = new Player(data.player);
        this.location = new Planet(data.location);
        if (data.journey !== null) {
            this.journey = new Journey(data.journey);
        }
        this.ships = new Array();
        this.shipGroups = new Array();
        this.map_pos_x = data.map_pos_x;
        this.map_pos_y = data.map_pos_y;
    };
    
    static fetch(id) {
        return fetch(`/api/fleets/${id}`, { 
            method: 'GET',
            headers: Api.headers
        })
        .then(Api.responseMiddleware)
        .then(data => {
            return new Fleet(data);
        })
    };

    static fetchPlayerFleets() {
        return fetch(`/api/fleets`, {
          method: 'GET',
          headers: Api.headers
        })
        .then(Api.responseMiddleware)
        .then(data => {
            const fleets = new Array();
            for (const fleetData of data) {
                fleets.push(new Fleet(fleetData));
            }
            return fleets;
        });
    };

    static fetchPlanetFleets(planetId) {
        return fetch(`/api/planets/${planetId}/fleets`, {
          method: 'GET',
          headers: Api.headers
        })
        .then(Api.responseMiddleware)
        .then(data => {
            const fleets = new Array();
            for (const fleetData of data) {
                fleets.push(new Fleet(fleetData));
            }
            return fleets;
        });
    };

    create() {
        return fetch(`/api/fleets`, {
            method: 'POST',
            body: JSON.stringify({ planet_id: this.location.id }),
            headers: Api.headers
        }).then(Api.responseMiddleware).then(data => {
            this.id = data.id;
        });
    };
    
    fetchShips() {
        return fetch(`/api/fleets/${this.id}/ships`, { 
          method: 'GET',
          headers: Api.headers
        })
        .then(Api.responseMiddleware)
        .then(data => {
            this.ships = new Array();
            for (const shipData of data) {
                this.ships.push(new Ship(shipData));
            }
        });
    };
    
    fetchShipGroups() {
        return fetch(`/api/fleets/${this.id}/ships/groups`, { 
          method: 'GET',
          headers: Api.headers
        })
        .then(Api.responseMiddleware)
        .then(data => {
            this.shipGroups = new Array();
            for (const groupData of data) {
                this.shipGroups.push(new ShipGroup(groupData));
            }
        });
    };
    
    transferShips(shipGroup, quantity) {
        return fetch(`/api/fleets/${this.id}/ships`, {
            method: 'PATCH',
            body: JSON.stringify({
                'model-id': shipGroup.id,
                quantity: quantity
            }),
            headers: Api.headers
        }).then(Api.responseMiddleware).then(data => {
            this.updateShipGroups(shipGroup, data.quantity);
            this.location.updateShipGroups(shipGroup, -data.quantity);
        });
    }

    updateShipGroups(shipGroup, nbShips) {
        let index = -1;
        for (const sg of this.shipGroups) {
            if (sg.id === shipGroup.id) {
                index = this.shipGroups.indexOf(sg);
                sg.quantity += nbShips;
                break;
            }
        }
        if (index === -1 && nbShips > 0) {
            this.shipGroups.push(Object.assign({}, shipGroup, { quantity: nbShips }));
        } else if (index >= 0 && this.shipGroups[index].quantity === 0) {
            this.shipGroups.splice(index, 1);
        }
    }
    
    remove() {
        return fetch(`/api/fleets/${this.id}`, {
            method: 'DELETE',
            headers: Api.headers
        }).then(Api.responseMiddleware);
    }
    
    fetchRange() {
        return fetch(`/api/fleets/${this.id}/range`, {
            method: 'GET',
            headers: Api.headers
        }).then(Api.responseMiddleware);
    }
    
    static fetchRangeStatic() {
        return fetch(`/api/fleets/range`, {
            method: 'GET',
            headers: Api.headers
        }).then(Api.responseMiddleware);
    }
    
    sendOnJourney(positionArray) {
        return Journey.sendOnJourney(this.id, { steps: positionArray });
    }
};