import Vue from 'vue';
import VueRouter from 'vue-router';

import Overview from './components/pages/overview';
import Registration from './components/pages/registration';
import Faction from './components/pages/faction/faction';
import Starmap from './components/pages/map/map';
import System from './components/pages/map/system';
import Fleets from './components/pages/fleet/list';
import Fleet from './components/pages/fleet/details';
import Planet from './components/pages/planet/planet';
import Production from './components/pages/planet/production';
import Shipyard from './components/pages/planet/shipyard';

const routes = [
    { path: '/', component: Overview },
    { path: '/registration', component: Registration },
    { path: '/faction/:id', component: Faction },
    { path: '/map', component: Starmap },
    { path: '/map/systems/:id', component: System },
    { path: '/fleets', component: Fleets },
    { path: '/fleets/:id', component: Fleet },
    { path: '/planet/:id', component: Planet },
    { path: '/planet/:id/production', component: Production },
    { path: '/shipyard', component: Shipyard }
];

Vue.use(VueRouter);

export default new VueRouter({
    routes
});