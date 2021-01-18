import Vue from "vue";
import VueRouter from "vue-router";
import Dashboard from "../views/Dashboard.vue";
import { auth } from "../../firebase";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Dashboard",
    component: Dashboard,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/login",
    name: "Login",
    component: () =>
      import(/* webpackChunkName: "login" */ "../views/Login.vue")
  },
  {
    path: "/accounts/settings",
    name: "settings",
    component: () =>
      import(/* webpackChunkName: "settings" */ "../views/Settings.vue"),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/:name/",
    name: "my_posts",
    component: () =>
      import(/* webpackChunkName: "settings" */ "../views/UserPosts.vue"),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/profile/:name",
    name: "profile",
    component: () =>
      import(/* webpackChunkName: "settings" */ "../views/UserProfile.vue"),
    props: true,
    meta: {
      requiresAuth: true
    }
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

// navigation guard to check for logged in users
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(x => x.meta.requiresAuth);

  if (requiresAuth && !auth.currentUser) {
    next("/login");
  } else {
    next();
  }
});

export default router;
