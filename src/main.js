import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { auth } from "../firebase";
import "./assets/scss/app.scss";
import VTooltip from "v-tooltip";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";

library.add(fas, fab, far);

Vue.component("v-fas", FontAwesomeIcon);
Vue.use(VTooltip);
Vue.config.productionTip = false;
let app;
auth.onAuthStateChanged(user => {
  if (!app) {
    app = new Vue({
      router,
      store,
      render: h => h(App)
    }).$mount("#app");
  }

  if (user) {
    store.dispatch("fetchUserProfile", user);
  }
});
