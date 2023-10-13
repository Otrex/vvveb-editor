
/**
 * Performs an API call to a specified URL and handles success, error, and finally actions.
 *
 * @param {Object} options - An object containing configuration options for the API call.
 * @param {string} options.key - The API endpoint key to fetch data from.
 * @param {function} options.success - A callback function to handle a successful API response.
 * @param {function} options.error - A callback function to handle API errors.
 * @param {function} options.finally - A callback function to execute after the API call, regardless of success or failure.
 * 
 * @example
 * // Example usage:
 * ApiCall({
 *   key: "your-api-key",
 *   success: function(data) {
 *     // Handle successful API response here
 *   },
 *   error: function(error) {
 *     // Handle API error here
 *   },
 *   finally: function() {
 *     // This code will execute regardless of success or error
 *   }
 * });
 */
function ApiCall(options = {}) {
  fetch("https://api.useagencyai.com/api/d/wizards/" + options.key)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      if (options.success && typeof options.success === 'function') {
        options.success(data);
      }
    })
    .catch(function (err) {
      if (options.error && typeof options.error === 'function') {
        options.error(err);
      }
    })
    .finally(function () {
      if (options.finally && typeof options.finally === 'function') {
        options.finally();
      }
    })
}

/**
 * Creates a simple Publish-Subscribe (PubSub) pattern manager.
 *
 * @param {*} state - The initial state value for the PubSub instance.
 *
 * @constructor
 * @example
 * // Example usage:
 * const pubsub = new PubSub("initialState");
 *
 * pubsub.subscribe((newState) => {
 *   // Handle state changes here
 *   console.log("State changed to:", newState);
 * });
 *
 * pubsub.setState("newState");
 */
function PubSub(state = null) {
  let $state = state;
  const subscribers = [];

  /**
   * Get the current state value.
   *
   * @returns {*} - The current state.
   */
  this.getState = function () {
    return $state;
  }

  /**
   * Set the state value and notify subscribers.
   *
   * @param {*} value - The new state value.
   */
  this.setState = function (value) {
    $state = value;
    this.notify(value);
  }

  /**
   * Subscribe a callback function to be notified of state changes.
   *
   * @param {function} cb - The callback function to be invoked on state changes.
   * @param {string} label - An optional label to identify the subscription.
   */
  this.subscribe = function (cb, label) {
    subscribers.push({
      handler: cb,
      label
    });
  }

  /**
   * Notify all subscribers of a state change.
   *
   * @param {*} data - The new state data to pass to subscribers.
   */
  this.notify = function (data) {
    for (var i = 0; i < subscribers.length; i++) {
      subscribers[i].handler.call(this, data);
    }
  }
}

/**
 * A simple utility for managing data in the browser's local storage with optional expiration.
 *
 * @param {string} label - A unique label/key to identify the stored data.
 * @param {number} lifeSpan - The lifespan (in hours) for the stored data. Defaults to 1 hour if not specified.
 *
 * @constructor
 * @example
 * // Example usage:
 * const myLocalStore = new LocalStore("myDataLabel", 2); // Data will expire in 2 hours
 *
 * myLocalStore.set({ key: "value" });
 *
 * const storedData = myLocalStore.get();
 * if (storedData) {
 *   // Use the stored data
 *   console.log("Stored data:", storedData);
 * } else {
 *   // Data has expired or does not exist
 *   console.log("No valid data found.");
 * }
 */
function LocalStore(label, lifeSpan = 1) {
  const storageKey = `--wizard-${label}`;
  const expiresIn = lifeSpan ? new Date(Date.now() + lifeSpan * 3600000).toUTCString() : null;

  /**
   * Sets data in the local storage with an optional expiration time.
   *
   * @param {*} data - The data to be stored.
   */
  this.set = function (data) {
    if (!window.localStorage) return;

    const storedData = {
      value: data,
      expires: expiresIn,
    };

    localStorage.setItem(storageKey, JSON.stringify(storedData));
  };

  /**
   * Retrieves data from local storage if it is still valid (not expired).
   *
   * @returns {*} - The stored data if it is valid; otherwise, returns undefined.
   */
  this.get = function () {
    if (!window.localStorage) return;

    const storedData = JSON.parse(localStorage.getItem(storageKey) || '{}');

    if (expiresIn && new Date(storedData.expires) <= new Date()) {
      localStorage.removeItem(storageKey);
      return;
    }

    return storedData.value;
  };
}

