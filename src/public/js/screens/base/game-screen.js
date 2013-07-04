
 /*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */

 /**
  * Parent of all the other screens.
  * Example implementation:
  *
    screens.register('example', GameScreen.extend({
      init: function(name) {
          'use strict';
          this.parent(name);
      },
      onReset: function() {
          'use strict';
          //reset here
      },
      onDestroy: function() {
          'use strict';
          //remove bindings here
      },
      onHtmlLoaded: function() {
          'use strict';
          //Modify html and make html bindings here
      }
  }));
  * @type {*}
  */
 var GameScreen = me.ScreenObject.extend({
     init: function(name) {
         'use strict';
         if(!name) {
             throw 'The screen should have a name. If overriding init,' +
                 ' call this.parent(<name>)';
         }
         this.isReset = false;
         this.parent(true);
         this.name = name;
     },

     /**
      * This function should not be overridden,
      * implement onReset instead.
      */
     onResetEvent: function(settings) {
         'use strict';
         this.parent(true);
         me.video.clearSurface(me.video.getScreenContext(), 'gray');

         html.load(this.name);
         //TODO: change html.load name to convey that it's synchronous
         this.onHtmlLoaded();

         this.onReset(settings);

         this.isReset = true;
         jsApp.onScreenReset();
     },
     onReset: function(settings){
         'use strict';
     },
     /**
      * This function should not be overridden,
      * implement onDestroy instead.
      */
     onDestroyEvent: function() {
         'use strict';
         this.onDestroy();
         this.isReset = false;
         html.clear();
     },
     onDestroy: function(){
         'use strict';
     },
     /**
      * For modifying html and making bindings
      */
     onHtmlLoaded: function() {
         'use strict';
     }
 });