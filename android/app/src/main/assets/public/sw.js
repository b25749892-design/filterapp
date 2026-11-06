/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "6c081873b1f814ec2c2354e2d8d26003"
  }, {
    "url": "pwa-512x512.png",
    "revision": "a4107c300a08731dff42a2fd1f5c11bd"
  }, {
    "url": "pwa-192x192.png",
    "revision": "1b753ac05f29e8f3e9acfacc6ad3bcac"
  }, {
    "url": "index.html",
    "revision": "18422da7eafbaded208eb41dfe9b2ac9"
  }, {
    "url": "icon.svg",
    "revision": "0f2d024d4aedb39b84681c1ea50f71d9"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "0cca0c782a04cb358cc8c11851b9d6b6"
  }, {
    "url": "assets/index-TAG-l6pw.css",
    "revision": null
  }, {
    "url": "assets/index-32JNk9dY.js",
    "revision": null
  }, {
    "url": "assets/aistudio/index_d4024412.html",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "0cca0c782a04cb358cc8c11851b9d6b6"
  }, {
    "url": "icon.svg",
    "revision": "0f2d024d4aedb39b84681c1ea50f71d9"
  }, {
    "url": "pwa-192x192.png",
    "revision": "1b753ac05f29e8f3e9acfacc6ad3bcac"
  }, {
    "url": "pwa-512x512.png",
    "revision": "a4107c300a08731dff42a2fd1f5c11bd"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "6c081873b1f814ec2c2354e2d8d26003"
  }, {
    "url": "manifest.webmanifest",
    "revision": "fba61d9c5b9af41f163cf4d2e4d09d19"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