/**
 * Represents a state management utility for storing and updating application state.
 *
 * @param {Object} options - Configuration options for the state manager.
 * @param {string} options.persist - A label/key for storing the state in local storage for persistence (optional).
 *
 * @constructor
 * @example
 * // Example usage:
 * const appState = new State({ persist: 'myAppState' });
 *
 * // Subscribe to state changes
 * appState.update({
 *   agency_wizard: {
 *     id: 123,
 *     services: ['Service 1', 'Service 2'],
 *     leads_image: 'lead-image-url',
 *     website_details: {
 *       logo: 'logo-url',
 *     },
 *     contact: {
 *       address: {
 *         address1: '123 Main St',
 *       },
 *       introduction: {
 *         intro_desc: 'Welcome to our website!',
 *         intro_headline: 'Welcome to our agency!',
 *       },
 *     },
 *   },
 * });
 *
 * // Retrieve stored state (if persisted)
 * const storedState = appState.refresh();
 */
function State(options = {}) {
  const self = this;
  const event = new PubSub();

  function splitArrayInTwo(arr) {
    if (!arr) return [[], []]
    const midIndex = arr.length / 2;
    const firstHalf = arr.slice(0, midIndex);
    const secondHalf = arr.slice(midIndex);
    return [firstHalf, secondHalf];
  }

  // Subscribe to updates and update internal state properties accordingly
  event.subscribe(function (__data) {
    const [
      benefit_2,
      benefit_1,
    ] = splitArrayInTwo(
      __data?.agency_wizard?.service_benefits
    );

    self.isReady = true;

    self.service_benefits_1 = benefit_1;
    self.service_benefits_2 = benefit_2;

    self.$id = __data?.agency_wizard?.id;

    self.seo_title = __data?.agency_wizard?.seo?.title;
    self.seo_image = __data?.agency_wizard?.seo?.image;
    
    self.leads_image = __data?.agency_wizard?.leads_image;
    self.logo = __data?.agency_wizard?.website_details?.logo;
    self.email = __data?.agency_wizard?.contact?.address?.email || "info@agency.com";

    self.address1 = __data?.agency_wizard?.contact?.address?.address1 || "48180, Eureka Rd, Taylor, Michigan, USA";
    self.phone_number = __data?.agency_wizard?.contact?.address?.phone_number || "(734) 287-6619";
    self.businessName = __data?.agency_wizard?.contact?.address?.businessName;
    self.country = __data?.agency_wizard?.contact?.address?.country;
    self.city = __data?.agency_wizard?.contact?.address?.city;
    self.state = __data?.agency_wizard?.contact?.address?.state;

    self.twitter = __data?.agency_wizard?.contact?.socials?.youtube;
    self.linkedin = __data?.agency_wizard?.contact?.socials?.linkedin;
    self.facebook = __data?.agency_wizard?.contact?.socials?.facebook;
    self.instagram = __data?.agency_wizard?.contact?.socials?.instagram;

    self.intro_desc = __data?.agency_wizard?.contact?.introduction?.intro_desc;
    self.intro_headline = __data?.agency_wizard?.contact?.introduction?.intro_headline;
    self.intro_video_url = __data?.agency_wizard?.contact?.introduction?.intro_video_url

    self.help_image = __data?.agency_wizard?.contact?.help?.help_image;
    self.help_headline = __data?.agency_wizard?.contact?.help?.help_headline;
    self.help_desc = __data?.agency_wizard?.contact?.help?.help_desc;

    self.testimonials = __data?.agency_wizard?.testimonials;
    self.services = __data?.agency_wizard?.services;

    self.about_image = __data?.agency_wizard?.contact?.about?.about_image;
    self.about_desc = __data?.agency_wizard?.contact?.about?.about_desc;
  });

  /**
   * Updates the application state and notifies subscribers.
   *
   * @param {Object} data - The new state data to be applied.
   */
  this.update = function (data) {
    event.notify(data);
  }

  // If persistence is enabled, use local storage for storing and refreshing state
  if (options.persist) {
    const localStore = new LocalStore(options.persist);

    // Subscribe to updates and store in local storage
    event.subscribe(function (params) {
      localStore.set(params);
    });

    /**
     * Refreshes the application state from local storage (if persisted).
     *
     * @returns {Object} - The stored state data or an empty object if not found or expired.
     */
    this.refresh = function () {
      const storedState = localStore.get();
      this.update(storedState);
      return storedState;
    }

    // Automatically refresh the state from local storage on initialization
    this.refresh();
  }
}

