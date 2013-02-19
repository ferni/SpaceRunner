var ShipSelectScreen = me.ScreenObject.extend({
    name: 'ship-select-screen',
    isReset: false,
    init: function () {
        this.parent();
    },
    onResetEvent: function () {
        this.parent();
        me.video.clearSurface(me.video.getScreenContext(), 'gray');
        html.load('ship-select-screen');
        this.onHtmlLoaded();
        this.isReset = true;
        jsApp.onScreenReset();
    },
    onDestroyEvent: function () {
        this.isReset = false;
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
            this.selectShip = function (shipType) {
                me.state.change(me.state.BUILD, screen.htmlVm.selectedRace() + '_' + shipType);
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
                        'Frigate'
                    ])
            ];
        };
        this.htmlVm = new HtmlViewModel(this);
        ko.applyBindings(this.htmlVm);
    }

});