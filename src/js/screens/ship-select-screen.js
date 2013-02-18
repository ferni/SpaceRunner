var ShipSelectScreen = me.ScreenObject.extend({
    init: function () {
        this.parent();
    },
    onResetEvent: function () {
        this.parent();
        me.video.clearSurface(me.video.getScreenContext(), 'gray');
        html.load('ship-select-screen');
        this.onHtmlLoaded();
    },
    onDestroyEvent: function () {
        html.clear();
    },
    onHtmlLoaded: function () {
        var RaceButtonSet, HtmlViewModel;
        RaceButtonSet = function (name, ships, selected) {
            this.name = name;
            this.ships = ships;
            this.selected = ko.observable(selected);
        };
        HtmlViewModel = function (screen) {
            this.selectedRace = function () {
                var race = _.find(this.races, function (r) {
                    return r.selected();
                });
                if (!race) {
                    console.error('No race is selected');
                }
                return race.name;
            };
            this.selectRace = function (raceButtonSet) {
                _.each(screen.htmlVm.races, function (r) {
                    r.selected(raceButtonSet.name === r.name);
                });
            };
            this.selectShip = function (shipName) {
                me.state.set(me.state.BUILD,
                    new ShipBuildingScreen(screen.htmlVm.selectedRace() + '_' + shipName));
                me.state.change(me.state.BUILD);
            };
            this.races = [
                new RaceButtonSet('Cyborg',
                    [
                        'Frigate',
                        'Cruiser',
                        'Battleship1',
                        'Drone'
                    ], true),
                new RaceButtonSet('Humanoid',
                    [
                        
                    ])
            ];
        };
        this.htmlVm = new HtmlViewModel(this);
        ko.applyBindings(this.htmlVm);
    }

});