<template>
    <div>
        <PlanetsList v-if="system" :system="system" />
        <PlanetsGraph v-if="system" :system="system" />
    </div>
</template>

<script>
import PlanetsList from '~/components/organisms/map/planets-list';
import PlanetsGraph from '~/components/organisms/map/planets-graph';

export default {
    name: 'page-system',
    
    data() {
        return {
            system: null
        };
    },

    components: {
        PlanetsList,
        PlanetsGraph
    },

    async mounted() {
        this.system = await this.$repositories.map.getSystem(this.$route.params.id);
    },

    async beforeRouteUpdate(to, from, next) {
        this.system = await this.$repositories.map.getSystem(to.params.id);

        next();
    }
}
</script>

<style lang="less" scoped>
    #planets-list {
        grid-column: ~"2/6";
        grid-row: ~"2/9";
        overflow-y: scroll;
    }

    #planets-graph {
        position: relative;
        grid-column: ~"6/10";
        grid-row: ~"3/9";
    }

    @media (max-width: 1400px) {
        #planets-list {
            grid-column: ~"3/9";
        }

        #planets-graph {
            display: none;
        }
    }
</style>