/**
 * Provides a collection of commonly used default values and constants.
 *
 * @returns {Object} - An object containing default values.
 * @property {string} PLACEHOLDER_IMAGE - The default URL for a placeholder image.
 * @property {number} TEST_ID - The default identifier for testing purposes.
 *
 * @example
 * // Example usage:
 * const defaultSettings = defaults();
 * console.log("Default Placeholder Image:", defaultSettings.PLACEHOLDER_IMAGE);
 * console.log("Default Test ID:", defaultSettings.TEST_ID);
 */
function defaults() {
  return {
    PLACEHOLDER_IMAGE: "https://placehold.co/600x400?text=Placeholder",
    TEST_ID: 2,
  };
}

function AgencyDataHandler() {
  const $w = window;
  const $d = document;

  const $self = this;
  const $defaults = defaults();
  const $store = new State({
    persist: 'data'
  });

  const $events = {
    'data-mounted': new PubSub(),
    'dom-mounted': new PubSub(),
    'edit-mode': new PubSub(),
  };

  this.$handlers = {};

  this.$ = function () {
    this.createLoader();
    this.setModeHandlers();

    $events['edit-mode'].setState(!!$w.EDIT_MODE);
    $events['dom-mounted'].subscribe(function(){
      $self.showLoader();
      $self.render();
    });
    $events['data-mounted'].subscribe(function() {
      $self.render();
      $self.removeLoader();
    });

    this.getSiteData(function() {
      $events['data-mounted'].notify()
    })

    $w.addEventListener("DOMContentLoaded", function() {
      $events['dom-mounted'].notify()
    })
  }

  this.setModeHandlers = function() {
    $events['edit-mode'].subscribe(function() {
      $self.$handlers = {
        'A': function(el, data) {
          if ($events['edit-mode'].getState()) {
            el.setAttribute('href', defaults().PLACEHOLDER_IMAGE)
          } else {
            el.setAttribute('href', data)
          }
        },
        'LINK': function(el, data) {
          if ($events['edit-mode'].getState()) {
            el.setAttribute('href', defaults().PLACEHOLDER_IMAGE)
          } else {
            el.setAttribute('href', data)
          }
        },
        'IMG': function(el, data) {
          if ($events['edit-mode'].getState()) {
            el.setAttribute('src', defaults().PLACEHOLDER_IMAGE)
          } else {
            el.setAttribute('src', data)
          }
        },
        'IFRAME': function(el, data) {
          if ($events['edit-mode'].getState()) {
            el.setAttribute('src', defaults().PLACEHOLDER_IMAGE)
            el.setAttribute('data-src', defaults().PLACEHOLDER_IMAGE)
          } else {
            el.setAttribute('src', data)
            el.setAttribute('data-src', data)
          }
        },
        '$DEFAULT': function(el, data) {
          if ($events['edit-mode'].getState()) {
            el.innerHTML = "${" + el.getAttribute('data-wizard') + "}"
          } else {
            el.innerHTML = data
          }
        }
      }
    })
  }

  this.createLoader = function() {
    this.loadingScreen = $d.createElement('div');
    this.loadingScreenStyle = $d.createElement('style');
    this.loadingScreenStyle.innerHTML = `
      .loader.wrapper {
        width: 100%;
        height: 100vh;
        top:0;
        position: fixed;
        z-index: 1000000000;
        background-color: white;
      }

      [data-wizard] a[data-wizard-toggle] {
        background: green;
        color: white;
      }
    `;

    this.loadingScreen.setAttribute('class', 'loader wrapper');
    this.loadingScreen.innerHTML = 'Loading...';
  }

  this.showLoader = function() {
    $d.body.appendChild(this.loadingScreenStyle);
    $d.body.appendChild(this.loadingScreen);
  }

  this.removeLoader = function () {
    $d.body.removeChild(this.loadingScreenStyle);
    $d.body.removeChild(this.loadingScreen);
  }

  this.getWizardId = function() {
    if ($w.TEMPLATE_KEY) {
      return +$w.TEMPLATE_KEY
    }
    
    if (location.host.includes('localhost:')) {
      return $defaults.TEST_ID;
    }

    if (location.host.includes('editor.useagencyai')) {
      const [_, use, ...args] = location.pathname.split('/');
      const [__, key] = use.split('-');
      if (['template', 'test'].includes(key)) {
        return $defaults.TEST_ID;
      } else {
        return +key;
      }
    }

    if (location.host.includes('pg.useagencyai')) {
      const subdomain = location.host.split('.').shift();
      const [_, key] = subdomain.split('-');
      return +key;
    }

    return $defaults.TEST_ID;
  }

  this.getSiteData = function (callback) {
    const storeData = $store.refresh();
    const wizardId = $self.getWizardId();

    if (!storeData || storeData.$id !== wizardId) {
      ApiCall({
        key: wizardId,
        finally: callback,
        error: console.error,
        success: $store.update,
      });
    }  
  }

  this.setElementData = function(el, key, store) {
    const $$store = store || $store;
    if (!$$store[key]) return;

    if (this.$handlers[el.nodeName]) {
      this.$handlers[el.nodeName](el, $$store[key])
    } else {
      this.$handlers.$DEFAULT(el, $$store[key])
    }
  }

  this.handleTemplate = function(el, key) {
    if (!$store[key]) return;

    const parent = el.parentNode;
    const child = el.children[0];

    if (!child) return;
    parent.removeChild(el);
    

    for (let i = 0; i < $store[key].length; i++) {
      const clone = child.cloneNode(true);
      const fields = clone.querySelectorAll('[data-field]');

      fields.forEach(function(field) {
        const subKey = field.getAttribute('data-field');
        $self.setElementData(field, subKey, $store[key][i])
      })

      parent.appendChild(clone);
    }
  }

  this.render = function () {
    if ($d.readyState !== 'loading') {
      const elements = $d.querySelectorAll('[data-wizard]');
      const hElements = $d.querySelectorAll('[data-wizard-hide]');

      hElements.forEach(function (el) {
        const key = el.getAttribute('data-wizard-hide');
        if ($store[key] && !$store[key].length) {
          el.setAttribute('hide', true);
        }
      })

      elements.forEach(function(el) {
        const key = el.getAttribute('data-wizard');
        const template = el.getAttribute('data-wizard-schema');

        if (template) {
          $self.handleTemplate(el, key);
        } else {
          $self.setElementData(el, key);
        }
      });
    }
  }

  this.extractDataUsingElement = function (el) {
    const key = el.getAttribute('data-wizard')?.split('.');
    const handler = __fill[key[0]];

    if (key.length < 2) {
      return handler();
    }

    key.shift();
    return handler(...key);
  }

  this.data = function() {
    return $store;
  }

  this.getDataFill = function() {
    return this.$handlers;
  }

  this.getPlaceholderImage = function() {
    return $defaults.PLACEHOLDER_IMAGE
  }

  return this.$();
}

if (!window.agencyDataHandler) {
  window.AgencyDataHandler = AgencyDataHandler;
  window.agencyDataHandler = new AgencyDataHandler();
}
