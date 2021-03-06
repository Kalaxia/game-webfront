<template>
    <div class="fleet-cargo-manager">
        <template v-if="!passenger">
            <header>
                <h5>Transférer des ressources</h5>
            </header>
            <section class="resources">
                <template v-for="(q, r) in exchangeableResources">
                    <div v-if="r != 'passengers'"
                        :key="r"
                        @click="resource = r; $emit('expandResourceForm', true)"
                        :style="{ backgroundColor: factionColors['black'], borderColor: factionColors[(resource === r) ? 'white' : 'grey'] }">
                        <resource-item :resource="{ name: r }" />
                    </div>
                </template>
            </section>
        </template>
        <template v-if="!resource">
            <header>
                <h5>Transférer des passagers</h5>
            </header>
            <section class="passengers">
                <div :style="{ backgroundColor: factionColors['black'], borderColor: factionColors[(passenger) ? 'white' : 'grey'] }" @click="passenger = true; $emit('expandResourceForm', true)">
                    <colored-picto src="G_P_Char_BK_64px.png" :color="factionColors['grey']" :width="36" :height="36" />
                </div>
            </section>
        </template>
        <section class="transfer" v-if="resource">
            <p>Stock planète: {{ storedResource(resource) }}/{{ currentPlanet.storage.capacity }}</p>
            <p>Stock soutes: {{ loadedResource }}/{{ availableCargo + loadedResource }}</p>
            <div class="transfer-input">
                <div :style="{ backgroundColor: factionColors['black'], borderColor: factionColors['grey'] }">
                    <colored-picto v-if="planetToFleet" @click.native="planetToFleet = false" src="ships/Fleet.svg" :width="28" :height="28" :color="factionColors['white']" />
                    <colored-picto v-else @click.native="planetToFleet = true" src="G_P_Pl_64px.png" :width="28" :height="28" :color="factionColors['white']" />
                </div>
                <input class="input" v-model="quantity" type="number" min="1" :max="(planetToFleet === true) ? availableCargo : availableStorage" :style="{ borderColor: resourceColor, color: resourceColor }" @change="checkQuantity()" />
            </div>
            <div>
                <p><em>{{ $t(`fleet.delivery.send_to_${planetToFleet ? 'fleet' : 'planet'}`) }}</em></p>
            </div>
        </section>
        <section class="passenger-transfer" v-if="passenger">
            <p>Population: {{ Math.ceil(currentPlanet.population / 1000) }}</p>
            <p>Passagers: {{ loadedResource }}/{{ availableCargo + loadedResource }}</p>
            <div class="transfer-input">
                <div :style="{ backgroundColor: factionColors['black'], borderColor: factionColors['grey'] }">
                    <colored-picto v-if="planetToFleet" @click.native="planetToFleet = false" src="ships/Fleet.svg" :width="28" :height="28" :color="factionColors['white']" />
                    <colored-picto v-else @click.native="planetToFleet = true" src="G_P_Pl_64px.png" :width="28" :height="28" :color="factionColors['white']" />
                </div>
                <input class="input" v-model="quantity" type="number" min="1" :max="(planetToFleet === true) ? availableCargo : availableStorage" :style="{ borderColor: factionColors['main'], color: factionColors['main'] }" @change="checkQuantity()" />
            </div>
            <div>
                <p><em>{{ $t(`fleet.delivery.send_to_${planetToFleet ? 'fleet' : 'planet'}`) }}</em></p>
            </div>
        </section>
        <footer v-if="resource || passenger">
            <button class="button" @click="send()" :style="{ color: factionColors['main'] }">Envoyer</button>
            <button class="button" @click="resource = null; passenger = false; $emit('expandResourceForm', false)" :style="{ color: factionColors['white'] }">Annuler</button>
        </footer>
    </div>
</template>

<script>
import ColoredPicto from '~/components/atoms/colored-picto';
import ResourceItem from '~/components/atoms/resource/item';
import { mapState, mapGetters } from 'vuex';

export default {
    name: 'fleet-cargo-manager',

    props: ['fleet', 'cargo'],

    components: {
        ColoredPicto,
        ResourceItem
    },

    data() {
        return {
            passenger: false,
            resource: null,
            planetToFleet: true,
            quantity: 1,
        };
    },

    computed: {
        ...mapState('user', ['currentPlanet']),

        ...mapGetters({
            factionColors: 'user/factionColors',
            storedResource: 'user/getStoredResource',
            storedResources: 'user/storedResources',
        }),

        resourceColor() {
            return this.$resources.resources[this.resource].color;
        },

        exchangeableResources() {
            return { ...this.storedResources, ...this.cargo };
        },

        currentResource() {
            return (this.passenger) ? 'passengers' : this.resource;
        },

        loadedResource() {
            return (typeof this.cargo[this.currentResource] !== 'undefined') ? this.cargo[this.currentResource] : 0;
        },

        availableStorage() {
            return this.currentPlanet.storage.capacity - this.currentPlanet.storage.resources[this.currentResource];
        },

        availableCargo() {
            return this.cargoCapacity - this.cargoLoad;
        },

        cargoLoad() {
            return Object.values(this.cargo).reduce((acc, q) => acc + q, 0);
        },

        cargoCapacity() {
            return this.fleet.squadrons.reduce(
                (acc, s) => (typeof s.shipModel.stats['size'] !== 'undefined') ? acc + (s.shipModel.stats['size'] * s.quantity) : acc
            , 0);
        },
    },

    methods: {
        checkQuantity() {
            if (this.planetToFleet && this.quantity > this.availableCargo) {
                this.quantity = this.availableCargo;
            } else if(!this.planetToFleet && this.quantity > this.availableStorage) {
                this.quantity = this.availableStorage;
            }
        },

        send() {
            this.checkQuantity();

            if (this.quantity === 0) {
                return;
            }

            this.$emit('sendResources', {
                quantity: parseInt(this.quantity),
                resource: this.currentResource,
                planetToFleet: this.planetToFleet,
            });
        }
    }
}
</script>

<style lang="less">
@import '~less/atoms/button.less';
@import '~less/atoms/input.less';

.fleet-cargo-manager {
    & > .resources {
        display: flex;
        flex-wrap: wrap;

        & > div {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 15px;
            border: 2px solid;
            border-radius: 10px;
            margin: 10px;

            & > .resource-item {
                width: 36px;
                height: 36px;
            }
        }
    }

    & > .passengers {
        display: flex;

        & > div {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 15px;
            border: 2px solid;
            border-radius: 10px;
            margin: 10px;
        }
    }

    & > .passenger-transfer {
        width: 100%;
        & > .transfer-input {
            display: flex;
            align-items: stretch;

            & > div {
                border: 2px solid;
                border-radius: 5px;
                padding: 5px;
                margin-right: 2px;
            }

            & > .input {
                font-size: 1.2em;
            }
        }
    }

    & > .transfer {
        & > .transfer-input {
            display: flex;
            align-items: stretch;

            & > div {
                border: 2px solid;
                border-radius: 5px;
                padding: 5px;
                margin-right: 2px;
            }

            & > .input {
                font-size: 1.2em;
            }
        }
    }

    & > footer {
        display: flex;
        justify-content: center;
        margin-top: 10px;
    }
}
</style>