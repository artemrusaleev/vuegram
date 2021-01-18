import Vue from "vue";
import Vuex from "vuex";
import * as fb from "../../firebase";
import router from "../router/index";
import createPersistedState from "vuex-persistedstate";
import SecureLS from "secure-ls";
const ls = new SecureLS({ isCompression: false });
Vue.use(Vuex);

// realtime firebase
fb.storiesCollection.onSnapshot(snapshot => {
  let storiesArray = [];
  snapshot.forEach(doc => {
    let stories = doc.data();
    stories.id = doc.id;
    storiesArray.push(stories);
  });
  storiesArray.sort((a, b) => {
    return a.createdOn - b.createdOn;
  });
  store.commit("SETSTORIES", storiesArray);
});
fb.postsCollection.orderBy("createdOn", "desc").onSnapshot(snapshot => {
  let postsArray = [];

  snapshot.forEach(doc => {
    let post = doc.data();
    post.id = doc.id;
    postsArray.push(post);
  });

  store.commit("SETPOSTS", postsArray);
});
fb.likesCollection.onSnapshot(snapshot => {
  let likesArray = [];
  snapshot.forEach(doc => {
    let like = doc.data();
    like.id = doc.id;
    likesArray.push(like);
  });
  store.commit("SETLIKES", likesArray);
});
fb.usersCollection.onSnapshot(snapshot => {
  let usersArray = [];
  snapshot.forEach(doc => {
    let user = doc.data();
    user.id = doc.id;
    usersArray.push(user);
  });

  store.commit("SETUSERS", usersArray);
});
fb.commentsCollection.onSnapshot(snapshot => {
  let commentsArray = [];
  snapshot.forEach(doc => {
    let comment = doc.data();
    comment.id = doc.id;
    commentsArray.push(comment);
  });
  commentsArray.sort((a, b) => {
    return b.createdOn - a.createdOn;
  });
  store.commit("SETCOMMENTS", commentsArray);
});

const store = new Vuex.Store({
  plugins: [
    createPersistedState({
      storage: {
        getItem: key => ls.get(key),
        setItem: (key, value) => ls.set(key, value),
        removeItem: key => ls.remove(key)
      }
    })
  ],
  state: {
    userProfile: {},
    posts: [],
    likes: [],
    users: [],
    usersLiked: [],
    comments: [],
    stories: []
  },
  mutations: {
    SETUSERPROFILE(state, val) {
      state.userProfile = val;
    },
    SETPERFOMINGREQUEST(state, val) {
      state.performingRequest = val;
    },
    SETPOSTS(state, val) {
      state.posts = val;
    },
    SETLIKES(state, val) {
      state.likes = val;
    },
    SETUSERS(state, val) {
      state.users = val;
    },
    REMOVEITEM(state, id) {
      state.posts.filter(item => {
        return item.id != id;
      });
    },
    SETUSERSLIKED(state, val) {
      state.usersLiked = val;
    },
    SETCOMMENTS(state, val) {
      state.comments = val;
    },
    SETSTORIES(state, val) {
      state.stories = val;
    }
  },
  actions: {
    async login({ dispatch }, form) {
      // sign user in
      const { user } = await fb.auth.signInWithEmailAndPassword(
        form.email,
        form.password
      );
      // fetch user profile and set in state
      dispatch("fetchUserProfile", user);
    },
    async signup({ dispatch }, form) {
      // sign user up
      const { user } = await fb.auth.createUserWithEmailAndPassword(
        form.email,
        form.password
      );
      // create user object in userCollections
      await fb.usersCollection.doc(user.uid).set({
        name: form.name,
        title: form.title,
        userId: user.uid,
        posts: 0,
        stories: 0
      });

      // fetch user profile and set in state
      dispatch("fetchUserProfile", user);
    },
    async fetchUserProfile({ commit }, user) {
      // fetch user profile
      const userProfile = await fb.usersCollection.doc(user.uid).get();
      // set user profile in state
      commit("SETUSERPROFILE", userProfile.data());
      // change route to dashboard
      if (router.currentRoute.path === "/login") {
        router.push({
          name: "my_posts",
          params: { name: this.state.userProfile.name }
        });
      }
    },
    async logout({ commit }) {
      // log user out
      await fb.auth.signOut();

      // clear user data from state
      commit("SETUSERPROFILE", {});

      // redirect to login view
      router.push("/login");
    },
    async createPost({ state, commit }, post) {
      // create post in firebase
      await fb.postsCollection.add({
        createdOn: new Date(),
        content: post.content,
        userId: fb.auth.currentUser.uid,
        userName: state.userProfile.name,
        comments: 0,
        likes: 0,
        img: post.img
      });
    },
    async createStorie({ state, commit }, storie) {
      await fb.storiesCollection.add({
        createdOn: new Date(),
        userId: fb.auth.currentUser.uid,
        userName: state.userProfile.name,
        img: storie.img
      });
    },
    async likePost({ commit }, post) {
      const userId = fb.auth.currentUser.uid;
      const docId = `${userId}_${post.id}`;

      // check if user has liked post
      const doc = await fb.likesCollection.doc(docId).get();
      if (doc.exists) {
        return;
      }

      // create post
      await fb.likesCollection.doc(docId).set({
        postId: post.id,
        userId: userId,
        userName: this.state.userProfile.name
      });

      // update post likes count
      fb.postsCollection.doc(post.id).update({
        likes: post.likesCount + 1
      });
      // add user who like post to post.data
    },
    async updatePostsCount({ dispatch }, user) {
      const userId = fb.auth.currentUser.uid;
      const userRef = await fb.usersCollection.doc(userId).update({
        posts: user.posts
      });
      dispatch("fetchUserProfile", { uid: userId });
    },
    async updateStoriesCount({ dispatch }, user) {
      const userId = fb.auth.currentUser.uid;
      const userRef = await fb.usersCollection.doc(userId).update({
        stories: user.stories
      });
      dispatch("fetchUserProfile", { uid: userId });
    },
    async checkUserName({ dispatch }, { name: name }) {
      await fb.usersCollection
        .where("name", "==", name)
        .get()
        .then(snapshot => {
          if (snapshot.empty) {
            return true;
          } else {
            throw new Error("Username is already taken");
          }
        });
    },
    async updateProfile({ dispatch }, user) {
      const userId = fb.auth.currentUser.uid;
      // update user object
      const userRef = await fb.usersCollection.doc(userId).update({
        name: user.name,
        title: user.title,
        avatar: user.avatar
      });

      dispatch("fetchUserProfile", { uid: userId });

      // update all posts by user
      const postDocs = await fb.postsCollection
        .where("userId", "==", userId)
        .get();
      postDocs.forEach(doc => {
        fb.postsCollection.doc(doc.id).update({
          userName: user.name
        });
      });

      // update all comments by user
      const commentDocs = await fb.commentsCollection
        .where("userId", "==", userId)
        .get();
      commentDocs.forEach(doc => {
        fb.commentsCollection.doc(doc.id).update({
          userName: user.name
        });
      });
    },
    async deletePost({ commit }, id) {
      await fb.postsCollection.doc(id).delete();
    },
    async deleteLike({ commit }, id) {
      await fb.likesCollection.doc(id).delete();
    },
    async updatePost({ commit }, { id, content, updateOn }) {
      await fb.postsCollection.doc(id).update({
        content: content,
        updateOn: new Date()
      });
    }
  }
});

export default store;
