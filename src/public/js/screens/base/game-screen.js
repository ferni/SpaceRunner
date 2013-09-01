/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, jsApp, screens, $*/

 /**
  * Parent of all the other screens-html.
  * Example implementation:
  *
    screens-html.register('example', GameScreen.extend({
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
         if (!name) {
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

         this.displayHtml();
         this.onHtmlLoaded();

         this.onReset(settings);

         this.isReset = true;
         jsApp.onScreenReset();
     },
     onReset: function(settings) {
         'use strict';
         //abstract
         return settings;
     },
     /**
      * This function should not be overridden,
      * implement onDestroy instead.
      */
     onDestroyEvent: function() {
         'use strict';
         this.onDestroy();
         this.isReset = false;
         this.clearHtml();
     },
     onDestroy: function() {
         'use strict';
         //abstract
         return 0;
     },
     displayHtml: function() {
         'use strict';
         if (!screens.storedHtmls[this.name]) {
             throw 'Could not find preloaded html for ' + this.name;
         }
         $('#screensUi').html(screens.storedHtmls[this.name]);
     },
     clearHtml: function() {
         'use strict';
         $('#screensUi').html('');
     },
     /**
      * For modifying html and making bindings
      */
     onHtmlLoaded: function() {
         'use strict';
         //abstract
         return 0;
     }
 });
