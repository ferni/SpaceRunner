module("mainlink.js");

test("Item click", function () {
    /*expect(1);
    function()*/
    $(".items #item_weapon").trigger("click");
    equal(ui.chosen.type, "weapon");
});