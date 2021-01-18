<template>
  <div id="app">
    <transition name="list" mode="out-in">
      <SiteNav :user="userProfile" v-if="showNav"></SiteNav>
    </transition>
    <transition name="list">
      <SiteFooter v-if="showNav"></SiteFooter>
    </transition>
    <transition name="list" mode="out-in">
      <router-view />
    </transition>
  </div>
</template>

<script>
import { mapState } from "vuex";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
export default {
  components: {
    SiteNav,
    SiteFooter
  },
  computed: {
    ...mapState(["userProfile"]),
    showNav() {
      return Object.keys(this.userProfile).length > 1;
    }
  }
};
</script>
<style scoped></style>
